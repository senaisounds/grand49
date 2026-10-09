// Usage: node scripts/abel-check.mjs <baseUrl> <outDir>
import { chromium } from "playwright-core";
const [BASE, OUT] = process.argv.slice(2);
const browser = await chromium.launch({ executablePath: "/usr/bin/google-chrome", headless: true, args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const res = {};
for (const [name, viewport, mobile] of [["mobile-390", { width: 390, height: 844 }, true], ["desktop-1280", { width: 1280, height: 800 }, false]]) {
  const ctx = await browser.newContext({ viewport, deviceScaleFactor: mobile ? 2 : 1, isMobile: mobile, hasTouch: mobile });
  const page = await ctx.newPage();
  const errs = []; page.on("pageerror", (e) => errs.push(e.message));
  await page.goto(BASE, { waitUntil: "load" }); await wait(1200);
  const gate = await page.$(".gate-skip"); if (gate) { mobile ? await gate.tap() : await gate.click(); await wait(800); }
  if (!mobile) await page.mouse.move(2, 2);
  for (const sel of ["#hood", "#booking", ".footer"]) { await page.evaluate((s) => document.querySelector(s).scrollIntoView(), sel); await wait(900); }
  res[name] = await page.evaluate(() => {
    const info = (a) => { const b = a.getBoundingClientRect(); return { text: a.textContent.trim(), href: a.href, target: a.target, w: Math.round(b.width), h: Math.round(b.height), inX: b.left >= 0 && b.right <= innerWidth }; };
    const where = { crew: ".hood-dj", booking: "#booking", footer: ".footer-row" };
    const out = {};
    for (const [k, s] of Object.entries(where)) out[k] = [...document.querySelectorAll(`${s} .credits a`)].map(info);
    out.bookingIg = [...document.querySelectorAll("#booking .booking-ig")].map(info);
    out.dmButtons = [...document.querySelectorAll("a")].filter((a) => /DM|message/i.test(a.textContent)).length;
    return out;
  });
  res[name + "-errors"] = errs;
  await page.evaluate(() => document.querySelector("#booking").scrollIntoView()); await wait(1800);
  await page.locator("#booking").screenshot({ path: `${OUT}/${name}-booking.png` });
  await ctx.close();
}
console.log(JSON.stringify(res));
await browser.close();
