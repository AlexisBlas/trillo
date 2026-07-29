import { useEffect, useState } from 'react';
import { Bell, X, Globe, Info, LayoutDashboard } from 'lucide-react';
import { Link, useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '../ui/utils';
import { useLang, Lang } from '../../contexts/LangContext';
import { useAuth } from '../../contexts/AuthContext';
import { useReportNotifications } from '../../hooks/useReportNotifications';
import { StatusBadge } from '../trail/StatusBadge';
import { cleanNotes } from '../../lib/text';

export function TopNav() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const { lang, setLang, t } = useLang();
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const { recent, unreadCount, isLoading, markSeen } = useReportNotifications(5);

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
    return () => { document.body.style.overflow = ''; };
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

  return (
    <>
      <nav
        className={cn(
          'sticky top-0 z-40 flex items-center justify-between h-[60px] px-5 transition-colors duration-200',
          scrolled
            ? 'bg-white shadow-[0px_1px_0_rgba(0,0,0,0.04)]'
            : 'bg-[#F5F0E8]'
        )}
      >
        <button
          onClick={() => setMenuOpen(true)}
          aria-label="Open menu"
          className="size-10 flex flex-col items-start justify-center gap-[5px] px-[9px] py-3"
        >
          <div className="bg-[#1a3010] h-[2px] w-[22px] rounded-[1px]" />
          <div className="bg-[#1a3010] h-[2px] w-4 rounded-[1px]" />
          <div className="bg-[#1a3010] h-[2px] w-5 rounded-[1px]" />
        </button>

        <Link to="/" className="flex items-center">
          <h1 className="font-bold text-[14px] tracking-[3px] text-[#1a3010]">
            TRILLO
          </h1>
        </Link>

        <button
          onClick={openNotifications}
          aria-label={t('notif_open')}
          className="relative size-10 flex items-center justify-center"
        >
          <Bell className="size-[22px] text-[#1a3010]" strokeWidth={1.83333} />
          {unreadCount > 0 && (
            <span
              className={cn(
                'absolute top-1.5 right-1.5 size-2.5 rounded-full bg-[#ef4444] ring-2',
                scrolled ? 'ring-white' : 'ring-[#F5F0E8]'
              )}
              aria-hidden
            />
          )}
        </button>
      </nav>

      {/* Backdrop */}
      <AnimatePresence>
        {(menuOpen || notifOpen) && (
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="fixed inset-0 z-[60] bg-black/30"
            onClick={() => {
              setMenuOpen(false);
              setNotifOpen(false);
            }}
          />
        )}
      </AnimatePresence>

      {/* Menu drawer */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            key="drawer"
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', stiffness: 340, damping: 34 }}
            className="fixed top-0 left-0 bottom-0 z-[60] w-[82vw] max-w-[320px] bg-[#F5F0E8] flex flex-col shadow-[4px_0_32px_rgba(0,0,0,0.12)]"
          >
            {/* Header */}
            <div className="flex items-center justify-between h-[60px] px-5 border-b border-[#e5e0d5]">
              <span className="font-bold text-[14px] tracking-[3px] text-[#1a3010]">TRILLO</span>
              <button
                onClick={() => setMenuOpen(false)}
                aria-label="Close menu"
                className="size-9 flex items-center justify-center rounded-full hover:bg-[#e5e0d5] transition-colors"
              >
                <X className="size-5 text-[#1a3010]" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 pt-6 pb-6 flex flex-col gap-8 min-h-0">
              {/* Language */}
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <Globe className="size-4 text-[#4b6b3a]" />
                  <p className="text-[11px] font-bold tracking-[1.2px] uppercase text-[#374151]">
                    {t('menu_language')}
                  </p>
                </div>
                <div className="flex gap-2">
                  {languages.map(({ value, label }) => (
                    <button
                      key={value}
                      onClick={() => setLang(value)}
                      className={cn(
                        'flex-1 h-11 rounded-[14px] text-[14px] font-bold transition-colors border-[1.5px]',
                        lang === value
                          ? 'bg-[#2c4a1e] text-white border-[#2c4a1e]'
                          : 'bg-white text-[#374151] border-[#e5e0d5] hover:border-[#2c4a1e]'
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </section>

              {/* Admin link */}
              {isAdmin && (
                <>
                  <div className="h-px bg-[#e5e0d5]" />
                  <section>
                    <Link
                      to="/admin"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-3 w-full h-11 px-4 rounded-[14px] bg-[#1a3010] text-white text-[14px] font-bold hover:bg-[#2c4a1e] transition-colors"
                    >
                      <LayoutDashboard className="size-4 shrink-0" />
                      Admin Dashboard
                    </Link>
                  </section>
                </>
              )}

              {/* Divider */}
              <div className="h-px bg-[#e5e0d5]" />

              {/* About */}
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <Info className="size-4 text-[#4b6b3a]" />
                  <p className="text-[11px] font-bold tracking-[1.2px] uppercase text-[#374151]">
                    {t('menu_about')}
                  </p>
                </div>
                <div className="bg-white rounded-[16px] border-[1.5px] border-[#e5e0d5] p-4">
                  <p className="text-[13px] font-bold text-[#1a3010] mb-1">Trillo</p>
                  <p className="text-[12px] text-[#374151] leading-[18px]">
                    {t('about_description')}
                  </p>
                  <p className="text-[11px] text-[#687588] mt-3">
                    {t('menu_version')} 1.0.0
                  </p>
                </div>
              </section>
            </div>

            <div className="shrink-0 px-5 pt-3 pb-[max(1.25rem,env(safe-area-inset-bottom))] border-t border-[#e5e0d5]">
              <p className="text-center text-[12px] text-[#374151] leading-[18px]">
                {t('menu_made_by')}{' '}
                <a
                  href="https://humbol.studio"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold text-[#2c4a1e] underline underline-offset-2"
                >
                  humbol.studio
                </a>
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Notifications panel */}
      <AnimatePresence>
        {notifOpen && (
          <motion.div
            key="notifications"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 340, damping: 34 }}
            className="fixed top-0 right-0 bottom-0 z-[60] w-[86vw] max-w-[360px] bg-[#F5F0E8] flex flex-col shadow-[-4px_0_32px_rgba(0,0,0,0.12)]"
          >
            <div className="flex items-center justify-between h-[60px] px-5 border-b border-[#e5e0d5]">
              <h2 className="text-[15px] font-bold text-[#1a3010]">{t('notif_title')}</h2>
              <button
                onClick={() => setNotifOpen(false)}
                aria-label="Close notifications"
                className="size-9 flex items-center justify-center rounded-full hover:bg-[#e5e0d5] transition-colors"
              >
                <X className="size-5 text-[#1a3010]" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 pt-4 pb-6">
              {isLoading && (
                <p className="text-[13px] text-[#687588] px-1">{t('loading')}</p>
              )}

              {!isLoading && recent.length === 0 && (
                <div className="bg-white rounded-[16px] border-[1.5px] border-[#e5e0d5] p-6 text-center">
                  <p className="text-[13px] text-[#374151]">{t('notif_empty')}</p>
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
                          className="bg-white border-[1.5px] border-[#e5e0d5] p-4 rounded-[20px] text-left active:scale-[0.99] transition-transform"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <p className="text-[14px] font-bold text-[#1a1a1a] truncate">
                                {displayName}
                              </p>
                              <p className="text-[12px] text-[#4b5563] truncate mt-0.5">
                                {trail.location || t('notif_new_trail')}
                              </p>
                              <p className="text-[11px] text-[#687588] mt-1">
                                {formatDistanceToNow(new Date(trail.created_at), {
                                  addSuffix: true,
                                })}
                              </p>
                            </div>
                            <span className="shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide bg-[#D97706] text-white">
                              {t('notif_new_trail_badge')}
                            </span>
                          </div>
                          <p className="text-[13px] leading-[19px] text-[#374151] mt-2.5">
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
                        className="bg-white border-[1.5px] border-[#e5e0d5] p-4 rounded-[20px] text-left active:scale-[0.99] transition-transform"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <p className="text-[14px] font-bold text-[#1a1a1a] truncate">
                              {title}
                            </p>
                            <p className="text-[12px] text-[#4b5563] truncate mt-0.5">
                              {subtitle}
                            </p>
                            <p className="text-[11px] text-[#687588] mt-1">
                              {formatDistanceToNow(new Date(report.created_at), {
                                addSuffix: true,
                              })}
                            </p>
                          </div>
                          <StatusBadge status={report.status} size="sm" />
                        </div>
                        {notes && (
                          <p className="text-[13px] leading-[19px] text-[#374151] mt-2.5 line-clamp-2">
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
                className="mt-4 w-full h-11 rounded-[14px] text-[13px] font-bold text-[#2c4a1e] border-[1.5px] border-[#e5e0d5] bg-white"
              >
                {t('notif_view_all')}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
