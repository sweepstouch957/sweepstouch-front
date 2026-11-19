'use client';

import type { AITable } from '@/services/ai.service';
import DownloadRoundedIcon from '@mui/icons-material/DownloadRounded';
import { Box, ButtonBase, Stack, Typography } from '@mui/material';
import { memo } from 'react';
import { useBrand } from './brand';

const number = new Intl.NumberFormat('es-US');
const BOM = String.fromCharCode(0xfeff); // para que Excel lea bien los acentos
const csvCell = (value: string | number) => `"${String(value).replace(/"/g, '""')}"`;

/** Baja la tabla como CSV (se abre en Excel). El BOM hace que los acentos salgan bien. */
function download(table: AITable) {
  const csv = [table.columns, ...table.rows].map((row) => row.map(csvCell).join(',')).join('\r\n');
  const url = URL.createObjectURL(new Blob([BOM + csv], { type: 'text/csv;charset=utf-8' }));
  const link = Object.assign(document.createElement('a'), {
    href: url,
    download: `${table.title}.csv`,
  });
  link.click();
  URL.revokeObjectURL(url);
}

/**
 * Una lista que llegó ya armada desde el servidor (ej. las tiendas activas).
 * Se pinta tal cual: el modelo no la reescribe, por eso aparece al instante.
 */
export const BotTable = memo(function BotTable({ table }: { table: AITable }) {
  const brand = useBrand();
  const cell = {
    px: 1.25,
    py: 0.75,
    textAlign: 'left',
    borderBottom: '1px solid',
    borderColor: 'divider',
  } as const;

  return (
    <Box
      sx={{
        width: '100%',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 3,
        overflow: 'hidden',
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        gap={1}
        sx={{ px: 1.25, py: 0.75, bgcolor: brand.subtle }}
      >
        <Typography sx={{ flex: 1, fontSize: 13, fontWeight: 800 }}>
          {table.title} · {number.format(table.rows.length)}
        </Typography>
        <ButtonBase
          onClick={() => download(table)}
          aria-label={`Descargar ${table.title} en Excel`}
          sx={{
            gap: 0.5,
            px: 1,
            py: 0.5,
            borderRadius: 999,
            fontSize: 12,
            fontWeight: 700,
            color: 'primary.main',
            '&:hover': { bgcolor: brand.glow(0.08) },
          }}
        >
          <DownloadRoundedIcon sx={{ fontSize: 16 }} />
          Descargar
        </ButtonBase>
      </Stack>
      <Box
        tabIndex={0}
        sx={{
          maxHeight: 300,
          overflow: 'auto',
          scrollbarWidth: 'thin',
          scrollbarColor: `${brand.glow(0.3)} transparent`,
        }}
      >
        <Box
          component="table"
          sx={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, lineHeight: 1.4 }}
        >
          <thead>
            <tr>
              {table.columns.map((column) => (
                <Box
                  key={column}
                  component="th"
                  scope="col"
                  sx={{
                    ...cell,
                    position: 'sticky',
                    top: 0,
                    bgcolor: 'background.paper',
                    fontSize: 11.5,
                    fontWeight: 800,
                    color: 'text.secondary',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {column}
                </Box>
              ))}
            </tr>
          </thead>
          <tbody>
            {table.rows.map((row, r) => (
              // Filas de sólo lectura que no se reordenan: la posición es su identidad.
              <tr key={r}>
                {row.map((value, c) => (
                  <Box
                    key={table.columns[c]}
                    component="td"
                    sx={{
                      ...cell,
                      ...(typeof value === 'number' && {
                        textAlign: 'right',
                        fontVariantNumeric: 'tabular-nums',
                      }),
                      ...(c === 0 && { fontWeight: 600 }),
                    }}
                  >
                    {typeof value === 'number' ? number.format(value) : value}
                  </Box>
                ))}
              </tr>
            ))}
          </tbody>
        </Box>
      </Box>
    </Box>
  );
});
