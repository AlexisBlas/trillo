import image_eltrillo_hero_4 from '@/imports/eltrillo_hero-4.jpg'
import image_eltrillo_hero_3 from '@/imports/eltrillo_hero-3.jpg'
import image_eltrillo_hero_2 from '@/imports/eltrillo_hero-2.jpg'
import image_eltrillo_hero_1 from '@/imports/eltrillo_hero-1.jpg'
import image_eltrillo_hero from '@/imports/eltrillo_hero.jpg'
import image_Generated_Image_July_07__2026___2_14PM from '@/imports/Generated_Image_July_07__2026_-_2_14PM.png'
import image_tscope_hero_img_1 from '@/imports/tscope-hero-img-1.png'
import image_tscope_hero_img from '@/imports/tscope-hero-img.png'
import image_hero_img_fi_5 from '@/imports/hero-img-fi-5.png'
import image_hero_img_fi_4 from '@/imports/hero-img-fi-4.png'
import image_hero_img_fi_3 from '@/imports/hero-img-fi-3.png'
import image_hero_img_fi_2 from '@/imports/hero-img-fi-2.png'
import image_hero_img_fi_1 from '@/imports/hero-img-fi-1.png'
import image_hero_img_fi from '@/imports/hero-img-fi.png'
import { useMemo, useState } from 'react';
import { Search, Plus, Database, MapPin, Mountain, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router';
import { TopNav } from '../components/layout/TopNav';
import { Skeleton } from '../components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { useTrails } from '../hooks/useTrails';
import { useTrailReports } from '../hooks/useTrailReports';
import { useParkReports } from '../hooks/useParkReports';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { StatusCircle } from '../components/trail/StatusCircle';
import { isReportFresh, formatUpdatedAgo } from '../lib/text';
import { Trail } from '../lib/supabase';
import { useLang } from '../contexts/LangContext';
import heroImage from '../../imports/her-img-3.png';

type Park = { name: string; city: string | null; trails: Trail[] };

export function Home() {
  const navigate = useNavigate();
  const { t } = useLang();
  const { data: trails, isLoading, error } = useTrails();
  const { data: reports } = useTrailReports(200);
  const { byPark } = useParkReports();
  const { data: parksMeta } = useQuery({
    queryKey: ['parks-meta-public'],
    queryFn: async () => {
      const { data } = await supabase.from('parks').select('name, city');
      return new Map((data ?? []).map((p: { name: string; city: string | null }) => [p.name, p.city ?? null]));
    },
    staleTime: 5 * 60 * 1000,
  });
  const [searchQuery, setSearchQuery] = useState('');

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
    const map = new Map<string, Trail[]>();
    for (const t of trails || []) {
      const park = t.location || 'Other';
      if (!map.has(park)) map.set(park, []);
      map.get(park)!.push(t);
    }
    return Array.from(map.entries())
      .map(([name, parkTrails]) => ({
        name,
        city: parksMeta?.get(name) ?? null,
        trails: parkTrails,
      }))
      .sort((a, b) => b.trails.length - a.trails.length);
  }, [trails, parksMeta]);

  const q = searchQuery.trim().toLowerCase();

  const suggestions = useMemo(() => {
    if (!q) return { parks: [] as Park[], trails: [] as Trail[] };
    const parkMatches = parks
      .filter((p) => p.name.toLowerCase().includes(q))
      .slice(0, 4);
    const trailMatches = (trails || [])
      .filter((t) => {
        const displayName = t.name.includes(' - ') ? t.name.split(' - ').slice(1).join(' - ') : t.name;
        return (
          displayName.toLowerCase().includes(q) ||
          t.name.toLowerCase().includes(q) ||
          t.location?.toLowerCase().includes(q)
        );
      })
      .slice(0, 6);
    return { parks: parkMatches, trails: trailMatches };
  }, [q, parks, trails]);

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

  return (
    <div className="min-h-screen bg-[#F5F0E8]">
      <TopNav />

      <div className="px-[0px] p-[0px]">
        <img
          src={image_eltrillo_hero_4}
          alt="Hikers, a runner, and a mountain biker among green peaks"
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
                              <p className="text-[14px] font-bold text-[#1a1a1a] truncate">
                                {parkTitle}
                              </p>
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

      {/* Recently Reported Parks */}
      <div className="px-[20px] pt-[32px] pb-[40px]">
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
            {recentParks.map((park) => {
              const parkTitle = park.name;
              const updatedAgo = formatUpdatedAgo(byPark.get(park.name)?.createdAt);
              return (
                <button
                  key={park.name}
                  onClick={() => navigate(`/parks/${encodeURIComponent(park.name)}`)}
                  className="bg-white border-[1.5px] border-[#f0ede6] shadow-[0px_1px_1.5px_rgba(0,0,0,0.04)] hover:border-[#2c4a1e] transition-colors p-[15.5px] flex items-center gap-3.5 text-left rounded-[32px]"
                >
                  <StatusCircle status={byPark.get(park.name)?.status ?? null} size="md" />
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[15.5px] font-bold tracking-[-0.2px] text-[#1a1a1a] truncate">
                      {parkTitle}
                    </h3>
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
            })}
          </div>
        )}
      </div>
    </div>
  );
}
