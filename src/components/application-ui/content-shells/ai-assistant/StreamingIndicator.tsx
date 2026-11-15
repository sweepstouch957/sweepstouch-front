'use client';

import { alpha, Avatar, Box, Paper, useTheme } from '@mui/material';
import React from 'react';
import { SIcon } from './SIcon';

export const StreamingIndicator: React.FC = () => {
  const theme = useTheme();
  const accent = theme.palette.primary.main;
  const isDark = theme.palette.mode === 'dark';

  return (
    <Box sx={{ display: 'flex', gap: 1.5, mb: 2.5, alignItems: 'flex-start' }}>
      <Avatar sx={{ width: 32, height: 32, bgcolor: alpha(accent, 0.12) }}>
        <SIcon
          size={18}
          color={accent}
          pulse
        />
      </Avatar>
      <Paper
        elevation={0}
        sx={{
          borderRadius: 2.5,
          borderTopLeftRadius: 4,
          bgcolor: isDark
            ? alpha(theme.palette.common.white, 0.06)
            : alpha(theme.palette.common.black, 0.04),
          px: 2,
          py: 1.5,
        }}
      >
        <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
          {[0, 1, 2].map((i) => (
            <Box
              key={i}
              sx={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                bgcolor: accent,
                animation: `streamDot 1.2s ease-in-out ${i * 0.2}s infinite`,
                '@keyframes streamDot': {
                  '0%, 100%': { opacity: 0.3, transform: 'scale(0.8)' },
                  '50%': { opacity: 1, transform: 'scale(1.2)' },
                },
              }}
            />
          ))}
        </Box>
      </Paper>
    </Box>
  );
};
