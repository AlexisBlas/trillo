import type { Theme } from '../../contexts/ThemeContext';

const FAR =
  'M406 25L353 11L273 25L202 1.5L90 34L8 11L-26 34.5V214H406L406 25Z';
const MID =
  'M-26 28.5L10 18.5L96 38L237 2.5L309 28.5L372 18.5L406 38V231.5H-26V28.5Z';
const NEAR =
  'M406 34.5L339 30L280 41L198.5 30L103.5 48L8 36.5L-26 36V265.5H406L406 34.5Z';

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
