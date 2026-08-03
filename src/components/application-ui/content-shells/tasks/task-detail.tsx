'use client';

import { usersApi } from '@/mocks/users';
import { departmentService } from '@/services/department.service';
import { epicService } from '@/services/epic.service';
import { Task, taskClient, type TaskFile } from '@/services/task.service';
import { uploadTaskEvidence } from '@/services/upload.service';
import { combineDueDate, formatDue, timeInputValue, toDateInput } from '@/utils/due-date';
import { isInternalStaff, STAFF_ROLE_QUERY } from '@/utils/staff';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import AttachFileRoundedIcon from '@mui/icons-material/AttachFileRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import ContentCopyRoundedIcon from '@mui/icons-material/ContentCopyRounded';
import ErrorOutlineRoundedIcon from '@mui/icons-material/ErrorOutlineRounded';
import EventRoundedIcon from '@mui/icons-material/EventRounded';
import FlagRoundedIcon from '@mui/icons-material/FlagRounded';
import HistoryRoundedIcon from '@mui/icons-material/HistoryRounded';
import LockOpenRoundedIcon from '@mui/icons-material/LockOpenRounded';
import PictureAsPdfRoundedIcon from '@mui/icons-material/PictureAsPdfRounded';
import PlayArrowRoundedIcon from '@mui/icons-material/PlayArrowRounded';
import ReplayRoundedIcon from '@mui/icons-material/ReplayRounded';
import StorefrontRoundedIcon from '@mui/icons-material/StorefrontRounded';
import {
  alpha,
  Autocomplete,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Divider,
  Unstable_Grid2 as Grid,
  IconButton,
  MenuItem,
  Skeleton,
  Stack,
  TextField,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import React, { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { IMPACT_OPTIONS, priorityEntries, priorityMeta, statusEntries, statusMeta } from './constants';
import { TaskComments } from './task-comments';

/** Sólo se manda lo que cambió: un PATCH con todo pisa lo que otro acaba de tocar. */
type Draft = Partial<Task> & { dueDateInput?: string; dueTimeInput?: string };

/** Entrada escalonada. Se apaga sola con prefers-reduced-motion. */
const RISE = {
  '@keyframes rise': {
    from: { opacity: 0, transform: 'translateY(8px)' },
    to: { opacity: 1, transform: 'none' },
  },
  animation: 'rise .32s cubic-bezier(.2,.8,.2,1) both',
  '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
};

export function TaskDetail({ taskId }: { taskId: string }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const { push, back } = useRouter();
  const queryClient = useQueryClient();

  /**
   * El board siembra ['task', id] antes de navegar, así que normalmente esto ya
   * tiene datos y la página abre pintada. `isLoading` sólo es true cuando se
   * entra por link directo (WhatsApp, correo) y no hay nada en caché.
   */
  const { data: task, isLoading } = useQuery({
    queryKey: ['task', taskId],
    queryFn: () => taskClient.getTask(taskId),
    enabled: !!taskId,
    staleTime: 15_000,
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: ['users', 'task-board'],
    queryFn: () =>
      usersApi.getUsers({
        lean: true,
        role: STAFF_ROLE_QUERY.join(','),
        select: 'firstName,lastName,email,role,position,profileImage,departmentId',
      }),
    staleTime: 5 * 60_000,
  });
  const teamMembers = useMemo(() => allUsers.filter(isInternalStaff), [allUsers]);

  const { data: epics = [] } = useQuery({
    queryKey: ['epics'],
    queryFn: () => epicService.list(),
    staleTime: 120_000,
  });
  const { data: departments = [] } = useQuery({
    queryKey: ['departments'],
    queryFn: departmentService.list,
    staleTime: 120_000,
  });

  /* ── Edición: se escribe en un borrador y se guarda cuando el usuario decide ── */
  const [draft, setDraft] = useState<Draft>({});
  const [files, setFiles] = useState<TaskFile[]>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (task) setFiles(task.files || []);
  }, [task]);

  const dirty = Object.keys(draft).length > 0;
  const value = <K extends keyof Task>(k: K): any =>
    draft[k as keyof Draft] !== undefined ? (draft as any)[k] : (task as any)?.[k];
  const set = (patch: Draft) => setDraft((d) => ({ ...d, ...patch }));

  const { mutate: save, isPending: saving } = useMutation({
    mutationFn: (patch: Draft) => {
      const { dueDateInput, dueTimeInput, ...rest } = patch;
      const body: any = { ...rest };
      if (dueDateInput !== undefined || dueTimeInput !== undefined) {
        body.dueDate = combineDueDate(
          dueDateInput ?? toDateInput(task?.dueDate),
          dueTimeInput ?? timeInputValue(task?.dueDate)
        );
      }
      return taskClient.updateTask(taskId, body);
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(['task', taskId], updated);
      queryClient.invalidateQueries({ queryKey: ['board'] });
      queryClient.invalidateQueries({ queryKey: ['my-tasks'] });
      setDraft({});
      toast.success('Guardado');
    },
    onError: (e: any) => toast.error(e?.response?.data?.error || 'No se pudo guardar'),
  });

  /** Cambiar de estado se aplica al toque: es lo que más se toca y no es "editar". */
  const { mutate: setStatus, isPending: changingStatus } = useMutation({
    mutationFn: (status: string) => taskClient.updateTask(taskId, { status } as any),
    onSuccess: (updated) => {
      queryClient.setQueryData(['task', taskId], updated);
      queryClient.invalidateQueries({ queryKey: ['board'] });
    },
    onError: (e: any) => toast.error(e?.response?.data?.error || 'No se pudo cambiar el estado'),
  });

  async function uploadEvidence(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(e.target.files || []);
    e.target.value = '';
    if (!picked.length) return;
    setUploading(true);
    try {
      for (const f of picked) {
        const url = await uploadTaskEvidence(f);
        const updated = await taskClient.addAttachment(taskId, {
          url,
          name: f.name,
          type: f.type,
          size: f.size,
        });
        setFiles(updated.files || []);
      }
      toast.success(picked.length === 1 ? 'Evidencia adjunta' : `${picked.length} evidencias`);
    } catch {
      toast.error('No se pudo subir la evidencia');
    } finally {
      setUploading(false);
    }
  }

  async function share(kind: 'pdf' | 'panel') {
    try {
      const links = await taskClient.getTaskLinks(taskId);
      if (kind === 'pdf') return window.open(links.pdf, '_blank', 'noopener');
      await navigator.clipboard.writeText(links.panel);
      toast.success('Link copiado');
    } catch {
      toast.error('No se pudieron generar los enlaces');
    }
  }

  if (isLoading) return <DetailSkeleton />;

  if (!task) {
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
          onClick={() => push('/admin/applications/tasks')}
          variant="contained"
          disableElevation
          sx={{ borderRadius: 2, textTransform: 'none', mt: 1 }}
        >
          Volver al tablero
        </Button>
      </Container>
    );
  }

  const status = value('status');
  const meta = statusMeta(theme, status);
  const pri = priorityMeta(theme, value('priority'));
  const epic = epics.find((e) => e._id === value('epicId'));
  const assignee = teamMembers.find((u: any) => (u._id || u.id) === value('assigneeId'));
  const overdue =
    task.dueDate && status !== 'done' && new Date(task.dueDate).getTime() < Date.now();

  /** Una sola acción principal, la que toca según dónde está la tarea. */
  const primary =
    status === 'done'
      ? { label: 'Reabrir', to: 'in_progress', icon: <ReplayRoundedIcon />, role: 'secondary' as const }
      : status === 'blocked'
        ? { label: 'Destrabar', to: 'in_progress', icon: <LockOpenRoundedIcon />, role: 'warning' as const }
        : status === 'in_progress' || status === 'in_review'
          ? { label: 'Cerrar tarea', to: 'done', icon: <CheckCircleRoundedIcon />, role: 'success' as const }
          : { label: 'Empezar ahora', to: 'in_progress', icon: <PlayArrowRoundedIcon />, role: 'primary' as const };

  return (
    <Box
      sx={{
        minHeight: '100dvh',
        bgcolor: isDark
          ? alpha(theme.palette.common.black, 0.22)
          : alpha(theme.palette.common.black, 0.02),
        pb: { xs: dirty ? 13 : 4, md: 6 },
      }}
    >
      {/* ═══ Cabecera pegada ═══ */}
      <Box
        sx={{
          position: 'sticky',
          top: 0,
          zIndex: 10,
          bgcolor: alpha(theme.palette.background.paper, 0.86),
          backdropFilter: 'blur(12px)',
          borderBottom: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
        }}
      >
        {/* Hilo de color del estado: se sabe dónde está la tarea antes de leer */}
        <Box sx={{ height: 3, bgcolor: meta.color }} />
        <Container
          maxWidth="xl"
          sx={{ py: 1 }}
        >
          <Stack
            direction="row"
            alignItems="center"
            spacing={1}
          >
            <IconButton
              onClick={() => (window.history.length > 1 ? back() : push('/admin/applications/tasks'))}
              aria-label="Volver al tablero"
              sx={{ width: 40, height: 40 }}
            >
              <ArrowBackRoundedIcon sx={{ fontSize: 20 }} />
            </IconButton>

            <Chip
              label={task.identifier}
              size="small"
              sx={{
                fontFamily: 'monospace',
                fontWeight: 800,
                fontSize: 11,
                letterSpacing: 0.3,
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                color: 'primary.main',
              }}
            />

            {epic && (
              <Chip
                size="small"
                label={epic.name}
                sx={{
                  height: 22,
                  fontSize: 10.5,
                  fontWeight: 700,
                  display: { xs: 'none', sm: 'inline-flex' },
                  bgcolor: alpha(epic.color, 0.14),
                  color: epic.color,
                }}
              />
            )}

            <Box flex={1} />

            <TextField
              select
              size="small"
              value={status}
              disabled={changingStatus}
              onChange={(e) => setStatus(e.target.value)}
              SelectProps={{ 'aria-label': 'Estado de la tarea' } as any}
              sx={{
                minWidth: { xs: 132, sm: 148 },
                '& .MuiOutlinedInput-root': {
                  height: 38,
                  borderRadius: 5,
                  fontWeight: 800,
                  fontSize: 12.5,
                  color: meta.color,
                  bgcolor: alpha(meta.color, 0.1),
                  transition: 'background-color .2s',
                  '& fieldset': { borderColor: alpha(meta.color, 0.35) },
                  '&:hover fieldset': { borderColor: meta.color },
                },
              }}
            >
              {statusEntries(theme).map(([k, m]) => (
                <MenuItem
                  key={k}
                  value={k}
                >
                  <Stack
                    direction="row"
                    alignItems="center"
                    spacing={1}
                  >
                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: m.color }} />
                    <span>{m.label}</span>
                  </Stack>
                </MenuItem>
              ))}
            </TextField>

            <Tooltip
              title="PDF de estado"
              arrow
            >
              <IconButton
                onClick={() => share('pdf')}
                aria-label="Abrir PDF de estado"
                sx={{ width: 40, height: 40 }}
              >
                <PictureAsPdfRoundedIcon sx={{ fontSize: 19 }} />
              </IconButton>
            </Tooltip>
            <Tooltip
              title="Copiar link"
              arrow
            >
              <IconButton
                onClick={() => share('panel')}
                aria-label="Copiar link de la tarea"
                sx={{ width: 40, height: 40, display: { xs: 'none', sm: 'inline-flex' } }}
              >
                <ContentCopyRoundedIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>
          </Stack>
        </Container>
      </Box>

      <Container
        maxWidth="xl"
        sx={{ pt: { xs: 2, md: 3 } }}
      >
        <Grid
          container
          spacing={{ xs: 2, md: 3 }}
        >
          {/* ═══ Columna principal ═══ */}
          <Grid
            xs={12}
            md={7.5}
            lg={8}
          >
            <Stack spacing={2}>
              {/* Portada */}
              <Panel
                accent={pri.color}
                delay={0}
                pad={false}
              >
                <Box sx={{ p: { xs: 2, md: 3 } }}>
                  <InlineTitle
                    value={value('title') ?? ''}
                    onChange={(v) => set({ title: v })}
                  />

                  {/* Quién, cuándo y para quién — de un vistazo */}
                  <Stack
                    direction="row"
                    spacing={1}
                    flexWrap="wrap"
                    useFlexGap
                    alignItems="center"
                    sx={{ mt: 1.75 }}
                  >
                    {(assignee || value('assigneeName')) && (
                      <Chip
                        avatar={
                          <Avatar src={assignee?.profileImage || value('assigneeAvatar')}>
                            {(value('assigneeName') || '?')[0]}
                          </Avatar>
                        }
                        label={value('assigneeName') || 'Sin responsable'}
                        size="small"
                        sx={{ height: 28, fontSize: 11.5, fontWeight: 700, pl: 0.25 }}
                      />
                    )}
                    <Chip
                      icon={
                        overdue ? (
                          <ErrorOutlineRoundedIcon sx={{ fontSize: '14px !important' }} />
                        ) : (
                          <EventRoundedIcon sx={{ fontSize: '14px !important' }} />
                        )
                      }
                      label={formatDue(task.dueDate)}
                      size="small"
                      sx={{
                        height: 28,
                        fontSize: 11.5,
                        fontWeight: 700,
                        fontVariantNumeric: 'tabular-nums',
                        bgcolor: alpha(overdue ? theme.palette.error.main : theme.palette.text.primary, 0.08),
                        color: overdue ? theme.palette.error.main : theme.palette.text.secondary,
                        '& .MuiChip-icon': { color: 'inherit' },
                      }}
                    />
                    <Chip
                      icon={<FlagRoundedIcon sx={{ fontSize: '14px !important' }} />}
                      label={pri.label}
                      size="small"
                      sx={{
                        height: 28,
                        fontSize: 11.5,
                        fontWeight: 700,
                        bgcolor: alpha(pri.color, 0.12),
                        color: pri.color,
                        '& .MuiChip-icon': { color: 'inherit' },
                      }}
                    />
                    {task.storeName && (
                      <Chip
                        icon={<StorefrontRoundedIcon sx={{ fontSize: '14px !important' }} />}
                        label={task.storeName}
                        size="small"
                        sx={{ height: 28, fontSize: 11.5, fontWeight: 600 }}
                      />
                    )}
                    {task.tags?.map((t) => (
                      <Chip
                        key={t}
                        label={t}
                        size="small"
                        sx={{
                          height: 28,
                          fontSize: 11,
                          fontWeight: 700,
                          bgcolor: alpha(theme.palette.primary.main, 0.08),
                          color: 'primary.main',
                        }}
                      />
                    ))}
                  </Stack>

                  <Box sx={{ mt: 2.5 }}>
                    <SectionLabel>Descripción</SectionLabel>
                    <InlineText
                      value={value('description') ?? ''}
                      onChange={(v) => set({ description: v })}
                      placeholder="Contá de qué se trata, qué se acordó, qué hace falta…"
                      minRows={3}
                    />
                  </Box>
                </Box>
              </Panel>

              {/* Bloqueo: lo primero que hay que ver */}
              {status === 'blocked' && (
                <Panel
                  role="error"
                  title="Qué la tiene frenada"
                  delay={1}
                >
                  <Stack spacing={1.5}>
                    <TextField
                      size="small"
                      fullWidth
                      label="Qué se necesita"
                      value={value('blockedReason') ?? ''}
                      onChange={(e) => set({ blockedReason: e.target.value })}
                    />
                    <TextField
                      size="small"
                      fullWidth
                      label="Quién lo destraba"
                      value={value('blockerOwner') ?? ''}
                      onChange={(e) => set({ blockerOwner: e.target.value })}
                      helperText="Un bloqueo sin nombre no es un bloqueo, es un atraso."
                    />
                  </Stack>
                </Panel>
              )}

              {/* Cierre */}
              <Panel delay={2}>
                <SectionLabel>Cierre cuando…</SectionLabel>
                <InlineText
                  value={value('closureCriteria') ?? ''}
                  onChange={(v) => set({ closureCriteria: v })}
                  placeholder="exista contrato firmado y comprobante del depósito"
                  bold
                />
                <Typography
                  variant="caption"
                  color="text.disabled"
                  sx={{ display: 'block', mt: 0.75, fontSize: 11 }}
                >
                  Es el árbitro cuando se discuta si la tarea terminó.
                </Typography>

                <Box sx={{ mt: 2.5 }}>
                  <SectionLabel>Siguiente paso</SectionLabel>
                  <InlineText
                    value={value('nextStep') ?? ''}
                    onChange={(v) => set({ nextStep: v })}
                    placeholder="enviar la versión final a revisión"
                  />
                </Box>
              </Panel>

              {/* Evidencias */}
              <Panel
                title={`Evidencias · ${files.length}`}
                delay={3}
              >
                <Stack
                  direction="row"
                  flexWrap="wrap"
                  gap={1}
                  alignItems="center"
                >
                  {files.map((f) =>
                    f.type?.startsWith('image/') ? (
                      <Box
                        key={f.url}
                        component="a"
                        href={f.url}
                        target="_blank"
                        rel="noopener"
                        aria-label={f.name || 'Ver evidencia'}
                        sx={{
                          width: 104,
                          height: 104,
                          borderRadius: 2.5,
                          border: `1px solid ${alpha(theme.palette.divider, 0.8)}`,
                          backgroundImage: `url(${f.url})`,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                          transition: 'transform .18s, box-shadow .18s',
                          '&:hover': {
                            transform: 'scale(1.04)',
                            boxShadow: theme.shadows[8],
                          },
                          '@media (prefers-reduced-motion: reduce)': { transition: 'none' },
                        }}
                      />
                    ) : (
                      <Chip
                        key={f.url}
                        icon={<AttachFileRoundedIcon sx={{ fontSize: 14 }} />}
                        label={f.name || 'archivo'}
                        component="a"
                        href={f.url}
                        target="_blank"
                        clickable
                        sx={{ height: 36, maxWidth: 220, fontSize: 11.5, borderRadius: 2 }}
                      />
                    )
                  )}

                  <Button
                    component="label"
                    disabled={uploading}
                    sx={{
                      width: 104,
                      height: 104,
                      borderRadius: 2.5,
                      flexDirection: 'column',
                      gap: 0.5,
                      textTransform: 'none',
                      fontSize: 10.5,
                      fontWeight: 600,
                      color: 'text.secondary',
                      border: `1.5px dashed ${alpha(theme.palette.divider, 0.9)}`,
                      '&:hover': {
                        borderColor: 'primary.main',
                        color: 'primary.main',
                        bgcolor: alpha(theme.palette.primary.main, 0.04),
                      },
                    }}
                  >
                    {uploading ? (
                      <CircularProgress size={18} />
                    ) : (
                      <AttachFileRoundedIcon sx={{ fontSize: 20 }} />
                    )}
                    {uploading ? 'Subiendo…' : 'Adjuntar'}
                    <input
                      hidden
                      multiple
                      type="file"
                      accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.csv"
                      onChange={uploadEvidence}
                    />
                  </Button>
                </Stack>

                {files.length === 0 && (
                  <Typography
                    variant="caption"
                    color="text.disabled"
                    sx={{ display: 'block', mt: 1.25, fontSize: 11 }}
                  >
                    Lo que pruebe que el criterio de cierre se cumplió. Sale en el PDF de estado.
                  </Typography>
                )}
              </Panel>

              {/* Conversación */}
              <Panel delay={4}>
                <TaskComments
                  taskId={taskId}
                  teamMembers={teamMembers}
                />
              </Panel>

              {/* Bitácora */}
              {(task.activity?.length ?? 0) > 0 && (
                <Panel
                  title="Bitácora"
                  delay={5}
                >
                  <Stack spacing={1.5}>
                    {[...(task.activity || [])].reverse().map((a, i) => (
                      <Stack
                        key={i}
                        direction="row"
                        spacing={1.25}
                      >
                        <HistoryRoundedIcon
                          sx={{ fontSize: 15, color: 'text.disabled', mt: 0.25, flexShrink: 0 }}
                        />
                        <Box minWidth={0}>
                          <Typography sx={{ fontSize: 12.5, lineHeight: 1.45 }}>
                            {a.statusChange && (
                              <Box
                                component="span"
                                sx={{ fontWeight: 700, mr: 0.5 }}
                              >
                                {a.statusChange}
                              </Box>
                            )}
                            {a.text}
                          </Typography>
                          <Typography sx={{ fontSize: 10, color: 'text.disabled' }}>
                            {formatDue(a.at)}
                            {a.by ? ` · ${a.by}` : ''}
                          </Typography>
                        </Box>
                      </Stack>
                    ))}
                  </Stack>
                </Panel>
              )}
            </Stack>
          </Grid>

          {/* ═══ Barra lateral ═══ */}
          <Grid
            xs={12}
            md={4.5}
            lg={4}
          >
            <Box sx={{ position: { md: 'sticky' }, top: { md: 76 } }}>
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
                      primary.icon
                    )
                  }
                  sx={{
                    height: 48,
                    borderRadius: 2.5,
                    textTransform: 'none',
                    fontWeight: 800,
                    fontSize: 14,
                    boxShadow: `0 6px 18px ${alpha(theme.palette[primary.role].main, 0.28)}`,
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
                            src={o.profileImage}
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
                                src={assignee.profileImage}
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
                        error={!!overdue}
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
          </Grid>
        </Grid>
      </Container>

      {/* ═══ Barra de guardado — sólo aparece si hay cambios ═══ */}
      {dirty && (
        <Box
          sx={{
            position: 'fixed',
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 20,
            p: { xs: 1.5, md: 2 },
            pb: 'calc(env(safe-area-inset-bottom) + 12px)',
            bgcolor: alpha(theme.palette.background.paper, 0.92),
            backdropFilter: 'blur(12px)',
            borderTop: `1px solid ${alpha(theme.palette.divider, 0.8)}`,
            boxShadow: `0 -8px 30px ${alpha(theme.palette.common.black, isDark ? 0.5 : 0.1)}`,
            '@keyframes slideUp': { from: { transform: 'translateY(100%)' }, to: { transform: 'none' } },
            animation: 'slideUp .24s cubic-bezier(.2,.8,.2,1)',
            '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
          }}
        >
          <Container maxWidth="xl">
            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
            >
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  bgcolor: 'warning.main',
                  flexShrink: 0,
                  display: { xs: 'none', sm: 'block' },
                }}
              />
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ flex: 1, display: { xs: 'none', sm: 'block' }, fontWeight: 600 }}
              >
                Tenés cambios sin guardar
              </Typography>
              <Button
                onClick={() => setDraft({})}
                startIcon={<CloseRoundedIcon sx={{ fontSize: 16 }} />}
                sx={{
                  height: 46,
                  borderRadius: 2.5,
                  textTransform: 'none',
                  flex: { xs: 1, sm: 'none' },
                }}
              >
                Descartar
              </Button>
              <Button
                variant="contained"
                disableElevation
                disabled={saving}
                onClick={() => save(draft)}
                startIcon={
                  saving ? (
                    <CircularProgress
                      size={15}
                      color="inherit"
                    />
                  ) : (
                    <CheckCircleRoundedIcon sx={{ fontSize: 17 }} />
                  )
                }
                sx={{
                  height: 46,
                  px: 3,
                  borderRadius: 2.5,
                  textTransform: 'none',
                  fontWeight: 800,
                  flex: { xs: 1, sm: 'none' },
                }}
              >
                Guardar
              </Button>
            </Stack>
          </Container>
        </Box>
      )}
    </Box>
  );
}

