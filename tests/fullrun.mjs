// Full session: solve all 10 files back to back (using "次の事件へ") with real touch input,
// ending on the results screen. Also exercises the mid-case back confirmation.
import { chromium } from 'playwright-core';
import { mkdirSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const CHROME = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'].find(existsSync);
const ANSWER = { FW: ['okubo', 'ronaldo', 'ibra', 'drogba'], MF: ['nakata', 'endo', 'nakamura'], DF: ['nakazawa', 'maldini'], GK: ['buffon'] };
const problems = [];
mkdirSync('tests/shots/full', { recursive: true });

const browser = await chromium.launch({ executablePath: CHROME });
const ctx = await browser.newContext({ viewport: { width: 375, height: 667 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
const page = await ctx.newPage();
page.on('pageerror', (e) => problems.push(`pageerror: ${e.message}`));
page.on('console', (m) => m.type() === 'error' && problems.push(`console: ${m.text()}`));
const cdp = await ctx.newCDPSession(page);

async function touchDrag(points) {
  const tp = (x, y) => [{ x, y, id: 1, radiusX: 4, radiusY: 4, force: 1 }];
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: tp(...points[0]) });
  for (const p of points.slice(1)) await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: tp(...p) });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
}
const tap = (sel) => page.locator(sel).first().tap();
const tapText = async (t) => {
  try {
    await page.getByRole('button', { name: t }).first().tap({ timeout: 8000 });
  } catch (e) {
    await page.screenshot({ path: 'tests/shots/full/fail.png' });
    throw e;
  }
};

await page.goto(pathToFileURL(resolve('dist/index.html')).href);
await page.waitForTimeout(1500);
await tapText('捜査をはじめる');
await tapText('了解');
await page.locator('.ledger-row').first().tap();

for (let n = 0; n < 10; n++) {
  const kicker = await page.locator('.topbar-title small').textContent();
  await tapText('捜査開始');
  await page.waitForTimeout(400);

  if (n === 0) {
    // Back once mid-case should only warn, not leave.
    await tap('.topbar .icon-btn');
    await page.waitForTimeout(200);
    if (!(await page.locator('.toast').count())) problems.push('back confirmation toast missing');
    if (!(await page.locator('.ruler svg').count())) problems.push('left the case on first back tap');
  }

  // Step 1: drag slider with touch.
  const s = await page.locator('.ruler svg').boundingBox();
  await touchDrag([[s.x + 4, s.y + 50], [s.x + s.width * 0.3, s.y + 50], [s.x + s.width * 0.45, s.y + 50]]);
  await tapText('で決定');
  await page.waitForTimeout(1600);
  await tapText('次の手がかりへ');
  await page.waitForTimeout(400);

  // Step 2: find the right type by trying in order.
  for (const pos of ['FW', 'MF', 'DF', 'GK']) {
    if (await page.locator('.profile-result').count()) break;
    const b = page.locator('.check', { hasText: pos });
    if (await b.isEnabled()) await b.tap();
    await page.waitForTimeout(450);
  }
  await tapText('次の手がかりへ');
  await page.waitForTimeout(500);

  // Step 3: draw with a finger, left to right.
  const c = await page.locator('.chart-svg').boundingBox();
  const pts = [];
  for (let k = 0; k <= 30; k++) pts.push([c.x + 3 + ((c.width - 6) * k) / 30, c.y + c.height * (0.55 - 0.15 * Math.sin((k / 30) * Math.PI))]);
  await touchDrag(pts);
  await page.waitForTimeout(1200); // a tap right after a touch drag is swallowed by Chrome's gesture detector
  const filled = await page.locator('.draw-count').textContent();
  const [a, b] = filled.split('/').map(Number);
  if (a !== b) { console.log(`${kicker}: touch drawing filled ${filled}`); await page.screenshot({ path: 'tests/shots/full/draw-fail.png' }); }
  await tapText('答え合わせ');
  await page.waitForTimeout(2600);
  await tapText('正体に迫る');
  await page.waitForTimeout(300);
  await tap('.bonus-skip');
  await tapText('ファイルを開く');
  await page.waitForTimeout(3600);
  const name = await page.locator('.reveal-name h2').textContent();
  await tapText('数字の物語');
  await page.waitForTimeout(500);
  const next = await page.locator('.actions .btn-primary').textContent();
  console.log(`${kicker} → ${name} | next: ${next.trim()}`);
  await page.locator('.actions .btn-primary').tap();
  await page.waitForTimeout(600);
  if (n === 9) {
    await page.waitForTimeout(2400);
    await page.screenshot({ path: 'tests/shots/full/complete.png' });
    const title = await page.locator('.topbar-title strong').textContent();
    if (title !== '捜査報告書') problems.push(`after 10th case landed on "${title}"`);
  }
}
await browser.close();
if (problems.length) {
  console.log('PROBLEMS:\n' + problems.join('\n'));
  process.exitCode = 1;
} else console.log('OK: full run');
