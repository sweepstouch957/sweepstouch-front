'use client';

import type { QboCategory } from '@/services/qbo.service';
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded';
import TuneRoundedIcon from '@mui/icons-material/TuneRounded';
import {
  Badge,
  Box,
  Button,
  Checkbox,
  Divider,
  FormControlLabel,
  Popover,
  Stack,
  Typography,
} from '@mui/material';
import { useMemo, useState } from 'react';
import { money } from './constants';

type Props = {
  categories: QboCategory[];
  /** Ids seleccionados. Vacío = sin filtrar (no "nada"). */
  selected: string[];
  onChange: (ids: string[]) => void;
};

/**
 * Filtro por categoría de cargo.
 *
 * En popover y no inline: son ~10 items en 4 grupos y meterlos en la barra la
 * haría crecer el doble. El botón muestra el conteo activo, así el filtro nunca
 * queda escondido sin señal.
 *
 * Lista el catálogo completo de QuickBooks, no solo lo que tiene saldo en el
 * periodo. Antes se armaba con las facturas del rango y las categorías aparecían
 * y desaparecían al cambiar de fecha — se leía como un bug. Las que no tienen
 * saldo salen atenuadas pero marcables.
 */
export function CategoryFilter({ categories, selected, onChange }: Props) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);

  const groups = useMemo(() => {
    const m = new Map<string, { total: number; items: QboCategory[] }>();
    for (const c of categories) {
      const g = m.get(c.group) || { total: 0, items: [] };
      g.total += c.amount;
      g.items.push(c);
      m.set(c.group, g);
    }
    // El backend ya manda las categorías ordenadas (con saldo primero, vacías
    // alfabéticas al final); acá solo se respeta ese orden dentro de cada grupo.
    return [...m.entries()]
      .map(([group, v]) => ({ group, total: v.total, items: v.items }))
      .sort((a, b) => {
        if (a.total > 0 !== b.total > 0) return a.total > 0 ? -1 : 1;
        if (a.total !== b.total) return b.total - a.total;
        return a.group.localeCompare(b.group, 'es');
      });
  }, [categories]);

  const withBalance = categories.filter((c) => c.amount > 0).length;

  const set = new Set(selected);
  const toggle = (id: string) =>
    onChange(set.has(id) ? selected.filter((x) => x !== id) : [...selected, id]);

  const toggleGroup = (items: QboCategory[]) => {
    const ids = items.map((i) => i.id);
    const allOn = ids.every((id) => set.has(id));
    onChange(allOn ? selected.filter((x) => !ids.includes(x)) : [...new Set([...selected, ...ids])]);
  };

  const selectedTotal = categories
    .filter((c) => set.has(c.id))
    .reduce((s, c) => s + c.amount, 0);

  return (
    <>
      <Badge
        badgeContent={selected.length}
        color="primary"
        overlap="rectangular"
        sx={{ '& .MuiBadge-badge': { fontSize: '0.62rem', height: 16, minWidth: 16 } }}
      >
        <Button
          size="small"
          variant={selected.length ? 'contained' : 'outlined'}
          startIcon={<TuneRoundedIcon />}
          endIcon={<ExpandMoreRoundedIcon />}
          onClick={(e) => setAnchor(e.currentTarget)}
          disabled={!categories.length}
          sx={{ whiteSpace: 'nowrap', flexShrink: 0 }}
        >
          Categorías
        </Button>
      </Badge>

      <Popover
        open={Boolean(anchor)}
        anchorEl={anchor}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        slotProps={{ paper: { sx: { width: 320, maxWidth: '92vw', maxHeight: '70vh' } } }}
      >
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{ px: 2, py: 1.25 }}
        >
          <Box minWidth={0}>
            <Typography variant="subtitle2"
fontWeight={700}>
              Filtrar por categoría
            </Typography>
            <Typography variant="caption"
color="text.secondary">
              {selected.length
                ? `${selected.length} activas · ${money(selectedTotal)}`
                : `${categories.length} categorías · ${withBalance} con saldo`}
            </Typography>
          </Box>
          {selected.length > 0 && (
            <Button size="small"
color="inherit"
onClick={() => onChange([])}>
              Limpiar
            </Button>
          )}
        </Stack>

        <Divider />

        <Box sx={{ px: 1, py: 0.5, overflowY: 'auto' }}>
          {groups.map(({ group, total, items }) => {
            const ids = items.map((i) => i.id);
            const on = ids.filter((id) => set.has(id)).length;
            return (
              <Box key={group}
sx={{ mb: 0.5 }}>
                <FormControlLabel
                  sx={{ ml: 0, width: '100%', '& .MuiFormControlLabel-label': { width: '100%' } }}
                  control={
                    <Checkbox
                      size="small"
                      checked={on === ids.length}
                      // Indeterminado: distingue "algunas de este grupo" de "ninguna",
                      // que con un checkbox binario se vería igual.
                      indeterminate={on > 0 && on < ids.length}
                      onChange={() => toggleGroup(items)}
                    />
                  }
                  label={
                    <Stack direction="row"
justifyContent="space-between"
alignItems="baseline"
spacing={1}>
                      <Typography
                        variant="body2"
                        fontWeight={700}
                        noWrap
                        sx={{ opacity: total > 0 ? 1 : 0.5 }}
                      >
                        {group}
                      </Typography>
                      <Typography variant="caption"
color="text.secondary"
sx={{ flexShrink: 0 }}>
                        {money(total)}
                      </Typography>
                    </Stack>
                  }
                />

                {items.map((it) => (
                  <FormControlLabel
                    key={it.id}
                    sx={{
                      ml: 2.5,
                      width: 'calc(100% - 20px)',
                      '& .MuiFormControlLabel-label': { width: '100%' },
                    }}
                    control={
                      <Checkbox size="small"
checked={set.has(it.id)}
onChange={() => toggle(it.id)} />
                    }
                    label={
                      <Stack
                        direction="row"
                        justifyContent="space-between"
                        alignItems="baseline"
                        spacing={1}
                        // Sin saldo en el periodo: se deja marcable pero atenuada,
                        // así la lista siempre está completa y no parece que falten.
                        sx={{ opacity: it.amount > 0 ? 1 : 0.5 }}
                      >
                        <Typography variant="body2"
noWrap>
                          {it.label}
                        </Typography>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}
                        >
                          {money(it.amount)}
                        </Typography>
                      </Stack>
                    }
                  />
                ))}
              </Box>
            );
          })}
        </Box>
      </Popover>
    </>
  );
}

export default CategoryFilter;
