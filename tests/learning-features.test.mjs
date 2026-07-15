import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const read = file => readFileSync(file, 'utf8');
const core = read('js/core.js');
const transfer = read('js/data-transfer.js');
const training = read('js/training.js');
const practice = read('js/practice.js');
const chapter1 = read('chapters/chapter1.html');
const html = read('index.html');

test('статья 15 содержит учебную схему федеральной иерархии НПА с оговоркой о компетенции', () => {
  for (const text of ['Конституция РФ', 'Федеральные конституционные законы', 'Федеральные законы', 'Указы и распоряжения Президента РФ', 'Постановления и распоряжения Правительства РФ', 'статья 76']) {
    assert.match(chapter1, new RegExp(text));
  }
  assert.match(chapter1, /Упрощённая иерархия/);
});

test('обновления используют версионирование хранилища без очистки учебного прогресса', () => {
  assert.match(core, /DATA_SCHEMA_VERSION/);
  assert.match(core, /TRAINING_SESSIONS/);
  assert.doesNotMatch(core, /localStorage\.clear\s*\(/);
});

test('QR-перенос объединяет прогресс, статусы, избранное и рекорд', () => {
  for (const id of ['progressTransferBtn', 'mobileProgressTransfer', 'progressTransferDialog', 'transferImportDialog']) {
    assert.match(html, new RegExp(`id="${id}"`));
  }
  assert.match(transfer, /applyTransferredProgress/);
  assert.match(transfer, /Math\.max\(currentHighscore/);
  assert.match(transfer, /~r:/);
  assert.doesNotMatch(transfer, /btoa\s*\(/);
  assert.doesNotMatch(transfer, /localStorage\.clear\s*\(/);
});

test('незаконченные тренажёры сохраняют текущий вопрос', () => {
  for (const name of ['powers', 'task23', 'mixed']) {
    assert.ok(training.includes(`saveTrainingSession('${name}'`));
    assert.ok(training.includes(`getTrainingSession('${name}'`));
  }
  assert.match(practice, /saveTrainingSession\('findError'/);
  assert.match(practice, /getTrainingSession\('findError'/);
});

test('карточки поддерживают горизонтальные свайпы, а тренажёры — клавиши 1–5', () => {
  assert.match(training, /pointerdown/);
  assert.match(training, /pointerup/);
  assert.match(training, /Math\.abs\(deltaX\) < 48/);
  assert.match(training, /\^\[1-5\]\$/);
  assert.match(training, /setNumberedButtonContent/);
});
