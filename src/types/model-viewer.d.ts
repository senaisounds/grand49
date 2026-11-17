import type { CSSProperties, HTMLAttributes, Ref } from "react";

type ModelViewerProps = HTMLAttributes<HTMLElement> & {
  ref?: Ref<HTMLElement>;
  src?: string;
  poster?: string;
  alt?: string;
  loading?: "auto" | "lazy" | "eager";
  reveal?: "auto" | "manual" | "interaction";
  exposure?: string;
  style?: CSSProperties;
  "camera-controls"?: boolean | "";
  "camera-orbit"?: string;
  "auto-rotate"?: boolean | "";
  "auto-rotate-delay"?: string;
  "rotation-per-second"?: string;
  "interaction-prompt"?: "auto" | "none" | "when-focused";
  "shadow-intensity"?: string;
  "shadow-softness"?: string;
  "environment-image"?: string;
  "touch-action"?: string;
  "disable-zoom"?: boolean | "";
  "disable-pan"?: boolean | "";
  "draco-decoder-path"?: string;
  "tone-mapping"?: string;
};

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "model-viewer": ModelViewerProps;
    }
  }
}

export {};
