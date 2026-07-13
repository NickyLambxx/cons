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
    assert.match(item.article, /^Статья \d+$/);
    assert.ok(item.text.length > 70, item.title);
  }
  assert.equal(new Set(data.ARGUMENT_BANK.map(item => `${item.article}:${item.title}`)).size, data.ARGUMENT_BANK.length);
});

test('тренажёр ошибок структурно корректен и не закрепляет неверные формулировки', () => {
  assert.equal(data.FIND_ERROR_TASKS.length, 36);
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
