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

test('чистые цифры ищутся по всему тексту, а точный номер включается только словом статья', () => {
  assert.match(reading, /\^статья\\s\+\(\\d\+/);
  assert.doesNotMatch(reading, /levenshtein/);
  assert.match(reading, /visibleText\.includes\(normalizedQuery\)/);
  assert.match(mobile, /getArticleSearchResults\(q, state\.articles\)/);
});

test('переход из поиска выравнивает совпадение, а заметка открывается без отложенного повторного рендера', () => {
  assert.match(reading, /function scrollArticleToTop/);
  assert.match(reading, /function scrollSearchMatchToTop/);
  assert.match(mobile, /scrollSearchMatchToTop\(target, 'auto'\)/);
  assert.match(reading, /note\.hidden = false/);
  assert.doesNotMatch(reading, /setTimeout\(revealSavedNote/);
  assert.match(reading, /focus\(\{ preventScroll: true \}\)/);
  assert.match(articles, /visualViewport\.addEventListener\('resize'/);
});

test('тёмные списки, закреплённая панель и мобильные диалоги имеют защитные стили', () => {
  assert.match(css, /color-scheme: dark/);
  assert.match(css, /select option/);
  assert.match(css, /\.sidebar \{[\s\S]*position: sticky/);
  assert.match(css, /#dictionaryDialog\[open\]/);
  assert.match(css, /\.mobile-search-banner \{[\s\S]*position: static/);
  assert.match(css, /#gamePlayScreen \{[\s\S]*overflow-y: auto/);
  assert.match(css, /\.flashcard \.back::\-webkit\-scrollbar/);
});

test('печать раскрывает пояснения и скрывает элементы прогресса', () => {
  assert.match(mobile, /window\.addEventListener\('beforeprint'/);
  assert.match(mobile, /item\.details\.open = true/);
  assert.match(css, /@media print \{[\s\S]*\.card-footer[\s\S]*display: none !important/);
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
  assert.match(read('sw.js'), /prep-mate-v32/);
  assert.match(mobile, /7000/);
  assert.match(mobile, /if \(e\.target === dlg\) dlg\.close\(\)/);
});
