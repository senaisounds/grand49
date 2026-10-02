// ─────────────────────────────────────────────────────────────────────────────
// GRAND49 site content. Everything editable lives in this one file.
// ─────────────────────────────────────────────────────────────────────────────

/** Official manager. While BOOKING_EMAIL is TBD, "DM Abel on Instagram" is the primary booking contact. */
export const MANAGER = {
  name: "Abel",
  handle: "@_abel._b_",
  instagram: "https://www.instagram.com/_abel._b_/",
};

/** Credits shown in the Hood section, booking section and footer. `href` makes the name a link. */
export const CREDITS: { role: string; name: string; href?: string }[] = [
  { role: "Management", name: MANAGER.name, href: MANAGER.instagram },
  { role: "DJ", name: "Senai" },
];

/**
 * BOOKING EMAIL — PLACEHOLDER. Replace with the real address, e.g. "booking@grand49.com".
 * While it still contains "TBD", the site shows it as a placeholder, the primary booking button is
 * "DM Abel on Instagram", and the merch "Notify me" buttons link to Abel's Instagram instead of a mailto link.
 */
export const BOOKING_EMAIL = "booking@ — TBD";
export const BOOKING_READY = !BOOKING_EMAIL.includes("TBD");

export const BRAND = {
  name: "GRAND49 Entertainment",
  hood: "GRAND49 HOOD",
  tagline: "From the Streets to the Streets.",
  /** Amharic touch: literal "from street to street". */
  taglineAm: "ከጎዳና ወደ ጎዳና",
  tag: "4 ena 9",
  tagAm: "4 እና 9",
  city: "Addis Ababa, Ethiopia",
  cityAm: "አዲስ አበባ",
  description:
    "We deliver timebending music for the fans, Subscribe to discover the next wave of Talent from GRAND49 HOOD.",
};

export const LINKS = {
  youtube: "https://www.youtube.com/@GRAND49HOOD",
  youtubeSubscribe: "https://www.youtube.com/@GRAND49HOOD?sub_confirmation=1",
  /** Subscriber count shown on the site (YouTube showed 100K on 2026-10-02). */
  youtubeSubs: "100K",
  /** Spotify artist "GRAND 49". */
  spotify: "https://open.spotify.com/artist/0alunOGvCraapsrUo0INYc",
  /** No confirmed crew Instagram yet. Add the URL here and it appears in the footer. */
  instagram: "",
};

export type Track = {
  id: string; // YouTube video id
  title: string;
  artists: string;
  note?: string; // small label, e.g. view count
  /** Optional local cover image (overrides the YouTube thumbnail in the gallery). */
  cover?: string;
};

/** Order matters: the first track is the featured latest release and the entry-gate song. */
export const TRACKS: Track[] = [
  { id: "uUNr6lHljXM", title: "BAD", artists: "Saint Mosses x Young CJ", note: "1.9M+ views" },
  { id: "WHcpXfO2VAA", title: "ICON", artists: "Saint Mosses x Young CJ x Lil PPCS x Young Sura" },
  {
    id: "miAENmjOq5c",
    title: "HELM AYCHE MATA [4 ena 9]",
    artists: "Saint Mosses x Young CJ",
    cover: "/img/helm-ayche-mata-cover.webp",
  },
  { id: "aTF4j_7xpeA", title: "SPARTAN", artists: "Saint Mosses x Young CJ x Lil PPCS x Botla DP" },
  { id: "MNEmBgMjFN4", title: "GUNSHOT [4 ena 9]", artists: "Saint Mosses x Young CJ" },
];

export const ytThumb = (id: string, q: "hqdefault" | "maxresdefault" = "hqdefault") =>
  `https://i.ytimg.com/vi/${id}/${q}.jpg`;
export const ytWatch = (id: string) => `https://www.youtube.com/watch?v=${id}`;

/** Typographic artist cards (no photos). */
export const ARTISTS = ["Saint Mosses", "Young CJ", "Lil PPCS", "Young Sura", "Botla DP"];

/** Credits per artist, derived from TRACKS (so it stays in sync). */
export const artistTracks = (name: string) =>
  TRACKS.filter((t) => t.artists.toLowerCase().includes(name.toLowerCase())).map((t) => t.title.replace(/\s*\[.*\]/, ""));

export type Show = {
  date: string; // ISO yyyy-mm-dd (used to sort and to mark past shows)
  city: string;
  cityAm?: string;
  venue: string;
  lineup: string;
  presenter?: string;
  flyer?: string; // full flyer image
  flyerThumb?: string;
  tickets?: string; // ticket URL, if any
};

/** Add / edit shows here. Past dates are automatically labelled "Done". */
export const SHOWS: Show[] = [
  {
    date: "2026-10-03",
    city: "Dire Dawa",
    cityAm: "ድሬ ዳዋ",
    venue: "PAPA Garden Resort",
    lineup: "Young CJ x Saint Mosses",
    presenter: "Enqu Events",
    flyer: "/img/flyer-dire-dawa-oct3.webp",
    flyerThumb: "/img/flyer-dire-dawa-oct3-thumb.webp",
  },
];

export type MerchItem = {
  name: string;
  kind: "tee" | "hoodie" | "cap";
  print: string; // text printed on the CSS mockup
  printSub?: string;
  colorway: "black" | "bone" | "red";
  /** Optional product photo. When set it replaces the CSS mockup. */
  image?: string;
};

/** Merch drop. No products or prices exist yet: every item shows "Coming soon / Notify me". */
export const MERCH: MerchItem[] = [
  { name: "GRAND49 Tee", kind: "tee", print: "GRAND49", printSub: "FROM THE STREETS TO THE STREETS", colorway: "black" },
  { name: "4 ena 9 Hoodie", kind: "hoodie", print: "4 እና 9", printSub: "GRAND49 HOOD", colorway: "bone" },
  { name: "GRAND49 Cap", kind: "cap", print: "G49", colorway: "red" },
];

export type Photo = { src: string; alt: string; caption: string; position?: string };

/** Photo slots for the "Frames" gallery. Swap files in /public/img and edit here. */
export const PHOTOS: Photo[] = [
  { src: "/img/crew-suits.webp", alt: "Four GRAND49 members in dark suits, gloves and a trench coat on a dim set", caption: "GRAND49 HOOD", position: "50% 30%" },
  { src: "/img/helm-ayche-mata-cover.webp", alt: "Young CJ and Saint Mosses against a sunset city skyline, HELM AYCHE MATA cover art", caption: "Young CJ x Saint Mosses — HELM AYCHE MATA", position: "50% 40%" },
];

/** Image used for the hero particle portrait and its static fallback (pre-processed b/w, see scripts/optimize-images.mjs). */
export const HERO_IMAGE = "/img/crew-suits-hero.webp";
