import { useMemo, useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router';
import { Mountain, ChevronRight, ChevronDown, Navigation } from 'lucide-react';
import { Skeleton } from '../components/ui/skeleton';
import { Alert, AlertDescription } from '../components/ui/alert';
import { BackButton } from '../components/layout/BackButton';
import { ShareButton } from '../components/layout/ShareButton';
import { FollowParkButton } from '../components/trail/FollowParkButton';
import { NewParkBadge } from '../components/trail/NewParkBadge';
import { shareUrlFor } from '../lib/share';
import { useTrails } from '../hooks/useTrails';
import { useParkReports } from '../hooks/useParkReports';
import { useParkDirections, useParkMeta } from '../hooks/useHiddenParks';
import { StatusCircle, STATUS_DOT } from '../components/trail/StatusCircle';
import { StatusWithHazards } from '../components/trail/StatusWithHazards';
import { ConditionSourceLegend } from '../components/trail/ConditionSourceLegend';
import { OverallRatingLabel } from '../components/trail/OverallRatingLabel';
import { HazardNotice } from '../components/trail/HazardNotice';
import { HazardTrailCarousel } from '../components/trail/HazardTrailCarousel';
import { getCriticalHazards, mergeCriticalHazards } from '../lib/hazards';
import {
  isReportFresh,
  cleanNotes,
  pickLocalizedText,
  isValidTrailId,
  formatRelativeTime,
} from '../lib/text';
import { useLang, TranslationKey } from '../contexts/LangContext';
import { isParkNew } from '../hooks/useParksMeta';
import { directionsHref as buildDirectionsHref } from '../lib/directions';
import {
  getEffectiveParkStatus,
  useConditionEstimates,
} from '../hooks/useConditionEstimates';
import { cn } from '../components/ui/utils';

type TrailStatus = 'green' | 'yellow' | 'red';

const STATUS_RANK: Record<TrailStatus, number> = { red: 0, yellow: 1, green: 2 };

const STATUS_LABEL: Record<TrailStatus, TranslationKey> = {
  green: 'park_trail_status_good',
  yellow: 'park_trail_status_fair',
  red: 'park_trail_status_poor',
};

const STATUS_TEXT: Record<TrailStatus, string> = {
  green: STATUS_DOT.green,
  yellow: STATUS_DOT.yellow,
  red: STATUS_DOT.red,
};

export function ParkDetailPage() {
  const navigate = useNavigate();
  const { t, lang } = useLang();
  const { parkName } = useParams<{ parkName: string }>();
  const decoded = decodeURIComponent(parkName || '');
  const { data: trails, isLoading, error } = useTrails();
  const { byPark, data: allReports } = useParkReports();
  const { byPark: estimatesByPark } = useConditionEstimates();
  const { data: parkMeta } = useParkMeta(decoded);
  const { data: parkDirections } = useParkDirections(decoded);
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

  const reportByTrail = useMemo(() => {
    const map = new Map<string, { status: TrailStatus; createdAt: string }>();
    for (const r of allReports || []) {
      if (!isValidTrailId(r.trail_id)) continue;
      if (!isReportFresh(r.created_at, r.conditions)) continue;
      if (!map.has(r.trail_id)) {
        map.set(r.trail_id, { status: r.status, createdAt: r.created_at });
      }
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

  const parkEstimate = estimatesByPark.get(decoded);

  const sortedTrails = useMemo(() => {
    return [...parkTrails].sort((a, b) => {
      const aEff = getEffectiveParkStatus(reportByTrail.get(a.id) ?? null, parkEstimate);
      const bEff = getEffectiveParkStatus(reportByTrail.get(b.id) ?? null, parkEstimate);
      const aRank = aEff.status ? STATUS_RANK[aEff.status] : 3;
      const bRank = bEff.status ? STATUS_RANK[bEff.status] : 3;
      if (aRank !== bRank) return aRank - bRank;
      return a.name.localeCompare(b.name);
    });
  }, [parkTrails, reportByTrail, parkEstimate]);

  const reportSummary = byPark.get(decoded);
  const { status: effectiveStatus, source: statusSource, rainAdjusted } =
    getEffectiveParkStatus(
      reportSummary
        ? { status: reportSummary.status, createdAt: reportSummary.createdAt }
        : null,
      parkEstimate
    );
  const summaryNotes = cleanNotes(reportSummary?.notes);
  const summaryHazards = getCriticalHazards(reportSummary?.conditions);
  const statusText = effectiveStatus ? STATUS_TEXT[effectiveStatus] : null;

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
    if (rainAdjusted) {
      return {
        label: t('condition_rain_adjusted'),
        value: t('condition_from_rain'),
      };
    }
    if (statusSource === 'estimate') {
      return {
        label: t('condition_estimated'),
        value: t('condition_from_rain'),
      };
    }
    if (!reportSummary?.createdAt) return null;
    const value = formatRelativeTime(reportSummary.createdAt, lang);
    if (!value) return null;
    return {
      label: t('park_updated'),
      value,
    };
  }, [reportSummary?.createdAt, statusSource, rainAdjusted, t, lang]);

  const directionsHref = buildDirectionsHref(parkDirections, decoded);

  const handleReport = () => {
    if (!parkTrails.length) return;
    navigate(`/parks/${encodeURIComponent(decoded)}/report`);
  };

  const statusWord = (status: TrailStatus | null | undefined) => {
    if (!status) return t('park_trail_status_unknown');
    return t(STATUS_LABEL[status]);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm px-4 pt-3.5 h-[52px] flex items-center justify-between">
        <BackButton />
        <h1 className="absolute left-1/2 -translate-x-1/2 text-[16px] font-bold text-foreground truncate max-w-[55%] text-center">
          {decoded}
        </h1>
        <ShareButton
          title={decoded}
          subtitle={parkMeta?.city}
          url={shareUrlFor(`/parks/${encodeURIComponent(decoded)}`)}
          text={t('share_report_text').replace('{name}', decoded)}
          status={reportSummary?.status ?? null}
          statusLabel={
            reportSummary ? t(STATUS_LABEL[reportSummary.status]) : null
          }
          notes={summaryNotes}
          conditions={reportSummary?.conditions ?? null}
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
        <p className="text-[12px] font-medium text-muted-foreground tracking-[0.2px]">
          {[parkMeta?.city, parkTrails.length
            ? `${parkTrails.length} ${parkTrails.length === 1 ? t('trail_singular') : t('trail_plural')}`
            : null]
            .filter(Boolean)
            .join(' · ')}
        </p>
        <div className="mt-1 flex items-start justify-between gap-3">
          <div className="min-w-0 flex items-start gap-2">
            <h2 className="text-[28px] font-bold text-foreground leading-[32px] tracking-[-0.6px] text-balance min-w-0">
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
              className={`text-[15px] leading-[23px] text-muted-foreground text-pretty ${
                descExpanded ? '' : 'line-clamp-2'
              }`}
            >
              {parkDescription}
            </p>
            {(descOverflows || descExpanded) && (
              <button
                type="button"
                onClick={() => setDescExpanded((v) => !v)}
                className="mt-1.5 text-[13px] font-bold text-primary hover:text-[color:var(--primary-dark)] transition-colors"
              >
                {descExpanded ? t('park_show_less') : t('park_show_more')}
              </button>
            )}
          </div>
        )}

        {/* Conditions: tinted status, meta band, legend · hazards/notes below */}
        <section
          className="mt-4 bg-card rounded-[24px] border border-border overflow-hidden"
          aria-label={t('park_current_conditions')}
        >
          <div className="px-5 pt-5 pb-5">
            <p className="text-[13px] text-muted-foreground leading-none">
              {t('park_current_conditions')}
            </p>

            <div
              className="mt-4 flex items-center gap-3 min-w-0 rounded-[18px] px-4 py-4 border"
              style={{
                backgroundColor: statusText
                  ? `color-mix(in srgb, ${statusText} 28%, transparent)`
                  : 'var(--secondary)',
                borderColor: statusText ?? 'var(--border)',
              }}
            >
              <StatusCircle
                status={effectiveStatus}
                reported={statusSource === 'report'}
                className="shrink-0"
              />
              <p
                className="text-[clamp(1.75rem,8.2vw,2.75rem)] font-bold tracking-[-1.2px] leading-none truncate"
                style={{ color: statusText ?? 'var(--foreground)' }}
              >
                {effectiveStatus ? t(STATUS_LABEL[effectiveStatus]) : '—'}
              </p>
            </div>

            <div className="mt-4 rounded-[16px] border border-border bg-secondary/50 px-4 py-3.5">
              <div className="flex divide-x divide-border">
                <div className="min-w-0 flex-1 pr-4 flex flex-col justify-center">
                  <OverallRatingLabel
                    conditions={reportSummary?.conditions}
                    className="block text-[13px] text-muted-foreground"
                  />
                </div>
                <div className="min-w-0 flex-1 pl-4">
                  {updateMeta ? (
                    <>
                      <p className="text-[12px] text-muted-foreground leading-none">
                        {updateMeta.label}
                      </p>
                      <p className="mt-1.5 text-[15px] font-bold text-foreground leading-none tabular-nums">
                        {updateMeta.value}
                      </p>
                    </>
                  ) : (
                    <p className="text-[13px] text-muted-foreground leading-snug">
                      {t('park_report_to_update')}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-border px-5 py-4 bg-secondary/25">
            <ConditionSourceLegend />
          </div>

          {trailHazardSlides.length > 0 ? (
            <div className="border-t border-border px-4 py-3">
              <HazardTrailCarousel slides={trailHazardSlides} />
            </div>
          ) : summaryHazards.length > 0 ? (
            <div className="border-t border-border px-4 py-3">
              <HazardNotice conditions={reportSummary?.conditions} />
            </div>
          ) : null}

          {summaryNotes ? (
            <div className="border-t border-border px-4 py-3">
              <div className="rounded-[16px] border border-border bg-background/40 px-4 py-3.5">
                <p className="text-[14px] leading-[21px] text-muted-foreground text-pretty">
                  {summaryNotes}
                </p>
              </div>
            </div>
          ) : null}
        </section>

        <div className="mt-4 flex flex-col gap-2.5">
          <button
            onClick={handleReport}
            disabled={parkTrails.length === 0}
            className="w-full h-[52px] bg-primary rounded-[14px] text-primary-foreground text-[13px] font-bold tracking-[1.5px] disabled:opacity-60 active:scale-[0.99] transition-transform"
          >
            {t('park_report_btn')}
          </button>
          {directionsHref && (
            <a
              href={directionsHref}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={t('park_directions_aria').replace('{name}', decoded)}
              className="w-full h-[52px] inline-flex items-center justify-center gap-2 rounded-[14px] border border-border bg-card text-foreground text-[13px] font-bold tracking-[1.5px] hover:border-primary/50 active:scale-[0.99] transition-[transform,border-color]"
            >
              <Navigation className="size-4 text-primary" strokeWidth={2.5} aria-hidden />
              {t('park_directions_btn')}
            </a>
          )}
        </div>
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
          <div className="bg-card rounded-[20px] border border-border p-8 text-center">
            <div className="size-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <Mountain className="size-6 text-muted-foreground" />
            </div>
            <h3 className="text-[15.5px] font-bold text-foreground mb-2">{t('park_no_trails')}</h3>
            <p className="text-[13px] text-muted-foreground">{t('park_no_trails_body')}</p>
          </div>
        )}

        {!isLoading && sortedTrails.length > 0 && (
          <div className="bg-card rounded-[20px] border border-border overflow-hidden">
            <button
              type="button"
              onClick={() => setTrailsOpen((v) => !v)}
              aria-expanded={trailsOpen}
              className="w-full flex items-center justify-between gap-3 px-4 py-3.5 text-left active:bg-secondary transition-colors"
            >
              <div className="min-w-0">
                <p className="text-[15px] font-bold tracking-[-0.2px] text-foreground">
                  {t('park_trails_by_condition')}
                </p>
                <p className="text-[12px] text-muted-foreground mt-0.5">
                  {sortedTrails.length}{' '}
                  {sortedTrails.length === 1 ? t('trail_singular') : t('trail_plural')}
                </p>
              </div>
              <ChevronDown
                className={cn(
                  'size-5 text-muted-foreground shrink-0 transition-transform duration-200',
                  trailsOpen && 'rotate-180'
                )}
              />
            </button>

            {trailsOpen && (
              <div className="flex flex-col gap-2 px-3 pb-3 border-t border-border pt-3">
                {sortedTrails.map((trail) => {
                  const displayName = trail.name.includes(' - ')
                    ? trail.name.split(' - ').slice(1).join(' - ')
                    : trail.name;
                  const report = reportByTrail.get(trail.id) ?? null;
                  const {
                    status,
                    source: trailSource,
                    rainAdjusted: trailRainAdjusted,
                  } = getEffectiveParkStatus(report, parkEstimate);
                  const trailHazards = hazardsByTrail.get(trail.id) ?? [];
                  const hazardTags = trailHazards.map((h) => h.tag);
                  return (
                    <button
                      key={trail.id}
                      type="button"
                      onClick={() => navigate(`/trails/${trail.id}`)}
                      className="bg-secondary border border-border hover:border-primary/40 transition-colors pl-3.5 pr-3.5 py-3 flex items-center gap-3 text-left rounded-[16px] active:scale-[0.99] overflow-visible"
                    >
                      <StatusWithHazards
                        status={status}
                        reported={trailSource === 'report'}
                        conditions={hazardTags}
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="text-[15px] font-bold tracking-[-0.2px] text-foreground truncate">
                          {displayName}
                        </h3>
                        {trailSource === 'estimate' && (
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            {trailRainAdjusted
                              ? t('condition_rain_adjusted')
                              : t('condition_estimated')}
                          </p>
                        )}
                      </div>
                      <span
                        className="shrink-0 text-[12px] font-bold"
                        style={{ color: status ? STATUS_TEXT[status] : 'var(--text-tertiary)' }}
                      >
                        {statusWord(status)}
                      </span>
                      <ChevronRight className="size-4 text-muted-foreground shrink-0" />
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
