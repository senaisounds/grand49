import { Suspense, lazy, useEffect, useRef, useState } from "react";
import { canRunWebGLHero, useInView, useIsMobile, usePrefersReducedMotion, useReveal } from "./lib/hooks";
import { initPlayer, next, play, toggle, toggleMute, usePlayer } from "./lib/player";
import { LiteYouTube, useRailParallax } from "./components/Media";
import { MerchMockup } from "./components/Merch";
import {
  ARTISTS,
  BOOKING_EMAIL,
  BOOKING_READY,
  BRAND,
  HERO_IMAGE,
  LINKS,
  MERCH,
  PHOTOS,
  SHOWS,
  TRACKS,
  artistTracks,
  ytWatch,
} from "./content";

const HeroScene = lazy(() => import("./components/HeroScene").then((m) => ({ default: m.HeroScene })));

const GATE_KEY = "g49-entered";

export function App() {
  const reduced = usePrefersReducedMotion();
  const [gate, setGate] = useState<"open" | "leaving" | "gone">(() => {
    const q = new URLSearchParams(location.search);
    if (q.has("nogate")) return "gone";
    try {
      if (sessionStorage.getItem(GATE_KEY)) return "gone";
    } catch {
      /* private mode */
    }
    return "open";
  });
  useReveal();
  return (
    <>
      <a className="skip" href="#main">Skip to content</a>
      {gate !== "gone" && (
        <Gate
          leaving={gate === "leaving"}
          onEnter={(withSound) => {
            if (withSound) play();
            try {
              sessionStorage.setItem(GATE_KEY, "1");
            } catch {
              /* ignore */
            }
            setGate("leaving");
            window.setTimeout(() => setGate("gone"), reduced ? 50 : 900);
          }}
        />
      )}
      <Nav />
      <main id="main">
        <Hero reduced={reduced} started={gate !== "open"} />
        <Ticker />
        <Latest />
        <Tapes />
        <Hood />
        <Frames />
        <Shows />
        <Drop />
        <Booking />
      </main>
      <Footer />
      {gate === "gone" && <MiniPlayer />}
      <div className="grain" aria-hidden />
    </>
  );
}

/* ───────────────────────── entry gate ───────────────────────── */

function Gate({ leaving, onEnter }: { leaving: boolean; onEnter: (withSound: boolean) => void }) {
  const btn = useRef<HTMLButtonElement>(null);
  const enter = useRef(onEnter);
  enter.current = onEnter;
  useEffect(() => {
    // warm up the hidden YouTube player while the gate is up, so the tap can start sound instantly
    const id = window.setTimeout(() => void initPlayer(), 150);
    document.documentElement.classList.add("gated");
    btn.current?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") enter.current(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(id);
      window.removeEventListener("keydown", onKey);
      document.documentElement.classList.remove("gated");
    };
  }, []);
  return (
    <div className={`gate ${leaving ? "is-leaving" : ""}`} role="dialog" aria-modal="true" aria-label="Enter GRAND49">
      <div className="gate-inner">
        <p className="mono gate-kicker">
          <span className="rec" aria-hidden /> {BRAND.name} · Addis Ababa<span className="hide-sm">, Ethiopia</span>
        </p>
        <h2 className="glitch gate-logo" data-text="GRAND49">GRAND49</h2>
        <p className="gate-tag">
          {BRAND.tagline} <span className="eth">{BRAND.taglineAm}</span>
        </p>
        <button ref={btn} type="button" className="gate-enter" onClick={() => onEnter(true)}>
          <span>ENTER</span>
          <span className="eth">ግባ</span>
        </button>
        <p className="mono gate-note">
          Sound on · {TRACKS[0].title}, {TRACKS[0].artists}
        </p>
        <button type="button" className="gate-skip mono" onClick={() => onEnter(false)}>
          Enter without sound →
        </button>
      </div>
    </div>
  );
}

/* ───────────────────────── nav ───────────────────────── */

