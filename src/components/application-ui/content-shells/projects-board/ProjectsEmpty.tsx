'use client';

import AddRoundedIcon from '@mui/icons-material/AddRounded';
import ViewKanbanRoundedIcon from '@mui/icons-material/ViewKanbanRounded';
import { Box, Button, Typography } from '@mui/material';
import type { useProjectsBoard } from './use-projects-board';

type Props = Pick<
  ReturnType<typeof useProjectsBoard>,
  'query' | 'statusFilter' | 'setNewProjectOpen' | 'isLoading' | 'filtered'
>;

/** Estado vacío: sin proyectos o sin resultados de búsqueda. */
export function ProjectsEmpty({
  query,
  statusFilter,
  setNewProjectOpen,
  isLoading,
  filtered,
}: Props) {
  return (
    <>
      {!isLoading && filtered.length === 0 && (
        <Box
          textAlign="center"
          py={8}
        >
          <ViewKanbanRoundedIcon sx={{ fontSize: 56, color: 'text.disabled', mb: 1 }} />
          <Typography
            variant="h5"
            color="text.secondary"
            fontWeight={500}
          >
            {query || statusFilter ? 'No projects match your search' : 'No projects yet'}
          </Typography>
          {!query && !statusFilter && (
            <Button
              variant="contained"
              size="small"
              startIcon={<AddRoundedIcon />}
              onClick={() => setNewProjectOpen(true)}
              sx={{ mt: 2, borderRadius: 2, textTransform: 'none' }}
              disableElevation
            >
              Create your first project
            </Button>
          )}
        </Box>
      )}
    </>
  );
}
