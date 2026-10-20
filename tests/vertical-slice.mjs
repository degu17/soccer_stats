// End-to-end vertical slice against the single-file production build.
// Usage: npm test
import { chromium } from 'playwright-core';
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const CHROME = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
].find(existsSync);
const URL = pathToFileURL(resolve('dist/index.html')).href;

for (const file of [
  'dist/index.html',
  'dist/manifest.webmanifest',
  'dist/sw.js',
  'dist/icons/icon-192.png',
  'dist/icons/icon-512.png',
  'dist/icons/icon-maskable-512.png',
  'dist/players/endo.jpg',
  'dist/players/nakamura.jpg',
  'dist/players/nakata.jpg',
  'dist/players/ono.jpg',
  'dist/players/inamoto.jpg',
  'dist/players/kengo.jpg',
]) {
  if (!existsSync(file)) throw new Error(`Missing production asset: ${file}`);
}
const manifest = JSON.parse(readFileSync('dist/manifest.webmanifest', 'utf8'));
if (manifest.display !== 'standalone' || manifest.icons?.length !== 3) {
  throw new Error('PWA manifest is incomplete');
}
if (!readFileSync('dist/index.html', 'utf8').includes('manifest.webmanifest')) {
  throw new Error('Built index.html does not link the PWA manifest');
}
const SHOTS = 'tests/shots/vertical-slice';
mkdirSync(SHOTS, { recursive: true });

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

const shot = async (name) => {
  await page.waitForTimeout(140);
  await page.screenshot({ path: `${SHOTS}/${name}.png` });
};
const button = (pattern) => page.getByRole('button', { name: pattern });
const body = async () => page.locator('body').innerText();
const wait = (ms) => page.waitForTimeout(ms);

async function checkLayout(label) {
  const issues = await page.evaluate(() => {
    const stage = document.querySelector('.stage')?.getBoundingClientRect();
    if (!stage) return ['missing .stage'];
    const out = [];
    if (document.documentElement.scrollWidth > window.innerWidth + 1) {
      out.push(`document horizontal overflow (${document.documentElement.scrollWidth} > ${window.innerWidth})`);
    }
    for (const el of document.querySelectorAll('.screen *')) {
      if (el.closest('svg')) continue;
      if (el.closest('.toast, .dx-modal-backdrop')) continue;
      const style = getComputedStyle(el);
      if (style.display === 'none' || style.visibility === 'hidden') continue;
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) continue;
      if (rect.left < stage.left - 2 || rect.right > stage.right + 2) {
        out.push(`horizontal: ${el.tagName.toLowerCase()}.${String(el.className)}`);
      }
      if (el.closest('.dx-scroll, .dx-title-main')) continue;
      if (rect.top < stage.top - 2 || rect.bottom > stage.bottom + 2) {
        out.push(`vertical: ${el.tagName.toLowerCase()}.${String(el.className)}`);
      }
    }
    return [...new Set(out)].slice(0, 12);
  });
  if (issues.length) throw new Error(`${label} layout issues:\n${issues.join('\n')}`);
}

async function buyClue(title) {
  await button(/手がかりを選ぶ/).click();
  await wait(180);
  await page.locator('.dx-clue').filter({ hasText: title }).locator('.dx-buy').click();
  await wait(180);
  await page.locator('.dx-modal').getByRole('button', { name: /^買う/ }).click();
  await wait(220);
  await page.locator('.dx-modal').getByRole('button', { name: /捜査に戻る/ }).click();
  await wait(180);
}

async function accuse(name, evidenceTitles) {
  await button(/告発する/).click();
  await wait(200);
  await page.locator('.dx-pick').filter({ hasText: name }).click();
  for (const title of evidenceTitles) {
    await page.locator('.dx-evidence-card').filter({ hasText: title }).click();
  }
  await wait(120);
  await button(/この証拠で告発する/).click();
  await wait(180);
  await page.locator('.dx-modal').getByRole('button', { name: /^告発する/ }).click();
  await wait(220);
}

