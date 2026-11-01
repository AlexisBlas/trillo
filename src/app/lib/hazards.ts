import { Trees, BrickWall, Wrench, type LucideIcon } from 'lucide-react';
import type { TranslationKey } from '../contexts/LangContext';

/** Shared palette for hazard callouts / badges. */
export const HAZARD_COLORS = {
  ink: '#F5E6C8',
  iconBg: '#D97D45',
  iconFg: '#ffffff',
  cardBg: '#1C1A14',
  cardBorder: '#3D3428',
} as const;

export type CriticalHazardId = 'downed-trees' | 'broken-bridge' | 'maintenance';

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
  {
    id: 'maintenance',
    tag: 'hazard:maintenance',
    icon: Wrench,
    labelKey: 'hazard_maintenance',
    noteKey: 'hazard_note_maintenance',
  },
];

/** Critical hazards (downed trees / broken bridge / maintenance) present on a report. */
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
