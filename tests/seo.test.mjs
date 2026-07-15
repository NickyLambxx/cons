import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';

const index = readFileSync('index.html', 'utf8');
const robots = readFileSync('robots.txt', 'utf8');
const sitemap = readFileSync('sitemap.xml', 'utf8');

test('главная страница содержит canonical', () => {
  assert.match(index, /<link rel="canonical" href="https:\/\/prep-mate\.ru\/"\s*\/?>/);
});

test('robots.txt разрешает индексацию и указывает sitemap', () => {
  assert.match(robots, /User-agent:\s*\*/);
  assert.match(robots, /Allow:\s*\//);
  assert.match(robots, /Sitemap:\s*https:\/\/prep-mate\.ru\/sitemap\.xml/);
});

test('sitemap содержит канонический адрес сайта', () => {
  assert.match(sitemap, /<loc>https:\/\/prep-mate\.ru\/<\/loc>/);
});

test('все локальные JavaScript-файлы из index.html существуют', () => {
  const scripts = [...index.matchAll(/<script\s+src="([^"]+)"/g)].map((match) => match[1]);
  assert.equal(scripts.length, 11);
  for (const script of scripts) assert.ok(existsSync(script.split('?')[0]), `Нет файла ${script}`);
});
