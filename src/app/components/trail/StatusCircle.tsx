import { User } from 'lucide-react';
import { cn } from '../ui/utils';

type Status = 'green' | 'yellow' | 'red';

/** Community trail-condition colors: Dry / Wet / Muddy */
export const STATUS_DOT: Record<Status, string> = {
  green: '#56B078',
  yellow: '#CDB045',
  red: '#D17676',
};

const UNKNOWN_DOT = '#d1d5db';

const sizeMap = {
  sm: 'size-10',
  md: 'size-10',
} as const;

const reportBadgeSize = {
  sm: 'size-[18px]',
  md: 'size-[18px]',
} as const;

const reportIconSize = {
  sm: 'size-2.5',
  md: 'size-2.5',
} as const;

interface StatusCircleProps {
  status?: Status | null;
  /** Community report — shows a person badge on the lower-right. */
  reported?: boolean;
  /**
   * @deprecated Prefer `reported`. When true, hides the person badge.
   * Kept so older call sites still compile during the switch.
   */
  estimated?: boolean;
  size?: keyof typeof sizeMap;
  className?: string;
}

/** Solid condition marker — green / yellow / red. */
export function StatusCircle({
  status,
  reported,
  estimated = false,
  size = 'md',
  className,
}: StatusCircleProps) {
  const color = status ? STATUS_DOT[status] : UNKNOWN_DOT;
  const showReported = (reported ?? !estimated) && !!status;

  return (
    <span
      className={cn('relative shrink-0', sizeMap[size], className)}
      aria-hidden
    >
      <span
        className="absolute inset-0 rounded-full"
        style={{ backgroundColor: color }}
      />
      {showReported && (
        <span
          className={cn(
            'absolute -bottom-0.5 -right-0.5 rounded-full flex items-center justify-center',
            'shadow-[0_0_0_2px_#151C18] bg-[#0E1510]',
            reportBadgeSize[size]
          )}
        >
          <User
            className={cn(reportIconSize[size], 'text-white')}
            strokeWidth={2.75}
            aria-hidden
          />
        </span>
      )}
    </span>
  );
}
