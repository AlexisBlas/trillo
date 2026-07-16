import { useQuery } from '@tanstack/react-query';
import { supabase, Trail } from '../lib/supabase';
import { resolveParkCity } from '../lib/text';

export type TrailWithCity = Trail & { city: string | null };

async function fetchParksMeta(): Promise<{
  hidden: Set<string>;
  cityByPark: Map<string, string | null>;
}> {
  const { data, error } = await supabase.from('parks').select('name, city, is_hidden');
  if (error) throw error;
  const hidden = new Set<string>();
  const cityByPark = new Map<string, string | null>();
  for (const p of data ?? []) {
    const row = p as { name: string; city: string | null; is_hidden: boolean };
    if (row.is_hidden) hidden.add(row.name);
    cityByPark.set(row.name, resolveParkCity(row.name, row.city));
  }
  return { hidden, cityByPark };
}

export function useTrails() {
  return useQuery({
    queryKey: ['trails', 'with-city'],
    queryFn: async () => {
      const [trailsRes, parks] = await Promise.all([
        supabase.from('trails').select('*').order('name'),
        fetchParksMeta(),
      ]);
      if (trailsRes.error) throw trailsRes.error;
      return (trailsRes.data as Trail[])
        .filter((t) => !t.location || !parks.hidden.has(t.location))
        .map(
          (t): TrailWithCity => ({
            ...t,
            city: t.location ? parks.cityByPark.get(t.location) ?? resolveParkCity(t.location, null) : null,
          })
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
