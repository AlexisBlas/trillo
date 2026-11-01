import { ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router';
import { cn } from '../ui/utils';

interface BackButtonProps {
  to?: string;
  className?: string;
  ariaLabel?: string;
}

export function BackButton({ to, className, ariaLabel = 'Back' }: BackButtonProps) {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => (to ? navigate(to) : navigate(-1))}
      className={cn(
        'size-[38px] rounded-full bg-card/90 shadow-[0px_2px_8px_rgba(0,0,0,0.12)] flex items-center justify-center shrink-0',
        className
      )}
      aria-label={ariaLabel}
    >
      <ChevronLeft className="size-[18px] text-foreground" strokeWidth={1.65} />
    </button>
  );
}
