'use client';

import SweepstakesBalance from '@/components/application-ui/pie-doughnut-charts/sweepstakes-balance/sweepstakes-balance';
import PrizeRouletteCard from '@/components/application-ui/composed-visualization-blocks/prize-roulette/prize-roulette';
import GiftIcon from '@heroicons/react/24/outline/GiftIcon';
import { Box, Container, Unstable_Grid2 as Grid } from '@mui/material';
import { useParams } from 'next/navigation';
import { useCustomization } from 'src/hooks/use-customization';
import WeeklySales from 'src/components/application-ui/tables/sweepstakes-participant/participants-sweepstakes';

function Page(): React.JSX.Element {
  const customization = useCustomization();
  const { id: sweepstakeId } = useParams();

  const pageMeta = {
    title: 'Sweepstakes',
    description: 'Track and analyze sweeptake',
    icon: <GiftIcon />,
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
          <Grid
            container
            spacing={{
              xs: 2,
              sm: 3,
            }}
          >
            <Grid xs={12}>
              <SweepstakesBalance sweepstakeId={sweepstakeId as string} />
            </Grid>
            <Grid xs={12}>
              <PrizeRouletteCard sweepstakeId={sweepstakeId as string} />
            </Grid>
            <Grid xs={12}>
              <WeeklySales sweepstakeId={sweepstakeId as string} />
            </Grid>
          </Grid>
        </Box>
      </Container>
    </>
  );
}
export default Page;
