import { Check, AlertTriangle, XCircle, MapPin } from 'lucide-react';
import { cn } from '../ui/utils';

type Status = 'green' | 'yellow' | 'red';

const config: Record<Status, { bg: string; text: string; Icon: typeof Check }> = {
  green: { bg: '#d1fae5', text: '#065f46', Icon: Check },
  yellow: { bg: '#fef3c7', text: '#92400e', Icon: AlertTriangle },
  red: { bg: '#fee2e2', text: '#991b1b', Icon: XCircle },
};

const sizeMap = {
  sm: { box: 'size-10', icon: 'size-5' },
  md: { box: 'size-12', icon: 'size-6' },
} as const;

interface StatusCircleProps {
  status?: Status | null;
  size?: keyof typeof sizeMap;
  className?: string;
}

export function StatusCircle({ status, size = 'md', className }: StatusCircleProps) {
  const s = sizeMap[size];

  if (!status) {
    return (
      <div
        className={cn(
          'rounded-full flex items-center justify-center shrink-0 bg-[#f0ede6]',
          s.box,
          className
        )}
      >
        <MapPin className={cn(s.icon, 'text-[#374151]')} />
      </div>
    );
  }

  const { bg, text, Icon } = config[status];

  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center shrink-0 border',
        s.box,
        className
      )}
      style={{ backgroundColor: bg, borderColor: text }}
    >
      <Icon className={s.icon} style={{ color: text }} strokeWidth={2.4} />
    </div>
  );
}
