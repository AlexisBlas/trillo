function isAppleDevice(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  if (/iphone|ipad|ipod/i.test(ua)) return true;
  // iPadOS reports itself as desktop Safari.
  return navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
}

const COORD_PAIR = /^\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$/;

function parseCoordPair(value: string): { lat: number; lng: number } | null {
  const match = value.match(COORD_PAIR);
  if (!match) return null;
  const lat = Number(match[1]);
  const lng = Number(match[2]);
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  return { lat, lng };
}

function parseHttpUrl(value: string): URL | null {
  try {
    const url = new URL(value.trim());
    return url.protocol === 'https:' || url.protocol === 'http:' ? url : null;
  } catch {
    return null;
  }
}

/** Admin input is valid when it is a maps link or a "lat, lng" pair. */
export function isValidDirectionsInput(value: string): boolean {
  return !!parseCoordPair(value) || !!parseHttpUrl(value);
}

/**
 * Link for the park Directions button, or null when no directions are set.
 * Links open as entered; coordinates open Apple Maps on iOS, Google Maps elsewhere.
 */
export function directionsHref(
  value: string | null | undefined,
  parkName: string
): string | null {
  if (!value?.trim()) return null;

  const coords = parseCoordPair(value);
  if (coords) {
    const destination = `${coords.lat},${coords.lng}`;
    if (isAppleDevice()) {
      const params = new URLSearchParams({ daddr: destination, dirflg: 'd', q: parkName });
      return `https://maps.apple.com/?${params.toString()}`;
    }
    const params = new URLSearchParams({ api: '1', destination, travelmode: 'driving' });
    return `https://www.google.com/maps/dir/?${params.toString()}`;
  }

  return parseHttpUrl(value)?.toString() ?? null;
}
