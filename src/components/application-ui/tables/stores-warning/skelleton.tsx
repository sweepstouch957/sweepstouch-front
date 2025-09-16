'use client';

import { alpha, Grid, Paper, Skeleton, Stack } from '@mui/material';
import React from 'react';

const FiltersBarSkeleton: React.FC = () => {
  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 1.5, md: 2 },
        mb: 2,
        borderRadius: 4,
        border: '1px solid',
        borderColor: 'divider',
        background: (t) =>
          `linear-gradient(135deg, ${alpha(t.palette.primary.main, 0.06)} 0%, ${alpha(
            t.palette.secondary.main,
            0.06
          )} 100%)`,
      }}
    >
      <Stack
        direction="row"
        spacing={1}
        mb={1.5}
      >
        <Skeleton
          variant="rounded"
          width={150}
          height={34}
        />
        <Skeleton
          variant="rounded"
          width={150}
          height={34}
        />
      </Stack>
      <Grid
        container
        spacing={1.5}
      >
        <Grid
          item
          xs={12}
          md={6}
        >
          <Skeleton
            variant="rounded"
            height={84}
          />
        </Grid>
        <Grid
          item
          xs={12}
          md={6}
        >
          <Skeleton
            variant="rounded"
            height={84}
          />
        </Grid>
        <Grid
          item
          xs={12}
          md={8}
        >
          <Skeleton
            variant="rounded"
            height={44}
          />
        </Grid>
        <Grid
          item
          xs={12}
          md={4}
        >
          <Skeleton
            variant="rounded"
            height={44}
          />
        </Grid>
      </Grid>
    </Paper>
  );
};

export default FiltersBarSkeleton;
