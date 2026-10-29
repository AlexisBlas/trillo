import { useCallback, useState } from 'react';

const STORAGE_KEY = 'trillo.search.history';
const MAX_ITEMS = 8;

function readHistory(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
      .map((item) => item.trim())
      .slice(0, MAX_ITEMS);
  } catch {
    return [];
  }
}

function writeHistory(items: string[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, MAX_ITEMS)));
  } catch {
    // Quota / private mode — ignore.
  }
}

/** Recent search queries shared by Home and Search. */
export function useSearchHistory() {
  const [history, setHistory] = useState<string[]>(() =>
    typeof window === 'undefined' ? [] : readHistory()
  );

  const push = useCallback((query: string) => {
    const trimmed = query.trim();
    if (!trimmed) return;
    setHistory((prev) => {
      const next = [
        trimmed,
        ...prev.filter((item) => item.toLowerCase() !== trimmed.toLowerCase()),
      ].slice(0, MAX_ITEMS);
      writeHistory(next);
      return next;
    });
  }, []);

  const remove = useCallback((query: string) => {
    setHistory((prev) => {
      const next = prev.filter((item) => item !== query);
      writeHistory(next);
      return next;
    });
  }, []);

  const clear = useCallback(() => {
    writeHistory([]);
    setHistory([]);
  }, []);

  return { history, push, remove, clear };
}
