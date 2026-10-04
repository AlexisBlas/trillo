export type TrailConditionStatus = 'green' | 'yellow' | 'red';

export type ConditionEstimate = {
  status: TrailConditionStatus;
  /** Rain over the last 24 hours (mm). */
  last24hMm: number;
  /** Rain over the last 72 hours (mm). */
  last72hMm: number;
};

/** Same thresholds for every park. Muddy is checked first. */
export const RAIN_THRESHOLDS = {
  muddy: { last24hMm: 15, last72hMm: 25 },
  wet: { last24hMm: 5, last72hMm: 10 },
} as const;

const HOUR_MS = 60 * 60 * 1000;

/**
 * Map recent hourly precipitation to an estimated Dry/Wet/Muddy status
 * from plain 24 h and 72 h rain totals.
 * When `since` is set, only rain at/after that time counts (post-report wet-up).
 */
export function estimateConditionFromPrecip(
  hourly: { time: string[]; precipitation: number[] },
  now: Date = new Date(),
  since?: Date | null
): ConditionEstimate {
  const nowMs = now.getTime();
  const sinceMs = since ? since.getTime() : null;
  let last24h = 0;
  let last72h = 0;

  const n = Math.min(hourly.time.length, hourly.precipitation.length);
  for (let i = 0; i < n; i++) {
    const t = Date.parse(hourly.time[i]);
    if (Number.isNaN(t)) continue;
    if (sinceMs != null && t < sinceMs) continue;
    const ageMs = nowMs - t;
    if (ageMs < 0 || ageMs > 72 * HOUR_MS) continue;
    const mm = hourly.precipitation[i] ?? 0;
    if (mm <= 0) continue;
    last72h += mm;
    if (ageMs <= 24 * HOUR_MS) last24h += mm;
  }

  const { muddy, wet } = RAIN_THRESHOLDS;
  let status: TrailConditionStatus = 'green';
  if (last24h >= muddy.last24hMm || last72h >= muddy.last72hMm) status = 'red';
  else if (last24h >= wet.last24hMm || last72h >= wet.last72hMm) status = 'yellow';

  return {
    status,
    last24hMm: Math.round(last24h * 10) / 10,
    last72hMm: Math.round(last72h * 10) / 10,
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
