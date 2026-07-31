import { normalizeSearchText } from './text';

/** Island region used for park list filters. */
export type ParkRegion = 'north' | 'east' | 'south' | 'west' | 'metro';

export const PARK_REGIONS: ParkRegion[] = ['north', 'east', 'south', 'west', 'metro'];

export function isParkRegion(value: string | null | undefined): value is ParkRegion {
  return !!value && (PARK_REGIONS as string[]).includes(value);
}

/**
 * Puerto Rico municipality → rough geographic region.
 * Used as a default/fallback when parks.region is unset.
 * Keys are accent-stripped lowercase so "Bayamón" and "Bayamon" both match.
 */
const MUNICIPALITY_REGION: Record<string, ParkRegion> = {
  // Metro / San Juan area
  'san juan': 'metro',
  bayamon: 'metro',
  guaynabo: 'metro',
  carolina: 'metro',
  'trujillo alto': 'metro',
  catano: 'metro',
  'toa baja': 'metro',
  'toa alta': 'metro',
  dorado: 'metro',
  loiza: 'metro',
  canovanas: 'metro',
  'aguas buenas': 'metro',
  gurabo: 'metro',
  caguas: 'metro',

  // North / north-central coast & karst
  arecibo: 'north',
  camuy: 'north',
  hatillo: 'north',
  quebradillas: 'north',
  isabela: 'north',
  barceloneta: 'north',
  manati: 'north',
  'vega alta': 'north',
  'vega baja': 'north',
  florida: 'north',
  ciales: 'north',
  morovis: 'north',
  corozal: 'north',
  naranjito: 'north',
  utuado: 'north',
  lares: 'north',
  orocovis: 'north',

  // East / southeast & islands
  fajardo: 'east',
  ceiba: 'east',
  naguabo: 'east',
  humacao: 'east',
  yabucoa: 'east',
  maunabo: 'east',
  'las piedras': 'east',
  juncos: 'east',
  'san lorenzo': 'east',
  cayey: 'east',
  patillas: 'east',
  luquillo: 'east',
  'rio grande': 'east',
  vieques: 'east',
  culebra: 'east',
  arroyo: 'east',
  guayama: 'east',
  cidra: 'east',
  aibonito: 'east',
  barranquitas: 'east',
  comerio: 'east',

  // South / southwest inland
  ponce: 'south',
  salinas: 'south',
  'santa isabel': 'south',
  'juana diaz': 'south',
  coamo: 'south',
  guanica: 'south',
  yauco: 'south',
  guayanilla: 'south',
  penuelas: 'south',
  villalba: 'south',
  adjuntas: 'south',
  jayuya: 'south',
  'sabana grande': 'south',

  // West coast
  mayaguez: 'west',
  aguadilla: 'west',
  aguada: 'west',
  rincon: 'west',
  'cabo rojo': 'west',
  lajas: 'west',
  'san german': 'west',
  hormigueros: 'west',
  anasco: 'west',
  moca: 'west',
  'san sebastian': 'west',
  'las marias': 'west',
  maricao: 'west',
};

/** Suggest a region from a municipality / city string (admin defaults + fallback). */
export function getCityRegion(city: string | null | undefined): ParkRegion | null {
  if (!city) return null;
  const key = normalizeSearchText(city);
  if (!key) return null;
  if (MUNICIPALITY_REGION[key]) return MUNICIPALITY_REGION[key];

  // Partial match for compound park city strings that include the municipality.
  for (const [muni, region] of Object.entries(MUNICIPALITY_REGION)) {
    if (key.includes(muni)) return region;
  }
  return null;
}
