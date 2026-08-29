/**
 * Regenerate the README screenshots. Needs the app running (default :3100).
 *
 *   npm run dev -- -p 3100        # in one terminal
 *   npm run shots                 # in another
 *
 * BASE_URL and MODERATION_TOKEN can override the defaults.
 */
import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";

const BASE = process.env.BASE_URL || "http://localhost:3100";
const TOKEN = process.env.MODERATION_TOKEN || "dev-moderator-token";
const OUT = "docs/screenshots";
const WIDE = { width: 1280, height: 860 };
// tall enough to show a representative slice, without an endless full-page grab
const TALL = { width: 1280, height: 1500 };

await mkdir(OUT, { recursive: true });
const browser = await chromium.launch();

async function shoot(name, path, { viewport = TALL, scheme = "light", token } = {}) {
  const ctx = await browser.newContext({
    viewport,
    deviceScaleFactor: 2,
    colorScheme: scheme,
  });
  if (token) await ctx.addCookies([{ name: "khoj_mod", value: token, url: BASE }]);
  const page = await ctx.newPage();
  await page.goto(BASE + path, { waitUntil: "networkidle" });
  await page.waitForTimeout(700);
  await page.screenshot({ path: `${OUT}/${name}.png` });
  await ctx.close();
  console.log("✓", name);
}

await shoot("home", "/", { viewport: WIDE });
await shoot("home-dark", "/", { viewport: WIDE, scheme: "dark" });
await shoot("updates", "/updates");
await shoot("official", "/official");
await shoot("search", "/persons?q=shrestha");
await shoot("moderation", "/moderation", { token: TOKEN });

// Record detail — resolve the first result link, then shoot that page.
{
  const ctx = await browser.newContext({ viewport: TALL, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/persons?q=shrestha`, { waitUntil: "networkidle" });
  const href = await page
    .locator('a[href^="/persons/"]')
    .first()
    .getAttribute("href");
  if (href) {
    await page.goto(BASE + href, { waitUntil: "networkidle" });
    await page.waitForTimeout(500);
    await page.screenshot({ path: `${OUT}/record.png` });
    console.log("✓ record");
  }
  await ctx.close();
}

await browser.close();
console.log(`\nSaved to ${OUT}/`);
