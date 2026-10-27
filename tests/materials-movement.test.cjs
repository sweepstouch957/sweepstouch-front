const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');

function load(relative) {
  const filename = path.resolve(relative);
  const compiled = new Module(filename);
  compiled.filename = filename;
  compiled.paths = Module._nodeModulePaths(path.dirname(filename));
  const originalRequire = compiled.require.bind(compiled);
  compiled.require = (name) => name === './materials-utils'
    ? load('src/app/admin/management/support/materials/materials-utils.ts')
    : originalRequire(name);
  compiled._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
  }).outputText, filename);
  return compiled.exports;
}

const { warehouseImeis, toggleImei, movementReason } = load('src/app/admin/management/support/materials/materials-movement-utils.ts');

test('warehouse options exclude installed, damaged and non-tablet equipment', () => {
  const equipment = [
    { m: 'tablet', estado: 'bodega', v: '001234567890123' },
    { m: 'tablet', estado: 'tienda', v: '002234567890123' },
    { m: 'tablet', estado: 'danado', v: '003234567890123' },
    { m: 'router', estado: 'bodega', v: '004234567890123' },
    { m: 'tablet', estado: 'bodega', v: '001234567890123' },
    { m: 'tablet', estado: 'bodega', v: '' },
  ];
  assert.deepEqual(warehouseImeis(equipment, 'tablet'), ['001234567890123']);
});

test('checkbox selection appends multiple IMEIs without discarding typed identifiers', () => {
  let value = 'manual-imei';
  value = toggleImei(value, '001234567890123', true);
  value = toggleImei(value, '002234567890123', true);
  assert.equal(value, 'manual-imei\n001234567890123\n002234567890123');
});

test('selecting an IMEI already entered with spacing or punctuation does not duplicate it', () => {
  const value = ' ab-123 \n001234567890123';
  assert.equal(toggleImei(value, 'AB123', true), value);
  assert.equal(toggleImei(value, '001234567890123', true), value);
  assert.equal(toggleImei(value, '---', true), value);
});

test('unchecking removes only the corresponding IMEI and keeps other manual entries', () => {
  const value = 'ab-123\r\n001234567890123\r\nmanual-entry';
  assert.equal(toggleImei(value, 'AB123', false), '001234567890123\nmanual-entry');
  assert.equal(toggleImei('', '001234567890123', false), '');
});

test('Otro requires a custom reason and sends the entered text instead of the label', () => {
  assert.equal(movementReason('Otro', '  Traslado temporal  '), 'Traslado temporal');
  assert.throws(() => movementReason('Otro', '  '), /Escribe el motivo/);
  assert.equal(movementReason('Instalación nueva', 'Texto anterior'), 'Instalación nueva');
  assert.throws(() => movementReason('', ''), /Selecciona el motivo/);
});
