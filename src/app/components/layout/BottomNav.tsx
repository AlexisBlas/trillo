import { Link, useLocation } from 'react-router';
import { Home, Map, FileText, User } from 'lucide-react';
import { cn } from '../ui/utils';
import { useLang } from '../../contexts/LangContext';

export function BottomNav() {
  const location = useLocation();
  const { t } = useLang();

  const navItems = [
    { id: 'home', to: '/', icon: Home, label: t('nav_home') },
    { id: 'trails', to: '/search', icon: Map, label: t('nav_trails') },
    { id: 'reports', to: '/reports', icon: FileText, label: t('nav_reports') },
    { id: 'profile', to: '/profile', icon: User, label: t('nav_profile') },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border md:hidden">
      <div className="flex items-center h-[79px] px-2 pb-5 pt-0.5">
        {navItems.map((item) => {
          const isActive = location.pathname === item.to;
          const Icon = item.icon;

          return (
            <Link
              key={item.id}
              to={item.to}
              className="relative flex-1 h-[48.5px]"
            >
              <div className="relative size-full">
                <Icon
                  className={cn(
                    'absolute left-1/2 -translate-x-1/2 top-[10px] size-[22px]',
                    isActive ? 'text-primary' : 'text-muted-foreground'
                  )}
                  strokeWidth={1.83333}
                />
                <p
                  className={cn(
                    'absolute left-1/2 -translate-x-1/2 top-[35px] text-[12px] text-center whitespace-nowrap',
                    isActive
                      ? 'font-bold text-primary'
                      : 'font-medium text-muted-foreground'
                  )}
                >
                  {item.label}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
