import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  estimateConditionFromPrecip,
  isWetterStatus,
  type TrailConditionStatus,
} from '../lib/conditionEstimate';
import { resolveParkCoords, type Coords } from '../lib/municipalityCoords';
import { getCityRegion, type ParkRegion } from '../lib/regions';
import { resolveParkCity } from '../lib/text';
import { useParksMeta } from './useParksMeta';
import { useTrails } from './useTrails';

export type HourlyPrecip = { time: string[]; precipitation: number[] };

export type ParkConditionEstimate = {
  status: TrailConditionStatus;
  weightedPrecipMm: number;
  totalPrecipMm: number;
  coords: Coords;
  region: ParkRegion | null;
  hourly: HourlyPrecip;
};

function coordKey(coords: Coords): string {
  return `${coords.lat.toFixed(2)},${coords.lng.toFixed(2)}`;
}

async function fetchHourlyPrecipBatch(
  points: Coords[]
): Promise<Map<string, HourlyPrecip>> {
  const result = new Map<string, HourlyPrecip>();
  if (points.length === 0) return result;

  // Open-Meteo accepts up to ~100 locations per request.
  const chunkSize = 80;
  for (let i = 0; i < points.length; i += chunkSize) {
    const chunk = points.slice(i, i + chunkSize);
    const lat = chunk.map((p) => p.lat).join(',');
    const lng = chunk.map((p) => p.lng).join(',');
    const url =
      `https://api.open-meteo.com/v1/forecast` +
      `?latitude=${lat}&longitude=${lng}` +
      `&hourly=precipitation` +
      `&past_days=3&forecast_days=1` +
      `&timezone=America%2FPuerto_Rico`;

    const res = await fetch(url);
    if (!res.ok) throw new Error(`Precip fetch failed: ${res.status}`);
    const json = await res.json();

    // Single location → object; multiple → array
    const payloads = Array.isArray(json) ? json : [json];
    payloads.forEach((payload: { hourly?: HourlyPrecip }, idx: number) => {
      const point = chunk[idx];
      if (!point || !payload?.hourly?.time || !payload?.hourly?.precipitation) return;
      result.set(coordKey(point), {
        time: payload.hourly.time,
        precipitation: payload.hourly.precipitation,
      });
    });
  }

  return result;
}

/**
 * Rainfall-based Dry/Wet/Muddy estimates per park.
 * Uses parks.lat/lng when set, otherwise municipality centroids from city.
 */
export function useConditionEstimates() {
  const { data: parksMeta } = useParksMeta();
  const { data: trails } = useTrails();

  const parkCoords = useMemo(() => {
    const byName = new Map<
      string,
      { name: string; coords: Coords; region: ParkRegion | null }
    >();

    if (parksMeta) {
      for (const [name, meta] of parksMeta) {
        if (!meta.coords) continue;
        byName.set(name, {
          name,
          coords: meta.coords,
          region: meta.region,
        });
      }
    }

    // Cover trail locations missing from parks table (infer city from name).
    for (const trail of trails || []) {
      const name = trail.location?.trim();
      if (!name || byName.has(name)) continue;
      const city = trail.city ?? resolveParkCity(name, null);
      const coords = resolveParkCoords(null, null, city);
      if (!coords) continue;
      byName.set(name, {
        name,
        coords,
        region: getCityRegion(city),
      });
    }

    return Array.from(byName.values());
  }, [parksMeta, trails]);

  const uniquePoints = useMemo(() => {
    const seen = new Map<string, Coords>();
    for (const p of parkCoords) {
      const key = coordKey(p.coords);
      if (!seen.has(key)) seen.set(key, p.coords);
    }
    return Array.from(seen.values());
  }, [parkCoords]);

  const precipQuery = useQuery({
    queryKey: [
      'park-precip-estimates',
      'v2',
      uniquePoints.map((p) => coordKey(p)).sort().join('|'),
    ],
    enabled: uniquePoints.length > 0,
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    queryFn: () => fetchHourlyPrecipBatch(uniquePoints),
  });

  const byPark = useMemo(() => {
    const map = new Map<string, ParkConditionEstimate>();
    const precipByCoord = precipQuery.data;
    if (!precipByCoord) return map;

    for (const park of parkCoords) {
      const hourly = precipByCoord.get(coordKey(park.coords));
      if (!hourly) continue;
      const estimate = estimateConditionFromPrecip(hourly, park.region);
      map.set(park.name, {
        status: estimate.status,
        weightedPrecipMm: estimate.weightedPrecipMm,
        totalPrecipMm: estimate.totalPrecipMm,
        coords: park.coords,
        region: park.region,
        hourly,
      });
    }
    return map;
  }, [parkCoords, precipQuery.data]);

  return {
    byPark,
    isLoading: precipQuery.isLoading,
    isError: precipQuery.isError,
  };
}

export type ConditionReportInput = {
  status: TrailConditionStatus;
  createdAt: string;
};

export type EffectiveParkStatus = {
  status: TrailConditionStatus | null;
  /** Solid marker for reports; half-tone for rain-only or rain-adjusted. */
  source: 'report' | 'estimate' | null;
  /** True when a fresher report was wetter-overridden by rain after it was filed. */
  rainAdjusted: boolean;
};

/**
 * Effective park status:
 * - No report → rain estimate
 * - Report, but rain *after* the report is wetter → rain-adjusted (half-tone)
 * - Otherwise → trust the report
 */
export function getEffectiveParkStatus(
  report: ConditionReportInput | null | undefined,
  estimate: ParkConditionEstimate | undefined
): EffectiveParkStatus {
  if (report) {
    const reportedAt = new Date(report.createdAt);
    if (estimate?.hourly && !Number.isNaN(reportedAt.getTime())) {
      const sinceRain = estimateConditionFromPrecip(
        estimate.hourly,
        estimate.region,
        new Date(),
        reportedAt
      );
      if (isWetterStatus(sinceRain.status, report.status)) {
        return {
          status: sinceRain.status,
          source: 'estimate',
          rainAdjusted: true,
        };
      }
    }
    return {
      status: report.status,
      source: 'report',
      rainAdjusted: false,
    };
  }

  if (estimate) {
    return {
      status: estimate.status,
      source: 'estimate',
      rainAdjusted: false,
    };
  }

  return { status: null, source: null, rainAdjusted: false };
}
