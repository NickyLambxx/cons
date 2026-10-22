import assert from 'node:assert/strict';
import { existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { chromium } from 'playwright-core';

const origin = process.env.PREPMATE_ORIGIN || 'https://prep-mate.ru';
const screenshotDir = process.env.PREPMATE_SCREENSHOT_DIR;
if (screenshotDir) mkdirSync(screenshotDir, { recursive: true });
const executablePath = [process.env.PREPMATE_BROWSER_EXECUTABLE, 'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', '/usr/bin/google-chrome', '/usr/bin/chromium', chromium.executablePath()].find(path => path && existsSync(path));
const browser = await chromium.launch({ executablePath, headless: true });
try {
    for (const width of [1366, 834, 390, 320]) {
        const mobile = width <= 768;
        const context = await browser.newContext({ viewport: { width, height: 900 }, isMobile: width < 1000, hasTouch: width < 1000, serviceWorkers: 'block' });
        const page = await context.newPage();
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        await page.goto(origin, { waitUntil: 'domcontentloaded' });
        await page.waitForFunction(() => document.querySelectorAll('#content .card').length === 142);
        if (width === 834) await page.evaluate(() => { if (document.documentElement.classList.contains('light')) toggleTheme(); });
        const source = await page.locator('#content .body .cross-link').first().evaluate(link => ({ id: link.closest('.card').id, title: link.closest('.card').querySelector('.title').textContent, target: link.dataset.target }));
        await page.evaluate(title => filterArticles(title), source.title);
        const card = page.locator(`#${source.id}`);
        await card.locator('.explain > summary').click();
        const sourceLink = card.locator(`.body .cross-link[data-target="${source.target}"]`).first();
        await sourceLink.scrollIntoViewIfNeeded();
        const before = await page.evaluate(() => readingAnchor());
        await sourceLink.click();
        const remembered = await page.evaluate(() => readingHistory.at(-1).anchor);
        assert.ok(await page.locator(`#${source.target}`).isVisible(), 'переход к статье за пределами фильтра');
        await page.evaluate(id => navigateReadingArticle(id), source.target === 'art15' ? 'art16' : 'art15');
        await page.locator('#btn-return').click();
        assert.ok(await page.locator(`#${source.target}`).isVisible(), 'возврат по цепочке переходов');
        await page.locator('#btn-return').click();
        assert.equal(await page.locator('#content .card').count(), 1, 'восстановлен список результатов');
        assert.equal(await card.locator('.explain').getAttribute('open'), '', 'пояснение остаётся раскрытым');
        assert.equal(await card.evaluate(el => getComputedStyle(el).opacity), '1', 'статья действительно видна после возврата');
        const after = await page.evaluate(() => readingAnchor());
        assert.equal(after.cardId, before.cardId);
        assert.ok(Math.abs(after.scrollY - remembered.scrollY) < 5, `восстановлена позиция чтения: ${JSON.stringify({ before, remembered, after })}`);

        await page.evaluate(() => filterArticles(''));
        const openTool = async (desktop, phone) => {
            if (mobile) { await page.locator('#navTools').click(); await page.locator(phone).click(); }
            else await page.locator(desktop).click();
        };
        await openTool('#proceduresBtn', '#mobileProcedures');
        assert.equal(await page.locator('.procedure-flow li').count(), 5);
        for (const id of ['federal-law', 'constitutional-law', 'government']) {
            await page.locator('#procedureSelect').selectOption(id);
            assert.equal(await page.locator('.procedure-flow li').count(), 5);
            assert.ok(await page.locator('.procedure-branches details').count() > 0);
        }
        await page.locator('.procedure-branches summary').first().click();
        if (screenshotDir) await page.screenshot({ path: join(screenshotDir, `procedures-${width}.png`) });
        await page.locator('.procedure-flow button').nth(1).click();
        assert.equal(await page.locator('#proceduresDialog').isVisible(), false);
        assert.ok(await page.locator('#art111').isVisible());
        assert.match(await page.locator('#btn-return').innerText(), /Назад к схеме/);
        await page.locator('#btn-return').click();
        assert.ok(await page.locator('#proceduresDialog').isVisible());
        assert.equal(await page.locator('#procedureSelect').inputValue(), 'government');
        assert.equal(await page.locator('.procedure-branches details').first().getAttribute('open'), '');
        await page.locator('#closeProcedures').click();

        const personalData = await page.evaluate(() => {
            saveTrainingSession('task13', { index: 10, correct: 1, answers: ['1', '2', '', '', ''] });
            recordTrainingResult('task13', 1, 2);
            return [localStorage.getItem(LS.TRAINING_SESSIONS), localStorage.getItem(LS.TRAINING_RESULTS)];
        });
        await openTool('#lessonModeBtn', '#mobileLessonMode');
        assert.ok(await page.locator('#lessonToolbar').isVisible());
        assert.equal(await page.locator('.sidebar').isVisible(), false);
        await page.locator('#lessonArticleSelect').selectOption('art15');
        assert.equal(await page.locator('#art15').evaluate(el => getComputedStyle(el).opacity), '1', 'текст виден в режиме урока');
        assert.equal(await page.locator('#art15 .note-container').isVisible(), false);
        assert.equal(await page.locator('#art15 .card-footer').isVisible(), false);
        assert.equal(await page.locator('#art15 .explain').isVisible(), false);
        await page.locator('#lessonExplanations').check();
        assert.ok(await page.locator('#art15 .explain-body').isVisible());
        if (screenshotDir) await page.screenshot({ path: join(screenshotDir, `lesson-${width}.png`) });
        await page.locator('#lessonToolSelect').selectOption('gameBtn');
        await page.locator('#startGameBtn').click();
        await page.locator('#gameDialog .lesson-answer-toggle').click();
        assert.match(await page.locator('#gameFeedback').innerText(), /Верный ответ:/);
        for (const select of await page.locator('#official13Rows select').all()) await select.selectOption('1');
        await page.locator('#checkGameAnswerBtn').click();
        await page.locator('#closeGame').click();
        await page.locator('#lessonToolSelect').selectOption('game23Btn');
        await page.locator('#skipTask23Btn').click();
        assert.equal(await page.locator('#task23Feedback').isVisible(), false, 'ориентир скрыт во время демонстрации');
        await page.locator('#game23Dialog .lesson-answer-toggle').click();
        assert.ok(await page.locator('#task23Feedback').isVisible());
        await page.locator('#nextTask23Btn').click();
        await page.locator('#skipTask23Btn').click();
        assert.equal(await page.locator('#task23Feedback').isVisible(), false, 'следующий ответ снова скрыт');
        await page.locator('#closeGame23').click();
        await page.locator('#exitLessonMode').click();
        assert.equal(await page.locator('#lessonToolbar').isVisible(), false);
        assert.ok(await page.locator('.site-header').isVisible());
        assert.ok(await page.locator('#art15 .card-footer').isVisible());
        assert.deepEqual(await page.evaluate(() => [localStorage.getItem(LS.TRAINING_SESSIONS), localStorage.getItem(LS.TRAINING_RESULTS)]), personalData, 'показ не изменил личные результаты и сохранённые тренировки');
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
        assert.deepEqual(errors, []);
        console.log(`Lesson UI OK: ${width}px — reading return, filters, diagrams, presentation, hidden answers`);
        await context.close();
    }
} finally { await browser.close(); }
