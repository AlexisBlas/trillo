import { useRef } from 'react';
import { useLocation, useNavigationType, NavigationType } from 'react-router';

export type NavKind = 'push' | 'pop' | 'tab';

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
  if (navType === 'POP') return isTabRoot(to) && isTabRoot(from) ? 'tab' : 'pop';
  if (isTabRoot(from) && isTabRoot(to)) return 'tab';
  if (!isTabRoot(from) && isTabRoot(to)) return 'pop';
  if (depth(to) > depth(from)) return 'push';
  if (depth(to) < depth(from)) return 'pop';
  return 'push';
}

export function useNavKind(): { pathname: string; kind: NavKind } {
  const location = useLocation();
  const navType = useNavigationType();
  const prevPath = useRef(location.pathname);
  const kindRef = useRef<NavKind>('tab');

  if (prevPath.current !== location.pathname) {
    kindRef.current = resolveNavKind(prevPath.current, location.pathname, navType);
    prevPath.current = location.pathname;
  }

  return { pathname: location.pathname, kind: kindRef.current };
}
