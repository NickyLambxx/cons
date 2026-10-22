import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const articles = Array.from({ length: 9 }, (_, i) => readFileSync(`chapters/chapter${i + 1}.html`, 'utf8')).join('\n');
const titles = [...articles.matchAll(/id="(art[^"]+)" data-title="([^"]+)"/g)].map(match => ({ id: match[1], title: match[2] }));
const escape = text => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const render = vm.runInNewContext(`${readFileSync('js/articles-ui.js', 'utf8')}; dictionaryDefinitionHTML`, { state: { articles: titles }, highlightPlainText: escape });
const dictionary = vm.runInNewContext(`${readFileSync('js/study-data.js', 'utf8')}; DICTIONARY`);

test('ссылки словаря сохраняют текст и ведут к существующим статьям, включая списки и диапазоны', () => {
    assert.equal(titles.length, 142);
    let links = 0;
    for (const definition of Object.values(dictionary)) {
        const html = render(definition, '');
        assert.equal(html.replace(/<[^>]+>/g, ''), escape(definition));
        for (const [, id] of html.matchAll(/data-target="([^"]+)"/g)) {
            assert.ok(titles.some(article => article.id === id));
            links++;
        }
    }
    assert.ok(links >= 80);
    assert.match(render('Палаты (ст. 94–95); права (ст. 3, 32).', ''), /data-target="art94"/);
    assert.match(render('Палаты (ст. 94–95); права (ст. 3, 32).', ''), /data-target="art95"/);
    assert.match(render('Палаты (ст. 94–95); права (ст. 3, 32).', ''), /data-target="art32"/);
    assert.doesNotMatch(render('ст. 999 <img src=x>', ''), /<a|<img/);
});
