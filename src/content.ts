// ─────────────────────────────────────────────────────────────────────────────
// GRAND49 site content. Everything editable lives in this one file.
// ─────────────────────────────────────────────────────────────────────────────

/** Credits shown in the Hood section, booking section and footer. Add `href` to make a name a link. */
export const CREDITS: { role: string; name: string; href?: string }[] = [
  { role: "Management", name: "Abel", href: "https://www.instagram.com/_abel._b_/" },
  { role: "DJ", name: "Senai" },
];

/**
 * EMAIL DOMAIN — not chosen yet. Set it (e.g. "grand49.com") once the domain is bought and the
 * mailbox/forwarding is set up, and the site switches on its own:
 *   - BOOKING_EMAIL becomes "booking@<domain>"
 *   - the booking CTA becomes a mailto: button
 *   - the merch "Notify me" buttons become mailto: links (until then they point at the YouTube subscribe link)
 */
export const EMAIL_DOMAIN = "grand49.com";
export const BOOKING_READY = EMAIL_DOMAIN.length > 0;
export const BOOKING_EMAIL = BOOKING_READY ? `booking@${EMAIL_DOMAIN}` : "booking@ — TBD";

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
  spotify: "https://open.spotify.com/artist/3j0PUJY6CK9db5HLNozFwa",
  helmPresave: "https://distrokid.com/hyperfollow/grand49/helm-ayche-mata-feat-saint-mosses--young-cj",
  /** One-page-ish EPK (A4, 2 pages). Source + builder: /workspace/grand49/press-kit (node build.mjs), then copy to public/press-kit.pdf. */
  pressKit: "/press-kit.pdf",
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

/** Official members only (typographic roster, booking line). Guest features stay credited on their tracks in TRACKS. */
export const ARTISTS = ["Saint Mosses", "Young CJ", "Lil PPCS"];

/** Personal Instagram per member. Members without a confirmed account are simply left out (no link is shown). */
export const ARTIST_INSTAGRAM: Partial<Record<string, string>> = {
  "Saint Mosses": "https://www.instagram.com/saint_mosses/",
  "Young CJ": "https://www.instagram.com/yfccj_6/",
  "Lil PPCS": "https://www.instagram.com/lil_ppcs/",
};

/** "@handle" from an Instagram profile URL. */
export const igHandle = (url: string) => "@" + url.replace(/\/+$/, "").split("/").pop();

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

export type MerchKind = "cap" | "beanie" | "tee" | "longsleeve" | "hoodie";

export type MerchItem = {
  id: string;
  name: string;
  kind: MerchKind;
  colorway: "black" | "white";
  front: string;
  back?: string;
  /** White studio plate (do not treat the photo as a cutout). */
  studio?: boolean;
};

export const MERCH_COLLECTION = "ARAT ENA ZETENG";
export const MERCH_COLLECTION_AM = "አራት እና ዘጠኝ";
export const MERCH_TAGLINE = "We ask for forgiveness, not permission · Addis Ababa, 49";
export const MERCH_EMAIL = "info@grand49.com";
export const MERCH_ORDER_HREF =
  `mailto:${MERCH_EMAIL}?subject=${encodeURIComponent("GRAND 49 Merch Order")}`;

/** ARAT ENA ZETENG collection. No prices — order / inquire by email. */
export const MERCH: MerchItem[] = [
  { id: "cap", name: "Black Snapback", kind: "cap", colorway: "black", front: "/img/merch/cap-front.webp", back: "/img/merch/cap-back.webp" },
  { id: "beanie", name: "Black Beanie", kind: "beanie", colorway: "black", front: "/img/merch/beanie.webp" },
  { id: "tee-white", name: "White Tee", kind: "tee", colorway: "white", front: "/img/merch/tee-white-front.webp", back: "/img/merch/tee-white-back.webp", studio: true },
  { id: "tee-black", name: "Black Tee", kind: "tee", colorway: "black", front: "/img/merch/tee-black-front.webp", back: "/img/merch/tee-black-back.webp" },
  { id: "ls-white", name: "White Long Sleeve", kind: "longsleeve", colorway: "white", front: "/img/merch/ls-white-front.webp", back: "/img/merch/ls-white-back.webp", studio: true },
  { id: "hoodie-black", name: "Black Hoodie", kind: "hoodie", colorway: "black", front: "/img/merch/hoodie-black-front.webp", back: "/img/merch/hoodie-black-back.webp" },
];

export type Photo = { src: string; alt: string; caption: string; position?: string };

/** Photo slots for the "Frames" gallery. Swap files in /public/img and edit here. */
export const PHOTOS: Photo[] = [
  { src: "/img/crew-suits.webp", alt: "Three GRAND49 members in dark suits and gloves on a dim set", caption: "GRAND49 HOOD", position: "50% 28%" },
  { src: "/img/helm-ayche-mata-cover.webp", alt: "Young CJ and Saint Mosses against a sunset city skyline, HELM AYCHE MATA cover art", caption: "Young CJ x Saint Mosses — HELM AYCHE MATA", position: "50% 40%" },
];

/** Image used for the hero particle portrait and its static fallback (pre-processed b/w, see scripts/optimize-images.mjs). */
export const HERO_IMAGE = "/img/crew-suits-hero.webp";
