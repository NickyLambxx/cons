import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const source = readFileSync('js/practice.js', 'utf8');
const data = vm.runInNewContext(`${source}; ({ ARGUMENT_BANK, FIND_ERROR_TASKS })`);

test('банк содержит готовые аргументы с конституционными источниками', () => {
  assert.equal(data.ARGUMENT_BANK.length, 50);
  assert.ok(new Set(data.ARGUMENT_BANK.map(item => item.topic)).size >= 8);
  for (const item of data.ARGUMENT_BANK) {
    assert.match(item.article, /^Стать(?:я \d+|и \d+(?:, \d+)+)$/);
    assert.ok(item.text.length > 70, item.title);
  }
  assert.equal(new Set(data.ARGUMENT_BANK.map(item => `${item.article}:${item.title}`)).size, data.ARGUMENT_BANK.length);
});

test('тренажёр ошибок структурно корректен и не закрепляет неверные формулировки', () => {
  assert.equal(data.FIND_ERROR_TASKS.length, 50);
  for (const task of data.FIND_ERROR_TASKS) {
    assert.equal(task.options.length, 4, task.statement);
    assert.ok(task.correct >= 0 && task.correct < task.options.length);
    assert.ok(task.explanation.length > 20);
    assert.equal(new Set(task.options).size, task.options.length);
  }
  assert.match(source, /не может быть государственной или обязательной/);
  assert.match(source, /не может быть лишён гражданства/);
  assert.match(source, /более чем на 48 часов/);
  assert.doesNotMatch(source, /можно задержать на срок до 72 часов[^\n]+correct/);
  assert.match(source, /findErrorState\.completed/);
  assert.match(source, /textContent = 'Начать заново'/);
  assert.doesNotMatch(source, /findErrorState\.index === findErrorState\.tasks\.length - 1 \? 'Показать результат'/);
});

test('старая сохранённая серия заменяется актуальными 50 заданиями без сброса других данных', () => {
  const context = vm.createContext({});
  vm.runInContext(source, context);
  const result = vm.runInContext(`(() => {
    const old = { tasks: FIND_ERROR_TASKS.slice(0, 36), index: 8, score: 5 };
    const cleared = [];
    globalThis.getTrainingSession = key => key === 'findError' ? old : null;
    globalThis.clearTrainingSession = key => cleared.push(key);
    globalThis.shuffle = items => [...items];
    globalThis.showToast = () => {};
    renderFindErrorTask = () => {};
    globalThis.$ = () => ({ open: true });
    startFindErrorTraining();
    return { length: findErrorState.tasks.length, index: findErrorState.index, score: findErrorState.score, cleared };
  })()`, context);
  assert.equal(result.length, 50);
  assert.equal(result.index, 0);
  assert.equal(result.score, 0);
  assert.deepEqual([...result.cleared], ['findError']);
});

test('в вариантах исправления нет заведомо посторонних работодателей и школ', () => {
  const options = data.FIND_ERROR_TASKS.flatMap(task => task.options.slice(1));
  assert.equal(options.filter(option => /работодатель|школа|банк|профсоюз/i.test(option)).length, 0);
});

test('актуальная незавершённая серия продолжает сохраняться', () => {
  const context = vm.createContext({});
  vm.runInContext(source, context);
  const result = vm.runInContext(`(() => {
    const saved = { version: FIND_ERROR_BANK_VERSION, tasks: FIND_ERROR_TASKS, index: 8, score: 5 };
    globalThis.getTrainingSession = () => saved;
    globalThis.showToast = () => {};
    globalThis.$ = () => ({ open: true });
    renderFindErrorTask = () => {};
    startFindErrorTraining();
    return { length: findErrorState.tasks.length, index: findErrorState.index, score: findErrorState.score };
  })()`, context);
  assert.equal(result.length, 50);
  assert.equal(result.index, 8);
  assert.equal(result.score, 5);
});
