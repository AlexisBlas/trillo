import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { Search, Mountain, ChevronRight } from 'lucide-react';
import { Input } from '../components/ui/input';
import { Skeleton } from '../components/ui/skeleton';
import { Alert, AlertDescription } from '../components/ui/alert';
import { BackButton } from '../components/layout/BackButton';
import { useTrails } from '../hooks/useTrails';
import type { TrailWithCity } from '../hooks/useTrails';
import { useParkReports } from '../hooks/useParkReports';
import { StatusWithHazards } from '../components/trail/StatusWithHazards';
import { formatUpdatedAgo, normalizeSearchText, searchIncludes } from '../lib/text';
import { useLang } from '../contexts/LangContext';
import { getParkCity, useParksMeta } from '../hooks/useParksMeta';
import { useFollowedParkNames } from '../hooks/useParkFollows';

export function SearchPage() {
  const navigate = useNavigate();
  const { t } = useLang();
  const { data: trails, isLoading, error } = useTrails();
  const { byPark, hazardsByPark } = useParkReports();
  const [searchQuery, setSearchQuery] = useState('');
  const { data: parksMeta } = useParksMeta();
  const followedNames = useFollowedParkNames();

  const q = normalizeSearchText(searchQuery);

  // Group trails by park. When searching, match park name, city, or trail name.
  // Followed parks are pinned to the top of the list.
  const parks = useMemo(() => {
    const filtered = (trails || []).filter((trail) => {
      if (!q) return true;
      const parkName = trail.location || 'Other';
      const city = trail.city ?? getParkCity(parksMeta, parkName);
      return (
        searchIncludes(trail.name, q) ||
        searchIncludes(parkName, q) ||
        searchIncludes(city, q)
      );
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
  }, [trails, q, parksMeta, followedNames]);

  return (
    <div className="min-h-screen bg-[#F5F0E8]">
      <div className="px-4 pt-3.5">
        <BackButton />
      </div>

      {/* Header */}
      <div className="px-5 pt-6 pb-4">
        <h1 className="text-[24px] font-bold text-[#1a3010] mb-5">{t('search_title')}</h1>

        <div className="relative">
          <Search className="absolute left-[17.5px] top-1/2 -translate-y-1/2 size-[18px] text-[#4b5563]" />
          <Input
            type="text"
            placeholder={t('search_placeholder')}
            className="h-[45.5px] pl-[45px] pr-4 border-[1.5px] border-[#e5e7eb] bg-white text-[16px] shadow-sm rounded-[24px]"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
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
          <div className="bg-white rounded-[16px] border-[1.5px] border-[#f0ede6] shadow-sm p-8 text-center">
            <div className="size-12 rounded-full bg-[#f0ede6] flex items-center justify-center mx-auto mb-4">
              {q ? (
                <Search className="size-6 text-[#374151]" />
              ) : (
                <Mountain className="size-6 text-[#374151]" />
              )}
            </div>
            <h3 className="text-[15.5px] font-bold text-[#1a1a1a] mb-2">
              {q ? t('search_no_parks_found') : t('search_no_parks_available')}
            </h3>
            <p className="text-[13px] text-[#374151]">
              {q ? t('search_no_parks_search_hint') : t('search_no_parks_empty_hint')}
            </p>
          </div>
        )}

        {!isLoading && parks.length > 0 && (
          <>
            <p className="text-[11px] font-bold tracking-[1.2px] uppercase text-[#374151] mb-3 px-[4px] py-[0px]">
              {parks.length} {parks.length === 1 ? t('park_singular') : t('park_plural')}
            </p>
            <div className="flex flex-col gap-[10px]">
              {parks.map((park) => {
                const parkTitle = park.name;
                const city = getParkCity(parksMeta, park.name);
                const updatedAgo = formatUpdatedAgo(byPark.get(park.name)?.createdAt);
                const parkHazards = hazardsByPark.get(park.name) ?? [];
                return (
                  <button
                    key={park.name}
                    onClick={() => navigate(`/parks/${encodeURIComponent(park.name)}`)}
                    className="bg-white border-[1.5px] border-[#f0ede6] shadow-[0px_1px_1.5px_rgba(0,0,0,0.04)] hover:border-[#2c4a1e] transition-colors p-[15.5px] flex items-center gap-3.5 text-left rounded-[32px]"
                  >
                    <StatusWithHazards
                      status={byPark.get(park.name)?.status ?? null}
                      conditions={parkHazards.map((h) => h.tag)}
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="text-[15.5px] font-bold tracking-[-0.2px] text-[#1a1a1a] truncate">
                        {parkTitle}
                      </h3>
                      <p className="text-[13px] text-[#374151] truncate">
                        {city ?? ''}
                      </p>
                      <p className="text-[12px] text-[#4b5563] mt-0.5">
                        {park.trails.length} {park.trails.length === 1 ? t('trail_singular') : t('trail_plural')}
                        {updatedAgo && <span> · {updatedAgo}</span>}
                      </p>
                    </div>
                    <ChevronRight className="size-5 text-[#4b5563] shrink-0" />
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
