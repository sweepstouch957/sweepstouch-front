'use client';

import { Box, Skeleton } from '@mui/material';
import type { useProjectsBoard } from './use-projects-board';

type Props = Pick<ReturnType<typeof useProjectsBoard>, 'isLoading'>;

/** Esqueletos mientras cargan los proyectos. */
export function ProjectsLoading({ isLoading }: Props) {
  return (
    <>
      {isLoading && (
        <Box
          sx={{
            display: 'grid',
            gap: 2,
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' },
          }}
        >
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton
              key={i}
              variant="rounded"
              height={210}
            />
          ))}
        </Box>
      )}
    </>
  );
}