async function finishCase(expectedScore) {
  await wait(2200);
  await button(/捜査報告書へ/).click();
  await wait(1900);
  const resultText = await body();
  if (!resultText.includes(`${expectedScore}/100`)) {
    throw new Error(`Expected score ${expectedScore}, got:\n${resultText.slice(0, 900)}`);
  }
}

await page.goto(URL, { waitUntil: 'networkidle' });
await page.evaluate(() => localStorage.clear());
await page.reload({ waitUntil: 'networkidle' });
await checkLayout('title');
await shot('01-title');

// Tutorial: guided c1 + c3.
await page.getByText('チュートリアルを始める', { exact: true }).click();
await wait(250);
await checkLayout('tutorial intro');
await button(/チュートリアルを始める/).click();
await wait(250);
await checkLayout('tutorial investigate');
await buyClue('海外キャリア');
await buyClue('リーグ通算得点');
await accuse('遠藤 保仁', ['海外キャリア', 'リーグ通算得点']);
await finishCase(90);
await shot('02-tutorial-result');

// FILE 001: c1 + c7, optimal 93.
await button(/次の事件へ/).click();
await wait(300);
await checkLayout('file 001 intro');
await button(/捜査を開始する/).click();
await wait(220);
await buyClue('海外キャリア');
await buyClue('最終シーズン');
await accuse('遠藤 保仁', ['海外キャリア', '最終シーズン']);
await finishCase(93);
await shot('03-file001-result');

// FILE 002: c7 + c4, 3pt, 90.
await button(/次の事件へ/).click();
await wait(300);
await checkLayout('file 002 intro');
await button(/捜査を開始する/).click();
await wait(220);
await buyClue('所属クラブ数');
await buyClue('最終シーズン');
await accuse('中村 俊輔', ['所属クラブ数', '最終シーズン']);
await finishCase(90);
await shot('04-file002-result');

// The all-clear ledger and home state.
await button(/事件ファイルへ/).click();
await wait(350);
await checkLayout('all-clear ledger');
await shot('05-board');
const ledger = await body();
if (!ledger.includes('3/3') || !ledger.includes('ALL CLEAR')) {
  throw new Error(`Ledger missing all-clear state:\n${ledger.slice(0, 900)}`);
}
if (!ledger.includes('4/4') || !ledger.includes('実績')) {
  throw new Error(`Ledger missing achievement state:\n${ledger.slice(0, 900)}`);
}
if ((await page.locator('.dx-ach.is-on').count()) !== 4) {
  throw new Error('Not all achievements are unlocked');
}
await page.locator('.topbar .icon-btn').first().click();
await wait(250);
const home = await body();
if (!home.includes('全事件、解決。')) throw new Error('Home did not reach all-clear state');
if (await page.locator('.dx-resume-card').count()) {
  throw new Error('All-clear home still shows a continue card');
}
await shot('06-title-all-clear');

// Narrow support at 375×667.
await page.setViewportSize({ width: 375, height: 667 });
await wait(250);
await checkLayout('title 375x667');
await shot('07-title-375');
await page.getByText('事件ファイル', { exact: true }).first().click();
await wait(300);
await checkLayout('ledger 375x667');
await shot('08-board-375');

const save = await page.evaluate(() => JSON.parse(localStorage.getItem('stats-detective/v2') ?? 'null'));
const results = save?.results ?? {};
for (const id of ['case-001', 'case-002']) {
  if (!results[id]) throw new Error(`Missing result for ${id}`);
  if (results[id].bestRank !== 'S') throw new Error(`Expected S for ${id}, got ${results[id].bestRank}`);
}
if (errors.length) throw new Error(`Console/page errors:\n${errors.join('\n')}`);

console.log('vertical slice OK');
console.log(
  JSON.stringify(
    Object.fromEntries(Object.entries(results).map(([id, result]) => [id, `${result.bestScore}${result.bestRank}`])),
    null,
    2,
  ),
);
await browser.close();
