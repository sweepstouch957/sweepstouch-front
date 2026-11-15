'use client';

import { Box, Stack, useTheme } from '@mui/material';
import { PROJECT_COLORS } from './constants';

export function ColorPicker({ value, onChange }: { value: string; onChange: (c: string) => void }) {
  const theme = useTheme();
  return (
    <Stack
      direction="row"
      gap={0.75}
      flexWrap="wrap"
    >
      {PROJECT_COLORS.map((c) => (
        <Box
          key={c}
          onClick={() => onChange(c)}
          sx={{
            width: 28,
            height: 28,
            borderRadius: 1.5,
            bgcolor: c,
            cursor: 'pointer',
            border:
              value === c ? `3px solid ${theme.palette.background.paper}` : '3px solid transparent',
            outline: value === c ? `2px solid ${c}` : 'none',
            transition: 'all 0.15s',
            '&:hover': { transform: 'scale(1.12)' },
          }}
        />
      ))}
    </Stack>
  );
}
