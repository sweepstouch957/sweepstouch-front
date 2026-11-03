'use client';

import MarkEmailReadRoundedIcon from '@mui/icons-material/MarkEmailReadRounded';
import { alpha, Avatar, Box, Stack, Typography, useTheme } from '@mui/material';
import React from 'react';

import WeeklyReportCard from '@/components/application-ui/reports/weekly-report-card';

/** Correo semanal a tiendas: a quién le llegó, a quién le falta el correo y envío manual. */
export default function Page(): React.JSX.Element {
  const theme = useTheme();
  const accent = theme.palette.primary.main;

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Stack
        direction="row"
        alignItems="center"
        spacing={1.5}
        sx={{ mb: 3 }}
      >
        <Avatar sx={{ width: 44, height: 44, bgcolor: alpha(accent, 0.12), color: accent, borderRadius: 2 }}>
          <MarkEmailReadRoundedIcon />
        </Avatar>
        <Box>
          <Typography
            variant="h5"
            sx={{ fontWeight: 700, letterSpacing: -0.3, lineHeight: 1.2 }}
          >
            Correo semanal a tiendas
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mt: 0.25 }}
          >
            El reporte de campañas que reciben las tiendas cada lunes. Elige la semana, pon el correo que falte y envíalo.
          </Typography>
        </Box>
      </Stack>
      <WeeklyReportCard />
    </Box>
  );
}
