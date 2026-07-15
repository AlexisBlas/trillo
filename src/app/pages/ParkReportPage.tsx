import { useMemo, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router';
import { MapPin, UserCircle } from 'lucide-react';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Skeleton } from '../components/ui/skeleton';
import { BackButton } from '../components/layout/BackButton';
import { ReportForm } from '../components/trail/ReportForm';
import { ReportSuccessDialog } from '../components/trail/ReportSuccessDialog';
import { useTrails } from '../hooks/useTrails';
import { useAuth } from '../contexts/AuthContext';
import { useLang } from '../contexts/LangContext';
import { supabase } from '../lib/supabase';
import { ReportFormData } from '../lib/schemas';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

const PARK_OVERVIEW_TAG = '[Park overview]';

export function ParkReportPage() {
  const { parkName } = useParams<{ parkName: string }>();
  const decoded = decodeURIComponent(parkName || '');
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useLang();
  const queryClient = useQueryClient();
  const { data: trails, isLoading } = useTrails();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);

  const parkTrails = useMemo(
    () => (trails || []).filter((t) => (t.location || 'Other') === decoded),
    [trails, decoded]
  );

  const handleSubmit = async (data: ReportFormData) => {
    setIsSubmitting(true);
    try {
      const overviewNote = data.notes
        ? `${PARK_OVERVIEW_TAG} ${data.notes}`
        : PARK_OVERVIEW_TAG;

      const { error } = await supabase.from('trail_reports').insert({
        trail_id: null,
        park_name: decoded,
        user_id: user?.id ?? null,
        status: data.status,
        conditions: data.conditions || null,
        notes: overviewNote,
      });

      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['trail-reports'] });
      setSuccessOpen(true);
    } catch (error) {
      console.error('Error submitting park report:', error);
      toast.error(t('submit_error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F0E8]">
      <div className="relative px-4 pt-3.5 h-[52px] flex items-center">
        <BackButton />
        <h1 className="absolute left-1/2 -translate-x-1/2 text-[16px] font-bold text-[#1a3010]">
          {t('park_report')}
        </h1>
      </div>

      <div className="px-4 pt-6">
        <div className="bg-white rounded-[14px] border-[1.5px] border-[#f0ede6] p-4 mb-5 flex items-center gap-3">
          <div className="size-10 rounded-full bg-[#3a6b35] flex items-center justify-center shrink-0">
            <MapPin className="size-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[15px] font-bold text-[#1a1a1a]">{decoded}</p>
            <p className="text-[13px] text-[#374151]">
              {parkTrails.length} {parkTrails.length === 1 ? t('trail_singular') : t('trail_plural')} · {t('overall_conditions')}
            </p>
          </div>
        </div>

        <ReportForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />

        {!user && (
          <Link
            to="/auth/signup"
            className="mt-4 mb-8 flex items-start gap-3 bg-white border-[1.5px] border-[#e5e0d5] rounded-[16px] p-4 hover:border-[#2c4a1e] transition-colors"
          >
            <UserCircle className="size-5 text-[#2c4a1e] shrink-0 mt-0.5" />
            <div>
              <p className="text-[13px] font-bold text-[#1a3010]">{t('account_benefits_title')}</p>
              <p className="text-[12px] text-[#4b6b3a] mt-0.5 leading-relaxed">{t('account_benefits_body')}</p>
            </div>
          </Link>
        )}
      </div>

      <ReportSuccessDialog
        open={successOpen}
        onOpenChange={(open) => {
          setSuccessOpen(open);
          if (!open) navigate(`/parks/${encodeURIComponent(decoded)}`);
        }}
        title={t('report_success_title')}
        description={t('report_success_park')}
        actionLabel={t('view_park')}
        onAction={() => {
          setSuccessOpen(false);
          navigate(`/parks/${encodeURIComponent(decoded)}`);
        }}
      />
    </div>
  );
}
