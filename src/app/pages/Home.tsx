import { useMemo, useState } from 'react';
import { Plus, Database, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router';
import { TopNav } from '../components/layout/TopNav';
import { Skeleton } from '../components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert';
import { Button } from '../components/ui/button';
import { SuggestPlaceDialog } from '../components/home/SuggestPlaceDialog';
import { useTrails } from '../hooks/useTrails';
import type { TrailWithCity } from '../hooks/useTrails';
import { useTrailReports } from '../hooks/useTrailReports';
import { useParkReports } from '../hooks/useParkReports';
import { StatusWithHazards } from '../components/trail/StatusWithHazards';
import { ConditionSourceLegend } from '../components/trail/ConditionSourceLegend';
import { NewParkBadge } from '../components/trail/NewParkBadge';
import { ParkTrailSearchField } from '../components/trail/ParkTrailSearchField';
import { isReportFresh, formatUpdatedAgo } from '../lib/text';
import { useLang } from '../contexts/LangContext';
import { useTheme } from '../contexts/ThemeContext';
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
  const { theme } = useTheme();
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

  const searchParks = useMemo(
    () =>
      parks.map((p) => ({
        name: p.name,
        city: p.city,
        trailCount: p.trails.length,
      })),
    [parks]
  );

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
              {park.name}
            </h3>
            {showNew && <NewParkBadge />}
          </div>
          <p className="text-[13px] text-muted-foreground truncate">
            {park.city ?? ''}
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
  };

  return (
    <div className="min-h-screen bg-background">
      <TopNav />

      <section className="relative isolate overflow-hidden">
        <img
          src={theme === 'light' ? '/home-hero-light.png' : '/home-hero-dark.png'}
          alt=""
          aria-hidden
          className="absolute inset-0 size-full scale-110 object-cover object-[center_42%] blur-[4px] select-none pointer-events-none [mask-image:linear-gradient(to_bottom,black_72%,transparent_100%)] [-webkit-mask-image:linear-gradient(to_bottom,black_72%,transparent_100%)]"
        />
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.32] mix-blend-overlay pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,${encodeURIComponent(
              "<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='g'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.55 0'/></filter><rect width='100%' height='100%' filter='url(#g)'/></svg>"
            )}")`,
            backgroundRepeat: 'repeat',
            backgroundSize: '160px 160px',
          }}
        />
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(180deg, color-mix(in srgb, var(--background) 6%, transparent) 0%, color-mix(in srgb, var(--background) 18%, transparent) 55%, color-mix(in srgb, var(--background) 70%, transparent) 88%, var(--background) 100%)',
          }}
        />
        <div className="relative z-10 flex min-h-[195px] flex-col justify-end px-5 pb-6 pt-10 text-left">
          <p className="text-[13px] text-muted-foreground mb-1">
            {getGreeting()}
          </p>
          <h1 className="text-[36px] leading-[1.1] font-bold text-foreground mb-1.5">
            {t('home_headline').split('\n').map((line, i) => (
              <span key={i}>
                {line}
                {i === 0 && <br />}
              </span>
            ))}
          </h1>
          <p className="text-[15px] text-muted-foreground">
            <b className="text-primary">
              {freshReportCount} {freshReportCount === 1 ? t('home_report') : t('home_reports')}
            </b>{' '}
            {t('home_active_reports')}
          </p>
        </div>
      </section>

      <div className="m-[0px] px-[20px] pt-1">
        <ParkTrailSearchField
          value={searchQuery}
          onChange={setSearchQuery}
          parks={searchParks}
          trails={trails || []}
          parksMeta={parksMeta}
          placeholder={t('search')}
        />
      </div>

      {/* Following + Recently Reported */}
      <div className="px-[20px] pt-[32px] pb-[40px]">
        <ConditionSourceLegend className="mb-5 px-1" />
        <div className="mb-8">
          <div className="flex items-center justify-between mx-[4px] mt-[0px] mb-[12px]">
            <h2 className="text-[11px] font-bold tracking-[1.2px] uppercase text-muted-foreground">
              {t('home_following')}
            </h2>
            {!user ? (
              <button
                type="button"
                className="text-[13px] font-bold text-primary"
                onClick={() =>
                  navigate('/auth/signin', { state: { redirectAfter: '/' } })
                }
              >
                {t('follow_signin_cta')}
              </button>
            ) : followingParks.length > 2 ? (
              <button
                type="button"
                className="text-[13px] font-bold text-primary"
                onClick={() => navigate('/search')}
              >
                {t('home_see_all')}
              </button>
            ) : null}
          </div>

          {!user ? (
            <div className="bg-card rounded-[16px] border-[1.5px] border-border px-4 py-5">
              <p className="text-[13px] text-muted-foreground leading-[19px]">
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
            <div className="bg-card rounded-[16px] border-[1.5px] border-border px-4 py-5">
              <p className="text-[13px] text-muted-foreground leading-[19px]">
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
          <h2 className="text-[11px] font-bold tracking-[1.2px] uppercase text-muted-foreground">
            {t('home_recently_reported')}
          </h2>
          <button
            className="text-[13px] font-bold text-primary"
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
          <div className="bg-card rounded-[16px] border-[1.5px] border-border shadow-sm p-8 text-center">
            <div className="size-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <Plus className="size-6 text-primary" />
            </div>
            <h3 className="text-[15.5px] font-bold text-foreground mb-2">{t('home_no_parks')}</h3>
            <p className="text-[13px] text-muted-foreground mb-6">
              {t('home_no_parks_body')}
            </p>
            <Button
              onClick={() => navigate('/search')}
              className="bg-primary hover:bg-[color:var(--primary-dark)] text-primary-foreground rounded-[14px] h-11"
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
          <div className="mt-6 pt-5 border-t border-border min-w-0">
            <p className="text-[15px] font-bold tracking-[-0.2px] text-foreground text-balance">
              {t('home_suggest_title')}
            </p>
            <p className="text-[13px] text-muted-foreground mt-1 leading-[19px] text-pretty">
              {t('home_suggest_body')}
            </p>
            <button
              type="button"
              onClick={() => setSuggestOpen(true)}
              className="mt-3.5 w-full min-h-[48px] h-auto py-3 px-4 rounded-[14px] border-[1.5px] border-primary text-primary text-[13px] font-bold tracking-[0.6px] leading-snug bg-card active:scale-[0.99] transition-transform whitespace-normal text-center"
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
