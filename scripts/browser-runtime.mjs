import { existsSync } from 'node:fs';
import { chromium, firefox, webkit } from 'playwright-core';

export const browserEngine = process.env.PREPMATE_BROWSER_ENGINE || 'chromium';
export async function launchBrowser() {
    const engine = { chromium, firefox, webkit }[browserEngine];
    if (!engine) throw new Error(`Неизвестный движок: ${browserEngine}`);
    if (browserEngine !== 'chromium') return engine.launch({ headless: true });
    const candidates = process.platform === 'win32'
        ? ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe']
        : ['/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium', '/usr/bin/chromium-browser'];
    const executablePath = [process.env.PREPMATE_BROWSER_EXECUTABLE, ...candidates, chromium.executablePath()].find(path => path && existsSync(path));
    return chromium.launch({ executablePath, headless: true, args: ['--no-sandbox'] });
}

export function createContext(browser, options) {
    // Firefox supports viewport/touch tests but not Playwright's isMobile emulation.
    const contextOptions = { ...options };
    if (browserEngine === 'firefox') delete contextOptions.isMobile;
    return browser.newContext(contextOptions);
}
