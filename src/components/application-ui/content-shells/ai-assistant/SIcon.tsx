'use client';

/** Logo S de Sweepstouch: estático, girando (pensando) o latiendo (escribiendo). */
import { Box, useTheme } from '@mui/material';
import React from 'react';

/* ─── Sweepstouch S Icon ─── */
export const SIcon: React.FC<{
  size?: number;
  color?: string;
  spin?: boolean;
  pulse?: boolean;
}> = ({ size = 24, color, spin = false, pulse = false }) => {
  const theme = useTheme();
  const c = color || theme.palette.primary.main;

  const animationStyle = spin
    ? {
        animation: 'sIconSpin 1.8s cubic-bezier(0.68, -0.55, 0.27, 1.55) infinite',
        '@keyframes sIconSpin': {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
      }
    : pulse
      ? {
          animation: 'sIconPulse 1.4s ease-in-out infinite',
          '@keyframes sIconPulse': {
            '0%, 100%': { opacity: 0.5, transform: 'scale(0.85)' },
            '50%': { opacity: 1, transform: 'scale(1.15)' },
          },
          '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
        }
      : {};

  return (
    <Box
      component="svg"
      viewBox="0 0 237 258"
      sx={{ width: size, height: size, display: 'block', flexShrink: 0, ...animationStyle }}
    >
      <path
        d="M105 61.7v9l-8.5 2.1C86 75.4 78.4 79.6 71.1 86.9c-10 10-15.1 22.8-15.1 37.6 0 13.9 3.3 23 13.3 36.2l5.4 7.3 34.2-25.5c18.8-14 34.6-25.5 35.2-25.5 2.2 0 4.9 8.5 4.9 15.3 0 10.1-3.5 16.9-10.8 21.4-6.5 4-7.2 3.5-7.2-5.8 0-4.4-.4-7.9-.8-7.7-2.6 1-42.2 31.2-42 32 .2.4 9.8 7.8 21.3 16.4l21 15.6.3-9.4.3-9.4 6.1-1.1c9.7-1.9 18.3-6.7 26.4-14.7 10.9-10.9 15.4-21.6 15.4-37.1 0-8.8-1.8-17.2-5.1-23.8S161.6 90 160.4 90.4c-.6.2-15.9 11.5-34.1 25S92.5 140 91.6 140c-2.9 0-5.6-7.6-5.6-15.6 0-5.9.5-8.1 2.8-12.5 2.9-5.6 8.4-10.3 13.4-11.5l2.7-.6.3 9 .3 9 21.1-15.7c11.6-8.6 21.2-16 21.3-16.4.1-.5-8.9-7.6-20.1-15.9s-20.9-15.5-21.5-16c-1-.8-1.3.9-1.3 7.9"
        fill={c}
      />
    </Box>
  );
};
