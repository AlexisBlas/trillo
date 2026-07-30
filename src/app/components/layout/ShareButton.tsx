import { useState } from 'react';
import { Share2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '../ui/utils';
import { useLang } from '../../contexts/LangContext';
import { shareContent, type SharePayload, type ShareStatus } from '../../lib/share';

type ShareButtonProps = {
  title: string;
  text?: string;
  url?: string;
  subtitle?: string | null;
  status?: ShareStatus | null;
  statusLabel?: string | null;
  className?: string;
  /** Larger glove-friendly target for standalone CTAs. */
  size?: 'header' | 'cta';
};

export function ShareButton({
  title,
  text,
  url,
  subtitle,
  status,
  statusLabel,
  className,
  size = 'header',
}: ShareButtonProps) {
  const { t } = useLang();
  const [busy, setBusy] = useState(false);

  const onShare = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const payload: SharePayload = {
        title,
        text: text || t('share_report_text').replace('{name}', title),
        url: url || window.location.href,
        subtitle,
        status,
        statusLabel,
      };
      const result = await shareContent(payload);
      if (result === 'copied') toast.success(t('share_copied'));
      if (result === 'failed') toast.error(t('share_failed'));
      // 'shared' / 'cancelled' — no toast needed
    } finally {
      setBusy(false);
    }
  };

  if (size === 'cta') {
    return (
      <button
        type="button"
        onClick={onShare}
        disabled={busy}
        aria-label={t('share_aria')}
        className={cn(
          'w-full min-h-[52px] inline-flex items-center justify-center gap-2.5 rounded-[14px] border-[1.5px] border-[#e5e7eb] bg-white text-[15px] font-bold text-[#1a3010] touch-manipulation active:bg-[#f0ede6] disabled:opacity-60',
          className
        )}
      >
        <Share2 className="size-5" strokeWidth={2} />
        {busy ? t('share_preparing') : t('share_action')}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onShare}
      disabled={busy}
      aria-label={t('share_aria')}
      className={cn(
        'size-[38px] rounded-full bg-white/90 shadow-[0px_2px_8px_rgba(0,0,0,0.12)] flex items-center justify-center shrink-0 touch-manipulation disabled:opacity-60',
        className
      )}
    >
      <Share2 className="size-[18px] text-[#1a1a1a]" strokeWidth={1.65} />
    </button>
  );
}
