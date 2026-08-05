'use client';

/**
 * Piezas del Store Panel 2.0 (proyecto de Claude Design "Sweepstouch panel access").
 *
 * El diseño define un lenguaje propio y consistente: tarjetas blancas de radio
 * grande sobre un lienzo lila, rejillas separadas por líneas de 1px en vez de
 * bordes por celda, etiquetas en versalitas y una sola acción rosa por bloque.
 * Reproducirlo a mano en cada panel garantiza que se desalinee, así que vive acá.
 *
 * Los colores salen del theme del proyecto (`primary` = el rosa de marca) para
 * que el modo oscuro siga funcionando; los del diseño se usan sólo donde no hay
 * equivalente semántico.
 */

import { alpha, Box, Stack, Typography, useTheme, type SxProps, type Theme } from '@mui/material';
import React from 'react';

/** Radios y separaciones del diseño, en un solo lugar. */
export const PANEL = {
  radiusHero: 20,
  radiusCard: 18,
  radiusKpi: 16,
  radiusControl: 10,
  gap: 1.5,
} as const;

/** Sólo el color del borde, para cuando hay que alternarlo con otro. */
export function panelBorderColor(theme: Theme) {
  return alpha(theme.palette.text.primary, theme.palette.mode === 'dark' ? 0.1 : 0.07);
}

/** Borde de tarjeta: casi invisible, pero suficiente para separar del lienzo. */
export function panelBorder(theme: Theme) {
  return `1px solid ${panelBorderColor(theme)}`;
}

/** Línea divisoria interna de las rejillas de datos. */
export function panelDivider(theme: Theme) {
  return alpha(theme.palette.text.primary, theme.palette.mode === 'dark' ? 0.09 : 0.05);
}

/* ─── Tarjeta ─────────────────────────────────────────────────────────────── */

export function PanelCard({
  children,
  hero = false,
  sx,
  ...rest
}: {
  children: React.ReactNode;
  /** La tarjeta de portada del panel: radio y padding mayores. */
  hero?: boolean;
  sx?: SxProps<Theme>;
  [key: string]: any;
}) {
  const theme = useTheme();
  return (
    <Box
      component="section"
      {...rest}
      sx={{
        borderRadius: `${hero ? PANEL.radiusHero : PANEL.radiusCard}px`,
        bgcolor: 'background.paper',
        border: panelBorder(theme),
        overflow: 'hidden',
        ...sx,
      }}
    >
      {children}
    </Box>
  );
}

/**
 * Cabecera de sección: icono de color, título, una aclaración de para qué sirve
 * y la acción a la derecha. La aclaración es lo que evita el "¿esto qué es?".
 */
export function SectionHeader({
  icon,
  title,
  hint,
  count,
  action,
}: {
  icon?: React.ReactNode;
  title: string;
  hint?: string;
  count?: number | string;
  action?: React.ReactNode;
}) {
  const theme = useTheme();
  return (
    <Stack
      direction="row"
      alignItems="center"
      flexWrap="wrap"
      useFlexGap
      gap={1}
      sx={{
        px: 2.25,
        py: 1.75,
        borderBottom: `1px solid ${panelDivider(theme)}`,
        minWidth: 0,
      }}
    >
      {icon}
      <Typography
        component="h2"
        sx={{ fontSize: 14.5, fontWeight: 700, m: 0 }}
      >
        {title}
      </Typography>
      {count !== undefined && (
        <Box
          sx={{
            fontSize: 10.5,
            fontWeight: 800,
            color: 'text.secondary',
            bgcolor: alpha(theme.palette.text.primary, 0.05),
            borderRadius: 20,
            px: 1.1,
            py: 0.35,
          }}
        >
          {count}
        </Box>
      )}
      {hint && (
        <Typography
          sx={{ fontSize: 11.5, color: 'text.secondary', flexShrink: 0 }}
        >
          {hint}
        </Typography>
      )}
      {action && <Box sx={{ ml: 'auto', flexShrink: 0 }}>{action}</Box>}
    </Stack>
  );
}

