/* Read-only live check after publishing: HTTP status, cache version and critical assets. */
const origin = process.env.PREPMATE_ORIGIN || 'https://prep-mate.ru';
const expected = process.argv[2] || 'v48';
const queryVersion = expected.replace(/^v/, '');
const paths = ['/', '/style.css', '/js/official-exam.js', '/js/data-transfer.js', '/manifest.json', '/robots.txt', '/sitemap.xml', ...Array.from({ length: 9 }, (_, index) => `/chapters/chapter${index + 1}.html`)];

async function fetchText(path) {
  const url = new URL(path, origin);
  url.searchParams.set('smoke', Date.now().toString());
  const response = await fetch(url, { headers: { 'Cache-Control': 'no-cache' }, signal: AbortSignal.timeout(12000) });
  if (!response.ok) throw new Error(`${path}: HTTP ${response.status}`);
  return response.text();
}

let lastError;
let completed = false;
for (let attempt = 1; attempt <= 24; attempt += 1) {
  try {
    const index = await fetchText('/');
    if (!index.includes(`style.css?v=${queryVersion}`) || !index.includes(`official-exam.js?v=${queryVersion}`)) throw new Error(`Главная страница ещё не обновилась до ${expected}`);
    const contents = await Promise.all(paths.map(fetchText));
    if (!contents[2].includes('OFFICIAL_TASKS_13') || !contents[3].includes('exportFullBackup')) throw new Error('Критические скрипты не обновились');
    const articleCount = contents.slice(7).reduce((sum, chapter) => sum + (chapter.match(/class="interactive-article"/g) || []).length, 0);
    if (articleCount !== 142) throw new Error(`Опубликовано ${articleCount} статей вместо 142`);
    console.log(`Live smoke OK: ${origin}, ${expected}, ${paths.length} ресурсов, ${articleCount} статей`);
    completed = true;
    break;
  } catch (error) {
    lastError = error;
    console.warn(`Попытка ${attempt}/24: ${error.message}`);
    if (attempt < 24) await new Promise(resolve => setTimeout(resolve, 10000));
  }
}
if (!completed) {
  console.error(`Live smoke FAILED: ${lastError?.message || 'unknown error'}`);
  process.exitCode = 1;
}
