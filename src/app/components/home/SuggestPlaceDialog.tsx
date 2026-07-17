import { useState } from 'react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Input } from '../ui/input';
import { useLang } from '../../contexts/LangContext';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { cn } from '../ui/utils';

type Kind = 'park' | 'trail';

interface SuggestPlaceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SuggestPlaceDialog({ open, onOpenChange }: SuggestPlaceDialogProps) {
  const { t } = useLang();
  const { user } = useAuth();
  const [kind, setKind] = useState<Kind>('park');
  const [name, setName] = useState('');
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setKind('park');
    setName('');
    setDetails('');
    setSubmitting(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      toast.error(t('suggest_name_required'));
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from('place_requests').insert({
        kind,
        name: trimmed,
        details: details.trim() || null,
        user_id: user?.id ?? null,
      });
      if (error) throw error;

      toast.success(t('suggest_thanks'));
      reset();
      onOpenChange(false);
    } catch (err) {
      console.error('Place request failed:', err);
      toast.error(t('suggest_error'));
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) reset();
        onOpenChange(next);
      }}
    >
      <DialogContent className="max-w-[340px] rounded-[20px] p-6 gap-0">
        <DialogHeader className="text-left space-y-1.5 mb-4">
          <DialogTitle className="text-[18px] font-bold text-[#1a3010]">
            {t('suggest_title')}
          </DialogTitle>
          <DialogDescription className="text-[13.5px] text-[#374151]">
            {t('suggest_body')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <p className="text-[11px] font-bold tracking-[1.2px] uppercase text-[#374151] mb-2">
              {t('suggest_type_label')}
            </p>
            <div className="flex gap-2">
              {([
                { value: 'park' as const, label: t('park_singular') },
                { value: 'trail' as const, label: t('trail_singular') },
              ]).map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setKind(opt.value)}
                  className={cn(
                    'flex-1 h-11 rounded-[14px] text-[14px] font-bold border-[1.5px] transition-colors',
                    kind === opt.value
                      ? 'bg-[#2c4a1e] text-white border-[#2c4a1e]'
                      : 'bg-white text-[#374151] border-[#e5e0d5]'
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label
              htmlFor="suggest-name"
              className="text-[11px] font-bold tracking-[1.2px] uppercase text-[#374151] mb-2 block"
            >
              {t('suggest_name_label')}
            </label>
            <Input
              id="suggest-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('suggest_name_placeholder')}
              className="h-11 rounded-[14px] border-[1.5px] border-[#e5e0d5] text-[15px]"
              autoFocus
              disabled={submitting}
            />
          </div>

          <div>
            <label
              htmlFor="suggest-details"
              className="text-[11px] font-bold tracking-[1.2px] uppercase text-[#374151] mb-2 block"
            >
              {t('suggest_details_label')}
            </label>
            <textarea
              id="suggest-details"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder={t('suggest_details_placeholder')}
              rows={3}
              disabled={submitting}
              className="w-full rounded-[14px] border-[1.5px] border-[#e5e0d5] bg-white px-3 py-2.5 text-[15px] text-[#1a1a1a] placeholder:text-[#9ca3af] resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2c4a1e]/30 disabled:opacity-60"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full h-[48px] bg-[#2c4a1e] rounded-[12px] text-white text-[13px] font-bold tracking-[1.2px] active:scale-[0.99] transition-transform disabled:opacity-60"
          >
            {submitting ? t('form_submitting') : t('suggest_submit')}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
