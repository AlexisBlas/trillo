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

/**
 * Admin-set directions for a park. Fetched on its own so a database without
 * the directions_url column (017 not applied) only hides the button.
 */
export function useParkDirections(parkName: string | undefined) {
  return useQuery({
    queryKey: ['park-directions', parkName],
    queryFn: async () => {
      if (!parkName) return null;
      const { data, error } = await supabase
        .from('parks')
        .select('directions_url')
        .eq('name', parkName)
        .maybeSingle();
      if (error) return null;
      const value = (data as { directions_url: string | null } | null)?.directions_url;
      return value?.trim() || null;
    },
    enabled: !!parkName,
    staleTime: 5 * 60 * 1000,
  });
}

export function useParkMeta(parkName: string | undefined) {
  return useQuery({
    queryKey: ['park-meta', parkName],
    queryFn: async () => {
      if (!parkName) return null;
      const { data } = await supabase
        .from('parks')
        .select('name, city, description, description_es, created_at')
        .eq('name', parkName)
        .maybeSingle();
      return data as {
        name: string;
        city: string | null;
        description: string | null;
        description_es: string | null;
        created_at: string | null;
      } | null;
    },
    enabled: !!parkName,
    staleTime: 5 * 60 * 1000,
  });
}
