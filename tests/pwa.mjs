// PWA manifest / service-worker / offline-shell check against the production build.
// Serves the build under a GitHub Pages-style subpath, so relative PWA URLs are verified.
// Starts its own static server, so no preview process is required.
// Usage: npm test (or node tests/pwa.mjs after npm run build)
import { chromium } from 'playwright-core';
import { existsSync, mkdirSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname, join, normalize, resolve, sep } from 'node:path';

const CHROME = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
].find(existsSync);
const SHOTS = 'tests/shots/pwa';
const DIST = resolve('dist');
const BASE = '/soccer_stats/';
mkdirSync(SHOTS, { recursive: true });

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

const server = createServer(async (request, response) => {
  try {
    let pathname = decodeURIComponent(new URL(request.url ?? '/', 'http://local').pathname);
    if (!pathname.startsWith(BASE)) {
      response.statusCode = 404;
      response.end('Not found');
      return;
    }
    pathname = pathname.slice(BASE.length);
    if (!pathname || pathname.endsWith('/')) pathname += 'index.html';
    const file = normalize(join(DIST, pathname));
    if (file !== DIST && !file.startsWith(DIST + sep)) {
      response.statusCode = 403;
      response.end('Forbidden');
      return;
    }
    const data = await readFile(file);
    response.setHeader('Content-Type', MIME[extname(file)] ?? 'application/octet-stream');
    response.end(data);
  } catch {
    response.statusCode = 404;
    response.end('Not found');
  }
});
await new Promise((resolveListen) => server.listen(0, '127.0.0.1', resolveListen));
const address = server.address();
const origin = `http://127.0.0.1:${address.port}`;
const appUrl = `${origin}${BASE}`;

const browser = await chromium.launch({ executablePath: CHROME });
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
});
const page = await context.newPage();
const errors = [];
page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`));
page.on('console', (message) => {
  if (message.type() === 'error') errors.push(`console: ${message.text()}`);
});

try {
  await page.goto(appUrl, { waitUntil: 'networkidle' });
  const manifestHref = await page.getAttribute('link[rel="manifest"]', 'href');
  if (!manifestHref) throw new Error('Manifest link missing');
  const manifest = await page.evaluate(async (href) => {
    const response = await fetch(href);
    if (!response.ok) throw new Error(`manifest HTTP ${response.status}`);
    return response.json();
  }, new URL(manifestHref, page.url()).href);
  if (manifest.display !== 'standalone' || manifest.icons?.length !== 3) {
    throw new Error(`Unexpected manifest: ${JSON.stringify(manifest)}`);
  }

  const sw = await page.evaluate(async () => {
    if (!('serviceWorker' in navigator)) return null;
    const registration = await Promise.race([
      navigator.serviceWorker.ready,
      new Promise((resolveReady) => setTimeout(() => resolveReady(null), 8000)),
    ]);
    if (!registration) return null;
    return { scope: registration.scope, state: registration.active?.state ?? null };
  });
  if (!sw || sw.state !== 'activated') {
    throw new Error(`Service worker not activated: ${JSON.stringify(sw)}`);
  }
  if (!sw.scope.endsWith(BASE)) {
    throw new Error(`Service worker scope escaped the deploy subpath: ${sw.scope}`);
  }
  await page.waitForTimeout(400);

  await context.setOffline(true);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(900);
  const body = await page.locator('body').innerText();
  if (!body.includes('この数字、だれ？')) {
    throw new Error(`Offline reload did not render the app:\n${body.slice(0, 800)}`);
  }
  const cachedPhotos = await page.evaluate(async () => {
    const names = ['endo', 'nakamura', 'nakata', 'ono', 'inamoto', 'kengo'];
    return Promise.all(
      names.map(async (name) => {
        try {
          const response = await fetch(`./players/${name}.jpg`);
          return response.ok && (await response.blob()).size > 1000;
        } catch {
          return false;
        }
      }),
    );
  });
  if (cachedPhotos.some((ok) => !ok)) {
    throw new Error(`Offline photo cache missing: ${JSON.stringify(cachedPhotos)}`);
  }
  await page.screenshot({ path: `${SHOTS}/01-offline-title.png` });
  await context.setOffline(false);

  const fatal = errors.filter(
    (line) => !line.includes('ERR_INTERNET_DISCONNECTED') && !line.includes('Failed to fetch'),
  );
  if (fatal.length) throw new Error(`Console/page errors:\n${fatal.join('\n')}`);
  console.log('PWA manifest + service worker + offline shell OK (/soccer_stats/ subpath)');
} finally {
  await context.setOffline(false).catch(() => undefined);
  await browser.close();
  await new Promise((resolveClose) => server.close(resolveClose));
}
