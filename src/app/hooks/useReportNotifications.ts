import { useCallback, useMemo, useState } from 'react';
import { useTrailReports } from './useTrailReports';
import { isReportFresh } from '../lib/text';

const STORAGE_KEY = 'trillo:notifications:lastSeenAt';

function readLastSeenAt(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function useReportNotifications(limit = 5) {
  const { data: reports, isLoading } = useTrailReports(30);
  const [lastSeenAt, setLastSeenAt] = useState<string | null>(() => readLastSeenAt());

  const recent = useMemo(() => {
    return (reports || [])
      .filter((r) => isReportFresh(r.created_at, r.conditions))
      .slice(0, limit);
  }, [reports, limit]);

  const unreadCount = useMemo(() => {
    if (!lastSeenAt) return recent.length;
    const seenMs = new Date(lastSeenAt).getTime();
    if (Number.isNaN(seenMs)) return recent.length;
    return recent.filter((r) => new Date(r.created_at).getTime() > seenMs).length;
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

  return { recent, unreadCount, isLoading, markSeen };
}
