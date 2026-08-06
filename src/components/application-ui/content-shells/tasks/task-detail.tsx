'use client';

import { alpha, Box, Button, Container, Typography, useTheme } from '@mui/material';
import { Unstable_Grid2 as Grid } from '@mui/material';
import { useRouter } from 'next/navigation';
import { TaskDetailHeader } from './task-detail-header';
import { TaskDetailMain } from './task-detail-main';
import { DetailSkeleton } from './task-detail-pieces';
import { TaskSaveBar } from './task-detail-save-bar';
import { TaskDetailSidebar } from './task-detail-sidebar';
import { useTaskDetail } from './use-task-detail';

/**
 * Detalle de una tarea. Este archivo sólo compone: la lógica vive en
 * `useTaskDetail` y cada zona de la pantalla en su propio componente.
 */
export function TaskDetail({ taskId }: { taskId: string }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const { push, back } = useRouter();
  const ctrl = useTaskDetail(taskId);

  if (ctrl.isLoading) return <DetailSkeleton />;
  if (!ctrl.task) return <TaskNotFound onBack={() => push('/admin/applications/tasks')} />;

  return (
    <Box
      sx={{
        // Sin `minHeight: 100dvh`: el shell ya reserva el hueco del navbar, así
        // que pedir una pantalla entera acá hacía que el documento midiera
        // pantalla + navbar y siempre sobrara scroll. `flex: 1` la deja crecer
        // hasta el fondo sin inventar altura.
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        bgcolor: isDark
          ? alpha(theme.palette.common.black, 0.22)
          : alpha(theme.palette.common.black, 0.02),
        pb: { xs: ctrl.dirty ? 13 : 4, md: 6 },
      }}
    >
      <TaskDetailHeader
        task={ctrl.task}
        status={ctrl.status}
        epic={ctrl.epic}
        changingStatus={ctrl.changingStatus}
        onStatusChange={ctrl.setStatus}
        onBack={() => (window.history.length > 1 ? back() : push('/admin/applications/tasks'))}
        onShare={ctrl.share}
      />

      <Container
        maxWidth="xl"
        sx={{ pt: { xs: 2, md: 3 } }}
      >
        <Grid
          container
          spacing={{ xs: 2, md: 3 }}
        >
          <Grid
            xs={12}
            md={7.5}
            lg={8}
          >
            <TaskDetailMain
              ctrl={ctrl}
              taskId={taskId}
            />
          </Grid>

          <Grid
            xs={12}
            md={4.5}
            lg={4}
          >
            <TaskDetailSidebar ctrl={ctrl} />
          </Grid>
        </Grid>
      </Container>

      {ctrl.dirty && (
        <TaskSaveBar
          saving={ctrl.saving}
          onDiscard={ctrl.discard}
          onSave={() => ctrl.save(ctrl.draft)}
        />
      )}
    </Box>
  );
}

function TaskNotFound({ onBack }: { onBack: () => void }) {
  return (
    <Container
      maxWidth="sm"
      sx={{ py: 10, textAlign: 'center' }}
    >
      <Typography
        variant="h6"
        gutterBottom
      >
        Esta tarea ya no existe
      </Typography>
      <Button
        onClick={onBack}
        variant="contained"
        disableElevation
        sx={{ borderRadius: 2, textTransform: 'none', mt: 1 }}
      >
        Volver al tablero
      </Button>
    </Container>
  );
}
