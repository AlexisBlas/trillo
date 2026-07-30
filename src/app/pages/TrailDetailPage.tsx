import { useParams, useNavigate } from 'react-router';
import { Mountain } from 'lucide-react';
import { Skeleton } from '../components/ui/skeleton';
import { Alert, AlertDescription } from '../components/ui/alert';
import { BackButton } from '../components/layout/BackButton';
import { ShareButton } from '../components/layout/ShareButton';
import { StatusBadge } from '../components/trail/StatusBadge';
import { HazardNotice } from '../components/trail/HazardNotice';
import { getCriticalHazards } from '../lib/hazards';
import { useTrail } from '../hooks/useTrails';
import { useTrailReportsByTrail } from '../hooks/useTrailReports';
import { cleanNotes, isReportFresh, isValidTrailId } from '../lib/text';
import { shareUrlFor } from '../lib/share';
import { formatDistanceToNow } from 'date-fns';
import { useLang, type TranslationKey } from '../contexts/LangContext';

function statusShareLabel(status: 'green' | 'yellow' | 'red'): TranslationKey {
  if (status === 'green') return 'park_trail_status_good';
  if (status === 'yellow') return 'park_trail_status_fair';
  return 'park_trail_status_poor';
}

export function TrailDetailPage() {
  const { trailId } = useParams<{ trailId: string }>();
  const navigate = useNavigate();
  const { t } = useLang();
  const validTrailId = isValidTrailId(trailId) ? trailId : undefined;
  const { data: trail, isLoading: trailLoading } = useTrail(validTrailId);
  const { data: reports, isLoading: reportsLoading } = useTrailReportsByTrail(validTrailId || '');

  const isLoading = !!validTrailId && (trailLoading || reportsLoading);

  if (!validTrailId) {
    return (
      <div className="p-4">
        <Alert variant="destructive">
          <AlertDescription>{t('trail_not_found')}</AlertDescription>
        </Alert>
        <button
          className="mt-4 text-[#2c4a1e] font-bold text-[13px]"
          onClick={() => navigate('/search')}
        >
          {t('trail_back_to_search')}
        </button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-4 space-y-4">
        <Skeleton className="h-10 w-10 rounded-full" />
        <Skeleton className="h-40 w-full rounded-2xl" />
        <Skeleton className="h-32 w-full rounded-2xl" />
      </div>
    );
  }

  if (!trail) {
    return (
      <div className="p-4">
        <Alert variant="destructive">
          <AlertDescription>{t('trail_not_found')}</AlertDescription>
        </Alert>
        <button
          className="mt-4 text-[#2c4a1e] font-bold text-[13px]"
          onClick={() => navigate('/search')}
        >
          {t('trail_back_to_search')}
        </button>
      </div>
    );
  }

  const visibleReports = (reports || [])
    .filter((r) => isReportFresh(r.created_at, r.conditions))
    .slice(0, 5);
  const latestReport = visibleReports[0];
  const parkName = trail.location || null;
  const headerTitle = parkName ?? trail.name;

  const trailDisplayName = trail.name.includes(' - ')
    ? trail.name.split(' - ').slice(1).join(' - ')
    : trail.name;

  return (
    <div className="min-h-screen bg-[#F5F0E8]">
      {/* Header: back + centered park name + share */}
      <div className="relative px-4 pt-3.5 h-[52px] flex items-center justify-between">
        <BackButton />
        <h1 className="absolute left-1/2 -translate-x-1/2 text-[16px] font-bold text-[#1a3010] truncate max-w-[55%] text-center">
          {headerTitle}
        </h1>
        <ShareButton
          title={trailDisplayName}
          subtitle={parkName}
          url={shareUrlFor(`/trails/${trail.id}`)}
          text={t('share_report_text').replace('{name}', trailDisplayName)}
          status={latestReport?.status ?? null}
          statusLabel={
            latestReport ? t(statusShareLabel(latestReport.status)) : null
          }
        />
      </div>

      {/* Trail info card */}
      <div className="px-4 pt-5">
        <div className="bg-white border-[1.5px] border-[#f0ede6] shadow-[0px_4px_10px_rgba(0,0,0,0.1)] p-5 rounded-[32px]">
          <div className="flex items-center gap-3.5">
            <div className="bg-[#3a6b35] rounded-full size-12 flex items-center justify-center shrink-0">
              <Mountain className="size-6 text-white opacity-85" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-[18px] font-bold tracking-[-0.3px] text-[#1a1a1a]">
                {trailDisplayName}
              </h2>
              <p className="text-[13.5px] text-[#374151]">
                {trail.location || t('trail_singular')}
              </p>
            </div>
          </div>

          <button
            onClick={() => navigate(`/trails/${trail.id}/report`)}
            className="mt-4 w-full h-[53px] bg-[#2c4a1e] rounded-[14px] text-white text-[13px] font-bold tracking-[1.5px]"
          >
            {t('trail_report_conditions')}
          </button>
        </div>
      </div>

      {/* Condition Summary */}
      {(cleanNotes(latestReport?.notes) || (latestReport && getCriticalHazards(latestReport.conditions).length > 0)) && (
        <div className="px-4 pt-5">
          <h2 className="text-[11px] font-bold tracking-[1.2px] uppercase text-[#374151] mb-2">
            {t('trail_condition_summary')}
          </h2>
          <div className="bg-white border-[1.5px] border-[#f0ede6] p-4 rounded-[32px] space-y-3">
            <HazardNotice conditions={latestReport?.conditions} trailName={trailDisplayName} />
            {cleanNotes(latestReport?.notes) && (
              <p className="text-[14px] leading-[22.4px] text-[#374151]">
                {cleanNotes(latestReport?.notes)}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Recent Reports */}
      <div className="px-4 pt-5 pb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[11px] font-bold tracking-[1.2px] uppercase text-[#374151]">
            {t('trail_recent_reports')}
          </h2>
          <button className="text-[13px] font-bold text-[#2c4a1e]">{t('home_see_all')}</button>
        </div>

        {visibleReports.length === 0 && (
          <div className="bg-white rounded-[14px] border-[1.5px] border-[#f0ede6] p-6 text-center">
            <p className="text-[13px] text-[#374151]">{t('trail_no_reports')}</p>
          </div>
        )}

        <div className="space-y-2.5">
          {visibleReports.map((report) => {
            const initials = (report.profiles?.email?.split('@')[0] || 'AN')
              .slice(0, 2)
              .toUpperCase();
            return (
              <div
                key={report.id}
                className="bg-white border-[1.5px] border-[#f0ede6] p-4 rounded-[32px]"
              >
                <div className="flex items-center gap-2.5">
                  <div className="bg-[#2c4a1e] rounded-full size-[34px] flex items-center justify-center shrink-0">
                    <span className="text-[12px] font-bold text-white">{initials}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-bold text-[#1a1a1a]">
                      {report.profiles?.email?.split('@')[0] || t('anonymous')}
                    </p>
                    <p className="text-[12px] text-[#4b5563]">
                      {formatDistanceToNow(new Date(report.created_at), { addSuffix: true })}
                    </p>
                  </div>
                  <StatusBadge status={report.status} />
                  <ShareButton
                    title={trailDisplayName}
                    subtitle={parkName}
                    url={shareUrlFor(`/trails/${trail.id}`)}
                    text={t('share_report_text').replace('{name}', trailDisplayName)}
                    status={report.status}
                    statusLabel={t(statusShareLabel(report.status))}
                    className="shadow-none border-[1.5px] border-[#e5e7eb] bg-white"
                  />
                </div>
                <HazardNotice
                  conditions={report.conditions}
                  trailName={trailDisplayName}
                  className="mt-2.5"
                />
                {cleanNotes(report.notes) && (
                  <p className="text-[14px] leading-[21px] text-[#374151] mt-2.5">
                    {cleanNotes(report.notes)}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
