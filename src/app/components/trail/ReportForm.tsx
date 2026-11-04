import { useEffect, useId, useRef, useState } from 'react';
import { Smile, Meh, Frown, Sun, Droplet, Check } from 'lucide-react';
import { ReportFormData, OVERALL_OPTIONS, SURFACE_OPTIONS, HAZARD_OPTIONS } from '../../lib/schemas';
import { cn } from '../ui/utils';
import { useLang, TranslationKey } from '../../contexts/LangContext';
import { STATUS_DOT } from './StatusCircle';

const overallKeyMap: Record<string, TranslationKey> = {
  great: 'condition_great',
  good: 'condition_good',
  fair: 'condition_fair',
  poor: 'condition_poor',
};

const surfaceKeyMap: Record<string, TranslationKey> = {
  dry: 'surface_dry',
  damp: 'surface_damp',
  muddy: 'surface_muddy',
};

const hazardKeyMap: Record<string, TranslationKey> = {
  'downed-trees': 'hazard_downed_trees',
  'broken-bridge': 'hazard_broken_bridge',
  maintenance: 'hazard_maintenance',
  slippery: 'hazard_slippery',
  other: 'hazard_other',
};

interface ReportFormProps {
  onSubmit: (data: ReportFormData) => void;
  isSubmitting?: boolean;
}

const overallIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  great: Smile,
  good: Smile,
  fair: Meh,
  poor: Frown,
};

const surfaceIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  dry: Sun,
  damp: Droplet,
  muddy: Droplet,
};

/** A wet or muddy surface caps the overall rating at Fair. */
const WET_SURFACE_OVERALL = ['fair', 'poor'];

function moveRadioSelection(
  values: string[],
  current: string,
  key: string
): string | null {
  const idx = values.indexOf(current);
  if (idx < 0) return values[0] ?? null;
  if (key === 'ArrowRight' || key === 'ArrowDown') {
    return values[(idx + 1) % values.length] ?? null;
  }
  if (key === 'ArrowLeft' || key === 'ArrowUp') {
    return values[(idx - 1 + values.length) % values.length] ?? null;
  }
  return null;
}

