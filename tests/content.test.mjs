import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const read = (path) => readFileSync(path, 'utf8');
const scriptFiles = ['core.js', 'study-data.js', 'practice.js', 'training.js', 'reading.js', 'articles-ui.js', 'mobile-pwa.js', 'app.js'];
const appSource = scriptFiles.map((file) => read(`js/${file}`)).join('\n');
const studyDataSource = read('js/study-data.js');
const studyData = vm.runInNewContext(`${studyDataSource}; ({ DICTIONARY, FLASHCARD_TERMS })`);
const officialExamSource = read('js/official-exam.js');
const officialData = vm.runInNewContext(`${officialExamSource}; ({ OFFICIAL_TASKS_13, OFFICIAL_TASKS_23 })`);
const chaptersSource = Array.from({ length: 9 }, (_, index) => read(`chapters/chapter${index + 1}.html`)).join('\n');

function extractLiteral(name, source = appSource) {
  const declaration = source.indexOf(`const ${name} =`);
  assert.notEqual(declaration, -1, `Не найдены данные ${name}`);

  const arrayStart = source.indexOf('[', declaration);
  const objectStart = source.indexOf('{', declaration);
  const start = arrayStart !== -1 && (objectStart === -1 || arrayStart < objectStart) ? arrayStart : objectStart;
  const opening = source[start];
  const closing = opening === '[' ? ']' : '}';
  let depth = 0;
  let quote = null;
  let escaped = false;

  for (let index = start; index < source.length; index += 1) {
    const char = source[index];
    if (quote) {
      if (escaped) escaped = false;
      else if (char === '\\') escaped = true;
      else if (char === quote) quote = null;
      continue;
    }
    if (char === '"' || char === "'" || char === '`') {
      quote = char;
      continue;
    }
    if (char === opening) depth += 1;
    if (char === closing) {
      depth -= 1;
      if (depth === 0) return vm.runInNewContext(`(${source.slice(start, index + 1)})`);
    }
  }

  throw new Error(`Не удалось прочитать ${name}`);
}

test('текст статьи 93 содержит действующую формулировку о бывшем Президенте', () => {
  const article = read('chapters/chapter4.html').match(/id="art93"[\s\S]*?<div class="explanation-source">/)?.[0] ?? '';
  assert.match(article, /Президента Российской Федерации, прекратившего исполнение своих полномочий, считается отклоненным/);
});

test('таймер не содержит устаревшую дату экзамена', () => {
  assert.match(appSource, /ЕГЭ завершён/);
  assert.doesNotMatch(appSource, /2026-06-11|ЕГЭ уже идет/);
});

