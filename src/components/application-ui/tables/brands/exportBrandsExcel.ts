import XLSX from 'xlsx-js-style';
import type { Brand } from '@/services/brand.service';

const HEADER = {
  font: { bold: true, color: { rgb: 'FFFFFF' } },
  fill: { fgColor: { rgb: '1F4E78' } },
  alignment: { horizontal: 'center', vertical: 'center' },
  border: { bottom: { style: 'thin', color: { rgb: '999999' } } },
};
const CELL = { border: { bottom: { style: 'hair', color: { rgb: 'DDDDDD' } } }, alignment: { vertical: 'center' } };
const ZEBRA = { ...CELL, fill: { fgColor: { rgb: 'F3F6FA' } } };

export function exportBrandsExcel(brands: Brand[], statusLabel: string) {
  const rows = brands.map((b) => ({
    Marca: b.name,
    Slug: b.slug || '',
    Estado: b.active !== false ? 'Activa' : 'Inactiva',
    'Tiendas activas': b.storesActive ?? 0,
    'Tiendas totales': b.storesTotal ?? 0,
    Logo: b.image && b.image !== 'no-image.jpg' ? b.image : '',
    Creada: b.createdAt ? new Date(b.createdAt).toLocaleDateString('es-ES') : '',
  }));

  const ws = XLSX.utils.json_to_sheet(rows);
  const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
  for (let R = range.s.r; R <= range.e.r; R++) {
    for (let C = range.s.c; C <= range.e.c; C++) {
      const cell = ws[XLSX.utils.encode_cell({ r: R, c: C })];
      if (!cell) continue;
      if (R === 0) {
        cell.s = HEADER;
        continue;
      }
      cell.s = R % 2 === 0 ? ZEBRA : CELL;
      if (C === 2) cell.s = { ...cell.s, font: { bold: true, color: { rgb: cell.v === 'Activa' ? '1E7F3C' : 'B42318' } } };
      if (C === 3 || C === 4) cell.s = { ...cell.s, alignment: { horizontal: 'center' } };
    }
  }
  ws['!cols'] = [{ wch: 34 }, { wch: 30 }, { wch: 11 }, { wch: 16 }, { wch: 16 }, { wch: 60 }, { wch: 12 }];
  ws['!rows'] = [{ hpt: 24 }];
  ws['!autofilter'] = { ref: ws['!ref'] || 'A1' };
  ws['!freeze'] = { xSplit: 0, ySplit: 1 };

  const active = brands.filter((b) => b.active !== false).length;
  const resumen = XLSX.utils.aoa_to_sheet([
    ['Resumen de marcas'],
    ['Filtro', statusLabel],
    ['Marcas', brands.length],
    ['Activas', active],
    ['Inactivas', brands.length - active],
    ['Tiendas activas', brands.reduce((n, b) => n + (b.storesActive ?? 0), 0)],
    ['Tiendas totales', brands.reduce((n, b) => n + (b.storesTotal ?? 0), 0)],
    ['Generado', new Date().toLocaleString('es-ES')],
  ]);
  resumen['A1'].s = { font: { bold: true, sz: 14, color: { rgb: '1F4E78' } } };
  for (let r = 2; r <= 8; r++) resumen[`A${r}`].s = { font: { bold: true } };
  resumen['!cols'] = [{ wch: 18 }, { wch: 24 }];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Marcas');
  XLSX.utils.book_append_sheet(wb, resumen, 'Resumen');
  XLSX.writeFile(wb, `marcas_${statusLabel.toLowerCase()}_${new Date().toISOString().slice(0, 10)}.xlsx`);
}
