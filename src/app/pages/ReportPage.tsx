import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router';
import { MapPin, UserCircle } from 'lucide-react';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Skeleton } from '../components/ui/skeleton';
import { BackButton } from '../components/layout/BackButton';
import { ReportForm } from '../components/trail/ReportForm';
import { ReportSuccessDialog } from '../components/trail/ReportSuccessDialog';
import { useTrail } from '../hooks/useTrails';
import { useAuth } from '../contexts/AuthContext';
import { useLang } from '../contexts/LangContext';
import { supabase } from '../lib/supabase';
import { ReportFormData } from '../lib/schemas';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

export function ReportPage() {
  const { trailId } = useParams<{ trailId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useLang();
  const queryClient = useQueryClient();
  const { data: trail, isLoading } = useTrail(trailId);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);

  const handleSubmit = async (data: ReportFormData) => {
    if (!trailId) return;
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('trail_reports').insert({
        trail_id: trailId,
        user_id: user?.id ?? null,
        status: data.status,
        conditions: data.conditions || null,
        notes: data.notes || null,
      });
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['trail-reports'] });
      setSuccessOpen(true);
    } catch (err) {
      console.error('Error submitting report:', err);
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

  if (!trail) {
    return (
      <div className="p-4">
        <Alert variant="destructive">
          <AlertDescription>{t('trail_not_found')}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F0E8]">
      <div className="relative px-4 pt-3.5 h-[52px] flex items-center">
        <BackButton />
        <h1 className="absolute left-1/2 -translate-x-1/2 text-[16px] font-bold text-[#1a3010]">
          {t('report_conditions')}
        </h1>
      </div>

      <div className="px-4 pt-6">
        <div className="bg-white rounded-[14px] border-[1.5px] border-[#f0ede6] p-4 mb-5 flex items-center gap-3">
          <div className="size-10 rounded-full bg-[#f0ede6] flex items-center justify-center shrink-0">
            <MapPin className="size-5 text-[#2c4a1e]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[15px] font-bold text-[#1a1a1a]">{trail.name}</p>
            <p className="text-[13px] text-[#374151]">{trail.location || 'Trail location'}</p>
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
          if (!open) navigate(`/trails/${trailId}`);
        }}
        description={t('report_success_trail')}
        actionLabel={t('view_trail')}
        onAction={() => {
          setSuccessOpen(false);
          navigate(`/trails/${trailId}`);
        }}
      />
    </div>
  );
}
