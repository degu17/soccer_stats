// End-to-end playtest: drives the built game in system Chrome at several phone sizes,
// plays a full case, screenshots every screen and fails on overflow / console errors.
// Usage: npm run build && node tests/playtest.mjs [viewportName] [playerId]
import { chromium } from 'playwright-core';
import { mkdirSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const CHROME = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
].find(existsSync);

const VIEWPORTS = {
  se: { width: 360, height: 640, mobile: true },
  iphone8: { width: 375, height: 667, mobile: true },
  iphone14: { width: 390, height: 844, mobile: true },
  pixel: { width: 412, height: 915, mobile: true },
  short: { width: 360, height: 560, mobile: true },
  desktop: { width: 1280, height: 800, mobile: false },
};

const only = process.argv[2];
const playerId = process.argv[3] ?? 'okubo';
const url = pathToFileURL(resolve('dist/index.html')).href;
const problems = [];

async function checkFit(page, label) {
  const issues = await page.evaluate(() => {
    const stage = document.querySelector('.stage').getBoundingClientRect();
    const out = [];
    const screen = document.querySelector('.screen');
    if (screen && screen.scrollHeight > screen.clientHeight + 1) out.push(`screen scrolls (${screen.scrollHeight} > ${screen.clientHeight})`);
    // Content squeezed out of its flex area (it would overlap the buttons below).
    for (const g of document.querySelectorAll('.screen > .grow')) {
      if (g.scrollHeight > g.clientHeight + 2) out.push(`${[...g.classList].join('.')} overflows its area by ${g.scrollHeight - g.clientHeight}px`);
    }
    for (const el of document.querySelectorAll('.screen *')) {
      if (el.closest('svg') && el.tagName !== 'svg') continue;
      const st = getComputedStyle(el);
      if (st.display === 'none' || st.visibility === 'hidden' || st.position === 'fixed') continue;
      if (el.closest('.hint-bubble,.toast,.finger-hint')) continue;
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) continue;
      if (r.bottom > stage.bottom + 1 || r.right > stage.right + 1 || r.left < stage.left - 1 || r.top < stage.top - 1) {
        out.push(`${el.tagName.toLowerCase()}.${[...el.classList].join('.')} out of stage (b=${Math.round(r.bottom)} vs ${Math.round(stage.bottom)})`);
      }
      // Text clipped horizontally inside its own box.
      if (el.children.length === 0 && el.textContent.trim() && el.scrollWidth > el.clientWidth + 2 && st.overflow !== 'visible' && st.textOverflow !== 'ellipsis') {
        out.push(`text clipped: "${el.textContent.trim().slice(0, 20)}"`);
      }
    }
    return [...new Set(out)].slice(0, 8);
  });
  if (issues.length) problems.push(`[${label}] ${issues.join(' | ')}`);
}

async function shot(page, dir, name) {
  await page.waitForTimeout(650);
  await checkFit(page, `${dir}/${name}`);
  await page.screenshot({ path: `tests/shots/${dir}/${name}.png` });
}

const click = (page, name) => page.getByRole('button', { name, exact: false }).first().click({ timeout: 8000 });

