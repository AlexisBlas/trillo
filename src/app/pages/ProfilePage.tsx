import { useNavigate } from 'react-router';
import { User, Mail, LogOut, FileText, Clock, MapPin } from 'lucide-react';
import { Skeleton } from '../components/ui/skeleton';
import { BackButton } from '../components/layout/BackButton';
import { StatusBadge } from '../components/trail/StatusBadge';
import { useAuth } from '../contexts/AuthContext';
import { useUserReports } from '../hooks/useTrailReports';
import { cleanNotes, isReportFresh, getReportPath } from '../lib/text';
import { formatDistanceToNow } from 'date-fns';
import { useLang } from '../contexts/LangContext';

function reportTitle(
  report: {
    trail_id?: string | null;
    park_name?: string | null;
    trails?: { name?: string | null } | null;
  },
  parkReportLabel: string,
  unknownLabel: string
): string {
  if (report.trail_id) {
    return report.trails?.name?.trim() || unknownLabel;
  }
  return report.park_name?.trim() || parkReportLabel;
}

export function ProfilePage() {
  const navigate = useNavigate();
  const { t } = useLang();
  const { user, signOut } = useAuth();
  const { data: allReports, isLoading } = useUserReports(user?.id);
  const reports = (allReports || []).filter((r) =>
    isReportFresh(r.created_at, r.conditions)
  );

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const username = user?.email?.split('@')[0] || 'You';

  return (
    <div className="min-h-screen bg-[#F5F0E8]">
      <div className="px-4 pt-3.5">
        <BackButton />
      </div>

      <div className="px-5 pt-6 pb-4">
        <h1 className="text-[24px] font-bold text-[#1a3010] mb-5">{t('profile_page_title')}</h1>

        <div className="bg-white border-[1.5px] border-[#f0ede6] shadow-[0px_1px_1.5px_rgba(0,0,0,0.04)] p-5 rounded-[32px]">
          <div className="flex items-center gap-3.5">
            <div className="size-12 rounded-full bg-[#3a6b35] flex items-center justify-center shrink-0">
              <User className="size-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[16px] font-bold text-[#1a1a1a] truncate">{username}</p>
              <div className="flex items-center gap-1.5 text-[12.5px] text-[#374151] mt-0.5">
                <Mail className="size-3.5" />
                <span className="truncate">{user?.email}</span>
              </div>
            </div>
          </div>

          <button
            onClick={handleSignOut}
            className="mt-4 w-full h-[44px] bg-white border-[1.5px] border-[#e5e7eb] rounded-[12px] text-[#1a3010] text-[13px] font-bold tracking-[1.2px] flex items-center justify-center gap-2"
          >
            <LogOut className="size-4" />
            {t('profile_sign_out').toUpperCase()}
          </button>
        </div>
      </div>

      <div className="px-5 pt-2 pb-6">
        <h2 className="text-[11px] font-bold tracking-[1.2px] uppercase text-[#374151] mb-3">
          {t('profile_your_reports')}
        </h2>

        {isLoading && (
          <div className="flex flex-col gap-[10px]">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-24 w-full rounded-[16px]" />
            ))}
          </div>
        )}

        {!isLoading && reports.length === 0 && (
          <div className="bg-white rounded-[16px] border-[1.5px] border-[#f0ede6] shadow-sm p-8 text-center">
            <div className="size-12 rounded-full bg-[#f0ede6] flex items-center justify-center mx-auto mb-4">
              <FileText className="size-6 text-[#374151]" />
            </div>
            <h3 className="text-[15.5px] font-bold text-[#1a1a1a] mb-2">{t('reports_none_yet')}</h3>
            <p className="text-[13px] text-[#374151] mb-5">
              {t('profile_no_reports_body')}
            </p>
            <button
              onClick={() => navigate('/search')}
              className="h-[44px] px-5 bg-[#2c4a1e] rounded-[12px] text-white text-[13px] font-bold tracking-[1.2px]"
            >
              {t('profile_find_trail')}
            </button>
          </div>
        )}

        {!isLoading && reports.length > 0 && (
          <div className="flex flex-col gap-[10px]">
            {reports.map((report) => {
              const path = getReportPath(report);
              const title = reportTitle(report, t('park_report'), t('reports_unknown_trail'));
              const notes = cleanNotes(report.notes);
              const createdLabel = (() => {
                try {
                  return formatDistanceToNow(new Date(report.created_at), { addSuffix: true });
                } catch {
                  return '';
                }
              })();

              return (
                <button
                  key={report.id}
                  type="button"
                  onClick={() => path && navigate(path)}
                  disabled={!path}
                  className="bg-white border-[1.5px] border-[#f0ede6] shadow-[0px_1px_1.5px_rgba(0,0,0,0.04)] hover:border-[#2c4a1e] transition-colors p-4 text-left rounded-[32px] disabled:opacity-50"
                >
                  <div className="flex items-center justify-between gap-3 mb-1.5">
                    <h3 className="text-[15.5px] font-bold tracking-[-0.2px] text-[#1a1a1a] truncate flex items-center gap-2">
                      <MapPin className="size-4 text-[#2c4a1e] shrink-0" />
                      {title}
                    </h3>
                    <StatusBadge status={report.status} />
                  </div>
                  {notes ? (
                    <p className="text-[13px] text-[#374151] leading-[19px] line-clamp-2 mb-1.5">
                      {notes}
                    </p>
                  ) : null}
                  {createdLabel ? (
                    <div className="flex items-center gap-1.5 text-[12px] text-[#4b5563]">
                      <Clock className="size-3.5" />
                      <span>{createdLabel}</span>
                    </div>
                  ) : null}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
