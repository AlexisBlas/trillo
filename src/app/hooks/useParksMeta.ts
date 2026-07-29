import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { resolveParkCity } from '../lib/text';

export type ParkMetaPublic = {
  city: string | null;
  createdAt: string | null;
};

/** Parks newer than this (days) show a "New" badge. */
export const NEW_PARK_DAYS = 14;

/** Map of park name → city + createdAt for list UI. */
export function useParksMeta() {
  return useQuery({
    queryKey: ['parks-meta-public', 'v3'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('parks')
        .select('name, city, created_at');
      if (error) throw error;
      return new Map(
        (data ?? []).map(
          (p: { name: string; city: string | null; created_at: string | null }) => [
            p.name,
            {
              city: resolveParkCity(p.name, p.city),
              createdAt: p.created_at ?? null,
            } satisfies ParkMetaPublic,
          ]
        )
      );
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function getParkCity(
  parksMeta: Map<string, ParkMetaPublic> | undefined,
  parkName: string | null | undefined
): string | null {
  if (!parkName) return null;
  return parksMeta?.get(parkName)?.city ?? resolveParkCity(parkName, null);
}

export function getParkCreatedAt(
  parksMeta: Map<string, ParkMetaPublic> | undefined,
  parkName: string | null | undefined
): string | null {
  if (!parkName) return null;
  return parksMeta?.get(parkName)?.createdAt ?? null;
}

export function isParkNew(
  createdAt: string | null | undefined,
  withinDays: number = NEW_PARK_DAYS
): boolean {
  if (!createdAt) return false;
  const created = new Date(createdAt).getTime();
  if (Number.isNaN(created)) return false;
  return Date.now() - created < withinDays * 24 * 60 * 60 * 1000;
}

export function isParkNameNew(
  parksMeta: Map<string, ParkMetaPublic> | undefined,
  parkName: string | null | undefined
): boolean {
  return isParkNew(getParkCreatedAt(parksMeta, parkName));
}