export function ReportForm({ onSubmit, isSubmitting }: ReportFormProps) {
  const { t } = useLang();
  const [overall, setOverall] = useState<string>('great');
  const [surface, setSurface] = useState<string>('dry');
  const [hazards, setHazards] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [overallAnnounce, setOverallAnnounce] = useState('');

  const overallLabelId = useId();
  const surfaceLabelId = useId();
  const hazardsLabelId = useId();
  const hazardsHintId = useId();
  const wetHintId = useId();
  const overallLiveId = useId();
  const notesLabelId = useId();
  const notesCounterId = useId();
  const notesFieldId = useId();
  const overallRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const surfaceRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const announceClearRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isOverallAllowed = (value: string) =>
    surface === 'dry' || WET_SURFACE_OVERALL.includes(value);

  const allowedOverallValues = OVERALL_OPTIONS.map((o) => o.value).filter(isOverallAllowed);
  const surfaceValues = SURFACE_OPTIONS.map((o) => o.value);
  const wetSurface = surface !== 'dry';

  useEffect(() => {
    return () => {
      if (announceClearRef.current) clearTimeout(announceClearRef.current);
    };
  }, []);

  const announceOverallChange = () => {
    setOverallAnnounce(t('form_overall_auto_fair'));
    if (announceClearRef.current) clearTimeout(announceClearRef.current);
    announceClearRef.current = setTimeout(() => setOverallAnnounce(''), 4000);
  };

  const selectSurface = (value: string) => {
    setSurface(value);
    if (value !== 'dry' && !WET_SURFACE_OVERALL.includes(overall)) {
      setOverall('fair');
      announceOverallChange();
    }
  };

  const toggleHazard = (value: string) => {
    setHazards((prev) =>
      prev.includes(value) ? prev.filter((h) => h !== value) : [...prev, value]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const surfaceOpt = SURFACE_OPTIONS.find((o) => o.value === surface);
    if (!surfaceOpt) return;
    const conditions = [
      overall,
      `surface:${surface}`,
      ...hazards.map((h) => `hazard:${h}`),
    ];
    onSubmit({
      status: surfaceOpt.status,
      conditions,
      notes: notes.trim() || undefined,
    });
  };

  const sectionLabelClass =
    'text-[12px] font-bold tracking-[1.2px] uppercase text-muted-foreground';

  return (
    <form onSubmit={handleSubmit} className="space-y-6 pb-24">
      {/* Trail Surface first so wet/muddy rules are clear before Overall */}
      <section>
        <h2 id={surfaceLabelId} className={cn(sectionLabelClass, 'mb-3')}>
          {t('form_surface_label')}
        </h2>
        <div
          role="radiogroup"
          aria-labelledby={surfaceLabelId}
          className="grid grid-cols-3 gap-2"
        >
          {SURFACE_OPTIONS.map((opt) => {
            const Icon = surfaceIcons[opt.value];
            const active = surface === opt.value;
            return (
              <button
                key={opt.value}
                ref={(el) => {
                  surfaceRefs.current[opt.value] = el;
                }}
                type="button"
                role="radio"
                aria-checked={active}
                tabIndex={active ? 0 : -1}
                onClick={() => selectSurface(opt.value)}
                onKeyDown={(e) => {
                  const next = moveRadioSelection(surfaceValues, surface, e.key);
                  if (!next) return;
                  e.preventDefault();
                  selectSurface(next);
                  requestAnimationFrame(() => surfaceRefs.current[next]?.focus());
                }}
                className={cn(
                  'h-[78px] border-[1.5px] flex flex-col items-center justify-center gap-1 transition-colors rounded-[20px]',
                  active
                    ? 'text-primary-foreground'
                    : 'bg-card border-border text-foreground'
                )}
                style={
                  active
                    ? {
                        backgroundColor: STATUS_DOT[opt.status],
                        borderColor: STATUS_DOT[opt.status],
                      }
                    : undefined
                }
              >
                <Icon className="size-5" />
                <span className="text-[11px] font-bold">{t(surfaceKeyMap[opt.value])}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Overall Condition */}
      <section>
        <h2 id={overallLabelId} className={cn(sectionLabelClass, 'mb-3')}>
          {t('form_condition_label')}
        </h2>
        <div
          role="radiogroup"
          aria-labelledby={overallLabelId}
          aria-describedby={
            wetSurface ? `${wetHintId} ${overallLiveId}` : overallLiveId
          }
          className="grid grid-cols-4 gap-2"
        >
          {OVERALL_OPTIONS.map((opt) => {
            const Icon = overallIcons[opt.value];
            const active = overall === opt.value;
            const allowed = isOverallAllowed(opt.value);
            return (
              <button
                key={opt.value}
                ref={(el) => {
                  overallRefs.current[opt.value] = el;
                }}
                type="button"
                role="radio"
                aria-checked={active}
                aria-disabled={!allowed}
                tabIndex={active ? 0 : -1}
                disabled={!allowed}
                onClick={() => setOverall(opt.value)}
                onKeyDown={(e) => {
                  const next = moveRadioSelection(allowedOverallValues, overall, e.key);
                  if (!next) return;
                  e.preventDefault();
                  setOverall(next);
                  overallRefs.current[next]?.focus();
                }}
                className={cn(
                  'h-[78px] border-[1.5px] flex flex-col items-center justify-center gap-1 transition-colors rounded-[20px]',
                  active
                    ? 'bg-primary border-primary text-primary-foreground'
                    : 'bg-card border-border text-foreground',
                  !allowed && 'opacity-35 cursor-not-allowed'
                )}
              >
                <Icon className="size-6" />
                <span className="text-[11px] font-bold">{t(overallKeyMap[opt.value])}</span>
              </button>
            );
          })}
        </div>
        {/* Reserved height so showing the wet hint doesn't shift taps below */}
        <div className="mt-2 min-h-[36px]">
          <p
            id={wetHintId}
            className={cn(
              'text-[12px] text-muted-foreground',
              wetSurface ? 'visible' : 'invisible'
            )}
            aria-hidden={!wetSurface}
          >
            {t('form_overall_wet_hint')}
          </p>
          <p
            id={overallLiveId}
            role="status"
            aria-live="polite"
            className="sr-only"
          >
            {overallAnnounce}
          </p>
        </div>
      </section>

      {/* Hazards — multi-select; Ninguno clears the rest */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 id={hazardsLabelId} className={sectionLabelClass}>
            {t('form_hazards_label')}
          </h2>
          <span id={hazardsHintId} className="text-[12px] text-muted-foreground">
            {t('form_select_hazards')}
          </span>
        </div>
        <div
          className="flex flex-wrap gap-2"
          role="group"
          aria-labelledby={hazardsLabelId}
          aria-describedby={hazardsHintId}
        >
          <button
            type="button"
            onClick={() => setHazards([])}
            aria-pressed={hazards.length === 0}
            className={cn(
              'h-9 px-4 rounded-full border-[1.5px] text-[13px] font-bold transition-colors inline-flex items-center gap-1.5',
              hazards.length === 0
                ? 'bg-primary border-primary text-primary-foreground'
                : 'bg-card border-border text-foreground'
            )}
          >
            {t('hazard_none')}
          </button>
          {HAZARD_OPTIONS.map((opt) => {
            const active = hazards.includes(opt.value);
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => toggleHazard(opt.value)}
                aria-pressed={active}
                className={cn(
                  'h-9 px-4 rounded-full border-[1.5px] text-[13px] font-bold transition-colors inline-flex items-center gap-1.5',
                  active
                    ? 'bg-primary border-primary text-primary-foreground'
                    : 'bg-card border-border text-foreground'
                )}
              >
                {active && <Check className="size-3.5 shrink-0" strokeWidth={2.5} />}
                {t(hazardKeyMap[opt.value] ?? 'hazard_other')}
              </button>
            );
          })}
        </div>
      </section>

      {/* Notes */}
      <section>
        <label
          id={notesLabelId}
          htmlFor={notesFieldId}
          className={cn(sectionLabelClass, 'mb-3 block')}
        >
          {t('form_notes_label')}
        </label>
        <div className="bg-card rounded-[14px] border-[1.5px] border-border p-4">
          <textarea
            id={notesFieldId}
            value={notes}
            onChange={(e) => setNotes(e.target.value.slice(0, 250))}
            placeholder={t('form_notes_submit_placeholder')}
            aria-describedby={notesCounterId}
            className="w-full min-h-[100px] text-[16px] text-foreground placeholder:text-muted-foreground resize-none outline-none"
            maxLength={250}
          />
          <p
            id={notesCounterId}
            className="text-right text-[12px] text-muted-foreground mt-2"
            aria-live="polite"
          >
            {notes.length}/250
          </p>
        </div>
      </section>

      {/* Submit */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full h-[53px] bg-primary rounded-[14px] text-primary-foreground text-[13px] font-bold tracking-[1.5px] disabled:opacity-60"
      >
        {isSubmitting ? t('form_submitting').toUpperCase() : t('form_submit').toUpperCase()}
      </button>
    </form>
  );
}
