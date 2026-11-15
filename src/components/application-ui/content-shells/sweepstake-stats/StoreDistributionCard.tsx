'use client';

import {
  Box,
  Card,
  Divider,
  Unstable_Grid2 as Grid,
  Skeleton,
  Stack,
  Typography,
} from '@mui/material';
import { PieChart } from 'src/components/base/lazy-charts';
import type { useSweepstakeStats } from './use-sweepstake-stats';

type Props = Pick<ReturnType<typeof useSweepstakeStats>, 'metricsLoading' | 'grouped'>;

/** Dona con las 5 tiendas con más participaciones + "Otras". */
export function StoreDistributionCard({ metricsLoading, grouped }: Props) {
  return (
    <Grid
      xs={12}
      md={4}
      lg={3}
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
        <Typography
          variant="h6"
          fontWeight={700}
          sx={{ mb: 0.25 }}
        >
          Distribución
        </Typography>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: 'block', mb: 1.5 }}
        >
          Top tiendas por participaciones
        </Typography>

        {metricsLoading ? (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              mt: 4,
            }}
          >
            <Skeleton
              variant="circular"
              width={190}
              height={190}
            />
          </Box>
        ) : grouped.length > 0 ? (
          <>
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <PieChart
                series={[
                  {
                    data: grouped,
                    innerRadius: 52,
                    outerRadius: 88,
                    paddingAngle: 3,
                    cornerRadius: 4,
                    highlightScope: {
                      fade: 'global',
                      highlight: 'item',
                    },
                  },
                ]}
                height={210}
                width={200}
                margin={{ top: 8, bottom: 8, left: 8, right: 8 }}
                hideLegend
              />
            </Box>
            <Divider sx={{ my: 1.5 }} />
            <Stack spacing={0.75}>
              {grouped.map((g) => (
                <Stack
                  key={g.id}
                  direction="row"
                  alignItems="center"
                  spacing={1}
                >
                  <Box
                    sx={{
                      width: 9,
                      height: 9,
                      borderRadius: 0.5,
                      bgcolor: g.color,
                      flexShrink: 0,
                    }}
                  />
                  <Typography
                    variant="caption"
                    noWrap
                    flex={1}
                    color="text.secondary"
                    fontSize={11}
                  >
                    {g.label}
                  </Typography>
                  <Typography
                    variant="caption"
                    fontWeight={700}
                    fontSize={11}
                  >
                    {g.value.toLocaleString()}
                  </Typography>
                </Stack>
              ))}
            </Stack>
          </>
        ) : (
          <Box
            sx={{
              height: 200,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: 0.4,
            }}
          >
            <Typography
              variant="body2"
              color="text.secondary"
            >
              Sin datos
            </Typography>
          </Box>
        )}
      </Card>
    </Grid>
  );
}
