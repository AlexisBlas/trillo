import { cn } from '../ui/utils';
import { useLang } from '../../contexts/LangContext';
import { getCriticalHazards, HAZARD_COLORS } from '../../lib/hazards';
import { StatusCircle } from './StatusCircle';

type Status = 'green' | 'yellow' | 'red';

interface StatusWithHazardsProps {
  status?: Status | null;
  conditions?: string[] | null;
  /** Community report — person badge on the status circle. */
  reported?: boolean;
  /** @deprecated Prefer `reported`. When true, hides the person badge. */
  estimated?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}

/**
 * Status dot with optional hazard badge (bottom-left) and
 * person badge for community reports (bottom-right on StatusCircle).
 */
export function StatusWithHazards({
  status,
  conditions,
  reported,
  estimated = false,
  size = 'md',
  className,
}: StatusWithHazardsProps) {
  const { t } = useLang();
  const hazards = getCriticalHazards(conditions);
  const primary = hazards[0];
  const PrimaryIcon = primary?.icon;
  const isReported = (reported ?? !estimated) && !!status;

  return (
    <div className={cn('relative shrink-0 size-10', className)}>
      <StatusCircle
        status={status}
        reported={isReported}
        size={size}
        className="absolute inset-0"
      />
      {primary && PrimaryIcon && (
        <span
          className="absolute -bottom-1 -left-1 size-[20px] rounded-full flex items-center justify-center shadow-[0_0_0_2px_#ffffff]"
          style={{ backgroundColor: HAZARD_COLORS.iconBg }}
          aria-label={hazards.map((h) => t(h.labelKey)).join(', ')}
          title={hazards.map((h) => t(h.labelKey)).join(', ')}
        >
          {hazards.length > 1 ? (
            <span
              className="text-[10px] font-bold leading-none tabular-nums"
              style={{ color: HAZARD_COLORS.iconFg }}
            >
              {hazards.length}
            </span>
          ) : (
            <PrimaryIcon
              className="size-3"
              style={{ color: HAZARD_COLORS.iconFg }}
              strokeWidth={2.5}
              aria-hidden
            />
          )}
        </span>
      )}
    </div>
  );
}
