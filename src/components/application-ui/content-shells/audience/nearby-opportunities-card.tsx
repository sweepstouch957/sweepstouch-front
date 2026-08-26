'use client';

/**
 * Números que hoy no reciben campañas, y qué hay alrededor de ellos.
 *
 * Una tienda sin campañas es audiencia parada. Lo que decide qué hacer con ella
 * es el vecindario, y por eso el vecino se muestra clasificado: si al lado hay un
 * súper nuestro que ya manda, esos números se activan; si sólo hay súperes de
 * afuera, hay que salir a venderlos; si no hay nadie, quedan parados.
 */

import { useNonSendersNearby } from '@/hooks/fetching/campaigns/useAudience';
import type {
  AudienceQueryParams,
  NearbyStore,
  NeighborKind,
  NonSenderNearbyRow,
} from '@/services/campaing.service';
import BoltRoundedIcon from '@mui/icons-material/BoltRounded';
import HandshakeRoundedIcon from '@mui/icons-material/HandshakeRounded';
import NearMeRoundedIcon from '@mui/icons-material/NearMeRounded';
import NightsStayRoundedIcon from '@mui/icons-material/NightsStayRounded';
import PlaceOutlinedIcon from '@mui/icons-material/PlaceOutlined';
import StorefrontRoundedIcon from '@mui/icons-material/StorefrontRounded';
import {
  Alert,
  Box,
  Card,
  Chip,
  Divider,
  MenuItem,
  Skeleton,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { alpha, useTheme, type Theme } from '@mui/material/styles';
import React, { useState } from 'react';

const nf = new Intl.NumberFormat('es-US');
/** Tabular para que los anchos no bailen al refrescar. */
const numeric = { fontVariantNumeric: 'tabular-nums' } as const;

const RADIUS_OPTIONS = [3, 8, 15, 30];

/**
 * Cada tipo lleva icono + texto, nunca sólo color: el estado tiene que leerse
 * también en escala de grises y para quien no distingue verde de ámbar.
 */
const KIND_META: Record<
  NeighborKind,
  { label: string; short: string; icon: React.ReactNode; color: (t: Theme) => string }
> = {
  own_sender: {
    label: 'Nuestro · ya manda campañas',
    short: 'Nuestro · activo',
    icon: <BoltRoundedIcon sx={{ fontSize: 14 }} />,
    color: (t) => t.palette.success.main,
  },
  own_idle: {
    label: 'Nuestro · sin campañas',
    short: 'Nuestro · dormido',
    icon: <NightsStayRoundedIcon sx={{ fontSize: 14 }} />,
    color: (t) => t.palette.warning.main,
  },
  lead: {
    label: 'De afuera · todavía no es cliente',
    short: 'De afuera',
    icon: <HandshakeRoundedIcon sx={{ fontSize: 14 }} />,
    color: (t) => t.palette.info.main,
  },
};

/** La acción que corresponde según lo mejor que haya cerca. */
function verdictOf(row: NonSenderNearbyRow): {
  text: string;
  kind: NeighborKind | null;
} {
  if (row.nearby.some((n) => n.kind === 'own_sender')) {
    return { text: 'Se puede activar hoy', kind: 'own_sender' };
  }
  if (row.nearby.some((n) => n.kind === 'lead')) {
    return { text: 'Hay súper de afuera para vender', kind: 'lead' };
  }
  if (row.nearby.length > 0) {
    return { text: 'Sólo vecinos dormidos', kind: 'own_idle' };
  }
  return { text: 'Sin nadie alrededor', kind: null };
}

function NeighborChip({ n }: { n: NearbyStore }) {
  const theme = useTheme();
  const meta = KIND_META[n.kind];
  const color = meta.color(theme);

  const where = n.sameZip
    ? 'mismo código postal'
    : n.distanceKm !== null
      ? `a ${n.distanceKm} km`
      : 'zona cercana';
  const audience = n.audience !== null ? ` · ${nf.format(n.audience)} contactos` : '';

  return (
    <Tooltip title={`${meta.label} — ${where}${audience}`}>
      <Chip
        size="small"
        icon={<Box sx={{ display: 'flex', color: `${color} !important` }}>{meta.icon}</Box>}
        label={
          <Stack
            direction="row"
            alignItems="center"
            gap={0.5}
          >
            <Box
              component="span"
              sx={{ maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis' }}
            >
              {n.name}
            </Box>
            {n.distanceKm !== null && (
              <Box
                component="span"
                sx={{ opacity: 0.65, ...numeric }}
              >
                {n.distanceKm}km
              </Box>
            )}
          </Stack>
        }
        sx={{
          maxWidth: 260,
          borderRadius: 1.5,
          color: 'text.primary',
          bgcolor: alpha(color, 0.1),
          border: '1px solid',
          borderColor: alpha(color, 0.32),
        }}
      />
    </Tooltip>
  );
}

function StoreRow({ row }: { row: NonSenderNearbyRow }) {
  const theme = useTheme();
  const verdict = verdictOf(row);
  const accent = verdict.kind ? KIND_META[verdict.kind].color(theme) : theme.palette.divider;

  return (
    <Box
      sx={{
        p: 1.75,
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider',
        borderLeft: '3px solid',
        borderLeftColor: accent,
        transition: 'background-color .18s',
        '&:hover': { bgcolor: alpha(theme.palette.text.primary, 0.025) },
      }}
    >
      <Stack
        direction="row"
        alignItems="flex-start"
        justifyContent="space-between"
        gap={1.5}
      >
        <Stack minWidth={0}>
          <Stack
            direction="row"
            alignItems="center"
            gap={0.75}
            minWidth={0}
          >
            <StorefrontRoundedIcon sx={{ fontSize: 15, color: 'text.disabled', flexShrink: 0 }} />
            <Typography
              variant="body2"
              fontWeight={700}
              noWrap
              title={row.store.name}
            >
              {row.store.name}
            </Typography>
          </Stack>
          <Stack
            direction="row"
            alignItems="center"
            gap={0.5}
            sx={{ mt: 0.25 }}
          >
            <PlaceOutlinedIcon sx={{ fontSize: 13, color: 'text.disabled' }} />
            <Typography
              variant="caption"
              color="text.secondary"
            >
              {row.store.zipCode || 'Sin código postal'}
            </Typography>
            {/* Sin coordenadas el cruce sale sólo por zip: hay que poder saberlo. */}
            {!row.store.hasLocation && (
              <Typography
                variant="caption"
                color="text.disabled"
              >
                · sin ubicación cargada
              </Typography>
            )}
          </Stack>
        </Stack>

        <Stack
          alignItems="flex-end"
          flexShrink={0}
        >
          <Typography
            variant="subtitle2"
            fontWeight={700}
            sx={numeric}
          >
            {nf.format(row.store.audience)}
          </Typography>
          <Typography
            variant="caption"
            sx={{ color: accent, fontWeight: 600 }}
          >
            {verdict.text}
          </Typography>
        </Stack>
      </Stack>

      <Divider sx={{ my: 1.25 }} />

      {row.nearby.length > 0 ? (
        <Stack
          direction="row"
          gap={0.75}
          flexWrap="wrap"
        >
          {row.nearby.map((n) => (
            <NeighborChip
              key={n.id}
              n={n}
            />
          ))}
        </Stack>
      ) : (
        <Typography
          variant="caption"
          color="text.secondary"
        >
          Ningún súper —nuestro ni de afuera— dentro del radio.
        </Typography>
      )}
    </Box>
  );
}

function HeadlineStat({
  value,
  label,
  color,
  icon,
}: {
  value: number;
  label: string;
  color: string;
  icon: React.ReactNode;
}) {
  return (
    <Stack
      flex={1}
      minWidth={130}
      gap={0.25}
    >
      <Stack
        direction="row"
        alignItems="center"
        gap={0.5}
        sx={{ color }}
      >
        {icon}
        <Typography
          variant="h5"
          fontWeight={700}
          sx={{ ...numeric, lineHeight: 1.15 }}
        >
          {nf.format(value)}
        </Typography>
      </Stack>
      <Typography
        variant="caption"
        color="text.secondary"
      >
        {label}
      </Typography>
    </Stack>
  );
}

export default function NearbyOpportunitiesCard({ params }: { params: AudienceQueryParams }) {
  const theme = useTheme();
  const [radiusKm, setRadiusKm] = useState(8);

  const { data, isLoading, isError } = useNonSendersNearby({
    ...params,
    radiusKm,
    limit: 20,
    neighbors: 5,
  });

  return (
    <Card sx={{ p: 2.5, height: '100%' }}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        alignItems={{ sm: 'center' }}
        justifyContent="space-between"
        gap={1.5}
        sx={{ mb: 2 }}
      >
        <Stack
          direction="row"
          alignItems="center"
          gap={1.5}
          minWidth={0}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 38,
              height: 38,
              borderRadius: 2,
              flexShrink: 0,
              color: 'success.main',
              bgcolor: alpha(theme.palette.success.main, 0.12),
            }}
          >
            <NearMeRoundedIcon fontSize="small" />
          </Box>
          <Box minWidth={0}>
            <Typography
              variant="subtitle1"
              fontWeight={700}
              lineHeight={1.2}
            >
              Audiencia sin campañas
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
            >
              Y qué súperes tiene alrededor
            </Typography>
          </Box>
        </Stack>

        <TextField
          select
          size="small"
          label="Radio"
          value={radiusKm}
          onChange={(e) => setRadiusKm(Number(e.target.value))}
          sx={{ width: 120, flexShrink: 0 }}
        >
          {RADIUS_OPTIONS.map((r) => (
            <MenuItem
              key={r}
              value={r}
            >
              {r} km
            </MenuItem>
          ))}
        </TextField>
      </Stack>

      {isError && <Alert severity="error">No se pudo cargar el cruce por zona.</Alert>}

      {isLoading && !data && (
        <Stack gap={1.25}>
          <Skeleton
            variant="rounded"
            height={78}
          />
          {[0, 1, 2].map((i) => (
            <Skeleton
              key={i}
              variant="rounded"
              height={104}
            />
          ))}
        </Stack>
      )}

      {data && (
        <>
          <Stack
            direction="row"
            gap={2}
            flexWrap="wrap"
            sx={{
              p: 1.75,
              mb: 2,
              borderRadius: 2,
              bgcolor: alpha(theme.palette.text.primary, 0.03),
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            <HeadlineStat
              value={data.reachableAudience}
              label="Se activan con un súper nuestro de al lado"
              color={theme.palette.success.main}
              icon={<BoltRoundedIcon sx={{ fontSize: 18 }} />}
            />
            <HeadlineStat
              value={data.prospectAudience}
              label="Sólo alcanzables si vendemos un súper de afuera"
              color={theme.palette.info.main}
              icon={<HandshakeRoundedIcon sx={{ fontSize: 18 }} />}
            />
            <HeadlineStat
              value={data.isolatedAudience}
              label="Sin nadie alrededor"
              color={theme.palette.text.disabled}
              icon={<PlaceOutlinedIcon sx={{ fontSize: 18 }} />}
            />
          </Stack>

          {/* Leyenda: sin esto los colores de los chips no significan nada. */}
          <Stack
            direction="row"
            gap={1}
            flexWrap="wrap"
            sx={{ mb: 1.5 }}
          >
            {(Object.keys(KIND_META) as NeighborKind[]).map((k) => (
              <Stack
                key={k}
                direction="row"
                alignItems="center"
                gap={0.5}
                sx={{ color: KIND_META[k].color(theme) }}
              >
                {KIND_META[k].icon}
                <Typography
                  variant="caption"
                  color="text.secondary"
                >
                  {KIND_META[k].short}
                </Typography>
              </Stack>
            ))}
          </Stack>

          {data.rows.length === 0 ? (
            <Stack
              alignItems="center"
              gap={0.5}
              py={5}
            >
              <BoltRoundedIcon sx={{ color: 'success.main' }} />
              <Typography
                variant="body2"
                color="text.secondary"
                textAlign="center"
              >
                Todas las tiendas con audiencia enviaron campañas en este período.
              </Typography>
            </Stack>
          ) : (
            <Stack
              gap={1.25}
              sx={{ maxHeight: 520, overflowY: 'auto', pr: 0.5 }}
            >
              {data.rows.map((row) => (
                <StoreRow
                  key={row.store.id}
                  row={row}
                />
              ))}
            </Stack>
          )}

          <Typography
            variant="caption"
            color="text.disabled"
            sx={{ display: 'block', mt: 1.5 }}
          >
            Total parado: {nf.format(data.totalNonSenderAudience)} contactos en{' '}
            {data.rows.length} tiendas. Los súperes de afuera salen de los leads
            registrados y se cruzan por código postal.
          </Typography>
        </>
      )}
    </Card>
  );
}
