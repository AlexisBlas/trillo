import { useState } from 'react';
import { Smile, Meh, Frown, Sun, Droplet, Check } from 'lucide-react';
import { ReportFormData, OVERALL_OPTIONS, SURFACE_OPTIONS, HAZARD_OPTIONS } from '../../lib/schemas';
import { cn } from '../ui/utils';
import { useLang, TranslationKey } from '../../contexts/LangContext';

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

export function ReportForm({ onSubmit, isSubmitting }: ReportFormProps) {
  const { t } = useLang();
  const [overall, setOverall] = useState<string>('great');
  const [surface, setSurface] = useState<string>('dry');
  const [hazards, setHazards] = useState<string[]>([]);
  const [notes, setNotes] = useState('');

  const toggleHazard = (value: string) => {
    setHazards((prev) =>
      prev.includes(value) ? prev.filter((h) => h !== value) : [...prev, value]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const overallOpt = OVERALL_OPTIONS.find((o) => o.value === overall);
    if (!overallOpt) return;
    const conditions = [
      overall,
      `surface:${surface}`,
      ...hazards.map((h) => `hazard:${h}`),
    ];
    onSubmit({
      status: overallOpt.status,
      conditions,
      notes: notes.trim() || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 pb-24">
      {/* Overall Condition */}
      <section>
        <h2 className="text-[11px] font-bold tracking-[1.2px] uppercase text-[#374151] mb-3">
          {t('form_condition_label')}
        </h2>
        <div className="grid grid-cols-4 gap-2">
          {OVERALL_OPTIONS.map((opt) => {
            const Icon = overallIcons[opt.value];
            const active = overall === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setOverall(opt.value)}
                className={cn(
                  'h-[78px] border-[1.5px] flex flex-col items-center justify-center gap-1 transition-colors rounded-[20px]',
                  active
                    ? 'bg-[#2c4a1e] border-[#2c4a1e] text-white'
                    : 'bg-white border-[#e5e7eb] text-[#1a1a1a]'
                )}
              >
                <Icon className="size-6" />
                <span className="text-[11px] font-bold">{t(overallKeyMap[opt.value])}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Trail Surface */}
      <section>
        <h2 className="text-[11px] font-bold tracking-[1.2px] uppercase text-[#374151] mb-3">
          {t('form_surface_label')}
        </h2>
        <div className="grid grid-cols-3 gap-2">
          {SURFACE_OPTIONS.map((opt) => {
            const Icon = surfaceIcons[opt.value];
            const active = surface === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setSurface(opt.value)}
                className={cn(
                  'h-[78px] border-[1.5px] flex flex-col items-center justify-center gap-1 transition-colors rounded-[20px]',
                  active
                    ? 'bg-[#2c4a1e] border-[#2c4a1e] text-white'
                    : 'bg-white border-[#e5e7eb] text-[#1a1a1a]'
                )}
              >
                <Icon className="size-5" />
                <span className="text-[11px] font-bold">{t(surfaceKeyMap[opt.value])}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Hazards — multi-select */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[11px] font-bold tracking-[1.2px] uppercase text-[#374151]">
            {t('form_hazards_label')}
          </h2>
          <span className="text-[12px] text-[#4b5563]">{t('form_select_hazards')}</span>
        </div>
        <div
          className="flex flex-wrap gap-2"
          role="group"
          aria-label={t('form_hazards_label')}
        >
          <button
            type="button"
            onClick={() => setHazards([])}
            aria-pressed={hazards.length === 0}
            className={cn(
              'h-9 px-4 rounded-full border-[1.5px] text-[13px] font-bold transition-colors inline-flex items-center gap-1.5',
              hazards.length === 0
                ? 'bg-[#2c4a1e] border-[#2c4a1e] text-white'
                : 'bg-white border-[#e5e7eb] text-[#1a1a1a]'
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
                    ? 'bg-[#2c4a1e] border-[#2c4a1e] text-white'
                    : 'bg-white border-[#e5e7eb] text-[#1a1a1a]'
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
        <h2 className="text-[11px] font-bold tracking-[1.2px] uppercase text-[#374151] mb-3">
          {t('form_notes_label')}
        </h2>
        <div className="bg-white rounded-[14px] border-[1.5px] border-[#e5e7eb] p-4">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value.slice(0, 250))}
            placeholder={t('form_notes_submit_placeholder')}
            className="w-full min-h-[100px] text-[16px] text-[#1a1a1a] placeholder:text-[#4b5563] resize-none outline-none"
            maxLength={250}
          />
          <p className="text-right text-[12px] text-[#4b5563] mt-2">{notes.length}/250</p>
        </div>
      </section>

      {/* Submit */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full h-[53px] bg-[#2c4a1e] rounded-[14px] text-white text-[13px] font-bold tracking-[1.5px] disabled:opacity-60"
      >
        {isSubmitting ? t('form_submitting').toUpperCase() : t('form_submit').toUpperCase()}
      </button>
    </form>
  );
}
