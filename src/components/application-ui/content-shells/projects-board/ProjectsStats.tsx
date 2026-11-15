'use client';

import { alpha, Box, Container, Stack, Typography, useMediaQuery, useTheme } from '@mui/material';
import { useCustomization } from 'src/hooks/use-customization';
import type { useProjectsBoard } from './use-projects-board';

type Props = Pick<ReturnType<typeof useProjectsBoard>, 'projects' | 'stats'>;

/** Fila de totales: proyectos, en curso, completados y tareas. */
export function ProjectsStats({ projects, stats }: Props) {
  const theme = useTheme();
  const mdUp = useMediaQuery(theme.breakpoints.up('md'));
  const customization = useCustomization();

  return (
    <>
      {projects.length > 0 && (
        <Container
          disableGutters={!mdUp}
          maxWidth={customization.stretch ? false : 'xl'}
          sx={{ mb: 2.5 }}
        >
          <Stack
            direction="row"
            spacing={2}
            flexWrap="wrap"
          >
            {[
              { label: 'Total projects', value: stats.total, color: theme.palette.primary.main },
              { label: 'In progress', value: stats.active, color: theme.palette.info.main },
              { label: 'Completed', value: stats.completed, color: theme.palette.success.main },
              { label: 'Total tasks', value: stats.totalTasks, color: theme.palette.warning.main },
            ].map((s) => (
              <Box
                key={s.label}
                sx={{
                  px: 2,
                  py: 1.25,
                  borderRadius: 2,
                  border: `1px solid ${alpha(s.color, 0.2)}`,
                  bgcolor: alpha(s.color, 0.05),
                  minWidth: 120,
                }}
              >
                <Typography
                  variant="h5"
                  fontWeight={800}
                  color={s.color}
                >
                  {s.value}
                </Typography>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  fontWeight={500}
                >
                  {s.label}
                </Typography>
              </Box>
            ))}
          </Stack>
        </Container>
      )}
    </>
  );
}
