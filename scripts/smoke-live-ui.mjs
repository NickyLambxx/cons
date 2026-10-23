/* Post-deploy browser check on isolated desktop, tablet and phone-sized sessions. */
import assert from 'node:assert/strict';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { launchBrowser, createContext, browserEngine } from './browser-runtime.mjs';

const origin = process.env.PREPMATE_ORIGIN || 'https://prep-mate.ru';
const screenshotDir = process.env.PREPMATE_SCREENSHOT_DIR;
if (screenshotDir) mkdirSync(screenshotDir, { recursive: true });
const browser = await launchBrowser();
console.log(`Browser engine: ${browserEngine}`);
try {
  for (const device of [
    { name: 'компьютер', slug: 'desktop', viewport: { width: 1366, height: 900 }, isMobile: false, usesMobileNavigation: false },
    { name: 'планшет', slug: 'tablet', viewport: { width: 834, height: 1112 }, isMobile: true, usesMobileNavigation: false },
    { name: 'телефон', slug: 'mobile', viewport: { width: 390, height: 844 }, isMobile: true, usesMobileNavigation: true }
  ]) {
    const context = await createContext(browser, { viewport: device.viewport, isMobile: device.isMobile, hasTouch: device.isMobile, serviceWorkers: 'block' });
    const page = await context.newPage();
    const pageErrors = [];
    const clickHeaderTool = async selector => {
      const tool = page.locator(selector);
      const group = tool.locator('xpath=ancestor::div[contains(@class,"header-group")]');
      if (await group.count() && !(await tool.isVisible())) await group.locator('.header-group-toggle').click();
      await tool.click();
    };
    page.on('pageerror', error => pageErrors.push(error.message));
    await page.goto(`${origin}/?smoke=${Date.now()}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForFunction(() => document.querySelectorAll('#content .card[data-article-id]').length === 142, null, { timeout: 30000 });
    assert.equal(await page.locator('#content .card[data-article-id]').count(), 142, 'число статей');
    const documentWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    assert.ok(documentWidth <= device.viewport.width + 1, `горизонтальная прокрутка: ${documentWidth}px при окне ${device.viewport.width}px`);
    if (device.slug === 'tablet') {
      assert.ok(await page.locator('#flashcardsBtn .tool-label').isVisible(), 'подписи планшетного меню');
      const trainersToggle = page.locator('[aria-controls="headerTrainers"]');
      await trainersToggle.focus();
      await page.keyboard.press('Enter');
      assert.ok(await page.locator('#gameBtn').isVisible(), 'раскрытие тренажёров клавиатурой');
      await page.keyboard.press('Escape');
      assert.equal(await trainersToggle.getAttribute('aria-expanded'), 'false');
    }
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
      await clickHeaderTool('#gameBtn');
    }

    await page.locator('#startGameBtn').click();
    await page.locator('#official13Rows select').first().waitFor({ timeout: 10000 });
    assert.equal(await page.locator('#official13Rows select').count(), 5, 'пять позиций №13');
    const answerSelectLayout = await page.locator('#official13Rows select').first().evaluate(select => {
      const style = getComputedStyle(select);
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      context.font = style.font;
      return {
        textWidth: context.measureText(select.options[0].textContent).width,
        availableWidth: select.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight),
        arrowSpace: parseFloat(style.paddingRight),
        font: style.font,
        canvasFont: context.font,
        fieldWidth: select.clientWidth,
        stylesheet: document.querySelector('link[rel="stylesheet"]').href
      };
    });
    assert.ok(answerSelectLayout.availableWidth >= answerSelectLayout.textWidth, `подсказка выбора ответа помещается целиком: ${JSON.stringify(answerSelectLayout)}`);
    assert.ok(answerSelectLayout.arrowSpace >= 28, 'стрелка выбора отделена от текста');
    if (screenshotDir) await page.screenshot({ path: join(screenshotDir, `task13-placeholder-${device.slug}.png`), animations: 'disabled' });
    assert.match(await page.locator('#questionText').innerText(), /Демоверсия ЕГЭ-2026/);
    await page.evaluate(() => { officialExamState.task13 = 50; renderOfficial13(); });
    assert.match(await page.locator('#questionText').innerText(), /вариант 1/);
    await page.locator('#quickAnswer13').fill('21');
    assert.deepEqual(await page.locator('#official13Rows select').evaluateAll(elements => elements.map(el => el.value)), ['2', '1', '', '', '']);
    await page.locator('#quickAnswer13').fill('99999');
    assert.equal(await page.locator('#quickAnswer13').getAttribute('aria-invalid'), 'true');
    await page.locator('#quickAnswer13').fill('2 1 1 2 1');
    assert.equal(await page.locator('#quickAnswer13').inputValue(), '21121');
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
      await clickHeaderTool('#game23Btn');
    }
    assert.equal(await page.locator('#task23Options textarea').count(), 3, 'три объяснения №23');
    await page.evaluate(() => { officialExamState.task23 = 35; renderOfficial23(); });
    assert.match(await page.locator('#task23Context').innerText(), /свободно формировать своё мировоззрение/);
    assert.match(await page.locator('#task23Question').innerText(), /три разных подтверждения/);
    assert.match(await page.locator('#task23Instruction').innerText(), /распространённым предложением/);
    const dialogBox = await page.locator('#game23Dialog').boundingBox();
    assert.ok(dialogBox && dialogBox.x >= -1 && dialogBox.x + dialogBox.width <= device.viewport.width + 1, 'диалог №23 в пределах экрана');
    if (screenshotDir) await page.screenshot({ path: join(screenshotDir, `task23-prompt-${device.slug}.png`), animations: 'disabled' });
    assert.equal(await page.locator('#checkTask23Btn').isDisabled(), true, 'ориентир после попытки');
    await page.locator('#task23Options textarea').first().fill('Мой ответ с опорой на Конституцию РФ.');
    assert.equal(await page.locator('#checkTask23Btn').isEnabled(), true, 'сравнение доступно после ввода');
    await page.locator('#checkTask23Btn').click();
    assert.equal(await page.locator('#task23Feedback ol li').count(), 3, 'три ориентира книжного №23');
    assert.match(await page.locator('#task23Feedback').innerText(), /не официальный ключ ФИПИ/);
    if (screenshotDir) await page.screenshot({ path: join(screenshotDir, `task23-${device.slug}.png`), animations: 'disabled' });
    await page.locator('#nextTask23Btn').click();
    assert.match(await page.locator('#task23Context').innerText(), /основы суверенитета/);
    assert.match(await page.locator('#task23Instruction').innerText(), /распространённым предложением/);
    assert.equal(await page.locator('#checkTask23Btn').isDisabled(), true, 'новый вопрос не наследует ответ');
    await page.locator('#skipTask23Btn').click();
    assert.equal(await page.locator('#task23Feedback ol li').count(), 3, 'показ без ответа');
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
        await clickHeaderTool(desktop);
      }
    };
    await openTool('#flashcardsBtn', '#mobileFlashcards');
    assert.match(await page.locator('#fcCounter').innerText(), /1 \/ 80/);
    await page.locator('#flashcardDirection').selectOption('definition');
    await page.evaluate(() => { flashcards.index = flashcards.terms.reduce((best, term, index, terms) => DICTIONARY[term].length > DICTIONARY[terms[best]].length ? index : best, 0); renderFlashcard(); });
    const reversed = await page.evaluate(() => ({ text: document.querySelector('#fcTerm').textContent, expected: DICTIONARY[flashcards.terms[flashcards.index]], term: flashcards.terms[flashcards.index] }));
    assert.equal(reversed.text, reversed.expected, 'определение на лицевой стороне');
    if (screenshotDir) await page.screenshot({ path: join(screenshotDir, `reverse-cards-${device.slug}.png`), animations: 'disabled' });
    await page.locator('.flashcard .front').evaluate(element => { element.scrollTop = element.scrollHeight; });
    await page.evaluate(() => updateFlashcardScrollIndicator());
    const frontOverflows = await page.locator('.flashcard .front').evaluate(element => element.scrollHeight > element.clientHeight + 2);
    assert.equal(await page.locator('#flashcardScrollIndicator').isVisible(), frontOverflows, 'индикатор соответствует наличию прокрутки определения');
    await page.locator('#flashcard').click();
    assert.equal((await page.locator('#fcDef').innerText()).toLocaleLowerCase('ru'), reversed.term, 'термин на обороте');
    await page.locator('#flashcardDirection').selectOption('term');
    assert.equal(await page.locator('.flashcard .front').evaluate(element => element.scrollTop), 0, 'направление сбрасывает прокрутку');
    await page.evaluate(() => { flashcards.index = 0; renderFlashcard(); });
    await page.locator('#flashcard').click();
    assert.ok((await page.locator('#fcDef').innerText()).length > 30, 'определение карточки');
    await page.locator('#fcNext').click();
    await page.waitForFunction(() => document.querySelector('#fcCounter')?.textContent.includes('2 / 80'));
    assert.match(await page.locator('#fcCounter').innerText(), /2 \/ 80/);
    await page.locator('#closeFlashcards').click();

    await openTool('#dictionaryBtn', '#mobileDictionary');
    await page.locator('#dictionaryList .dict-item').first().waitFor();
    assert.equal(await page.locator('#dictionaryList .dict-item').count(), 80, '80 терминов словаря');
    await page.locator('#dictionarySearch').fill('адвокат');
    const articleLink = page.locator('#dictionaryList a[data-target="art48"]').first();
    await articleLink.waitFor();
    await articleLink.click();
    assert.equal(await page.locator('#dictionaryDialog').isVisible(), false);
    assert.ok(await page.locator('#art48').isVisible());
    await page.locator('#btn-return').click();
    assert.ok(await page.locator('#dictionaryDialog').isVisible());
    assert.equal(await page.locator('#dictionarySearch').inputValue(), 'адвокат');
    await page.locator('#dictionarySearch').fill('11');
    await page.locator('#dictionaryList a mark').first().waitFor();
    assert.match(await page.locator('#dictionaryList a mark').first().innerText(), /11/, 'подсветка цифр внутри ссылки');
    if (screenshotDir) await page.screenshot({ path: join(screenshotDir, `dictionary-links-${device.slug}.png`), animations: 'disabled' });
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
