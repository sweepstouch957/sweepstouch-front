// components/KpiCard.tsx
'use client';

import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';
import LaunchIcon from '@mui/icons-material/Launch';
import { alpha, Box, Card, CardActionArea, Tooltip, Typography, useTheme } from '@mui/material';
import Link from 'next/link';
import { ReactNode } from 'react';

type KpiVariant = 'error' | 'info' | 'success' | 'warning';

interface KpiCardProps {
  icon: ReactNode;
  label: string;
  descriptions?: string;
  value: string | number;
  variant?: KpiVariant;
  href?: string;
  external?: boolean;
  tooltip?: string;
  ariaLabel?: string;
  showLinkHint?: boolean;
  onClick?: () => void;
  /**
   * 'stacked' (default) — icono arriba, valor centrado. El layout histórico.
   * 'horizontal' — icono a la izquierda, label+valor a la derecha. Para filas
   * de KPIs compactas (dashboards tipo billing) sin tener que reinventar la card.
   */
  layout?: 'stacked' | 'horizontal';
}

const KpiCard = ({
  icon,
  label,
  descriptions,
  value,
  variant,
  href,
  external = false,
  tooltip,
  ariaLabel,
  showLinkHint = true,
  onClick,
  layout = 'stacked',
}: KpiCardProps) => {
  const theme = useTheme();

  const isClickable = Boolean(href || onClick);
  // El acento sigue al `variant`; si no hay, usa el primary del theme (respeta
  // el dialog de customización).
  const accent = variant ? theme.palette[variant].main : theme.palette.primary.main;
  const horizontal = layout === 'horizontal';

  const iconBox = (
    <Box
      sx={{
        width: 40,
        height: 40,
        flexShrink: 0,
        borderRadius: horizontal ? 2 : '50%',
        // Antes: theme.palette.grey[50] fijo → en dark mode quedaba un círculo
        // gris claro flotando. Ahora deriva del acento y funciona en ambos modos.
        bgcolor: alpha(accent, theme.palette.mode === 'dark' ? 0.16 : 0.1),
        color: accent,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {icon}
    </Box>
  );

  const Inner = horizontal ? (
    <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1.5, minHeight: 88 }}>
      {iconBox}
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Typography
          variant="caption"
          fontWeight={600}
          color="text.secondary"
          className="kpi-label"
          sx={{ textTransform: 'uppercase', letterSpacing: 0.5, display: 'block' }}
          noWrap
        >
          {label}
        </Typography>
        <Typography variant="h5" fontWeight={800} sx={{ lineHeight: 1.2 }} noWrap>
          {value}
        </Typography>
        {descriptions && (
          <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block' }}>
            {descriptions}
          </Typography>
        )}
      </Box>
      {isClickable && showLinkHint && (
        <Box aria-hidden sx={{ display: 'flex', color: 'text.disabled' }}>
          {external ? <LaunchIcon fontSize="small" /> : <ChevronRightRoundedIcon fontSize="small" />}
        </Box>
      )}
    </Box>
  ) : (
    <Box
      sx={{
        p: 2,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        gap: 0.5,
        position: 'relative',
        minHeight: 120,
      }}
    >
      {isClickable && showLinkHint && (
        <Box
          aria-hidden
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            display: 'flex',
            alignItems: 'center',
            color: 'text.disabled',
          }}
        >
          {external ? <LaunchIcon fontSize="small" /> : <ChevronRightRoundedIcon fontSize="small" />}
        </Box>
      )}

      <Box sx={{ mb: 1 }}>{iconBox}</Box>

      <Typography
        variant="h6"
        fontWeight={500}
        color={variant ? `${variant}.main` : 'text.secondary'}
        className="kpi-label"
      >
        {label}
      </Typography>

      <Typography
        variant="h2"
        fontWeight={700}
      >
        {value}
      </Typography>

      {descriptions && (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mb: 0.5 }}
        >
          {descriptions}
        </Typography>
      )}
    </Box>
  );

  // CardActionArea da ripple + foco por teclado gratis (accesible).
  // Sin href ni onClick queda `disabled` → sin cursor pointer ni ripple, para que
  // se note cuáles navegan y cuáles no.
  const actionSx = {
    borderRadius: 3,
    '&:hover .kpi-label': { textDecoration: isClickable ? 'underline' : 'none' },
  } as const;

  const cardContent = href ? (
    <CardActionArea
      component={Link}
      href={href}
      prefetch={false}
      target={external ? '_blank' : undefined}
      rel={external ? 'noopener noreferrer' : undefined}
      aria-label={ariaLabel || `${label}: ${value}`}
      sx={actionSx}
      onClick={onClick}
    >
      {Inner}
    </CardActionArea>
  ) : (
    <CardActionArea
      sx={actionSx}
      onClick={onClick}
      disabled={!onClick}
      aria-label={onClick ? ariaLabel || `${label}: ${value}` : undefined}
    >
      {Inner}
    </CardActionArea>
  );

  const card = (
    <Card
      variant="outlined"
      sx={{
        borderRadius: 3,
        height: '100%',
        width: '100%',
        // Sin sombras: el resto del panel usa outlined + divider.
        boxShadow: 'none',
        borderColor: 'divider',
        transition: 'border-color .15s, background-color .15s',
        ...(isClickable && {
          '&:hover': {
            borderColor: alpha(accent, 0.5),
            bgcolor: alpha(accent, theme.palette.mode === 'dark' ? 0.06 : 0.03),
          },
        }),
      }}
    >
      {cardContent}
    </Card>
  );

  return tooltip ? <Tooltip title={tooltip}>{card}</Tooltip> : card;
};

export default KpiCard;
