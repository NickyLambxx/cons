import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const source = readFileSync('js/mobile-pwa.js', 'utf8');

test('история мобильного поиска экранирует импортированный запрос', () => {
  const container = { innerHTML: '', querySelectorAll: () => [] };
  const sandbox = {
    $: () => container,
    state: { searchHistory: ['"><img src=x onerror=alert(1)>'] },
    escapeHTML: value => String(value).replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]))
  };
  vm.runInNewContext(`${source}\nshowMobileSearchHistory();`, sandbox);
  assert.doesNotMatch(container.innerHTML, /<img/);
  assert.match(container.innerHTML, /&lt;img/);
  assert.match(container.innerHTML, /<button type="button" class="mobile-search-result-item mobile-history-item"/);
});

test('результаты поиска и карточка имеют клавиатурное управление', () => {
  const html = readFileSync('index.html', 'utf8');
  const training = readFileSync('js/training.js', 'utf8');
  assert.match(source, /<button type="button" class="mobile-search-result-item"/);
  assert.match(source, /Показать все \$\{allResults\.length\} статей/);
  assert.match(html, /id="flashcard"[^>]*role="button"[^>]*tabindex="0"/);
  assert.match(training, /safeAddListener\('#flashcard', 'keydown'/);
});
