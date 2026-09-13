import { useEffect, useRef, useState } from 'react';

const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);

function damp(current: number, target: number, retain: number, dt: number) {
  return current + (target - current) * (1 - Math.pow(retain, dt));
}

function landingAsset(file: string) {
  return new URL(`landing/${file}`, document.baseURI).href;
}

function filmIsFullySeekable(film: HTMLVideoElement) {
  const d = film.duration;
  if (!Number.isFinite(d) || d <= 0 || !film.seekable || !film.seekable.length) return false;
  const end = film.seekable.end(film.seekable.length - 1);
  return film.seekable.start(0) <= 0.05 && end >= d - 0.15;
}

function waitForEvent(el: HTMLVideoElement, names: string[], ms?: number) {
  return new Promise<void>((resolve, reject) => {
    const timer = ms != null ? window.setTimeout(() => finish(new Error('timeout')), ms) : 0;
    const finish = (err: Error | null) => {
      if (timer) window.clearTimeout(timer);
      names.forEach((name) => el.removeEventListener(name, onEvent));
      if (err) reject(err);
      else resolve();
    };
    const onEvent = (e: Event) => finish(e.type === 'error' ? new Error('media error') : null);
    names.forEach((name) => el.addEventListener(name, onEvent));
  });
}

export const FILM_KEY_TIMES = [0.15, 1.6, 5.0, 8.0, 10.6, 14.85] as const;

