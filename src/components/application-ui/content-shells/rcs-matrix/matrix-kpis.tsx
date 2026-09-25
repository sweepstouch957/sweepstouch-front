'use client';

import { centsToUsd } from '@/services/rcs-matrix.service';
import WhatsApp from '@mui/icons-material/WhatsApp';
import { alpha, Box, Card, Chip, Divider, Stack, Typography, useTheme } from '@mui/material';
import React from 'react';
import { STATUS_META } from './constants';
import { pct, type MatrixKpis as Kpis } from './matrix-model';
import { WA_FILTERS } from './whatsapp-bot';

/**
 * Celda de la franja. `accent` marca los números accionables; los que filtran
 * la lista se comportan como botón, con foco visible y estado activo.
 */
function Kpi({
  label,
  value,
  sub,
  accent,
  active,
  onClick,
}: {
  label: string;
  value: string | number;
  sub?: string;
  accent?: 'warning' | 'success' | 'error';
  active?: boolean;
  onClick?: () => void;
}): React.JSX.Element {
  const theme = useTheme();
  const tone = accent ? theme.palette[accent].main : theme.palette.text.primary;

  return (
    <Box
      {...(onClick
        ? { component: 'button', type: 'button', onClick, 'aria-pressed': !!active }
        : {})}
      sx={{
        px: 2,
        py: 1.5,
        minWidth: 0,
        textAlign: 'left',
        font: 'inherit',
        color: 'inherit',
        border: 0,
        borderRadius: 2,
        cursor: onClick ? 'pointer' : 'default',
        bgcolor: active ? alpha(tone, 0.08) : 'transparent',
        boxShadow: active ? `inset 0 0 0 1px ${alpha(tone, 0.5)}` : 'none',
        transition: 'background-color .15s ease',
        '&:hover': onClick ? { bgcolor: alpha(tone, 0.06) } : undefined,
        '&:focus-visible': { outline: `2px solid ${tone}`, outlineOffset: -2 },
      }}
    >
      <Typography
        variant="caption"
        color="text.secondary"
        fontWeight={700}
        sx={{ textTransform: 'uppercase', letterSpacing: 0.4 }}
        noWrap
        display="block"
      >
        {label}
      </Typography>
      <Typography
        variant="h5"
        fontWeight={800}
        sx={{
          lineHeight: 1.25,
          fontVariantNumeric: 'tabular-nums',
          color: accent ? tone : 'text.primary',
        }}
        noWrap
      >
        {value}
      </Typography>
      {sub ? (
        <Typography
          variant="caption"
          color="text.secondary"
          noWrap
          display="block"
          title={sub}
        >
          {sub}
        </Typography>
      ) : null}
    </Box>
  );
}

/** Barra apilada por estado: de un vistazo cuánto está abierto vs. cerrado. */
function StatusBar({ byStatus, total }: { byStatus: Record<string, number>; total: number }) {
  const theme = useTheme();
  const colorOf = (c: string) =>
    c === 'default'
      ? theme.palette.grey[400]
      : (theme.palette as any)[c]?.main ?? theme.palette.grey[400];
  const parts = Object.keys(STATUS_META)
    .filter((key) => byStatus[key])
    .map((key) => ({
      key,
      n: byStatus[key],
      label: STATUS_META[key].label,
      color: colorOf(STATUS_META[key].color),
    }));
  if (!total || !parts.length) return null;

  return (
    <Box sx={{ px: 2, pb: 1.5 }}>
      <Box
        sx={{
          display: 'flex',
          height: 6,
          borderRadius: 3,
          overflow: 'hidden',
          bgcolor: 'action.hover',
        }}
      >
        {parts.map((p) => (
          <Box
            key={p.key}
            title={`${p.label}: ${p.n}`}
            sx={{ width: `${(p.n / total) * 100}%`, bgcolor: p.color }}
          />
        ))}
      </Box>
      <Stack
        direction="row"
        spacing={1.5}
        flexWrap="wrap"
        useFlexGap
        sx={{ mt: 0.75 }}
      >
        {parts.map((p) => (
          <Stack
            key={p.key}
            direction="row"
            spacing={0.5}
            alignItems="center"
          >
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: p.color }} />
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ fontVariantNumeric: 'tabular-nums' }}
            >
              {p.label} {p.n}
            </Typography>
          </Stack>
        ))}
      </Stack>
    </Box>
  );
}

