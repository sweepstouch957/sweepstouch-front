'use client';

/**
 * Piezas visuales de la página de estadísticas: tarjeta plana (borde de 1px, sin
 * sombra), KPI, píldora de estado y barras. Colores sólo del theme.
 */

import { PANEL, panelBorder } from '@/components/application-ui/content-shells/store-managment/panel-kit';
import { tint, toneText } from '@/theme/semantic';
import { alpha, Box, Stack, Typography, useTheme, type SxProps, type Theme } from '@mui/material';
import type React from 'react';
import type { Tone } from './constants';

/** Fondo gris suave (chips de metadatos, bloques internos). */
export const soft = (theme: Theme) => alpha(theme.palette.text.primary, theme.palette.mode === 'dark' ? 0.08 : 0.04);

export function toneColor(theme: Theme, tone: Tone) {
  return tone === 'neutral' ? theme.palette.text.secondary : theme.palette[tone].main;
}

export function StatsCard({
  title,
  subtitle,
  badge,
  action,
  children,
  sx,
}: {
  title?: string;
  subtitle?: React.ReactNode;
  badge?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
  sx?: SxProps<Theme>;
}) {
  const theme = useTheme();
  return (
    <Box
      component="section"
      sx={{
        bgcolor: 'background.paper',
        border: panelBorder(theme),
        borderRadius: `${PANEL.radiusCard}px`,
        p: { xs: 2, sm: 3 },
        display: 'flex',
        flexDirection: 'column',
        gap: 2.5,
        minWidth: 0,
        ...sx,
      }}
    >
      {title && (
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="flex-start"
          gap={1.5}
          flexWrap="wrap"
        >
          <Stack
            gap={0.5}
            sx={{ minWidth: 0 }}
          >
            <Typography
              component="h2"
              sx={{ fontSize: 16, fontWeight: 700, m: 0 }}
            >
              {title}
            </Typography>
            {subtitle && <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>{subtitle}</Typography>}
          </Stack>
          {badge}
          {action}
        </Stack>
      )}
      {children}
    </Box>
  );
}

export function Pill({ label, tone = 'neutral', dot = true }: { label: string; tone?: Tone; dot?: boolean }) {
  const theme = useTheme();
  const fg = tone === 'neutral' ? theme.palette.text.secondary : toneText(theme, tone);
  return (
    <Box
      component="span"
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 0.75,
        px: 1.25,
        py: 0.5,
        borderRadius: 999,
        bgcolor: tone === 'neutral' ? soft(theme) : tint(theme, tone),
        color: fg,
        fontSize: 12,
        fontWeight: 600,
        whiteSpace: 'nowrap',
      }}
    >
      {dot && <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: fg }} />}
      {label}
    </Box>
  );
}

/** Chip plano de metadatos ("Proveedor: Infobip"). */
export function MetaChip({ children, strong }: { children: React.ReactNode; strong?: boolean }) {
  const theme = useTheme();
  return (
    <Box
      component="span"
      sx={{
        px: 1.25,
        py: 0.5,
        borderRadius: 2,
        fontSize: 12,
        bgcolor: strong ? tint(theme, 'primary') : soft(theme),
        color: strong ? toneText(theme, 'primary') : 'text.secondary',
        fontWeight: strong ? 600 : 400,
      }}
    >
      {children}
    </Box>
  );
}

export function StatTile({
  label,
  value,
  hint,
  tone = 'neutral',
  hintTone,
  onClick,
}: {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  /** Color de la cifra. neutral = color de texto. */
  tone?: Tone;
  hintTone?: Tone;
  onClick?: () => void;
}) {
  const theme = useTheme();
  return (
    <Box
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => (e.key === 'Enter' || e.key === ' ') && onClick() : undefined}
      sx={{
        bgcolor: 'background.paper',
        border: panelBorder(theme),
        borderRadius: `${PANEL.radiusKpi}px`,
        px: 2.5,
        py: 2.25,
        display: 'flex',
        flexDirection: 'column',
        gap: 0.75,
        minWidth: 0,
        cursor: onClick ? 'pointer' : 'default',
        transition: 'border-color .15s',
        ...(onClick && {
          '&:hover, &:focus-visible': { borderColor: alpha(theme.palette.primary.main, 0.4), outline: 'none' },
        }),
      }}
    >
      <Typography sx={{ fontSize: 13, color: 'text.secondary', fontWeight: 500 }}>{label}</Typography>
      <Typography
        sx={{
          fontSize: 28,
          fontWeight: 800,
          letterSpacing: '-.02em',
          lineHeight: 1.1,
          color: tone === 'neutral' ? 'text.primary' : toneColor(theme, tone),
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {value}
      </Typography>
      {hint && (
        <Typography
          sx={{
            fontSize: 12,
            color: hintTone ? toneColor(theme, hintTone) : 'text.secondary',
            fontWeight: hintTone ? 600 : 400,
          }}
        >
          {hint}
        </Typography>
      )}
    </Box>
  );
}

/** Barra horizontal simple (track suave + relleno). */
export function Bar({ value, color, height = 10 }: { value: number; color: string; height?: number }) {
  const theme = useTheme();
  return (
    <Box sx={{ height, borderRadius: height / 2, bgcolor: soft(theme), overflow: 'hidden' }}>
      <Box
        sx={{
          height: '100%',
          width: `${Math.max(0, Math.min(100, value))}%`,
          bgcolor: color,
          borderRadius: height / 2,
          transition: 'width .4s',
        }}
      />
    </Box>
  );
}

/** Rejilla que se reacomoda sola. */
export function AutoGrid({ min, gap = 1.5, children }: { min: number; gap?: number; children: React.ReactNode }) {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: `repeat(auto-fit, minmax(min(100%, ${min}px), 1fr))`,
        gap,
      }}
    >
      {children}
    </Box>
  );
}
