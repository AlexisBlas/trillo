import { cn } from '../ui/utils';

type Status = 'green' | 'yellow' | 'red';

/** Community trail-condition colors: Dry / Wet / Muddy */
export const STATUS_DOT: Record<Status, string> = {
  green: '#22c55e',
  yellow: '#eab308',
  red: '#ef4444',
};

const UNKNOWN_DOT = '#d1d5db';

/** Soft half of the estimated two-tone marker (~25% opacity). */
export const STATUS_ESTIMATED_SOFT = '40';

/** Two-tone half-circle: solid / transparent split on a diagonal. */
export function estimatedStatusFill(color: string): string {
  return `linear-gradient(135deg, ${color} 50%, ${color}${STATUS_ESTIMATED_SOFT} 50%)`;
}

const sizeMap = {
  sm: 'size-10', // 40×40
  md: 'size-10', // 40×40 — same marker everywhere
} as const;

interface StatusCircleProps {
  status?: Status | null;
  /** Rain estimate (vs community report) — two-tone half-circle. */
  estimated?: boolean;
  size?: keyof typeof sizeMap;
  className?: string;
}

/** Solid condition marker — green / yellow / red, no icon. */
export function StatusCircle({
  status,
  estimated = false,
  size = 'md',
  className,
}: StatusCircleProps) {
  const color = status ? STATUS_DOT[status] : UNKNOWN_DOT;

  if (estimated && status) {
    return (
      <span
        className={cn('rounded-full shrink-0', sizeMap[size], className)}
        style={{ backgroundImage: estimatedStatusFill(color) }}
        aria-hidden
      />
    );
  }

  return (
    <span
      className={cn('rounded-full shrink-0', sizeMap[size], className)}
      style={{ backgroundColor: color }}
      aria-hidden
    />
  );
}
