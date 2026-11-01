import { Smartphone } from 'lucide-react';
import { useLang } from '../../contexts/LangContext';

export function DesktopBlocker() {
  const { t } = useLang();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background px-8">
      <div className="flex max-w-md flex-col items-center text-center">
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#E6EBE6]">
          <Smartphone className="h-8 w-8 text-primary-foreground" />
        </div>
        <h1 className="mb-3 text-2xl font-semibold text-foreground">
          {t('desktop_title')}
        </h1>
        <p className="text-base leading-relaxed text-foreground/70">
          {t('desktop_body')}
        </p>
      </div>
    </div>
  );
}