/* ─── Edición en el sitio ─────────────────────────────────────────────────── */

/**
 * El título se ve como título, no como formulario. Al pasar por encima aparece
 * un fondo que dice "esto se puede tocar"; al enfocarlo, el borde. Enter guarda
 * el foco (no salta de línea) y Escape deshace lo que se acaba de escribir.
 */
function InlineTitle({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const theme = useTheme();
  const initial = React.useRef(value);

  return (
    <TextField
      fullWidth
      multiline
      variant="outlined"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          (e.target as HTMLElement).blur();
        }
        if (e.key === 'Escape') {
          onChange(initial.current);
          (e.target as HTMLElement).blur();
        }
      }}
      // El corrector ortográfico subrayaba en rojo cada nombre de tienda
      inputProps={{ spellCheck: false, 'aria-label': 'Título de la tarea' }}
      sx={{
        '& .MuiOutlinedInput-root': {
          px: 1,
          py: 0.5,
          mx: -1,
          borderRadius: 2,
          transition: 'background-color .18s',
          '& fieldset': { borderColor: 'transparent' },
          '&:hover': { bgcolor: alpha(theme.palette.text.primary, 0.04) },
          '&:hover fieldset': { borderColor: 'transparent' },
          '&.Mui-focused': { bgcolor: alpha(theme.palette.primary.main, 0.04) },
          '&.Mui-focused fieldset': { borderColor: theme.palette.primary.main, borderWidth: 1 },
          '@media (prefers-reduced-motion: reduce)': { transition: 'none' },
        },
        '& textarea': {
          fontSize: { xs: 21, md: 27 },
          fontWeight: 800,
          lineHeight: 1.22,
          letterSpacing: -0.6,
        },
      }}
    />
  );
}

