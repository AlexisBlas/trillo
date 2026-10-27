import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { FileText, Search, ChevronDown, ChevronRight } from 'lucide-react';
import { Skeleton } from '../components/ui/skeleton';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Input } from '../components/ui/input';
import { BackButton } from '../components/layout/BackButton';
import { ShareButton } from '../components/layout/ShareButton';
import { StatusWithHazards } from '../components/trail/StatusWithHazards';
import { OverallRatingLabel } from '../components/trail/OverallRatingLabel';
import { getOverallRating } from '../lib/schemas';
import { useParkReports } from '../hooks/useParkReports';
import { cleanNotes, formatUpdatedAgo, isReportFresh, getReportPath, normalizeSearchText, searchIncludes } from '../lib/text';
import { shareUrlFor } from '../lib/share';
import { useTrailReports } from '../hooks/useTrailReports';
import { formatDistanceToNow } from 'date-fns';
import { useLang, TranslationKey } from '../contexts/LangContext';
import { getParkCity, useParksMeta } from '../hooks/useParksMeta';

function statusShareLabel(status: 'green' | 'yellow' | 'red'): TranslationKey {
  if (status === 'green') return 'park_trail_status_good';
  if (status === 'yellow') return 'park_trail_status_fair';
  return 'park_trail_status_poor';
}

const STATUS_FILTERS: { value: 'all' | 'green' | 'yellow' | 'red'; labelKey: TranslationKey; dot: string | null; bg: string; text: string }[] = [
  { value: 'all', labelKey: 'reports_all', dot: null, bg: '#63B882', text: '#0E1510' },
  { value: 'green', labelKey: 'reports_filter_good', dot: '#63b882', bg: '#12352a', text: '#63b882' },
  { value: 'yellow', labelKey: 'reports_filter_caution', dot: '#C9A84A', bg: '#3a2e12', text: '#C9A84A' },
  { value: 'red', labelKey: 'reports_filter_closed', dot: '#C97A7A', bg: '#3a1616', text: '#C97A7A' },
];

