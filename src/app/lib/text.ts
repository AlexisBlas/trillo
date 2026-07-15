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

export function truncateWords(text: string | null | undefined, maxWords = 60): string {
  if (!text) return '';
  const words = text.trim().split(/\s+/);
  if (words.length <= maxWords) return text.trim();
  return words.slice(0, maxWords).join(' ') + '…';
}
