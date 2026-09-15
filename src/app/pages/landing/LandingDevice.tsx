import { useEffect, useRef, useState } from 'react';
import { PREVIEW_MESSAGE } from '../../lib/embed';

const PARK_STATUS = `/parks/${encodeURIComponent('Parque Julio E. Monagas')}`;

const CHAPTER_PATHS = ['/', '/', PARK_STATUS, '/search', '/reports'] as const;

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
  mobileHint: string;
}) {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const shellRef = useRef<HTMLDivElement>(null);
  const deviceRef = useRef<HTMLElement>(null);
  const readyRef = useRef(false);
  const pathRef = useRef(pathForChapter(chapter));
  const [overRuns, setOverRuns] = useState(false);
  const visible = chapter > 0 && !overRuns;
  const noteVisible = chapter > 0 && !overRuns;

  useEffect(() => {
    const read = () => {
      const host = deviceRef.current;
      const close = document.getElementById('runs') ?? document.getElementById('footer');
      if (!host || !close) return;
      const device = host.getBoundingClientRect();
      const runs = close.getBoundingClientRect();
      setOverRuns(runs.top < device.bottom && runs.bottom > device.top);
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
    const frame = frameRef.current;
    const host = deviceRef.current;
    if (!shell || !frame || !host) return;

    const fit = () => {
      const h = shell.clientHeight;
      if (h <= 1) return;
      const w = h * (390 / 844) + 16;
      shell.style.width = `${w}px`;
      frame.style.transform = `scale(${w / 390})`;
    };

    fit();
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(fit) : null;
    ro?.observe(host);
    window.addEventListener('resize', fit);
    return () => {
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
        <p className="landing-device__cap">{caption}</p>
      </aside>
    </>
  );
}