export function ReportsPage() {
  const navigate = useNavigate();
  const { t } = useLang();
  const { data: reports, isLoading, error } = useTrailReports(100);
  const { byPark, hazardsByPark } = useParkReports();
  const [searchQuery, setSearchQuery] = useState('');
  const { data: parksMeta } = useParksMeta();
  const [statusFilter, setStatusFilter] = useState<'all' | 'green' | 'yellow' | 'red'>('all');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const q = normalizeSearchText(searchQuery);
  // When searching or filtering, expand every group so matches aren't hidden.
  const forceOpen = !!q || statusFilter !== 'all';

  const toggle = (park: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(park)) next.delete(park);
      else next.add(park);
      return next;
    });
  };

  const fresh = useMemo(
    () => (reports || []).filter((r) => isReportFresh(r.created_at, r.conditions)),
    [reports]
  );

  // Filter reports by status, then by trail name, park, city, notes, or hazard tags.
  const filtered = useMemo(() => {
    return fresh.filter((r) => {
      if (statusFilter !== 'all' && r.status !== statusFilter) return false;
      if (!q) return true;
      const park = r.park_name || r.trails?.location || null;
      const city = getParkCity(parksMeta, park);
      return (
        searchIncludes(r.trails?.name, q) ||
        searchIncludes(r.trails?.location, q) ||
        searchIncludes(r.park_name, q) ||
        searchIncludes(city, q) ||
        searchIncludes(r.notes, q) ||
        (r.conditions || []).some((c) => searchIncludes(c, q))
      );
    });
  }, [fresh, q, statusFilter, parksMeta]);

  const grouped = useMemo(
    () =>
      filtered.reduce<Record<string, typeof reports>>((acc, report) => {
        const park = report.park_name || report.trails?.location || 'Other';
        (acc[park] ||= [] as typeof reports)!.push(report);
        return acc;
      }, {}),
    [filtered]
  );

  return (
    <div className="min-h-screen bg-[#0E1510]">
      <div className="px-4 pt-3.5">
        <BackButton />
      </div>

      <div className="px-5 pt-6 pb-4">
        <h1 className="text-[24px] font-bold text-[#E6EBE6] mb-1">{t('reports_title')}</h1>
        <p className="text-[14px] text-[#A8C4A0] mb-5">{t('reports_grouped_by')}</p>

        <div className="relative">
          <Search className="absolute left-[17.5px] top-1/2 -translate-y-1/2 size-[18px] text-[#8B958C]" />
          <Input
            type="text"
            placeholder={t('reports_search_placeholder')}
            className="h-[45.5px] pl-[45px] pr-4 border-[1.5px] border-[#24302A] bg-[#151C18] text-[16px] shadow-sm rounded-[24px]"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2 mt-3 overflow-x-auto -mx-5 px-5 pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {STATUS_FILTERS.map((filter) => {
            const active = statusFilter === filter.value;
            const count =
              filter.value === 'all'
                ? fresh.length
                : fresh.filter((r) => r.status === filter.value).length;
            return (
              <button
                key={filter.value}
                onClick={() => setStatusFilter(filter.value)}
                className="shrink-0 inline-flex items-center gap-1.5 h-[34px] px-3.5 rounded-full border-[1.5px] text-[13px] font-bold transition-colors"
                style={{
                  backgroundColor: active ? filter.bg : '#ffffff',
                  color: active ? filter.text : '#9AA39C',
                  borderColor: active ? filter.text : '#24302A',
                }}
              >
                {filter.dot && (
                  <span
                    className="size-2 rounded-full"
                    style={{ backgroundColor: filter.dot }}
                  />
                )}
                {t(filter.labelKey)}
                <span className={active ? 'opacity-70' : 'opacity-60'}>{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="px-5 pt-2 pb-6">
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{t('park_load_error')}</AlertDescription>
          </Alert>
        )}

        {isLoading && (
          <div className="flex flex-col gap-[10px]">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-24 w-full rounded-[16px]" />
            ))}
          </div>
        )}

        {!isLoading && filtered.length === 0 && (
          <div className="bg-[#151C18] rounded-[16px] border-[1.5px] border-[#24302A] shadow-sm p-8 text-center">
            <div className="size-12 rounded-full bg-[#24302A] flex items-center justify-center mx-auto mb-4">
              {q || statusFilter !== 'all' ? (
                <Search className="size-6 text-[#9AA39C]" />
              ) : (
                <FileText className="size-6 text-[#9AA39C]" />
              )}
            </div>
            <h3 className="text-[15.5px] font-bold text-[#E6EBE6] mb-2">
              {q || statusFilter !== 'all' ? t('reports_no_match') : t('reports_none_yet')}
            </h3>
            <p className="text-[13px] text-[#9AA39C]">
              {q || statusFilter !== 'all' ? t('reports_no_match_hint') : t('reports_none_yet_hint')}
            </p>
          </div>
        )}

        {!isLoading && filtered.length > 0 && (
          <div className="flex flex-col gap-[10px]">
            {Object.entries(grouped)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([park, parkReports]) => {
                const parkTitle = park;
                const city = getParkCity(parksMeta, park);
                const isOpen = forceOpen || expanded.has(park);
                // Reports arrive newest-first, so the first one is the latest.
                const latestAgo = formatUpdatedAgo(parkReports![0]?.created_at);
                const parkHazards = hazardsByPark.get(park) ?? [];
                return (
                  <div
                    key={park}
                    className="bg-[#151C18] border-[1.5px] border-[#24302A] shadow-[0px_1px_1.5px_rgba(0,0,0,0.04)] overflow-hidden rounded-[32px]"
                  >
                    {/* Park header — main area opens overview, chevron toggles reports */}
                    <div className="flex items-stretch">
                      <button
                        onClick={() => navigate(`/parks/${encodeURIComponent(park)}`)}
                        className="flex-1 min-w-0 p-[15.5px] flex items-center gap-3.5 text-left hover:bg-[#1A221C] transition-colors rounded-l-[32px] rounded-r-[0px]"
                      >
                        <StatusWithHazards
                          status={byPark.get(park)?.status ?? null}
                          reported
                          conditions={parkHazards.map((h) => h.tag)}
                        />
                        <div className="flex-1 min-w-0">
                          <h3 className="text-[15.5px] font-bold tracking-[-0.2px] text-[#E6EBE6] truncate">
                            {parkTitle}
                          </h3>
                          <p className="text-[13px] text-[#9AA39C] truncate">
                            {city ?? ''}
                          </p>
                          <p className="text-[12px] text-[#8B958C] mt-0.5">
                            {parkReports!.length} {parkReports!.length === 1 ? t('home_report') : t('home_reports')}
                            {latestAgo && <span> · {latestAgo}</span>}
                          </p>
                        </div>
                      </button>
                      <button
                        onClick={() => toggle(park)}
                        aria-expanded={isOpen}
                        aria-label={isOpen ? `Collapse ${parkTitle} reports` : `Expand ${parkTitle} reports`}
                        className="shrink-0 px-4 flex items-center justify-center border-l-[1.5px] border-[#24302A] hover:bg-[#1A221C] transition-colors disabled:opacity-40"
                        disabled={forceOpen}
                      >
                        <ChevronDown
                          className={`size-5 text-[#8B958C] transition-transform ${
                            isOpen ? 'rotate-180' : ''
                          }`}
                        />
                      </button>
                    </div>

                    {/* Nested reports */}
                    {isOpen && (
                      <div className="border-t-[1.5px] border-[#24302A]">
                        {parkReports!.map((report) => {
                          const isParkReport = !report.trail_id && !!report.park_name;
                          const rawTrailName = report.trails?.name;
                          const trailName = isParkReport
                            ? t('park_report')
                            : rawTrailName?.includes(' - ')
                              ? rawTrailName.split(' - ').slice(1).join(' - ')
                              : rawTrailName || t('reports_unknown_trail');
                          const notes = cleanNotes(report.notes);
                          const path = getReportPath(report);
                          return (
                            <div
                              key={report.id}
                              className="w-full pl-[18px] pr-2 py-3 flex items-start gap-2 border-b-[1.5px] border-[#24302A] last:border-b-0"
                            >
                              <button
                                type="button"
                                onClick={() => path && navigate(path)}
                                disabled={!path}
                                className="flex-1 min-w-0 flex items-start gap-3 text-left hover:bg-[#1A221C] transition-colors rounded-[12px] py-0.5 disabled:opacity-50"
                              >
                                <StatusWithHazards
                                  status={report.status}
                                  reported
                                  conditions={report.conditions}
                                  className="mt-0.5"
                                />
                                <div className="flex-1 min-w-0">
                                  <h4 className="text-[14px] font-bold tracking-[-0.2px] text-[#E6EBE6] truncate">
                                    {trailName}
                                  </h4>
                                  <p className="text-[12px] text-[#8B958C]">
                                    {formatDistanceToNow(new Date(report.created_at), {
                                      addSuffix: true,
                                    })}
                                    {getOverallRating(report.conditions) && ' · '}
                                    <OverallRatingLabel conditions={report.conditions} />
                                  </p>
                                  {notes && (
                                    <p className="text-[13px] text-[#9AA39C] leading-[19px] mt-1 line-clamp-2">
                                      {notes}
                                    </p>
                                  )}
                                </div>
                                <ChevronRight className="size-4 text-[#8B958C] shrink-0 mt-1" />
                              </button>
                              {path && (
                                <ShareButton
                                  title={trailName}
                                  subtitle={parkTitle}
                                  url={shareUrlFor(path)}
                                  text={t('share_report_text').replace('{name}', trailName)}
                                  status={report.status}
                                  statusLabel={t(statusShareLabel(report.status))}
                                  className="shadow-none border-[1.5px] border-[#24302A] bg-[#151C18] mt-0.5"
                                />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        )}
      </div>
    </div>
  );
}
