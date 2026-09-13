import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Bookmark, Share, X, Plus } from 'lucide-react';
import { useLang } from '../../contexts/LangContext';
import { isAppEmbed } from '../../lib/embed';

const STORAGE_KEY = 'trillo:a2hs-dismissed';

export function AddToHomeScreenPrompt() {
  const [visible, setVisible] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const { t } = useLang();

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (isAppEmbed()) return;

    if (localStorage.getItem(STORAGE_KEY)) return;

    const standalone =
      window.matchMedia?.('(display-mode: standalone)').matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
    if (standalone) return;

    const ua = window.navigator.userAgent;
    setIsIOS(/iphone|ipad|ipod/i.test(ua));

    const timer = setTimeout(() => setVisible(true), 1800);
    return () => clearTimeout(timer);
  }, []);

  const dismiss = () => {
    setVisible(false);
    try {
      localStorage.setItem(STORAGE_KEY, '1');
    } catch {}
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          transition={{ duration: 0.28, ease: 'easeOut' }}
          className="fixed inset-x-3 bottom-[91px] z-40 md:hidden"
          role="dialog"
          aria-label={t('a2hs_aria')}
        >
          <div className="relative bg-[#151C18] border-[1.5px] border-[#24302A] shadow-[0px_6px_20px_rgba(0,0,0,0.12)] p-4 pr-9 rounded-[32px]">
            <button
              onClick={dismiss}
              aria-label="Dismiss"
              className="absolute top-2.5 right-2.5 size-7 inline-flex items-center justify-center rounded-full text-[#8B958C] hover:bg-[#24302A] transition-colors"
            >
              <X className="size-4" />
            </button>

            <div className="flex items-start gap-3">
              <div className="shrink-0 size-10 rounded-[12px] bg-[#5EE08A] flex items-center justify-center">
                <Bookmark className="size-5 text-white" />
              </div>
              <div className="min-w-0">
                <h3 className="text-[14.5px] font-bold text-[#F2F5F2] leading-snug">
                  {t('a2hs_title')}
                </h3>
                <p className="text-[13px] text-[#A8C4A0] leading-[18px] mt-1">
                  {isIOS ? (
                    <>
                      {t('a2hs_ios').replace('"Add to Home Screen."', '')}
                      <Share className="inline size-3.5 -mt-0.5 text-[#5EE08A]" />{' '}
                      <span className="font-bold">"Add to Home Screen."</span>
                    </>
                  ) : (
                    t('a2hs_android')
                  )}
                </p>
              </div>
            </div>

            <button
              onClick={dismiss}
              className="mt-3 w-full h-10 inline-flex items-center justify-center gap-1.5 rounded-[12px] bg-[#5EE08A] text-[#0E1510] text-[13.5px] font-bold hover:bg-[#4ADE80] transition-colors"
            >
              <Plus className="size-4" />
              {t('a2hs_got_it')}
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
