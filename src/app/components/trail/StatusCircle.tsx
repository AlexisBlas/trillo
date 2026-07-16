import { cn } from '../ui/utils';

type Status = 'green' | 'yellow' | 'red';

/** Community trail-condition colors: Dry / Wet / Muddy */
export const STATUS_DOT: Record<Status, string> = {
  green: '#22c55e',
  yellow: '#eab308',
  red: '#ef4444',
};

const UNKNOWN_DOT = '#d1d5db';

const sizeMap = {
  sm: 'size-10', // 40×40
  md: 'size-10', // 40×40 — same marker everywhere
} as const;

interface StatusCircleProps {
  status?: Status | null;
  size?: keyof typeof sizeMap;
  className?: string;
}

/** Solid condition marker — green / yellow / red, no icon. */
export function StatusCircle({ status, size = 'md', className }: StatusCircleProps) {
  return (
    <span
      className={cn('rounded-full shrink-0', sizeMap[size], className)}
      style={{ backgroundColor: status ? STATUS_DOT[status] : UNKNOWN_DOT }}
      aria-hidden
    />
  );
}
