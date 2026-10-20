// Save/resume and v1→v2 migration checks against the production build.
// Usage: node tests/save-resume.mjs
import { chromium } from 'playwright-core';
import { existsSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const CHROME = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
].find(existsSync);
const URL = pathToFileURL(resolve('dist/index.html')).href;
const SHOTS = 'tests/shots/save-resume';
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

const baseSave = {
  version: 2,
  settings: {
    sound: false,
    music: false,
    volume: 0.7,
    reduceMotion: false,
    textScale: 1,
    colorblind: false,
    assist: true,
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
};

await page.goto(URL, { waitUntil: 'networkidle' });
await page.evaluate((save) => {
  localStorage.clear();
  localStorage.setItem('stats-detective/v2', JSON.stringify(save));
}, baseSave);
await page.reload({ waitUntil: 'networkidle' });

// Start FILE 001 and buy one clue, then simulate an app reload.
await page.getByText('捜査を開始する', { exact: true }).click();
await wait(260);
await button(/捜査を開始する/).click();
await wait(220);
await buyClue('海外キャリア');
const beforeReload = await page.evaluate(() => {
  const save = JSON.parse(localStorage.getItem('stats-detective/v2') ?? 'null');
  return save?.progress?.['case-001'];
});
if (beforeReload?.purchasedClueIds?.join(',') !== 'c1') {
  throw new Error(`Clue purchase was not persisted before reload:\n${JSON.stringify(beforeReload, null, 2)}`);
}

await page.reload({ waitUntil: 'networkidle' });
const resumedHome = await page.locator('body').innerText();
if (!resumedHome.includes('捜査を続ける') || !resumedHome.includes('AUTO SAVED')) {
  throw new Error(`Home did not offer the saved investigation:\n${resumedHome.slice(0, 1200)}`);
}
await shot('01-resume-offer');
await page.locator('.dx-today').click();
await wait(300);
const resumedCase = await page.locator('body').innerText();
if (!resumedCase.includes('手がかり 1') || !resumedCase.includes('海外キャリア')) {
  throw new Error(`Saved investigation did not restore:\n${resumedCase.slice(0, 1400)}`);
}
await shot('02-resumed-case');
const afterReload = await page.evaluate(() => {
  const save = JSON.parse(localStorage.getItem('stats-detective/v2') ?? 'null');
  return save?.progress?.['case-001'];
});
if (afterReload?.phase !== 'investigating' || afterReload?.purchasedClueIds?.join(',') !== 'c1') {
  throw new Error(`Resumed progress is wrong:\n${JSON.stringify(afterReload, null, 2)}`);
}

// v1 save: sound and terms survive, the new tutorial starts fresh, notice is one-shot.
await page.evaluate(() => {
  localStorage.clear();
  localStorage.setItem(
    'stats-detective/v1',
    JSON.stringify({ v: 1, sound: false, terms: ['stats', 'caps'] }),
  );
});
await page.reload({ waitUntil: 'networkidle' });
await wait(300);
const migratedHome = await page.locator('body').innerText();
if (!migratedHome.includes('保存データを更新しました')) {
  throw new Error(`Migration notice was not shown:\n${migratedHome.slice(0, 1000)}`);
}
await shot('03-migration-notice');
const migrated = await page.evaluate(() => JSON.parse(localStorage.getItem('stats-detective/v2') ?? 'null'));
if (migrated?.version !== 2) throw new Error('v2 save was not written');
if (migrated?.settings?.sound !== false) throw new Error('Sound setting was not migrated');
if (!migrated?.terms?.includes('stats') || !migrated?.terms?.includes('caps')) {
  throw new Error(`Glossary terms were not migrated: ${JSON.stringify(migrated?.terms)}`);
}
if (migrated?.tutorialSeen !== false) throw new Error('New tutorial should start fresh after migration');
if (migrated?.migrationNotice !== false) throw new Error('Migration notice should be dismissed after display');
if (errors.length) throw new Error(`Console/page errors:\n${errors.join('\n')}`);

console.log('save/resume + v1→v2 migration OK');
await browser.close();
