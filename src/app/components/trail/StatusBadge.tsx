import { cn } from '../ui/utils';
import { useLang } from '../../contexts/LangContext';

const statusConfig = {
  green: { bg: '#12352a', text: '#2FCA6A', labelKey: 'reports_filter_good' as const },
  yellow: { bg: '#3a2e12', text: '#C9A84A', labelKey: 'reports_filter_caution' as const },
  red: { bg: '#3a1616', text: '#C97A7A', labelKey: 'reports_filter_closed' as const },
};

interface StatusBadgeProps {
  status: 'green' | 'yellow' | 'red' | string | null | undefined;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export function StatusBadge({
  status,
  size = 'md',
  showLabel = true,
  className,
}: StatusBadgeProps) {
  const { t } = useLang();
  const config =
    status && status in statusConfig
      ? statusConfig[status as keyof typeof statusConfig]
      : statusConfig.yellow;

  const sizeClasses = {
    sm: 'h-5 px-2 text-[10px]',
    md: 'h-6 px-2.5 text-[11px]',
    lg: 'h-7 px-3 text-[12px]',
  };

  return (
    <div
      className={cn(
        'inline-flex items-center justify-center rounded-full font-bold tracking-[0.8px]',
        sizeClasses[size],
        className
      )}
      style={{
        backgroundColor: config.bg,
        color: config.text,
        border: `1px solid ${config.text}`,
      }}
      aria-label={`Trail status: ${t(config.labelKey)}`}
    >
      {showLabel && t(config.labelKey).toUpperCase()}
    </div>
  );
}
