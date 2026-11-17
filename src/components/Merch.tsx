import { useCallback, useId, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import {
  MERCH,
  MERCH_COLLECTION,
  MERCH_COLLECTION_AM,
  MERCH_EMAIL,
  MERCH_ORDER_HREF,
  MERCH_TAGLINE,
  type MerchItem,
} from "../content";
import { usePrefersReducedMotion } from "../lib/hooks";

const MARQUEE = ["WE ASK FOR FORGIVENESS, NOT PERMISSION", "ADDIS ABABA, 49", MERCH_COLLECTION_AM, MERCH_COLLECTION];

function MerchMarquee({ className = "" }: { className?: string }) {
  return (
    <div className={`merch-marquee ${className}`.trim()} aria-hidden>
      <div className="merch-marquee-track">
        {Array.from({ length: 2 }, (_, copy) => (
          <span key={copy} className="merch-marquee-row">
            {MARQUEE.map((w, i) => (
              <span key={`${copy}-${i}`} className={/[\u1200-\u137F]/.test(w) ? "eth" : ""}>
                {w}
                <i>✕</i>
              </span>
            ))}
          </span>
        ))}
      </div>
    </div>
  );
}

export function MerchDrop() {
  const reduced = usePrefersReducedMotion();
  return (
    <section id="merch" className="drop" aria-labelledby="merch-title">
      <span id="drop" className="drop-anchor" aria-hidden />
      <MerchMarquee className="merch-marquee-top" />

      <div className="merch-hero" data-reveal>
        <img
          className="merch-sun"
          src="/img/merch/logo-sunburst-49.webp"
          alt=""
          width={716}
          height={716}
          decoding="async"
          aria-hidden
        />
        <p className="mono shead-k merch-kicker">
          <span className="shead-line" aria-hidden /> Drop 001 · merch · {MERCH_COLLECTION}
        </p>
        <h2 id="merch-title" className="merch-title">
          <span className="merch-am-wrap">
            <span className="merch-am-bleed eth" lang="am" aria-hidden>
              {MERCH_COLLECTION_AM}
            </span>
            <span className="glitch merch-am eth" data-text={MERCH_COLLECTION_AM} lang="am">
              {MERCH_COLLECTION_AM}
            </span>
          </span>
          <span className="merch-en">{MERCH_COLLECTION}</span>
        </h2>
        <p className="merch-tagline">{MERCH_TAGLINE}</p>
        <MagneticCta href={MERCH_ORDER_HREF} reduced={reduced}>
          Order / Inquire
        </MagneticCta>
        <p className="mono merch-via-note">
          DM or email to order · <a className="link-u" href={MERCH_ORDER_HREF}>{MERCH_EMAIL}</a>
        </p>
      </div>

      <div className="drop-grid">
        {MERCH.map((item, i) => (
          <MerchCard key={item.id} item={item} index={i} reduced={reduced} />
        ))}
      </div>

      <MerchMarquee className="merch-marquee-bottom" />
    </section>
  );
}

function MagneticCta({
  href,
  reduced,
  children,
}: {
  href: string;
  reduced: boolean;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLAnchorElement>(null);
  const reset = () => {
    const el = ref.current;
    if (el) el.style.transform = "";
  };
  const onMove = (e: ReactPointerEvent<HTMLAnchorElement>) => {
    if (reduced) return;
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = e.clientX - (r.left + r.width / 2);
    const y = e.clientY - (r.top + r.height / 2);
    el.style.transform = `translate(${x * 0.32}px, ${y * 0.38}px)`;
  };
  return (
    <a
      ref={ref}
      className="btn btn-red merch-cta"
      href={href}
      onPointerMove={onMove}
      onPointerLeave={reset}
      onPointerUp={reset}
    >
      {children}
    </a>
  );
}

function MerchCard({ item, index, reduced }: { item: MerchItem; index: number; reduced: boolean }) {
  const [flipped, setFlipped] = useState(false);
  const tiltRef = useRef<HTMLDivElement>(null);
  const glareRef = useRef<HTMLSpanElement>(null);
  const labelId = useId();
  const canFlip = Boolean(item.back);

  const resetTilt = useCallback(() => {
    const el = tiltRef.current;
    const glare = glareRef.current;
    if (el) el.style.transform = "rotateX(0deg) rotateY(0deg)";
    if (glare) glare.style.opacity = "0";
  }, []);

  const onMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (reduced) return;
    const wrap = e.currentTarget;
    const el = tiltRef.current;
    const glare = glareRef.current;
    if (!el) return;
    const r = wrap.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    const rx = (0.5 - py) * 16;
    const ry = (px - 0.5) * 18;
    el.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg)`;
    if (glare) {
      glare.style.opacity = "1";
      glare.style.background = `radial-gradient(circle at ${px * 100}% ${py * 100}%, rgba(255, 255, 255, 0.7) 0%, rgba(255, 255, 255, 0.12) 28%, rgba(20, 12, 10, 0.12) 70%)`;
    }
  };

  const toggle = () => {
    if (canFlip) setFlipped((v) => !v);
  };

  return (
    <article
      className={`merch${item.studio ? " is-studio" : ""}`}
      aria-labelledby={labelId}
      data-reveal
      style={{ ["--d" as string]: `${index * 70}ms` }}
    >
      <div
        className="merch-stage"
        onPointerMove={onMove}
        onPointerLeave={resetTilt}
      >
        <div
          ref={tiltRef}
          className={`merch-tilt${flipped ? " is-flipped" : ""}`}
        >
          <div className="merch-flip">
            <div className="merch-face merch-face-front">
              <div className={`merch-art${item.studio ? " is-studio" : ""}`}>
                <img src={item.front} alt={`${item.name}, front`} loading="lazy" decoding="async" />
              </div>
            </div>
            {item.back && (
              <div className="merch-face merch-face-back">
                <div className={`merch-art${item.studio ? " is-studio" : ""}`}>
                  <img src={item.back} alt={`${item.name}, back`} loading="lazy" decoding="async" />
                </div>
              </div>
            )}
          </div>
          <span ref={glareRef} className="merch-glare" aria-hidden />
        </div>
      </div>
      <div className="merch-meta">
        <span className="mono merch-n">{String(index + 1).padStart(3, "0")}</span>
        <h3 className="merch-name" id={labelId}>{item.name}</h3>
        <p className="mono merch-status">
          {item.colorway === "white" ? "White" : "Black"} · {MERCH_COLLECTION}
        </p>
        {canFlip && (
          <button
            type="button"
            className="merch-flip-btn mono"
            onClick={toggle}
            aria-pressed={flipped}
            aria-label={flipped ? `Show front of ${item.name}` : `Show back of ${item.name}`}
          >
            <span className="merch-flip-dot" aria-hidden />
            {flipped ? "Back" : "Front"} · {flipped ? "show front" : "flip to back"}
          </button>
        )}
      </div>
    </article>
  );
}
