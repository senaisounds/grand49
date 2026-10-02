import { useEffect, useRef, useState, type RefObject } from "react";

/** true when the user asked the OS for reduced motion */
export function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const on = () => setReduced(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return reduced;
}

/** Visible-in-viewport flag, used to pause offscreen WebGL canvases. */
export function useInView<T extends Element>(rootMargin = "200px"): [RefObject<T | null>, boolean] {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { rootMargin });
    io.observe(el);
    return () => io.disconnect();
  }, [rootMargin]);
  return [ref, inView];
}

export function useIsMobile(breakpoint = 760) {
  const [m, setM] = useState(() => typeof window !== "undefined" && window.innerWidth < breakpoint);
  useEffect(() => {
    const on = () => setM(window.innerWidth < breakpoint);
    window.addEventListener("resize", on);
    return () => window.removeEventListener("resize", on);
  }, [breakpoint]);
  return m;
}

/** Adds .is-in to [data-reveal] elements when they scroll into view (CSS does the animation). */
export function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll<HTMLElement>("[data-reveal]");
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("is-in");
            io.unobserve(e.target);
          }
        }),
      { rootMargin: "0px 0px -10% 0px", threshold: 0.12 },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
}

/**
 * Decide whether the WebGL hero is worth running on this device.
 * Falls back to the static duotone image on: no WebGL, reduced motion, Save-Data,
 * very low memory / core counts (common on budget Android phones).
 */
export function canRunWebGLHero(reduced: boolean) {
  if (typeof window === "undefined" || reduced) return false;
  const q = new URLSearchParams(location.search);
  if (q.has("static")) return false;
  // phones get the static duotone photo: more readable at that size, and lighter on data + battery
  if (window.innerWidth < 760 && !q.has("webgl")) return false;
  const nav = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } };
  if (nav.connection?.saveData) return false;
  if (nav.deviceMemory !== undefined && nav.deviceMemory < 2) return false;
  if (nav.hardwareConcurrency !== undefined && nav.hardwareConcurrency < 4 && !q.has("webgl")) return false;
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

export const DPR: [number, number] = [1, 1.5];
