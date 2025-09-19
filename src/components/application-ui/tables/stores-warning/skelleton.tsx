'use client';

import { alpha, Box, Grid, Paper, Skeleton, Stack, TableBody, TableCell, TableRow } from '@mui/material';
import React from 'react';

export const FiltersBarSkeleton: React.FC = () => {
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

export  function TableSkeletonRows({ rows = 6 }: { rows?: number }) {
  return (
    <TableBody>
      {Array.from({ length: rows }).map((_, i) => (
        <TableRow key={i}>
          <TableCell>
            <Stack
              direction="row"
              spacing={2}
              alignItems="center"
            >
              <Skeleton
                variant="rounded"
                width={48}
                height={48}
              />
              <Box sx={{ flex: 1 }}>
                <Skeleton width="42%" />
                <Skeleton width="28%" />
              </Box>
            </Stack>
          </TableCell>
          <TableCell width={140}>
            <Skeleton width="50%" />
          </TableCell>
          <TableCell>
            <Skeleton width="25%" />
          </TableCell>
          <TableCell width={360}>
            <Stack spacing={0.5}>
              <Skeleton width="70%" />
              <Skeleton width="60%" />
              <Skeleton width="40%" />
            </Stack>
          </TableCell>
          <TableCell align="right">
            <Stack
              direction="row"
              spacing={1}
              justifyContent="flex-end"
            >
              <Skeleton
                variant="circular"
                width={36}
                height={36}
              />
              <Skeleton
                variant="circular"
                width={36}
                height={36}
              />
              <Skeleton
                variant="rounded"
                width={110}
                height={36}
              />
            </Stack>
          </TableCell>
        </TableRow>
      ))}
    </TableBody>
  );
}
