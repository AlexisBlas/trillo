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
import { ConditionSourceLegend } from '../components/trail/ConditionSourceLegend';
import { NewParkBadge } from '../components/trail/NewParkBadge';
import { isReportFresh, formatUpdatedAgo, normalizeSearchText, searchIncludes } from '../lib/text';
import { useLang } from '../contexts/LangContext';
import { useAuth } from '../contexts/AuthContext';
import { getParkCity, isParkNameNew, useParksMeta } from '../hooks/useParksMeta';
import { useParkFollows } from '../hooks/useParkFollows';
import {
  getEffectiveParkStatus,
  useConditionEstimates,
} from '../hooks/useConditionEstimates';

type Park = { name: string; city: string | null; trails: TrailWithCity[] };

export function Home() {
  const navigate = useNavigate();
  const { t, lang } = useLang();
  const { user } = useAuth();
  const { data: trails, isLoading, error } = useTrails();
  const { data: reports } = useTrailReports(200);
  const { byPark, hazardsByPark } = useParkReports();
  const { byPark: estimatesByPark } = useConditionEstimates();
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
    const report = byPark.get(park.name);
    const { status, source, rainAdjusted } = getEffectiveParkStatus(
      report
        ? { status: report.status, createdAt: report.createdAt }
        : null,
      estimatesByPark.get(park.name)
    );
    const updatedAgo = formatUpdatedAgo(report?.createdAt, lang);
    const parkHazards = hazardsByPark.get(park.name) ?? [];
    const showNew = isParkNameNew(parksMeta, park.name);
    return (
      <button
        key={park.name}
        type="button"
        onClick={() => navigate(`/parks/${encodeURIComponent(park.name)}`)}
        className="bg-[#151C18] border-[1.5px] border-[#24302A] shadow-[0px_1px_1.5px_rgba(0,0,0,0.04)] hover:border-[#63B882] transition-colors p-[15.5px] flex items-center gap-3.5 text-left rounded-[32px]"
      >
        <StatusWithHazards
          status={status}
          reported={source === 'report'}
          conditions={parkHazards.map((h) => h.tag)}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 min-w-0">
            <h3 className="text-[15.5px] font-bold tracking-[-0.2px] text-[#E6EBE6] truncate">
              {park.name}
            </h3>
            {showNew && <NewParkBadge />}
          </div>
          <p className="text-[13px] text-[#9AA39C] truncate">
            {park.city ?? ''}
          </p>
          <p className="text-[12px] text-[#8B958C] mt-0.5">
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
        <ChevronRight className="size-5 text-[#8B958C] shrink-0" />
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-[#0E1510]">
      <TopNav />

      <section className="relative isolate overflow-hidden">
        <img
          src="/home-hero.jpg"
          alt=""
          aria-hidden
          className="absolute inset-0 size-full object-cover object-[center_38%] select-none pointer-events-none [mask-image:linear-gradient(to_bottom,black_55%,transparent_100%)] [-webkit-mask-image:linear-gradient(to_bottom,black_55%,transparent_100%)]"
        />
        {/* Dark scrim so greeting/headline stay readable on the mottled cliff. */}
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(90deg, rgba(14,21,16,0.62) 0%, rgba(14,21,16,0.28) 55%, rgba(14,21,16,0.12) 100%), linear-gradient(180deg, rgba(14,21,16,0.28) 0%, rgba(14,21,16,0.45) 48%, rgba(14,21,16,0.88) 78%, #0E1510 100%)',
          }}
        />
        <div className="relative z-10 flex min-h-[220px] flex-col justify-end px-5 pb-6 pt-14 text-left">
          <p className="text-[13px] text-[#C5D6C0] mb-1.5 drop-shadow-[0_1px_2px_rgba(0,0,0,0.55)]">
            {getGreeting()}
          </p>
          <h1 className="text-[36px] leading-[38px] font-bold tracking-[-2px] text-[#F4F7F4] mb-2 drop-shadow-[0_2px_8px_rgba(0,0,0,0.55)]">
            {t('home_headline').split('\n').map((line, i) => (
              <span key={i}>
                {line}
                {i === 0 && <br />}
              </span>
            ))}
          </h1>
          <p className="text-[16px] text-[#C8D0C8] drop-shadow-[0_1px_3px_rgba(0,0,0,0.5)]">
            <b className="text-[#7FCB9A]">
              {freshReportCount} {freshReportCount === 1 ? t('home_report') : t('home_reports')}
            </b>{' '}
            {t('home_active_reports')}
          </p>
        </div>
      </section>

      <div className="m-[0px] px-[20px] pt-1">
        {/* Search Bar with autocomplete */}
        <div className="relative">
          <Search className="absolute left-[17.5px] top-[22px] -translate-y-1/2 size-[18px] text-[#8B958C] z-10" />
          <Input
            type="text"
            placeholder={t('search')}
            className="h-[45.5px] pl-[45px] pr-4 border-[1.5px] border-[#24302A] bg-[#151C18] text-[16px] shadow-sm rounded-[24px]"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />

          {q && (
            <div className="absolute left-0 right-0 top-[52px] z-20 bg-[#151C18] rounded-[14px] border-[1.5px] border-[#24302A] shadow-[0px_8px_24px_rgba(0,0,0,0.08)] overflow-hidden">
              {suggestions.parks.length === 0 && suggestions.trails.length === 0 ? (
                <div className="p-4 text-[13px] text-[#9AA39C] text-center">
                  {t('home_no_matches')} &ldquo;{searchQuery}&rdquo;
                </div>
              ) : (
                <div className="max-h-[360px] overflow-y-auto">
                  {suggestions.parks.length > 0 && (
                    <div>
                      <p className="px-4 pt-3 pb-1.5 text-[10px] font-bold tracking-[1.2px] uppercase text-[#8B958C]">
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
                            className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-[#1A221C] text-left"
                          >
                            <div className="size-9 rounded-full bg-[#1E3A28] flex items-center justify-center shrink-0">
                              <MapPin className="size-4 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <p className="text-[14px] font-bold text-[#E6EBE6] truncate">
                                  {parkTitle}
                                </p>
                                {isParkNameNew(parksMeta, p.name) && <NewParkBadge />}
                              </div>
                              <p className="text-[12px] text-[#9AA39C] truncate">
                                {p.city ? `${p.city} · ` : ''}{p.trails.length} {p.trails.length === 1 ? t('trail_singular') : t('trail_plural')}
                              </p>
                            </div>
                            <ChevronRight className="size-4 text-[#8B958C]" />
                          </button>
                        );
                      })}
                    </div>
                  )}
                  {suggestions.trails.length > 0 && (
                    <div className="border-t border-[#24302A]">
                      <p className="px-4 pt-3 pb-1.5 text-[10px] font-bold tracking-[1.2px] uppercase text-[#8B958C]">
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
                            className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-[#1A221C] text-left"
                          >
                            <div className="size-9 rounded-full bg-[#24302A] flex items-center justify-center shrink-0">
                              <Mountain className="size-4 text-[#63B882]" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[14px] font-bold text-[#E6EBE6] truncate">
                                {displayName}
                              </p>
                              <p className="text-[12px] text-[#9AA39C] truncate">
                                {trail.location || t('trail_singular')}
                              </p>
                            </div>
                            <ChevronRight className="size-4 text-[#8B958C]" />
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
        <ConditionSourceLegend className="mb-5 px-1" />
        <div className="mb-8">
          <div className="flex items-center justify-between mx-[4px] mt-[0px] mb-[12px]">
            <h2 className="text-[11px] font-bold tracking-[1.2px] uppercase text-[#9AA39C]">
              {t('home_following')}
            </h2>
            {!user ? (
              <button
                type="button"
                className="text-[13px] font-bold text-[#63B882]"
                onClick={() =>
                  navigate('/auth/signin', { state: { redirectAfter: '/' } })
                }
              >
                {t('follow_signin_cta')}
              </button>
            ) : followingParks.length > 2 ? (
              <button
                type="button"
                className="text-[13px] font-bold text-[#63B882]"
                onClick={() => navigate('/search')}
              >
                {t('home_see_all')}
              </button>
            ) : null}
          </div>

          {!user ? (
            <div className="bg-[#151C18] rounded-[16px] border-[1.5px] border-[#24302A] px-4 py-5">
              <p className="text-[13px] text-[#9AA39C] leading-[19px]">
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
            <div className="bg-[#151C18] rounded-[16px] border-[1.5px] border-[#24302A] px-4 py-5">
              <p className="text-[13px] text-[#9AA39C] leading-[19px]">
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
          <h2 className="text-[11px] font-bold tracking-[1.2px] uppercase text-[#9AA39C]">
            {t('home_recently_reported')}
          </h2>
          <button
            className="text-[13px] font-bold text-[#63B882]"
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
          <div className="bg-[#151C18] rounded-[16px] border-[1.5px] border-[#24302A] shadow-sm p-8 text-center">
            <div className="size-12 rounded-full bg-[#24302A] flex items-center justify-center mx-auto mb-4">
              <Plus className="size-6 text-[#63B882]" />
            </div>
            <h3 className="text-[15.5px] font-bold text-[#E6EBE6] mb-2">{t('home_no_parks')}</h3>
            <p className="text-[13px] text-[#9AA39C] mb-6">
              {t('home_no_parks_body')}
            </p>
            <Button
              onClick={() => navigate('/search')}
              className="bg-[#63B882] hover:bg-[#52A06E] text-[#0E1510] rounded-[14px] h-11"
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
          <div className="mt-6 pt-5 border-t border-[#24302A] min-w-0">
            <p className="text-[15px] font-bold tracking-[-0.2px] text-[#E6EBE6] text-balance">
              {t('home_suggest_title')}
            </p>
            <p className="text-[13px] text-[#8B958C] mt-1 leading-[19px] text-pretty">
              {t('home_suggest_body')}
            </p>
            <button
              type="button"
              onClick={() => setSuggestOpen(true)}
              className="mt-3.5 w-full min-h-[48px] h-auto py-3 px-4 rounded-[14px] border-[1.5px] border-[#63B882] text-[#63B882] text-[13px] font-bold tracking-[0.6px] leading-snug bg-[#151C18] active:scale-[0.99] transition-transform whitespace-normal text-center"
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
