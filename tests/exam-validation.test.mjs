import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const read = path => readFileSync(path, 'utf8');
const official = vm.runInNewContext(`${read('js/official-exam.js')}; ({ OFFICIAL_TASKS_13, OFFICIAL_TASKS_23 })`);
const authorPractice = vm.runInNewContext(`${read('js/practice.js')}; ({ FIND_ERROR_TASKS })`);

test('каждая позиция №13 имеет ровно один допустимый ключ, а в №23 — три ориентира', () => {
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
  }
});

test('в каждом задании «Исправь утверждение» есть один корректный индекс ответа', () => {
  assert.ok(authorPractice.FIND_ERROR_TASKS.length >= 18);
  for (const task of authorPractice.FIND_ERROR_TASKS) {
    assert.equal(task.options.length, 4, task.statement);
    assert.ok(Number.isInteger(task.correct) && task.correct >= 0 && task.correct < 4, task.statement);
    assert.equal(new Set(task.options).size, 4, task.statement);
  }
});
