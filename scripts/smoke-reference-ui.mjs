import assert from 'node:assert/strict';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { launchBrowser, createContext, browserEngine } from './browser-runtime.mjs';

const origin = process.env.PREPMATE_ORIGIN || 'https://prep-mate.ru';
const screenshots = process.env.PREPMATE_SCREENSHOT_DIR;
if (screenshots) mkdirSync(screenshots, { recursive: true });
const browser = await launchBrowser();
try {
    for (const width of [1366, 834, 390, 320]) {
        const mobile = width <= 768;
        const context = await createContext(browser, { viewport: { width, height: 900 }, isMobile: width < 1000, hasTouch: width < 1000, serviceWorkers: 'block' });
        const page = await context.newPage();
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        await page.goto(origin, { waitUntil: 'domcontentloaded' });
        await page.waitForFunction(() => document.querySelectorAll('#content .card').length === 142);
        if (width === 834) await page.evaluate(() => { if (document.documentElement.classList.contains('light')) toggleTheme(); });
        const openTool = async (desktop, phone) => {
            if (mobile) { await page.locator('#navTools').click(); await page.locator(phone).click(); }
            else await page.locator(desktop).click();
        };
        await openTool('#referenceRightsBtn', '#mobileReferenceRights');
        const expected = await page.evaluate(() => ({ rights: RIGHTS_REFERENCE.length, numbers: NUMBERS_REFERENCE.length }));
        assert.equal(await page.locator('.reference-entry').count(), expected.rights);
        await page.locator('#referenceSearch').fill('41');
        assert.equal(await page.locator('.reference-entry').count(), 2, 'две разные нормы статьи 41');
        await page.locator('#referenceGroup').selectOption('citizens');
        assert.equal(await page.locator('.reference-entry').count(), 1);
        if (screenshots) await page.screenshot({ path: join(screenshots, `rights-${width}.png`), animations: 'disabled' });
        await page.locator('.reference-article').click();
        assert.equal(await page.locator('#referenceDialog').isVisible(), false);
        assert.ok(await page.locator('#art41').isVisible());
        await page.locator('#btn-return').click();
        assert.equal(await page.locator('#referenceSearch').inputValue(), '41');
        assert.equal(await page.locator('#referenceGroup').inputValue(), 'citizens');
        assert.equal(await page.locator('.reference-entry').count(), 1);
        await page.locator('#referenceGroup').selectOption('all');
        await page.locator('#referenceSearch').fill('');
        const last = page.locator('.reference-article').last();
        await last.scrollIntoViewIfNeeded();
        const scrollBefore = await page.locator('#referenceBody').evaluate(element => element.scrollTop);
        await last.click();
        await page.locator('#btn-return').click();
        assert.ok(Math.abs(await page.locator('#referenceBody').evaluate(element => element.scrollTop) - scrollBefore) < 5, 'возврат к месту в справочнике');
        await page.locator('#referenceMode').selectOption('numbers');
        assert.equal(await page.locator('.reference-entry').count(), expected.numbers);
        await page.locator('#referenceGroup').selectOption('votes');
        await page.locator('#referenceSearch').fill('108');
        assert.equal(await page.locator('.reference-entry').count(), 2);
        assert.match(await page.locator('#referenceList').innerText(), /2\/3/);
        assert.match(await page.locator('#referenceList').innerText(), /3\/4/);
        if (screenshots) await page.screenshot({ path: join(screenshots, `numbers-${width}.png`), animations: 'disabled' });
        await page.locator('#closeReference').click();

        if (mobile) {
            await page.locator('#navSearch').click();
            await page.locator('#mobileSearchInput').fill('ghfdf');
            await page.locator('#mobileLayoutSuggestion button').waitFor();
            assert.equal(await page.locator('#mobileSearchInput').inputValue(), 'ghfdf', 'запрос не исправлен автоматически');
            await page.locator('#mobileLayoutSuggestion button').click();
            await page.waitForFunction(() => document.querySelector('#mobileSearchInput').value === 'права' && document.querySelectorAll('.mobile-search-result-item').length > 0);
            await page.locator('#mobileSearchInput').fill('cnfnmz 11');
            await page.locator('#mobileSearchInput').press('Enter');
            assert.ok(await page.locator('#mobileSearchOverlay').isVisible(), 'Enter сохраняет возможность выбрать исправление');
            await page.locator('#mobileLayoutSuggestion button').click();
            await page.waitForFunction(() => document.querySelector('#mobileSearchInput').value === 'статья 11' && document.querySelectorAll('.mobile-search-result-item').length === 1);
            await page.locator('#mobileSearchClose').click();
        } else {
            await page.locator('#searchInput').fill('ghfdf');
            await page.locator('#desktopLayoutSuggestion button').waitFor();
            assert.equal(await page.locator('#searchInput').inputValue(), 'ghfdf');
            if (screenshots) await page.screenshot({ path: join(screenshots, `layout-${width}.png`), animations: 'disabled' });
            await page.locator('#desktopLayoutSuggestion button').click();
            assert.equal(await page.locator('#searchInput').inputValue(), 'права');
            // Let the original 300ms search debounce expire: it must not overwrite the chosen correction.
            await page.waitForTimeout(400);
            assert.equal(await page.evaluate(() => state.activeSearchQuery), 'права');
            assert.ok(await page.locator('#content .card').count() > 0);
            await page.locator('#searchInput').fill('111');
            assert.equal(await page.locator('#desktopLayoutSuggestion').isVisible(), false);
        }
        assert.deepEqual(errors, []);
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
        console.log(`Reference UI OK: ${browserEngine}, ${width}px — ${expected.rights} прав, ${expected.numbers} числовых норм, фильтры, переход/возврат, раскладка`);
        await context.close();
    }
} finally { await browser.close(); }
