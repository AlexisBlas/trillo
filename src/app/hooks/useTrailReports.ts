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

      // Fetch user emails separately
      if (data && data.length > 0) {
        const userIds = [...new Set(data.map(r => r.user_id))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, email')
          .in('id', userIds);

        const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

        return data.map(report => ({
          ...report,
          profiles: profileMap.get(report.user_id) || { id: report.user_id, email: null },
        })) as TrailReportWithDetails[];
      }

      return data as TrailReportWithDetails[];
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

      // Fetch user emails separately
      if (data && data.length > 0) {
        const userIds = [...new Set(data.map(r => r.user_id))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, email')
          .in('id', userIds);

        const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

        return data.map(report => ({
          ...report,
          profiles: profileMap.get(report.user_id) || { id: report.user_id, email: null },
        }));
      }

      return data;
    },
    enabled: !!trailId,
  });
}

export function useUserReports(userId: string | undefined) {
  return useQuery({
    queryKey: ['trail-reports', 'user', userId],
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

      // Fetch trail details separately
      const trailIds = [...new Set(reports.map(r => r.trail_id))];
      const { data: trails, error: trailsError } = await supabase
        .from('trails')
        .select('*')
        .in('id', trailIds);

      if (trailsError) {
        console.error('Error fetching trails:', trailsError);
        // Return reports without trail details if fetch fails
        return reports;
      }

      const trailMap = new Map(trails?.map(t => [t.id, t]) || []);

      return reports.map(report => ({
        ...report,
        trails: trailMap.get(report.trail_id) || { id: report.trail_id, name: 'Unknown Trail' },
      }));
    },
    enabled: !!userId,
  });
}
