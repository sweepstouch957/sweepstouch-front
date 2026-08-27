'use client';

/**
 * Números que hoy no reciben campañas, y qué hay alrededor de ellos.
 *
 * Un negocio sin campañas es audiencia parada. Lo que decide qué hacer con ella
 * es el vecindario, y por eso el vecino se muestra clasificado: si al lado hay
 * un negocio nuestro que ya manda, esos números se activan; si sólo hay
 * negocios de afuera, hay que salir a venderlos; si no hay nadie, quedan
 * parados.
 *
 * El vecino puede ser un súper, un restaurante, un gimnasio o cualquier otro
 * rubro: el cruce es por zona, no por tipo de comercio, así que la copia habla
 * de "negocios" y no de "súperes".
 */
import { BusinessTypeIcon, businessTypeMeta } from '@/components/audience/business-types';
import ShareAudienceDialog from './share-audience-dialog';
import { PanelCard, numeric as tabular } from '@/components/audience/ui';
import { useNonSendersNearby } from '@/hooks/fetching/campaigns/useAudience';
import type {
  AudienceQueryParams,
  BusinessType,
  BusinessTypeBreakdown,
  NearbyStore,
  NeighborKind,
  NonSenderNearbyRow,
} from '@/services/campaing.service';
import BoltRoundedIcon from '@mui/icons-material/BoltRounded';
import ShareRoundedIcon from '@mui/icons-material/ShareRounded';
import HandshakeRoundedIcon from '@mui/icons-material/HandshakeRounded';
import NearMeRoundedIcon from '@mui/icons-material/NearMeRounded';
import NightsStayRoundedIcon from '@mui/icons-material/NightsStayRounded';
import PlaceOutlinedIcon from '@mui/icons-material/PlaceOutlined';
import {
  Alert,
  Box,
  Button,
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
const numeric = tabular;

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
    return { text: 'Hay negocio de afuera para vender', kind: 'lead' };
  }
  if (row.nearby.length > 0) {
    return { text: 'Sólo vecinos dormidos', kind: 'own_idle' };
  }
  return { text: 'Sin nadie alrededor', kind: null };
}

function NeighborChip({ n, onShare }: { n: NearbyStore; onShare?: (n: NearbyStore) => void }) {
  const theme = useTheme();
  const meta = KIND_META[n.kind];
  const color = meta.color(theme);
  // A un lead de afuera no le podemos dar nada: todavía no es cliente.
  const canReceive = Boolean(onShare) && n.kind !== 'lead';

  const where = n.sameZip
    ? 'mismo código postal'
    : n.distanceKm !== null
      ? `a ${n.distanceKm} km`
      : 'zona cercana';
  const audience = n.audience !== null ? ` · ${nf.format(n.audience)} contactos` : '';
  const rubro = businessTypeMeta(n.businessType).label;

  return (
    <Tooltip
      title={
        canReceive
          ? `Compartir la base con ${n.name} — ${rubro} · ${meta.label}, ${where}${audience}`
          : `${rubro} · ${meta.label} — ${where}${audience}`
      }
    >
      <Chip
        size="small"
        onClick={
          canReceive
            ? (e) => {
                // La fila entera también abre el diálogo; sin esto se abriría
                // dos veces y la segunda pisaría el destino elegido acá.
                e.stopPropagation();
                onShare!(n);
              }
            : undefined
        }
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
          ...(canReceive
            ? {
                cursor: 'pointer',
                '&:hover': { bgcolor: alpha(color, 0.2), borderColor: color },
              }
            : null),
        }}
      />
    </Tooltip>
  );
}

function StoreRow({
  row,
  onShare,
}: {
  row: NonSenderNearbyRow;
  onShare: (row: NonSenderNearbyRow, neighbor?: NearbyStore) => void;
}) {
  const theme = useTheme();
  const verdict = verdictOf(row);
  const accent = verdict.kind ? KIND_META[verdict.kind].color(theme) : theme.palette.divider;
  // Sin un vecino nuestro cerca no hay a quién darle la base.
  const canShare = row.nearby.some((n) => n.kind !== 'lead');

  return (
    <Box
      role={canShare ? 'button' : undefined}
      tabIndex={canShare ? 0 : undefined}
      aria-label={canShare ? `Compartir la base de ${row.store.name}` : undefined}
      onClick={canShare ? () => onShare(row) : undefined}
      onKeyDown={
        canShare
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onShare(row);
              }
            }
          : undefined
      }
      sx={{
        p: 1.75,
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider',
        borderLeft: '3px solid',
        borderLeftColor: accent,
        transition: 'background-color .18s',
        '&:hover': { bgcolor: alpha(theme.palette.text.primary, 0.025) },
        ...(canShare
          ? {
              cursor: 'pointer',
              '&:focus-visible': {
                outline: `2px solid ${theme.palette.primary.main}`,
                outlineOffset: 2,
              },
            }
          : null),
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
            {/* El icono dice el rubro; antes todos eran la misma tiendita. */}
            <BusinessTypeIcon type={row.store.businessType} />
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
              {businessTypeMeta(row.store.businessType).label} ·{' '}
              {row.store.zipCode || 'sin código postal'}
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
          {canShare && (
            <Button
              size="small"
              startIcon={<ShareRoundedIcon sx={{ fontSize: 15 }} />}
              onClick={(e) => {
                e.stopPropagation();
                onShare(row);
              }}
              sx={{ mt: 0.5, textTransform: 'none', fontWeight: 600, minWidth: 0, px: 1 }}
            >
              Compartir base
            </Button>
          )}
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
              onShare={(neighbor) => onShare(row, neighbor)}
            />
          ))}
        </Stack>
      ) : (
        <Typography
          variant="caption"
          color="text.secondary"
        >
          Ningún negocio —nuestro ni de afuera— dentro del radio.
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
      gap={0.25}
      minWidth={0}
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
      {/* Sin `noWrap`: la etiqueta explica el número y truncarla lo deja mudo. */}
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ lineHeight: 1.35 }}
      >
        {label}
      </Typography>
    </Stack>
  );
}

