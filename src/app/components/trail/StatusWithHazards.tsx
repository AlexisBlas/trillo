import { cn } from '../ui/utils';
import { useLang } from '../../contexts/LangContext';
import { getCriticalHazards, HAZARD_COLORS } from '../../lib/hazards';
import { StatusCircle } from './StatusCircle';

type Status = 'green' | 'yellow' | 'red';

interface StatusWithHazardsProps {
  status?: Status | null;
  conditions?: string[] | null;
  size?: 'sm' | 'md';
  className?: string;
}

/**
 * Status dot with a prominent overlapping hazard badge (profile-style),
 * bottom-left — Downed Trees / Broken Bridge only.
 */
export function StatusWithHazards({
  status,
  conditions,
  size = 'md',
  className,
}: StatusWithHazardsProps) {
  const { t } = useLang();
  const hazards = getCriticalHazards(conditions);
  const primary = hazards[0];
  const PrimaryIcon = primary?.icon;

  return (
    <div className={cn('relative shrink-0 size-10', className)}>
      <StatusCircle status={status} size={size} className="absolute inset-0" />
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
