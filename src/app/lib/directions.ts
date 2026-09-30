function isAppleDevice(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  if (/iphone|ipad|ipod/i.test(ua)) return true;
  // iPadOS reports itself as desktop Safari.
  return navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
}

/**
 * Driving directions link: Apple Maps on iOS, Google Maps elsewhere.
 * Without stored trailhead coords, searches by park name + city rather
 * than a municipality centroid, which would route to the town center.
 */
export function directionsUrl(
  parkName: string,
  city: string | null | undefined,
  lat: number | null | undefined,
  lng: number | null | undefined
): string {
  const hasCoords =
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    Number.isFinite(lat) &&
    Number.isFinite(lng);
  const destination = hasCoords
    ? `${lat},${lng}`
    : [parkName, city, 'Puerto Rico'].filter(Boolean).join(', ');

  if (isAppleDevice()) {
    const params = new URLSearchParams({ daddr: destination, dirflg: 'd' });
    if (hasCoords) params.set('q', parkName);
    return `https://maps.apple.com/?${params.toString()}`;
  }

  const params = new URLSearchParams({ api: '1', destination, travelmode: 'driving' });
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}
