import { useLang, type TranslationKey } from '../../contexts/LangContext';
import { getOverallRating, type OverallRating } from '../../lib/schemas';

const RATING_KEY: Record<OverallRating, TranslationKey> = {
  great: 'condition_great',
  good: 'condition_good',
  fair: 'condition_fair',
  poor: 'condition_poor',
};

/** "Overall: Poor" from a report's condition tags; renders nothing without a rating. */
export function OverallRatingLabel({
  conditions,
  className,
}: {
  conditions: string[] | null | undefined;
  className?: string;
}) {
  const { t } = useLang();
  const rating = getOverallRating(conditions);
  if (!rating) return null;
  return (
    <span className={className}>
      {t('report_overall')}: <span className="font-bold text-foreground">{t(RATING_KEY[rating])}</span>
    </span>
  );
}
