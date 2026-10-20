// Wrong-accusation and recovery test against the production build.
// Usage: node tests/wrong-accusation.mjs
import { chromium } from 'playwright-core';
import { existsSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const CHROME = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
].find(existsSync);
const URL = pathToFileURL(resolve('dist/index.html')).href;
const SHOTS = 'tests/shots/wrong-accusation';
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
const wait = (ms) => page.waitForTimeout(ms);
const button = (pattern) => page.getByRole('button', { name: pattern });
const shot = async (name) => {
  await wait(140);
  await page.screenshot({ path: `${SHOTS}/${name}.png` });
};

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
  await wait(180);
  await page.locator('.dx-pick').filter({ hasText: name }).click();
  for (const title of evidenceTitles) {
    await page.locator('.dx-evidence-card').filter({ hasText: title }).click();
  }
  await wait(120);
  const previewText = await page.locator('.dx-eval').innerText();
  if (!previewText.includes('判定は告発後に表示')) {
    throw new Error(`Assist-off evidence preview leaked a judgement:\n${previewText}`);
  }
  if (await page.locator('.dx-eval.is-tight, .dx-eval.is-valid').count()) {
    throw new Error('Assist-off evidence preview leaked a tight/valid class');
  }
  await button(/この証拠で告発する/).click();
  await wait(180);
  await page.locator('.dx-modal').getByRole('button', { name: /^告発する/ }).click();
  await wait(260);
}

await page.goto(URL, { waitUntil: 'networkidle' });
await page.evaluate(() => {
  localStorage.clear();
  localStorage.setItem(
    'stats-detective/v2',
    JSON.stringify({
      version: 2,
      settings: {
        sound: false,
        music: false,
        volume: 0.7,
        reduceMotion: false,
        textScale: 1,
        colorblind: false,
        assist: false,
      },
      progress: {},
      results: {
        'case-000': {
          caseId: 'case-000',
          bestScore: 90,
          bestRank: 'S',
          bestTokensUsed: 3,
          bestWrongAccusations: 0,
          plays: 1,
          firstClearedAt: '2026-10-20T00:00:00.000Z',
          lastPlayedAt: '2026-10-20T00:00:00.000Z',
        },
      },
      collection: {},
      achievements: [],
      daily: { lastPlayedDate: null, streak: 0, bestByDate: {} },
      terms: [],
      tutorialSeen: true,
    }),
  );
});
await page.reload({ waitUntil: 'networkidle' });
await page.getByText('捜査を開始する', { exact: true }).click();
await wait(260);
await button(/捜査を開始する/).click();
await wait(220);

// Assist is off: the no-overseas clue has not auto-crossed Nakamura, so he is still selectable.
// The wrong accusation should explain the contradiction instead of just saying the evidence is weak.
await buyClue('海外キャリア');
await buyClue('身長');
await accuse('中村 俊輔', ['海外キャリア', '身長']);
await shot('01-wrong');
const wrongText = await page.locator('.dx-modal').innerText();
if (!wrongText.includes('海外キャリア') || !wrongText.includes('矛盾') || !wrongText.includes('誤告発 −10点')) {
  throw new Error(`Wrong-accusation modal is missing the clue contradiction:\n${wrongText}`);
}
await page.locator('.dx-modal').getByRole('button', { name: /捜査に戻る/ }).click();
await wait(240);
await shot('02-after-wrong');

const progress = await page.evaluate(() => {
  const save = JSON.parse(localStorage.getItem('stats-detective/v2') ?? 'null');
  return save?.progress?.['case-001'];
});
if (progress?.wrongAccusations !== 1 || !progress?.accusedIds?.includes('nakamura')) {
  throw new Error(`Wrong accusation was not persisted:\n${JSON.stringify(progress, null, 2)}`);
}

// Recover and finish: 50 correct + 30 tight + 13 efficiency − 10 penalty = 83 A.
await accuse('遠藤 保仁', ['海外キャリア', '身長']);
await wait(2200);
await button(/捜査報告書へ/).click();
await wait(1900);
await shot('03-result');
const resultText = await page.locator('body').innerText();
if (!resultText.includes('83/100') || !resultText.includes('誤告発\n1回')) {
  throw new Error(`Expected an 83-point A report with one wrong accusation:\n${resultText.slice(0, 1200)}`);
}
if (errors.length) throw new Error(`Console/page errors:\n${errors.join('\n')}`);
console.log('wrong accusation + clue contradiction + recovery OK (83 A)');
await browser.close();