async function run(vpName) {
  const vp = VIEWPORTS[vpName];
  mkdirSync(`tests/shots/${vpName}`, { recursive: true });
  const browser = await chromium.launch({ executablePath: CHROME });
  const ctx = await browser.newContext({
    viewport: { width: vp.width, height: vp.height },
    deviceScaleFactor: 2,
    isMobile: vp.mobile,
    hasTouch: vp.mobile,
  });
  const page = await ctx.newPage();
  page.on('console', (m) => m.type() === 'error' && problems.push(`[${vpName}] console: ${m.text()}`));
  page.on('pageerror', (e) => problems.push(`[${vpName}] pageerror: ${e.message}`));
  await page.goto(url);
  await page.waitForTimeout(2500); // title animation + web fonts
  await shot(page, vpName, '01-title');

  await click(page, '捜査をはじめる');
  await shot(page, vpName, '02-howto');
  await click(page, '了解');
  await shot(page, vpName, '03-board');

  const file = await page.evaluate((id) => {
    const order = ['okubo', 'buffon', 'nakata', 'ronaldo', 'nakazawa', 'ibra', 'endo', 'drogba', 'nakamura', 'maldini'];
    return order.indexOf(id);
  }, playerId);
  await page.locator('.ledger-row').nth(file).click();
  await shot(page, vpName, '04-intro');
  await click(page, '捜査開始');
  await page.waitForTimeout(500);
  await shot(page, vpName, '05-estimate');

  // Drag the slider to ~60%.
  const slider = await page.locator('.ruler svg').boundingBox();
  await page.mouse.move(slider.x + 5, slider.y + slider.height / 2);
  await page.mouse.down();
  await page.mouse.move(slider.x + slider.width * 0.6, slider.y + slider.height / 2, { steps: 8 });
  await page.mouse.up();
  await shot(page, vpName, '06-estimate-moved');
  await click(page, 'で決定');
  await page.waitForTimeout(1800);
  await shot(page, vpName, '07-estimate-result');
  await click(page, '次の手がかりへ');
  await page.waitForTimeout(500);
  await shot(page, vpName, '08-profile');

  // One wrong answer first (to exercise the hint), then the right one.
  const pos = await page.evaluate(() => document.querySelector('.topbar-title small')?.textContent);
  const answer = { okubo: 'FW', buffon: 'GK', nakata: 'MF', ronaldo: 'FW', nakazawa: 'DF', ibra: 'FW', endo: 'MF', drogba: 'FW', nakamura: 'MF', maldini: 'DF' }[playerId];
  const wrong = answer === 'GK' ? 'FW' : 'GK';
  await page.locator('.check', { hasText: wrong }).click();
  await page.waitForTimeout(500);
  await shot(page, vpName, '09-profile-wrong');
  await page.locator('.check', { hasText: answer }).click();
  await page.waitForTimeout(700);
  await shot(page, vpName, '10-profile-right');
  await click(page, '次の手がかりへ');
  await page.waitForTimeout(600);
  await shot(page, vpName, '11-draw');

  // Sweep a wavy line across the chart.
  const chart = await page.locator('.chart-svg').boundingBox();
  const y0 = chart.y + chart.height * 0.75;
  await page.mouse.move(chart.x + 2, y0);
  await page.mouse.down();
  for (let k = 0; k <= 40; k++) {
    const x = chart.x + 2 + ((chart.width - 4) * k) / 40;
    const y = chart.y + chart.height * (0.62 - 0.22 * Math.sin((k / 40) * Math.PI));
    await page.mouse.move(x, y, { steps: 2 });
  }
  await page.mouse.up();
  await shot(page, vpName, '12-draw-done');
  await click(page, '答え合わせ');
  await page.waitForTimeout(2900);
  await shot(page, vpName, '13-draw-compare');
  await click(page, '正体に迫る');
  await page.waitForTimeout(500);
  await shot(page, vpName, '14-bonus');
  await page.locator('.suspect').first().click();
  await page.waitForTimeout(400);
  await shot(page, vpName, '15-bonus-picked');
  await click(page, 'ファイルを開く');
  await page.waitForTimeout(4200);
  await shot(page, vpName, '16-reveal');
  await click(page, '数字の物語');
  await page.waitForTimeout(900);
  await shot(page, vpName, '17-story');

  // Board with one solved file, glossary, credits.
  await page.locator('.topbar .icon-btn').first().click();
  await page.waitForTimeout(400);
  await shot(page, vpName, '18-board-progress');
  await page.locator('.topbar .icon-btn').first().click();
  await page.waitForTimeout(300);
  await click(page, '用語ノート');
  await page.waitForTimeout(400);
  await shot(page, vpName, '19-glossary');
  await page.locator('.topbar .icon-btn').first().click();
  await click(page, 'クレジット');
  await page.waitForTimeout(300);
  await shot(page, vpName, '20-credits');

  // Completion screen: fake a save where every case is solved.
  await page.evaluate(() => {
    const ids = ['okubo', 'buffon', 'nakata', 'ronaldo', 'nakazawa', 'ibra', 'endo', 'drogba', 'nakamura', 'maldini'];
    const results = Object.fromEntries(ids.map((id, i) => [id, { best: 180 + i * 15, bestRank: i > 6 ? 'A' : 'B', last: { estimate: 80, profile: 100, draw: 60, bonus: 0 }, plays: 1 }]));
    localStorage.setItem('stats-detective/v1', JSON.stringify({ v: 1, results, tutorialSeen: true, sound: true, terms: [] }));
  });
  await page.reload();
  await page.waitForTimeout(800);
  await shot(page, vpName, '21-title-progress');
  await click(page, '捜査を続ける');
  await page.waitForTimeout(400);
  await shot(page, vpName, '22-board-all');
  await page.locator('.ledger-total').click();
  await page.waitForTimeout(2600);
  await shot(page, vpName, '23-complete');
  void pos;
  await browser.close();
}

const names = only && only !== 'all' ? [only] : Object.keys(VIEWPORTS);
for (const n of names) {
  try {
    await run(n);
  } catch (e) {
    problems.push(`[${n}] FAILED: ${e.message.split('\n')[0]}`);
  }
}
if (problems.length) {
  console.log('PROBLEMS:\n' + problems.join('\n'));
  process.exitCode = 1;
} else console.log(`OK: ${names.join(', ')}`);
