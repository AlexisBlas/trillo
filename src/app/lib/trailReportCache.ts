import type { QueryClient } from '@tanstack/react-query';
import type { TrailReportWithDetails } from './supabase';

/** Prepend a just-submitted report, then refetch every trail-reports query. */
export async function refreshTrailReports(
  queryClient: QueryClient,
  optimistic?: TrailReportWithDetails | null
) {
  if (optimistic) {
    queryClient.setQueriesData<TrailReportWithDetails[]>(
      { queryKey: ['trail-reports'] },
      (old) => {
        if (!Array.isArray(old)) return old;
        // Avoid duplicating if a refetch already landed.
        if (old.some((r) => r.id === optimistic.id)) return old;
        return [optimistic, ...old];
      }
    );
  }

  await queryClient.invalidateQueries({
    queryKey: ['trail-reports'],
    refetchType: 'all',
  });
}