/** Igual que el título pero en tamaño texto: para descripción, cierre y paso. */
function InlineText({
  value,
  onChange,
  placeholder,
  minRows = 1,
  bold = false,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  minRows?: number;
  bold?: boolean;
}) {
  const theme = useTheme();
  const initial = React.useRef(value);

  return (
    <TextField
      fullWidth
      multiline
      minRows={minRows}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          onChange(initial.current);
          (e.target as HTMLElement).blur();
        }
      }}
      inputProps={{ spellCheck: false }}
      sx={{
        '& .MuiOutlinedInput-root': {
          px: 1.25,
          py: 1,
          mx: -1.25,
          borderRadius: 2,
          fontSize: 14,
          lineHeight: 1.6,
          fontWeight: bold ? 600 : 400,
          transition: 'background-color .18s',
          '& fieldset': { borderColor: 'transparent' },
          '&:hover': { bgcolor: alpha(theme.palette.text.primary, 0.04) },
          '&:hover fieldset': { borderColor: 'transparent' },
          '&.Mui-focused': { bgcolor: alpha(theme.palette.primary.main, 0.04) },
          '&.Mui-focused fieldset': { borderColor: theme.palette.primary.main, borderWidth: 1 },
          '@media (prefers-reduced-motion: reduce)': { transition: 'none' },
        },
      }}
    />
  );
}

