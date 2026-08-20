'use client';

import { qboService } from '@/services/qbo.service';
import DownloadRoundedIcon from '@mui/icons-material/DownloadRounded';
import GridOnRoundedIcon from '@mui/icons-material/GridOnRounded';
import TableChartRoundedIcon from '@mui/icons-material/TableChartRounded';
import {
  Box,
  Button,
  Divider,
  FormControlLabel,
  ListItemText,
  Menu,
  MenuItem,
  Stack,
  Switch,
  Typography,
} from '@mui/material';
import { useState } from 'react';

type Scope = 'stores' | 'invoices' | 'lines';

type Props = {
  range: { from: string | null; to: string | null };
  categories: string[];
  disabled?: boolean;
};

/**
 * Tres niveles porque responden preguntas distintas. El de conceptos es el que
 * sirve para cuadrar contra el pipeline: es el único que separa cuánto es campaña
 * y cuánto membresía dentro de una misma factura.
 */
const SCOPES: Array<{ value: Scope; label: string; hint: string }> = [
  { value: 'stores', label: 'Resumen por tienda', hint: 'Una fila por tienda: cuánto debe cada una' },
  { value: 'invoices', label: 'Facturas', hint: 'Una fila por factura, con su total y saldo' },
  {
    value: 'lines',
    label: 'Conceptos (detalle)',
    hint: 'Una fila por cargo, con la fecha real del servicio y la audiencia',
  },
];

export function ExportMenu({ range, categories, disabled }: Props) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const [includePaid, setIncludePaid] = useState(false);

  const download = (scope: Scope, format: 'csv' | 'xlsx') => {
    // El navegador se encarga: el endpoint responde con Content-Disposition
    // attachment, así que no hay que pasar el archivo por memoria del cliente.
    window.open(
      qboService.exportUrl({ scope, format, from: range.from, to: range.to, items: categories, includePaid }),
      '_blank',
      'noopener'
    );
    setAnchor(null);
  };

  const activos = [
    range.from || range.to ? 'periodo' : null,
    categories.length ? `${categories.length} categorías` : null,
  ].filter(Boolean);

  return (
    <>
      <Button
        size="small"
        variant="outlined"
        startIcon={<DownloadRoundedIcon />}
        onClick={(e) => setAnchor(e.currentTarget)}
        disabled={disabled}
        sx={{ whiteSpace: 'nowrap', flexShrink: 0 }}
      >
        Exportar
      </Button>

      <Menu
        anchorEl={anchor}
        open={Boolean(anchor)}
        onClose={() => setAnchor(null)}
        slotProps={{ paper: { sx: { width: 340, maxWidth: '94vw' } } }}
      >
        <Box sx={{ px: 2, py: 1 }}>
          <Typography variant="subtitle2"
fontWeight={700}>
            Exportar cartera
          </Typography>
          {/* Que quede claro qué se lleva el archivo: exportar "todo" y recibir lo
              filtrado, o al revés, es de los errores más caros en cobranza. */}
          <Typography variant="caption"
color="text.secondary">
            {activos.length
              ? `Se aplica lo filtrado en pantalla (${activos.join(' · ')})`
              : 'Sin filtros: se exporta todo el histórico'}
          </Typography>
        </Box>

        <Divider />

        {SCOPES.map((s) => (
          <MenuItem
            key={s.value}
            disableRipple
            sx={{ display: 'block', py: 1, '&:hover': { bgcolor: 'transparent' } }}
          >
            <Stack direction="row"
alignItems="center"
justifyContent="space-between"
spacing={1}>
              <ListItemText
                primary={s.label}
                secondary={s.hint}
                primaryTypographyProps={{ variant: 'body2', fontWeight: 600 }}
                secondaryTypographyProps={{ variant: 'caption' }}
              />
              <Stack direction="row"
spacing={0.5}
sx={{ flexShrink: 0 }}>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<GridOnRoundedIcon sx={{ fontSize: 14 }} />}
                  onClick={() => download(s.value, 'xlsx')}
                  sx={{ minWidth: 0, px: 1, fontSize: '0.7rem' }}
                >
                  Excel
                </Button>
                <Button
                  size="small"
                  variant="text"
                  startIcon={<TableChartRoundedIcon sx={{ fontSize: 14 }} />}
                  onClick={() => download(s.value, 'csv')}
                  sx={{ minWidth: 0, px: 1, fontSize: '0.7rem' }}
                >
                  CSV
                </Button>
              </Stack>
            </Stack>
          </MenuItem>
        ))}

        <Divider />

        <Box sx={{ px: 2, py: 0.5 }}>
          <FormControlLabel
            control={
              <Switch
                size="small"
                checked={includePaid}
                onChange={(e) => setIncludePaid(e.target.checked)}
              />
            }
            label={
              <Typography variant="caption">
                Incluir facturas ya pagadas
              </Typography>
            }
          />
        </Box>
      </Menu>
    </>
  );
}

export default ExportMenu;