test('№23 различает материалы ФИПИ и книжные адаптации с тремя объяснениями', () => {
  const tasks = officialData.OFFICIAL_TASKS_23;
  assert.equal(tasks.length, 40);
  assert.equal(tasks.filter(task => task.sourceKind === 'book').length, 5);
  for (const task of tasks) {
    if (task.sourceKind === 'book') assert.ok(!task.source, task.id);
    else assert.match(task.source, /^https:\/\/(?:doc\.fipi\.ru|ege\.fipi\.ru\/bank|pro-schools\.ru\/fipi\/ege\/variant\/2025)\//);
    assert.equal(task.points.length, 3, task.id);
    assert.ok(task.points.every(point => point.length > 35), task.id);
  }
  assert.doesNotMatch(appSource, /const TASKS_23 =/);
});

test('словарь не содержит устаревшее определение прожиточного минимума', () => {
  const dictionary = studyData.DICTIONARY;
  assert.equal(Object.keys(dictionary).length, 80);
  assert.doesNotMatch(dictionary['прожиточный минимум'], /стоимостная оценка потребительской корзины/i);
});

test('словарь не сводит любой референдум к общероссийскому голосованию', () => {
  assert.match(studyData.DICTIONARY.референдум, /субъекта РФ или муниципального образования/);
  assert.doesNotMatch(studyData.DICTIONARY.референдум, /всенародное голосование/);
});

test('№13 соответствует формату пяти позиций и проверенным ключам', () => {
  const tasks = officialData.OFFICIAL_TASKS_13;
  assert.equal(tasks.length, 56);
  assert.equal(tasks.filter(task => task.sourceKind === 'book').length, 6);
  for (const task of tasks) {
    if (task.sourceKind === 'book') assert.ok(!task.source, task.id);
    else assert.match(task.source, /^https:\/\/(?:doc\.fipi\.ru|ege\.fipi\.ru\/bank|pro-schools\.ru\/fipi\/ege\/variant\/2025)\//);
    assert.equal(task.prompts.length, 5, task.id);
    assert.match(task.answer, /^[1-3]{5}$/, task.id);
    assert.equal(new Set(task.prompts).size, 5, task.id);
  }
  assert.equal(tasks.find(task => task.id === '2027-demo').answer, '21231');
  assert.equal(tasks.find(task => task.id === '2026-demo').answer, '21312');
  assert.equal(tasks.find(task => task.id === '2025-demo').answer, '21112');
  assert.equal(tasks.find(task => task.id === '2025-open').answer, '12122');
  assert.equal(tasks.find(task => task.id === 'book-2026-1').answer, '21121');
  assert.equal(tasks.find(task => task.id === 'book-2026-2').answer, '13213');
  assert.equal(tasks.find(task => task.id === 'book-2025-1').answer, '12212');
  assert.equal(tasks.find(task => task.id === 'book-2025-2').answer, '23312');
  assert.equal(tasks.find(task => task.id === 'book-2025-4').answer, '11232');
  assert.equal(tasks.find(task => task.id === 'book-2023-4').answer, '12211');
  assert.doesNotMatch(studyDataSource, /const POWERS =/);
});

test('словарь и карточки используют точные определения без служебных дублей', () => {
  const { DICTIONARY: dictionary, FLASHCARD_TERMS: terms } = studyData;
  assert.match(dictionary.демократия, /народ признаётся источником власти/);
  assert.doesNotMatch(dictionary.демократия, /форма государственного устройства/i);
  assert.ok(dictionary['государственная дума']);
  assert.ok(!dictionary.думе);
  assert.match(dictionary['муниципальное образование'], /муниципальный округ/);

  for (const excluded of ['охрана', 'республиканская', 'светское', 'собрание', 'социальное', 'убежище политическое']) {
    assert.ok(!dictionary[excluded], `Дублирующий словарный термин: ${excluded}`);
  }
  assert.equal(new Set(terms).size, terms.length);
  assert.equal(terms.length, Object.keys(dictionary).length);
  assert.match(appSource, /\[\.\.\.FLASHCARD_TERMS\]/);
});

test('проверенные устаревшие цифры и формулировки удалены', () => {
  const combined = `${appSource}\n${chaptersSource}`;
  for (const obsolete of ['22 440 рублей', '19 242 рубля', '21 000 рублей в 2025', '12 обычных граждан', 'и в СФ (3/4 сенаторов)']) {
    assert.ok(!combined.includes(obsolete), `Осталась устаревшая формулировка: ${obsolete}`);
  }
});

test('динамические кнопки оглавления и карточек доступны с клавиатуры', () => {
  const index = read('index.html');
  assert.match(appSource, /document\.createElement\('button'\)/);
  assert.match(read('js/official-exam.js'), /document\.createElement\('select'\)/);
  assert.match(appSource, /aria-expanded/);
  for (const label of ['Добавить заметку', 'Создать цитату', 'Добавить в избранное', 'Скопировать ссылку на статью']) {
    assert.match(index, new RegExp(`aria-label="${label}"`));
  }
});

test('кэш приложения обновлён после изменения учебных данных', () => {
  assert.match(read('sw.js'), /prep-mate-v47/);
});