/* ─── Piezas ──────────────────────────────────────────────────────────────── */

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <Typography
      variant="caption"
      color="text.secondary"
      sx={{ display: 'block', mb: 0.75, fontSize: 10.5, fontWeight: 800, letterSpacing: 0.6 }}
    >
      {String(children).toUpperCase()}
    </Typography>
  );
}

function Panel({
  title,
  role,
  accent,
  delay = 0,
  pad = true,
  children,
}: {
  title?: string;
  role?: 'error' | 'success';
  /** Hilo de color arriba del panel (prioridad de la tarea). */
  accent?: string;
  delay?: number;
  pad?: boolean;
  children: React.ReactNode;
}) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const semantic = role ? theme.palette[role].main : null;

  return (
    <Box
      sx={{
        borderRadius: 3,
        overflow: 'hidden',
        bgcolor: semantic
          ? alpha(semantic, isDark ? 0.09 : 0.04)
          : theme.palette.background.paper,
        border: `1px solid ${alpha(semantic || theme.palette.divider, semantic ? 0.35 : 0.65)}`,
        boxShadow: `0 1px 2px ${alpha(theme.palette.common.black, isDark ? 0.3 : 0.03)}`,
        ...RISE,
        animationDelay: `${delay * 45}ms`,
      }}
    >
      {accent && (
        <Box
          sx={{
            height: 3,
            background: `linear-gradient(90deg, ${accent}, ${alpha(accent, 0)})`,
          }}
        />
      )}
      <Box sx={pad ? { p: { xs: 2, md: 2.5 } } : undefined}>
        {title && (
          <Typography
            variant="caption"
            sx={{ display: 'block', mb: 1.5, fontSize: 10.5, fontWeight: 800, letterSpacing: 0.6 }}
            color={semantic ? role : 'text.secondary'}
          >
            {title.toUpperCase()}
          </Typography>
        )}
        {children}
      </Box>
    </Box>
  );
}

