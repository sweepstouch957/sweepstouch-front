'use client';

import {
  alpha,
  Avatar,
  Box,
  Chip,
  LinearProgress,
  Stack,
  Typography,
  useTheme,
} from '@mui/material';
import BarChartRoundedIcon from '@mui/icons-material/BarChartRounded';
import AssessmentRoundedIcon from '@mui/icons-material/AssessmentRounded';
import dynamic from 'next/dynamic';
import React from 'react';
import { useTranslation } from 'react-i18next';

const YearlyReportsSection = dynamic(
  () => import('@/components/application-ui/reports/yearly-reports-section'),
  { ssr: false, loading: () => <LinearProgress sx={{ borderRadius: 1 }} /> }
);

export default function ReportsClient(): React.JSX.Element {
  const theme = useTheme();
  const { t } = useTranslation();
  const accent = theme.palette.primary.main;

  const currentYear = new Date().getFullYear();
  const initialYear = currentYear >= 2026 ? 2026 : currentYear;
  const [year, setYear] = React.useState<number>(initialYear);

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* Page Header */}
      <Stack
        direction="row"
        alignItems="flex-start"
        justifyContent="space-between"
        gap={2}
        sx={{ mb: 3 }}
      >
        <Stack
          direction="row"
          alignItems="center"
          spacing={1.5}
        >
          <Avatar
            sx={{
              width: 44,
              height: 44,
              bgcolor: alpha(accent, 0.12),
              color: accent,
              borderRadius: 2,
            }}
          >
            <BarChartRoundedIcon />
          </Avatar>
          <Box>
            <Typography
              variant="h5"
              sx={{ fontWeight: 700, letterSpacing: -0.3, lineHeight: 1.2 }}
            >
              {t('Reports')}
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mt: 0.25 }}
            >
              {t('Generate and access various reports')}
            </Typography>
          </Box>
        </Stack>

        <Chip
          icon={<AssessmentRoundedIcon />}
          label={`${year}`}
          size="small"
          sx={{
            fontWeight: 700,
            bgcolor: alpha(accent, 0.1),
            color: theme.palette.primary.dark,
            borderRadius: 999,
            display: { xs: 'none', sm: 'flex' },
          }}
        />
      </Stack>

      <YearlyReportsSection
        year={year}
        onYearChange={setYear}
      />
    </Box>
  );
}
