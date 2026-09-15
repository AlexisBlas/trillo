import { useEffect, useId, useState, type CSSProperties, type MouseEvent, type ReactNode } from 'react';
import { useLang, type Lang } from '../contexts/LangContext';
import { landingCopy } from '../data/landing';
import { landingPosterUrl, useScrollFilm } from './landing/useScrollFilm';
import { LandingDevice } from './landing/LandingDevice';
import '../../styles/landing.css';

const APP_HOST = 'eltrillo.app';
const APP_URL = 'https://eltrillo.app';

function withAppLink(text: string): ReactNode {
  const parts = text.split(/(eltrillo\.app)/g);
  return parts.map((part, i) =>
    part === APP_HOST ? (
      <a key={i} href={APP_URL} className="landing-app-link">
        {part}
      </a>
    ) : (
      part
    ),
  );
}

function SplitWords({ text, className }: { text: string; className?: string }) {
  const words = text.trim().split(/\s+/);
  return (
    <h2 className={className} data-split>
      {words.map((word, i) => (
        <span key={`${word}-${i}`}>
          <span className="w" style={{ '--i': i } as CSSProperties}>
            <i>{word}</i>
          </span>
          {i < words.length - 1 ? ' ' : null}
        </span>
      ))}
    </h2>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  const panelId = useId();

  return (
    <li>
      <button
        type="button"
        className="faq-list__trigger"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
      >
        <span>{q}</span>
        <i className="faq-list__arrow" aria-hidden />
      </button>
      <div
        id={panelId}
        className="faq-list__panel"
        data-open={open ? 'true' : 'false'}
        role="region"
        aria-hidden={!open}
      >
        <div className="faq-list__inner">
          <p>{withAppLink(a)}</p>
        </div>
      </div>
    </li>
  );
}

function Reveal({
  children,
  index,
  as: Tag = 'p',
  className,
}: {
  children: ReactNode;
  index: number;
  as?: 'p' | 'div' | 'ul' | 'ol';
  className?: string;
}) {
  return (
    <Tag className={className} data-reveal style={{ '--i': index } as CSSProperties}>
      {children}
    </Tag>
  );
}

export function LandingPage() {
  const { lang, setLang } = useLang();
  const copy = landingCopy[lang];
  const [titleOn, setTitleOn] = useState(false);
  const { rootRef, filmRef, failed, current } = useScrollFilm();

  const jump = (event: MouseEvent<HTMLAnchorElement>) => {
    const href = event.currentTarget.getAttribute('href');
    if (!href || !href.startsWith('#')) return;
    event.preventDefault();
    const target = document.querySelector<HTMLElement>(href);
    if (!target) return;
    window.scrollTo({
      top: target.getBoundingClientRect().top + window.scrollY + 8,
      behavior: 'auto',
    });
    history.replaceState(null, '', href);
  };

  useEffect(() => {
    const skip = location.hash && location.hash !== '#hero';
    if (skip) {
      setTitleOn(true);
      return;
    }
    const id = requestAnimationFrame(() => requestAnimationFrame(() => setTitleOn(true)));
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <div
      ref={rootRef}
      className="landing"
      data-chapter={current}
      style={{ '--poster': `url("${landingPosterUrl()}")` } as CSSProperties}
    >
      <a className="landing-skip" href="#how" data-jump onClick={jump}>
        {copy.skipToContent}
      </a>

      <video
        ref={filmRef}
        id="stage"
        className="landing-stage"
        muted
        playsInline
        preload="metadata"
        poster={landingPosterUrl()}
        aria-label={copy.filmAria}
      />
      <div className="landing-veil" aria-hidden />
      <LandingDevice
        chapter={current}
        caption={copy.deviceCaption}
        mobileOnly={copy.mobileOnly}
        mobileHint={copy.mobileHint}
      />

      <header className="landing-topbar" data-over={current > 0 ? 'true' : 'false'}>
        <a className="landing-wordmark" href="#hero" data-jump onClick={jump}>
          Trillo
        </a>
        <div className="landing-nav" data-nav>
          <a href="#how" onClick={jump}>
            {copy.navHow}
          </a>
          <a href="#about" onClick={jump}>
            {copy.navAbout}
          </a>
          <a href="#faq" onClick={jump}>
            {copy.navFaq}
          </a>
        </div>
        <div className="landing-lang" role="group" aria-label={copy.langLabel}>
          {(['es', 'en'] as Lang[]).map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={lang === value}
              onClick={() => setLang(value)}
            >
              {value === 'es' ? copy.langEs : copy.langEn}
            </button>
          ))}
        </div>
      </header>

      <main id="main" className="landing-main">
        <section className="chapter chapter--hero" id="hero">
          <div className="chapter__pin">
            <div className="layer layer--title">
              <h1 className={titleOn ? 'hero__name is-in' : 'hero__name'} aria-label="Trillo">
                {['T', 'R', 'I', 'L', 'L', 'O'].map((ch, i) => (
                  <span className="w" style={{ '--i': i } as CSSProperties} key={`${ch}-${i}`}>
                    <i>{ch}</i>
                  </span>
                ))}
              </h1>
              <p className="hero__line">{copy.heroLine}</p>
              <p className="hero__mobile">{withAppLink(copy.heroHelp)}</p>
              <a className="scroll-cue" href="#how" data-jump onClick={jump}>
                {copy.scrollCue}
                <i aria-hidden />
              </a>
            </div>
          </div>
        </section>

        <section className="chapter" id="how">
          <div className="chapter__pin">
            <div className="layer">
              <SplitWords text={copy.howTitle} className="display" />
              <Reveal index={0} className="lead">
                {copy.howBody}
              </Reveal>
              <Reveal index={1} className="note">
                {copy.howNote}
              </Reveal>
            </div>
          </div>
        </section>

        <section className="chapter" id="bike">
          <div className="chapter__pin">
            <div className="layer">
              <SplitWords text={copy.statusTitle} className="display" />
              <Reveal index={0} className="body">
                {copy.statusBody}
              </Reveal>
              <Reveal as="ul" index={1} className="readout">
                <li>
                  <b>
                    <i style={{ background: '#5EE08A' }} aria-hidden />
                    {copy.statusDry}
                  </b>
                  <span>{copy.statusDryHint}</span>
                </li>
                <li>
                  <b>
                    <i style={{ background: '#c4a035' }} aria-hidden />
                    {copy.statusWet}
                  </b>
                  <span>{copy.statusWetHint}</span>
                </li>
                <li>
                  <b>
                    <i style={{ background: '#b42318' }} aria-hidden />
                    {copy.statusMuddy}
                  </b>
                  <span>{copy.statusMuddyHint}</span>
                </li>
              </Reveal>
            </div>
          </div>
        </section>

        <section className="chapter" id="about">
          <div className="chapter__pin">
            <div className="layer">
              <SplitWords text={copy.aboutTitle} className="display" />
              <Reveal index={0} className="lead">
                {copy.aboutBody}
              </Reveal>
              <Reveal index={1} className="note">
                {copy.aboutHonor}
              </Reveal>
              <Reveal as="div" index={2} className="specs">
                <div>
                  <dt>{copy.parksK}</dt>
                  <dd>{copy.parksV}</dd>
                </div>
                <div>
                  <dt>{copy.reportK}</dt>
                  <dd>{copy.reportV}</dd>
                </div>
                <div>
                  <dt>{copy.guestK}</dt>
                  <dd>{copy.guestV}</dd>
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        <section className="chapter" id="faq">
          <div className="chapter__pin">
            <div className="layer">
              <SplitWords text={copy.faqTitle} className="display" />
              <Reveal as="ul" index={0} className="faq-list">
                {copy.faqs.map((faq) => (
                  <FaqItem key={faq.q} q={faq.q} a={faq.a} />
                ))}
              </Reveal>
            </div>
          </div>
        </section>

      </main>

      <section className="landing-close" id="runs">
        <div className="landing-close__inner">
          <div className="landing-close__intro">
            {copy.footerKicker ? (
              <p className="landing-close__kicker">{copy.footerKicker}</p>
            ) : null}
            <SplitWords text={copy.footerTitle} className="display is-in" />
            <p className="landing-close__lead">{copy.footerLead}</p>
          </div>
        </div>
      </section>

      <footer className="landing-footer" id="footer">
        <p>{copy.footerBody}</p>
        <p>
          {copy.footerMadeBy}{' '}
          <a href="https://humbol.studio" target="_blank" rel="noopener noreferrer">
            humbol.studio
          </a>
        </p>
        <p>{copy.footerCopy}</p>
      </footer>

      {failed ? <p className="film-note">{copy.filmFailed}</p> : null}
    </div>
  );
}
