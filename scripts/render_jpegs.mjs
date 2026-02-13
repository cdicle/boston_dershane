import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { chromium } from "playwright";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

const deliverablesDir = path.join(projectRoot, "deliverables");
fs.mkdirSync(deliverablesDir, { recursive: true });

const indexUrl = `${pathToFileURL(path.join(projectRoot, "index.html")).href}?render=1`;
const posterUrl = `${pathToFileURL(path.join(projectRoot, "poster.html")).href}?render=1`;

async function waitStable(page, url, rootSelector) {
  // Prefer the user's requested networkidle, but fall back to load if it times out.
  await page
    .goto(url, { waitUntil: "networkidle", timeout: 15000 })
    .catch(() => page.goto(url, { waitUntil: "load", timeout: 15000 }));
  await page.waitForSelector(rootSelector);
  await page
    .evaluate(() => {
      const fontsReady = document.fonts ? document.fonts.ready : Promise.resolve();
      return Promise.race([
        fontsReady,
        new Promise((resolve) => setTimeout(resolve, 8000)),
      ]);
    })
    .catch(() => {});
  await page.waitForTimeout(250);
  await page.addStyleTag({
    content: `
      *, *::before, *::after { animation: none !important; transition: none !important; }
      html, body { scrollbar-width: none !important; }
      ::-webkit-scrollbar { width: 0 !important; height: 0 !important; }
    `,
  });
}

const jpegOpts = { type: "jpeg", quality: 90 };

const browser = await chromium.launch();

try {
  // index.html desktop
  {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      reducedMotion: "reduce",
    });
    const page = await context.newPage();
    await waitStable(page, indexUrl, ".hero");
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({
      path: path.join(deliverablesDir, "index_desktop.jpg"),
      fullPage: true,
      ...jpegOpts,
    });
    await context.close();
  }

  // index.html mobile (iPhone-ish)
  {
    const context = await browser.newContext({
      viewport: { width: 430, height: 932 },
      deviceScaleFactor: 3,
      isMobile: true,
      hasTouch: true,
      reducedMotion: "reduce",
    });
    const page = await context.newPage();
    await waitStable(page, indexUrl, ".hero");
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({
      path: path.join(deliverablesDir, "index_mobile.jpg"),
      fullPage: true,
      ...jpegOpts,
    });
    await context.close();
  }

  // poster.html (capture the poster canvas cleanly)
  {
    const context = await browser.newContext({
      viewport: { width: 1200, height: 1600 },
      deviceScaleFactor: 3.125,
      reducedMotion: "reduce",
    });
    const page = await context.newPage();
    await waitStable(page, posterUrl, ".poster");
    await page.locator(".poster").screenshot({
      path: path.join(deliverablesDir, "poster.jpg"),
      ...jpegOpts,
      quality: 95,
    });
    await context.close();
  }

  console.log("Wrote deliverables/index_desktop.jpg, deliverables/index_mobile.jpg, deliverables/poster.jpg");
} finally {
  await browser.close();
}
