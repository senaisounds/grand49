// Headless QA + screenshots via playwright-core + system Chrome with SwiftShader WebGL.
// Usage: node scripts/screenshots.mjs [baseUrl] [outDir]
import { chromium } from "playwright-core";
import fs from "node:fs";

const BASE = process.argv[2] || "http://localhost:5174/";
const OUT = (process.argv[3] || new URL("../screenshots/", import.meta.url).pathname).replace(/\/?$/, "/");
fs.mkdirSync(OUT, { recursive: true });
const executablePath = process.env.CHROME_PATH || "/usr/bin/google-chrome";
const browser = await chromium.launch({
  executablePath,
  headless: true,
  args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist", "--autoplay-policy=no-user-gesture-required"],
});
const logs = [];
const report = {};
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const withQ = (q) => BASE + (BASE.includes("?") ? "&" : "?") + q;

async function run(name, viewport, mobile) {
  const ctx = await browser.newContext({ viewport, deviceScaleFactor: mobile ? 2 : 1, isMobile: mobile, hasTouch: mobile });
  const page = await ctx.newPage();
  // only log messages from our own origin (the YouTube iframes log their own noise)
  page.on("console", (m) => {
    if (!["error", "warning"].includes(m.type())) return;
    const src = m.location()?.url || "";
    if (src && !src.startsWith(new URL(BASE).origin)) return;
    if (/youtube|ytimg|googlevideo/.test(src + m.text()) && !src.startsWith(new URL(BASE).origin)) return;
    logs.push(`[${name}] ${m.type()}: ${m.text()} ${src}`);
  });
  page.on("pageerror", (e) => logs.push(`[${name}] pageerror: ${e.message}`));
  page.on("requestfailed", (r) => { const u = r.url(); if (!/googlevideo|doubleclick|youtube(-nocookie)?\.com\/(api|generate_204|ptracking)|ggpht|play\.google|googleads/.test(u)) logs.push(`[${name}] requestfailed: ${u} ${r.failure()?.errorText}`); });
  await page.goto(BASE, { waitUntil: "load" });
  await wait(1500);
  await page.screenshot({ path: `${OUT}${name}-0-gate.png` });
  // enter with sound
  await page.click(".gate-enter");
  await wait(1200);
  if (!mobile) await page.mouse.move(viewport.width * 0.7, viewport.height * 0.45);
  for (let i = 0; i < 20 && !mobile; i++) { await page.mouse.move(viewport.width * (0.55 + i * 0.012), viewport.height * (0.35 + Math.sin(i / 3) * 0.1)); await wait(40); }
  await wait(3500);
  await page.screenshot({ path: `${OUT}${name}-1-hero.png` });
  const player = await page.evaluate(() => ({
    bgIframe: !!document.querySelector(".bg-player iframe"),
    miniText: document.querySelector(".mini")?.textContent,
    glOn: document.querySelector(".hero")?.classList.contains("gl-on"),
  }));
  // scroll through the whole page to trigger reveals + lazy images, and scroll the video rail
  const h = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < h; y += viewport.height * 0.6) { await page.evaluate((y) => window.scrollTo(0, y), y); await wait(180); }
  await page.evaluate(async () => {
    const r = document.querySelector(".rail");
    r.scrollIntoView({ block: "center" });
    for (const card of r.querySelectorAll(".tape")) { r.scrollLeft = card.offsetLeft - 20; await new Promise((res) => setTimeout(res, 450)); }
    r.scrollLeft = 0;
  });
  await wait(1500);
  const thumbs = await page.evaluate(() => [...document.querySelectorAll("img[data-yt]")].map((i) => ({ id: i.dataset.yt, src: i.currentSrc, ok: i.complete && i.naturalWidth > 0, w: i.naturalWidth })));
  // section shots
  for (const sel of ["#music", ".tapes", "#hood", ".frames", "#shows", "#drop", "#booking"]) {
    const y = await page.evaluate((s) => document.querySelector(s).getBoundingClientRect().top + window.scrollY, sel);
    await page.evaluate((y) => window.scrollTo(0, y - 10), y);
    await wait(700);
    await page.screenshot({ path: `${OUT}${name}-sec-${sel.replace(/[#.]/g, "")}.png` });
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  await wait(1500);
  if (!mobile) await page.screenshot({ path: `${OUT}${name}-full.png`, fullPage: true });
  else {
    // a 2x full-page capture of a long phone page exceeds Chrome's max texture size, so use 1x here
    const c1 = await browser.newContext({ viewport, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
    const p1 = await c1.newPage();
    await p1.goto(withQ("nogate"), { waitUntil: "load" });
    const h1 = await p1.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y < h1; y += viewport.height * 0.6) { await p1.evaluate((y) => window.scrollTo(0, y), y); await wait(150); }
    await p1.evaluate(() => window.scrollTo(0, 0));
    await wait(1500);
    await p1.screenshot({ path: `${OUT}${name}-full.png`, fullPage: true });
    await c1.close();
  }
  // test: gallery embed pauses background music
  await page.evaluate(() => document.querySelector(".tapes").scrollIntoView());
  await wait(500);
  await page.click(".tape .lite-btn");
  await wait(1500);
  const afterEmbed = await page.evaluate(() => ({ embed: !!document.querySelector(".tape .lite iframe"), mini: document.querySelector(".mini")?.textContent }));
  report[name] = { player, thumbs, afterEmbed };
  await ctx.close();
}

await run("desktop-1280", { width: 1280, height: 800 }, false);
await run("mobile-390", { width: 390, height: 844 }, true);
await browser.close();
fs.writeFileSync(OUT + "console.log", logs.join("\n") + "\n");
fs.writeFileSync(OUT + "qa.json", JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
console.log(logs.length ? logs.join("\n") : "no console errors/warnings");
