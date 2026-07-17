import { useMemo } from 'react';
import { useTrailReports } from './useTrailReports';
import { isReportFresh, isValidTrailId } from '../lib/text';
import { mergeCriticalHazards, type CriticalHazard } from '../lib/hazards';

export type ParkReportSummary = {
  status: 'green' | 'yellow' | 'red';
  notes: string | null;
  conditions: string[] | null;
  createdAt: string;
};

/**
 * Park-overview status only — reports with `park_name` and no `trail_id`.
 * Trail reports never roll up into park status (and vice versa).
 */
export function useParkReports() {
  const query = useTrailReports(200);

  const byPark = useMemo(() => {
    const map = new Map<string, ParkReportSummary>();
    for (const report of query.data || []) {
      // Park-level reports only (exclude anything tied to a trail)
      if (isValidTrailId(report.trail_id)) continue;
      const park = report.park_name?.trim();
      if (!park) continue;
      if (!isReportFresh(report.created_at, report.conditions)) continue;
      const existing = map.get(park);
      if (!existing || new Date(report.created_at) > new Date(existing.createdAt)) {
        map.set(park, {
          status: report.status,
          notes: report.notes,
          conditions: report.conditions,
          createdAt: report.created_at,
        });
      }
    }
    return map;
  }, [query.data]);

  /** Critical hazards from park overview + latest fresh trail reports in that park. */
  const hazardsByPark = useMemo(() => {
    const map = new Map<string, CriticalHazard[]>();
    const conditionLists = new Map<string, Array<string[] | null | undefined>>();

    const push = (park: string, conditions: string[] | null | undefined) => {
      const list = conditionLists.get(park) ?? [];
      list.push(conditions);
      conditionLists.set(park, list);
    };

    for (const [park, summary] of byPark) {
      push(park, summary.conditions);
    }

    for (const report of query.data || []) {
      if (!isReportFresh(report.created_at, report.conditions)) continue;
      if (isValidTrailId(report.trail_id)) {
        const park = report.trails?.location?.trim();
        if (park) push(park, report.conditions);
      }
    }

    for (const [park, lists] of conditionLists) {
      const hazards = mergeCriticalHazards(...lists);
      if (hazards.length > 0) map.set(park, hazards);
    }
    return map;
  }, [query.data, byPark]);

  return { ...query, byPark, hazardsByPark };
}
