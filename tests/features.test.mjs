import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const read = path => readFileSync(path, 'utf8');
const html = read('index.html');
const css = read('style.css');
const tools = read('js/study-tools.js');
const training = read('js/training.js');
const practice = read('js/practice.js');

test('учебные фильтры и статусы подключены', () => {
  for (const id of ['chapterFilter', 'examFilter', 'statusFilter', 'resetStudyFilters', 'filterSummary']) assert.match(html, new RegExp(`id="${id}"`));
  assert.match(tools, /function applyStudyFilters/);
  assert.match(tools, /ARTICLE_STATUS/);
  assert.match(html, /class="article-status"/);
  assert.match(html, /class="importance-badge"/);
});

test('поиск есть в словаре и заметках, словарь имеет алфавит', () => {
  for (const id of ['dictionarySearch', 'dictionaryAlphabet', 'dictionaryCount', 'notesSearch']) assert.match(html, new RegExp(`id="${id}"`));
  assert.match(read('js/articles-ui.js'), /renderDictionary/);
  assert.match(read('js/reading.js'), /renderNotes/);
});

test('смешанная тренировка и тематические колоды доступны на компьютере и телефоне', () => {
  for (const id of ['mixedTrainingBtn', 'mobileMixedTraining', 'mixedTrainingDialog', 'flashcardDeck']) assert.match(html, new RegExp(`id="${id}"`));
  assert.match(training, /function createMixedQuestions/);
  assert.match(training, /function getFlashcardDeck/);
});

test('сброс прогресса требует подтверждения и поддерживает отмену', () => {
  for (const id of ['resetProgressDialog', 'confirmResetProgress', 'cancelResetProgress', 'undoProgressBtn']) assert.match(html, new RegExp(`id="${id}"`));
  const events = read('js/mobile-pwa.js');
  assert.match(events, /resetSnapshot/);
  assert.match(events, /Прогресс восстановлен/);
});

test('мобильные цели касания имеют минимум 44px и кнопка чтения не обрезается', () => {
  assert.match(css, /button, \.btn, \.nav-item, \.sheet-tool-btn, \.toc-chapter-header \{ min-height: 44px/);
  assert.match(css, /\.btn-read \{ width: 100%/);
  assert.match(css, /\.study-filter-grid \{ grid-template-columns: 1fr/);
});

test('жизненные ситуации полностью удалены', () => {
  assert.doesNotMatch(html, /practice-situation|Жизненная ситуация/);
  assert.doesNotMatch(read('js/articles-ui.js'), /ARTICLE_PRACTICE/);
  assert.doesNotMatch(practice, /const ARTICLE_PRACTICE/);
});

test('задание 13 подтверждает сброс и оставляет ошибочный ответ на экране', () => {
  for (const id of ['resetHighscoreDialog', 'cancelResetHighscore', 'confirmResetHighscore', 'nextGameQuestionBtn']) {
    assert.match(html, new RegExp(`id="${id}"`));
  }
  assert.match(training, /if \(isCorrect\)[\s\S]+setTimeout\(nextQuestion, 1500\)[\s\S]+nextButton\.hidden = false/);
});

test('банк аргументов и тренажёр ошибок доступны на компьютере и телефоне', () => {
  for (const id of ['argumentBankBtn', 'mobileArgumentBank', 'argumentBankDialog', 'argumentSearch', 'findErrorBtn', 'mobileFindError', 'findErrorDialog']) {
    assert.match(html, new RegExp(`id="${id}"`));
  }
  assert.match(practice, /function renderArgumentBank/);
  assert.match(practice, /function startFindErrorTraining/);
  assert.match(practice, /options\.indexOf\(correctText\)/);
});
