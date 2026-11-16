// Run: node --experimental-strip-types --test src/components/application-ui/tables/stores/highlight.test.mjs
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { highlightRanges } from './highlight-ranges.ts';

test('marca ignorando acentos y mayúsculas', () => {
  assert.deepEqual(highlightRanges('La Michoacána Market', 'michoacana'), [[3, 13]]);
});

test('varias palabras, en cualquier orden, y une las que se pisan', () => {
  assert.deepEqual(highlightRanges('Key Food 31 Memorial', 'memorial key'), [
    [0, 3],
    [12, 20],
  ]);
  assert.deepEqual(highlightRanges('Supermarket', 'super market'), [[0, 11]]);
});

test('sin búsqueda o palabras de 1 letra no marca nada', () => {
  assert.deepEqual(highlightRanges('C-Town', ''), []);
  assert.deepEqual(highlightRanges('C-Town', 'c'), []);
});
