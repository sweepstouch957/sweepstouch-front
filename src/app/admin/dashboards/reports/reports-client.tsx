'use client';

import ChartBarIcon from '@heroicons/react/24/outline/ChartBarIcon';
import { Box, Container, useTheme } from '@mui/material';
import dynamic from 'next/dynamic';
import React from 'react';
import { useTranslation } from 'react-i18next';
import PageHeading from 'src/components/base/page-heading';
import { AvatarState } from 'src/components/base/styles/avatar';
import { useCustomization } from 'src/hooks/use-customization';

// ✅ Lazy-load para bajar TBT/JS inicial
const YearlyReportsSection = dynamic(
  () => import('@/components/application-ui/reports/yearly-reports-section'),
  { ssr: false }
);

export default function ReportsClient(): React.JSX.Element {
  const customization = useCustomization();
  const theme = useTheme();
  const { t } = useTranslation();

  const currentYear = new Date().getFullYear();
  const initialYear = currentYear >= 2026 ? 2026 : currentYear;
  const [year, setYear] = React.useState<number>(initialYear);

  return (
    <>
      <Container
        sx={{ py: { xs: 2, sm: 3 } }}
        maxWidth={customization.stretch ? false : 'xl'}
      >
        <PageHeading
          sx={{ px: 0 }}
          title={t('Reports')}
          description="Generate and access various reports"
          iconBox={
            <AvatarState
              isSoft
              variant="rounded"
              state="primary"
              sx={{
                height: theme.spacing(7),
                width: theme.spacing(7),
                svg: {
                  height: theme.spacing(4),
                  width: theme.spacing(4),
                  minWidth: theme.spacing(4),
                },
              }}
            >
              <ChartBarIcon />
            </AvatarState>
          }
        />
      </Container>

      <Container
        disableGutters
        maxWidth={customization.stretch ? false : 'xl'}
      >
        <Box
          px={{ xs: 2, sm: 3 }}
          pb={{ xs: 2, sm: 3 }}
        >
          <YearlyReportsSection
            year={year}
            onYearChange={setYear}
          />
        </Box>
      </Container>
    </>
  );
}