/**
 * Filtro por rubro.
 *
 * Los conteos salen de `byBusinessType`, que el backend calcula ANTES de
 * aplicar el filtro: si se calcularan después, al tocar "Gimnasio" el resto de
 * los rubros mostraría 0 y no habría forma de volver.
 */
function BusinessTypeFilter({
  breakdown,
  selected,
  onToggle,
  onClear,
}: {
  breakdown: BusinessTypeBreakdown[];
  selected: BusinessType[];
  onToggle: (t: BusinessType) => void;
  onClear: () => void;
}) {
  const theme = useTheme();
  if (breakdown.length < 2) return null;

  return (
    <Stack
      direction="row"
      gap={0.75}
      flexWrap="wrap"
      alignItems="center"
      sx={{ mb: 1.5 }}
    >
      <Chip
        size="small"
        label="Todos"
        onClick={onClear}
        variant={selected.length === 0 ? 'filled' : 'outlined'}
        color={selected.length === 0 ? 'primary' : 'default'}
        sx={{ borderRadius: 1.5 }}
      />
      {breakdown.map((b) => {
        const { label, Icon } = businessTypeMeta(b.type);
        const on = selected.includes(b.type);
        return (
          <Chip
            key={b.type}
            size="small"
            onClick={() => onToggle(b.type)}
            aria-pressed={on}
            icon={<Icon sx={{ fontSize: 14 }} />}
            label={`${label} · ${nf.format(b.audience)}`}
            variant={on ? 'filled' : 'outlined'}
            sx={{
              borderRadius: 1.5,
              ...numeric,
              ...(on
                ? {
                    bgcolor: alpha(theme.palette.primary.main, 0.14),
                    borderColor: alpha(theme.palette.primary.main, 0.4),
                    border: '1px solid',
                  }
                : null),
            }}
          />
        );
      })}
    </Stack>
  );
}

export default function NearbyOpportunitiesCard({ params }: { params: AudienceQueryParams }) {
  const theme = useTheme();
  const [radiusKm, setRadiusKm] = useState(8);
  const [types, setTypes] = useState<BusinessType[]>([]);
  const [share, setShare] = useState<{
    row: NonSenderNearbyRow;
    neighborId: string | null;
  } | null>(null);

  const { data, isLoading, isError } = useNonSendersNearby({
    ...params,
    radiusKm,
    businessType: types,
    limit: 20,
    neighbors: 5,
  });

  const toggleType = (t: BusinessType) =>
    setTypes((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));

  return (
    <PanelCard
      title="Audiencia sin campañas"
      subtitle="Y qué negocios tiene alrededor"
      icon={<NearMeRoundedIcon fontSize="small" />}
      tone="success"
      right={
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
      }
    >
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
          <Box
            sx={{
              display: 'grid',
              gap: 2,
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' },
              p: 1.75,
              mb: 2,
              borderRadius: 1.5,
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            <HeadlineStat
              value={data.reachableAudience}
              label="Se activan con un negocio nuestro al lado"
              color={theme.palette.success.main}
              icon={<BoltRoundedIcon sx={{ fontSize: 18 }} />}
            />
            <HeadlineStat
              value={data.prospectAudience}
              label="Sólo si vendemos un negocio de afuera"
              color={theme.palette.info.main}
              icon={<HandshakeRoundedIcon sx={{ fontSize: 18 }} />}
            />
            <HeadlineStat
              value={data.isolatedAudience}
              label="Sin nadie alrededor"
              color={theme.palette.text.disabled}
              icon={<PlaceOutlinedIcon sx={{ fontSize: 18 }} />}
            />
          </Box>

          <BusinessTypeFilter
            breakdown={data.byBusinessType ?? []}
            selected={types}
            onToggle={toggleType}
            onClear={() => setTypes([])}
          />

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
                {types.length
                  ? 'Ningún negocio de ese rubro quedó sin campañas en el período.'
                  : 'Todos los negocios con audiencia enviaron campañas en este período.'}
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
                  onShare={(r, neighbor) =>
                    setShare({ row: r, neighborId: neighbor?.id ?? null })
                  }
                />
              ))}
            </Stack>
          )}

          <Typography
            variant="caption"
            color="text.disabled"
            sx={{ display: 'block', mt: 1.5 }}
          >
            Total parado: {nf.format(data.totalNonSenderAudience)} contactos en {data.rows.length}{' '}
            negocios. Los de afuera salen de los leads registrados y se cruzan por código postal,
            sin importar el rubro.
          </Typography>
        </>
      )}
      <ShareAudienceDialog
        open={Boolean(share)}
        onClose={() => setShare(null)}
        row={share?.row ?? null}
        initialTargetId={share?.neighborId ?? null}
      />
    </PanelCard>
  );
}
