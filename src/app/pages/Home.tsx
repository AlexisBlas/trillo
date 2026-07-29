import heroImage from '@/imports/eltrillo_hero.png'
import { useMemo, useState } from 'react';
import { Search, Plus, Database, MapPin, Mountain, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router';
import { TopNav } from '../components/layout/TopNav';
import { Skeleton } from '../components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { SuggestPlaceDialog } from '../components/home/SuggestPlaceDialog';
import { useTrails } from '../hooks/useTrails';
import type { TrailWithCity } from '../hooks/useTrails';
import { useTrailReports } from '../hooks/useTrailReports';
import { useParkReports } from '../hooks/useParkReports';
import { StatusWithHazards } from '../components/trail/StatusWithHazards';
import { NewParkBadge } from '../components/trail/NewParkBadge';
import { isReportFresh, formatUpdatedAgo, normalizeSearchText, searchIncludes } from '../lib/text';
import { useLang } from '../contexts/LangContext';
import { useAuth } from '../contexts/AuthContext';
import { getParkCity, isParkNameNew, useParksMeta } from '../hooks/useParksMeta';
import { useParkFollows } from '../hooks/useParkFollows';

type Park = { name: string; city: string | null; trails: TrailWithCity[] };

export function Home() {
  const navigate = useNavigate();
  const { t } = useLang();
  const { user } = useAuth();
  const { data: trails, isLoading, error } = useTrails();
  const { data: reports } = useTrailReports(200);
  const { byPark, hazardsByPark } = useParkReports();
  const { data: parksMeta } = useParksMeta();
  const { data: follows, isLoading: followsLoading } = useParkFollows();
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestOpen, setSuggestOpen] = useState(false);

  const freshReportCount = (reports || []).filter((r) =>
    isReportFresh(r.created_at, r.conditions)
  ).length;

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t('greeting_morning');
    if (hour < 18) return t('greeting_afternoon');
    return t('greeting_evening');
  };

  const parks = useMemo<Park[]>(() => {
    const map = new Map<string, TrailWithCity[]>();
    for (const trail of trails || []) {
      const park = trail.location || 'Other';
      if (!map.has(park)) map.set(park, []);
      map.get(park)!.push(trail);
    }
    return Array.from(map.entries())
      .map(([name, parkTrails]) => ({
        name,
        city: getParkCity(parksMeta, name) ?? parkTrails[0]?.city ?? null,
        trails: parkTrails,
      }))
      .sort((a, b) => b.trails.length - a.trails.length);
  }, [trails, parksMeta]);

  const q = normalizeSearchText(searchQuery);

  const suggestions = useMemo(() => {
    if (!q) return { parks: [] as Park[], trails: [] as TrailWithCity[] };
    const parkMatches = parks
      .filter((p) => searchIncludes(p.name, q) || searchIncludes(p.city, q))
      .slice(0, 4);
    const trailMatches = (trails || [])
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

  // Surface the parks with the most recent fresh reports first, so the section
  // highlights where the latest on-the-ground conditions are. Parks without a
  // fresh report fall back to ordering by trail count (already sorted in `parks`).
  const recentParks = useMemo<Park[]>(() => {
    return [...parks]
      .sort((a, b) => {
        const aTime = byPark.get(a.name)?.createdAt;
        const bTime = byPark.get(b.name)?.createdAt;
        if (aTime && bTime) return new Date(bTime).getTime() - new Date(aTime).getTime();
        if (aTime) return -1;
        if (bTime) return 1;
        return 0; // both unreported: keep existing (trail-count) order
      })
      .slice(0, 5);
  }, [parks, byPark]);

  const followingParks = useMemo<Park[]>(() => {
    if (!follows?.length) return [];
    const byName = new Map(parks.map((p) => [p.name, p]));
    return follows
      .map((f) => byName.get(f.park_name))
      .filter((p): p is Park => !!p);
  }, [follows, parks]);

  const followingPreview = followingParks.slice(0, 2);

  const renderParkCard = (park: Park) => {
    const updatedAgo = formatUpdatedAgo(byPark.get(park.name)?.createdAt);
    const parkHazards = hazardsByPark.get(park.name) ?? [];
    const showNew = isParkNameNew(parksMeta, park.name);
    return (
      <button
        key={park.name}
        type="button"
        onClick={() => navigate(`/parks/${encodeURIComponent(park.name)}`)}
        className="bg-white border-[1.5px] border-[#f0ede6] shadow-[0px_1px_1.5px_rgba(0,0,0,0.04)] hover:border-[#2c4a1e] transition-colors p-[15.5px] flex items-center gap-3.5 text-left rounded-[32px]"
      >
        <StatusWithHazards
          status={byPark.get(park.name)?.status ?? null}
          conditions={parkHazards.map((h) => h.tag)}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 min-w-0">
            <h3 className="text-[15.5px] font-bold tracking-[-0.2px] text-[#1a1a1a] truncate">
              {park.name}
            </h3>
            {showNew && <NewParkBadge />}
          </div>
          <p className="text-[13px] text-[#374151] truncate">
            {park.city ?? ''}
          </p>
          <p className="text-[12px] text-[#4b5563] mt-0.5">
            {park.trails.length} {park.trails.length === 1 ? t('trail_singular') : t('trail_plural')}
            {updatedAgo && <span> · {updatedAgo}</span>}
          </p>
        </div>
        <ChevronRight className="size-5 text-[#4b5563] shrink-0" />
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-[#F5F0E8]">
      <TopNav />

      <div className="px-[0px] p-[0px]">
        <img
          src={heroImage}
          alt="Runner, hiker, and cyclist on a mountain trail"
          className="w-full h-auto select-none pointer-events-none m-[0px]"
        />
      </div>

      <div className="m-[0px] px-[20px] py-[0px]">
        <div className="mb-6">

            <h1 className="leading-[38px] text-[#4b6b3a] font-bold p-[0px] tracking-[-2px] mx-[0px] mt-[0px] mb-[8px] text-[36px] text-center">{t('home_headline').split('\n').map((line, i) => <span key={i}>{line}{i === 0 && <br />}</span>)}</h1>
          <p className="text-[18px] px-[4px] py-[0px] text-center"><b>{freshReportCount} {freshReportCount === 1 ? t('home_report') : t('home_reports')}</b> {t('home_active_reports')}</p>
        </div>

        {/* Search Bar with autocomplete */}
        <div className="relative">
          <Search className="absolute left-[17.5px] top-[22px] -translate-y-1/2 size-[18px] text-[#4b5563] z-10" />
          <Input
            type="text"
            placeholder={t('search')}
            className="h-[45.5px] pl-[45px] pr-4 border-[1.5px] border-[#e5e7eb] bg-white text-[16px] shadow-sm rounded-[24px]"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />

          {q && (
            <div className="absolute left-0 right-0 top-[52px] z-20 bg-white rounded-[14px] border-[1.5px] border-[#e5e7eb] shadow-[0px_8px_24px_rgba(0,0,0,0.08)] overflow-hidden">
              {suggestions.parks.length === 0 && suggestions.trails.length === 0 ? (
                <div className="p-4 text-[13px] text-[#374151] text-center">
                  {t('home_no_matches')} &ldquo;{searchQuery}&rdquo;
                </div>
              ) : (
                <div className="max-h-[360px] overflow-y-auto">
                  {suggestions.parks.length > 0 && (
                    <div>
                      <p className="px-4 pt-3 pb-1.5 text-[10px] font-bold tracking-[1.2px] uppercase text-[#4b5563]">
                        {t('park_plural')}
                      </p>
                      {suggestions.parks.map((p) => {
                        const parkTitle = p.name;
                        return (
                          <button
                            key={p.name}
                            onClick={() => {
                              setSearchQuery('');
                              navigate(`/parks/${encodeURIComponent(p.name)}`);
                            }}
                            className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-[#f9f7f2] text-left"
                          >
                            <div className="size-9 rounded-full bg-[#3a6b35] flex items-center justify-center shrink-0">
                              <MapPin className="size-4 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <p className="text-[14px] font-bold text-[#1a1a1a] truncate">
                                  {parkTitle}
                                </p>
                                {isParkNameNew(parksMeta, p.name) && <NewParkBadge />}
                              </div>
                              <p className="text-[12px] text-[#374151] truncate">
                                {p.city ? `${p.city} · ` : ''}{p.trails.length} {p.trails.length === 1 ? t('trail_singular') : t('trail_plural')}
                              </p>
                            </div>
                            <ChevronRight className="size-4 text-[#4b5563]" />
                          </button>
                        );
                      })}
                    </div>
                  )}
                  {suggestions.trails.length > 0 && (
                    <div className="border-t border-[#f0ede6]">
                      <p className="px-4 pt-3 pb-1.5 text-[10px] font-bold tracking-[1.2px] uppercase text-[#4b5563]">
                        {t('trail_plural')}
                      </p>
                      {suggestions.trails.map((trail) => {
                        const displayName = trail.name.includes(' - ')
                          ? trail.name.split(' - ').slice(1).join(' - ')
                          : trail.name;
                        return (
                          <button
                            key={trail.id}
                            onClick={() => {
                              setSearchQuery('');
                              navigate(`/trails/${trail.id}`);
                            }}
                            className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-[#f9f7f2] text-left"
                          >
                            <div className="size-9 rounded-full bg-[#f0ede6] flex items-center justify-center shrink-0">
                              <Mountain className="size-4 text-[#2c4a1e]" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[14px] font-bold text-[#1a1a1a] truncate">
                                {displayName}
                              </p>
                              <p className="text-[12px] text-[#374151] truncate">
                                {trail.location || t('trail_singular')}
                              </p>
                            </div>
                            <ChevronRight className="size-4 text-[#4b5563]" />
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Following + Recently Reported */}
      <div className="px-[20px] pt-[32px] pb-[40px]">
        <div className="mb-8">
          <div className="flex items-center justify-between mx-[4px] mt-[0px] mb-[12px]">
            <h2 className="text-[11px] font-bold tracking-[1.2px] uppercase text-[#374151]">
              {t('home_following')}
            </h2>
            {!user ? (
              <button
                type="button"
                className="text-[13px] font-bold text-[#2c4a1e]"
                onClick={() =>
                  navigate('/auth/signin', { state: { redirectAfter: '/' } })
                }
              >
                {t('follow_signin_cta')}
              </button>
            ) : followingParks.length > 2 ? (
              <button
                type="button"
                className="text-[13px] font-bold text-[#2c4a1e]"
                onClick={() => navigate('/search')}
              >
                {t('home_see_all')}
              </button>
            ) : null}
          </div>

          {!user ? (
            <div className="bg-white rounded-[16px] border-[1.5px] border-[#f0ede6] px-4 py-5">
              <p className="text-[13px] text-[#374151] leading-[19px]">
                {t('home_following_signin')}
              </p>
            </div>
          ) : followsLoading || isLoading ? (
            <div className="flex flex-col gap-[10px]">
              {[...Array(2)].map((_, i) => (
                <Skeleton key={i} className="h-[88px] w-full rounded-[16px]" />
              ))}
            </div>
          ) : followingParks.length === 0 ? (
            <div className="bg-white rounded-[16px] border-[1.5px] border-[#f0ede6] px-4 py-5">
              <p className="text-[13px] text-[#374151] leading-[19px]">
                {t('home_following_empty')}
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-[10px]">
              {followingPreview.map(renderParkCard)}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between mx-[4px] mt-[0px] mb-[12px]">
          <h2 className="text-[11px] font-bold tracking-[1.2px] uppercase text-[#374151]">
            {t('home_recently_reported')}
          </h2>
          <button
            className="text-[13px] font-bold text-[#2c4a1e]"
            onClick={() => navigate('/search')}
          >
            {t('home_see_all')}
          </button>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-4">
            <Database className="size-4" />
            <AlertTitle>Database Setup Required</AlertTitle>
            <AlertDescription className="mt-2 text-sm">
              Please run the migration SQL in your Supabase dashboard.
            </AlertDescription>
          </Alert>
        )}

        {isLoading && (
          <div className="flex flex-col gap-[10px]">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-[88px] w-full rounded-[16px]" />
            ))}
          </div>
        )}

        {!isLoading && recentParks.length === 0 && !error && (
          <div className="bg-white rounded-[16px] border-[1.5px] border-[#f0ede6] shadow-sm p-8 text-center">
            <div className="size-12 rounded-full bg-[#f0ede6] flex items-center justify-center mx-auto mb-4">
              <Plus className="size-6 text-[#2c4a1e]" />
            </div>
            <h3 className="text-[15.5px] font-bold text-[#1a1a1a] mb-2">{t('home_no_parks')}</h3>
            <p className="text-[13px] text-[#374151] mb-6">
              {t('home_no_parks_body')}
            </p>
            <Button
              onClick={() => navigate('/search')}
              className="bg-[#2c4a1e] hover:bg-[#1a3010] text-white rounded-[14px] h-11"
            >
              {t('home_browse')}
            </Button>
          </div>
        )}

        {!isLoading && recentParks.length > 0 && (
          <div className="flex flex-col gap-[10px]">
            {recentParks.map(renderParkCard)}
          </div>
        )}

        {!isLoading && (
          <div className="mt-6 pt-5 border-t border-[#e5e0d5] min-w-0">
            <p className="text-[15px] font-bold tracking-[-0.2px] text-[#1a3010] text-balance">
              {t('home_suggest_title')}
            </p>
            <p className="text-[13px] text-[#4b5563] mt-1 leading-[19px] text-pretty">
              {t('home_suggest_body')}
            </p>
            <button
              type="button"
              onClick={() => setSuggestOpen(true)}
              className="mt-3.5 w-full min-h-[48px] h-auto py-3 px-4 rounded-[14px] border-[1.5px] border-[#2c4a1e] text-[#2c4a1e] text-[13px] font-bold tracking-[0.6px] leading-snug bg-white active:scale-[0.99] transition-transform whitespace-normal text-center"
            >
              {t('home_suggest_cta')}
            </button>
          </div>
        )}
      </div>

      <SuggestPlaceDialog open={suggestOpen} onOpenChange={setSuggestOpen} />
    </div>
  );
}
