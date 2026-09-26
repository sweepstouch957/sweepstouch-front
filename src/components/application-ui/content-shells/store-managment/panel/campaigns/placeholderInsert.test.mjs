// Run: node --experimental-strip-types src/components/application-ui/content-shells/store-managment/panel/campaigns/placeholderInsert.test.mjs
import assert from 'node:assert/strict';
import { smartInsert } from './placeholderInsert.ts';

const at = (text, pos, token) => smartInsert(text, pos, pos, token).text;

assert.equal(at('', 0, '#name'), '#name'); // texto vacío: sin espacios
assert.equal(at('Hola', 4, '#name'), 'Hola #name'); // pegado a una palabra: uno antes
assert.equal(at('Hola ', 5, '#name'), 'Hola #name'); // ya había espacio: no duplica
assert.equal(at('Hola ,', 5, '#name'), 'Hola #name,'); // antes de la coma: nada después
assert.equal(at('Hola #name', 10, '#n'), 'Hola #name #n'); // dos seguidos: uno solo entre ellos
assert.equal(at('Hola\n', 5, '#name'), 'Hola\n#name'); // después de un salto: nada
assert.equal(at('¡', 1, '#name'), '¡#name'); // signo de apertura: pegado
assert.equal(at('ofertas', 0, '#storeName'), '#storeName ofertas'); // antes de una palabra: uno después
assert.equal(at('Hola #n', 5, '#name'), 'Hola #name #n'); // antes de otro placeholder: separa

// El cursor queda justo después del placeholder (no del espacio agregado).
assert.equal(smartInsert('Hola', 4, 4, '#name').caret, 10);
// Con selección: reemplaza lo seleccionado.
assert.equal(smartInsert('Hola XXX!', 5, 8, '#name').text, 'Hola #name!');

console.log('placeholderInsert OK');
