'use client';

import { Task } from '@/services/task.service';
import { avatarSrc } from '@/utils/avatar';
import { timeInputValue, toDateInput } from '@/utils/due-date';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import FlagRoundedIcon from '@mui/icons-material/FlagRounded';
import LockOpenRoundedIcon from '@mui/icons-material/LockOpenRounded';
import PlayArrowRoundedIcon from '@mui/icons-material/PlayArrowRounded';
import ReplayRoundedIcon from '@mui/icons-material/ReplayRounded';
import {
  Autocomplete,
  Avatar,
  Box,
  Button,
  CircularProgress,
  Divider,
  MenuItem,
  Stack,
  TextField,
  Typography,
  useTheme,
} from '@mui/material';
import React from 'react';
import { IMPACT_OPTIONS, priorityEntries } from './constants';
import { Meta, Panel, Timeline } from './task-detail-pieces';
import type { PrimaryAction, TaskDetailController } from './use-task-detail';

const PRIMARY_ICON: Record<PrimaryAction['icon'], React.ReactElement> = {
  start: <PlayArrowRoundedIcon />,
  close: <CheckCircleRoundedIcon />,
  reopen: <ReplayRoundedIcon />,
  unblock: <LockOpenRoundedIcon />,
};

/** Barra lateral: la acción que toca ahora, los campos y la línea de tiempo. */
export function TaskDetailSidebar({ ctrl }: { ctrl: TaskDetailController }) {
  const theme = useTheme();
  const {
    task,
    draft,
    value,
    set,
    setStatus,
    changingStatus,
    teamMembers,
    epics,
    departments,
    assignee,
    overdue,
    primary,
  } = ctrl;

  if (!task) return null;

  return (
    // 62px = alto de la cabecera de la tarea. Sin sumar el navbar: el
    // contenedor de scroll ya empieza debajo de él, igual que en el header.
    <Box sx={{ position: { md: 'sticky' }, top: { md: 62 } }}>
      <Stack spacing={2}>
        {/* Una sola acción principal: la que toca ahora */}
        <Button
          fullWidth
          variant="contained"
          disableElevation
          color={primary.role}
          disabled={changingStatus}
          onClick={() => setStatus(primary.to)}
          startIcon={
            changingStatus ? (
              <CircularProgress
                size={16}
                color="inherit"
              />
            ) : (
              PRIMARY_ICON[primary.icon]
            )
          }
          sx={{
            height: 48,
            borderRadius: 2.5,
            textTransform: 'none',
            fontWeight: 800,
            fontSize: 14,
          }}
        >
          {primary.label}
        </Button>

        <Panel
          title="Detalles"
          delay={1}
        >
          <Stack spacing={2}>
            <Autocomplete
              size="small"
              options={teamMembers}
              value={assignee || null}
              onChange={(_, v: any) =>
                set({
                  assigneeId: v ? String(v._id || v.id) : null,
                  assigneeName: v ? `${v.firstName} ${v.lastName || ''}`.trim() : '',
                  assigneeAvatar: v?.profileImage || '',
                })
              }
              getOptionLabel={(o: any) => `${o.firstName} ${o.lastName || ''}`.trim()}
              renderOption={(props, o: any) => (
                <li {...props}>
                  <Avatar
                    src={avatarSrc(o.profileImage)}
                    sx={{ width: 24, height: 24, mr: 1, fontSize: 10 }}
                  >
                    {o.firstName?.[0]}
                  </Avatar>
                  <Box minWidth={0}>
                    <Typography
                      fontSize={12.5}
                      noWrap
                    >
                      {`${o.firstName} ${o.lastName || ''}`.trim()}
                    </Typography>
                    {o.position && (
                      <Typography
                        fontSize={10}
                        color="text.secondary"
                        noWrap
                      >
                        {o.position}
                      </Typography>
                    )}
                  </Box>
                </li>
              )}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Responsable"
                  InputProps={{
                    ...params.InputProps,
                    startAdornment: assignee ? (
                      <Avatar
                        src={avatarSrc(assignee.profileImage)}
                        sx={{ width: 22, height: 22, ml: 0.5, mr: 0.25, fontSize: 10 }}
                      >
                        {assignee.firstName?.[0]}
                      </Avatar>
                    ) : undefined,
                  }}
                />
              )}
            />

            <Stack
              direction="row"
              spacing={1}
            >
              <TextField
                label="Fecha límite"
                type="date"
                size="small"
                fullWidth
                value={draft.dueDateInput ?? toDateInput(task.dueDate)}
                onChange={(e) => set({ dueDateInput: e.target.value })}
                InputLabelProps={{ shrink: true }}
                error={overdue}
                helperText={overdue ? 'Vencida' : undefined}
              />
              <TextField
                label="Hora"
                type="time"
                size="small"
                sx={{ width: 122, flexShrink: 0 }}
                value={draft.dueTimeInput ?? timeInputValue(task.dueDate)}
                onChange={(e) => set({ dueTimeInput: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Stack>

            <TextField
              select
              label="Prioridad"
              size="small"
              fullWidth
              value={value('priority')}
              onChange={(e) => set({ priority: e.target.value as Task['priority'] })}
            >
              {priorityEntries(theme).map(([k, c]) => (
                <MenuItem
                  key={k}
                  value={k}
                >
                  <Stack
                    direction="row"
                    alignItems="center"
                    spacing={1}
                  >
                    <FlagRoundedIcon sx={{ fontSize: 14, color: c.color }} />
                    <span>{c.label}</span>
                  </Stack>
                </MenuItem>
              ))}
            </TextField>

            <TextField
              select
              label="Épica"
              size="small"
              fullWidth
              value={value('epicId') || ''}
              onChange={(e) => set({ epicId: e.target.value || null })}
            >
              <MenuItem value="">Sin épica</MenuItem>
              {epics.map((e) => (
                <MenuItem
                  key={e._id}
                  value={e._id}
                >
                  <Stack
                    direction="row"
                    alignItems="center"
                    spacing={1}
                  >
                    <Box sx={{ width: 8, height: 8, borderRadius: '2px', bgcolor: e.color }} />
                    <span>{e.name}</span>
                  </Stack>
                </MenuItem>
              ))}
            </TextField>

            <Stack
              direction="row"
              spacing={1}
            >
              <TextField
                label="Para quién"
                size="small"
                fullWidth
                value={value('beneficiary') ?? ''}
                onChange={(e) => set({ beneficiary: e.target.value })}
              />
              <TextField
                select
                label="Impacto"
                size="small"
                fullWidth
                value={value('impact') || ''}
                onChange={(e) => set({ impact: e.target.value as Task['impact'] })}
              >
                {IMPACT_OPTIONS.map((o) => (
                  <MenuItem
                    key={o.value || 'none'}
                    value={o.value}
                  >
                    {o.label}
                  </MenuItem>
                ))}
              </TextField>
            </Stack>

            <Divider sx={{ opacity: 0.7 }} />

            <Meta
              label="Área"
              value={departments.find((d) => d._id === task.departmentId)?.name || '—'}
            />
            <Meta
              label="Creada por"
              value={task.reporterName || '—'}
            />
            {(task.rescheduleCount || 0) > 0 && (
              <Meta
                label="Reprogramada"
                value={`${task.rescheduleCount}× · ${task.lastRescheduleReason || 'sin motivo'}`}
                role="warning"
              />
            )}
          </Stack>
        </Panel>

        <Panel
          title="Línea de tiempo"
          delay={2}
        >
          <Timeline task={task} />
        </Panel>
      </Stack>
    </Box>
  );
}
