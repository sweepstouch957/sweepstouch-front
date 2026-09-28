'use client';

/**
 * Columna de tiendas — el primer filtro de la pantalla.
 *
 * Ordenadas por dónde duele: la tienda con pedidos pagados sin aprobar va
 * primero. Cada fila dice cuánta gente está esperando ahí, así se elige por
 * carga y no por orden alfabético.
 */
import GroupsRounded from '@mui/icons-material/GroupsRounded';
import SearchRounded from '@mui/icons-material/SearchRounded';
import { alpha, Avatar, Box, InputBase, Stack, Typography, useTheme } from '@mui/material';
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

/** Lo que la columna sabe de una tienda además de su carga: logo y audiencia. */
export interface StoreInfo {
  image?: string;
  customerCount?: number;
}

/** 12.480 → "12.5k": el número entero no entra y tampoco aporta. */
export function shortAudience(n?: number): string {
  if (!n) return '';
  if (n < 1000) return String(n);
  const k = n / 1000;
  return `${k >= 10 ? Math.round(k) : k.toFixed(1).replace('.0', '')}k`;
}

function StoreRow({
  slug,
  name,
  peopleCount,
  urgent,
  active,
  meta,
  onSelect,
}: {
  slug: string;
  name: string;
  peopleCount: number;
  urgent: number;
  active: boolean;
  meta?: StoreInfo;
  onSelect: (slug: string) => void;
}) {
  const theme = useTheme();
  const { title, address } = splitStoreTitle(name);
  const audience = shortAudience(meta?.customerCount);
  return (
    <Box
      component="button"
      onClick={() => onSelect(slug)}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.25,
        width: '100%',
        textAlign: 'left',
        cursor: 'pointer',
        borderRadius: 2,
        p: 1.25,
        font: 'inherit',
        // `color: inherit` es el arreglo del texto blanco: un <button> nativo trae
        // el color del sistema y el nombre de la tienda quedaba ilegible.
        color: 'text.primary',
        border: `1px solid ${active ? theme.palette.primary.main : 'transparent'}`,
        bgcolor: active ? alpha(theme.palette.primary.main, 0.06) : 'transparent',
        '&:hover': { bgcolor: active ? alpha(theme.palette.primary.main, 0.08) : 'action.hover' },
      }}
    >
      {/* El logo identifica la tienda mucho más rápido que dos iniciales;
          sin logo cargado, se cae a las iniciales de siempre. */}
      <Avatar
        src={slug === 'all' ? undefined : meta?.image || undefined}
        variant="rounded"
        sx={{
          width: 38,
          height: 38,
          flexShrink: 0,
          borderRadius: 2,
          fontSize: 12,
          fontWeight: 700,
          bgcolor: 'action.selected',
          color: active ? 'primary.main' : 'text.secondary',
          '& img': { objectFit: 'contain' },
        }}
      >
        {slug === 'all' ? '★' : storeAbbr(name)}
      </Avatar>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography
          variant="body2"
          fontWeight={700}
          noWrap
        >
          {title}
        </Typography>
        <Stack
          direction="row"
          alignItems="center"
          gap={0.75}
          sx={{ minWidth: 0 }}
        >
          {audience && (
            <Stack
              direction="row"
              alignItems="center"
              gap={0.25}
              sx={{ flexShrink: 0, color: 'text.secondary' }}
            >
              <GroupsRounded sx={{ fontSize: 14 }} />
              <Typography
                variant="caption"
                fontWeight={700}
              >
                {audience}
              </Typography>
            </Stack>
          )}
          <Typography
            variant="caption"
            color={urgent ? 'primary.main' : 'text.secondary'}
            noWrap
            sx={{ minWidth: 0 }}
          >
            {urgent ? `${urgent} por aprobar` : address || `${peopleCount} esperando`}
          </Typography>
        </Stack>
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
          fontWeight: 700,
          bgcolor: 'action.selected',
          color: 'text.secondary',
        }}
      >
        {peopleCount}
      </Box>
    </Box>
  );
}

const MemoStoreRow = React.memo(StoreRow);

export function StoreRail({
  people,
  value,
  onChange,
  info,
}: {
  /** Personas YA filtradas por período y búsqueda (no por tienda). */
  people: PersonRow[];
  /** Slug seleccionado o 'all'. */
  value: string;
  onChange: (slug: string) => void;
  /** Logo y audiencia por slug (store-service). Sin esto se cae a las iniciales. */
  info?: Record<string, StoreInfo>;
}): React.JSX.Element {
  const theme = useTheme();
  const [q, setQ] = useState('');
  const load = useMemo(() => storeLoad(people), [people]);
  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return needle ? load.filter((s) => s.name.toLowerCase().includes(needle)) : load;
  }, [load, q]);
  const totalUrgent = load.reduce((n, s) => n + s.urgent, 0);

  return (
    <Stack
      sx={{
        height: '100%',
        minHeight: 0,
        borderRight: `1px solid ${theme.palette.divider}`,
        bgcolor: 'background.default',
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
            fontWeight={700}
            letterSpacing=".14em"
            color="text.secondary"
          >
            TIENDAS
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
            fontWeight={totalUrgent ? 700 : 500}
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
        <MemoStoreRow
          slug="all"
          name="Todas las tiendas"
          peopleCount={people.length}
          urgent={totalUrgent}
          active={value === 'all'}
          onSelect={onChange}
        />
        {shown.map((s) => (
          <MemoStoreRow
            key={s.slug}
            slug={s.slug}
            name={s.name}
            peopleCount={s.people}
            urgent={s.urgent}
            active={value === s.slug}
            meta={info?.[s.slug]}
            onSelect={onChange}
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