/* ─── Rejilla de datos ────────────────────────────────────────────────────── */

/**
 * Rejilla de campos separada por líneas de 1px: el truco del diseño es pintar
 * el fondo del contenedor del color de la línea y dejar `gap:1px` entre celdas
 * blancas. Sin bordes por celda, no hay dobles líneas ni esquinas rotas.
 */
export function FieldGrid({
  min = 150,
  children,
}: {
  /** Ancho mínimo de columna antes de partir a la siguiente fila. */
  min?: number;
  children: React.ReactNode;
}) {
  const theme = useTheme();
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: `repeat(auto-fit, minmax(${min}px, 1fr))`,
        gap: '1px',
        bgcolor: panelDivider(theme),
      }}
    >
      {children}
    </Box>
  );
}

/** Una celda de la rejilla: etiqueta en versalitas y el dato debajo. */
export function Field({
  label,
  value,
  empty,
  mono = false,
  span = 1,
  children,
}: {
  label: string;
  value?: React.ReactNode;
  /** Texto cuando no hay dato. Se pinta apagado, nunca en blanco. */
  empty?: string;
  mono?: boolean;
  /** >1 ⇒ la celda ocupa la fila entera, cuente la rejilla las columnas que cuente. */
  span?: number;
  children?: React.ReactNode;
}) {
  const missing = value === undefined || value === null || value === '';
  return (
    <Box
      sx={{
        bgcolor: 'background.paper',
        px: 2.25,
        py: 1.75,
        display: 'flex',
        flexDirection: 'column',
        gap: 0.5,
        // `1 / -1` y no `span N`: la rejilla es auto-fit, así que en móvil
        // queda en una sola columna y un `span 2` inventaría una segunda.
        gridColumn: span > 1 ? '1 / -1' : undefined,
        minWidth: 0,
      }}
    >
      <Typography
        sx={{
          fontSize: 10,
          fontWeight: 800,
          letterSpacing: 1,
          color: 'text.disabled',
        }}
      >
        {label.toUpperCase()}
      </Typography>
      {children ??
        (missing ? (
          <Typography sx={{ fontSize: 14, color: 'text.disabled' }}>
            {empty || 'Sin registrar'}
          </Typography>
        ) : (
          <Typography
            sx={{
              fontSize: mono ? 13 : 14,
              fontWeight: 650,
              ...(mono ? { fontFamily: 'ui-monospace, Menlo, monospace' } : {}),
              wordBreak: 'break-word',
            }}
          >
            {value}
          </Typography>
        ))}
    </Box>
  );
}

/* ─── KPI ─────────────────────────────────────────────────────────────────── */

