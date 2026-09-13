import { User } from 'lucide-react';
import { cn } from '../ui/utils';
import { useLang } from '../../contexts/LangContext';
import { STATUS_DOT } from './StatusCircle';

interface ConditionSourceLegendProps {
  className?: string;
}

/**
 * Compact legend: person badge = community report, plain solid = rain estimate.
 */
export function ConditionSourceLegend({ className }: ConditionSourceLegendProps) {
  const { t } = useLang();
  const sample = STATUS_DOT.green;

  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] text-[#687588]',
        className
      )}
      role="note"
      aria-label={t('condition_legend_aria')}
    >
      <span className="inline-flex items-center gap-1.5">
        <span className="relative size-3.5 shrink-0" aria-hidden>
          <span
            className="absolute inset-0 rounded-full"
            style={{ backgroundColor: sample }}
          />
          <span className="absolute -bottom-0.5 -right-0.5 size-[10px] rounded-full bg-[#1a3010] flex items-center justify-center shadow-[0_0_0_1.5px_#F5F0E8]">
            <User className="size-1.5 text-white" strokeWidth={3} />
          </span>
        </span>
        <span>{t('condition_legend_reported')}</span>
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span
          className="size-3.5 rounded-full shrink-0"
          style={{ backgroundColor: sample }}
          aria-hidden
        />
        <span>{t('condition_legend_estimated')}</span>
      </span>
    </div>
  );
}
