import { normalizeSearchText } from './text';

export type Coords = { lat: number; lng: number };

/**
 * Approximate municipality centroids for Puerto Rico.
 * Used when parks.lat/lng are unset — good enough for regional precip.
 */
const MUNICIPALITY_COORDS: Record<string, Coords> = {
  adjuntas: { lat: 18.163, lng: -66.722 },
  aguada: { lat: 18.379, lng: -67.188 },
  aguadilla: { lat: 18.427, lng: -67.154 },
  'aguas buenas': { lat: 18.257, lng: -66.103 },
  aibonito: { lat: 18.14, lng: -66.266 },
  anasco: { lat: 18.286, lng: -67.14 },
  arecibo: { lat: 18.472, lng: -66.716 },
  arroyo: { lat: 17.966, lng: -66.061 },
  barceloneta: { lat: 18.453, lng: -66.539 },
  barranquitas: { lat: 18.186, lng: -66.306 },
  bayamon: { lat: 18.399, lng: -66.156 },
  'cabo rojo': { lat: 18.087, lng: -67.146 },
  caguas: { lat: 18.234, lng: -66.049 },
  camuy: { lat: 18.484, lng: -66.845 },
  canovanas: { lat: 18.375, lng: -65.9 },
  carolina: { lat: 18.381, lng: -65.957 },
  catano: { lat: 18.443, lng: -66.118 },
  cayey: { lat: 18.112, lng: -66.166 },
  ceiba: { lat: 18.264, lng: -65.648 },
  ciales: { lat: 18.336, lng: -66.469 },
  cidra: { lat: 18.176, lng: -66.161 },
  coamo: { lat: 18.08, lng: -66.358 },
  comerio: { lat: 18.227, lng: -66.226 },
  corozal: { lat: 18.341, lng: -66.317 },
  culebra: { lat: 18.303, lng: -65.301 },
  dorado: { lat: 18.459, lng: -66.268 },
  fajardo: { lat: 18.326, lng: -65.652 },
  florida: { lat: 18.364, lng: -66.561 },
  guanica: { lat: 17.972, lng: -66.908 },
  guayama: { lat: 17.984, lng: -66.114 },
  guayanilla: { lat: 18.019, lng: -66.792 },
  guaynabo: { lat: 18.357, lng: -66.111 },
  gurabo: { lat: 18.254, lng: -65.973 },
  hatillo: { lat: 18.486, lng: -66.826 },
  hormigueros: { lat: 18.14, lng: -67.127 },
  humacao: { lat: 18.15, lng: -65.827 },
  isabela: { lat: 18.501, lng: -67.024 },
  jayuya: { lat: 18.219, lng: -66.592 },
  'juana diaz': { lat: 18.053, lng: -66.507 },
  juncos: { lat: 18.228, lng: -65.921 },
  lajas: { lat: 18.05, lng: -67.059 },
  lares: { lat: 18.295, lng: -66.877 },
  'las marias': { lat: 18.252, lng: -66.993 },
  'las piedras': { lat: 18.183, lng: -65.866 },
  loiza: { lat: 18.431, lng: -65.88 },
  luquillo: { lat: 18.372, lng: -65.717 },
  manati: { lat: 18.428, lng: -66.492 },
  maricao: { lat: 18.181, lng: -66.98 },
  maunabo: { lat: 18.007, lng: -65.899 },
  mayaguez: { lat: 18.201, lng: -67.14 },
  moca: { lat: 18.395, lng: -67.113 },
  morovis: { lat: 18.326, lng: -66.407 },
  naguabo: { lat: 18.219, lng: -65.735 },
  naranjito: { lat: 18.301, lng: -66.245 },
  orocovis: { lat: 18.227, lng: -66.391 },
  patillas: { lat: 18.006, lng: -66.016 },
  penuelas: { lat: 18.056, lng: -66.723 },
  ponce: { lat: 18.011, lng: -66.614 },
  quebradillas: { lat: 18.474, lng: -66.939 },
  rincon: { lat: 18.34, lng: -67.25 },
  'rio grande': { lat: 18.38, lng: -65.831 },
  'sabana grande': { lat: 18.078, lng: -66.961 },
  salinas: { lat: 17.977, lng: -66.298 },
  'san german': { lat: 18.081, lng: -67.045 },
  'san juan': { lat: 18.466, lng: -66.106 },
  'san lorenzo': { lat: 18.189, lng: -65.961 },
  'san sebastian': { lat: 18.337, lng: -66.991 },
  'santa isabel': { lat: 17.966, lng: -66.405 },
  'toa alta': { lat: 18.388, lng: -66.248 },
  'toa baja': { lat: 18.444, lng: -66.254 },
  'trujillo alto': { lat: 18.355, lng: -66.007 },
  utuado: { lat: 18.266, lng: -66.701 },
  'vega alta': { lat: 18.412, lng: -66.331 },
  'vega baja': { lat: 18.444, lng: -66.388 },
  vieques: { lat: 18.127, lng: -65.44 },
  villalba: { lat: 18.127, lng: -66.492 },
  yabucoa: { lat: 18.05, lng: -65.879 },
  yauco: { lat: 18.035, lng: -66.85 },
};

/** Resolve coords for a municipality / city string. */
export function getMunicipalityCoords(
  city: string | null | undefined
): Coords | null {
  if (!city) return null;
  const key = normalizeSearchText(city);
  if (!key) return null;
  const exact = MUNICIPALITY_COORDS[key];
  if (exact) return exact;
  for (const [muni, coords] of Object.entries(MUNICIPALITY_COORDS)) {
    if (key.includes(muni) || muni.includes(key)) return coords;
  }
  return null;
}

/** Prefer stored park coords; fall back to municipality centroid. */
export function resolveParkCoords(
  lat: number | null | undefined,
  lng: number | null | undefined,
  city: string | null | undefined
): Coords | null {
  if (
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    Number.isFinite(lat) &&
    Number.isFinite(lng)
  ) {
    return { lat, lng };
  }
  return getMunicipalityCoords(city);
}
