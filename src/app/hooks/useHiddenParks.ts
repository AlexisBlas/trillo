import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export function useHiddenParks() {
  return useQuery({
    queryKey: ['hidden-parks'],
    queryFn: async () => {
      const { data } = await supabase
        .from('parks')
        .select('name')
        .eq('is_hidden', true);
      return new Set((data ?? []).map((p) => p.name));
    },
    staleTime: 60 * 1000,
  });
}

export function useParkMeta(parkName: string | undefined) {
  return useQuery({
    queryKey: ['park-meta', parkName],
    queryFn: async () => {
      if (!parkName) return null;
      const { data } = await supabase
        .from('parks')
        .select('name, city, description, description_es')
        .eq('name', parkName)
        .maybeSingle();
      return data as {
        name: string;
        city: string | null;
        description: string | null;
        description_es: string | null;
      } | null;
    },
    enabled: !!parkName,
    staleTime: 5 * 60 * 1000,
  });
}