function Meta({
  label,
  value,
  role,
}: {
  label: string;
  value: string;
  role?: 'success' | 'warning';
}) {
  return (
    <Stack
      direction="row"
      alignItems="baseline"
      spacing={1}
    >
      <Typography sx={{ fontSize: 11, color: 'text.disabled', width: 92, flexShrink: 0 }}>
        {label}
      </Typography>
      <Typography
        sx={{ fontSize: 12, fontWeight: 600, minWidth: 0 }}
        color={role ? `${role}.main` : 'text.primary'}
      >
        {value}
      </Typography>
    </Stack>
  );
}

/**
 * Creada → Empezada → Cerrada. Es lo que la tarea rutinaria nunca dejó ver:
 * cuánto estuvo esperando y cuánto tardó de verdad.
 */
function Timeline({ task }: { task: Task }) {
  const theme = useTheme();

  const gap = (from?: string | null, to?: string | null) => {
    if (!from || !to) return null;
    const h = (new Date(to).getTime() - new Date(from).getTime()) / 3_600_000;
    if (h < 1) return `${Math.max(1, Math.round(h * 60))} min`;
    if (h < 48) return `${h.toFixed(1)} h`;
    return `${Math.round(h / 24)} días`;
  };

  const steps = [
    { label: 'Creada', at: task.createdAt, color: theme.palette.text.disabled },
    { label: 'Empezada', at: task.startedAt, color: theme.palette.warning.main },
    { label: 'Cerrada', at: task.completedAt, color: theme.palette.success.main },
  ];

  return (
    <Stack spacing={0}>
      {steps.map((s, i) => {
        const prev = steps[i - 1];
        const between = prev?.at && s.at ? gap(prev.at, s.at) : null;
        const done = !!s.at;
        return (
          <Box key={s.label}>
            {i > 0 && (
              <Stack
                direction="row"
                alignItems="center"
                spacing={1.5}
                sx={{ pl: '5px', height: 26 }}
              >
                <Box
                  sx={{
                    width: 2,
                    height: '100%',
                    bgcolor: alpha(done ? s.color : theme.palette.divider, done ? 0.4 : 1),
                  }}
                />
                {between && (
                  <Typography sx={{ fontSize: 10, color: 'text.disabled' }}>{between}</Typography>
                )}
              </Stack>
            )}
            <Stack
              direction="row"
              alignItems="center"
              spacing={1.5}
            >
              <Box
                sx={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  flexShrink: 0,
                  bgcolor: done ? s.color : 'transparent',
                  border: `2px solid ${done ? s.color : theme.palette.divider}`,
                  boxShadow: done ? `0 0 0 4px ${alpha(s.color, 0.14)}` : 'none',
                }}
              />
              <Box minWidth={0}>
                <Typography
                  sx={{ fontSize: 12, fontWeight: 700, lineHeight: 1.2 }}
                  color={done ? 'text.primary' : 'text.disabled'}
                >
                  {s.label}
                </Typography>
                <Typography sx={{ fontSize: 10.5, color: 'text.disabled' }}>
                  {s.at ? formatDue(s.at) : 'todavía no'}
                </Typography>
              </Box>
            </Stack>
          </Box>
        );
      })}
    </Stack>
  );
}

function DetailSkeleton() {
  return (
    <Container
      maxWidth="xl"
      sx={{ py: 3 }}
    >
      <Skeleton
        variant="text"
        width={200}
        height={28}
      />
      <Grid
        container
        spacing={3}
        mt={0}
      >
        <Grid
          xs={12}
          md={8}
        >
          <Skeleton
            variant="rounded"
            height={190}
            sx={{ borderRadius: 3, mb: 2 }}
          />
          <Skeleton
            variant="rounded"
            height={240}
            sx={{ borderRadius: 3 }}
          />
        </Grid>
        <Grid
          xs={12}
          md={4}
        >
          <Skeleton
            variant="rounded"
            height={380}
            sx={{ borderRadius: 3 }}
          />
        </Grid>
      </Grid>
    </Container>
  );
}
