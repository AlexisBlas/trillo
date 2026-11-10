import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Bell,
  X,
  Globe,
  Info,
  LayoutDashboard,
  Sun,
  Moon,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../ui/utils';
import { useLang, Lang } from '../../contexts/LangContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useReportNotifications } from '../../hooks/useReportNotifications';
import { StatusBadge } from '../trail/StatusBadge';
import { cleanNotes, formatRelativeTime } from '../../lib/text';

/** Above TopNav (z-40) and BottomNav (z-50); portaled to body to escape page transforms. */
const OVERLAY_Z = 'z-[100]';

export function TopNav() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [portalReady, setPortalReady] = useState(false);
  const { lang, setLang, t } = useLang();
  const { theme, setTheme } = useTheme();
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const { recent, unreadCount, isLoading, markSeen } = useReportNotifications(5);

  useEffect(() => {
    setPortalReady(true);
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (menuOpen || notifOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen, notifOpen]);

  useEffect(() => {
    if (notifOpen) markSeen();
  }, [notifOpen, recent, markSeen]);

  const openNotifications = () => {
    setMenuOpen(false);
    setNotifOpen(true);
  };

  const languages: { value: Lang; label: string }[] = [
    { value: 'en', label: t('lang_en') },
    { value: 'es', label: t('lang_es') },
  ];

  const overlays =
    portalReady &&
    createPortal(
      <>
        <AnimatePresence>
          {(menuOpen || notifOpen) && (
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.22 }}
              className={cn('fixed inset-0 bg-[color:var(--overlay)]', OVERLAY_Z)}
              onClick={() => {
                setMenuOpen(false);
                setNotifOpen(false);
              }}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {menuOpen && (
            <motion.div
              key="drawer"
              role="dialog"
              aria-modal="true"
              aria-label="Menu"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 340, damping: 34 }}
              className={cn(
                'fixed top-0 left-0 bottom-0 w-[82vw] max-w-[320px] bg-background flex flex-col shadow-[4px_0_32px_rgba(0,0,0,0.18)]',
                OVERLAY_Z
              )}
            >
              <div className="flex items-center justify-between h-[60px] px-5 border-b border-border">
                <span className="font-bold text-[14px] tracking-[3px] text-foreground">
                  TRILLO
                </span>
                <button
                  type="button"
                  onClick={() => setMenuOpen(false)}
                  aria-label="Close menu"
                  className="size-9 flex items-center justify-center rounded-full hover:bg-muted transition-colors"
                >
                  <X className="size-5 text-foreground" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-5 pt-6 pb-6 flex flex-col gap-8 min-h-0">
                <section>
                  <div className="flex items-center gap-2 mb-3">
                    <Globe className="size-4 text-accent-foreground" />
                    <p className="text-[11px] font-bold tracking-[1.2px] uppercase text-muted-foreground">
                      {t('menu_language')}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {languages.map(({ value, label }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setLang(value)}
                        className={cn(
                          'flex-1 h-11 rounded-[14px] text-[14px] font-bold transition-colors border-[1.5px]',
                          lang === value
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-card text-muted-foreground border-border hover:border-primary'
                        )}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </section>

                <div className="h-px bg-border" />

                <section>
                  <div className="flex items-center gap-2 mb-3">
                    {theme === 'dark' ? (
                      <Moon className="size-4 text-accent-foreground" />
                    ) : (
                      <Sun className="size-4 text-accent-foreground" />
                    )}
                    <p className="text-[11px] font-bold tracking-[1.2px] uppercase text-muted-foreground">
                      {t('menu_appearance')}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setTheme('light')}
                      aria-pressed={theme === 'light'}
                      className={cn(
                        'flex-1 h-11 rounded-[14px] text-[14px] font-bold transition-colors border-[1.5px] inline-flex items-center justify-center gap-2',
                        theme === 'light'
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-card text-muted-foreground border-border hover:border-primary'
                      )}
                    >
                      <Sun className="size-4" />
                      {t('theme_light')}
                    </button>
                    <button
                      type="button"
                      onClick={() => setTheme('dark')}
                      aria-pressed={theme === 'dark'}
                      className={cn(
                        'flex-1 h-11 rounded-[14px] text-[14px] font-bold transition-colors border-[1.5px] inline-flex items-center justify-center gap-2',
                        theme === 'dark'
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-card text-muted-foreground border-border hover:border-primary'
                      )}
                    >
                      <Moon className="size-4" />
                      {t('theme_dark')}
                    </button>
                  </div>
                </section>

                {isAdmin && (
                  <>
                    <div className="h-px bg-border" />
                    <section>
                      <Link
                        to="/admin"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-3 w-full h-11 px-4 rounded-[14px] bg-primary text-primary-foreground text-[14px] font-bold hover:bg-[color:var(--primary-dark)] transition-colors"
                      >
                        <LayoutDashboard className="size-4 shrink-0" />
                        Admin Dashboard
                      </Link>
                    </section>
                  </>
                )}

                <div className="h-px bg-border" />

                <section>
                  <div className="flex items-center gap-2 mb-3">
                    <Info className="size-4 text-accent-foreground" />
                    <p className="text-[11px] font-bold tracking-[1.2px] uppercase text-muted-foreground">
                      {t('menu_about')}
                    </p>
                  </div>
                  <div className="bg-card rounded-[16px] border-[1.5px] border-border p-4">
                    <p className="text-[13px] font-bold text-foreground mb-1">Trillo</p>
                    <p className="text-[12px] text-muted-foreground leading-[18px]">
                      {t('about_description')}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-3">
                      {t('menu_version')} 1.0.0
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-2">
                      <a
                        href="https://open-meteo.com/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline underline-offset-2 hover:text-foreground transition-colors"
                      >
                        {t('powered_by_open_meteo')}
                      </a>
                    </p>
                  </div>
                </section>
              </div>

              <div className="shrink-0 px-5 pt-3 pb-[max(1.25rem,env(safe-area-inset-bottom))] border-t border-border">
                <p className="text-center text-[12px] text-muted-foreground leading-[18px]">
                  {t('menu_made_by')}{' '}
                  <a
                    href="https://humbol.studio"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-bold text-primary underline underline-offset-2"
                  >
                    humbol.studio
                  </a>
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {notifOpen && (
            <motion.div
              key="notifications"
              role="dialog"
              aria-modal="true"
              aria-label={t('notif_title')}
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 340, damping: 34 }}
              className={cn(
                'fixed top-0 right-0 bottom-0 w-[86vw] max-w-[360px] bg-background flex flex-col shadow-[-4px_0_32px_rgba(0,0,0,0.18)]',
                OVERLAY_Z
              )}
            >
              <div className="flex items-center justify-between h-[60px] px-5 border-b border-border">
                <h2 className="text-[15px] font-bold text-foreground">{t('notif_title')}</h2>
                <button
                  type="button"
                  onClick={() => setNotifOpen(false)}
                  aria-label="Close notifications"
                  className="size-9 flex items-center justify-center rounded-full hover:bg-muted transition-colors"
                >
                  <X className="size-5 text-foreground" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-4 pt-4 pb-6">
                {isLoading && (
                  <p className="text-[13px] text-muted-foreground px-1">{t('loading')}</p>
                )}

                {!isLoading && recent.length === 0 && (
                  <div className="bg-card rounded-[16px] border-[1.5px] border-border p-6 text-center">
                    <p className="text-[13px] text-muted-foreground">{t('notif_empty')}</p>
                  </div>
                )}

                {!isLoading && recent.length > 0 && (
                  <div className="flex flex-col gap-2.5">
                    {recent.map((item) => {
                      if (item.kind === 'trail') {
                        const { trail } = item;
                        const displayName = trail.name.includes(' - ')
                          ? trail.name.split(' - ').slice(1).join(' - ')
                          : trail.name;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => {
                              setNotifOpen(false);
                              navigate(`/trails/${trail.id}`);
                            }}
                            className="bg-card border-[1.5px] border-border p-4 rounded-[20px] text-left active:scale-[0.99] transition-transform"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0 flex-1">
                                <p className="text-[14px] font-bold text-foreground truncate">
                                  {displayName}
                                </p>
                                <p className="text-[12px] text-muted-foreground truncate mt-0.5">
                                  {trail.location || t('notif_new_trail')}
                                </p>
                                <p className="text-[11px] text-muted-foreground mt-1">
                                  {formatRelativeTime(trail.created_at, lang)}
                                </p>
                              </div>
                              <span className="shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide bg-highlight text-white">
                                {t('notif_new_trail_badge')}
                              </span>
                            </div>
                            <p className="text-[13px] leading-[19px] text-muted-foreground mt-2.5">
                              {t('notif_new_trail')}
                            </p>
                          </button>
                        );
                      }

                      const report = item.report;
                      const parkName = report.trails?.location || report.park_name;
                      const trailName = report.trails?.name;
                      const title = trailName
                        ? trailName.includes(' - ')
                          ? trailName.split(' - ').slice(1).join(' - ')
                          : trailName
                        : parkName || t('reports_unknown_trail');
                      const subtitle = trailName
                        ? parkName || t('notif_park_overview')
                        : t('notif_park_overview');
                      const notes = cleanNotes(report.notes);

                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            setNotifOpen(false);
                            if (report.trail_id) {
                              navigate(`/trails/${report.trail_id}`);
                            } else if (parkName) {
                              navigate(`/parks/${encodeURIComponent(parkName)}`);
                            } else {
                              navigate('/reports');
                            }
                          }}
                          className="bg-card border-[1.5px] border-border p-4 rounded-[20px] text-left active:scale-[0.99] transition-transform"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <p className="text-[14px] font-bold text-foreground truncate">
                                {title}
                              </p>
                              <p className="text-[12px] text-muted-foreground truncate mt-0.5">
                                {subtitle}
                              </p>
                              <p className="text-[11px] text-muted-foreground mt-1">
                                {formatRelativeTime(report.created_at, lang)}
                              </p>
                            </div>
                            <StatusBadge status={report.status} size="sm" />
                          </div>
                          {notes && (
                            <p className="text-[13px] leading-[19px] text-muted-foreground mt-2.5 line-clamp-2">
                              {notes}
                            </p>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setNotifOpen(false);
                    navigate('/reports');
                  }}
                  className="mt-4 w-full h-11 rounded-[14px] text-[13px] font-bold text-primary border-[1.5px] border-border bg-card"
                >
                  {t('notif_view_all')}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </>,
      document.body
    );

  return (
    <>
      <nav
        aria-label={t('nav_aria_top')}
        className={cn(
          'sticky top-0 z-40 flex items-center justify-between h-[60px] px-5 transition-colors duration-200',
          scrolled
            ? 'bg-card shadow-[0px_1px_0_rgba(0,0,0,0.04)]'
            : 'bg-background'
        )}
      >
        <button
          type="button"
          onClick={() => setMenuOpen(true)}
          aria-label="Open menu"
          className="size-10 flex flex-col items-start justify-center gap-[5px] px-[9px] py-3"
        >
          <div className="bg-foreground h-[2px] w-[22px] rounded-[1px]" />
          <div className="bg-foreground h-[2px] w-4 rounded-[1px]" />
          <div className="bg-foreground h-[2px] w-5 rounded-[1px]" />
        </button>

        <Link to="/" className="flex items-center">
          <h1 className="font-bold text-[14px] tracking-[3px] text-foreground">
            TRILLO
          </h1>
        </Link>

        <button
          type="button"
          onClick={openNotifications}
          aria-label={t('notif_open')}
          className="relative size-10 flex items-center justify-center"
        >
          <Bell className="size-[22px] text-foreground" strokeWidth={1.83333} />
          {unreadCount > 0 && (
            <span
              className={cn(
                'absolute top-1.5 right-1.5 size-2.5 rounded-full bg-[#C96B6B] ring-2',
                'ring-background'
              )}
              aria-hidden
            />
          )}
        </button>
      </nav>

      {overlays}
    </>
  );
}
