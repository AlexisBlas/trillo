import { Heart } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router';
import { toast } from 'sonner';
import { cn } from '../ui/utils';
import { useAuth } from '../../contexts/AuthContext';
import { useLang } from '../../contexts/LangContext';
import { useFollowedParkNames, useToggleParkFollow } from '../../hooks/useParkFollows';

interface FollowParkButtonProps {
  parkName: string;
  /** `icon` = compact control for list cards; `pill` = labeled control for park detail */
  variant?: 'icon' | 'pill';
  className?: string;
}

export function FollowParkButton({
  parkName,
  variant = 'icon',
  className,
}: FollowParkButtonProps) {
  const { user } = useAuth();
  const { t } = useLang();
  const navigate = useNavigate();
  const location = useLocation();
  const followed = useFollowedParkNames();
  const toggle = useToggleParkFollow();
  const following = followed.has(parkName);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      navigate('/auth/signin', {
        state: { redirectAfter: `${location.pathname}${location.search}` },
      });
      return;
    }

    toggle.mutate(
      { parkName, following },
      {
        onError: () => {
          toast.error(t('follow_error'));
        },
      }
    );
  };

  if (variant === 'pill') {
    return (
      <button
        type="button"
        onClick={handleClick}
        disabled={toggle.isPending}
        aria-pressed={following}
        aria-label={following ? t('park_unfollow') : t('park_follow')}
        className={cn(
          'inline-flex items-center gap-1.5 h-10 px-3.5 rounded-[12px] text-[13px] font-bold border-[1.5px] transition-colors disabled:opacity-60',
          following
            ? 'bg-primary text-primary-foreground border-primary'
            : 'bg-card text-primary border-primary',
          className
        )}
      >
        <Heart
          className="size-4"
          strokeWidth={2}
          fill={following ? 'currentColor' : 'none'}
        />
        {following ? t('park_following') : t('park_follow')}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={toggle.isPending}
      aria-pressed={following}
      aria-label={following ? t('park_unfollow') : t('park_follow')}
      className={cn(
        'size-10 shrink-0 flex items-center justify-center rounded-full transition-colors disabled:opacity-60',
        following
          ? 'text-primary bg-primary/10'
          : 'text-muted-foreground hover:text-primary hover:bg-muted',
        className
      )}
    >
      <Heart
        className="size-[20px]"
        strokeWidth={1.85}
        fill={following ? 'currentColor' : 'none'}
      />
    </button>
  );
}