export function useScrollFilm(keyTimes: readonly number[] = FILM_KEY_TIMES) {
  const rootRef = useRef<HTMLDivElement>(null);
  const filmRef = useRef<HTMLVideoElement>(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [current, setCurrent] = useState(0);
  const currentRef = useRef(0);

  useEffect(() => {
    const root = rootRef.current;
    const film = filmRef.current;
    if (!root || !film) return;

    const html = document.documentElement;
    html.classList.add('landing-on', 'js');
    const reduceQ = window.matchMedia('(prefers-reduced-motion: reduce)');
    let reduced = reduceQ.matches;
    const keyframes = keyTimes.length;
    const filmSrc = landingAsset('film.mp4?v=2');

    const chapters = [...root.querySelectorAll<HTMLElement>('.chapter')];
    const chapterLinks = [...root.querySelectorAll<HTMLAnchorElement>('[data-nav] a[href^="#"]')];
    const metrics: { el: HTMLElement; top: number; span: number }[] = [];
    let filmReady = false;
    let filmURL = filmSrc;
    let seekQueued: number | null = null;
    let seekTarget = 0;
    let seekCurrent = 0;
    let lastFrame = 0;
    let lastW = window.innerWidth;
    let lastH = window.innerHeight;
    let raf = 0;
    let dead = false;

    film.dataset.src = filmSrc;
    film.muted = true;
    film.defaultMuted = true;

    const filmDuration = () => {
      const d = film.duration;
      return Number.isFinite(d) && d > 0 ? d : keyTimes[keyframes - 1];
    };

    const storyToTime = (story: number) => {
      const i = Math.min(Math.floor(story), keyframes - 2);
      const f = clamp01(story - i);
      return keyTimes[i] + (keyTimes[i + 1] - keyTimes[i]) * f;
    };

    const seekTo = (t: number) => {
      if (!filmReady || dead) return;
      const d = filmDuration();
      const clamped = Math.max(0, Math.min(d - 0.05, t));
      if (Math.abs(film.currentTime - clamped) < 1 / 45) return;
      if (film.seeking) {
        seekQueued = clamped;
        return;
      }
      film.currentTime = clamped;
    };

    const onSeeked = () => {
      if (seekQueued == null) return;
      const t = seekQueued;
      seekQueued = null;
      film.currentTime = t;
    };
    film.addEventListener('seeked', onSeeked);

    const measure = () => {
      metrics.length = 0;
      const vh = window.innerHeight;
      for (const sec of chapters) {
        metrics.push({
          el: sec,
          top: sec.getBoundingClientRect().top + window.scrollY,
          span: Math.max(1, sec.offsetHeight - vh),
        });
      }
      const foot = root.querySelector<HTMLElement>('#runs') ?? root.querySelector<HTMLElement>('#footer');
      if (foot) {
        metrics.push({
          el: foot,
          top: foot.getBoundingClientRect().top + window.scrollY,
          span: Math.max(1, foot.offsetHeight),
        });
      }
    };

    const readStory = () => {
      const y = window.scrollY;
      const vh = window.innerHeight;
      let idx = 0;
      for (let i = 0; i < metrics.length; i++) {
        const m = metrics[i];
        const top = m.el.getBoundingClientRect().top + y;
        m.top = top;
        if (y + vh * 0.28 >= top) idx = i;
        if (i < chapters.length) {
          m.el.style.setProperty('--op', '1');
          m.el.style.setProperty('--blur', '0px');
          m.el.style.setProperty('--y', '0px');
          if (i > 0 && y >= top - vh) m.el.classList.add('is-reading');
        }
      }
      const start = metrics[0]?.top ?? 0;
      const end = metrics[metrics.length - 1]?.top ?? 1;
      const filmP = clamp01((y - start) / Math.max(1, end - start));
      return { story: filmP * (keyframes - 1), current: idx };
    };

    const setCurrentSafe = (i: number) => {
      if (i === currentRef.current) return;
      currentRef.current = i;
      setCurrent(i);
      const raw = metrics[i] ? `#${metrics[i].el.id}` : '';
      const id = raw === '#bike' ? '#how' : raw === '#hero' ? '' : raw;
      chapterLinks.forEach((a) => {
        if (id && a.getAttribute('href') === id) a.setAttribute('aria-current', 'page');
        else a.removeAttribute('aria-current');
      });
    };

    const goTo = (href: string, smooth = !reduced) => {
      const target = root.querySelector<HTMLElement>(href);
      if (!target) return;
      const top = target.getBoundingClientRect().top + window.scrollY + 8;
      window.scrollTo({ top, behavior: smooth ? 'smooth' : 'auto' });
      history.replaceState(null, '', href);
    };

    const onNavClick = (e: Event) => {
      const a = e.currentTarget as HTMLAnchorElement;
      const href = a.getAttribute('href');
      if (!href || !href.startsWith('#')) return;
      e.preventDefault();
      goTo(href);
    };

    root.querySelectorAll<HTMLAnchorElement>('[data-jump]').forEach((a) => {
      a.addEventListener('click', onNavClick);
    });

    const kickDecode = () => {
      film.muted = true;
      film.defaultMuted = true;
      const play = film.play();
      if (!play || !play.then) {
        film.pause();
        return Promise.resolve();
      }
      return Promise.race([play, new Promise((resolve) => setTimeout(resolve, 400))]).then(
        () => {
          film.pause();
        },
        () => {
          film.pause();
        }
      );
    };

    const assignSrc = (url: string) =>
      new Promise<void>((resolve, reject) => {
        const timer = window.setTimeout(() => finish(new Error('timeout')), 12000);
        const onData = () => finish(null);
        const onErr = () => finish(new Error('source failed'));
        const finish = (err: Error | null) => {
          window.clearTimeout(timer);
          film.removeEventListener('loadeddata', onData);
          film.removeEventListener('canplay', onData);
          film.removeEventListener('error', onErr);
          if (err) reject(err);
          else resolve();
        };
        film.addEventListener('loadeddata', onData);
        film.addEventListener('canplay', onData);
        film.addEventListener('error', onErr);
        film.src = url;
        film.load();
      });

    const loadAsBlob = async (fileSrc: string) => {
      const res = await fetch(fileSrc);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blobURL = URL.createObjectURL(await res.blob());
      await assignSrc(blobURL);
      if (filmURL.startsWith('blob:') && filmURL !== blobURL) URL.revokeObjectURL(filmURL);
      filmURL = blobURL;
    };

    const waitUntilSeekable = (ms: number) =>
      new Promise<boolean>((resolve) => {
        if (filmIsFullySeekable(film)) {
          resolve(true);
          return;
        }
        const stop = window.setTimeout(() => done(false), ms);
        const check = () => {
          if (filmIsFullySeekable(film)) done(true);
        };
        const done = (ok: boolean) => {
          window.clearTimeout(stop);
          film.removeEventListener('progress', check);
          film.removeEventListener('canplaythrough', check);
          resolve(ok);
        };
        film.addEventListener('progress', check);
        film.addEventListener('canplaythrough', check);
      });

    const armFilm = async () => {
      await kickDecode();
      if (film.readyState < 2) {
        try {
          if (film.readyState < 2) {
            await Promise.race([
              waitForEvent(film, ['loadeddata', 'canplay', 'error'], 12000),
            ]);
          }
        } catch {
          /* a late frame still beats a dead film */
        }
      }
      filmReady = true;
      setReady(true);
      html.classList.add('film-ready');
      html.classList.remove('film-failed');
    };

    const failFilm = () => {
      setFailed(true);
      html.classList.add('film-failed');
    };

    const loadFilm = async () => {
      try {
        await loadAsBlob(filmSrc);
      } catch (err) {
        console.warn('trillo: could not preload the film, streaming instead.', err);
        try {
          await assignSrc(filmSrc);
        } catch {
          failFilm();
          throw new Error('film unavailable');
        }
        if (!filmIsFullySeekable(film) && !(await waitUntilSeekable(2500))) {
          try {
            await loadAsBlob(filmSrc);
          } catch {
            /* keep the stream */
          }
        }
      }
      await armFilm();
      const { story } = readStory();
      seekCurrent = storyToTime(story);
      seekTarget = seekCurrent;
      seekTo(seekCurrent);
    };

    const runStatic = () => {
      let shown = -1;
      const io = new IntersectionObserver(
        (entries) => {
          for (const e of entries) {
            if (!e.isIntersecting) continue;
            const i = chapters.indexOf(e.target as HTMLElement);
            if (i >= 0 && i !== shown) {
              shown = i;
              seekTo(keyTimes[i]);
            }
          }
        },
        { rootMargin: '-40% 0px -40% 0px' }
      );
      chapters.forEach((c) => io.observe(c));
      seekTo(keyTimes[0]);
      return () => io.disconnect();
    };

    const loop = (now: number) => {
      if (dead) return;
      raf = requestAnimationFrame(loop);
      const dt = lastFrame ? Math.min(0.25, (now - lastFrame) / 1000) : 1 / 60;
      lastFrame = now;
      if (window.innerWidth !== lastW || window.innerHeight !== lastH) {
        lastW = window.innerWidth;
        lastH = window.innerHeight;
        measure();
      }
      const { story, current: idx } = readStory();
      setCurrentSafe(idx);
      const nextTarget = storyToTime(story);
      if (Math.abs(nextTarget - seekTarget) > 1.2) seekCurrent = nextTarget;
      seekTarget = nextTarget;
      seekCurrent = damp(seekCurrent, seekTarget, 0.008, dt);
      seekTo(seekCurrent);
    };

    const afterLayout = () => {
      measure();
      const { story, current: idx } = readStory();
      setCurrentSafe(idx);
      seekCurrent = storyToTime(story);
    };

    measure();
    html.classList.add('trillo-ready');
    setCurrentSafe(readStory().current);

    loadFilm()
      .then(() => {
        if (reduced) runStatic();
      })
      .catch(() => {});

    const onResize = () => measure();
    const onScroll = () => setCurrentSafe(readStory().current);
    window.addEventListener('resize', onResize);
    window.addEventListener('load', onResize);
    window.addEventListener('scroll', onScroll, { passive: true });
    if (document.fonts?.ready) document.fonts.ready.then(afterLayout);

    if (location.hash) {
      const target = root.querySelector<HTMLElement>(location.hash);
      if (target) {
        window.scrollTo(0, target.getBoundingClientRect().top + window.scrollY);
      }
    }

    if (!reduced) raf = requestAnimationFrame(loop);

    const onReduce = () => location.reload();
    reduceQ.addEventListener('change', onReduce);

    return () => {
      dead = true;
      cancelAnimationFrame(raf);
      film.removeEventListener('seeked', onSeeked);
      root.querySelectorAll<HTMLAnchorElement>('[data-jump]').forEach((a) => {
        a.removeEventListener('click', onNavClick);
      });
      window.removeEventListener('resize', onResize);
      window.removeEventListener('load', onResize);
      window.removeEventListener('scroll', onScroll);
      reduceQ.removeEventListener('change', onReduce);
      if (filmURL.startsWith('blob:')) URL.revokeObjectURL(filmURL);
      html.classList.remove('landing-on', 'js', 'film-ready', 'film-failed', 'trillo-ready');
    };
  }, []);

  return { rootRef, filmRef, ready, failed, current };
}

export function landingPosterUrl() {
  return new URL('landing/poster.jpg', document.baseURI).href;
}
