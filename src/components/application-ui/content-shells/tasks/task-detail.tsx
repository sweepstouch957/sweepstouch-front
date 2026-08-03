'use client';

import { useAuth } from '@/hooks/use-auth';
import { usersApi } from '@/mocks/users';
import { departmentService } from '@/services/department.service';
import { epicService } from '@/services/epic.service';
import { Task, taskClient, type TaskFile } from '@/services/task.service';
import { uploadTaskEvidence } from '@/services/upload.service';
import { isInternalStaff, STAFF_ROLE_QUERY } from '@/utils/staff';
import { combineDueDate, formatDue, timeInputValue, toDateInput } from '@/utils/due-date';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import AttachFileRoundedIcon from '@mui/icons-material/AttachFileRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import ContentCopyRoundedIcon from '@mui/icons-material/ContentCopyRounded';
import HistoryRoundedIcon from '@mui/icons-material/HistoryRounded';
import PictureAsPdfRoundedIcon from '@mui/icons-material/PictureAsPdfRounded';
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
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import React, { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { IMPACT_OPTIONS, priorityEntries, statusEntries, statusMeta } from './constants';
import { TaskComments } from './task-comments';

/** Sólo se manda lo que cambió: un PATCH con todo pisa lo que otro acaba de tocar. */
type Draft = Partial<Task> & { dueDateInput?: string; dueTimeInput?: string };

export function TaskDetail({ taskId }: { taskId: string }) {
  const theme = useTheme();
  const mdUp = useMediaQuery(theme.breakpoints.up('md'));
  const isDark = theme.palette.mode === 'dark';
  const { push, back } = useRouter();
  const queryClient = useQueryClient();
  const { user: authUser } = useAuth();

  const { data: task, isLoading } = useQuery({
    queryKey: ['task', taskId],
    queryFn: () => taskClient.getTask(taskId),
    enabled: !!taskId,
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
  const { mutate: setStatus } = useMutation({
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

  const meta = statusMeta(theme, value('status'));
  const epic = epics.find((e) => e._id === task.epicId);
  const overdue =
    task.dueDate && task.status !== 'done' && new Date(task.dueDate).getTime() < Date.now();

  return (
    <Box
      sx={{
        minHeight: '100dvh',
        bgcolor: isDark
          ? alpha(theme.palette.common.black, 0.2)
          : alpha(theme.palette.common.black, 0.015),
        pb: { xs: dirty ? 12 : 4, md: 6 },
      }}
    >
      {/* ═══ Cabecera pegada: identidad + estado + acciones ═══ */}
      <Box
        sx={{
          position: 'sticky',
          top: 0,
          zIndex: 10,
          bgcolor: theme.palette.background.paper,
          borderBottom: `1px solid ${alpha(theme.palette.divider, 0.7)}`,
          backdropFilter: 'blur(8px)',
        }}
      >
        <Container
          maxWidth="xl"
          sx={{ py: 1.25 }}
        >
          <Stack
            direction="row"
            alignItems="center"
            spacing={1}
          >
            <IconButton
              onClick={() => (window.history.length > 1 ? back() : push('/admin/applications/tasks'))}
              aria-label="Volver"
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

            {/* Estado: selector directo, con el color del estado */}
            <TextField
              select
              size="small"
              value={value('status')}
              onChange={(e) => setStatus(e.target.value)}
              SelectProps={{ 'aria-label': 'Estado de la tarea' } as any}
              sx={{
                minWidth: 140,
                '& .MuiOutlinedInput-root': {
                  height: 38,
                  borderRadius: 2,
                  fontWeight: 700,
                  fontSize: 12.5,
                  color: meta.color,
                  bgcolor: alpha(meta.color, 0.1),
                  '& fieldset': { borderColor: alpha(meta.color, 0.35) },
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
              <Panel>
                <TextField
                  variant="standard"
                  fullWidth
                  multiline
                  value={value('title') ?? ''}
                  onChange={(e) => set({ title: e.target.value })}
                  inputProps={{ 'aria-label': 'Título de la tarea' }}
                  InputProps={{ disableUnderline: true }}
                  sx={{
                    '& textarea': {
                      fontSize: { xs: 20, md: 26 },
                      fontWeight: 800,
                      lineHeight: 1.25,
                      letterSpacing: -0.4,
                    },
                  }}
                />

                <Stack
                  direction="row"
                  spacing={1}
                  flexWrap="wrap"
                  useFlexGap
                  sx={{ mt: 1 }}
                >
                  {task.storeName && (
                    <Chip
                      icon={<StorefrontRoundedIcon sx={{ fontSize: '14px !important' }} />}
                      label={task.storeName}
                      size="small"
                      sx={{ height: 24, fontSize: 11, fontWeight: 600 }}
                    />
                  )}
                  {task.tags?.map((t) => (
                    <Chip
                      key={t}
                      label={t}
                      size="small"
                      sx={{
                        height: 24,
                        fontSize: 11,
                        fontWeight: 600,
                        bgcolor: alpha(theme.palette.primary.main, 0.08),
                        color: 'primary.main',
                      }}
                    />
                  ))}
                </Stack>

                <TextField
                  fullWidth
                  multiline
                  minRows={3}
                  placeholder="Contá de qué se trata…"
                  value={value('description') ?? ''}
                  onChange={(e) => set({ description: e.target.value })}
                  inputProps={{ 'aria-label': 'Descripción' }}
                  sx={{ mt: 2, '& .MuiOutlinedInput-root': { borderRadius: 2, fontSize: 14 } }}
                />
              </Panel>

              {/* Bloqueo: lo primero que hay que ver */}
              {value('status') === 'blocked' && (
                <Panel
                  role="error"
                  title="¿Qué la tiene frenada?"
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

              <Panel title="Cierre cuando…">
                <TextField
                  fullWidth
                  size="small"
                  value={value('closureCriteria') ?? ''}
                  onChange={(e) => set({ closureCriteria: e.target.value })}
                  placeholder="exista contrato firmado y comprobante del depósito"
                  helperText="Es el árbitro cuando se discuta si la tarea terminó."
                />
                <TextField
                  fullWidth
                  size="small"
                  label="Siguiente paso"
                  value={value('nextStep') ?? ''}
                  onChange={(e) => set({ nextStep: e.target.value })}
                  placeholder="enviar la versión final a revisión"
                  sx={{ mt: 2 }}
                />
              </Panel>

              {/* Evidencias */}
              <Panel title={`Evidencias (${files.length})`}>
                <Button
                  size="small"
                  component="label"
                  startIcon={
                    uploading ? <CircularProgress size={13} /> : <AttachFileRoundedIcon />
                  }
                  disabled={uploading}
                  sx={{
                    textTransform: 'none',
                    borderRadius: 2,
                    height: 40,
                    px: 1.5,
                    mb: files.length ? 1.5 : 0,
                    border: `1px dashed ${alpha(theme.palette.divider, 0.9)}`,
                  }}
                >
                  {uploading ? 'Subiendo…' : 'Adjuntar archivo o foto'}
                  <input
                    hidden
                    multiple
                    type="file"
                    accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.csv"
                    onChange={uploadEvidence}
                  />
                </Button>

                <Stack
                  direction="row"
                  flexWrap="wrap"
                  gap={1}
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
                          borderRadius: 2,
                          border: `1px solid ${alpha(theme.palette.divider, 0.8)}`,
                          backgroundImage: `url(${f.url})`,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                          transition: 'transform .18s',
                          '&:hover': { transform: 'scale(1.03)' },
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
                        sx={{ height: 34, maxWidth: 220, fontSize: 11.5 }}
                      />
                    )
                  )}
                </Stack>

                {files.length === 0 && (
                  <Typography
                    variant="caption"
                    color="text.disabled"
                    sx={{ display: 'block', mt: 1 }}
                  >
                    Lo que pruebe que el criterio de cierre se cumplió. Sale en el PDF de estado.
                  </Typography>
                )}
              </Panel>

              {/* Conversación */}
              <Panel>
                <TaskComments
                  taskId={taskId}
                  teamMembers={teamMembers}
                />
              </Panel>

              {/* Bitácora */}
              {(task.activity?.length ?? 0) > 0 && (
                <Panel title="Bitácora">
                  <Stack spacing={1.25}>
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

          {/* ═══ Detalles ═══ */}
          <Grid
            xs={12}
            md={4.5}
            lg={4}
          >
            <Panel title="Detalles">
              <Stack spacing={2}>
                <Autocomplete
                  size="small"
                  options={teamMembers}
                  value={teamMembers.find((u: any) => (u._id || u.id) === value('assigneeId')) || null}
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
                      {o.firstName} {o.lastName || ''}
                    </li>
                  )}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Responsable"
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
                    sx={{ width: 128, flexShrink: 0 }}
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
                        <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: c.color }} />
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

                <Divider />

                <Meta
                  label="Área"
                  value={departments.find((d) => d._id === task.departmentId)?.name || '—'}
                />
                <Meta
                  label="Creada por"
                  value={task.reporterName || '—'}
                />
                <Meta
                  label="Creada"
                  value={formatDue(task.createdAt)}
                />
                {task.startedAt && (
                  <Meta
                    label="Empezada"
                    value={formatDue(task.startedAt)}
                  />
                )}
                {task.completedAt && (
                  <Meta
                    label="Cerrada"
                    value={formatDue(task.completedAt)}
                    role="success"
                  />
                )}
                {(task.rescheduleCount || 0) > 0 && (
                  <Meta
                    label="Reprogramada"
                    value={`${task.rescheduleCount}× · ${task.lastRescheduleReason || 'sin motivo'}`}
                    role="warning"
                  />
                )}
              </Stack>
            </Panel>
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
            bgcolor: theme.palette.background.paper,
            borderTop: `1px solid ${alpha(theme.palette.divider, 0.8)}`,
            boxShadow: theme.shadows[12],
          }}
        >
          <Container maxWidth="xl">
            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
            >
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ flex: 1, display: { xs: 'none', sm: 'block' } }}
              >
                Tenés cambios sin guardar
              </Typography>
              <Button
                onClick={() => setDraft({})}
                startIcon={<CloseRoundedIcon sx={{ fontSize: 16 }} />}
                sx={{ height: 44, borderRadius: 2, textTransform: 'none', flex: { xs: 1, sm: 'none' } }}
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
                  height: 44,
                  px: 3,
                  borderRadius: 2,
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

/* ─── Piezas ──────────────────────────────────────────────────────────────── */

function Panel({
  title,
  role,
  children,
}: {
  title?: string;
  role?: 'error' | 'success';
  children: React.ReactNode;
}) {
  const theme = useTheme();
  const accent = role ? theme.palette[role].main : null;
  return (
    <Box
      sx={{
        p: { xs: 2, md: 2.5 },
        borderRadius: 3,
        bgcolor: theme.palette.background.paper,
        border: `1px solid ${alpha(accent || theme.palette.divider, accent ? 0.35 : 0.7)}`,
        ...(accent ? { bgcolor: alpha(accent, 0.04) } : {}),
      }}
    >
      {title && (
        <Typography
          variant="caption"
          sx={{ display: 'block', mb: 1.5, fontSize: 10.5, fontWeight: 800, letterSpacing: 0.5 }}
          color={accent ? role : 'text.secondary'}
        >
          {title.toUpperCase()}
        </Typography>
      )}
      {children}
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
      <Typography
        sx={{ fontSize: 11, color: 'text.disabled', width: 92, flexShrink: 0 }}
      >
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
