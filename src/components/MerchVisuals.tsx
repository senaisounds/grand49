import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import {
  MERCH_COLLECTION,
  MERCH_COLLECTION_AM,
  MERCH_EMAIL,
  MERCH_FISHEYE,
  MERCH_FISHEYE_LOOP,
  MERCH_LOOKS,
  MERCH_ORDER_HREF,
  MERCH_SPIN_FRAMES,
  merchSpinSrc,
} from "../content";
import { useInView, usePrefersReducedMotion } from "../lib/hooks";

function scrollToItem(id: string) {
  document.getElementById(`merch-item-${id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
}

export function FisheyeStrip({ reduced }: { reduced: boolean }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [ref, near] = useInView<HTMLDivElement>("400px");
  const [focus, setFocus] = useState(0);

  useEffect(() => {
    if (reduced) return;
    const el = wrapRef.current;
    if (!el) return;
    let raf = 0;
    const update = () => {
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const start = vh * 0.82;
      const end = -r.height * 0.2;
      const t = Math.min(1, Math.max(0, (start - r.top) / Math.max(1, start - end)));
      setFocus(t * (MERCH_FISHEYE.length - 1));
    };
    const on = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", on, { passive: true });
    window.addEventListener("resize", on);
    return () => {
      window.removeEventListener("scroll", on);
      window.removeEventListener("resize", on);
      cancelAnimationFrame(raf);
    };
  }, [reduced]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (near && !reduced) v.play().catch(() => {});
    else v.pause();
  }, [near, reduced]);

  return (
    <div ref={ref} className="merch-fish" data-reveal>
      <p className="mono shead-k merch-kicker">
        <span className="shead-line" aria-hidden /> Look · fisheye
      </p>
      <div ref={wrapRef} className="merch-fish-row">
        {MERCH_FISHEYE.map((item, i) => {
          const d = Math.abs(focus - i);
          const scale = reduced ? 1 : Math.max(0.84, 1.08 - Math.min(d, 2) * 0.14);
          const blur = reduced ? 0 : Math.min(d, 2) * 1.6;
          const isLead = i === 0;
          return (
            <figure
              key={item.id}
              className={`merch-fish-orb${isLead ? " is-lead" : ""}`}
              style={{
                transform: `scale(${scale})`,
                filter: blur ? `blur(${blur}px)` : undefined,
                zIndex: Math.round(10 - d * 2),
              }}
            >
              {isLead ? (
                <video
                  ref={videoRef}
                  className="merch-fish-media"
                  muted
                  loop
                  playsInline
                  preload={near ? "metadata" : "none"}
                  poster={MERCH_FISHEYE_LOOP.poster}
                  aria-label={`${item.name}, fisheye loop`}
                >
                  {near && (
                    <>
                      <source src={MERCH_FISHEYE_LOOP.webm} type="video/webm" />
                      <source src={MERCH_FISHEYE_LOOP.mp4} type="video/mp4" />
                    </>
                  )}
                </video>
              ) : (
                <img
                  className="merch-fish-media"
                  src={item.src}
                  alt=""
                  width={1290}
                  height={1600}
                  loading="lazy"
                  decoding="async"
                />
              )}
              <figcaption className="mono merch-fish-cap">{item.name}</figcaption>
            </figure>
          );
        })}
      </div>
    </div>
  );
}

export function Lookbook() {
  const [open, setOpen] = useState<string | null>(null);

  return (
    <div className="merch-looks" data-reveal>
      <p className="mono shead-k merch-kicker">
        <span className="shead-line" aria-hidden /> Lookbook · {MERCH_COLLECTION}
      </p>
      <div className="merch-looks-stage">
        <div className="merch-looks-type" aria-hidden>
          <span className="merch-looks-49">49</span>
          <span className="merch-looks-en">{MERCH_COLLECTION}</span>
          <span className="merch-looks-am eth" lang="am">
            {MERCH_COLLECTION_AM}
          </span>
        </div>
        <ul className="merch-looks-row">
          {MERCH_LOOKS.map((look) => (
            <li key={look.id} className={`merch-look${look.featured ? " is-featured" : ""}`}>
              <img src={look.src} alt="" width={512} height={1600} loading="lazy" decoding="async" />
              {look.spots.map((spot, i) => {
                const key = `${look.id}-${i}`;
                const isOpen = open === key;
                return (
                  <button
                    key={key}
                    type="button"
                    className={`merch-hot${isOpen ? " is-open" : ""}`}
                    style={{ left: `${spot.x}%`, top: `${spot.y}%` }}
                    aria-expanded={isOpen}
                    aria-label={spot.name}
                    onClick={() => setOpen(isOpen ? null : key)}
                    onMouseEnter={() => setOpen(key)}
                    onMouseLeave={() => setOpen((v) => (v === key ? null : v))}
                  >
                    <span className="merch-hot-dot" aria-hidden />
                    <a
                      className="merch-hot-label mono"
                      href={`#merch-item-${spot.itemId}`}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        scrollToItem(spot.itemId);
                      }}
                    >
                      {spot.name}
                    </a>
                  </button>
                );
              })}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export function HoodieSpin({ reduced }: { reduced: boolean }) {
  const [wrapRef, near] = useInView<HTMLDivElement>("500px");
  const [frame, setFrame] = useState(0);
  const [ready, setReady] = useState(false);
  const drag = useRef<{ x: number; y: number; start: number; mode: "pending" | "spin" | "scroll" } | null>(null);

  useEffect(() => {
    if (!near) return;
    let cancelled = false;
    const jobs = Array.from({ length: MERCH_SPIN_FRAMES }, (_, n) => {
      const img = new Image();
      img.src = merchSpinSrc(n);
      return img.decode ? img.decode().catch(() => undefined) : new Promise<void>((res) => {
        img.onload = () => res();
        img.onerror = () => res();
      });
    });
    Promise.all(jobs).then(() => {
      if (!cancelled) setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, [near]);

  const onDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    // Don't capture yet — a vertical swipe must be free to scroll the page.
    drag.current = { x: e.clientX, y: e.clientY, start: frame, mode: "pending" };
  };
  const onMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d || d.mode === "scroll") return;
    const dx = e.clientX - d.x;
    const dy = e.clientY - d.y;
    if (d.mode === "pending") {
      if (Math.abs(dx) <= 8 && Math.abs(dy) <= 8) return;
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 8) {
        d.mode = "spin";
        try {
          e.currentTarget.setPointerCapture(e.pointerId);
        } catch {
          /* capture optional */
        }
      } else {
        d.mode = "scroll";
        return;
      }
    }
    const w = e.currentTarget.getBoundingClientRect().width || 320;
    const delta = Math.round(((e.clientX - d.x) / w) * MERCH_SPIN_FRAMES);
    setFrame(((d.start - delta) % MERCH_SPIN_FRAMES + MERCH_SPIN_FRAMES) % MERCH_SPIN_FRAMES);
  };
  const onUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* already released */
    }
    drag.current = null;
  };
  const step = (dir: number) => setFrame((n) => (n + dir + MERCH_SPIN_FRAMES) % MERCH_SPIN_FRAMES);

  return (
    <div ref={wrapRef} className="merch-spin" data-reveal>
      <p className="mono shead-k merch-kicker">
        <span className="shead-line" aria-hidden /> 360 · Black Hoodie
      </p>
      <div
        className="merch-spin-stage"
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        role="img"
        aria-label="Black Hoodie, drag to spin 360 degrees"
      >
        <img
          src={merchSpinSrc(near || ready ? frame : 0)}
          alt="Black Hoodie, front"
          width={600}
          height={896}
          draggable={false}
          decoding="async"
        />
      </div>
      <div className="merch-spin-bar">
        <button type="button" className="merch-spin-btn mono" onClick={() => step(-1)} aria-label="Rotate left">
          ←
        </button>
        <p className="mono merch-hint">{reduced ? "Use arrows to rotate" : "Drag to spin"}</p>
        <button type="button" className="merch-spin-btn mono" onClick={() => step(1)} aria-label="Rotate right">
          →
        </button>
      </div>
    </div>
  );
}

