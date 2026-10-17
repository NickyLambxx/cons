import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

test('icon-only controls have accessible names', () => {
  const html = readFileSync('index.html', 'utf8');
  const ids = [
    'searchTriggerBtn', 'resetProgressBtn', 'mobileSearchClose',
    'zoomIn', 'zoomOut', 'zoomReset', 'resetGame23', 'closeGame23',
    'resetFlashcards', 'closeFlashcards', 'closeShare', 'fontDec',
    'fontInc', 'lhDec', 'lhInc', 'closeGame', 'resetHighscoreBtn',
  ];

  for (const id of ids) {
    const button = html.match(new RegExp(`<button[^>]*id="${id}"[^>]*>`))?.[0];
    assert.ok(button, `Missing button #${id}`);
    assert.match(button, /aria-label="[^"]+"/, `Missing accessible name for #${id}`);
  }
});

test('task 23 drill explains the real exam response format', () => {
  const html = readFileSync('index.html', 'utf8');
  const exam = readFileSync('js/official-exam.js', 'utf8');
  assert.match(html, /id="task23Instruction"/);
  assert.match(exam, /Каждый пункт ответа сформулируйте отдельным распространённым предложением/);
  assert.match(exam, /распространённым предложением с опорой на конкретное положение Конституции РФ/);
  assert.match(exam, /<textarea rows=/);
});
