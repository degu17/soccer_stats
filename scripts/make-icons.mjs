import { chromium } from 'playwright-core';
import { existsSync, mkdirSync } from 'node:fs';

const CHROME = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
].find(existsSync);
mkdirSync('public/icons', { recursive: true });

const browser = await chromium.launch({ executablePath: CHROME });

function iconSvg(size, padding = 0) {
  const inner = size - padding * 2;
  const scale = inner / 512;
  return `<!doctype html><html><head><meta charset="utf-8"><style>
    *{box-sizing:border-box}html,body{margin:0;width:${size}px;height:${size}px;overflow:hidden;background:#efe8da}
    svg{display:block;width:${size}px;height:${size}px}
  </style></head><body>
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
    <rect width="512" height="512" fill="#efe8da"/>
    <g transform="translate(${padding} ${padding}) scale(${scale})">
      <g opacity="0.13" fill="#1a1714">
        ${Array.from({ length: 9 }, (_, row) =>
          Array.from({ length: 9 }, (_, col) =>
            `<circle cx="${34 + col * 55.5}" cy="${34 + row * 55.5}" r="${1.4 + ((row + col) % 3) * 0.55}"/>`
          ).join('')
        ).join('')}
      </g>
      <circle cx="226" cy="222" r="122" fill="none" stroke="#1a1714" stroke-width="46"/>
      <circle cx="226" cy="222" r="91" fill="none" stroke="#1a1714" stroke-width="3" opacity="0.32"/>
      <path d="M313 312 L414 413" stroke="#d93a1e" stroke-width="54" stroke-linecap="round"/>
      <path d="M313 312 L414 413" stroke="#efe8da" stroke-width="9" stroke-linecap="round" opacity="0.18"/>
      <text x="226" y="260" text-anchor="middle" font-family="Arial Black, sans-serif" font-size="122" font-weight="900" fill="#d93a1e">?</text>
      <rect x="22" y="22" width="468" height="468" fill="none" stroke="#1a1714" stroke-width="4" opacity="0.18"/>
    </g>
  </svg></body></html>`;
}

for (const [name, size, padding] of [
  ['icon-192.png', 192, 0],
  ['icon-512.png', 512, 0],
  ['icon-maskable-512.png', 512, 58],
]) {
  const page = await browser.newPage({ viewport: { width: size, height: size }, deviceScaleFactor: 1 });
  await page.setContent(iconSvg(size, padding), { waitUntil: 'load' });
  await page.screenshot({ path: `public/icons/${name}`, omitBackground: false });
  await page.close();
  console.log('wrote', name);
}

await browser.close();
