import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { resolveParkCity } from '../lib/text';
import { getCityRegion, isParkRegion, type ParkRegion } from '../lib/regions';

export type ParkMetaPublic = {
  city: string | null;
  region: ParkRegion | null;
  createdAt: string | null;
};

/** Parks newer than this (days) show a "New" badge. */
export const NEW_PARK_DAYS = 5;

/** Map of park name → city + region + createdAt for list UI. */
export function useParksMeta() {
  return useQuery({
    queryKey: ['parks-meta-public', 'v6'],
    queryFn: async () => {
      let rows: Array<{
        name: string;
        city: string | null;
        region: string | null;
        created_at: string | null;
      }>;

      const withRegion = await supabase
        .from('parks')
        .select('name, city, region, created_at');
      if (!withRegion.error) {
        rows = (withRegion.data ?? []) as typeof rows;
      } else {
        // Fallback when 012_park_region.sql has not been applied yet.
        const withoutRegion = await supabase
          .from('parks')
          .select('name, city, created_at');
        if (withoutRegion.error) throw withoutRegion.error;
        rows = (withoutRegion.data ?? []).map((p) => ({
          ...p,
          region: null as string | null,
        }));
      }

      return new Map(
        rows.map((p) => {
          const city = resolveParkCity(p.name, p.city);
          return [
            p.name,
            {
              city,
              region: isParkRegion(p.region) ? p.region : getCityRegion(city),
              createdAt: p.created_at ?? null,
            } satisfies ParkMetaPublic,
          ] as const;
        })
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

/** Prefer parks.region; fall back to city→region map when unset. */
export function getParkRegion(
  parksMeta: Map<string, ParkMetaPublic> | undefined,
  parkName: string | null | undefined
): ParkRegion | null {
  if (!parkName) return null;
  const meta = parksMeta?.get(parkName);
  if (meta?.region) return meta.region;
  return getCityRegion(meta?.city ?? resolveParkCity(parkName, null));
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
