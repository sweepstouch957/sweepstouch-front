'use client';

/**
 * Columna de tiendas — el primer filtro de la pantalla.
 *
 * Ordenadas por dónde duele: la tienda con pedidos pagados sin aprobar va
 * primero. Cada fila dice cuánta gente está esperando ahí, así se elige por
 * carga y no por orden alfabético.
 */

import SearchRounded from '@mui/icons-material/SearchRounded';
import { alpha, Box, InputBase, Stack, Typography, useTheme } from '@mui/material';
import React, { useMemo, useState } from 'react';
import { splitStoreTitle } from './constants';
import type { PersonRow } from './matrix-model';
import { storeLoad } from './matrix-model';

/** Iniciales de la tienda para el cuadrito: "Super Supermarket 31" → "SS". */
export function storeAbbr(name: string): string {
  return (
    splitStoreTitle(name)
      .title.split(/\s+/)
      .filter((w) => /[a-zA-ZÁÉÍÓÚÑáéíóúñ]/.test(w))
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? '')
      .join('') || '#'
  );
}

export function StoreRail({
  people,
  value,
  onChange,
}: {
  /** Personas YA filtradas por período y búsqueda (no por tienda). */
  people: PersonRow[];
  /** Slug seleccionado o 'all'. */
  value: string;
  onChange: (slug: string) => void;
}): React.JSX.Element {
  const theme = useTheme();
  const [q, setQ] = useState('');
  const load = useMemo(() => storeLoad(people), [people]);
  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return needle ? load.filter((s) => s.name.toLowerCase().includes(needle)) : load;
  }, [load, q]);
  const totalUrgent = load.reduce((n, s) => n + s.urgent, 0);

  const Row = ({
    slug,
    name,
    peopleCount,
    urgent,
  }: {
    slug: string;
    name: string;
    peopleCount: number;
    urgent: number;
  }) => {
    const active = value === slug;
    const { title, address } = splitStoreTitle(name);
    return (
      <Box
        component="button"
        onClick={() => onChange(slug)}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.25,
          width: '100%',
          textAlign: 'left',
          cursor: 'pointer',
          borderRadius: 3,
          p: 1.25,
          font: 'inherit',
          border: `1px solid ${active ? theme.palette.primary.main : 'transparent'}`,
          bgcolor: active ? alpha(theme.palette.primary.main, 0.08) : 'transparent',
          '&:hover': { bgcolor: active ? alpha(theme.palette.primary.main, 0.1) : 'background.paper' },
        }}
      >
        <Box
          sx={{
            width: 32,
            height: 32,
            flexShrink: 0,
            borderRadius: 2.25,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 11,
            fontWeight: 800,
            bgcolor: urgent
              ? alpha(theme.palette.error.main, 0.12)
              : alpha(theme.palette.text.primary, 0.06),
            color: urgent ? 'error.main' : 'text.secondary',
          }}
        >
          {slug === 'all' ? '★' : storeAbbr(name)}
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            variant="body2"
            fontWeight={700}
            noWrap
          >
            {title}
          </Typography>
          <Typography
            variant="caption"
            color={urgent ? 'error.main' : 'text.secondary'}
            noWrap
            display="block"
          >
            {urgent ? `${urgent} por aprobar` : address || `${peopleCount} esperando`}
          </Typography>
        </Box>
        <Box
          sx={{
            minWidth: 26,
            height: 22,
            px: 1,
            borderRadius: 999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 12,
            fontWeight: 800,
            bgcolor: active ? 'primary.main' : alpha(theme.palette.text.primary, 0.06),
            color: active ? 'primary.contrastText' : 'text.secondary',
          }}
        >
          {peopleCount}
        </Box>
      </Box>
    );
  };

  return (
    <Stack
      sx={{
        height: '100%',
        minHeight: 0,
        borderRight: `1px solid ${theme.palette.divider}`,
        bgcolor: alpha(theme.palette.text.primary, 0.02),
      }}
    >
      <Stack
        gap={1.25}
        sx={{ p: 1.75, pb: 1.25 }}
      >
        <Stack
          direction="row"
          alignItems="baseline"
          justifyContent="space-between"
        >
          <Typography
            variant="caption"
            fontWeight={800}
            letterSpacing=".14em"
            color="text.secondary"
          >
            TIENDAS
          </Typography>
          <Typography
            variant="caption"
            color={totalUrgent ? 'error.main' : 'text.secondary'}
            fontWeight={totalUrgent ? 800 : 500}
          >
            {totalUrgent ? `${totalUrgent} por aprobar` : `${load.length} con pendientes`}
          </Typography>
        </Stack>
        <Stack
          direction="row"
          alignItems="center"
          gap={1}
          sx={{
            height: 38,
            px: 1.25,
            borderRadius: 2.5,
            bgcolor: 'background.paper',
            border: `1px solid ${theme.palette.divider}`,
          }}
        >
          <SearchRounded
            fontSize="small"
            sx={{ color: 'text.disabled' }}
          />
          <InputBase
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Filtrar tiendas"
            sx={{ flex: 1, fontSize: 13 }}
          />
        </Stack>
      </Stack>

      <Stack
        gap={0.5}
        sx={{ flex: 1, minHeight: 0, overflowY: 'auto', px: 1.25, pb: 2 }}
      >
        <Row
          slug="all"
          name="Todas las tiendas"
          peopleCount={people.length}
          urgent={totalUrgent}
        />
        {shown.map((s) => (
          <Row
            key={s.slug}
            slug={s.slug}
            name={s.name}
            peopleCount={s.people}
            urgent={s.urgent}
          />
        ))}
        {shown.length === 0 && (
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ px: 1, py: 2 }}
          >
            Ninguna tienda coincide.
          </Typography>
        )}
      </Stack>
    </Stack>
  );
}
