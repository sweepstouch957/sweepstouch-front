
'use client';

import NextLink from 'next/link';
import { AddRounded } from '@mui/icons-material';
import { routes } from '@/router/routes';
import PageHeading from '@/components/base/page-heading';
import { Box, CircularProgress, Unstable_Grid2 as Grid } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { usePrizes } from '@/hooks/fetching/sweepstakes/usePrizes';
import Results from './results';

function PrizesGrid() {
  const { t } = useTranslation();
  const { data, isPending, isFetching, refetch } = usePrizes();

  if (isPending) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        height="300px">
        <CircularProgress size={48} />
      </Box>
    );
  }

  const prizes = data || [];

  return (
    <>
      <PageHeading
        title={t('Prizes')}
        description={t('All prizes registered in the system')}
      />
      <Grid container
        mt={2}
        spacing={{ xs: 2, sm: 3 }}>
        <Grid xs={12}>
          <Results
            prizes={prizes}
            isLoading={isFetching}
            refetch={refetch}
          />
        </Grid>
      </Grid>
    </>
  );
}

export default PrizesGrid;
