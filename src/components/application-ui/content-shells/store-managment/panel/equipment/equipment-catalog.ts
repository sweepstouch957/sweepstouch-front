export type BItem = {
  id: string;
  name: string;
  material: string;
  price: number;
  checked: boolean;
  qty: number;
};

export type EquipmentSection = 'tablets' | 'printers' | 'materials';

type InventoryItem = {
  id: string;
  label: string;
  description?: string;
  price: number;
  image?: string;
};

export const tabletCatalog: InventoryItem[] = [
  { id: 't9', label: 'Tablet 9"', description: 'Android 64 GB · LTE', price: 200, image: '/images/devices/tablet-9.png' },
  { id: 't14', label: 'Tablet 14"', description: 'Android 128 GB · LTE', price: 500, image: '/images/devices/tablet-14.png' },
];

export const printerCatalog: InventoryItem[] = [
  { id: 'p1', label: 'Impresora térmica', description: 'USB / Bluetooth', price: 200, image: '/images/devices/printer-thermal.png' },
];

export const materialCatalogDefault: BItem[] = [
  { id: 'b-5x5',  name: "Poster 5' x 5'",              material: 'Coroplast', price: 175, checked: false, qty: 0 },
  { id: 'b-2x3',  name: "Poster 2' x 3'",              material: 'Coroplast', price: 42,  checked: false, qty: 0 },
  { id: 'b-4x5',  name: "Poster 4' x 5'",              material: 'Coroplast', price: 140, checked: false, qty: 0 },
  { id: 'b-3x5',  name: "Poster 3' x 5'",              material: 'Coroplast', price: 105, checked: false, qty: 0 },
  { id: 'b-5x7',  name: "Poster 5' x 7'",              material: 'Coroplast', price: 245, checked: false, qty: 0 },
  { id: 'b-7x10', name: "Poster 7' x 10'",             material: 'Coroplast', price: 490, checked: false, qty: 0 },
  { id: 'b-a-sm', name: 'Ánfora acrílica pequeña',     material: 'Acrílico',  price: 250, checked: false, qty: 0 },
  { id: 'b-a-lg', name: 'Ánfora acrílica grande',      material: 'Acrílico',  price: 800, checked: false, qty: 0 },
  { id: 'b-stand',name: 'Stand A (incluye 1 póster)',  material: 'Vinyl',     price: 500, checked: false, qty: 0 },
  { id: 'b-deliv',name: 'Delivery, instalación',       material: '—',         price: 100, checked: false, qty: 0 },
  { id: 'b-setup',name: 'Setup',                       material: '—',         price: 999, checked: false, qty: 0 },
];
