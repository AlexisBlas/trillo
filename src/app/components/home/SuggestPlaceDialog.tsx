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
      <DialogContent
        className={cn(
          // Override centered desktop defaults for a mobile-safe sheet
          'left-1/2 top-auto bottom-[max(0.75rem,env(safe-area-inset-bottom))]',
          'translate-x-[-50%] translate-y-0',
          'w-[calc(100%-1.5rem)] max-w-[360px] sm:max-w-[360px]',
          'max-h-[min(88dvh,640px)]',
          'flex flex-col gap-0 overflow-hidden rounded-[20px] border-border bg-background p-0 shadow-xl',
          // Keep a centered modal feel on wider phones / tablets when space allows
          'sm:bottom-auto sm:top-[50%] sm:translate-y-[-50%]'
        )}
      >
        <div className="overflow-y-auto overscroll-contain px-5 pb-5 pt-5">
          <DialogHeader className="space-y-1.5 text-left mb-4 pr-8">
            <DialogTitle className="text-[18px] font-bold leading-snug text-foreground">
              {t('suggest_title')}
            </DialogTitle>
            <DialogDescription className="text-[13.5px] leading-[20px] text-muted-foreground">
              {t('suggest_body')}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <p className="mb-2 text-[11px] font-bold uppercase tracking-[1.2px] text-muted-foreground">
                {t('suggest_type_label')}
              </p>
              <div className="grid grid-cols-2 gap-2">
                {([
                  { value: 'park' as const, label: t('park_singular') },
                  { value: 'trail' as const, label: t('trail_singular') },
                ]).map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setKind(opt.value)}
                    className={cn(
                      'h-11 rounded-[14px] border-[1.5px] text-[14px] font-bold transition-colors',
                      kind === opt.value
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border bg-card text-muted-foreground'
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="min-w-0">
              <label
                htmlFor="suggest-name"
                className="mb-2 block text-[11px] font-bold uppercase tracking-[1.2px] text-muted-foreground"
              >
                {t('suggest_name_label')}
              </label>
              <Input
                id="suggest-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('suggest_name_placeholder')}
                className="h-11 w-full max-w-full rounded-[14px] border-[1.5px] border-border text-[16px]"
                disabled={submitting}
                autoComplete="off"
                enterKeyHint="next"
              />
            </div>

            <div className="min-w-0">
              <label
                htmlFor="suggest-details"
                className="mb-2 block text-[11px] font-bold uppercase tracking-[1.2px] text-muted-foreground"
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
                className="w-full max-w-full resize-none rounded-[14px] border-[1.5px] border-border bg-card px-3 py-2.5 text-[16px] text-foreground placeholder:text-[#9ca3af] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:opacity-60"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="mt-1 flex min-h-[48px] w-full items-center justify-center rounded-[12px] bg-primary px-4 py-3 text-[13px] font-bold tracking-[1px] text-primary-foreground transition-transform active:scale-[0.99] disabled:opacity-60"
            >
              {submitting ? t('form_submitting') : t('suggest_submit')}
            </button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
