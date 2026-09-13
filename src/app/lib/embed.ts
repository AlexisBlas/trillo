export const PREVIEW_MESSAGE = 'trillo:preview';

export function isAppEmbed() {
  if (typeof window === 'undefined') return false;
  if (window.self !== window.top) return true;
  return new URLSearchParams(window.location.search).has('embed');
}
