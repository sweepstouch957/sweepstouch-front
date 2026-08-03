import { RECURRENCE_LABEL, Task, type RoutineTask } from '@/services/task.service';
import AssignmentIndRoundedIcon from '@mui/icons-material/AssignmentIndRounded';
import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded';
import RepeatRoundedIcon from '@mui/icons-material/RepeatRounded';
import {
  alpha,
  Avatar,
  Box,
  Card,
  Chip,
  CircularProgress,
  IconButton,
  Stack,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material';
import React from 'react';

export const RoutinesView = React.memo(function RoutinesView({
  loading,
  routines,
  onEdit,
  onDelete,
}: {
  loading: boolean;
  routines: RoutineTask[];
  onEdit: (t: Task) => void;
  onDelete: (id: string) => void;
}) {
  const theme = useTheme();

  return (
    <Card sx={{ borderRadius: 3, mt: 1 }}>
      <Box
        px={2}
        py={1.25}
        sx={{ borderBottom: `1px solid ${alpha(theme.palette.divider, 0.12)}` }}
      >
        <Typography
          variant="subtitle2"
          fontWeight={800}
          fontSize={13}
        >
          Plantillas rutinarias
        </Typography>
        <Typography
          variant="caption"
          color="text.secondary"
        >
          No aparecen en el board. Cada día que toca se crea una copia en To Do
          automáticamente. Para crear una, abre una tarea nueva y elige un valor en “Repetir”.
        </Typography>
      </Box>

      {loading ? (
        <Box
          display="flex"
          justifyContent="center"
          py={5}
        >
          <CircularProgress />
        </Box>
      ) : routines.length === 0 ? (
        <Box
          textAlign="center"
          py={5}
        >
          <RepeatRoundedIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
          <Typography
            variant="body2"
            color="text.secondary"
          >
            Sin tareas rutinarias todavía.
          </Typography>
        </Box>
      ) : (
        <Stack
          divider={
            <Box sx={{ borderBottom: `1px solid ${alpha(theme.palette.divider, 0.06)}` }} />
          }
        >
          {routines.map((r) => (
            <Stack
              key={r._id}
              direction="row"
              alignItems="center"
              spacing={1.5}
              px={2}
              py={1.5}
              sx={{ '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.04) } }}
            >
              <Tooltip title={r.runsToday ? 'Le toca hoy' : 'Hoy no le toca'}>
                <Box
                  sx={{
                    width: 9,
                    height: 9,
                    borderRadius: '50%',
                    flexShrink: 0,
                    bgcolor: r.runsToday ? 'success.main' : 'text.disabled',
                  }}
                />
              </Tooltip>
              <Typography
                variant="body2"
                fontWeight={600}
                fontSize={13}
                noWrap
                sx={{ flex: 1, minWidth: 0 }}
              >
                {r.title}
              </Typography>
              <Chip
                icon={<RepeatRoundedIcon sx={{ fontSize: '13px !important' }} />}
                label={RECURRENCE_LABEL[r.recurrence || 'none']}
                size="small"
                sx={{ height: 22, fontSize: 10.5, fontWeight: 700 }}
              />
              {r.assigneeName && (
                <Tooltip title={r.assigneeName}>
                  <Avatar
                    src={r.assigneeAvatar}
                    sx={{ width: 24, height: 24, fontSize: 10 }}
                  >
                    {r.assigneeName.charAt(0).toUpperCase()}
                  </Avatar>
                </Tooltip>
              )}
              <Tooltip title="Editar">
                <IconButton
                  size="small"
                  onClick={() => onEdit(r)}
                >
                  <AssignmentIndRoundedIcon sx={{ fontSize: 16 }} />
                </IconButton>
              </Tooltip>
              <Tooltip title="Eliminar rutina">
                <IconButton
                  size="small"
                  onClick={() => onDelete(r._id)}
                  sx={{ '&:hover': { color: 'error.main' } }}
                >
                  <DeleteRoundedIcon sx={{ fontSize: 16 }} />
                </IconButton>
              </Tooltip>
            </Stack>
          ))}
        </Stack>
      )}
    </Card>
  );
});
