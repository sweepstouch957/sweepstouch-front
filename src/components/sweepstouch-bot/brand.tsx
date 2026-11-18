'use client';

import { alpha, Box, darken, useTheme } from '@mui/material';
import { useMemo } from 'react';

export const NO_MOTION = '@media (prefers-reduced-motion: reduce)';

/**
 * Los colores de Sweepstouch Bot. Todo sale del rosa de marca del theme (primary):
 * cero hex, y funciona igual en claro y oscuro.
 */
export function useBrand() {
  const theme = useTheme();
  return useMemo(() => {
    const pink = theme.palette.primary;
    return {
      pink: pink.main,
      onBrand: pink.contrastText,
      gradient: `linear-gradient(135deg, ${pink.light} 0%, ${pink.main} 50%, ${darken(
        pink.main,
        0.25
      )} 100%)`,
      glow: (amount: number) => alpha(pink.main, amount),
      subtle: alpha(theme.palette.text.primary, theme.palette.mode === 'dark' ? 0.08 : 0.04),
    };
  }, [theme]);
}

export type Brand = ReturnType<typeof useBrand>;

const MARK_MASK = 'url(/st-logo.png) left center / auto 100% no-repeat';

/** La marca de Sweepstouch (las dos flechas), recortada del logo oficial y pintada con el color actual. */
export function BrandMark({ size }: { size: number }) {
  return (
    <Box
      aria-hidden
      sx={{
        width: size * 0.8,
        height: size,
        flexShrink: 0,
        bgcolor: 'currentColor',
        mask: MARK_MASK,
        WebkitMask: MARK_MASK,
      }}
    />
  );
}

/** Círculo de marca con el logo dentro: avatar del bot en cabecera, bienvenida y mensajes. */
export function BrandAvatar({ size, inverted = false }: { size: number; inverted?: boolean }) {
  const brand = useBrand();
  return (
    <Box
      aria-hidden
      sx={{
        width: size,
        height: size,
        flexShrink: 0,
        borderRadius: '50%',
        display: 'grid',
        placeItems: 'center',
        color: inverted ? brand.pink : brand.onBrand,
        background: inverted ? brand.onBrand : brand.gradient,
      }}
    >
      <BrandMark size={Math.round(size * 0.5)} />
    </Box>
  );
}
