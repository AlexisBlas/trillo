import { useEffect, useState } from 'react';
import { Bell, X, Globe, Info, LayoutDashboard } from 'lucide-react';
import { Link } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../ui/utils';
import { useLang, Lang } from '../../contexts/LangContext';
import { useAuth } from '../../contexts/AuthContext';

export function TopNav() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { lang, setLang, t } = useLang();
  const { isAdmin } = useAuth();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

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

        <button className="size-10 flex items-center justify-center">
          <Bell className="size-[22px] text-[#1a3010]" strokeWidth={1.83333} />
        </button>
      </nav>

      {/* Backdrop */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="fixed inset-0 z-50 bg-black/30"
            onClick={() => setMenuOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Drawer */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            key="drawer"
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', stiffness: 340, damping: 34 }}
            className="fixed top-0 left-0 bottom-0 z-50 w-[82vw] max-w-[320px] bg-[#F5F0E8] flex flex-col shadow-[4px_0_32px_rgba(0,0,0,0.12)]"
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

            <div className="flex-1 overflow-y-auto px-5 pt-6 pb-8 flex flex-col gap-8">
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
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
