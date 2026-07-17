import { cn } from '../ui/utils';
import { useLang } from '../../contexts/LangContext';
import {
  getCriticalHazards,
  HAZARD_COLORS,
  type CriticalHazard,
} from '../../lib/hazards';

interface HazardNoticeProps {
  conditions: string[] | null | undefined;
  /** Trail where this hazard was reported (shown under the label). */
  trailName?: string | null;
  /** `callout` = icon + label + advisory note; `chips` = compact icon labels */
  variant?: 'callout' | 'chips';
  className?: string;
}

function Callout({
  hazards,
  trailName,
}: {
  hazards: CriticalHazard[];
  trailName?: string | null;
}) {
  const { t } = useLang();

  return (
    <div className="flex flex-col gap-2">
      {hazards.map((hazard) => {
        const Icon = hazard.icon;
        return (
          <div
            key={hazard.id}
            className="flex gap-3 rounded-[14px] border px-3.5 py-3"
            style={{
              backgroundColor: HAZARD_COLORS.cardBg,
              borderColor: HAZARD_COLORS.cardBorder,
            }}
            role="status"
          >
            <div
              className="size-9 shrink-0 rounded-full flex items-center justify-center"
              style={{ backgroundColor: HAZARD_COLORS.iconBg }}
            >
              <Icon
                className="size-4"
                style={{ color: HAZARD_COLORS.ink }}
                strokeWidth={1.75}
              />
            </div>
            <div className="min-w-0 flex-1">
              <p
                className="text-[13px] font-bold leading-tight"
                style={{ color: HAZARD_COLORS.ink }}
              >
                {t(hazard.labelKey)}
              </p>
              {trailName ? (
                <p
                  className="text-[13px] font-bold mt-1 truncate"
                  style={{ color: HAZARD_COLORS.ink }}
                >
                  {trailName}
                </p>
              ) : null}
              <p
                className="text-[12.5px] leading-[18px] mt-0.5"
                style={{ color: HAZARD_COLORS.ink }}
              >
                {t(hazard.noteKey)}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Chips({
  hazards,
  trailName,
}: {
  hazards: CriticalHazard[];
  trailName?: string | null;
}) {
  const { t } = useLang();

  return (
    <div className="flex flex-wrap gap-1.5">
      {hazards.map((hazard) => {
        const Icon = hazard.icon;
        return (
          <span
            key={hazard.id}
            className="inline-flex max-w-full items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-bold"
            style={{
              backgroundColor: HAZARD_COLORS.cardBg,
              borderColor: HAZARD_COLORS.cardBorder,
              color: HAZARD_COLORS.ink,
            }}
          >
            <Icon className="size-3 shrink-0" strokeWidth={2} />
            <span className="truncate">
              {t(hazard.labelKey)}
              {trailName ? ` · ${trailName}` : ''}
            </span>
          </span>
        );
      })}
    </div>
  );
}

/** Highlights Downed Trees / Broken Bridge with icon + note (or compact chips). */
export function HazardNotice({
  conditions,
  trailName,
  variant = 'callout',
  className,
}: HazardNoticeProps) {
  const hazards = getCriticalHazards(conditions);
  if (hazards.length === 0) return null;

  return (
    <div className={cn(className)}>
      {variant === 'callout' ? (
        <Callout hazards={hazards} trailName={trailName} />
      ) : (
        <Chips hazards={hazards} trailName={trailName} />
      )}
    </div>
  );
}
