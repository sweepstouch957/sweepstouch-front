// src/components/shared/StatItem.tsx
'use client';

import { Box, Stack, Typography } from '@mui/material';

export default function StatItem({
  icon,
  label,
  value,
  help,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  help?: string;
}) {
  return (
    <Box
      sx={{
        p: 2,
        borderRadius: 2,
        bgcolor: 'background.paper',
        border: (t) => `1px solid ${t.palette.divider}`,
        boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
        height: '100%',
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        spacing={1}
        mb={0.5}
      >
        <Box sx={{ display: 'grid', placeItems: 'center' }}>{icon}</Box>
        <Typography
          variant="caption"
          color="text.secondary"
        >
          {label}
        </Typography>
      </Stack>
      <Typography
        variant="h6"
        fontWeight={800}
        lineHeight={1.2}
      >
        {value}
      </Typography>
      {help && (
        <Typography
          variant="caption"
          color="text.secondary"
        >
          {help}
        </Typography>
      )}
    </Box>
  );
}
