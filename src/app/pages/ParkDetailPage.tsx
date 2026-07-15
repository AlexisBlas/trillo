import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router';
import { Mountain, ChevronRight, Sun, Users } from 'lucide-react';
import { Skeleton } from '../components/ui/skeleton';
import { Alert, AlertDescription } from '../components/ui/alert';
import { BackButton } from '../components/layout/BackButton';
import { StatusBadge } from '../components/trail/StatusBadge';
import { useTrails } from '../hooks/useTrails';
import { useParkReports } from '../hooks/useParkReports';
import { useWeather } from '../hooks/useWeather';
import { useParkMeta } from '../hooks/useHiddenParks';
import { StatusCircle } from '../components/trail/StatusCircle';
import { isReportFresh } from '../lib/text';
import { truncateWords, cleanNotes } from '../lib/text';
import { formatDistanceToNow } from 'date-fns';
import { useLang } from '../contexts/LangContext';

export function ParkDetailPage() {
  const navigate = useNavigate();
  const { t } = useLang();
  const { parkName } = useParams<{ parkName: string }>();
  const decoded = decodeURIComponent(parkName || '');
  const { data: trails, isLoading, error } = useTrails();
  const { byPark, data: allReports } = useParkReports();

  const statusByTrail = useMemo(() => {
    const map = new Map<string, 'green' | 'yellow' | 'red'>();
    for (const r of allReports || []) {
      if (!isReportFresh(r.created_at, r.conditions)) continue;
      if (!map.has(r.trail_id)) map.set(r.trail_id, r.status);
    }
    return map;
  }, [allReports]);
  const { data: weather, isLoading: weatherLoading } = useWeather(decoded);
  const { data: parkMeta } = useParkMeta(decoded);

  const parkTrails = useMemo(
    () => (trails || []).filter((t) => (t.location || 'Other') === decoded),
    [trails, decoded]
  );

  const summary = byPark.get(decoded);
  const lastUpdated = summary
    ? formatDistanceToNow(new Date(summary.createdAt), { addSuffix: true })
    : null;

  const parkTitle = decoded;

  const parkDescription = truncateWords(parkMeta?.description ?? null, 60);

  const handleReport = () => {
    if (!parkTrails.length) return;
    navigate(`/parks/${encodeURIComponent(decoded)}/report`);
  };

  return (
    <div className="min-h-screen bg-[#F5F0E8]">
      <div className="sticky top-0 z-40 bg-[#F5F0E8] px-4 pt-3.5 h-[52px] flex items-center border-b border-[#ede9e0]">
        <BackButton />
        <h1 className="absolute left-1/2 -translate-x-1/2 text-[16px] font-bold text-[#1a3010] truncate max-w-[60%] text-center">
          {parkTitle}
        </h1>
      </div>

      <div className="px-5 pt-5 pb-4">
        {summary && (
          <StatusBadge status={summary.status} className="mb-3" />
        )}

        <h2 className="text-[24px] font-bold text-[#1a3010] leading-[30px]">
          {decoded}
        </h2>
        {parkMeta?.city && (
          <p className="text-[13px] text-[#687588] mt-1">{parkMeta.city}</p>
        )}

        {parkDescription && (
          <p className="text-[14px] leading-[21px] text-[#374151] mt-3">
            {parkDescription}
          </p>
        )}

        <button
          onClick={handleReport}
          disabled={parkTrails.length === 0}
          className="mt-4 w-full h-[53px] bg-[#2c4a1e] rounded-[14px] text-white text-[13px] font-bold tracking-[1.5px] disabled:opacity-60"
        >
          {t('park_report_btn')}
        </button>
      </div>

      <div className="px-5 pt-2">
        <div className="flex items-center justify-between mb-3 px-[4px] py-[0px]">
          <h2 className="text-[11px] font-bold tracking-[1.2px] uppercase text-[#374151]">
            {t('park_current_conditions')}
          </h2>
          {lastUpdated && (
            <span className="text-[12px] text-[#4b5563]">{t('park_updated')} {lastUpdated}</span>
          )}
        </div>
        <div className="flex gap-2">
          <ConditionBox
            icon={<Sun className="size-5 text-[#f59e0b]" />}
            label={t('park_weather_label')}
            value={weather ? `${weather.temperatureF}°F` : weatherLoading ? '…' : '—'}
            sub={weather ? weather.condition : weatherLoading ? t('loading') : '—'}
          />
          <ConditionBox
            icon={<Mountain className="size-5 text-[#3a6b35]" />}
            label={t('trail_singular')}
            value={summary ? (summary.status === 'green' ? t('park_trail_status_good') : summary.status === 'yellow' ? t('park_trail_status_fair') : t('park_trail_status_poor')) : '—'}
            sub={t('park_surface_sub')}
          />
          <ConditionBox
            icon={<Users className="size-5 text-[#374151]" />}
            label={t('park_traffic_label')}
            value={t('park_traffic_value')}
            sub={t('park_traffic_sub')}
          />
        </div>

        {cleanNotes(summary?.notes) && (
          <div className="mt-4">
            <h3 className="text-[11px] font-bold tracking-[1.2px] uppercase text-[#374151] mb-2">
              {t('park_condition_summary')}
            </h3>
            <div className="bg-white rounded-[14px] border-[1.5px] border-[#f0ede6] p-4">
              <p className="text-[14px] leading-[22.4px] text-[#374151]">{cleanNotes(summary?.notes)}</p>
            </div>
          </div>
        )}
      </div>

      <div className="px-5 pt-6 pb-6">
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{t('park_load_error')}</AlertDescription>
          </Alert>
        )}

        {isLoading && (
          <div className="flex flex-col gap-[10px]">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-[72px] w-full rounded-[16px]" />
            ))}
          </div>
        )}

        {!isLoading && parkTrails.length === 0 && (
          <div className="bg-white rounded-[16px] border-[1.5px] border-[#f0ede6] shadow-sm p-8 text-center">
            <div className="size-12 rounded-full bg-[#f0ede6] flex items-center justify-center mx-auto mb-4">
              <Mountain className="size-6 text-[#374151]" />
            </div>
            <h3 className="text-[15.5px] font-bold text-[#1a1a1a] mb-2">{t('park_no_trails')}</h3>
            <p className="text-[13px] text-[#374151]">{t('park_no_trails_body')}</p>
          </div>
        )}

        {!isLoading && parkTrails.length > 0 && (
          <>
            <p className="text-[11px] font-bold tracking-[1.2px] uppercase text-[#374151] mb-3 px-[4px] py-[0px]">
              {parkTrails.length} {parkTrails.length === 1 ? t('trail_singular') : t('trail_plural')}
            </p>
            
            <div className="flex flex-col gap-[10px]">
              {parkTrails.map((trail) => {
                const displayName = trail.name.includes(' - ')
                  ? trail.name.split(' - ').slice(1).join(' - ')
                  : trail.name;
                return (
                  <button
                    key={trail.id}
                    onClick={() => navigate(`/trails/${trail.id}`)}
                    className="bg-white border-[1.5px] border-[#f0ede6] shadow-[0px_1px_1.5px_rgba(0,0,0,0.04)] hover:border-[#2c4a1e] transition-colors p-4 flex items-center gap-3 text-left rounded-[32px]"
                  >
                    <StatusCircle status={statusByTrail.get(trail.id) ?? null} size="sm" />
                    <div className="flex-1 min-w-0">
                      <h3 className="text-[15.5px] font-bold tracking-[-0.2px] text-[#1a1a1a] truncate">
                        {displayName}
                      </h3>
                      {trail.description && (
                        <p className="text-[12px] text-[#374151] truncate">
                          {trail.description}
                        </p>
                      )}
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

function ConditionBox({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div className="flex-1 bg-[#f9f7f2] border border-[#ede9e0] rounded-[12px] h-[108px] flex flex-col items-center justify-center px-2">
      <div className="mb-1">{icon}</div>
      <p className="text-[11px] font-medium tracking-[0.2px] text-[#4b5563]">{label}</p>
      <p className="text-[15px] font-bold text-[#1a1a1a] mt-0.5">{value}</p>
      <p className="text-[11.5px] text-[#374151]">{sub}</p>
    </div>
  );
}
