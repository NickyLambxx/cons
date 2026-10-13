/* Post-deploy browser check on isolated desktop and phone-sized sessions. */
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { chromium } from 'playwright-core';

const origin = process.env.PREPMATE_ORIGIN || 'https://prep-mate.ru';
const browserCandidates = process.platform === 'win32'
  ? ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe']
  : ['/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium', '/usr/bin/chromium-browser'];
const executablePath = [process.env.PREPMATE_BROWSER_EXECUTABLE, ...browserCandidates, chromium.executablePath()].find(path => path && existsSync(path));
if (!executablePath) throw new Error('Не найден Chrome/Edge. Укажите PREPMATE_BROWSER_EXECUTABLE.');

const browser = await chromium.launch({ executablePath, headless: true, args: ['--no-sandbox'] });
try {
  for (const device of [
    { name: 'компьютер', viewport: { width: 1366, height: 900 }, isMobile: false },
    { name: 'телефон', viewport: { width: 390, height: 844 }, isMobile: true }
  ]) {
    const context = await browser.newContext({ viewport: device.viewport, isMobile: device.isMobile, hasTouch: device.isMobile, serviceWorkers: 'block' });
    const page = await context.newPage();
    const pageErrors = [];
    page.on('pageerror', error => pageErrors.push(error.message));
    await page.goto(`${origin}/?smoke=${Date.now()}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForFunction(() => document.querySelectorAll('#content .card[data-article-id]').length === 142, null, { timeout: 30000 });
    assert.equal(await page.locator('#content .card[data-article-id]').count(), 142, 'число статей');

    if (device.isMobile) {
      await page.locator('#toggleStudyFilters').click();
      assert.equal(await page.locator('#studyFilterBody').isVisible(), true, 'раскрытие фильтров');
      await page.locator('#navSearch').click();
      assert.equal(await page.locator('#mobileSearchOverlay').isVisible(), true, 'мобильная панель поиска');
      await page.locator('#mobileSearchInput').fill('111');
      await page.locator('#mobileSearchResults').getByText('Статья 111', { exact: false }).first().waitFor();
      await page.locator('#mobileSearchClose').click();
      await page.locator('#navTools').click();
      await page.locator('#mobileGame').click();
    } else {
      await page.locator('#searchInput').fill('статья 111');
      await page.locator('#gameBtn').click();
    }

    await page.locator('#startGameBtn').click();
    await page.locator('#official13Rows select').first().waitFor({ timeout: 10000 });
    assert.equal(await page.locator('#official13Rows select').count(), 5, 'пять позиций №13');
    assert.match(await page.locator('#questionText').innerText(), /Демоверсия ЕГЭ-2026/);
    await page.locator('#closeGame').click();

    if (device.isMobile) {
      await page.locator('#navTools').click();
      await page.locator('#mobileGame23').click();
    } else {
      await page.locator('#game23Btn').click();
    }
    assert.equal(await page.locator('#task23Options textarea').count(), 3, 'три объяснения №23');
    await page.locator('#closeGame23').click();

    if (device.isMobile) {
      await page.locator('#navTools').click();
      await page.locator('#mobileProgressTransfer').click();
    } else {
      await page.locator('#progressTransferBtn').click();
    }
    assert.equal(await page.locator('#exportFullBackup').isVisible(), true, 'полная резервная копия');
    assert.equal(await page.locator('#importFullBackup').count(), 1, 'импорт резервной копии');
    assert.deepEqual(pageErrors, [], 'ошибки JavaScript');
    console.log(`UI smoke OK: ${device.name}, 142 статьи, поиск, №13, №23, перенос`);
    await context.close();
  }
} finally {
  await browser.close();
}
