import { normalizeSearchText } from './text';

/**
 * Island region used for park list filters.
 * Classification reference provided for Trillo park filters.
 */
export type ParkRegion =
  | 'north'
  | 'metro'
  | 'east'
  | 'central'
  | 'mountain'
  | 'west'
  | 'southwest'
  | 'south';

export const PARK_REGIONS: ParkRegion[] = [
  'north',
  'metro',
  'east',
  'central',
  'mountain',
  'west',
  'southwest',
  'south',
];

/** English labels for admin selects. */
export const PARK_REGION_LABELS: Record<ParkRegion, string> = {
  north: 'North',
  metro: 'Metro',
  east: 'East',
  central: 'Central',
  mountain: 'Mountain',
  west: 'West',
  southwest: 'Southwest',
  south: 'South',
};

export function isParkRegion(value: string | null | undefined): value is ParkRegion {
  return !!value && (PARK_REGIONS as string[]).includes(value);
}

/**
 * Municipality → geographic region.
 * Keys are accent-stripped lowercase so "Bayamón" and "Bayamon" both match.
 *
 * Municipalities not in the provided reference (Caguas, Gurabo, Aibonito, Cayey)
 * are assigned to the nearest matching region.
 */
const MUNICIPALITY_REGION: Record<string, ParkRegion> = {
  // North (Norte)
  arecibo: 'north',
  barceloneta: 'north',
  camuy: 'north',
  ciales: 'north',
  dorado: 'north',
  florida: 'north',
  hatillo: 'north',
  manati: 'north',
  morovis: 'north',
  quebradillas: 'north',
  'toa alta': 'north',
  'toa baja': 'north',
  'vega alta': 'north',
  'vega baja': 'north',

  // Metro (Área Metropolitana)
  bayamon: 'metro',
  catano: 'metro',
  guaynabo: 'metro',
  'san juan': 'metro',
  'trujillo alto': 'metro',
  carolina: 'metro',
  loiza: 'metro',

  // East (Este)
  canovanas: 'east',
  ceiba: 'east',
  fajardo: 'east',
  humacao: 'east',
  juncos: 'east',
  'las piedras': 'east',
  luquillo: 'east',
  maunabo: 'east',
  naguabo: 'east',
  'rio grande': 'east',
  'san lorenzo': 'east',
  vieques: 'east',
  culebra: 'east',
  yabucoa: 'east',

  // Central (Centro)
  'aguas buenas': 'central',
  barranquitas: 'central',
  cidra: 'central',
  comerio: 'central',
  corozal: 'central',
  naranjito: 'central',
  orocovis: 'central',
  // Not in source list — nearest fit
  caguas: 'central',
  gurabo: 'central',
  aibonito: 'central',
  cayey: 'central',

  // Mountain (La Montaña / Centro-Oeste)
  adjuntas: 'mountain',
  jayuya: 'mountain',
  lares: 'mountain',
  maricao: 'mountain',
  utuado: 'mountain',

  // West (Oeste)
  aguada: 'west',
  aguadilla: 'west',
  anasco: 'west',
  hormigueros: 'west',
  isabela: 'west',
  lajas: 'west',
  'las marias': 'west',
  mayaguez: 'west',
  moca: 'west',
  rincon: 'west',
  'sabana grande': 'west',
  'san german': 'west',
  'san sebastian': 'west',
  'cabo rojo': 'west',

  // Southwest (Suroeste)
  guanica: 'southwest',
  guayanilla: 'southwest',
  penuelas: 'southwest',
  ponce: 'southwest',
  yauco: 'southwest',

  // South / Southeast (Sur)
  arroyo: 'south',
  coamo: 'south',
  guayama: 'south',
  'juana diaz': 'south',
  patillas: 'south',
  salinas: 'south',
  'santa isabel': 'south',
  villalba: 'south',
};

/** Suggest a region from a municipality / city string (admin defaults + fallback). */
export function getCityRegion(city: string | null | undefined): ParkRegion | null {
  if (!city) return null;
  const key = normalizeSearchText(city);
  if (!key) return null;
  if (MUNICIPALITY_REGION[key]) return MUNICIPALITY_REGION[key];

  // Prefer longer municipality names first for partial matches.
  const entries = Object.entries(MUNICIPALITY_REGION).sort(
    (a, b) => b[0].length - a[0].length
  );
  for (const [muni, region] of entries) {
    if (key.includes(muni)) return region;
  }
  return null;
}
