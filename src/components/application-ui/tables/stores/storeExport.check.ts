// Check de la heurística de marca y del armado de filas.
// Correr:  node --experimental-strip-types src/components/application-ui/tables/stores/storeExport.check.ts
import assert from 'node:assert';
import { deriveBrand, deriveBranch, buildExportRows, resolveStoreStatus } from './storeExport.ts';

// ── active:false gana sobre el enum (tiendas de baja sin migrar) ──
assert.equal(resolveStoreStatus({ active: false, status: 'active' }), 'cancelled');
assert.equal(resolveStoreStatus({ active: false }), 'cancelled');
assert.equal(resolveStoreStatus({ active: false, status: 'suspended' }), 'cancelled');
// Con active true/ausente manda el enum.
assert.equal(resolveStoreStatus({ active: true, status: 'active' }), 'active');
assert.equal(resolveStoreStatus({ active: true, status: 'suspended' }), 'suspended');
assert.equal(resolveStoreStatus({ active: true, status: 'cancelled' }), 'cancelled');
assert.equal(resolveStoreStatus({ status: 'active' }), 'active');
assert.equal(resolveStoreStatus({}), 'active');

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

// La columna Status del Excel respeta la precedencia de active:false.
const { rows: r3 } = buildExportRows(
  [{ name: 'Baja', active: false, status: 'active' }, { name: 'Viva', active: true, status: 'active' }],
  ['status']
);
assert.equal(r3[0].Status, 'Cancelled');
assert.equal(r3[1].Status, 'Active');

console.log('✓ storeExport: deriveBrand + buildExportRows OK');
