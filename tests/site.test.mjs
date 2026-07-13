import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import test from 'node:test';

const read = (path) => readFileSync(path, 'utf8');
const chapterFiles = readdirSync('chapters')
  .filter((name) => /^chapter\d+\.html$/.test(name))
  .sort((a, b) => a.localeCompare(b, 'ru', { numeric: true }));

test('проект содержит девять глав и 142 уникальные статьи', () => {
  assert.equal(chapterFiles.length, 9);

  const articles = chapterFiles.flatMap((file) => {
    const html = read(`chapters/${file}`);
    return [...html.matchAll(/<article\b[^>]*\bid="([^"]+)"[^>]*\bdata-title="([^"]+)"/g)]
      .map((match) => ({ id: match[1], title: match[2], file }));
  });

  assert.equal(articles.length, 142);
  assert.equal(new Set(articles.map(({ id }) => id)).size, articles.length);
});

test('у каждой статьи есть заголовок и пояснение', () => {
  for (const file of chapterFiles) {
    const html = read(`chapters/${file}`);
    const articleBlocks = html.match(/<article\b[\s\S]*?<\/article>/g) ?? [];
    assert.ok(articleBlocks.length > 0, `${file}: статьи не найдены`);

    for (const article of articleBlocks) {
      const id = article.match(/\bid="([^"]+)"/)?.[1] ?? file;
      assert.match(article, /<h3>Статья /, `${id}: отсутствует заголовок`);
      assert.match(article, /class="explanation-source"/, `${id}: отсутствует пояснение`);
    }
  }
});

test('manifest корректен и ссылается на существующие иконки', () => {
  const manifest = JSON.parse(read('manifest.json'));
  assert.equal(manifest.short_name, 'PrepMate');
  assert.ok(Array.isArray(manifest.icons) && manifest.icons.length >= 2);

  for (const icon of manifest.icons) {
    assert.ok(existsSync(icon.src.replace(/^\.\//, '')), `Нет иконки ${icon.src}`);
  }
});

test('основные файлы приложения присутствуют', () => {
  for (const file of ['index.html', 'style.css', 'sw.js', 'CNAME', 'js/core.js', 'js/study-data.js', 'js/study-tools.js', 'js/practice.js', 'js/training.js', 'js/reading.js', 'js/articles-ui.js', 'js/mobile-pwa.js', 'js/app.js']) {
    assert.ok(existsSync(file), `Нет файла ${file}`);
  }
});
