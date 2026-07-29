import { useCallback, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTrailReports } from './useTrailReports';
import { NEW_PARK_DAYS } from './useParksMeta';
import { isReportFresh } from '../lib/text';
import { supabase, Trail, TrailReportWithDetails } from '../lib/supabase';

const STORAGE_KEY = 'trillo:notifications:lastSeenAt';

export type ReportNotification = {
  kind: 'report';
  id: string;
  created_at: string;
  report: TrailReportWithDetails;
};

export type TrailNotification = {
  kind: 'trail';
  id: string;
  created_at: string;
  trail: Pick<Trail, 'id' | 'name' | 'location' | 'created_at'>;
};

export type AppNotification = ReportNotification | TrailNotification;

function readLastSeenAt(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function daysAgoIso(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

function useRecentNewTrails(limit: number) {
  return useQuery({
    queryKey: ['notifications', 'new-trails', NEW_PARK_DAYS, limit],
    queryFn: async () => {
      const since = daysAgoIso(NEW_PARK_DAYS);
      const [trailsRes, parksRes] = await Promise.all([
        supabase
          .from('trails')
          .select('id, name, location, created_at')
          .gte('created_at', since)
          .order('created_at', { ascending: false })
          .limit(limit * 2),
        supabase.from('parks').select('name, is_hidden'),
      ]);
      if (trailsRes.error) throw trailsRes.error;
      if (parksRes.error) throw parksRes.error;

      const hidden = new Set(
        (parksRes.data ?? [])
          .filter((p) => (p as { is_hidden: boolean }).is_hidden)
          .map((p) => (p as { name: string }).name)
      );

      return ((trailsRes.data ?? []) as Pick<Trail, 'id' | 'name' | 'location' | 'created_at'>[])
        .filter((t) => !t.location || !hidden.has(t.location))
        .slice(0, limit);
    },
  });
}

export function useReportNotifications(limit = 5) {
  const { data: reports, isLoading: reportsLoading } = useTrailReports(30);
  const { data: newTrails, isLoading: trailsLoading } = useRecentNewTrails(limit);
  const [lastSeenAt, setLastSeenAt] = useState<string | null>(() => readLastSeenAt());

  const recent = useMemo(() => {
    const reportItems: AppNotification[] = (reports || [])
      .filter((r) => isReportFresh(r.created_at, r.conditions))
      .map((report) => ({
        kind: 'report' as const,
        id: `report:${report.id}`,
        created_at: report.created_at,
        report,
      }));

    const trailItems: AppNotification[] = (newTrails || []).map((trail) => ({
      kind: 'trail' as const,
      id: `trail:${trail.id}`,
      created_at: trail.created_at,
      trail,
    }));

    return [...reportItems, ...trailItems]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, limit);
  }, [reports, newTrails, limit]);

  const unreadCount = useMemo(() => {
    if (!lastSeenAt) return recent.length;
    const seenMs = new Date(lastSeenAt).getTime();
    if (Number.isNaN(seenMs)) return recent.length;
    return recent.filter((n) => new Date(n.created_at).getTime() > seenMs).length;
  }, [recent, lastSeenAt]);

  const markSeen = useCallback(() => {
    const newest = recent[0]?.created_at ?? new Date().toISOString();
    try {
      localStorage.setItem(STORAGE_KEY, newest);
    } catch {
      /* ignore */
    }
    setLastSeenAt(newest);
  }, [recent]);

  return {
    recent,
    unreadCount,
    isLoading: reportsLoading || trailsLoading,
    markSeen,
  };
}
