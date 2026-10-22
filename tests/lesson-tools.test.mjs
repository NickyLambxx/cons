import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const source = readFileSync('js/lesson-tools.js', 'utf8');
const schemes = vm.runInNewContext(`${source}; PROCEDURE_SCHEMES`);
const chapterText = Array.from({ length: 9 }, (_, i) => readFileSync(`chapters/chapter${i + 1}.html`, 'utf8')).join('\n');

test('режим урока изолирует попытки и черновики от личного прогресса', () => {
    const storage = new Map();
    let lessonMode = false;
    const sandbox = {
        document: { body: { classList: { contains: () => lessonMode } } },
        localStorage: { getItem: key => storage.get(key) || null, setItem: (key, value) => storage.set(key, value) }
    };
    const api = vm.runInNewContext(`${readFileSync('js/core.js', 'utf8')}; ({ saveTrainingSession, clearTrainingSession, getTrainingSession, recordTrainingResult })`, sandbox);
    api.saveTrainingSession('task13', { index: 7 });
    api.recordTrainingResult('task13', 2, 2);
    const before = [...storage.entries()];
    lessonMode = true;
    assert.equal(api.getTrainingSession('task13'), null);
    api.saveTrainingSession('task13', { index: 0 });
    assert.equal(api.getTrainingSession('task13').index, 0);
    api.recordTrainingResult('task13', 0, 2);
    api.clearTrainingSession('task13');
    assert.deepEqual([...storage.entries()], before);
    lessonMode = false;
    assert.equal(api.getTrainingSession('task13').index, 7);
});

test('три схемы ведут только к существующим статьям и содержат основной маршрут и развилки', () => {
    assert.equal(schemes.length, 3);
    for (const scheme of schemes) {
        assert.ok(scheme.steps.length >= 4);
        assert.ok(scheme.branches.length >= 1);
        for (const [article, title, text] of [...scheme.steps, ...scheme.branches]) {
            assert.ok(chapterText.includes(`id="art${article}"`), `${scheme.id}: статья ${article}`);
            assert.ok(title.length > 5 && text.length > 30);
        }
    }
});

test('схемы различают пороги ФЗ и ФКЗ, обязательное рассмотрение и особый порядок министров', () => {
    const law = schemes.find(s => s.id === 'federal-law');
    const fkz = schemes.find(s => s.id === 'constitutional-law');
    const government = schemes.find(s => s.id === 'government');
    assert.match(JSON.stringify(law), /106.*рассмотрение обязательно/);
    assert.match(JSON.stringify(law), /не менее двух третей.*сенаторов.*не менее двух третей.*депутатов/);
    assert.match(JSON.stringify(fkz), /двух третей.*депутатов/);
    assert.match(JSON.stringify(fkz), /трёх четвертей.*сенаторов/);
    assert.match(JSON.stringify(government), /после консультаций с Советом Федерации/);
    assert.match(JSON.stringify(government), /Роспуск не является автоматическим/);
});
