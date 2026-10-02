import { useEffect, useRef, useState } from "react";
import { pause as pauseBg } from "../lib/player";
import { ytThumb, type Track } from "../content";

let preconnected = false;
function preconnect() {
  if (preconnected) return;
  preconnected = true;
  for (const href of ["https://www.youtube-nocookie.com", "https://www.google.com", "https://i.ytimg.com"]) {
    const l = document.createElement("link");
    l.rel = "preconnect";
    l.href = href;
    document.head.appendChild(l);
  }
}

/** Click-to-load YouTube (youtube-nocookie). Shows a thumbnail until tapped; pauses the background music on play. */
export function LiteYouTube({
  track,
  hq = false,
  eager = false,
  className = "",
}: {
  track: Track;
  hq?: boolean;
  eager?: boolean;
  className?: string;
}) {
  const [on, setOn] = useState(false);
  const [src, setSrc] = useState(track.cover ?? ytThumb(track.id, hq ? "maxresdefault" : "hqdefault"));
  const label = `Play ${track.title} — ${track.artists}`;
  return (
    <div className={`lite ${on ? "is-on" : ""} ${className}`}>
      {on ? (
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${track.id}?autoplay=1&rel=0&playsinline=1&modestbranding=1`}
          title={`${track.title} — ${track.artists}`}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
        />
      ) : (
        <button
          type="button"
          className="lite-btn"
          aria-label={label}
          onPointerEnter={preconnect}
          onFocus={preconnect}
          onClick={() => {
            pauseBg();
            setOn(true);
          }}
        >
          <img
            className="lite-img"
            src={src}
            alt=""
            loading={eager ? "eager" : "lazy"}
            decoding="async"
            data-yt={track.id}
            onError={() => setSrc(ytThumb(track.id, "hqdefault"))}
          />
          <span className="lite-play" aria-hidden>
            <svg viewBox="0 0 24 24" width="28" height="28"><path d="M7 4.5v15l13-7.5z" fill="currentColor" /></svg>
          </span>
        </button>
      )}
    </div>
  );
}

/** Horizontal scroll-snap rail with a light parallax on each card's image. */
export function useRailParallax() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const r = el.getBoundingClientRect();
      const mid = r.left + r.width / 2;
      el.querySelectorAll<HTMLElement>("[data-par]").forEach((c) => {
        const cr = c.getBoundingClientRect();
        const p = (cr.left + cr.width / 2 - mid) / r.width; // -1..1
        c.style.setProperty("--p", p.toFixed(3));
      });
    };
    const on = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    el.addEventListener("scroll", on, { passive: true });
    window.addEventListener("resize", on);
    return () => {
      el.removeEventListener("scroll", on);
      window.removeEventListener("resize", on);
      cancelAnimationFrame(raf);
    };
  }, []);
  return ref;
}