function Nav() {
  return (
    <header className="nav">
      <a href="#top" className="nav-logo glitch" data-text="GRAND49" aria-label="GRAND49 home">
        GRAND49
      </a>
      <nav aria-label="Primary" className="mono">
        <a href="#music">Music</a>
        <a href="#hood">Hood</a>
        <a href="#shows">Shows</a>
        <a href="#drop">Merch</a>
        <a href="#booking" className="nav-cta">Book</a>
      </nav>
    </header>
  );
}

/* ───────────────────────── hero ───────────────────────── */

function Hero({ reduced, started }: { reduced: boolean; started: boolean }) {
  const [ref, inView] = useInView<HTMLElement>("0px");
  const mobile = useIsMobile();
  const [webgl] = useState(() => canRunWebGLHero(reduced));
  const [glReady, setGlReady] = useState(false);
  const scatter = useRef(0);
  useEffect(() => {
    const on = () => {
      const el = ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      scatter.current = Math.min(Math.max(-r.top / (r.height * 0.9), 0), 1);
    };
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, [ref]);
  const latest = TRACKS[0];
  return (
    <section id="top" ref={ref} className={`hero ${glReady ? "gl-on" : ""}`}>
      <div className="hero-photo" aria-hidden>
        <img src={HERO_IMAGE} alt="" fetchPriority="high" decoding="async" />
        <img src={HERO_IMAGE} alt="" className="hero-photo-glitch" decoding="async" />
      </div>
      {webgl && started && (
        <div className="hero-canvas">
          <Suspense fallback={null}>
            <HeroScene
              image={HERO_IMAGE}
              eventSource={ref}
              active={inView}
              reduced={reduced}
              mobile={mobile}
              scatter={scatter}
              onReady={() => setGlReady(true)}
            />
          </Suspense>
        </div>
      )}
      <div className="hero-shade" aria-hidden />
      <div className="hero-copy">
        <p className="mono kicker">
          <span className="rec" aria-hidden /> {BRAND.city} · <span className="eth">{BRAND.cityAm}</span>
        </p>
        <h1 className="hero-title">
          <span className="glitch" data-text="GRAND49">GRAND49</span>
          <span className="hero-hood">HOOD</span>
          <span className="sr-only"> — {BRAND.name}</span>
        </h1>
        <p className="hero-tag">
          {BRAND.tagline}
          <span className="eth hero-tag-am" lang="am">{BRAND.taglineAm}</span>
        </p>
        <div className="hero-actions">
          <button type="button" className="btn btn-red" onClick={() => play()}>
            <span aria-hidden>▶</span> Play {latest.title}
          </button>
          <a href="#booking" className="btn btn-ghost">Book GRAND49</a>
        </div>
      </div>
      <a href="#music" className="hero-latest mono">
        <span className="hero-latest-k">Latest drop</span>
        <strong>{latest.title}</strong>
        <span>{latest.artists}</span>
        <span className="hero-latest-v">{latest.note}</span>
      </a>
      {webgl && <p className="hero-hint mono" aria-hidden>{mobile ? "Drag to tear" : "Move to tear"} ✕</p>}
    </section>
  );
}

function Ticker() {
  const words = [BRAND.tagline.replace(".", ""), BRAND.taglineAm, BRAND.tagAm, BRAND.hood, "Addis Ababa", BRAND.tag];
  const row = words.map((w, i) => (
    <span key={i} className={/[\u1200-\u137F]/.test(w) ? "eth" : ""}>
      {w}
      <i aria-hidden>✕</i>
    </span>
  ));
  return (
    <div className="ticker" aria-hidden>
      <div className="ticker-track">
        {row}
        {row}
      </div>
    </div>
  );
}

/* ───────────────────────── music ───────────────────────── */

function SectionHead({ k, title, am, children }: { k: string; title: string; am?: string; children?: React.ReactNode }) {
  return (
    <div className="shead" data-reveal>
      <p className="mono shead-k">
        <span className="shead-line" aria-hidden /> {k}
      </p>
      <h2 className="shead-t">
        {title}
        {am && <span className="eth shead-am" lang="am">{am}</span>}
      </h2>
      {children}
    </div>
  );
}

function Latest() {
  const t = TRACKS[0];
  return (
    <section id="music" className="latest">
      <div className="latest-grid">
        <div className="latest-copy" data-reveal>
          <p className="mono shead-k"><span className="shead-line" aria-hidden /> Latest release</p>
          <h2 className="latest-title glitch" data-text={t.title}>{t.title}</h2>
          <p className="latest-artists">{t.artists}</p>
          <p className="mono latest-views">
            <span className="rec" aria-hidden /> {t.note} on YouTube
          </p>
          <a className="mono link-u" href={ytWatch(t.id)} target="_blank" rel="noopener noreferrer">Watch on YouTube ↗</a>
        </div>
        <div className="latest-video frame-corners" data-reveal>
          <LiteYouTube track={t} hq eager />
        </div>
      </div>
    </section>
  );
}

function Tapes() {
  const rail = useRailParallax();
  const scrollBy = (dir: number) => rail.current?.scrollBy({ left: dir * rail.current.clientWidth * 0.8, behavior: "smooth" });
  return (
    <section className="tapes" aria-labelledby="tapes-t">
      <div className="tapes-head">
        <SectionHead k={`${TRACKS.length} videos · tap to play`} title="The Tapes" />
        <div className="rail-btns" aria-hidden>
          <button type="button" onClick={() => scrollBy(-1)} tabIndex={-1}>←</button>
          <button type="button" onClick={() => scrollBy(1)} tabIndex={-1}>→</button>
        </div>
      </div>
      <div className="rail" ref={rail} id="tapes-t" role="list">
        {TRACKS.map((t, i) => (
          <article className="tape" key={t.id} role="listitem" data-par>
            <div className="tape-media">
              <LiteYouTube track={t} />
            </div>
            <div className="tape-meta">
              <span className="mono tape-n">{String(i + 1).padStart(2, "0")}</span>
              <h3 className="tape-t">{t.title}</h3>
              <p className="mono tape-a">{t.artists}</p>
            </div>
          </article>
        ))}
        <a className="tape tape-more" href={LINKS.youtubeSubscribe} target="_blank" rel="noopener noreferrer">
          <span className="tape-more-big">More on<br />YouTube ↗</span>
          <span className="mono">@GRAND49HOOD · {LINKS.youtubeSubs} subscribers</span>
        </a>
      </div>
    </section>
  );
}

/* ───────────────────────── crew ───────────────────────── */

function Hood() {
  return (
    <section id="hood" className="hood">
      <SectionHead k={BRAND.hood} title="The Hood">
        <p className="shead-p" data-reveal>{BRAND.description}</p>
      </SectionHead>
      <ol className="roster">
        {ARTISTS.map((a, i) => (
          <li key={a} className="roster-row" data-reveal style={{ ["--d" as string]: `${i * 60}ms` }}>
            <span className="mono roster-n">{String(i + 1).padStart(2, "0")}</span>
            <span className="roster-name glitch-hover" data-text={a.toUpperCase()}>{a.toUpperCase()}</span>
            <span className="mono roster-credits">{artistTracks(a).join(" · ")}</span>
          </li>
        ))}
      </ol>
      <p className="mono hood-dj">{BRAND.djCredit}</p>
    </section>
  );
}

function Frames() {
  return (
    <section className="frames" aria-label="Photos">
      {PHOTOS.map((p, i) => (
        <figure key={p.src} className={`frame frame-${i % 2 ? "b" : "a"}`} data-reveal>
          <div className="frame-img">
            <img src={p.src} alt={p.alt} loading="lazy" decoding="async" style={{ objectPosition: p.position }} />
          </div>
          <figcaption className="mono">
            <span>{String(i + 1).padStart(2, "0")} / {String(PHOTOS.length).padStart(2, "0")}</span> {p.caption}
          </figcaption>
        </figure>
      ))}
    </section>
  );
}

/* ───────────────────────── shows ───────────────────────── */

function todayISO() {
  // calendar date in Addis Ababa
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Addis_Ababa" }).format(new Date());
}

function Shows() {
  const today = todayISO();
  const shows = [...SHOWS].sort((a, b) => a.date.localeCompare(b.date));
  const nextIdx = shows.findIndex((s) => s.date >= today);
  return (
    <section id="shows" className="shows">
      <SectionHead k="Live" title="Shows" />
      <ul className="show-list">
        {shows.map((s, i) => {
          const d = new Date(`${s.date}T12:00:00Z`);
          const fmt = (o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("en-GB", { ...o, timeZone: "UTC" }).format(d).toUpperCase();
          const past = s.date < today;
          return (
            <li key={s.date + s.city} className={`show ${past ? "is-past" : ""}`} data-reveal>
              <time className="show-date" dateTime={s.date}>
                <span className="mono">{fmt({ weekday: "short" })}</span>
                <strong>{fmt({ day: "2-digit" })}</strong>
                <span className="mono">{fmt({ month: "short" })} {fmt({ year: "numeric" })}</span>
              </time>
              <div className="show-main">
                <p className="mono show-badge">{past ? "Done" : i === nextIdx ? "Next up" : "Upcoming"}</p>
                <h3 className="show-city">
                  {s.city} {s.cityAm && <span className="eth" lang="am">{s.cityAm}</span>}
                </h3>
                <p className="show-venue">{s.venue}</p>
                <p className="mono show-line">{s.lineup}{s.presenter && <> · presented by {s.presenter}</>}</p>
                {s.tickets && <a className="btn btn-red" href={s.tickets} target="_blank" rel="noopener noreferrer">Tickets</a>}
              </div>
              {s.flyer && (
                <a className="show-flyer" href={s.flyer} target="_blank" rel="noopener" aria-label={`Open the ${s.city} flyer`}>
                  <img src={s.flyerThumb ?? s.flyer} alt={`Flyer: ${s.lineup}, ${s.city}`} loading="lazy" decoding="async" width="160" height="160" />
                  <span className="mono">Flyer ↗</span>
                </a>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/* ───────────────────────── merch ───────────────────────── */

function Drop() {
  return (
    <section id="drop" className="drop">
      <SectionHead k="Drop 001 · merch" title="The Drop">
        <p className="shead-p" data-reveal>Nothing's for sale yet. Get notified when it lands.</p>
      </SectionHead>
      <div className="drop-grid">
        {MERCH.map((m, i) => {
          const notify = BOOKING_READY
            ? `mailto:${BOOKING_EMAIL}?subject=${encodeURIComponent(`Notify me: ${m.name}`)}`
            : LINKS.youtubeSubscribe;
          return (
            <article key={m.name} className="merch" data-reveal style={{ ["--d" as string]: `${i * 80}ms` }}>
              <div className="merch-art">
                {m.image ? <img src={m.image} alt={m.name} loading="lazy" /> : <MerchMockup item={m} />}
                <span className="merch-stamp mono" aria-hidden>Coming soon</span>
              </div>
              <div className="merch-meta">
                <span className="mono merch-n">{String(i + 1).padStart(3, "0")}</span>
                <h3 className="merch-name">{m.name}</h3>
                <p className="mono merch-status">Coming soon</p>
                <a className="btn btn-line" href={notify} target={BOOKING_READY ? undefined : "_blank"} rel="noopener noreferrer">
                  Notify me
                </a>
                {!BOOKING_READY && <p className="mono merch-via">Subscribe on YouTube for the drop</p>}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

/* ───────────────────────── booking ───────────────────────── */

function Booking() {
  return (
    <section id="booking" className="booking">
      <div className="booking-inner" data-reveal>
        <p className="mono shead-k"><span className="shead-line" aria-hidden /> Booking · shows · features</p>
        <h2 className="booking-t">
          Book<br />
          <span className="glitch" data-text="GRAND49">GRAND49</span>
        </h2>
        <p className="booking-p">Shows, features and press: Saint Mosses, Young CJ, Lil PPCS, Young Sura, Botla DP.</p>
        {BOOKING_READY ? (
          <a className="btn btn-red btn-xl" href={`mailto:${BOOKING_EMAIL}?subject=${encodeURIComponent("Booking: GRAND49")}`}>
            {BOOKING_EMAIL} →
          </a>
        ) : (
          <p className="booking-mail">
            <span className="mono">{BOOKING_EMAIL}</span>
            <span className="todo mono">Email coming soon</span>
          </p>
        )}
        <div className="booking-row mono">
          <span>{BRAND.djCredit}</span>
          <a className="link-u" href={LINKS.youtube} target="_blank" rel="noopener noreferrer">YouTube @GRAND49HOOD ↗</a>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-big" aria-hidden>GRAND49</div>
      <div className="footer-links mono">
        <a href={LINKS.youtube} target="_blank" rel="noopener noreferrer">YouTube · {LINKS.youtubeSubs} subscribers</a>
        {LINKS.spotify && <a href={LINKS.spotify} target="_blank" rel="noopener noreferrer">Spotify</a>}
        {LINKS.instagram && <a href={LINKS.instagram} target="_blank" rel="noopener noreferrer">Instagram</a>}
        <a href="#booking">Booking</a>
      </div>
      <div className="footer-row mono">
        <p>© 2026 {BRAND.name} · <span className="eth">{BRAND.tagAm}</span> · {BRAND.city}</p>
        <p>{BRAND.djCredit}</p>
      </div>
    </footer>
  );
}

/* ───────────────────────── mini player ───────────────────────── */

function MiniPlayer() {
  const s = usePlayer();
  const t = TRACKS[s.index];
  const live = s.playing || s.pending;
  return (
    <div className={`mini ${s.playing ? "is-playing" : ""}`} role="region" aria-label="Music player">
      <span className="mini-eq" aria-hidden><i /><i /><i /><i /></span>
      <div className="mini-info">
        <span className="mono mini-k">{s.error ? "Player unavailable" : s.playing ? "Now playing" : s.pending ? "Loading…" : "Paused"}</span>
        <span className="mini-t" aria-live="polite">
          <strong>{t.title}</strong>, {t.artists}
        </span>
      </div>
      <div className="mini-btns">
        {s.error ? (
          <a className="mini-btn mono" href={ytWatch(t.id)} target="_blank" rel="noopener noreferrer" aria-label="Open on YouTube">YT↗</a>
        ) : (
          <>
            <button type="button" className="mini-btn" onClick={toggle} aria-label={live ? "Pause" : "Play"}>
              {live ? (
                <svg viewBox="0 0 24 24" width="18" height="18"><path d="M6 4h4v16H6zM14 4h4v16h-4z" fill="currentColor" /></svg>
              ) : (
                <svg viewBox="0 0 24 24" width="18" height="18"><path d="M7 4.5v15l13-7.5z" fill="currentColor" /></svg>
              )}
            </button>
            <button type="button" className="mini-btn" onClick={toggleMute} aria-label={s.muted ? "Unmute" : "Mute"} aria-pressed={s.muted}>
              {s.muted ? (
                <svg viewBox="0 0 24 24" width="18" height="18"><path d="M4 9v6h4l5 4V5L8 9zM16 9l5 6M21 9l-5 6" stroke="currentColor" strokeWidth="2" fill="none" /></svg>
              ) : (
                <svg viewBox="0 0 24 24" width="18" height="18"><path d="M4 9v6h4l5 4V5L8 9z" fill="currentColor" /><path d="M16 8.5a5 5 0 010 7M18.5 6a8.5 8.5 0 010 12" stroke="currentColor" strokeWidth="2" fill="none" /></svg>
              )}
            </button>
            <button type="button" className="mini-btn" onClick={next} aria-label="Next track">
              <svg viewBox="0 0 24 24" width="18" height="18"><path d="M5 4.5v15l10-7.5zM16 4h3v16h-3z" fill="currentColor" /></svg>
            </button>
          </>
        )}
      </div>
    </div>
  );
}
