// Check de la heurística de marca y del armado de filas.
// Correr:  node --experimental-strip-types src/components/application-ui/tables/stores/storeExport.check.ts
import assert from 'node:assert';
import { deriveBrand, deriveBranch, buildExportRows } from './storeExport.ts';

// La relación `brand` siempre gana sobre la heurística.
assert.equal(deriveBrand({ brand: { name: 'Key Food' }, name: 'Key Food 12 W' }), 'Key Food');

// Sin relación: corta en el primer token numérico (número de calle).
assert.equal(deriveBrand({ name: 'Key Food 12 W' }), 'Key Food');
assert.equal(deriveBrand({ name: 'Antillana Meat Market 490 W 207th St' }), 'Antillana Meat Market');
assert.equal(deriveBrand({ name: 'Food Universe Marketplace 31 Memorial' }), 'Food Universe Marketplace');

// Sin número → nombre completo (no inventa un corte).
assert.equal(deriveBrand({ name: 'Super Supermarket' }), 'Super Supermarket');
// Empieza con número → no corta en el índice 0.
assert.equal(deriveBrand({ name: '7-Eleven Main St' }), '7-Eleven Main St');
assert.equal(deriveBrand({ name: '' }), '');

// Sucursal = lo que queda tras la marca.
assert.equal(deriveBranch({ name: 'Key Food 12 W' }), '12 W');
assert.equal(deriveBranch({ name: 'Super Supermarket' }), '');

// buildExportRows respeta las columnas elegidas y el orden del catálogo.
const { rows, cols } = buildExportRows(
  [{ name: 'Key Food 12 W', customerCount: 500, sendsCampaigns: true, campaignsTotal: 3 }],
  ['customers', 'brand', 'sendsCampaigns']
);
assert.deepEqual(Object.keys(rows[0]), ['Brand', 'Customers', 'Sends campaigns']);
assert.equal(rows[0].Brand, 'Key Food');
assert.equal(rows[0].Customers, 500);
assert.equal(rows[0]['Sends campaigns'], 'Yes');
assert.equal(cols.length, 3);

// Sin campañas → "No".
const { rows: r2 } = buildExportRows([{ name: 'X', sendsCampaigns: false }], ['sendsCampaigns']);
assert.equal(r2[0]['Sends campaigns'], 'No');

console.log('✓ storeExport: deriveBrand + buildExportRows OK');
