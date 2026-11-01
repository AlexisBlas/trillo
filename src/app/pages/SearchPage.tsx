import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router';
import {
  Search,
  Mountain,
  ChevronRight,
  ChevronLeft,
  SlidersHorizontal,
  Check,
} from 'lucide-react';
import { Skeleton } from '../components/ui/skeleton';
import { Alert, AlertDescription } from '../components/ui/alert';
import { BackButton } from '../components/layout/BackButton';
import { useTrails } from '../hooks/useTrails';
import type { TrailWithCity } from '../hooks/useTrails';
import { useParkReports } from '../hooks/useParkReports';
import { StatusWithHazards } from '../components/trail/StatusWithHazards';
import { ConditionSourceLegend } from '../components/trail/ConditionSourceLegend';
import { NewParkBadge } from '../components/trail/NewParkBadge';
import { ParkTrailSearchField } from '../components/trail/ParkTrailSearchField';
import { formatUpdatedAgo, normalizeSearchText, searchIncludes } from '../lib/text';
import type { ParkRegion } from '../lib/regions';
import { useLang, type TranslationKey } from '../contexts/LangContext';
import {
  getParkCity,
  getParkRegion,
  isParkNameNew,
  useParksMeta,
} from '../hooks/useParksMeta';
import { useFollowedParkNames } from '../hooks/useParkFollows';
import {
  getEffectiveParkStatus,
  useConditionEstimates,
} from '../hooks/useConditionEstimates';
import { cn } from '../components/ui/utils';

type ConditionFilter = 'all' | 'green' | 'yellow' | 'red';
type RegionFilter = 'all' | ParkRegion;

type OptionTone = 'default' | 'green' | 'yellow' | 'red';

const REGION_FILTERS: { value: RegionFilter; labelKey: TranslationKey }[] = [
  { value: 'all', labelKey: 'search_filter_all' },
  { value: 'north', labelKey: 'search_region_north' },
  { value: 'metro', labelKey: 'search_region_metro' },
  { value: 'east', labelKey: 'search_region_east' },
  { value: 'central', labelKey: 'search_region_central' },
  { value: 'mountain', labelKey: 'search_region_mountain' },
  { value: 'west', labelKey: 'search_region_west' },
  { value: 'southwest', labelKey: 'search_region_southwest' },
  { value: 'south', labelKey: 'search_region_south' },
];

const CONDITION_FILTERS: {
  value: ConditionFilter;
  labelKey: TranslationKey;
  tone: OptionTone;
  dot: string | null;
}[] = [
  { value: 'all', labelKey: 'search_filter_all', tone: 'default', dot: null },
  { value: 'green', labelKey: 'reports_filter_good', tone: 'green', dot: '#4A9E68' },
  { value: 'yellow', labelKey: 'reports_filter_caution', tone: 'yellow', dot: '#f59e0b' },
  { value: 'red', labelKey: 'reports_filter_closed', tone: 'red', dot: '#C96B6B' },
];

const ACTIVE_TONES: Record<OptionTone, { bg: string; border: string; text: string }> = {
  default: { bg: 'var(--accent)', border: 'var(--primary)', text: 'var(--primary)' },
  green: { bg: 'var(--status-green)', border: 'var(--status-green-foreground)', text: 'var(--status-green-foreground)' },
  yellow: { bg: 'var(--status-yellow)', border: 'var(--status-yellow-foreground)', text: 'var(--status-yellow-foreground)' },
  red: { bg: 'var(--status-red)', border: 'var(--status-red-foreground)', text: 'var(--status-red-foreground)' },
};

/** Large tap targets — outline idle, tinted + check when selected. */
function OptionButton({
  active,
  onClick,
  children,
  tone = 'default',
  dot,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
  tone?: OptionTone;
  dot?: string | null;
}) {
  const activeTone = ACTIVE_TONES[tone];

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'min-h-[52px] px-3.5 py-3 rounded-[14px] border-[2px] text-[15px] font-bold leading-tight transition-colors touch-manipulation inline-flex items-center justify-between gap-2 text-left',
        active
          ? ''
          : 'bg-card text-muted-foreground border-border active:bg-[#f8f5ef]'
      )}
      style={
        active
          ? {
              backgroundColor: activeTone.bg,
              borderColor: activeTone.border,
              color: activeTone.text,
            }
          : undefined
      }
    >
      <span className="inline-flex items-center gap-2 min-w-0">
        {dot && (
          <span
            className="size-2.5 rounded-full shrink-0"
            style={{ backgroundColor: dot }}
            aria-hidden
          />
        )}
        <span className="truncate">{children}</span>
      </span>
      {active ? (
        <Check className="size-5 shrink-0" strokeWidth={2.5} aria-hidden />
      ) : (
        <span className="size-5 shrink-0 rounded-full border-[1.5px] border-[#d1d5db]" aria-hidden />
      )}
    </button>
  );
}

