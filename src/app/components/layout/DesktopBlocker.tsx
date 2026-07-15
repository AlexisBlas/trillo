import { Smartphone } from 'lucide-react';
import { useLang } from '../../contexts/LangContext';

export function DesktopBlocker() {
  const { t } = useLang();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#F5F0E8] px-8">
      <div className="flex max-w-md flex-col items-center text-center">
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#1A1A1A]">
          <Smartphone className="h-8 w-8 text-[#F5F0E8]" />
        </div>
        <h1 className="mb-3 text-2xl font-semibold text-[#1A1A1A]">
          {t('desktop_title')}
        </h1>
        <p className="text-base leading-relaxed text-[#1A1A1A]/70">
          {t('desktop_body')}
        </p>
      </div>
    </div>
  );
}
