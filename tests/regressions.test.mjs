import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const read = path => readFileSync(path, 'utf8');
const html = read('index.html');
const css = read('style.css');
const reading = read('js/reading.js');
const mobile = read('js/mobile-pwa.js');
const articles = read('js/articles-ui.js');
const training = read('js/training.js');

test('поиск по номеру статьи точный, а нечёткий поиск допускает только одну опечатку', () => {
  assert.match(reading, /\^\(\?:статья\\s\+\)\?\(\\d\+/);
  assert.match(reading, /levenshtein\(word, normalizedQuery\) === 1/);
  assert.doesNotMatch(reading, /dist <= 2/);
  assert.match(mobile, /getArticleSearchResults\(q, state\.articles\)/);
});

test('переход из поиска и заметок выравнивает начало статьи', () => {
  assert.match(reading, /function scrollArticleToTop/);
  assert.match(mobile, /scrollArticleToTop\(target\)/);
  assert.match(reading, /note\.hidden = false/);
  assert.match(reading, /function revealSavedNote|const revealSavedNote/);
  assert.match(reading, /focus\(\{ preventScroll: true \}\)/);
  assert.match(articles, /visualViewport\.addEventListener\('resize'/);
});

test('тёмные списки, закреплённая панель и мобильные диалоги имеют защитные стили', () => {
  assert.match(css, /color-scheme: dark/);
  assert.match(css, /select option/);
  assert.match(css, /\.sidebar \{[\s\S]*position: sticky/);
  assert.match(css, /#dictionaryDialog\[open\]/);
  assert.match(css, /\.mobile-search-banner \{[\s\S]*position: static/);
});

test('быстрые действия в словаре и миксе защищены от повторных переходов', () => {
  assert.match(articles, /cancelAnimationFrame\(renderFrame\)/);
  assert.match(training, /mixedTraining\.transitioning/);
  assert.match(training, /next\.disabled = true/);
});

test('все новые элементы управления присутствуют, а кэш обновлён', () => {
  for (const id of ['resetHighscoreDialog', 'nextGameQuestionBtn', 'mixedNext', 'dictionaryDialog']) {
    assert.match(html, new RegExp(`id="${id}"`));
  }
  assert.match(read('sw.js'), /prep-mate-v30/);
  assert.match(mobile, /7000/);
  assert.match(mobile, /if \(e\.target === dlg\) dlg\.close\(\)/);
});
