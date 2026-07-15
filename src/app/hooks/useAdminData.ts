import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, Profile, Trail } from '../lib/supabase';

// ─── Reports ──────────────────────────────────────────────────────────────────

export interface AdminReport {
  id: string;
  trail_id: string;
  user_id: string | null;
  status: 'green' | 'yellow' | 'red';
  conditions: string[] | null;
  notes: string | null;
  created_at: string;
  trail_name: string;
  trail_location: string | null;
  user_email: string | null;
}

export function useAdminReports() {
  return useQuery({
    queryKey: ['admin-reports'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('trail_reports')
        .select('*, trails(name, location), profiles(email)')
        .order('created_at', { ascending: false })
        .limit(500);
      if (error) throw error;
      return (data ?? []).map((r: any) => ({
        id: r.id,
        trail_id: r.trail_id,
        user_id: r.user_id,
        status: r.status,
        conditions: r.conditions,
        notes: r.notes,
        created_at: r.created_at,
        trail_name: r.trails?.name ?? '—',
        trail_location: r.trails?.location ?? null,
        user_email: r.profiles?.email ?? null,
      })) as AdminReport[];
    },
  });
}

export function useUpdateReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: { status?: string; conditions?: string[] | null; notes?: string | null; trail_id?: string };
    }) => {
      const { error } = await supabase.from('trail_reports').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-reports'] });
      qc.invalidateQueries({ queryKey: ['trail-reports'] });
    },
  });
}

export function useDeleteReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('trail_reports').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-reports'] });
      qc.invalidateQueries({ queryKey: ['trail-reports'] });
      qc.invalidateQueries({ queryKey: ['admin-stats'] });
    },
  });
}

// ─── Stats ────────────────────────────────────────────────────────────────────

export function useAdminStats() {
  return useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const [trails, reports, profiles] = await Promise.all([
        supabase.from('trails').select('id, location', { count: 'exact' }),
        supabase.from('trail_reports').select('id, created_at', { count: 'exact' }),
        supabase.from('profiles').select('id', { count: 'exact' }),
      ]);

      const trailRows = trails.data ?? [];
      const reportRows = reports.data ?? [];

      const parks = new Set(trailRows.map((t) => t.location).filter(Boolean)).size;

      const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
      const activeReports = reportRows.filter((r) => r.created_at > threeDaysAgo).length;

      return {
        trails: trails.count ?? 0,
        parks,
        reports: reports.count ?? 0,
        activeReports,
        users: profiles.count ?? 0,
      };
    },
  });
}

// ─── Users ────────────────────────────────────────────────────────────────────

export interface AdminUser extends Profile {
  report_count: number;
}

export function useAdminUsers() {
  return useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch report counts per user
      const { data: counts } = await supabase
        .from('trail_reports')
        .select('user_id');

      const countMap = new Map<string, number>();
      for (const row of counts ?? []) {
        countMap.set(row.user_id, (countMap.get(row.user_id) ?? 0) + 1);
      }

      return (profiles ?? []).map((p) => ({
        ...p,
        report_count: countMap.get(p.id) ?? 0,
      })) as AdminUser[];
    },
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<Pick<Profile, 'is_admin' | 'is_banned'>>;
    }) => {
      const { error } = await supabase.from('profiles').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-users'] });
      qc.invalidateQueries({ queryKey: ['admin-stats'] });
    },
  });
}

// ─── Trails ───────────────────────────────────────────────────────────────────

export function useAdminTrails() {
  return useQuery({
    queryKey: ['admin-trails'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('trails')
        .select('*')
        .order('location', { ascending: true })
        .order('name', { ascending: true });
      if (error) throw error;
      return (data ?? []) as Trail[];
    },
  });
}

export function useCreateTrail() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (trail: Omit<Trail, 'id' | 'created_at' | 'updated_at'>) => {
      const { error } = await supabase.from('trails').insert(trail);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-trails'] });
      qc.invalidateQueries({ queryKey: ['trails'] });
      qc.invalidateQueries({ queryKey: ['admin-stats'] });
    },
  });
}

export function useUpdateTrail() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<Omit<Trail, 'id' | 'created_at' | 'updated_at'>>;
    }) => {
      const { error } = await supabase.from('trails').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-trails'] });
      qc.invalidateQueries({ queryKey: ['trails'] });
    },
  });
}

