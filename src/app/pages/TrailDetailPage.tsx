import { useParams, useNavigate } from 'react-router';
import { Mountain } from 'lucide-react';
import { Skeleton } from '../components/ui/skeleton';
import { Alert, AlertDescription } from '../components/ui/alert';
import { BackButton } from '../components/layout/BackButton';
import { ShareButton } from '../components/layout/ShareButton';
import { StatusBadge } from '../components/trail/StatusBadge';
import { StatusCircle } from '../components/trail/StatusCircle';
import { HazardNotice } from '../components/trail/HazardNotice';
import { OverallRatingLabel } from '../components/trail/OverallRatingLabel';
import { getCriticalHazards } from '../lib/hazards';
import { getOverallRating } from '../lib/schemas';
import { useTrail } from '../hooks/useTrails';
import { useTrailReportsByTrail } from '../hooks/useTrailReports';
import {
  getEffectiveParkStatus,
  useConditionEstimates,
} from '../hooks/useConditionEstimates';
import { cleanNotes, isReportFresh, isValidTrailId } from '../lib/text';
import { shareUrlFor } from '../lib/share';
import { formatDistanceToNow } from 'date-fns';
import { useLang, type TranslationKey } from '../contexts/LangContext';

function statusShareLabel(status: 'green' | 'yellow' | 'red'): TranslationKey {
  if (status === 'green') return 'park_trail_status_good';
  if (status === 'yellow') return 'park_trail_status_fair';
  return 'park_trail_status_poor';
}

const STATUS_LABEL: Record<'green' | 'yellow' | 'red', TranslationKey> = {
  green: 'park_trail_status_good',
  yellow: 'park_trail_status_fair',
  red: 'park_trail_status_poor',
};

const STATUS_TEXT: Record<'green' | 'yellow' | 'red', string> = {
  green: '#346538',
  yellow: '#92400e',
  red: '#9f2f2d',
};

