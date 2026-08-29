import type { ParkRegion } from './regions';

export type TrailConditionStatus = 'green' | 'yellow' | 'red';

export type ConditionEstimate = {
  status: TrailConditionStatus;
  /** Time-weighted recent precip (mm). */
  weightedPrecipMm: number;
  /** Raw total precip over the lookback window (mm). */
  totalPrecipMm: number;
};

type RegionDryDown = {
  /** Exponential half-life for rain influence (hours). Longer = muddier longer. */
  halfLifeHours: number;
  wetMm: number;
  muddyMm: number;
};

/**
 * Region priors for Puerto Rico MTB:
 * southwest / dry forest clears faster; mountain & east rainforest hold longer.
 */
const REGION_DRY_DOWN: Record<ParkRegion, RegionDryDown> = {
  southwest: { halfLifeHours: 18, wetMm: 4, muddyMm: 12 },
  south: { halfLifeHours: 24, wetMm: 5, muddyMm: 15 },
  west: { halfLifeHours: 24, wetMm: 5, muddyMm: 15 },
  metro: { halfLifeHours: 30, wetMm: 6, muddyMm: 18 },
  north: { halfLifeHours: 30, wetMm: 6, muddyMm: 18 },
  central: { halfLifeHours: 36, wetMm: 5, muddyMm: 14 },
  east: { halfLifeHours: 40, wetMm: 5, muddyMm: 13 },
  mountain: { halfLifeHours: 48, wetMm: 4, muddyMm: 11 },
};

const DEFAULT_DRY_DOWN: RegionDryDown = {
  halfLifeHours: 30,
  wetMm: 6,
  muddyMm: 16,
};

export function getRegionDryDown(region: ParkRegion | null | undefined): RegionDryDown {
  if (region && region in REGION_DRY_DOWN) return REGION_DRY_DOWN[region];
  return DEFAULT_DRY_DOWN;
}

/**
 * Map recent hourly precipitation to an estimated Dry/Wet/Muddy status.
 * Recent rain weighs more than older rain (exponential decay by region).
 * When `since` is set, only rain at/after that time counts (post-report wet-up).
 */
export function estimateConditionFromPrecip(
  hourly: { time: string[]; precipitation: number[] },
  region: ParkRegion | null | undefined,
  now: Date = new Date(),
  since?: Date | null
): ConditionEstimate {
  const { halfLifeHours, wetMm, muddyMm } = getRegionDryDown(region);
  const nowMs = now.getTime();
  const lookbackMs = 72 * 60 * 60 * 1000;
  const sinceMs = since ? since.getTime() : null;
  let weighted = 0;
  let total = 0;

  const n = Math.min(hourly.time.length, hourly.precipitation.length);
  for (let i = 0; i < n; i++) {
    const t = Date.parse(hourly.time[i]);
    if (Number.isNaN(t)) continue;
    if (sinceMs != null && t < sinceMs) continue;
    const ageMs = nowMs - t;
    if (ageMs < 0 || ageMs > lookbackMs) continue;
    const mm = hourly.precipitation[i] ?? 0;
    if (mm <= 0) continue;
    total += mm;
    const ageHours = ageMs / (60 * 60 * 1000);
    const weight = Math.exp((-Math.LN2 * ageHours) / halfLifeHours);
    weighted += mm * weight;
  }

  let status: TrailConditionStatus = 'green';
  if (weighted >= muddyMm) status = 'red';
  else if (weighted >= wetMm) status = 'yellow';

  return {
    status,
    weightedPrecipMm: Math.round(weighted * 10) / 10,
    totalPrecipMm: Math.round(total * 10) / 10,
  };
}

/** Higher = wetter / worse rideability. */
export const STATUS_SEVERITY: Record<TrailConditionStatus, number> = {
  green: 0,
  yellow: 1,
  red: 2,
};

export function isWetterStatus(
  candidate: TrailConditionStatus,
  baseline: TrailConditionStatus
): boolean {
  return STATUS_SEVERITY[candidate] > STATUS_SEVERITY[baseline];
}
