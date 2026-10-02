# GRAND49 Entertainment — official site

**GRAND49 HOOD · From the Streets to the Streets · 4 እና 9 · Addis Ababa, Ethiopia**

A dark, noir/drill one-pager for GRAND49 Entertainment. Built on the Senai Technology website stack
(Vite + React + TypeScript + react-three-fiber), stripped down to only what pays off on phones in Ethiopia.

## Run it

```bash
npm install
npm run dev        # http://localhost:5174
npm run build      # type-check + production build -> dist/
npm run preview    # serve dist/ on http://localhost:4174
npm run shots      # headless QA + screenshots -> screenshots/ (needs dev or preview running; pass a URL to test prod)
npm run images     # re-generate optimized webp images from the source photos
```

`npm run shots` uses `playwright-core` with the system Chrome at `/usr/bin/google-chrome` (override with `CHROME_PATH=...`)
and SwiftShader software WebGL. It clicks through the entry gate, checks the background player starts, checks every
YouTube thumbnail loads, checks a gallery video pauses the music, and logs console errors from the site's own origin.

## Editing content: `src/content.ts`

Everything editable is in one file:

| What | Constant | Notes |
|------|----------|-------|
| **Email domain / booking email** | `EMAIL_DOMAIN` | **Empty until a domain is chosen.** Set e.g. `"grand49.com"` and `BOOKING_EMAIL` becomes `booking@grand49.com`, the booking CTA turns into a `mailto:` button, and the merch "Notify me" buttons become `mailto:` links. Until then the site shows `booking@ — TBD` and "Notify me" points at the YouTube subscribe link. |
| Credits | `CREDITS` | "Management: Abel · DJ: Senai". Add `href` to link a name. |
| Links | `LINKS` | YouTube, subscriber count label, Spotify (artist "GRAND 49"), Instagram (empty = hidden). |
| Tracks / videos | `TRACKS` | First entry is the featured release and the entry-gate song. `cover` overrides the YouTube thumbnail. |
| Artists | `ARTISTS` | Typographic roster. Credits are derived from `TRACKS`. |
| Shows | `SHOWS` | Sorted by date; past dates show "Done" automatically (Addis Ababa calendar date). |
| Merch | `MERCH` | All "Coming soon / Notify me", no prices. Add `image` to swap the CSS/SVG mockup for a product photo. |
| Photos | `PHOTOS`, `HERO_IMAGE` | Image slots. Drop files in `public/img/` (webp, ~500–900px) and edit the paths. |

## Page

1. **Entry gate**: full-screen, GRAND49 wordmark + `ENTER / ግባ`. The tap starts **BAD** through a hidden YouTube IFrame
   Player API player (browsers block autoplay with sound until a tap). "Enter without sound" and `Esc` skip it; it's
   skipped for the rest of the session once entered. `?nogate` skips it too.
2. **Mini player** (fixed bottom): play/pause, mute, track name, next (cycles the 5 tracks, auto-advances on end).
   It pauses whenever a video embed on the page is started.
3. **Hero**: on desktop, the crew photo as a noisy point cloud (radiance-field look) over a dim duotone plate. It tears
   apart under the cursor, and a "ghost hand" drifts through the lower half when idle. **Phones get a static red duotone
   photo with a CSS glitch instead** (more readable at that size and lighter on data and battery). The same fallback is
   used for reduced motion, Save-Data, low-memory or low-core devices, or no WebGL. `?static` / `?webgl` force either one.
4. Red ticker · **Latest release (BAD)** · **The Tapes**: horizontal scroll-snap rail of click-to-load
   youtube-nocookie embeds with a slight parallax · **The Hood** roster · **Frames** photos · **Shows** · **The Drop**
   (merch) · **Booking** · footer.

## Performance

- The three.js / r3f chunk (~230 kB gz) is lazy-loaded **only on desktop** with WebGL, and only after the gate.
  Phones never download it. The main bundle is ~78 kB gz.
- YouTube embeds are thumbnails until tapped (no iframe cost on load). The background player's API loads while the gate is up.
- Images are optimized webp files (15–50 kB). Fonts are self-hosted via Fontsource: Anton, JetBrains Mono, and Noto Sans Ethiopic
  (Ethiopic subset only, through `unicode-range`).
- The canvas pauses offscreen, DPR is capped at 1.5, and `prefers-reduced-motion` turns animations off.

## Notes

- The background player is a YouTube embed kept invisible as requested. YouTube's API terms ask for a visible player, so
  if that matters, make `.bg-player` a small visible thumbnail in the mini player.
- Amharic used: ከጎዳና ወደ ጎዳና (tagline, literal "from street to street"), ግባ (enter), አዲስ አበባ, ድሬ ዳዋ, 4 እና 9.
  Have a native speaker confirm the tagline wording.

## Credits and licenses

| Source | License | Used for |
|--------|---------|----------|
| [pmndrs/examples · gpgpu-curl-noise-dof](https://github.com/pmndrs/examples/tree/main/examples/gpgpu-curl-noise-dof) (© 2024 Poimandres) | MIT | Soft round point sprite and depth-fade approach in the hero particle shader. License text: `THIRD_PARTY_LICENSES_pmndrs-examples.txt` |
| Senai Technology site (internal) | — | Project structure, scripts, hooks, screenshot harness |
| "Noisy radiance field / 3DGS portrait" look | — | Inspired by Hugues Bruyère / Bihe Xi posts (no code used) |
| Fonts: Anton, JetBrains Mono, Noto Sans Ethiopic (Fontsource) | SIL OFL 1.1 | Type |

Photos and cover art © GRAND49 / the artists. Music videos are embedded from YouTube (@GRAND49HOOD).

## Press kit

`public/press-kit.pdf` is linked from the Booking section ("Download press kit"). It is built outside this repo in `/workspace/grand49/press-kit` (`node build.mjs`, HTML → PDF via headless Chrome). Stats are dated inside the PDF; rebuild and copy it over when numbers change. Booking email (`booking@grand49.com`) is pending in `build.mjs` until the domain is bought.
