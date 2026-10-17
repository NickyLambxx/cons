/* Post-deploy browser check on isolated desktop, tablet and phone-sized sessions. */
import assert from 'node:assert/strict';
import { existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { chromium } from 'playwright-core';

const origin = process.env.PREPMATE_ORIGIN || 'https://prep-mate.ru';
const screenshotDir = process.env.PREPMATE_SCREENSHOT_DIR;
if (screenshotDir) mkdirSync(screenshotDir, { recursive: true });
const browserCandidates = process.platform === 'win32'
  ? ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe']
  : ['/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium', '/usr/bin/chromium-browser'];
const executablePath = [process.env.PREPMATE_BROWSER_EXECUTABLE, ...browserCandidates, chromium.executablePath()].find(path => path && existsSync(path));
if (!executablePath) throw new Error('Не найден Chrome/Edge. Укажите PREPMATE_BROWSER_EXECUTABLE.');

const browser = await chromium.launch({ executablePath, headless: true, args: ['--no-sandbox'] });
try {
  for (const device of [
    { name: 'компьютер', slug: 'desktop', viewport: { width: 1366, height: 900 }, isMobile: false, usesMobileNavigation: false },
    { name: 'планшет', slug: 'tablet', viewport: { width: 834, height: 1112 }, isMobile: true, usesMobileNavigation: false },
    { name: 'телефон', slug: 'mobile', viewport: { width: 390, height: 844 }, isMobile: true, usesMobileNavigation: true }
  ]) {
    const context = await browser.newContext({ viewport: device.viewport, isMobile: device.isMobile, hasTouch: device.isMobile, serviceWorkers: 'block' });
    const page = await context.newPage();
    const pageErrors = [];
    page.on('pageerror', error => pageErrors.push(error.message));
    await page.goto(`${origin}/?smoke=${Date.now()}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForFunction(() => document.querySelectorAll('#content .card[data-article-id]').length === 142, null, { timeout: 30000 });
    assert.equal(await page.locator('#content .card[data-article-id]').count(), 142, 'число статей');
    const documentWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    assert.ok(documentWidth <= device.viewport.width + 1, `горизонтальная прокрутка: ${documentWidth}px при окне ${device.viewport.width}px`);
    if (screenshotDir) await page.screenshot({ path: join(screenshotDir, `home-${device.slug}.png`), animations: 'disabled' });

    if (device.usesMobileNavigation) {
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
    await page.evaluate(() => { officialExamState.task13 = 50; renderOfficial13(); });
    assert.match(await page.locator('#questionText').innerText(), /вариант 1/);
    for (const [index, digit] of [...'21121'].entries()) {
      await page.locator('#official13Rows select').nth(index).selectOption(digit);
    }
    await page.locator('#checkGameAnswerBtn').click();
    assert.match(await page.locator('#gameFeedback').innerText(), /2 из 2 баллов\. Верный ответ: 21121/);
    assert.match(await page.locator('#gameFeedback').innerText(), /печатному варианту/);
    if (screenshotDir) await page.screenshot({ path: join(screenshotDir, `task13-${device.slug}.png`), animations: 'disabled' });
    await page.locator('#closeGame').click();

    if (device.usesMobileNavigation) {
      await page.locator('#navTools').click();
      await page.locator('#mobileGame23').click();
    } else {
      await page.locator('#game23Btn').click();
    }
    assert.equal(await page.locator('#task23Options textarea').count(), 3, 'три объяснения №23');
    await page.evaluate(() => { officialExamState.task23 = 35; renderOfficial23(); });
    assert.match(await page.locator('#task23Context').innerText(), /свободно формировать своё мировоззрение/);
    assert.match(await page.locator('#task23Question').innerText(), /три разных подтверждения/);
    assert.match(await page.locator('#task23Instruction').innerText(), /распространённым предложением/);
    const dialogBox = await page.locator('#game23Dialog').boundingBox();
    assert.ok(dialogBox && dialogBox.x >= -1 && dialogBox.x + dialogBox.width <= device.viewport.width + 1, 'диалог №23 в пределах экрана');
    if (screenshotDir) await page.screenshot({ path: join(screenshotDir, `task23-prompt-${device.slug}.png`), animations: 'disabled' });
    await page.locator('#checkTask23Btn').click();
    assert.equal(await page.locator('#task23Feedback ol li').count(), 3, 'три ориентира книжного №23');
    assert.match(await page.locator('#task23Feedback').innerText(), /не официальный ключ ФИПИ/);
    if (screenshotDir) await page.screenshot({ path: join(screenshotDir, `task23-${device.slug}.png`), animations: 'disabled' });
    await page.locator('#nextTask23Btn').click();
    assert.match(await page.locator('#task23Context').innerText(), /основы суверенитета/);
    assert.match(await page.locator('#task23Instruction').innerText(), /распространённым предложением/);
    await page.locator('#closeGame23').click();

    if (device.usesMobileNavigation) {
      await page.locator('#navTools').click();
      await page.locator('#mobileFindError').click();
    } else {
      await page.locator('#findErrorBtn').click();
    }
    assert.match(await page.locator('#findErrorCounter').innerText(), /1 \/ 50/);
    await page.locator('#closeFindError').click();

    const openTool = async (desktop, mobile) => {
      if (device.usesMobileNavigation) {
        await page.locator('#navTools').click();
        await page.locator(mobile).click();
      } else {
        await page.locator(desktop).click();
      }
    };
    await openTool('#flashcardsBtn', '#mobileFlashcards');
    assert.match(await page.locator('#fcCounter').innerText(), /1 \/ 80/);
    await page.locator('#flashcard').click();
    assert.ok((await page.locator('#fcDef').innerText()).length > 30, 'определение карточки');
    await page.locator('#fcNext').click();
    await page.waitForFunction(() => document.querySelector('#fcCounter')?.textContent.includes('2 / 80'));
    assert.match(await page.locator('#fcCounter').innerText(), /2 \/ 80/);
    await page.locator('#closeFlashcards').click();

    await openTool('#dictionaryBtn', '#mobileDictionary');
    await page.locator('#dictionaryList .dict-item').first().waitFor();
    assert.equal(await page.locator('#dictionaryList .dict-item').count(), 80, '80 терминов словаря');
    await page.locator('#closeDictionary').click();

    await openTool('#argumentBankBtn', '#mobileArgumentBank');
    assert.equal(await page.locator('#argumentBankList .argument-card').count(), 50, '50 аргументов');
    await page.locator('#closeArgumentBank').click();

    await openTool('#mixedTrainingBtn', '#mobileMixedTraining');
    assert.match(await page.locator('#mixedCounter').innerText(), /1 \/ 50/);
    await page.locator('#mixedAnswers .mixed-answer').first().click();
    await page.locator('#mixedNext').click();
    assert.match(await page.locator('#mixedCounter').innerText(), /2 \/ 50/);
    await page.locator('#closeMixedTraining').click();

    if (device.usesMobileNavigation) {
      await page.locator('#navTools').click();
      await page.locator('#mobileProgressTransfer').click();
    } else {
      await page.locator('#progressTransferBtn').click();
    }
    assert.equal(await page.locator('#exportFullBackup').isVisible(), true, 'полная резервная копия');
    assert.equal(await page.locator('#importFullBackup').count(), 1, 'импорт резервной копии');
    assert.deepEqual(pageErrors, [], 'ошибки JavaScript');
    console.log(`UI smoke OK: ${device.name}, 142 статьи, поиск, №13, №23, карточки, словарь, аргументы, микс, перенос`);
    await context.close();
  }
} finally {
  await browser.close();
}
