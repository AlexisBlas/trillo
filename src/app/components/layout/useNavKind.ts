import { useRef } from 'react';
import { useLocation, useNavigationType, type NavigationType } from 'react-router';

export type NavKind = 'push' | 'pop' | 'tab';

/** Bottom-nav destinations — switch with a quiet crossfade, never a stack slide. */
const TAB_ROOTS = new Set([
  '/',
  '/search',
  '/reports',
  '/profile',
  '/auth/signin',
  '/auth/signup',
  '/auth/forgot-password',
  '/auth/reset-password',
]);

function isTabRoot(path: string) {
  return TAB_ROOTS.has(path);
}

function depth(path: string) {
  if (isTabRoot(path)) return 0;
  return path.split('/').filter(Boolean).length;
}

export function resolveNavKind(
  from: string,
  to: string,
  navType: NavigationType
): NavKind {
  // Browser / BackButton history back-forward
  if (navType === 'POP') {
    return isTabRoot(from) && isTabRoot(to) ? 'tab' : 'pop';
  }

  // Auth redirects, etc. — avoid a stack slide
  if (navType === 'REPLACE') {
    return 'tab';
  }

  if (isTabRoot(from) && isTabRoot(to)) return 'tab';
  if (!isTabRoot(from) && isTabRoot(to)) return 'pop';
  if (isTabRoot(from) && !isTabRoot(to)) return 'push';

  if (depth(to) > depth(from)) return 'push';
  if (depth(to) < depth(from)) return 'pop';

  // Same-depth stack siblings (e.g. trail A → trail B)
  return 'push';
}

export function useNavKind(): { pathname: string; kind: NavKind } {
  const location = useLocation();
  const navType = useNavigationType();
  const prevPath = useRef(location.pathname);
  const kindRef = useRef<NavKind>('tab');

  if (prevPath.current !== location.pathname) {
    kindRef.current = resolveNavKind(
      prevPath.current,
      location.pathname,
      navType
    );
    prevPath.current = location.pathname;
  }

  return { pathname: location.pathname, kind: kindRef.current };
}