export function TrailDetailPage() {
  const { trailId } = useParams<{ trailId: string }>();
  const navigate = useNavigate();
  const { t } = useLang();
  const validTrailId = isValidTrailId(trailId) ? trailId : undefined;
  const { data: trail, isLoading: trailLoading } = useTrail(validTrailId);
  const { data: reports, isLoading: reportsLoading } = useTrailReportsByTrail(validTrailId || '');
  const { byPark: estimatesByPark } = useConditionEstimates();

  const isLoading = !!validTrailId && (trailLoading || reportsLoading);

  if (!validTrailId) {
    return (
      <div className="p-4">
        <Alert variant="destructive">
          <AlertDescription>{t('trail_not_found')}</AlertDescription>
        </Alert>
        <button
          className="mt-4 text-[#63B882] font-bold text-[13px]"
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
          className="mt-4 text-[#63B882] font-bold text-[13px]"
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
  const parkEstimate = parkName ? estimatesByPark.get(parkName) : undefined;
  const { status: estimatedStatus, source: statusSource, rainAdjusted } =
    getEffectiveParkStatus(
      latestReport
        ? { status: latestReport.status, createdAt: latestReport.created_at }
        : null,
      parkEstimate
    );
  const headerTitle = parkName ?? trail.name;

  const trailDisplayName = trail.name.includes(' - ')
    ? trail.name.split(' - ').slice(1).join(' - ')
    : trail.name;

  return (
    <div className="min-h-screen bg-[#0E1510]">
      {/* Header: back + centered park name + share */}
      <div className="relative px-4 pt-3.5 h-[52px] flex items-center justify-between">
        <BackButton />
        <h1 className="absolute left-1/2 -translate-x-1/2 text-[16px] font-bold text-[#E6EBE6] truncate max-w-[55%] text-center">
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
          notes={cleanNotes(latestReport?.notes)}
          conditions={latestReport?.conditions ?? null}
          hazardTrailName={trailDisplayName}
          updatedValue={
            latestReport
              ? formatDistanceToNow(new Date(latestReport.created_at), { addSuffix: true })
              : null
          }
        />
      </div>

      {/* Trail info card */}
      <div className="px-4 pt-5">
        <div className="bg-[#151C18] border-[1.5px] border-[#24302A] shadow-[0px_4px_10px_rgba(0,0,0,0.1)] p-5 rounded-[32px]">
          <div className="flex items-center gap-3.5">
            <div className="bg-[#1E3A28] rounded-full size-12 flex items-center justify-center shrink-0">
              <Mountain className="size-6 text-white opacity-85" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-[18px] font-bold tracking-[-0.3px] text-[#E6EBE6]">
                {trailDisplayName}
              </h2>
              <p className="text-[13.5px] text-[#9AA39C]">
                {trail.location || t('trail_singular')}
              </p>
            </div>
          </div>

          {statusSource === 'estimate' && estimatedStatus && (
            <div className="mt-4 flex items-center gap-3 rounded-[16px] bg-[#f5f2ec] px-3.5 py-3">
              <StatusCircle
                status={estimatedStatus}
                reported={false}
                className="!size-8"
              />
              <div className="min-w-0">
                <p
                  className="text-[15px] font-bold leading-none"
                  style={{ color: STATUS_TEXT[estimatedStatus] }}
                >
                  {t(STATUS_LABEL[estimatedStatus])}
                </p>
                <p className="text-[12px] text-[#8B958C] mt-1">
                  {rainAdjusted
                    ? t('condition_rain_adjusted_hint')
                    : t('condition_estimated_from_rain')}
                </p>
              </div>
            </div>
          )}

          <button
            onClick={() => navigate(`/trails/${trail.id}/report`)}
            className="mt-4 w-full h-[53px] bg-[#63B882] rounded-[14px] text-[#0E1510] text-[13px] font-bold tracking-[1.5px]"
          >
            {t('trail_report_conditions')}
          </button>
        </div>
      </div>

      {/* Condition Summary */}
      {(cleanNotes(latestReport?.notes) || (latestReport && getCriticalHazards(latestReport.conditions).length > 0)) && (
        <div className="px-4 pt-5">
          <h2 className="text-[11px] font-bold tracking-[1.2px] uppercase text-[#9AA39C] mb-2">
            {t('trail_condition_summary')}
          </h2>
          <div className="bg-[#151C18] border-[1.5px] border-[#24302A] p-4 rounded-[32px] space-y-3">
            <HazardNotice conditions={latestReport?.conditions} trailName={trailDisplayName} />
            {cleanNotes(latestReport?.notes) && (
              <p className="text-[14px] leading-[22.4px] text-[#9AA39C]">
                {cleanNotes(latestReport?.notes)}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Recent Reports */}
      <div className="px-4 pt-5 pb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[11px] font-bold tracking-[1.2px] uppercase text-[#9AA39C]">
            {t('trail_recent_reports')}
          </h2>
          <button className="text-[13px] font-bold text-[#63B882]">{t('home_see_all')}</button>
        </div>

        {visibleReports.length === 0 && (
          <div className="bg-[#151C18] rounded-[14px] border-[1.5px] border-[#24302A] p-6 text-center">
            <p className="text-[13px] text-[#9AA39C]">{t('trail_no_reports')}</p>
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
                className="bg-[#151C18] border-[1.5px] border-[#24302A] p-4 rounded-[32px]"
              >
                <div className="flex items-center gap-2.5">
                  <div className="bg-[#63B882] rounded-full size-[34px] flex items-center justify-center shrink-0">
                    <span className="text-[12px] font-bold text-white">{initials}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-bold text-[#E6EBE6]">
                      {report.profiles?.email?.split('@')[0] || t('anonymous')}
                    </p>
                    <p className="text-[12px] text-[#8B958C]">
                      {formatDistanceToNow(new Date(report.created_at), { addSuffix: true })}
                      {getOverallRating(report.conditions) && ' · '}
                      <OverallRatingLabel conditions={report.conditions} />
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
                    notes={cleanNotes(report.notes)}
                    conditions={report.conditions}
                    hazardTrailName={trailDisplayName}
                    updatedValue={formatDistanceToNow(new Date(report.created_at), {
                      addSuffix: true,
                    })}
                    className="shadow-none border-[1.5px] border-[#24302A] bg-[#151C18]"
                  />
                </div>
                <HazardNotice
                  conditions={report.conditions}
                  trailName={trailDisplayName}
                  className="mt-2.5"
                />
                {cleanNotes(report.notes) && (
                  <p className="text-[14px] leading-[21px] text-[#9AA39C] mt-2.5">
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
