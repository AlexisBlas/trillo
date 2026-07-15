import { useMemo } from 'react';
import { useTrailReports } from './useTrailReports';
import { isReportFresh } from '../lib/text';

export type ParkReportSummary = {
  status: 'green' | 'yellow' | 'red';
  notes: string | null;
  conditions: string[] | null;
  createdAt: string;
};

/**
 * Aggregates trail reports by park (using each trail's `location`) and returns
 * the most recent report seen at each park.
 */
export function useParkReports() {
  const query = useTrailReports(200);

  const byPark = useMemo(() => {
    const map = new Map<string, ParkReportSummary>();
    for (const report of query.data || []) {
      const park = report.park_name ?? report.trails?.location;
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

  return { ...query, byPark };
}
