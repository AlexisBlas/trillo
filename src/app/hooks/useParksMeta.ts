import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { resolveParkCity } from '../lib/text';
import { getCityRegion, isParkRegion, type ParkRegion } from '../lib/regions';
import { resolveParkCoords, type Coords } from '../lib/municipalityCoords';

export type ParkMetaPublic = {
  city: string | null;
  region: ParkRegion | null;
  createdAt: string | null;
  lat: number | null;
  lng: number | null;
  /** Resolved coords: DB override or municipality centroid. */
  coords: Coords | null;
};

/** Parks newer than this (days) show a "New" badge. */
export const NEW_PARK_DAYS = 5;

type ParksMetaRow = {
  name: string;
  city: string | null;
  region: string | null;
  created_at: string | null;
  lat: number | null;
  lng: number | null;
};

async function fetchParksMetaRows(): Promise<ParksMetaRow[]> {
  const withCoords = await supabase
    .from('parks')
    .select('name, city, region, created_at, lat, lng');
  if (!withCoords.error) {
    return (withCoords.data ?? []).map((p) => ({
      name: p.name,
      city: p.city ?? null,
      region: p.region ?? null,
      created_at: p.created_at ?? null,
      lat: typeof p.lat === 'number' ? p.lat : null,
      lng: typeof p.lng === 'number' ? p.lng : null,
    }));
  }

  // Fallback when 014_park_coords.sql has not been applied yet.
  const withRegion = await supabase
    .from('parks')
    .select('name, city, region, created_at');
  if (!withRegion.error) {
    return (withRegion.data ?? []).map((p) => ({
      name: p.name,
      city: p.city ?? null,
      region: p.region ?? null,
      created_at: p.created_at ?? null,
      lat: null,
      lng: null,
    }));
  }

  // Fallback when 012_park_region.sql has not been applied yet.
  const basic = await supabase.from('parks').select('name, city, created_at');
  if (basic.error) throw basic.error;
  return (basic.data ?? []).map((p) => ({
    name: p.name,
    city: p.city ?? null,
    region: null,
    created_at: p.created_at ?? null,
    lat: null,
    lng: null,
  }));
}

/** Map of park name → city + region + createdAt for list UI. */
export function useParksMeta() {
  return useQuery({
    queryKey: ['parks-meta-public', 'v7'],
    queryFn: async () => {
      const rows = await fetchParksMetaRows();

      return new Map(
        rows.map((p) => {
          const city = resolveParkCity(p.name, p.city);
          const region = isParkRegion(p.region) ? p.region : getCityRegion(city);
          return [
            p.name,
            {
              city,
              region,
              createdAt: p.created_at ?? null,
              lat: p.lat,
              lng: p.lng,
              coords: resolveParkCoords(p.lat, p.lng, city),
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
