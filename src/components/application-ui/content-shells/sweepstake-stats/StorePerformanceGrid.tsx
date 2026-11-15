'use client';

import StorefrontRoundedIcon from '@mui/icons-material/StorefrontRounded';
import {
  Box,
  Card,
  CircularProgress,
  Unstable_Grid2 as Grid,
  Skeleton,
  Stack,
  Typography,
} from '@mui/material';
import { StoreCard } from './StoreCard';
import type { useSweepstakeStats } from './use-sweepstake-stats';

type Props = Pick<
  ReturnType<typeof useSweepstakeStats>,
  'metricsLoading' | 'stores' | 'totalParticipations' | 'pieColors' | 'sortedStores'
>;

/** Grilla de tiendas ordenadas por participaciones. */
export function StorePerformanceGrid({
  metricsLoading,
  stores,
  totalParticipations,
  pieColors,
  sortedStores,
}: Props) {
  return (
    <Grid
      xs={12}
      md={8}
      lg={9}
    >
      <Card
        variant="outlined"
        sx={{
          borderRadius: 3,
          p: { xs: 2, sm: 2.5 },
          height: '100%',
          bgcolor: 'background.paper',
        }}
      >
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="flex-start"
          sx={{ mb: 2 }}
        >
          <Box>
            <Typography
              variant="h6"
              fontWeight={700}
            >
              Performance por tienda
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
            >
              {stores.length} tiendas &bull; ordenadas por participaciones &bull; mismos filtros
              aplicados
            </Typography>
          </Box>
          {metricsLoading && (
            <CircularProgress
              size={18}
              thickness={5}
            />
          )}
        </Stack>

        {metricsLoading ? (
          <Grid
            container
            spacing={1.5}
          >
            {Array.from({ length: 6 }).map((_, i) => (
              <Grid
                xs={12}
                sm={6}
                xl={4}
                key={i}
              >
                <Skeleton
                  variant="rectangular"
                  height={118}
                  sx={{ borderRadius: 2.5 }}
                />
              </Grid>
            ))}
          </Grid>
        ) : sortedStores.length > 0 ? (
          <Box
            sx={{
              maxHeight: { xs: 'none', md: 460 },
              overflowY: { md: 'auto' },
              pr: { md: 0.5 },
            }}
          >
            <Grid
              container
              spacing={1.5}
            >
              {sortedStores.map((store, index) => (
                <Grid
                  xs={12}
                  sm={6}
                  xl={4}
                  key={store.storeId || index}
                >
                  <StoreCard
                    store={store}
                    rank={index + 1}
                    color={pieColors[index % pieColors.length]}
                    total={totalParticipations}
                  />
                </Grid>
              ))}
            </Grid>
          </Box>
        ) : (
          <Box
            sx={{
              height: 200,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 1,
              opacity: 0.4,
            }}
          >
            <StorefrontRoundedIcon sx={{ fontSize: 36 }} />
            <Typography
              variant="body2"
              color="text.secondary"
            >
              Sin tiendas en este período
            </Typography>
          </Box>
        )}
      </Card>
    </Grid>
  );
}
