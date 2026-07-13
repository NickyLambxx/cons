import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const read = (path) => readFileSync(path, 'utf8');
const scriptFiles = ['core.js', 'study-data.js', 'practice.js', 'training.js', 'reading.js', 'articles-ui.js', 'mobile-pwa.js', 'app.js'];
const appSource = scriptFiles.map((file) => read(`js/${file}`)).join('\n');
const studyDataSource = read('js/study-data.js');
const studyData = vm.runInNewContext(`${studyDataSource}; ({ DICTIONARY, POWERS, FLASHCARD_TERMS })`);
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

test('база задания 23 структурно корректна и учитывает поправки 2020 года', () => {
  const tasks = extractLiteral('TASKS_23');
  assert.equal(tasks.length, 39);
  for (const task of tasks) {
    assert.ok(task.question.length > 3);
    assert.equal(new Set(task.options.map(({ id }) => id)).size, task.options.length);
    assert.ok(task.options.filter(({ correct }) => correct).length >= 3, task.question);
  }

  const federationCouncil = tasks.find(({ question }) => question === 'Полномочия Совета Федерации');
  assert.ok(federationCouncil.options.some(({ text, correct }) => correct && text.includes('консультаций по кандидатуре Генерального прокурора')));

  const dissolution = tasks.find(({ question }) => question.startsWith('Случаи, когда Государственная Дума'));
  assert.ok(dissolution.options.some(({ text, correct }) => correct && text.includes('по основаниям статьи 117')));

  const secular = tasks.find(({ question }) => question.includes('светское государство'));
  assert.equal(secular.options.filter(({ correct }) => correct).length, 3);

  const presumption = tasks.find(({ question }) => question.includes('презумпции невиновности'));
  assert.ok(presumption.options.some(({ text, correct }) => !correct && text.includes('свидетельствовать против самого себя')));

  assert.ok(!tasks.some(({ question }) => question === 'Социальные права граждан РФ'));
  assert.doesNotMatch(JSON.stringify(tasks), /Высшие органы власти являются выборными и сменяемыми|Неприкосновенность жилища без судебного решения/);
});

test('словарь не содержит устаревшее определение прожиточного минимума', () => {
  const dictionary = studyData.DICTIONARY;
  assert.equal(Object.keys(dictionary).length, 80);
  assert.doesNotMatch(dictionary['прожиточный минимум'], /стоимостная оценка потребительской корзины/i);
});

test('тренажёр полномочий содержит только уникальные актуальные формулировки и Конституционный Суд', () => {
  const powers = studyData.POWERS;
  assert.equal(powers.length, 99);
  assert.equal(new Set(powers.map(({ text }) => text)).size, powers.length);
  assert.deepEqual([...new Set(powers.map(({ target }) => target))].sort(), ['gd', 'gov', 'ks', 'president', 'sf']);
  assert.ok(powers.filter(({ target }) => target === 'ks').length >= 8);
  assert.doesNotMatch(JSON.stringify(powers), /с согласия ГД|Представление Совету Федерации кандидатуры Генпрокурора|по представлению Президента\)"?,?"?target":"sf/);
  assert.match(read('index.html'), /data-target="ks">Конституционный Суд РФ/);
});

test('словарь и карточки используют точные определения без служебных дублей', () => {
  const { DICTIONARY: dictionary, FLASHCARD_TERMS: terms } = studyData;
  assert.match(dictionary.демократия, /народ признаётся источником власти/);
  assert.doesNotMatch(dictionary.демократия, /форма государственного устройства/i);
  assert.ok(dictionary['государственная дума']);
  assert.ok(!dictionary.думе);
  assert.match(dictionary['муниципальное образование'], /муниципальный округ/);

  for (const excluded of ['лицензирование', 'охрана', 'республиканская', 'светское', 'собрание', 'социальное', 'убежище политическое']) {
    assert.ok(!terms.includes(excluded), `Лишняя карточка: ${excluded}`);
  }
  assert.equal(new Set(terms).size, terms.length);
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
  assert.match(read('js/training.js'), /const div = document\.createElement\('button'\)/);
  assert.match(appSource, /aria-expanded/);
  for (const label of ['Добавить заметку', 'Создать цитату', 'Добавить в избранное', 'Скопировать ссылку на статью']) {
    assert.match(index, new RegExp(`aria-label="${label}"`));
  }
});

test('кэш приложения обновлён после изменения учебных данных', () => {
  assert.match(read('sw.js'), /prep-mate-v22/);
});
