// Usage: node scripts/crew-check.mjs <baseUrl> <outDir> <prefix>
import { chromium } from "playwright-core";
const [BASE, OUT, PFX] = process.argv.slice(2);
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
  await page.evaluate(() => document.querySelector("#hood").scrollIntoView()); await wait(400);
  const h = await page.evaluate(() => document.documentElement.scrollHeight);
  await page.evaluate(() => document.querySelector("#hood").scrollIntoView()); await wait(2500);
  res[name] = await page.evaluate(() => [...document.querySelectorAll(".roster-row")].map((r) => {
    const a = r.querySelector(".roster-ig"); const b = a?.getBoundingClientRect();
    return { name: r.querySelector(".roster-name").textContent, ig: a ? { text: a.textContent.trim(), href: a.href, target: a.target, w: Math.round(b.width), h: Math.round(b.height), visible: b.width > 0 && getComputedStyle(a).visibility !== "hidden" && getComputedStyle(r).opacity === "1", inViewportX: b.left >= 0 && b.right <= innerWidth } : null };
  }));
  res[name + "-overflowX"] = await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, innerWidth, offenders: [...document.querySelectorAll("body *")].filter((e) => e.getBoundingClientRect().right > innerWidth + 1 && getComputedStyle(e).position !== "fixed").slice(0, 5).map((e) => e.className || e.tagName) }));
  res[name + "-errors"] = errs;
  await page.locator("#hood").screenshot({ path: `${OUT}/${PFX}${name}-crew.png` });
  await ctx.close();
}
console.log(JSON.stringify(res, null, 1));
await browser.close();
