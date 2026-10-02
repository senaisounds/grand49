// Background music player: a hidden YouTube IFrame Player API player that the entry gate
// starts with a tap (browsers block autoplay with sound until the user interacts).
// Tiny external store, consumed with useSyncExternalStore.
import { useSyncExternalStore } from "react";
import { TRACKS } from "../content";

type YTPlayer = {
  playVideo(): void;
  pauseVideo(): void;
  mute(): void;
  unMute(): void;
  loadVideoById(id: string): void;
  cueVideoById(id: string): void;
  setVolume(v: number): void;
  getPlayerState(): number;
};
declare global {
  interface Window {
    YT?: { Player: new (el: HTMLElement | string, opts: unknown) => YTPlayer; PlayerState: Record<string, number> };
    onYouTubeIframeAPIReady?: () => void;
  }
}

export type PlayerState = {
  ready: boolean;
  playing: boolean;
  muted: boolean;
  index: number;
  /** true while we asked to play but the video hasn't started yet */
  pending: boolean;
  error: boolean;
};

let state: PlayerState = { ready: false, playing: false, muted: false, index: 0, pending: false, error: false };
const listeners = new Set<() => void>();
const set = (patch: Partial<PlayerState>) => {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
};

let player: YTPlayer | null = null;
let apiPromise: Promise<void> | null = null;
let wantPlay = false;

function loadApi() {
  if (apiPromise) return apiPromise;
  apiPromise = new Promise<void>((resolve, reject) => {
    if (window.YT?.Player) return resolve();
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      prev?.();
      resolve();
    };
    const s = document.createElement("script");
    s.src = "https://www.youtube.com/iframe_api";
    s.async = true;
    s.onerror = () => reject(new Error("YouTube API failed to load"));
    document.head.appendChild(s);
  });
  return apiPromise;
}

/** Create the hidden player (idempotent). Call early (e.g. while the gate is showing). */
export async function initPlayer() {
  if (player || typeof window === "undefined") return;
  try {
    await loadApi();
  } catch {
    set({ error: true, pending: false });
    return;
  }
  if (player) return;
  const host = document.createElement("div");
  host.id = "g49-bg-player";
  const wrap = document.createElement("div");
  wrap.className = "bg-player";
  wrap.setAttribute("aria-hidden", "true");
  wrap.appendChild(host);
  document.body.appendChild(wrap);
  player = new window.YT!.Player(host, {
    host: "https://www.youtube-nocookie.com",
    width: 200,
    height: 200,
    videoId: TRACKS[0].id,
    playerVars: { autoplay: 0, controls: 0, disablekb: 1, playsinline: 1, rel: 0, fs: 0, iv_load_policy: 3 },
    events: {
      onReady: () => {
        set({ ready: true });
        player!.setVolume(85);
        if (state.muted) player!.mute();
        if (state.index !== 0) {
          if (wantPlay) player!.loadVideoById(TRACKS[state.index].id);
          else player!.cueVideoById(TRACKS[state.index].id);
        } else if (wantPlay) player!.playVideo();
      },
      onStateChange: (e: { data: number }) => {
        // -1 unstarted, 0 ended, 1 playing, 2 paused, 3 buffering, 5 cued
        if (e.data === 1) set({ playing: true, pending: false });
        else if (e.data === 2) set({ playing: false, pending: false });
        else if (e.data === 0) next();
      },
      onError: () => {
        set({ pending: false });
        next();
      },
    },
  });
}

export function play() {
  wantPlay = true;
  if (player && state.ready) player.playVideo();
  else {
    set({ pending: true });
    void initPlayer();
  }
}
export function pause() {
  wantPlay = false;
  if (player && state.ready) player.pauseVideo();
  set({ playing: false, pending: false });
}
export function toggle() {
  if (state.playing || state.pending) pause();
  else play();
}
export function toggleMute() {
  if (!player || !state.ready) return set({ muted: !state.muted });
  if (state.muted) player.unMute();
  else player.mute();
  set({ muted: !state.muted });
}
export function next() {
  const index = (state.index + 1) % TRACKS.length;
  set({ index });
  if (!player || !state.ready) return;
  if (wantPlay) player.loadVideoById(TRACKS[index].id);
  else player.cueVideoById(TRACKS[index].id);
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};
export const usePlayer = () => useSyncExternalStore(subscribe, () => state, () => state);
