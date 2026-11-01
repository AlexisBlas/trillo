import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { Search, MapPin, Mountain, ChevronRight, Clock, X } from 'lucide-react';
import { Input } from '../ui/input';
import { NewParkBadge } from './NewParkBadge';
import { useLang } from '../../contexts/LangContext';
import { useSearchHistory } from '../../hooks/useSearchHistory';
import {
  getParkCity,
  isParkNameNew,
  type ParkMetaPublic,
} from '../../hooks/useParksMeta';
import type { TrailWithCity } from '../../hooks/useTrails';
import { normalizeSearchText, searchIncludes } from '../../lib/text';
import { cn } from '../ui/utils';

export type SearchParkOption = {
  name: string;
  city: string | null;
  trailCount?: number;
};

type ParkTrailSearchFieldProps = {
  value: string;
  onChange: (value: string) => void;
  parks: SearchParkOption[];
  trails: TrailWithCity[];
  parksMeta?: Map<string, ParkMetaPublic>;
  placeholder: string;
  inputClassName?: string;
  className?: string;
};

export function ParkTrailSearchField({
  value,
  onChange,
  parks,
  trails,
  parksMeta,
  placeholder,
  inputClassName,
  className,
}: ParkTrailSearchFieldProps) {
  const navigate = useNavigate();
  const { t } = useLang();
  const { history, push, remove, clear } = useSearchHistory();
  const [focused, setFocused] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const q = normalizeSearchText(value);

  const suggestions = useMemo(() => {
    if (!q) return { parks: [] as SearchParkOption[], trails: [] as TrailWithCity[] };
    const parkMatches = parks
      .filter((p) => searchIncludes(p.name, q) || searchIncludes(p.city, q))
      .slice(0, 4);
    const trailMatches = trails
      .filter((trail) => {
        const displayName = trail.name.includes(' - ')
          ? trail.name.split(' - ').slice(1).join(' - ')
          : trail.name;
        const parkCity = trail.city ?? getParkCity(parksMeta, trail.location);
        return (
          searchIncludes(displayName, q) ||
          searchIncludes(trail.name, q) ||
          searchIncludes(trail.location, q) ||
          searchIncludes(parkCity, q)
        );
      })
      .slice(0, 6);
    return { parks: parkMatches, trails: trailMatches };
  }, [q, parks, trails, parksMeta]);

  const showHistory = focused && !q && history.length > 0;
  const showSuggestions = focused && !!q;
  const panelOpen = showHistory || showSuggestions;

  useEffect(() => {
    return () => {
      if (blurTimer.current) clearTimeout(blurTimer.current);
    };
  }, []);

  const scrollFieldToTop = () => {
    const el = wrapRef.current;
    if (!el) return;
    // Keep the field near the top so the keyboard / dropdown have room.
    const top = el.getBoundingClientRect().top + window.scrollY - 12;
    window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
  };

  const handleFocus = () => {
    if (blurTimer.current) {
      clearTimeout(blurTimer.current);
      blurTimer.current = null;
    }
    setFocused(true);
    requestAnimationFrame(scrollFieldToTop);
  };

  const handleBlur = () => {
    // Delay so a tap on a dropdown row still registers.
    blurTimer.current = setTimeout(() => setFocused(false), 150);
  };

  const goPark = (parkName: string) => {
    push(parkName);
    onChange('');
    setFocused(false);
    navigate(`/parks/${encodeURIComponent(parkName)}`);
  };

  const goTrail = (trail: TrailWithCity) => {
    const displayName = trail.name.includes(' - ')
      ? trail.name.split(' - ').slice(1).join(' - ')
      : trail.name;
    push(displayName);
    onChange('');
    setFocused(false);
    navigate(`/trails/${trail.id}`);
  };

  const applyHistory = (term: string) => {
    push(term);
    onChange(term);
    setFocused(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const term = value.trim();
      if (!term) return;
      push(term);
      setFocused(false);
      (e.target as HTMLInputElement).blur();
      // Prefer jumping to an exact park match when Enter is pressed.
      const exactPark = parks.find(
        (p) => normalizeSearchText(p.name) === normalizeSearchText(term)
      );
      if (exactPark) {
        navigate(`/parks/${encodeURIComponent(exactPark.name)}`);
        onChange('');
      }
    }
    if (e.key === 'Escape') {
      setFocused(false);
      (e.target as HTMLInputElement).blur();
    }
  };

  return (
    <div ref={wrapRef} className={cn('relative scroll-mt-3', className)}>
      <Search className="absolute left-[17.5px] top-1/2 -translate-y-1/2 size-[18px] text-muted-foreground z-10 pointer-events-none" />
      <Input
        type="search"
        enterKeyHint="search"
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        placeholder={placeholder}
        className={cn(
          'h-[45.5px] pl-[45px] pr-4 border-[1.5px] border-border bg-card text-[16px] shadow-sm rounded-[24px]',
          inputClassName
        )}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        aria-autocomplete="list"
        aria-expanded={panelOpen}
      />

      {panelOpen && (
        <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-20 bg-card rounded-[14px] border-[1.5px] border-border shadow-[0px_8px_24px_rgba(0,0,0,0.2)] overflow-hidden">
          {showHistory && (
            <div className="max-h-[320px] overflow-y-auto">
              <div className="px-4 pt-3 pb-1.5 flex items-center justify-between gap-2">
                <p className="text-[10px] font-bold tracking-[1.2px] uppercase text-muted-foreground">
                  {t('search_recent')}
                </p>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={clear}
                  className="text-[12px] font-bold text-primary"
                >
                  {t('search_clear_history')}
                </button>
              </div>
              {history.map((term) => (
                <div
                  key={term}
                  className="w-full px-2 py-0.5 flex items-center gap-1"
                >
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => applyHistory(term)}
                    className="flex-1 min-w-0 px-2 py-2.5 flex items-center gap-3 hover:bg-secondary text-left rounded-[10px]"
                  >
                    <Clock className="size-4 text-muted-foreground shrink-0" />
                    <span className="text-[14px] font-bold text-foreground truncate">
                      {term}
                    </span>
                  </button>
                  <button
                    type="button"
                    aria-label={t('search_remove_history')}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => remove(term)}
                    className="size-9 flex items-center justify-center text-muted-foreground hover:text-foreground shrink-0"
                  >
                    <X className="size-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {showSuggestions && (
            <>
              {suggestions.parks.length === 0 && suggestions.trails.length === 0 ? (
                <div className="p-4 text-[13px] text-muted-foreground text-center">
                  {t('home_no_matches')} &ldquo;{value}&rdquo;
                </div>
              ) : (
                <div className="max-h-[360px] overflow-y-auto">
                  {suggestions.parks.length > 0 && (
                    <div>
                      <p className="px-4 pt-3 pb-1.5 text-[10px] font-bold tracking-[1.2px] uppercase text-muted-foreground">
                        {t('park_plural')}
                      </p>
                      {suggestions.parks.map((p) => {
                        const trailCount = p.trailCount;
                        return (
                          <button
                            key={p.name}
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => goPark(p.name)}
                            className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-secondary text-left"
                          >
                            <div className="size-9 rounded-full bg-accent flex items-center justify-center shrink-0">
                              <MapPin className="size-4 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <p className="text-[14px] font-bold text-foreground truncate">
                                  {p.name}
                                </p>
                                {isParkNameNew(parksMeta, p.name) && <NewParkBadge />}
                              </div>
                              <p className="text-[12px] text-muted-foreground truncate">
                                {p.city ? `${p.city}` : ''}
                                {p.city && trailCount != null ? ' · ' : ''}
                                {trailCount != null
                                  ? `${trailCount} ${trailCount === 1 ? t('trail_singular') : t('trail_plural')}`
                                  : ''}
                              </p>
                            </div>
                            <ChevronRight className="size-4 text-muted-foreground" />
                          </button>
                        );
                      })}
                    </div>
                  )}
                  {suggestions.trails.length > 0 && (
                    <div className={suggestions.parks.length > 0 ? 'border-t border-border' : ''}>
                      <p className="px-4 pt-3 pb-1.5 text-[10px] font-bold tracking-[1.2px] uppercase text-muted-foreground">
                        {t('trail_plural')}
                      </p>
                      {suggestions.trails.map((trail) => {
                        const displayName = trail.name.includes(' - ')
                          ? trail.name.split(' - ').slice(1).join(' - ')
                          : trail.name;
                        return (
                          <button
                            key={trail.id}
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => goTrail(trail)}
                            className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-secondary text-left"
                          >
                            <div className="size-9 rounded-full bg-muted flex items-center justify-center shrink-0">
                              <Mountain className="size-4 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[14px] font-bold text-foreground truncate">
                                {displayName}
                              </p>
                              <p className="text-[12px] text-muted-foreground truncate">
                                {trail.location || t('trail_singular')}
                              </p>
                            </div>
                            <ChevronRight className="size-4 text-muted-foreground" />
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
