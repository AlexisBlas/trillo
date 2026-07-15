import { useQuery } from '@tanstack/react-query';
import { supabase, Trail } from '../lib/supabase';

async function fetchHiddenParkNames(): Promise<Set<string>> {
  const { data } = await supabase
    .from('parks')
    .select('name')
    .eq('is_hidden', true);
  return new Set((data ?? []).map((p: { name: string }) => p.name));
}

export function useTrails() {
  return useQuery({
    queryKey: ['trails'],
    queryFn: async () => {
      const [trailsRes, hidden] = await Promise.all([
        supabase.from('trails').select('*').order('name'),
        fetchHiddenParkNames(),
      ]);
      if (trailsRes.error) throw trailsRes.error;
      return (trailsRes.data as Trail[]).filter(
        (t) => !t.location || !hidden.has(t.location)
      );
    },
  });
}

export function useTrail(trailId: string | undefined) {
  return useQuery({
    queryKey: ['trails', trailId],
    queryFn: async () => {
      if (!trailId || trailId === 'null' || trailId === 'undefined') return null;
      const { data, error } = await supabase
        .from('trails')
        .select('*')
        .eq('id', trailId)
        .single();
      if (error) throw error;
      return data as Trail;
    },
    enabled: !!trailId && trailId !== 'null' && trailId !== 'undefined',
  });
}

export function useTrailByQRCode(qrCode: string | undefined) {
  return useQuery({
    queryKey: ['trails', 'qr', qrCode],
    queryFn: async () => {
      if (!qrCode) return null;
      const { data, error } = await supabase
        .from('trails')
        .select('*')
        .eq('qr_code', qrCode)
        .single();
      if (error) throw error;
      return data as Trail;
    },
    enabled: !!qrCode,
  });
}