interface Props {
  k: Kpis;
  status: string;
  onlyOpen: boolean;
  waFilter: string;
  waCounts: Record<string, number>;
  onToggleOpen: () => void;
  /** Alterna un estado: si ya está puesto, vuelve a 'all'. */
  onToggleStatus: (status: string) => void;
  onWaFilter: (value: string) => void;
}

/**
 * Resumen del período (órdenes + listas). Presentacional: recibe los KPIs ya
 * calculados (matrix-model.computeKpis) y avisa los clicks al shell.
 */
function MatrixKpisImpl({
  k,
  status,
  onlyOpen,
  waFilter,
  waCounts,
  onToggleOpen,
  onToggleStatus,
  onWaFilter,
}: Props): React.JSX.Element {
  return (
    <Card
      sx={{
        borderRadius: 3,
        border: '1px solid',
        borderColor: 'divider',
        boxShadow: 'none',
        p: 0.5,
      }}
    >
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)', lg: 'repeat(6, 1fr)' },
          gap: 0.5,
        }}
      >
        <Kpi
          label="Total"
          value={k.total}
          sub={`${k.orders} órdenes · ${k.lists} listas · ${k.stores} tiendas`}
        />
        <Kpi
          label="Por atender"
          value={k.pending}
          sub={`${pct(k.pending, k.total)} · ${k.customers} personas`}
          accent="warning"
          active={onlyOpen}
          onClick={onToggleOpen}
        />
        <Kpi
          label="Sin cobrar"
          value={k.unpaid}
          sub={centsToUsd(k.unpaidCents)}
          accent="error"
          active={status === 'awaiting_payment'}
          onClick={() => onToggleStatus('awaiting_payment')}
        />
        <Kpi
          label="Venta"
          value={centsToUsd(k.grossCents)}
          sub={`Cobrado ${centsToUsd(k.collectedCents)}`}
          accent="success"
        />
        <Kpi
          label="Ticket promedio"
          value={centsToUsd(k.avgTicketCents)}
          sub={`${k.completed} entregadas · ${k.cancelled} canceladas`}
        />
        <Kpi
          label="Listas en caja"
          value={k.listsValidated}
          sub={`${pct(k.listsValidated, k.lists)} de ${k.lists} · ${k.points.toLocaleString(
            'en-US'
          )} pts`}
          accent="success"
          active={status === 'list_validated'}
          onClick={() => onToggleStatus('list_validated')}
        />
      </Box>
      <StatusBar
        byStatus={k.byStatus}
        total={k.total}
      />

      {/* Respuestas al bot de WhatsApp: cuentan filas por estado y filtran la lista */}
      <Divider />
      <Stack
        direction="row"
        spacing={0.75}
        alignItems="center"
        flexWrap="wrap"
        useFlexGap
        sx={{ px: 2, py: 1.25 }}
      >
        <WhatsApp sx={{ fontSize: 18, color: '#25D366', mr: 0.25 }} />
        {WA_FILTERS.map((o) => {
          const n = o.value === 'all' ? null : waCounts[o.value] || 0;
          const active = waFilter === o.value;
          return (
            <Chip
              key={o.value}
              size="small"
              label={n == null ? o.label : `${o.label} · ${n}`}
              onClick={() => onWaFilter(active && o.value !== 'all' ? 'all' : o.value)}
              color={active ? 'success' : 'default'}
              variant={active ? 'filled' : 'outlined'}
              sx={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}
            />
          );
        })}
      </Stack>
    </Card>
  );
}

export const MatrixKpis = React.memo(MatrixKpisImpl);
