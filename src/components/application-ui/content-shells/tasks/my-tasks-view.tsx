import { Task } from '@/services/task.service';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import AssignmentIndRoundedIcon from '@mui/icons-material/AssignmentIndRounded';
import CalendarTodayRoundedIcon from '@mui/icons-material/CalendarTodayRounded';
import CelebrationRoundedIcon from '@mui/icons-material/CelebrationRounded';
import {
  alpha,
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Stack,
  Typography,
  useTheme,
} from '@mui/material';
import { format, isAfter } from 'date-fns';
import React, { useEffect, useState } from 'react';
import { priorityMeta, statusEntries } from './constants';

export function MyTasksView({
  loading,
  tasks,
  onOpenTask,
}: {
  loading: boolean;
  tasks: Task[];
  onOpenTask: (t: Task) => void;
}) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        py={6}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (tasks.length === 0) {
    return (
      <Card sx={{ borderRadius: 3, mt: 2 }}>
        <CardContent sx={{ textAlign: 'center', py: 6 }}>
          <AssignmentIndRoundedIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
          <Typography
            variant="h6"
            fontWeight={700}
            gutterBottom
          >
            No pending tasks
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
          >
            You're all caught up! <CelebrationRoundedIcon fontSize="small" sx={{ ml: 0.5, verticalAlign: 'middle' }} />
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Stack
      spacing={1.5}
      mt={1}
    >
      {statusEntries(theme).flatMap(([statusKey, meta]) => {
        if (statusKey === 'done') return [];
        const tasksInStatus = tasks.filter((t) => t.status === statusKey);
        if (tasksInStatus.length === 0) return [];
        return (
          <Card
            key={statusKey}
            sx={{
              borderRadius: 2.5,
              border: `1px solid ${alpha(meta.color, 0.2)}`,
              overflow: 'visible',
            }}
          >
            <Box
              px={2}
              py={1}
              sx={{
                borderBottom: `1px solid ${alpha(meta.color, 0.12)}`,
                bgcolor: alpha(meta.color, 0.04),
              }}
            >
              <Stack
                direction="row"
                alignItems="center"
                spacing={1}
              >
                <Box
                  sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: meta.color }}
                />
                <Typography
                  variant="subtitle2"
                  fontWeight={800}
                  fontSize={13}
                >
                  {meta.label}
                </Typography>
                <Chip
                  label={tasksInStatus.length}
                  size="small"
                  sx={{
                    height: 20,
                    fontSize: 10,
                    fontWeight: 800,
                    bgcolor: alpha(meta.color, 0.15),
                    color: meta.color,
                  }}
                />
              </Stack>
            </Box>
            <Stack
              divider={
                <Box
                  sx={{ borderBottom: `1px solid ${alpha(theme.palette.divider, 0.06)}` }}
                />
              }
            >
              {tasksInStatus.map((task) => {
                const pri = priorityMeta(theme, task.priority);
                const isOverdue =
                  mounted &&
                  task.dueDate &&
                  task.status !== 'done' &&
                  isAfter(new Date(), new Date(task.dueDate));
                return (
                  <Box
                    key={task._id}
                    px={2}
                    py={1.5}
                    sx={{
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                      '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.04) },
                      borderLeft: `3px solid ${pri.color}`,
                    }}
                    onClick={() => onOpenTask(task)}
                  >
                    <Stack
                      direction="row"
                      alignItems="center"
                      justifyContent="space-between"
                    >
                      <Stack
                        direction="row"
                        alignItems="center"
                        spacing={1.5}
                        flex={1}
                        minWidth={0}
                      >
                        <Typography
                          variant="caption"
                          sx={{
                            fontFamily: 'monospace',
                            fontWeight: 700,
                            fontSize: 10,
                            color: alpha(theme.palette.text.secondary, 0.7),
                            bgcolor: isDark
                              ? alpha(theme.palette.common.white, 0.05)
                              : alpha(theme.palette.common.black, 0.04),
                            px: 0.75,
                            py: 0.2,
                            borderRadius: 0.75,
                            flexShrink: 0,
                          }}
                        >
                          {task.identifier}
                        </Typography>
                        <Typography
                          variant="body2"
                          fontWeight={600}
                          fontSize={13}
                          noWrap
                          sx={{ flex: 1 }}
                        >
                          {task.title}
                        </Typography>
                      </Stack>
                      <Stack
                        direction="row"
                        alignItems="center"
                        spacing={1}
                        flexShrink={0}
                      >
                        <Chip
                          label={pri.label}
                          size="small"
                          sx={{
                            height: 20,
                            fontSize: 10,
                            fontWeight: 800,
                            bgcolor: alpha(pri.color, 0.12),
                            color: pri.color,
                            '& .MuiChip-label': { px: 0.75 },
                          }}
                        />
                        {task.dueDate && (
                          <Stack
                            direction="row"
                            alignItems="center"
                            spacing={0.3}
                          >
                            <CalendarTodayRoundedIcon
                              sx={{
                                fontSize: 12,
                                color: isOverdue ? 'error.main' : 'text.disabled',
                              }}
                            />
                            <Typography
                              variant="caption"
                              sx={{
                                fontSize: 11,
                                color: isOverdue ? 'error.main' : 'text.secondary',
                                fontWeight: isOverdue ? 700 : 400,
                              }}
                            >
                              {format(new Date(task.dueDate), 'MMM d')}
                            </Typography>
                          </Stack>
                        )}
                        <ArrowForwardRoundedIcon
                          sx={{ fontSize: 14, color: 'text.disabled' }}
                        />
                      </Stack>
                    </Stack>
                    {task.description && (
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{
                          mt: 0.25,
                          display: 'block',
                          fontSize: 11,
                          opacity: 0.7,
                          pl: 7,
                        }}
                      >
                        {task.description.slice(0, 120)}
                        {task.description.length > 120 ? '…' : ''}
                      </Typography>
                    )}
                  </Box>
                );
              })}
            </Stack>
          </Card>
        );
      })}
    </Stack>
  );
}
