import type { Theme } from '../../contexts/ThemeContext';

const FAR =
  'M406 25L353 11L273 25L202 1.5L146 17.75L87.5 1.5L49 22.5L8 11L-26 34.5V214H406L406 25Z';
const MID =
  'M-26 28.5L10 18.5L53 28.25L74.5 33.125L97.5 20.25L131.25 29.125L166.5 20.25L237 2.5L275 13L368.5 2.5L406 38V231.5H-26V28.5Z';
const NEAR =
  'M406 29.5L339 25L280 36L198.5 25L130 35.75L101 31L69.5 44.5L13.5 25L-26 31V260.5H406L406 29.5Z';

export function HomeHeroArt({ theme }: { theme: Theme }) {
  const sky = theme === 'light' ? '#F9F7F2' : '#0E1510';
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