export function KpiCard({
  icon,
  label,
  value,
  delta,
  tone = 'neutral',
}: {
  icon?: React.ReactNode;
  label: string;
  value: React.ReactNode;
  delta?: string;
  tone?: 'neutral' | 'success' | 'warning' | 'error';
}) {
  const theme = useTheme();
  const deltaColor =
    tone === 'neutral' ? theme.palette.text.secondary : theme.palette[tone].main;

  return (
    <Box
      sx={{
        borderRadius: `${PANEL.radiusKpi}px`,
        bgcolor: 'background.paper',
        border: panelBorder(theme),
        px: 2,
        py: 1.9,
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
        minWidth: 0,
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        gap={1}
      >
        {icon}
        <Typography
          sx={{
            fontSize: 10,
            fontWeight: 800,
            letterSpacing: 1,
            color: 'text.secondary',
          }}
          noWrap
        >
          {label.toUpperCase()}
        </Typography>
      </Stack>
      <Typography
        sx={{
          fontSize: 25,
          fontWeight: 700,
          letterSpacing: -0.7,
          lineHeight: 1,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {value}
      </Typography>
      {delta && (
        <Typography sx={{ fontSize: 11.5, fontWeight: 650, color: deltaColor }}>
          {delta}
        </Typography>
      )}
    </Box>
  );
}

/** Rejilla de KPIs que se reacomoda sola. */
export function KpiRow({ min = 184, children }: { min?: number; children: React.ReactNode }) {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: `repeat(auto-fit, minmax(${min}px, 1fr))`,
        gap: PANEL.gap,
      }}
    >
      {children}
    </Box>
  );
}

/* ─── Píldoras ────────────────────────────────────────────────────────────── */

/** Estado con punto: el color nunca es el único indicador, siempre hay texto. */
export function StatusPill({
  label,
  tone = 'neutral',
  dot = true,
}: {
  label: string;
  tone?: 'neutral' | 'success' | 'warning' | 'error' | 'info';
  dot?: boolean;
}) {
  const theme = useTheme();
  const color = tone === 'neutral' ? theme.palette.text.secondary : theme.palette[tone].dark;
  const bg =
    tone === 'neutral'
      ? alpha(theme.palette.text.primary, 0.05)
      : alpha(theme.palette[tone].main, 0.12);

  return (
    <Box
      component="span"
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 0.7,
        height: 22,
        px: 1.15,
        borderRadius: '7px',
        bgcolor: bg,
        color,
        fontSize: 10.5,
        fontWeight: 800,
        letterSpacing: 0.4,
        whiteSpace: 'nowrap',
      }}
    >
      {dot && tone !== 'neutral' && (
        <Box sx={{ width: 5, height: 5, borderRadius: '50%', bgcolor: color }} />
      )}
      {label}
    </Box>
  );
}

/** Bloque vacío del diseño: título en negrita y una línea que dice qué hacer. */
export function EmptyBlock({ title, hint }: { title: string; hint: string }) {
  return (
    <Stack
      alignItems="center"
      textAlign="center"
      gap={0.75}
      sx={{ px: 2.25, py: 3.25 }}
    >
      <Typography sx={{ fontSize: 13, fontWeight: 700 }}>{title}</Typography>
      <Typography sx={{ fontSize: 12, color: 'text.secondary', maxWidth: 260, lineHeight: 1.5 }}>
        {hint}
      </Typography>
    </Stack>
  );
}

/* ─── Portada de página ───────────────────────────────────────────────────── */

/**
 * La portada del diseño: ruta en versalitas, título grande, una línea que
 * resume la vista con números reales, y las acciones a la derecha. Reemplaza al
 * `PageHeading` genérico en las pantallas migradas.
 */
export function PageHero({
  eyebrow,
  title,
  subtitle,
  actions,
}: {
  eyebrow: string;
  title: string;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  const theme = useTheme();
  return (
    <Box
      component="section"
      sx={{
        borderRadius: `${PANEL.radiusHero}px`,
        bgcolor: 'background.paper',
        border: panelBorder(theme),
        px: 2.5,
        py: 2.25,
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        flexWrap: 'wrap',
      }}
    >
      <Box sx={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 0.6 }}>
        <Eyebrow>{eyebrow}</Eyebrow>
        <Typography
          component="h1"
          sx={{ m: 0, fontSize: 24, fontWeight: 700, letterSpacing: -0.6, lineHeight: 1.2 }}
        >
          {title}
        </Typography>
        {subtitle && (
          <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>{subtitle}</Typography>
        )}
      </Box>
      {actions && (
        <Box sx={{ ml: 'auto', display: 'flex', gap: 1, flexWrap: 'wrap' }}>{actions}</Box>
      )}
    </Box>
  );
}

/**
 * Cubeta de la cartera por antigüedad de deuda. El color vive en el punto, la
 * etiqueta y la barra de avance; el fondo se tiñe sólo cuando está seleccionada.
 */
