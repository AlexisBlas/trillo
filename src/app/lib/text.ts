const PARK_OVERVIEW_TAG = '[Park overview]';

const DAY_MS = 24 * 60 * 60 * 1000;
const DEFAULT_TTL_DAYS = 3;
const HAZARD_TTL_DAYS: Record<string, number> = {
  'hazard:downed-trees': 5,
};

/**
 * Returns true if a report is still within its visibility window.
 * Reports expire after 3 days by default, except those flagged with
 * hazards that have a longer TTL (e.g. downed trees: 5 days).
 */
export function isReportFresh(
  createdAt: string,
  conditions: string[] | null | undefined
): boolean {
  const ttlDays = (conditions || []).reduce(
    (max, c) => Math.max(max, HAZARD_TTL_DAYS[c] ?? 0),
    DEFAULT_TTL_DAYS
  );
  return Date.now() - new Date(createdAt).getTime() < ttlDays * DAY_MS;
}

/**
 * Formats a timestamp as a short relative "time ago" string, e.g.
 * "Updated 2h ago", "Updated 3d ago", or "Updated just now".
 * Returns null when no timestamp is provided.
 */
export function formatUpdatedAgo(createdAt: string | null | undefined): string | null {
  if (!createdAt) return null;
  const diffMs = Date.now() - new Date(createdAt).getTime();
  if (Number.isNaN(diffMs)) return null;

  const minutes = Math.floor(diffMs / (60 * 1000));
  if (minutes < 1) return 'Updated just now';
  if (minutes < 60) return `Updated ${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Updated ${hours}h ago`;

  const days = Math.floor(hours / 24);
  return `Updated ${days}d ago`;
}

export function cleanNotes(text: string | null | undefined): string {
  if (!text) return '';
  return text.replace(PARK_OVERVIEW_TAG, '').trim();
}

/** Lowercase + strip accents so "Bayamon" matches "Bayamón". */
export function normalizeSearchText(value: string | null | undefined): string {
  if (!value) return '';
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export function searchIncludes(
  haystack: string | null | undefined,
  normalizedQuery: string
): boolean {
  if (!normalizedQuery) return true;
  return normalizeSearchText(haystack).includes(normalizedQuery);
}

/**
 * Prefer parks.city; otherwise the last ", City" segment of the park name
 * (common in imported names like "Bosque Estatal de Susúa, Yauco").
 */
export function resolveParkCity(
  parkName: string | null | undefined,
  cityFromMeta: string | null | undefined
): string | null {
  const fromMeta = cityFromMeta?.trim();
  if (fromMeta) return fromMeta;
  if (!parkName) return null;
  const comma = parkName.lastIndexOf(',');
  if (comma < 0) return null;
  const suffix = parkName.slice(comma + 1).trim();
  return suffix || null;
}

/** Prefer the active language; fall back to the other if missing. */
export function pickLocalizedText(
  en: string | null | undefined,
  es: string | null | undefined,
  lang: 'en' | 'es'
): string | null {
  const english = en?.trim() || null;
  const spanish = es?.trim() || null;
  if (lang === 'es') return spanish || english;
  return english || spanish;
}

/** True when a trail route param is a usable UUID/id (not missing or the string "null"). */
export function isValidTrailId(trailId: string | null | undefined): trailId is string {
  if (!trailId) return false;
  const value = trailId.trim().toLowerCase();
  return value !== '' && value !== 'null' && value !== 'undefined';
}

/**
 * Destination for a report click: trail detail when trail_id exists,
 * otherwise the park page for park-level reports.
 */
export function getReportPath(report: {
  trail_id?: string | null;
  park_name?: string | null;
  trails?: { location?: string | null } | null;
}): string | null {
  if (isValidTrailId(report.trail_id)) return `/trails/${report.trail_id}`;
  const park = report.park_name || report.trails?.location;
  if (park) return `/parks/${encodeURIComponent(park)}`;
  return null;
}

export function truncateWords(text: string | null | undefined, maxWords = 60): string {
  if (!text) return '';
  const words = text.trim().split(/\s+/);
  if (words.length <= maxWords) return text.trim();
  return words.slice(0, maxWords).join(' ') + '…';
}
