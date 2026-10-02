// Re-generate the optimized webp images in public/img from the original photos.
// Usage: node scripts/optimize-images.mjs [sourceDir]   (default: ../grand49-inspo)
// Drop new photos in the source dir with the same names (or edit the list below), then run it.
import sharp from "sharp";
import path from "node:path";
import fs from "node:fs";

const SRC = process.argv[2] || path.resolve("../../grand49-inspo");
const OUT = path.resolve("public/img");
fs.mkdirSync(OUT, { recursive: true });

// crew photo: crop the black letterbox bar off the top
const crew = sharp(path.join(SRC, "crew-suits.jpg")).extract({ left: 0, top: 72, width: 480, height: 568 });
await crew.clone().webp({ quality: 78 }).toFile(path.join(OUT, "crew-suits.webp"));

// hero source: b/w, local contrast (CLAHE), vignette that kills the bright backdrop -> noir portrait
{
  const W = 480, H = 568;
  const svg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><defs>
    <radialGradient id="g" cx="50%" cy="55%" r="62%"><stop offset="55%" stop-color="#fff"/><stop offset="100%" stop-color="#000"/></radialGradient>
    <linearGradient id="t" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000"/><stop offset="0.3" stop-color="#fff"/></linearGradient></defs>
    <rect width="100%" height="100%" fill="url(#g)"/><rect width="100%" height="100%" fill="url(#t)" style="mix-blend-mode:multiply"/></svg>`);
  const mask = await sharp(svg).greyscale().raw().toBuffer();
  const img = await crew.clone().greyscale().clahe({ width: 48, height: 48, maxSlope: 4 }).linear(1.25, -30).raw().toBuffer();
  const out = Buffer.alloc(W * H);
  for (let i = 0; i < W * H; i++) out[i] = Math.round(img[i] * Math.pow(mask[i] / 255, 1.2));
  await sharp(out, { raw: { width: W, height: H, channels: 1 } }).webp({ quality: 80 }).toFile(path.join(OUT, "crew-suits-hero.webp"));
}

await sharp(path.join(SRC, "helm-ayche-mata-cover.jpg")).webp({ quality: 78 }).toFile(path.join(OUT, "helm-ayche-mata-cover.webp"));

// flyer: the source is an Instagram screenshot, crop to the square flyer
const flyer = sharp(path.join(SRC, "flyer-dire-dawa-oct3.png")).extract({ left: 0, top: 735, width: 1179, height: 1179 });
await flyer.clone().resize(900).webp({ quality: 76 }).toFile(path.join(OUT, "flyer-dire-dawa-oct3.webp"));
await flyer.clone().resize(320).webp({ quality: 70 }).toFile(path.join(OUT, "flyer-dire-dawa-oct3-thumb.webp"));

for (const f of fs.readdirSync(OUT)) console.log(f, fs.statSync(path.join(OUT, f)).size);
