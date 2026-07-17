import { Trees, BrickWall, type LucideIcon } from 'lucide-react';
import type { TranslationKey } from '../contexts/LangContext';

/** Shared palette for hazard callouts / badges (matches design reference). */
export const HAZARD_COLORS = {
  ink: '#5D3A1A',
  iconBg: '#F1E3C5',
  cardBg: '#FFF9EC',
  cardBorder: '#E5D9C3',
} as const;

export type CriticalHazardId = 'downed-trees' | 'broken-bridge';

export type CriticalHazard = {
  id: CriticalHazardId;
  tag: `hazard:${CriticalHazardId}`;
  icon: LucideIcon;
  labelKey: TranslationKey;
  noteKey: TranslationKey;
};

const CRITICAL_HAZARDS: CriticalHazard[] = [
  {
    id: 'downed-trees',
    tag: 'hazard:downed-trees',
    icon: Trees,
    labelKey: 'hazard_downed_trees',
    noteKey: 'hazard_note_downed_trees',
  },
  {
    id: 'broken-bridge',
    tag: 'hazard:broken-bridge',
    icon: BrickWall,
    labelKey: 'hazard_broken_bridge',
    noteKey: 'hazard_note_broken_bridge',
  },
];

/** Critical hazards (downed trees / broken bridge) present on a report. */
export function getCriticalHazards(
  conditions: string[] | null | undefined
): CriticalHazard[] {
  if (!conditions?.length) return [];
  const set = new Set(conditions);
  return CRITICAL_HAZARDS.filter((h) => set.has(h.tag));
}

/** Deduped merge of critical hazards from several condition lists. */
export function mergeCriticalHazards(
  ...lists: Array<string[] | null | undefined>
): CriticalHazard[] {
  const tags = new Set<string>();
  for (const list of lists) {
    for (const c of list || []) tags.add(c);
  }
  return getCriticalHazards([...tags]);
}