export function useDeleteTrail() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('trails').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-trails'] });
      qc.invalidateQueries({ queryKey: ['trails'] });
      qc.invalidateQueries({ queryKey: ['admin-stats'] });
    },
  });
}

// ─── Parks (derived from trail locations) ─────────────────────────────────────

export interface AdminPark {
  name: string;
  description: string | null;
  city: string | null;
  trailCount: number;
  trails: Trail[];
  isHidden: boolean;
}

export function useAdminParks() {
  return useQuery({
    queryKey: ['admin-parks'],
    queryFn: async () => {
      const [trailsRes, parksRes] = await Promise.all([
        supabase.from('trails').select('*').order('location', { ascending: true }),
        supabase.from('parks').select('name, is_hidden, description, city'),
      ]);
      if (trailsRes.error) throw trailsRes.error;

      const parkMeta = new Map(
        (parksRes.data ?? []).map((p) => [p.name, { isHidden: p.is_hidden, description: p.description ?? null, city: p.city ?? null }])
      );

      const map = new Map<string, Trail[]>();
      for (const t of trailsRes.data ?? []) {
        const loc = t.location || 'Uncategorized';
        if (!map.has(loc)) map.set(loc, []);
        map.get(loc)!.push(t);
      }

      return Array.from(map.entries()).map(([name, trails]) => ({
        name,
        description: parkMeta.get(name)?.description ?? null,
        city: parkMeta.get(name)?.city ?? null,
        trailCount: trails.length,
        trails,
        isHidden: parkMeta.get(name)?.isHidden ?? false,
      })) as AdminPark[];
    },
  });
}

export function useCreatePark() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      name,
      description,
      city,
      trails,
    }: {
      name: string;
      description: string | null;
      city: string | null;
      trails: Array<{ name: string; description: string | null; difficulty: string | null }>;
    }) => {
      const { error: parkError } = await supabase
        .from('parks')
        .upsert({ name, description, city, is_hidden: false }, { onConflict: 'name' });
      if (parkError) throw parkError;

      if (trails.length > 0) {
        const { error: trailsError } = await supabase.from('trails').insert(
          trails.map((t) => ({ name: t.name, location: name, description: t.description, difficulty: t.difficulty }))
        );
        if (trailsError) throw trailsError;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-parks'] });
      qc.invalidateQueries({ queryKey: ['admin-trails'] });
      qc.invalidateQueries({ queryKey: ['trails'] });
      qc.invalidateQueries({ queryKey: ['admin-stats'] });
    },
  });
}

export function useUpdatePark() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ name, description, city }: { name: string; description: string | null; city: string | null }) => {
      const { error } = await supabase
        .from('parks')
        .upsert({ name, description, city }, { onConflict: 'name' });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-parks'] });
    },
  });
}

export function useAddTrailToPark() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (trail: { name: string; location: string; description: string | null; difficulty: string | null }) => {
      const { error } = await supabase.from('trails').insert(trail);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-parks'] });
      qc.invalidateQueries({ queryKey: ['admin-trails'] });
      qc.invalidateQueries({ queryKey: ['trails'] });
      qc.invalidateQueries({ queryKey: ['admin-stats'] });
    },
  });
}

export function useToggleParkVisibility() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ name, isHidden }: { name: string; isHidden: boolean }) => {
      const { error } = await supabase
        .from('parks')
        .upsert({ name, is_hidden: isHidden }, { onConflict: 'name' });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-parks'] });
      qc.invalidateQueries({ queryKey: ['hidden-parks'] });
    },
  });
}

export function useRenamepark() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ oldName, newName }: { oldName: string; newName: string }) => {
      const { error } = await supabase
        .from('trails')
        .update({ location: newName })
        .eq('location', oldName);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-parks'] });
      qc.invalidateQueries({ queryKey: ['admin-trails'] });
      qc.invalidateQueries({ queryKey: ['trails'] });
    },
  });
}

export function useDeletePark() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (parkName: string) => {
      const { error } = await supabase
        .from('trails')
        .delete()
        .eq('location', parkName);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-parks'] });
      qc.invalidateQueries({ queryKey: ['admin-trails'] });
      qc.invalidateQueries({ queryKey: ['trails'] });
      qc.invalidateQueries({ queryKey: ['admin-stats'] });
    },
  });
}
