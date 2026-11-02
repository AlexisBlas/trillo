import type { Theme } from '../../contexts/ThemeContext';

const FAR =
  'M-26 25L27 11L107 25L178 1.5L290 34L372 11L406 34.5V214H-26L-26 25Z';
const MID =
  'M-26 34.5L10 24.5L96 44L237 8.5L309 34.5L372 24.5L406 44V237.5H-26V34.5Z';
const NEAR =
  'M-26 44.5L41 40L100 51L181.5 40L276.5 58L372 46.5L406 46V275.5H-26L-26 44.5Z';

export function HomeHeroArt({ theme }: { theme: Theme }) {
  const sky = theme === 'light' ? '#F9F7F2' : '#141C17';
  const blend = theme === 'light' ? 'multiply' : 'soft-light';

  return (
    <svg
      aria-hidden
      viewBox="-19 -10 413 215"
      preserveAspectRatio="xMidYMid slice"
      className="absolute inset-0 size-full select-none pointer-events-none [mask-image:linear-gradient(to_bottom,black_72%,transparent_100%)] [-webkit-mask-image:linear-gradient(to_bottom,black_72%,transparent_100%)]"
      style={{ isolation: 'isolate' }}
    >
      <rect x="-19" y="-10" width="413" height="215" fill={sky} />
      <path d={FAR} fill="#D4E9C1" style={{ mixBlendMode: blend }} />
      <path d={MID} fill="#A9D3BE" style={{ mixBlendMode: blend }} />
      <path d={NEAR} fill={sky} />
    </svg>
  );
}