export function SearchPage() {
  const navigate = useNavigate();
  const { t, lang } = useLang();
  const { data: trails, isLoading, error } = useTrails();
  const { byPark, hazardsByPark } = useParkReports();
  const { byPark: estimatesByPark } = useConditionEstimates();
  const [searchQuery, setSearchQuery] = useState('');
  const [regionFilter, setRegionFilter] = useState<RegionFilter>('all');
  const [conditionFilter, setConditionFilter] = useState<ConditionFilter>('all');
  const [cityFilter, setCityFilter] = useState<string>('all');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const { data: parksMeta } = useParksMeta();
  const followedNames = useFollowedParkNames();

  const q = normalizeSearchText(searchQuery);
  const activeFilterCount =
    (regionFilter !== 'all' ? 1 : 0) +
    (conditionFilter !== 'all' ? 1 : 0) +
    (cityFilter !== 'all' ? 1 : 0);
  const filtersActive = activeFilterCount > 0;

  const clearFilters = () => {
    setRegionFilter('all');
    setConditionFilter('all');
    setCityFilter('all');
  };

  const closeFilters = () => setFiltersOpen(false);

  useEffect(() => {
    if (!filtersOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [filtersOpen]);

  const availableCities = useMemo(() => {
    const cities = new Set<string>();
    for (const trail of trails || []) {
      const parkName = trail.location || 'Other';
      const city = trail.city ?? getParkCity(parksMeta, parkName);
      if (city) cities.add(city);
    }
    return Array.from(cities).sort((a, b) => a.localeCompare(b));
  }, [trails, parksMeta]);

  const allParks = useMemo(() => {
    const map = new Map<string, TrailWithCity[]>();
    for (const trail of trails || []) {
      const park = trail.location || 'Other';
      if (!map.has(park)) map.set(park, []);
      map.get(park)!.push(trail);
    }
    return Array.from(map.entries()).map(([name, parkTrails]) => ({
      name,
      city: getParkCity(parksMeta, name) ?? parkTrails[0]?.city ?? null,
      trailCount: parkTrails.length,
      trails: parkTrails,
    }));
  }, [trails, parksMeta]);

  const parks = useMemo(() => {
    const filtered = (trails || []).filter((trail) => {
      const parkName = trail.location || 'Other';
      const city = trail.city ?? getParkCity(parksMeta, parkName);

      if (q) {
        const matchesSearch =
          searchIncludes(trail.name, q) ||
          searchIncludes(parkName, q) ||
          searchIncludes(city, q);
        if (!matchesSearch) return false;
      }

      if (cityFilter !== 'all' && city !== cityFilter) return false;

      if (regionFilter !== 'all') {
        const region = getParkRegion(parksMeta, parkName);
        if (region !== regionFilter) return false;
      }

      if (conditionFilter !== 'all') {
        const report = byPark.get(parkName);
        const { status } = getEffectiveParkStatus(
          report
            ? { status: report.status, createdAt: report.createdAt }
            : null,
          estimatesByPark.get(parkName)
        );
        if (status !== conditionFilter) return false;
      }

      return true;
    });

    const map = new Map<string, TrailWithCity[]>();
    for (const trail of filtered) {
      const park = trail.location || 'Other';
      if (!map.has(park)) map.set(park, []);
      map.get(park)!.push(trail);
    }

    return Array.from(map.entries())
      .map(([name, parkTrails]) => ({ name, trails: parkTrails }))
      .sort((a, b) => {
        const aFollowed = followedNames.has(a.name);
        const bFollowed = followedNames.has(b.name);
        if (aFollowed !== bFollowed) return aFollowed ? -1 : 1;
        return a.name.localeCompare(b.name);
      });
  }, [
    trails,
    q,
    parksMeta,
    followedNames,
    regionFilter,
    conditionFilter,
    cityFilter,
    byPark,
    estimatesByPark,
  ]);

  const filtersOverlay =
    filtersOpen &&
    createPortal(
      <div
        className="fixed inset-0 z-[80] bg-background flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-label={t('search_filters')}
      >
        <div className="shrink-0 flex items-center gap-3 h-[60px] px-4 border-b border-border pt-[env(safe-area-inset-top)]">
          <button
            type="button"
            onClick={closeFilters}
            aria-label={t('search_filters_close')}
            className="size-[48px] rounded-full bg-card border-[1.5px] border-border shadow-sm flex items-center justify-center touch-manipulation active:bg-muted"
          >
            <ChevronLeft className="size-6 text-foreground" strokeWidth={2} />
          </button>
          <h2 className="flex-1 text-[18px] font-bold text-foreground">
            {t('search_filters')}
          </h2>
          {filtersActive && (
            <span className="min-w-[28px] h-[28px] px-1.5 rounded-full bg-highlight text-white text-[13px] font-bold flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-5 pt-5 pb-4">
          <div className="flex flex-col gap-6">
            <div>
              <p className="text-[12px] font-bold tracking-[1.1px] uppercase text-muted-foreground mb-2.5">
                {t('search_filter_region')}
              </p>
              <div className="grid grid-cols-2 gap-2.5">
                {REGION_FILTERS.map((f) => (
                  <OptionButton
                    key={f.value}
                    active={regionFilter === f.value}
                    onClick={() => setRegionFilter(f.value)}
                  >
                    {t(f.labelKey)}
                  </OptionButton>
                ))}
              </div>
            </div>

            <div>
              <p className="text-[12px] font-bold tracking-[1.1px] uppercase text-muted-foreground mb-2.5">
                {t('search_filter_condition')}
              </p>
              <div className="grid grid-cols-2 gap-2.5">
                {CONDITION_FILTERS.map((f) => (
                  <OptionButton
                    key={f.value}
                    active={conditionFilter === f.value}
                    onClick={() => setConditionFilter(f.value)}
                    tone={f.tone}
                    dot={f.dot}
                  >
                    {t(f.labelKey)}
                  </OptionButton>
                ))}
              </div>
            </div>

            {availableCities.length > 0 && (
              <div>
                <p className="text-[12px] font-bold tracking-[1.1px] uppercase text-muted-foreground mb-2.5">
                  {t('search_filter_city')}
                </p>
                <div className="grid grid-cols-1 gap-2.5">
                  <OptionButton
                    active={cityFilter === 'all'}
                    onClick={() => setCityFilter('all')}
                  >
                    {t('search_filter_all')}
                  </OptionButton>
                  {availableCities.map((city) => (
                    <OptionButton
                      key={city}
                      active={cityFilter === city}
                      onClick={() => setCityFilter(city)}
                    >
                      {city}
                    </OptionButton>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="shrink-0 px-5 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] border-t border-border bg-background flex flex-col gap-2.5">
          {filtersActive && (
            <button
              type="button"
              onClick={clearFilters}
              className="w-full min-h-[52px] rounded-[14px] border-[1.5px] border-border bg-card text-[15px] font-bold text-primary touch-manipulation active:bg-muted"
            >
              {t('search_clear_filters')}
            </button>
          )}
          <button
            type="button"
            onClick={closeFilters}
            className="w-full min-h-[52px] rounded-[14px] bg-primary text-primary-foreground text-[16px] font-bold touch-manipulation active:bg-primary"
          >
            {t('search_filters_done')}
          </button>
        </div>
      </div>,
      document.body
    );

  return (
    <div className="min-h-screen bg-background">
      <div className="px-4 pt-3.5">
        <BackButton />
      </div>

      <div className="px-5 pt-6 pb-4">
        <h1 className="text-[24px] font-bold text-foreground mb-5">{t('search_title')}</h1>

        <div className="flex flex-col gap-3">
          <ParkTrailSearchField
            value={searchQuery}
            onChange={setSearchQuery}
            parks={allParks}
            trails={trails || []}
            parksMeta={parksMeta}
            placeholder={t('search_placeholder')}
            inputClassName="h-[52px] pl-[48px]"
          />

          <button
            type="button"
            aria-label={t('search_filters')}
            aria-expanded={filtersOpen}
            onClick={() => setFiltersOpen(true)}
            className={cn(
              'relative w-full min-h-[52px] px-4 inline-flex items-center justify-center gap-2.5 rounded-[24px] border-[2px] bg-card shadow-sm transition-colors touch-manipulation active:scale-[0.99]',
              filtersActive
                ? 'border-primary text-primary'
                : 'border-border text-foreground'
            )}
          >
            <SlidersHorizontal className="size-5" strokeWidth={2.25} />
            <span className="text-[16px] font-bold">{t('search_filters')}</span>
            {filtersActive && (
              <span className="min-w-[28px] h-[28px] px-1.5 rounded-full bg-highlight text-white text-[13px] font-bold flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>
      </div>

      <div className="px-5 pt-2 pb-6">
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{t('search_load_error')}</AlertDescription>
          </Alert>
        )}

        {isLoading && (
          <div className="flex flex-col gap-[10px]">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-[88px] w-full rounded-[16px]" />
            ))}
          </div>
        )}

        {!isLoading && parks.length === 0 && (
          <div className="bg-card rounded-[16px] border-[1.5px] border-border shadow-sm p-8 text-center">
            <div className="size-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              {q || filtersActive ? (
                <Search className="size-6 text-muted-foreground" />
              ) : (
                <Mountain className="size-6 text-muted-foreground" />
              )}
            </div>
            <h3 className="text-[15.5px] font-bold text-foreground mb-2">
              {q || filtersActive ? t('search_no_parks_found') : t('search_no_parks_available')}
            </h3>
            <p className="text-[13px] text-muted-foreground">
              {q || filtersActive ? t('search_no_parks_search_hint') : t('search_no_parks_empty_hint')}
            </p>
            {filtersActive && (
              <button
                type="button"
                onClick={clearFilters}
                className="mt-5 w-full min-h-[52px] rounded-[14px] border-[1.5px] border-border bg-background text-[15px] font-bold text-primary touch-manipulation"
              >
                {t('search_clear_filters')}
              </button>
            )}
          </div>
        )}

        {!isLoading && parks.length > 0 && (
          <>
            <div className="flex items-end justify-between gap-3 mb-3 px-[4px]">
              <p className="text-[11px] font-bold tracking-[1.2px] uppercase text-muted-foreground">
                {parks.length} {parks.length === 1 ? t('park_singular') : t('park_plural')}
              </p>
              <ConditionSourceLegend className="justify-end" />
            </div>
            <div className="flex flex-col gap-[10px]">
              {parks.map((park) => {
                const parkTitle = park.name;
                const city = getParkCity(parksMeta, park.name);
                const report = byPark.get(park.name);
                const { status, source, rainAdjusted } = getEffectiveParkStatus(
                  report
                    ? { status: report.status, createdAt: report.createdAt }
                    : null,
                  estimatesByPark.get(park.name)
                );
                const updatedAgo = formatUpdatedAgo(report?.createdAt, lang);
                const parkHazards = hazardsByPark.get(park.name) ?? [];
                return (
                  <button
                    key={park.name}
                    onClick={() => navigate(`/parks/${encodeURIComponent(park.name)}`)}
                    className="bg-card border-[1.5px] border-border shadow-[0px_1px_1.5px_rgba(0,0,0,0.04)] hover:border-primary transition-colors p-[15.5px] flex items-center gap-3.5 text-left rounded-[32px]"
                  >
                    <StatusWithHazards
                      status={status}
                      reported={source === 'report'}
                      conditions={parkHazards.map((h) => h.tag)}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <h3 className="text-[15.5px] font-bold tracking-[-0.2px] text-foreground truncate">
                          {parkTitle}
                        </h3>
                        {isParkNameNew(parksMeta, park.name) && <NewParkBadge />}
                      </div>
                      <p className="text-[13px] text-muted-foreground truncate">
                        {city ?? ''}
                      </p>
                      <p className="text-[12px] text-muted-foreground mt-0.5">
                        {park.trails.length} {park.trails.length === 1 ? t('trail_singular') : t('trail_plural')}
                        {rainAdjusted ? (
                          <span> · {t('condition_rain_adjusted')}</span>
                        ) : source === 'estimate' ? (
                          <span> · {t('condition_estimated')}</span>
                        ) : updatedAgo ? (
                          <span> · {updatedAgo}</span>
                        ) : null}
                      </p>
                    </div>
                    <ChevronRight className="size-5 text-muted-foreground shrink-0" />
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>

      {filtersOverlay}
    </div>
  );
}
