import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const read = path => readFileSync(path, 'utf8');
const official = vm.runInNewContext(`${read('js/official-exam.js')}; ({ OFFICIAL_TASKS_13, OFFICIAL_TASKS_23, TASK_23_CONTEXT, TASK_23_RESPONSE_INSTRUCTION })`);
const authorPractice = vm.runInNewContext(`${read('js/practice.js')}; ({ ARGUMENT_BANK, FIND_ERROR_TASKS })`);
const studyData = vm.runInNewContext(`${read('js/study-data.js')}; ({ DICTIONARY, FLASHCARD_TERMS })`);
const mixed = vm.runInNewContext(
  `${read('js/study-data.js')}\n${read('js/practice.js')}\n${read('js/official-exam.js')}\n${read('js/training.js')}\ncreateMixedQuestions()`
);
const normalize = value => value.toLocaleLowerCase('ru').replace(/ё/g, 'е')
  .replace(/российской федерации|российская федерация|российскую федерацию/g, 'рф')
  .replace(/[^а-я0-9]+/g, ' ').trim();
const uniqueCount = values => new Set(values.map(normalize)).size;

test('каждая позиция №13 имеет ровно один допустимый ключ, а в №23 — три ориентира', () => {
  assert.ok(official.OFFICIAL_TASKS_13.length >= 50);
  assert.equal(official.OFFICIAL_TASKS_13.length, 56);
  assert.equal(official.OFFICIAL_TASKS_23.length, 40);
  const ids = new Set();
  for (const task of official.OFFICIAL_TASKS_13) {
    assert.ok(!ids.has(task.id), `Дубль №13: ${task.id}`);
    ids.add(task.id);
    assert.equal(task.prompts.length, 5, task.id);
    assert.equal(task.answer.length, 5, task.id);
    for (const digit of task.answer) assert.ok(Number(digit) >= 1 && Number(digit) <= task.choices.length, `${task.id}: ${digit}`);
  }
  for (const task of official.OFFICIAL_TASKS_23) {
    assert.equal(task.points.length, 3, task.id);
    assert.ok(task.points.every(point => /[.!?]$/.test(point)), task.id);
    assert.equal(new Set(task.points).size, 3, task.id);
  }
});

test('все 40 заданий №23 показывают полное условие и требования к ответу', () => {
  assert.equal(Object.keys(official.TASK_23_CONTEXT).length, official.OFFICIAL_TASKS_23.length);
  assert.match(official.TASK_23_RESPONSE_INSTRUCTION, /распространённым предложением/);
  assert.match(official.TASK_23_RESPONSE_INSTRUCTION, /конкретное положение Конституции РФ/);
  for (const task of official.OFFICIAL_TASKS_23) {
    const context = official.TASK_23_CONTEXT[task.id];
    assert.ok(context?.length >= 60, `Нет вводной части: ${task.id}`);
    assert.match(context, /[.!?]$/, task.id);
    assert.ok(task.question.length >= 60, `Нет предметного требования: ${task.id}`);
    assert.match(task.question, /три|тремя/, `Нет требования дать три положения: ${task.id}`);
  }
  const html = read('index.html');
  for (const id of ['task23Context', 'task23Question', 'task23Instruction']) {
    assert.match(html, new RegExp(`id="${id}"`));
  }
  const renderer = read('js/official-exam.js');
  assert.match(renderer, /\$\('#task23Context'\)\.textContent = TASK_23_CONTEXT\[task\.id\]/);
  assert.match(renderer, /\$\('#task23Instruction'\)\.textContent = TASK_23_RESPONSE_INSTRUCTION/);
});

test('микс содержит 50 разных вопросов по трём разделам', () => {
  assert.equal(mixed.length, 50);
  assert.equal(uniqueCount(mixed.map(item => item.question)), 50);
  assert.equal(mixed.filter(item => item.type === 'Термины').length, 20);
  assert.equal(mixed.filter(item => item.type === 'Проверка формулировок').length, 15);
  assert.equal(mixed.filter(item => item.type === 'Полномочия и ведение').length, 15);
  for (const item of mixed) assert.ok(item.answers.includes(item.correct), item.question);
});

test('в миксе определения подбираются из тематически близкой группы', () => {
  const context = vm.createContext({});
  vm.runInContext(`${read('js/study-data.js')}\n${read('js/practice.js')}\n${read('js/official-exam.js')}\n${read('js/training.js')}`, context);
  const result = vm.runInContext(`(() => {
    const groups = MIXED_TERM_GROUPS;
    const allTerms = Object.keys(DICTIONARY);
    const covered = allTerms.every(term => groups.some(group => group.includes(term)));
    const questions = createMixedQuestions(true).filter(item => item.type === 'Термины');
    const valid = questions.every(item => {
      const term = item.question.match(/«(.+)»/)[1];
      return item.answers.every(answer => groups.some(group => group.includes(term) && group.some(candidate => DICTIONARY[candidate] === answer)));
    });
    return { covered, valid, count: questions.length };
  })()`, context);
  assert.equal(result.covered, true);
  assert.equal(result.valid, true);
  assert.equal(result.count, 80);
});

