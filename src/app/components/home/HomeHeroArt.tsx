import type { Theme } from '../../contexts/ThemeContext';

/** Paths from Figma “Hero image - dark/light” (209:922 / 209:921). */
const FAR =
  'M425 35L372 21L292 35L221 11.5L165 27.75L106.5 11.5L68 32.5L27 21L-7 44.5V224H425L425 35Z';
const MID =
  'M-7 38.5L29 28.5L72 38.25L93.5 43.125L116.5 30.25L150.25 39.125L185.5 30.25L256 12.5L294 23L387.5 12.5L425 48V241.5H-7V38.5Z';
const NEAR =
  'M425 39.5L358 35L299 46L217.5 35L149 45.75L130 46L84.5 35L33 45.75L-7 41V270.5H425L425 39.5Z';

export function HomeHeroArt({ theme }: { theme: Theme }) {
  const sky = theme === 'light' ? '#F9F7F2' : '#0E1510';
  const blend = theme === 'light' ? 'multiply' : 'soft-light';

  return (
    <svg
      aria-hidden
      viewBox="0 0 413 215"
      preserveAspectRatio="xMidYMid slice"
      className="absolute inset-0 size-full select-none pointer-events-none [mask-image:linear-gradient(to_bottom,black_72%,transparent_100%)] [-webkit-mask-image:linear-gradient(to_bottom,black_72%,transparent_100%)]"
      style={{ isolation: 'isolate' }}
    >
      <rect width="413" height="215" fill={sky} />
      <path d={FAR} fill="#D4E9C1" style={{ mixBlendMode: blend }} />
      <path d={MID} fill="#A9D3BE" style={{ mixBlendMode: blend }} />
      <path d={NEAR} fill={sky} />
    </svg>
  );
}