export function TicketCta({
  reduced,
  className = "",
}: {
  reduced: boolean;
  className?: string;
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
    el.style.transform = `translate(${x * 0.16}px, ${y * 0.18}px) rotate(-1.1deg)`;
  };
  return (
    <a
      ref={ref}
      className={`merch-ticket ${className}`.trim()}
      href={MERCH_ORDER_HREF}
      onPointerMove={onMove}
      onPointerLeave={reset}
      onPointerUp={reset}
    >
      <div className="merch-ticket-main">
        <div className="merch-ticket-top">
          <span className="mono">GRAND 49</span>
          <span className="mono">DROP 001</span>
        </div>
        <strong className="merch-ticket-name">{MERCH_COLLECTION}</strong>
        <div className="merch-ticket-grid">
          <div>
            <span className="mono">From</span>
            Addis Ababa
          </div>
          <div>
            <span className="mono">To</span>
            The Streets
          </div>
          <div>
            <span className="mono">Gate</span>
            49
          </div>
          <div>
            <span className="mono">Boarding</span>
            Open
          </div>
        </div>
        <span className="merch-ticket-board mono">Order / Inquire</span>
        <span className="merch-ticket-mail mono">{MERCH_EMAIL}</span>
      </div>
      <div className="merch-ticket-stub">
        <span className="merch-ticket-49">49</span>
        <span className="mono merch-ticket-city">Addis Ababa</span>
      </div>
    </a>
  );
}