test('случайная сборка микса не создаёт повторов внутри серии', () => {
  const context = vm.createContext({});
  vm.runInContext(`${read('js/study-data.js')}\n${read('js/practice.js')}\n${read('js/official-exam.js')}\n${read('js/training.js')}`, context);
  for (let attempt = 0; attempt < 100; attempt += 1) {
    const questions = vm.runInContext('createMixedQuestions()', context);
    assert.equal(questions.length, 50);
    assert.equal(uniqueCount(questions.map(item => item.question)), 50);
    for (const item of questions) assert.equal(uniqueCount(item.answers), item.answers.length);
  }
});

test('незавершённая старая серия микса расширяется без потери ответов', () => {
  const context = vm.createContext({});
  vm.runInContext(`${read('js/study-data.js')}\n${read('js/practice.js')}\n${read('js/official-exam.js')}\n${read('js/training.js')}`, context);
  for (let attempt = 0; attempt < 100; attempt += 1) {
    const restored = vm.runInContext(`(() => {
      const oldQuestions = createMixedQuestions().slice(0, 20);
      const oldQuestionsSnapshot = JSON.stringify(oldQuestions);
      globalThis.getTrainingSession = () => ({ questions: oldQuestions, index: 7, score: 5 });
      const resumed = restoreMixedTrainingSession();
      return { resumed, questions: mixedTraining.questions, oldQuestionsSnapshot, index: mixedTraining.index, score: mixedTraining.score };
    })()`, context);
    assert.equal(restored.resumed, true);
    assert.equal(restored.questions.length, 50);
    assert.equal(JSON.stringify(restored.questions.slice(0, 20)), restored.oldQuestionsSnapshot);
    assert.equal(uniqueCount(restored.questions.map(item => item.question)), 50);
    assert.equal(restored.index, 7);
    assert.equal(restored.score, 5);
  }
});

test('проверенные формулировки №13 и №23 не искажают конституционные полномочия и запреты', () => {
  const competence = official.OFFICIAL_TASKS_13.find(task => task.id === 'bank-4AD197');
  assert.match(competence.prompts[2], /между органами государственной власти РФ и органами государственной власти субъектов РФ/);
  assert.equal(competence.answer[2], '1');
  const labour = official.OFFICIAL_TASKS_23.find(task => task.id === '2026-open');
  assert.match(labour.points[1], /Принудительный труд запрещён/);
  assert.doesNotMatch(labour.points[1], /вне установленных законом случаев/);
});

test('учебные банки не содержат одинаковых заданий, ответов и определений', () => {
  const task13 = official.OFFICIAL_TASKS_13;
  const task23 = official.OFFICIAL_TASKS_23;
  const errors = authorPractice.FIND_ERROR_TASKS;
  const argumentsBank = authorPractice.ARGUMENT_BANK;
  const terms = Object.keys(studyData.DICTIONARY);

  assert.equal(new Set(task13.map(task => task.id.toLowerCase())).size, task13.length);
  assert.equal(new Set(task13.map(task => task.prompts.map(normalize).sort().join('|'))).size, task13.length);
  assert.equal(new Set(task23.map(task => task.id.toLowerCase())).size, task23.length);
  assert.equal(uniqueCount(task23.map(task => task.question)), task23.length);
  assert.equal(new Set(task23.map(task => task.points.map(normalize).sort().join('|'))).size, task23.length);
  assert.equal(uniqueCount(errors.map(task => task.statement)), errors.length);
  assert.equal(uniqueCount(errors.map(task => task.options[task.correct])), errors.length);
  assert.equal(uniqueCount(argumentsBank.map(item => item.title)), argumentsBank.length);
  assert.equal(uniqueCount(argumentsBank.map(item => item.text)), argumentsBank.length);
  assert.equal(uniqueCount(terms), terms.length);
  assert.equal(uniqueCount(Object.values(studyData.DICTIONARY)), terms.length);
  assert.equal(uniqueCount(studyData.FLASHCARD_TERMS), terms.length);
  assert.deepEqual([...studyData.FLASHCARD_TERMS].sort(), [...terms].sort());
});

test('в каждом задании «Исправь утверждение» есть один корректный индекс ответа', () => {
  assert.ok(authorPractice.FIND_ERROR_TASKS.length >= 18);
  for (const task of authorPractice.FIND_ERROR_TASKS) {
    assert.equal(task.options.length, 4, task.statement);
    assert.ok(Number.isInteger(task.correct) && task.correct >= 0 && task.correct < 4, task.statement);
    assert.equal(new Set(task.options).size, 4, task.statement);
  }
});
