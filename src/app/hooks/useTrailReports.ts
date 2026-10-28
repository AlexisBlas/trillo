import { useQuery } from '@tanstack/react-query';
import { supabase, TrailReportWithDetails } from '../lib/supabase';

export function useTrailReports(limit = 50) {
  return useQuery({
    queryKey: ['trail-reports', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('trail_reports')
        .select(`
          *,
          trails (*)
        `)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching trail reports:', error);
        throw error;
      }

      // Do not join profiles/email — public pages must never fetch emails.
      return (data ?? []).map((report) => ({
        ...report,
        profiles: report.user_id
          ? { id: report.user_id }
          : null,
      })) as TrailReportWithDetails[];
    },
  });
}

export function useTrailReportsByTrail(trailId: string) {
  return useQuery({
    queryKey: ['trail-reports', 'trail', trailId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('trail_reports')
        .select('*')
        .eq('trail_id', trailId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching trail reports by trail:', error);
        throw error;
      }

      return (data ?? []).map((report) => ({
        ...report,
        profiles: report.user_id ? { id: report.user_id } : null,
      })) as TrailReportWithDetails[];
    },
    enabled: !!trailId && trailId !== 'null' && trailId !== 'undefined',
  });
}

export function useUserReports(userId: string | undefined) {
  return useQuery({
    queryKey: ['trail-reports', 'user', userId, 'v2'],
    queryFn: async () => {
      if (!userId) return [];

      const { data: reports, error: reportsError } = await supabase
        .from('trail_reports')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (reportsError) {
        console.error('Error fetching user reports:', reportsError);
        throw reportsError;
      }

      if (!reports || reports.length === 0) return [];

      // Fetch trail details separately (skip null trail_ids from park reports)
      const trailIds = [...new Set(reports.map(r => r.trail_id).filter((id): id is string => !!id))];
      const trailMap = new Map<string, { id: string; name: string }>();

      if (trailIds.length > 0) {
        const { data: trails, error: trailsError } = await supabase
          .from('trails')
          .select('*')
          .in('id', trailIds);

        if (trailsError) {
          console.error('Error fetching trails:', trailsError);
        } else {
          for (const t of trails ?? []) trailMap.set(t.id, t);
        }
      }

      return reports.map(report => ({
        ...report,
        trails: report.trail_id
          ? trailMap.get(report.trail_id) || { id: report.trail_id, name: 'Unknown Trail' }
          : { id: '', name: report.park_name || 'Park report' },
      }));
    },
    enabled: !!userId,
  });
}
