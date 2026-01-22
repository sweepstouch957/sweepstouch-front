'use client';

import { alpha, Box, Card, CardContent, Chip, Stack, Typography } from '@mui/material';
import React from 'react';

export function MetricPill(props: {
  label: string;
  tone?: 'info' | 'success' | 'warning' | 'primary';
}) {
  const { label, tone = 'primary' } = props;
  return (
    <Chip
      size="small"
      label={label}
      sx={(t) => ({
        fontWeight: 900,
        borderRadius: 999,
        bgcolor: alpha(t.palette[tone].main, 0.12),
        color: t.palette[tone].dark,
      })}
    />
  );
}

export function GlassCard(props: {
  title?: React.ReactNode;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  const { title, right, children } = props;
  return (
    <Card
      variant="outlined"
      sx={(t) => ({
        borderRadius: 3,
        borderColor: alpha(t.palette.divider, 0.9),
        bgcolor: alpha(t.palette.background.paper, 0.92),
        boxShadow: `0 12px 28px ${alpha(t.palette.common.black, 0.06)}`,
        overflow: 'hidden',
        position: 'relative',
      })}
    >
      <Box
        sx={(t) => ({
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          background: `radial-gradient(1200px circle at 10% 0%, ${alpha(
            t.palette.primary.main,
            0.16
          )}, transparent 55%)`,
        })}
      />
      <CardContent sx={{ p: 2.25, position: 'relative' }}>
        {title || right ? (
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            gap={1.5}
            sx={{ mb: 1 }}
          >
            <Typography sx={{ fontWeight: 950 }}>{title}</Typography>
            {right}
          </Stack>
        ) : null}
        {children}
      </CardContent>
    </Card>
  );
}
