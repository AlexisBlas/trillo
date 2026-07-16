import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { resolveParkCity } from '../lib/text';

/** Map of park name → display/searchable city (column or name suffix). */
export function useParksMeta() {
  return useQuery({
    queryKey: ['parks-meta-public', 'v2'],
    queryFn: async () => {
      const { data, error } = await supabase.from('parks').select('name, city');
      if (error) throw error;
      return new Map(
        (data ?? []).map((p: { name: string; city: string | null }) => [
          p.name,
          resolveParkCity(p.name, p.city),
        ])
      );
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function getParkCity(
  parksMeta: Map<string, string | null> | undefined,
  parkName: string | null | undefined
): string | null {
  if (!parkName) return null;
  return parksMeta?.get(parkName) ?? resolveParkCity(parkName, null);
}
