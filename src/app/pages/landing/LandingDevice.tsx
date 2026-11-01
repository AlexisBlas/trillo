import { useEffect, useRef, type ReactNode } from 'react';
import { PREVIEW_MESSAGE } from '../../lib/embed';

const PARK_STATUS = `/parks/${encodeURIComponent('Parque Julio E. Monagas')}`;
const PARK_REPORT = `${PARK_STATUS}/report`;

const CHAPTER_PATHS = ['/', '/', PARK_STATUS, PARK_REPORT, PARK_STATUS, '/reports'] as const;

function cssPx(el: HTMLElement, value: string) {
  const raw = value.trim();
  if (!raw) return 0;
  if (raw.endsWith('px')) return parseFloat(raw);
  if (raw.endsWith('rem')) {
    return parseFloat(raw) * parseFloat(getComputedStyle(document.documentElement).fontSize);
  }
  const probe = document.createElement('div');
  probe.style.width = raw;
  el.appendChild(probe);
  const px = probe.offsetWidth;
  probe.remove();
  return px;
}

function pathForChapter(chapter: number) {
  const i = Math.min(Math.max(chapter, 0), CHAPTER_PATHS.length - 1);
  return CHAPTER_PATHS[i];
}

export function LandingDevice({
  chapter,
  caption,
  mobileOnly,
  mobileHint,
}: {
  chapter: number;
  caption: string;
  mobileOnly: string;
  mobileHint: ReactNode;
}) {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const shellRef = useRef<HTMLDivElement>(null);
  const screenRef = useRef<HTMLDivElement>(null);
  const deviceRef = useRef<HTMLElement>(null);
  const readyRef = useRef(false);
  const pathRef = useRef(pathForChapter(chapter));
  const visible = chapter > 0;
  const noteVisible = chapter > 0;

  useEffect(() => {
    const read = () => {
      const host = deviceRef.current;
      const footer = document.getElementById('footer');
      const landing = host?.closest<HTMLElement>('.landing');
      if (!host || !footer || !landing) return;

      const cs = getComputedStyle(host);
      const navGap = cssPx(host, cs.getPropertyValue('--nav-gap'));
      const floorGap = cssPx(host, cs.getPropertyValue('--floor-gap'));
      const dockGap = cssPx(host, cs.getPropertyValue('--dock-gap'));
      const deviceH = window.innerHeight - navGap - floorGap;
      const landingBox = landing.getBoundingClientRect();
      const footerBox = footer.getBoundingClientRect();
      const docked = footerBox.top < window.innerHeight - floorGap + dockGap;

      host.dataset.dock = docked ? 'true' : 'false';
      if (docked) {
        host.style.top = `${footerBox.top - landingBox.top - deviceH - dockGap}px`;
        host.style.height = `${deviceH}px`;
      } else {
        host.style.top = '';
        host.style.height = '';
      }
    };

    read();
    window.addEventListener('scroll', read, { passive: true });
    window.addEventListener('resize', read);
    return () => {
      window.removeEventListener('scroll', read);
      window.removeEventListener('resize', read);
    };
  }, []);

  useEffect(() => {
    const shell = shellRef.current;
    const screen = screenRef.current;
    const frame = frameRef.current;
    const host = deviceRef.current;
    if (!shell || !screen || !frame || !host) return;

    const fit = () => {
      const h = screen.clientHeight;
      if (h <= 1) return;
      const scale = h / 844;
      const innerW = 390 * scale;
      const padX =
        parseFloat(getComputedStyle(shell).paddingLeft) +
        parseFloat(getComputedStyle(shell).paddingRight);
      shell.style.width = `${innerW + padX}px`;
      frame.style.transform = `scale(${scale})`;
    };

    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(fit) : null;
    ro?.observe(host);
    ro?.observe(shell);
    ro?.observe(screen);
    fit();
    const raf = requestAnimationFrame(fit);
    window.addEventListener('resize', fit);
    return () => {
      cancelAnimationFrame(raf);
      ro?.disconnect();
      window.removeEventListener('resize', fit);
    };
  }, []);

  const sendPath = (path: string) => {
    const win = frameRef.current?.contentWindow;
    if (!win || !readyRef.current) return;
    win.postMessage({ type: PREVIEW_MESSAGE, path }, window.location.origin);
  };

  useEffect(() => {
    pathRef.current = pathForChapter(chapter);
    sendPath(pathRef.current);
  }, [chapter]);

  return (
    <>
      <p className="landing-mobile" data-active={noteVisible ? 'true' : 'false'}>
        <b>{mobileOnly}</b>
        <span>{mobileHint}</span>
      </p>
      <aside
        ref={deviceRef}
        className="landing-device"
        data-active={visible ? 'true' : 'false'}
        aria-hidden={!visible}
      >
        <div ref={shellRef} className="landing-device__shell">
          <div ref={screenRef} className="landing-device__screen">
            <iframe
              ref={frameRef}
              className="landing-device__frame"
              title="Trillo app"
              src="/?embed=1"
              tabIndex={-1}
              onLoad={() => {
                readyRef.current = true;
                sendPath(pathRef.current);
              }}
            />
            <span className="landing-device__shield" aria-hidden />
          </div>
        </div>
        <p className="landing-device__cap">{caption}</p>
      </aside>
    </>
  );
}