export function DebtBucket({
  label,
  age,
  count,
  amount,
  color,
  share,
  active = false,
  onClick,
}: {
  label: string;
  age: string;
  count: number;
  amount: string;
  color: string;
  /** Porción del total, 0–1, para la barra. */
  share: number;
  active?: boolean;
  onClick?: () => void;
}) {
  const theme = useTheme();
  return (
    <Box
      role={onClick ? 'button' : undefined}
      aria-pressed={onClick ? active : undefined}
      onClick={onClick}
      sx={{
        borderRadius: `${PANEL.radiusKpi}px`,
        px: 1.75,
        py: 1.5,
        display: 'flex',
        flexDirection: 'column',
        gap: 0.75,
        minWidth: 0,
        cursor: onClick ? 'pointer' : 'default',
        bgcolor: active ? alpha(color, 0.12) : alpha(color, 0.045),
        border: `1px solid ${alpha(color, active ? 0.55 : 0.18)}`,
        transition: 'background-color .18s, border-color .18s',
        '&:hover': onClick ? { borderColor: alpha(color, 0.5) } : undefined,
        '@media (prefers-reduced-motion: reduce)': { transition: 'none' },
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        gap={0.75}
      >
        <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: color, flexShrink: 0 }} />
        <Typography
          sx={{ fontSize: 10, fontWeight: 800, letterSpacing: 0.7, color, lineHeight: 1 }}
          noWrap
        >
          {label}
        </Typography>
        <Typography
          sx={{ ml: 'auto', fontSize: 10, fontWeight: 700, color: 'text.secondary', whiteSpace: 'nowrap' }}
        >
          {age}
        </Typography>
      </Stack>

      <Typography
        sx={{
          fontSize: 24,
          fontWeight: 700,
          letterSpacing: -0.7,
          lineHeight: 1,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {count}
      </Typography>

      <Typography sx={{ fontSize: 12, fontWeight: 650, color: 'text.secondary' }}>
        {amount}
      </Typography>

      {/* Cuánto de la cartera está acá: se compara sin leer los montos */}
      <Box
        sx={{
          height: 4,
          borderRadius: 2,
          bgcolor: alpha(theme.palette.text.primary, 0.06),
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            width: `${Math.min(100, Math.max(0, share * 100))}%`,
            height: '100%',
            bgcolor: color,
            borderRadius: 2,
          }}
        />
      </Box>
    </Box>
  );
}

/** Píldora de filtro del diseño: 33px, radio 9, borde fino. */
export function FilterPill({
  label,
  active = false,
  tone,
  onClick,
  endIcon,
}: {
  label: React.ReactNode;
  active?: boolean;
  /** Color propio (por ejemplo el de la cubeta de deuda). */
  tone?: string;
  onClick?: () => void;
  endIcon?: React.ReactNode;
}) {
  const theme = useTheme();
  const c = tone || theme.palette.primary.main;
  return (
    <Box
      component={onClick ? 'button' : 'span'}
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      aria-pressed={onClick ? active : undefined}
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 0.75,
        height: 33,
        px: 1.4,
        borderRadius: '9px',
        fontSize: 12.5,
        fontWeight: active ? 700 : 600,
        fontFamily: 'inherit',
        whiteSpace: 'nowrap',
        cursor: onClick ? 'pointer' : 'default',
        color: active ? c : theme.palette.text.secondary,
        bgcolor: active ? alpha(c, 0.12) : 'transparent',
        border: `1px solid ${alpha(active ? c : theme.palette.divider, active ? 0.5 : 0.9)}`,
        transition: 'background-color .18s, border-color .18s, color .18s',
        '&:hover': onClick ? { bgcolor: alpha(c, active ? 0.18 : 0.06) } : undefined,
        '@media (prefers-reduced-motion: reduce)': { transition: 'none' },
      }}
    >
      {label}
      {endIcon}
    </Box>
  );
}

/** Etiqueta suelta en versalitas, para encabezar grupos fuera de una tarjeta. */
export function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <Typography
      sx={{ fontSize: 10, fontWeight: 800, letterSpacing: 1.3, color: 'text.disabled' }}
    >
      {String(children).toUpperCase()}
    </Typography>
  );
}
