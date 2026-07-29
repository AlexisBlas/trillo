import { cn } from '../ui/utils';
import { useLang } from '../../contexts/LangContext';

interface NewParkBadgeProps {
  className?: string;
}

/** Tiny pill for parks added within the new-park window. */
export function NewParkBadge({ className }: NewParkBadgeProps) {
  const { t } = useLang();
  return (
    <span
      className={cn(
        'inline-flex items-center h-[15px] px-1.5 rounded-full',
        'bg-[#D97706] text-white text-[9px] font-bold tracking-[0.5px] uppercase leading-none shrink-0',
        className
      )}
    >
      {t('badge_new')}
    </span>
  );
}
