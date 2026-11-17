/** Lazy-load the vendored <model-viewer> script (only when merch is near the viewport). */

const SCRIPT_SRC = "/vendor/model-viewer.min.js";
const SCRIPT_FLAG = "data-model-viewer";

let pending: Promise<void> | null = null;

export function ensureModelViewer(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (customElements.get("model-viewer")) return Promise.resolve();
  if (pending) return pending;

  pending = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[${SCRIPT_FLAG}]`);
    const onReady = () => {
      customElements
        .whenDefined("model-viewer")
        .then(() => resolve())
        .catch(reject);
    };
    if (existing) {
      existing.addEventListener("load", onReady, { once: true });
      existing.addEventListener(
        "error",
        () => {
          pending = null;
          reject(new Error("model-viewer failed to load"));
        },
        { once: true },
      );
      // Already evaluated (e.g. HMR / back-forward cache).
      if (customElements.get("model-viewer")) resolve();
      return;
    }
    const script = document.createElement("script");
    script.type = "module";
    script.src = SCRIPT_SRC;
    script.setAttribute(SCRIPT_FLAG, "");
    script.onload = onReady;
    script.onerror = () => {
      pending = null;
      reject(new Error("model-viewer failed to load"));
    };
    document.head.appendChild(script);
  });

  return pending;
}

export const DRACO_DECODER_PATH = "/vendor/draco/";
