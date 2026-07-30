import { useMemo, useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router';
import { Mountain, ChevronRight, ChevronDown } from 'lucide-react';
import { Skeleton } from '../components/ui/skeleton';
import { Alert, AlertDescription } from '../components/ui/alert';
import { BackButton } from '../components/layout/BackButton';
import { ShareButton } from '../components/layout/ShareButton';
import { FollowParkButton } from '../components/trail/FollowParkButton';
import { NewParkBadge } from '../components/trail/NewParkBadge';
import { shareUrlFor } from '../lib/share';
import { useTrails } from '../hooks/useTrails';
import { useParkReports } from '../hooks/useParkReports';
import { useParkMeta } from '../hooks/useHiddenParks';
import { StatusCircle } from '../components/trail/StatusCircle';
import { StatusWithHazards } from '../components/trail/StatusWithHazards';
import { HazardNotice } from '../components/trail/HazardNotice';
import { HazardTrailCarousel } from '../components/trail/HazardTrailCarousel';
import { getCriticalHazards, mergeCriticalHazards } from '../lib/hazards';
import {
  isReportFresh,
  cleanNotes,
  pickLocalizedText,
  isValidTrailId,
} from '../lib/text';
import { useLang, TranslationKey } from '../contexts/LangContext';
import { isParkNew } from '../hooks/useParksMeta';
import { cn } from '../components/ui/utils';

type TrailStatus = 'green' | 'yellow' | 'red';

const STATUS_RANK: Record<TrailStatus, number> = { red: 0, yellow: 1, green: 2 };

const STATUS_LABEL: Record<TrailStatus, TranslationKey> = {
  green: 'park_trail_status_good',
  yellow: 'park_trail_status_fair',
  red: 'park_trail_status_poor',
};

const STATUS_TEXT: Record<TrailStatus, string> = {
  green: '#346538',
  yellow: '#92400e',
  red: '#9f2f2d',
};

export function ParkDetailPage() {
  const navigate = useNavigate();
  const { t, lang } = useLang();
  const { parkName } = useParams<{ parkName: string }>();
  const decoded = decodeURIComponent(parkName || '');
  const { data: trails, isLoading, error } = useTrails();
  const { byPark, data: allReports } = useParkReports();
  const { data: parkMeta } = useParkMeta(decoded);
  const [descExpanded, setDescExpanded] = useState(false);
  const [descOverflows, setDescOverflows] = useState(false);
  const [trailsOpen, setTrailsOpen] = useState(false);
  const descRef = useRef<HTMLParagraphElement>(null);

  const parkDescription = pickLocalizedText(
    parkMeta?.description,
    parkMeta?.description_es,
    lang
  );

  useEffect(() => {
    setDescExpanded(false);
    setTrailsOpen(false);
  }, [decoded, parkDescription]);

  useEffect(() => {
    const el = descRef.current;
    if (!el || !parkDescription) {
      setDescOverflows(false);
      return;
    }
    // Measure while clamped so we know if a toggle is needed
    const measure = () => {
      if (descExpanded) {
        // Keep showing the button once we know it overflows
        return;
      }
      setDescOverflows(el.scrollHeight > el.clientHeight + 1);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [parkDescription, descExpanded, lang]);

  const statusByTrail = useMemo(() => {
    const map = new Map<string, TrailStatus>();
    for (const r of allReports || []) {
      if (!isValidTrailId(r.trail_id)) continue;
      if (!isReportFresh(r.created_at, r.conditions)) continue;
      if (!map.has(r.trail_id)) map.set(r.trail_id, r.status);
    }
    return map;
  }, [allReports]);

  const hazardsByTrail = useMemo(() => {
    const listsByTrail = new Map<string, Array<string[] | null | undefined>>();
    for (const r of allReports || []) {
      if (!isValidTrailId(r.trail_id)) continue;
      if (!isReportFresh(r.created_at, r.conditions)) continue;
      const lists = listsByTrail.get(r.trail_id) ?? [];
      lists.push(r.conditions);
      listsByTrail.set(r.trail_id, lists);
    }
    const map = new Map<string, ReturnType<typeof getCriticalHazards>>();
    for (const [trailId, lists] of listsByTrail) {
      const hazards = mergeCriticalHazards(...lists);
      if (hazards.length > 0) map.set(trailId, hazards);
    }
    return map;
  }, [allReports]);

  const parkTrails = useMemo(
    () => (trails || []).filter((trail) => (trail.location || 'Other') === decoded),
    [trails, decoded]
  );

  const sortedTrails = useMemo(() => {
    return [...parkTrails].sort((a, b) => {
      const aStatus = statusByTrail.get(a.id);
      const bStatus = statusByTrail.get(b.id);
      const aRank = aStatus ? STATUS_RANK[aStatus] : 3;
      const bRank = bStatus ? STATUS_RANK[bStatus] : 3;
      if (aRank !== bRank) return aRank - bRank;
      return a.name.localeCompare(b.name);
    });
  }, [parkTrails, statusByTrail]);

  const summary = byPark.get(decoded);
  const summaryNotes = cleanNotes(summary?.notes);
  const summaryHazards = getCriticalHazards(summary?.conditions);
  const statusText = summary ? STATUS_TEXT[summary.status] : null;

  const trailHazardSlides = useMemo(() => {
    return sortedTrails
      .map((trail) => {
        const hazards = hazardsByTrail.get(trail.id) ?? [];
        if (hazards.length === 0) return null;
        const displayName = trail.name.includes(' - ')
          ? trail.name.split(' - ').slice(1).join(' - ')
          : trail.name;
        return {
          id: trail.id,
          trailName: displayName,
          conditions: hazards.map((h) => h.tag),
        };
      })
      .filter(
        (row): row is { id: string; trailName: string; conditions: string[] } =>
          !!row
      );
  }, [sortedTrails, hazardsByTrail]);

  const updateMeta = useMemo(() => {
    if (!summary?.createdAt) return null;
    const diffMs = Date.now() - new Date(summary.createdAt).getTime();
    if (Number.isNaN(diffMs)) return null;
    const minutes = Math.floor(diffMs / (60 * 1000));
    if (minutes < 1) {
      return {
        label: t('park_updated'),
        value: t('park_updated_just_now').toLowerCase(),
      };
    }
    const value =
      minutes < 60
        ? `${minutes}m`
        : minutes < 24 * 60
          ? `${Math.floor(minutes / 60)}h`
          : `${Math.floor(minutes / (24 * 60))}d`;
    // EN: "39m ago" · ES: "hace 39m"
    return {
      label: t('park_updated'),
      value:
        lang === 'es'
          ? `${t('park_updated_ago')} ${value}`
          : `${value} ${t('park_updated_ago')}`,
    };
  }, [summary?.createdAt, t, lang]);

  const handleReport = () => {
    if (!parkTrails.length) return;
    navigate(`/parks/${encodeURIComponent(decoded)}/report`);
  };

  const statusWord = (status: TrailStatus | null | undefined) => {
    if (!status) return t('park_trail_status_unknown');
    return t(STATUS_LABEL[status]);
  };

  return (
    <div className="min-h-screen bg-[#F5F0E8]">
      <div className="sticky top-0 z-40 bg-[#F5F0E8]/95 backdrop-blur-sm px-4 pt-3.5 h-[52px] flex items-center justify-between">
        <BackButton />
        <h1 className="absolute left-1/2 -translate-x-1/2 text-[16px] font-bold text-[#1a3010] truncate max-w-[55%] text-center">
          {decoded}
        </h1>
        <ShareButton
          title={decoded}
          subtitle={parkMeta?.city}
          url={shareUrlFor(`/parks/${encodeURIComponent(decoded)}`)}
          text={t('share_report_text').replace('{name}', decoded)}
          status={summary?.status ?? null}
          statusLabel={summary ? t(STATUS_LABEL[summary.status]) : null}
          notes={summaryNotes}
          conditions={summary?.conditions ?? null}
          hazards={
            trailHazardSlides.length > 0
              ? trailHazardSlides
                  .flatMap((slide) =>
                    getCriticalHazards(slide.conditions).map((h) => ({
                      label: t(h.labelKey),
                      detail: slide.trailName,
                      note: t(h.noteKey),
                      kind: h.id,
                    }))
                  )
                  .slice(0, 2)
              : undefined
          }
          updatedLabel={updateMeta?.label}
          updatedValue={updateMeta?.value}
        />
      </div>

      <div className="px-5 pt-6 pb-4">
        <p className="text-[12px] font-medium text-[#687588] tracking-[0.2px]">
          {[parkMeta?.city, parkTrails.length
            ? `${parkTrails.length} ${parkTrails.length === 1 ? t('trail_singular') : t('trail_plural')}`
            : null]
            .filter(Boolean)
            .join(' · ')}
        </p>
        <div className="mt-1 flex items-start justify-between gap-3">
          <div className="min-w-0 flex items-start gap-2">
            <h2 className="text-[28px] font-bold text-[#1a3010] leading-[32px] tracking-[-0.6px] text-balance min-w-0">
              {decoded}
            </h2>
            {isParkNew(parkMeta?.created_at) && (
              <NewParkBadge className="mt-2" />
            )}
          </div>
          <FollowParkButton parkName={decoded} variant="pill" className="shrink-0 mt-0.5" />
        </div>

        {parkDescription && (
          <div className="mt-3 max-w-[36rem]">
            <p
              ref={descRef}
              className={`text-[15px] leading-[23px] text-[#4b5563] text-pretty ${
                descExpanded ? '' : 'line-clamp-2'
              }`}
            >
              {parkDescription}
            </p>
            {(descOverflows || descExpanded) && (
              <button
                type="button"
                onClick={() => setDescExpanded((v) => !v)}
                className="mt-1.5 text-[13px] font-bold text-[#2c4a1e] hover:text-[#1a3010] transition-colors"
              >
                {descExpanded ? t('park_show_less') : t('park_show_more')}
              </button>
            )}
          </div>
        )}

        {/* Conditions: large status | update · notes below */}
        <section
          className="mt-4 bg-white rounded-[24px] border border-[#ebe6dc] overflow-hidden"
          aria-label={t('park_current_conditions')}
        >
          <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-0 px-5 pt-5 pb-5">
            <div className="pr-4 min-w-0">
              <p className="text-[13px] text-[#6b7280] leading-none">
                {t('park_current_conditions')}
              </p>
              <div className="mt-3 flex items-center gap-2.5 min-w-0">
                <StatusCircle status={summary?.status ?? null} className="shrink-0" />
                <p
                  className="text-[clamp(1.75rem,8.2vw,2.75rem)] font-bold tracking-[-1.2px] leading-none whitespace-nowrap"
                  style={{ color: statusText ?? '#1a1a1a' }}
                >
                  {summary ? t(STATUS_LABEL[summary.status]) : '—'}
                </p>
              </div>
            </div>

            <div className="pl-4 border-l border-[#e5e7eb] flex flex-col justify-center shrink-0 max-w-[38%]">
              {updateMeta ? (
                <div>
                  <p className="text-[13px] font-normal text-[#6b7280] leading-none">
                    {updateMeta.label}
                  </p>
                  <p className="mt-1.5 text-[18px] sm:text-[20px] font-bold tracking-[-0.4px] text-[#1a1a1a] leading-none tabular-nums whitespace-nowrap">
                    {updateMeta.value}
                  </p>
                </div>
              ) : (
                <p className="text-[13px] font-normal text-[#6b7280] leading-snug max-w-[7.5rem]">
                  {t('park_report_to_update')}
                </p>
              )}
            </div>
          </div>

          {trailHazardSlides.length > 0 ? (
            <HazardTrailCarousel slides={trailHazardSlides} className="mx-4 mb-3" />
          ) : summaryHazards.length > 0 ? (
            <div className="mx-4 mb-3">
              <HazardNotice conditions={summary?.conditions} />
            </div>
          ) : null}

          {summaryNotes ? (
            <div className="mx-4 mb-4 rounded-[16px] bg-[#f5f2ec] px-4 py-3.5">
              <p className="text-[14px] leading-[21px] text-[#374151] text-pretty">
                {summaryNotes}
              </p>
            </div>
          ) : null}
        </section>

        <button
          onClick={handleReport}
          disabled={parkTrails.length === 0}
          className="mt-4 w-full h-[52px] bg-[#2c4a1e] rounded-[14px] text-white text-[13px] font-bold tracking-[1.5px] disabled:opacity-60 active:scale-[0.99] transition-transform"
        >
          {t('park_report_btn')}
        </button>
      </div>

      <div className="px-5 pt-3 pb-8">
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{t('park_load_error')}</AlertDescription>
          </Alert>
        )}

        {isLoading && (
          <div className="flex flex-col gap-[10px]">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-[72px] w-full rounded-[20px]" />
            ))}
          </div>
        )}

        {!isLoading && parkTrails.length === 0 && (
          <div className="bg-white rounded-[20px] border border-[#ebe6dc] p-8 text-center">
            <div className="size-12 rounded-full bg-[#f0ede6] flex items-center justify-center mx-auto mb-4">
              <Mountain className="size-6 text-[#374151]" />
            </div>
            <h3 className="text-[15.5px] font-bold text-[#1a1a1a] mb-2">{t('park_no_trails')}</h3>
            <p className="text-[13px] text-[#374151]">{t('park_no_trails_body')}</p>
          </div>
        )}

        {!isLoading && sortedTrails.length > 0 && (
          <div className="bg-white rounded-[20px] border border-[#ebe6dc] overflow-hidden">
            <button
              type="button"
              onClick={() => setTrailsOpen((v) => !v)}
              aria-expanded={trailsOpen}
              className="w-full flex items-center justify-between gap-3 px-4 py-3.5 text-left active:bg-[#fafaf8] transition-colors"
            >
              <div className="min-w-0">
                <p className="text-[15px] font-bold tracking-[-0.2px] text-[#1a1a1a]">
                  {t('park_trails_by_condition')}
                </p>
                <p className="text-[12px] text-[#8a8478] mt-0.5">
                  {sortedTrails.length}{' '}
                  {sortedTrails.length === 1 ? t('trail_singular') : t('trail_plural')}
                </p>
              </div>
              <ChevronDown
                className={cn(
                  'size-5 text-[#8a8478] shrink-0 transition-transform duration-200',
                  trailsOpen && 'rotate-180'
                )}
              />
            </button>

            {trailsOpen && (
              <div className="flex flex-col gap-2 px-3 pb-3 border-t border-[#f0ede6] pt-3">
                {sortedTrails.map((trail) => {
                  const displayName = trail.name.includes(' - ')
                    ? trail.name.split(' - ').slice(1).join(' - ')
                    : trail.name;
                  const status = statusByTrail.get(trail.id) ?? null;
                  const trailHazards = hazardsByTrail.get(trail.id) ?? [];
                  const hazardTags = trailHazards.map((h) => h.tag);
                  return (
                    <button
                      key={trail.id}
                      type="button"
                      onClick={() => navigate(`/trails/${trail.id}`)}
                      className="bg-[#fafaf8] border border-[#ebe6dc] hover:border-[#2c4a1e]/40 transition-colors pl-3.5 pr-3.5 py-3 flex items-center gap-3 text-left rounded-[16px] active:scale-[0.99] overflow-visible"
                    >
                      <StatusWithHazards status={status} conditions={hazardTags} />
                      <div className="flex-1 min-w-0">
                        <h3 className="text-[15px] font-bold tracking-[-0.2px] text-[#1a1a1a] truncate">
                          {displayName}
                        </h3>
                      </div>
                      <span
                        className="shrink-0 text-[12px] font-bold"
                        style={{ color: status ? STATUS_TEXT[status] : '#8a8478' }}
                      >
                        {statusWord(status)}
                      </span>
                      <ChevronRight className="size-4 text-[#c4c0b6] shrink-0" />
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
