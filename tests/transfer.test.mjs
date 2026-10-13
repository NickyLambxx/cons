import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const source = readFileSync('js/data-transfer.js', 'utf8');

function setup() {
  const values = new Map();
  const LS = Object.fromEntries(['THEME', 'FAVORITES', 'FAV_FOLDERS', 'ARTICLE_FOLDERS', 'NOTES', 'FONT', 'FONT_TYPE', 'HIGHSCORE', 'SEARCH', 'SEARCH_SCOPE', 'PROGRESS', 'ARTICLE_STATUS', 'TRAINING_SESSIONS', 'TRAINING_RESULTS', 'MOBILE_PINNED'].map(key => [key, key]));
  const context = {
    LS,
    state: { progress: { art1: 1 }, favorites: new Set(['art2']), articleStatuses: { art1: 'mastered' } },
    localStorage: { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) },
    loadTrainingResults: () => JSON.parse(values.get(LS.TRAINING_RESULTS) || '{}'),
    location: { origin: 'https://example.test', pathname: '/' }
  };
  const api = vm.runInNewContext(`${source}; ({ encodeTransferData, decodeTransferData, applyTransferredProgress, mergeBackupObject, FULL_BACKUP_KEYS })`, context);
  return { values, LS, api };
}

test('QR переносит результаты четырёх тренировок и не уничтожает текущий прогресс', () => {
  const { values, LS, api } = setup();
  values.set(LS.TRAINING_RESULTS, JSON.stringify({ task13: { best: 2, attempts: 3, bestTotal: 2 }, mixed: { best: 8, attempts: 1, bestTotal: 10 } }));
  const payload = api.decodeTransferData(api.encodeTransferData());
  assert.equal(payload.t.length, 4);
  assert.equal(payload.t[0].best, 2);
  assert.equal(payload.t[2].best, 8);
  values.set(LS.PROGRESS, JSON.stringify({ art3: 1 }));
  api.applyTransferredProgress(payload);
  assert.deepEqual(JSON.parse(values.get(LS.PROGRESS)), { art3: 1, art1: 1 });
  assert.equal(JSON.parse(values.get(LS.TRAINING_RESULTS)).mixed.best, 8);
});

test('полная копия включает заметки, папки и незаконченные задания', () => {
  const { api, LS } = setup();
  for (const key of [LS.NOTES, LS.FAV_FOLDERS, LS.ARTICLE_FOLDERS, LS.TRAINING_SESSIONS, LS.TRAINING_RESULTS]) {
    assert.ok(api.FULL_BACKUP_KEYS.includes(key), key);
  }
  assert.equal(api.mergeBackupObject(LS.NOTES, JSON.stringify({ art11: 'Заметка' })), JSON.stringify({ art11: 'Заметка' }));
});
