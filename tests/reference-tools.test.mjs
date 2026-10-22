import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const read = file => readFileSync(file, 'utf8');
const articles = Array.from({ length: 9 }, (_, i) => read(`chapters/chapter${i + 1}.html`)).join('\n');
const api = vm.runInNewContext(`${read('js/reference-tools.js')}; ({ RIGHTS_REFERENCE, NUMBERS_REFERENCE, keyboardLayoutAlternative })`, {
    getArticleSearchResults: query => /^(права|Права|статья 11|жизнь)$/.test(query) ? [{}] : []
});

test('справочники содержат уникальные нормы с рабочими статьями и условиями', () => {
    assert.ok(api.RIGHTS_REFERENCE.length >= 40);
    assert.ok(api.NUMBERS_REFERENCE.length >= 45);
    for (const list of [api.RIGHTS_REFERENCE, api.NUMBERS_REFERENCE]) {
        assert.equal(new Set(list.map(item => item.title)).size, list.length);
        for (const item of list) {
            assert.ok(articles.includes(`id="art${item.article}"`), item.title);
            assert.ok(item.note.length >= 20, item.title);
            assert.ok(item.part !== undefined);
        }
    }
});

test('охрана здоровья для каждого отделена от конституционной формулировки о бесплатной помощи гражданам', () => {
    const health = api.RIGHTS_REFERENCE.filter(item => item.article === '41');
    assert.equal(health.length, 2);
    assert.ok(health.some(item => item.group === 'everyone'));
    assert.ok(health.some(item => item.group === 'citizens'));
    assert.match(api.RIGHTS_REFERENCE.find(item => item.article === '62').note, /федеральным законом или международным договором/);
    assert.equal(api.RIGHTS_REFERENCE.find(item => item.title === 'Передвижение и выбор места жительства').group, 'conditions');
});

test('у важных чисел сохранены оговорки о сроках, большинстве и исключениях', () => {
    const numbers = api.NUMBERS_REFERENCE;
    assert.match(numbers.find(item => item.article === '95' && item.value === '6 лет').note, /не общий срок всех сенаторов/);
    assert.match(numbers.find(item => item.article === '109' && item.value === '1 год').note, /Именно по основаниям статьи 117/);
    assert.match(numbers.find(item => item.article === '105' && item.value === '14 дней').note, /обязательное рассмотрение/);
    assert.match(numbers.find(item => item.article === '111' && item.value === '3 отклонения').note, /не автоматический/);
    assert.ok(numbers.some(item => item.article === '108' && item.value === 'Не менее 3/4'));
});

test('подсказка раскладки появляется только при осмысленной альтернативе без исходных результатов', () => {
    assert.equal(api.keyboardLayoutAlternative('ghfdf'), 'права');
    assert.equal(api.keyboardLayoutAlternative('Ghfdf'), 'Права');
    assert.equal(api.keyboardLayoutAlternative('cnfnmz 11'), 'статья 11');
    assert.equal(api.keyboardLayoutAlternative(';bpym'), 'жизнь');
    for (const query of ['права', '111', 'a', 'PrepMate', 'права abc', '<img src=x>']) assert.equal(api.keyboardLayoutAlternative(query), '');
});
