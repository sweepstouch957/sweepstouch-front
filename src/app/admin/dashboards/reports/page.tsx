'use client';

// 👇 nuevo componente
import YearlyReportsSection from '@/components/application-ui/reports/yearly-reports-section';
import ChartBarIcon from '@heroicons/react/24/outline/ChartBarIcon';
import { Box, Container, Unstable_Grid2 as Grid, useTheme } from '@mui/material';
import React from 'react';
import { useTranslation } from 'react-i18next';
import PageHeading from 'src/components/base/page-heading';
import { AvatarState } from 'src/components/base/styles/avatar';
import { useCustomization } from 'src/hooks/use-customization';

function Page(): React.JSX.Element {
  const customization = useCustomization();
  const theme = useTheme();
  const { t } = useTranslation();

  const currentYear = new Date().getFullYear();
  const initialYear = currentYear >= 2025 ? 2025 : currentYear;
  const [year, setYear] = React.useState<number>(initialYear);

  const pageMeta = {
    title: 'Reports',
    description: 'Generate and access various reports',
    icon: <ChartBarIcon />,
  };

  return (
    <>
      {pageMeta.title && (
        <Container
          sx={{
            py: {
              xs: 2,
              sm: 3,
            },
          }}
          maxWidth={customization.stretch ? false : 'xl'}
        >
          <PageHeading
            sx={{ px: 0 }}
            title={t(pageMeta.title)}
            description={pageMeta.description && pageMeta.description}
            iconBox={
              pageMeta.icon && (
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
                  {pageMeta.icon}
                </AvatarState>
              )
            }
          />
        </Container>
      )}

      <Container
        disableGutters
        maxWidth={customization.stretch ? false : 'xl'}
      >
        <Box
          px={{
            xs: 2,
            sm: 3,
          }}
          pb={{
            xs: 2,
            sm: 3,
          }}
        >
          {/* 🔥 Resumen anual con select de año + export */}
          <YearlyReportsSection
            year={year}
            onYearChange={setYear}
          />

       
        </Box>
      </Container>
    </>
  );
}

export default Page;
