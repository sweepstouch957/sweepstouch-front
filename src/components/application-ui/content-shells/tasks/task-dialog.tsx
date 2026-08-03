import { EPIC_COLORS, epicService, type Epic } from '@/services/epic.service';
import { RECURRENCE_LABEL, Task, taskClient, type Recurrence, type TaskFile } from '@/services/task.service';
import { templateService, type TaskTemplate } from '@/services/template.service';
import { uploadTaskEvidence } from '@/services/upload.service';
import { formatDue, timeInputValue, toDateInput } from '@/utils/due-date';
import { useStoresWithoutFilters } from '@/hooks/stores/useStoresWithoutFilter';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import PictureAsPdfRoundedIcon from '@mui/icons-material/PictureAsPdfRounded';
import AttachFileRoundedIcon from '@mui/icons-material/AttachFileRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import LinkRoundedIcon from '@mui/icons-material/LinkRounded';
import toast from 'react-hot-toast';
import FlagRoundedIcon from '@mui/icons-material/FlagRounded';
import RepeatRoundedIcon from '@mui/icons-material/RepeatRounded';
import TagRoundedIcon from '@mui/icons-material/TagRounded';
import {
  alpha,
  Autocomplete,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  InputAdornment,
  MenuItem,
  Slider,
  Stack,
  TextField,
  Typography,
  useTheme,
} from '@mui/material';
import React, { useMemo, useState } from 'react';
import {
  Control,
  Controller,
  useForm,
  useWatch,
  type UseFormRegister,
  type UseFormSetValue,
} from 'react-hook-form';
import {
  EMPTY_TASK_FORM,
  IMPACT_OPTIONS,
  missingTaskFields,
  priorityEntries,
  STATUS_LABEL,
  statusEntries,
  titleLacksVerb,
  type TaskFormState,
} from './constants';
import { TaskComments } from './task-comments';

export type TaskFormValues = TaskFormState & { status: string };

/**
 * El formulario vive DENTRO del diálogo y con react-hook-form: los inputs son
 * no controlados, así que escribir no vuelve a renderizar ni el diálogo ni el
 * board. Antes el estado estaba en `tasks.tsx` y cada tecla repintaba las 6
 * columnas del kanban con todas sus tarjetas — de ahí el lag.
 */
type TaskDialogProps = {
  open: boolean;
  editingTask: Task | null;
  initialStatus: string;
  teamMembers: any[];
  epics: Epic[];
  projectId: string | null;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (values: TaskFormValues) => void;
};

/** MUI necesita `inputRef`; el `ref` de RHF apuntaría al div raíz. */
function bind(register: UseFormRegister<TaskFormValues>, name: keyof TaskFormValues) {
  const { ref, ...rest } = register(name);
  return { inputRef: ref, ...rest };
}

function toFormValues(task: Task | null, status: string): TaskFormValues {
  if (!task) return { ...EMPTY_TASK_FORM, status };
  return {
    title: task.title,
    description: task.description || '',
    priority: task.priority,
    assigneeId: task.assigneeId || '',
    assigneeName: task.assigneeName || '',
    assigneeAvatar: task.assigneeAvatar || '',
    dueDate: task.dueDate ? toDateInput(task.dueDate) : '',
    dueTime: timeInputValue(task.dueDate),
    closureCriteria: task.closureCriteria || '',
    beneficiary: task.beneficiary || '',
    nextStep: task.nextStep || '',
    impact: task.impact || '',
    rescheduleReason: '',
    blockedReason: task.blockedReason || '',
    blockerOwner: task.blockerOwner || '',
    epicId: task.epicId || '',
    storeId: task.storeId || '',
    storeName: task.storeName || '',
    templateId: task.templateId || '',
    aiContext: task.aiContext || '',
    tags: task.tags?.join(', ') || '',
    progress: task.progress || 0,
    recurrence: task.recurrence || 'none',
    status,
  };
}

export function TaskDialog({
  open,
  editingTask,
  initialStatus,
  teamMembers,
  epics,
  projectId,
  submitting,
  onClose,
  onSubmit,
}: TaskDialogProps) {
  const theme = useTheme();

  // El diálogo se monta al abrir, así que los defaults se calculan una sola vez.
  const { register, control, handleSubmit, setValue } = useForm<TaskFormValues>({
    defaultValues: toFormValues(editingTask, initialStatus),
  });

  /* ── Evidencias ─────────────────────────────────────────────────────────
     Las evidencias viven en la tarea, no en un chat: el archivo va al servicio
     de upload (igual que el resto del panel) y aquí queda su URL. */
  const [files, setFiles] = useState<TaskFile[]>(editingTask?.files || []);
  const [uploading, setUploading] = useState(false);
  /** La plantilla elegida dijo que este trabajo es de una tienda. */
  const [needsStore, setNeedsStore] = useState(false);

  async function handleUploadEvidence(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(e.target.files || []);
    e.target.value = '';
    if (!picked.length || !editingTask) return;

    setUploading(true);
    try {
      for (const f of picked) {
        const url = await uploadTaskEvidence(f);
        const updated = await taskClient.addAttachment(editingTask._id, {
          url,
          name: f.name,
          type: f.type,
          size: f.size,
        });
        setFiles(updated.files || []);
      }
      toast.success(picked.length === 1 ? 'Evidencia adjunta' : `${picked.length} evidencias adjuntas`);
    } catch {
      toast.error('No se pudo subir la evidencia');
    } finally {
      setUploading(false);
    }
  }

  async function handleRemoveEvidence(url: string) {
    if (!editingTask) return;
    try {
      const updated = await taskClient.removeAttachment(editingTask._id, url);
      setFiles(updated.files || []);
    } catch {
      toast.error('No se pudo quitar la evidencia');
    }
  }

  /** Los mismos 2 enlaces que van por WhatsApp: PDF de estado y link al panel. */
  async function shareTask(kind: 'pdf' | 'panel') {
    if (!editingTask) return;
    try {
      const links = await taskClient.getTaskLinks(editingTask._id);
      if (kind === 'pdf') {
        window.open(links.pdf, '_blank', 'noopener');
        return;
      }
      await navigator.clipboard.writeText(links.panel);
      toast.success('Link del panel copiado');
    } catch {
      toast.error('No se pudieron generar los enlaces');
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 3, overflow: 'visible' },
        component: 'form',
        onSubmit: handleSubmit(onSubmit),
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
        >
          <Stack
            direction="row"
            alignItems="center"
            spacing={1.5}
          >
            {editingTask?.identifier && (
              <Chip
                label={editingTask.identifier}
                size="small"
                sx={{
                  fontFamily: 'monospace',
                  fontWeight: 700,
                  fontSize: 11,
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                  color: 'primary.main',
                }}
              />
            )}
            <Typography
              variant="h6"
              fontWeight={700}
            >
              {editingTask ? 'Editar tarea' : 'Nueva tarea'}
            </Typography>
          </Stack>

          {editingTask && (
            <Stack
              direction="row"
              spacing={0.5}
            >
              <Button
                size="small"
                startIcon={<PictureAsPdfRoundedIcon />}
                onClick={() => shareTask('pdf')}
                sx={{ textTransform: 'none', borderRadius: 1.5 }}
              >
                PDF de estado
              </Button>
              <Button
                size="small"
                startIcon={<LinkRoundedIcon />}
                onClick={() => shareTask('panel')}
                sx={{ textTransform: 'none', borderRadius: 1.5 }}
              >
                Copiar link
              </Button>
            </Stack>
          )}
        </Stack>
      </DialogTitle>

      <DialogContent
        dividers
        sx={{ pt: 2 }}
      >
        <Stack spacing={2}>
          {/* Arrancar desde una plantilla — sólo al crear */}
          {!editingTask && (
            <TemplatePicker
              setValue={setValue}
              onApply={(tpl) => setNeedsStore(!!tpl?.requiresStore)}
            />
          )}

          <TitleField
            control={control}
            register={register}
          />

          <TextField
            label="Description"
            fullWidth
            multiline
            rows={3}
            {...bind(register, 'description')}
            placeholder="Add more details…"
          />

          {/* Priority + Status */}
          <Stack
            direction="row"
            spacing={1.5}
          >
            <Controller
              control={control}
              name="priority"
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Priority"
                  select
                  fullWidth
                  size="small"
                >
                  {priorityEntries(theme).map(([k, c]) => (
                    <MenuItem
                      key={k}
                      value={k}
                    >
                      <Stack
                        direction="row"
                        spacing={1}
                        alignItems="center"
                      >
                        <FlagRoundedIcon sx={{ fontSize: 15, color: c.color }} />
                        <span>{c.label}</span>
                      </Stack>
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />
            <Controller
              control={control}
              name="status"
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Status"
                  select
                  fullWidth
                  size="small"
                >
                  {statusEntries(theme).map(([k, m]) => (
                    <MenuItem
                      key={k}
                      value={k}
                    >
                      <Stack
                        direction="row"
                        spacing={1}
                        alignItems="center"
                      >
                        <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: m.color }} />
                        <span>{m.label}</span>
                      </Stack>
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />
          </Stack>

          {/* Assignee + Due date */}
          <Stack
            direction="row"
            spacing={1.5}
          >
            <AssigneeField
              control={control}
              setValue={setValue}
              teamMembers={teamMembers}
            />
            <ScheduleField
              control={control}
              register={register}
            />
          </Stack>

          <RescheduleField
            control={control}
            register={register}
            editingTask={editingTask}
          />

          {editingTask && <Timeline task={editingTask} />}

          {/* Criterio de cierre — cuarto campo obligatorio del manual */}
          <TextField
            label="Cierre cuando…"
            fullWidth
            size="small"
            required
            {...bind(register, 'closureCriteria')}
            placeholder="exista contrato firmado con el salón y comprobante del depósito"
            helperText="Una línea: cómo sabremos que quedó lista. Es el árbitro cuando se discuta si terminó."
          />

          <BlockedSection
            control={control}
            register={register}
          />

          <Stack
            direction="row"
            spacing={1.5}
          >
            <EpicField
              control={control}
              setValue={setValue}
              epics={epics}
              projectId={projectId}
            />
            <RecurrenceField control={control} />
          </Stack>

          {/* Evidencias — sólo cuando la tarea ya existe (necesita id) */}
          {editingTask && (
            <Box>
              <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                mb={0.75}
              >
                <Typography
                  variant="caption"
                  fontWeight={700}
                  color="text.secondary"
                >
                  EVIDENCIAS ({files.length})
                </Typography>
                <Button
                  size="small"
                  component="label"
                  startIcon={uploading ? <CircularProgress size={13} /> : <AttachFileRoundedIcon />}
                  disabled={uploading}
                  sx={{ textTransform: 'none', borderRadius: 1.5 }}
                >
                  {uploading ? 'Subiendo…' : 'Adjuntar'}
                  <input
                    hidden
                    multiple
                    type="file"
                    accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.csv"
                    onChange={handleUploadEvidence}
                  />
                </Button>
              </Stack>

              {files.length === 0 ? (
                <Typography
                  variant="caption"
                  color="text.disabled"
                >
                  Subí acá las fotos o archivos que prueban que la tarea quedó lista. Salen en el
                  PDF de estado.
                </Typography>
              ) : (
                <Stack spacing={0.5}>
                  {files.map((f) => (
                    <Stack
                      key={f.url}
                      direction="row"
                      alignItems="center"
                      spacing={1}
                      sx={{
                        px: 1,
                        py: 0.5,
                        borderRadius: 1.5,
                        border: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
                      }}
                    >
                      {f.type?.startsWith('image/') ? (
                        <Avatar
                          src={f.url}
                          variant="rounded"
                          sx={{ width: 28, height: 28 }}
                        />
                      ) : (
                        <Avatar
                          variant="rounded"
                          sx={{ width: 28, height: 28, bgcolor: alpha(theme.palette.primary.main, 0.12) }}
                        >
                          <AttachFileRoundedIcon sx={{ fontSize: 14, color: 'primary.main' }} />
                        </Avatar>
                      )}
                      <Typography
                        component="a"
                        href={f.url}
                        target="_blank"
                        rel="noopener"
                        fontSize={12}
                        flex={1}
                        noWrap
                        sx={{ color: 'primary.main', textDecoration: 'none' }}
                      >
                        {f.name || f.url}
                      </Typography>
                      <IconButton
                        size="small"
                        onClick={() => handleRemoveEvidence(f.url)}
                      >
                        <CloseRoundedIcon sx={{ fontSize: 14 }} />
                      </IconButton>
                    </Stack>
                  ))}
                </Stack>
              )}
            </Box>
          )}

          {/* Contexto opcional — suma para el reporte, nunca frena el guardado */}
          <Stack
            direction="row"
            spacing={1.5}
          >
            <TextField
              label="Para quién"
              size="small"
              fullWidth
              {...bind(register, 'beneficiary')}
              placeholder="Key Food, Marketing, interno…"
              helperText="Opcional"
            />
            <Controller
              control={control}
              name="impact"
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Impacto"
                  select
                  size="small"
                  fullWidth
                  helperText="Opcional"
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
              )}
            />
          </Stack>

          <TextField
            label="Siguiente paso"
            size="small"
            fullWidth
            {...bind(register, 'nextStep')}
            placeholder="enviar la versión final a revisión"
            helperText="Opcional, pero es lo primero que pregunta Dirección"
          />

          <StoreField
            control={control}
            setValue={setValue}
            highlight={needsStore}
          />

          <TagsField
            control={control}
            setValue={setValue}
          />

          <ProgressField control={control} />

          <TextField
            label="AI Context"
            fullWidth
            multiline
            rows={2}
            size="small"
            {...bind(register, 'aiContext')}
            placeholder="Describe what this task involves so AI can learn your team's work…"
            helperText="AI training context — helps the assistant understand team activities"
          />

          {/* Conversación — sólo con la tarea creada: las menciones necesitan id */}
          {editingTask && (
            <>
              <Box sx={{ height: '1px', bgcolor: alpha(theme.palette.divider, 0.8) }} />
              <TaskComments
                taskId={editingTask._id}
                teamMembers={teamMembers}
              />
            </>
          )}
        </Stack>
      </DialogContent>

      <DialogActions sx={{ p: 2, gap: 1, flexWrap: 'wrap' }}>
        <SubmitBar
          control={control}
          editingTask={editingTask}
          submitting={submitting}
          onClose={onClose}
        />
      </DialogActions>
    </Dialog>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   Cada trozo que depende de un valor se suscribe con `useWatch`, así una tecla
   sólo repinta ese trozo y no el diálogo entero.
   ══════════════════════════════════════════════════════════════════════════ */

function TitleField({
  control,
  register,
}: {
  control: Control<TaskFormValues>;
  register: UseFormRegister<TaskFormValues>;
}) {
  const title = useWatch({ control, name: 'title' });
  const noVerb = titleLacksVerb(title || '');

  return (
    <TextField
      label="Título"
      fullWidth
      autoFocus
      required
      {...bind(register, 'title')}
      placeholder="Empieza con un verbo: confirmar, enviar, diseñar, llamar…"
      error={noVerb}
      helperText={
        noVerb
          ? 'Empieza con un verbo de acción. "Evento NSA" es un recordatorio; "Confirmar salón para el evento NSA" es una tarea.'
          : undefined
      }
      sx={{ '& .MuiOutlinedInput-root': { fontWeight: 600 } }}
    />
  );
}

function AssigneeField({
  control,
  setValue,
  teamMembers,
}: {
  control: Control<TaskFormValues>;
  setValue: UseFormSetValue<TaskFormValues>;
  teamMembers: any[];
}) {
  const assigneeId = useWatch({ control, name: 'assigneeId' });
  const assigneeName = useWatch({ control, name: 'assigneeName' });
  const assigneeAvatar = useWatch({ control, name: 'assigneeAvatar' });

  const selected = useMemo(
    () => teamMembers.find((u: any) => (u.id || u._id) === assigneeId) || null,
    [teamMembers, assigneeId]
  );

  return (
    <Autocomplete
      fullWidth
      size="small"
      options={teamMembers}
      value={selected}
      onChange={(_, v: any) => {
        setValue('assigneeId', v ? v.id || v._id : '');
        setValue('assigneeName', v ? `${v.firstName} ${v.lastName || ''}`.trim() : '');
        setValue('assigneeAvatar', v?.profileImage || '');
      }}
      getOptionLabel={(o: any) => `${o.firstName} ${o.lastName || ''}`.trim()}
      renderOption={(props, option: any) => (
        <li {...props}>
          <Avatar
            src={option.profileImage}
            sx={{ width: 24, height: 24, mr: 1, fontSize: 10 }}
          >
            {option.firstName?.[0]}
          </Avatar>
          {option.firstName} {option.lastName || ''}
        </li>
      )}
      renderInput={(params) => (
        <TextField
          {...params}
          label="Assignee"
          InputProps={{
            ...params.InputProps,
            startAdornment: assigneeId ? (
              <Avatar
                src={assigneeAvatar}
                sx={{ width: 20, height: 20, mr: 0.5, ml: 0.5, fontSize: 9 }}
              >
                {assigneeName?.[0]}
              </Avatar>
            ) : undefined,
          }}
        />
      )}
    />
  );
}

function ScheduleField({
  control,
  register,
}: {
  control: Control<TaskFormValues>;
  register: UseFormRegister<TaskFormValues>;
}) {
  const recurrence = useWatch({ control, name: 'recurrence' });
  const dueDate = useWatch({ control, name: 'dueDate' });
  const isRoutine = recurrence !== 'none';

  return (
    <Stack
      direction="row"
      spacing={1.5}
      sx={{ width: '100%' }}
    >
      <TextField
        label="Fecha límite"
        type="date"
        size="small"
        fullWidth
        required={!isRoutine}
        disabled={isRoutine}
        {...bind(register, 'dueDate')}
        InputLabelProps={{ shrink: true }}
        error={!isRoutine && !dueDate}
        helperText={
          isRoutine
            ? 'La pone el sistema cada día'
            : !dueDate
              ? 'Obligatoria. Si no se sabe, pon fecha para DEFINIR la fecha'
              : 'Si no se sabe, pon fecha para definir la fecha'
        }
      />
      {/* La hora es opcional: sin ella la tarea vence al final del día. Con
          ella, el bot puede avisar "vence a las 3" en vez de "vence hoy". */}
      <TextField
        label="Hora"
        type="time"
        size="small"
        sx={{ width: 150, flexShrink: 0 }}
        disabled={isRoutine || !dueDate}
        {...bind(register, 'dueTime')}
        InputLabelProps={{ shrink: true }}
        helperText="Opcional"
      />
    </Stack>
  );
}

/** Motivo del cambio de fecha — sólo si la tarea ya existía y se movió. */
function RescheduleField({
  control,
  register,
  editingTask,
}: {
  control: Control<TaskFormValues>;
  register: UseFormRegister<TaskFormValues>;
  editingTask: Task | null;
}) {
  const dueDate = useWatch({ control, name: 'dueDate' });
  if (!editingTask || !dueDate || editingTask.dueDate?.slice(0, 10) === dueDate) return null;

  return (
    <TextField
      label="¿Por qué se mueve la fecha?"
      size="small"
      fullWidth
      {...bind(register, 'rescheduleReason')}
      placeholder="la tienda no mandó los textos"
      helperText={
        (editingTask.rescheduleCount || 0) > 0
          ? `Ya se reprogramó ${editingTask.rescheduleCount} vez/veces. Opcional, pero sin motivo nadie sabe qué la frena.`
          : 'Opcional. Queda en la bitácora: una tarea que se corre siempre es una señal.'
      }
    />
  );
}

/** Bloqueo — sólo cuando el estado es Bloqueada. */
function BlockedSection({
  control,
  register,
}: {
  control: Control<TaskFormValues>;
  register: UseFormRegister<TaskFormValues>;
}) {
  const theme = useTheme();
  const status = useWatch({ control, name: 'status' });
  if (status !== 'blocked') return null;

  return (
    <Stack
      spacing={1.5}
      sx={{
        p: 1.5,
        borderRadius: 2,
        bgcolor: alpha(theme.palette.error.main, 0.06),
        border: `1px solid ${alpha(theme.palette.error.main, 0.25)}`,
      }}
    >
      <Typography
        variant="caption"
        fontWeight={700}
        color="error.main"
      >
        Reportar el bloqueo no es una excusa: es lo que permite destrabarlo a tiempo.
      </Typography>
      <TextField
        label="¿Qué se necesita?"
        size="small"
        fullWidth
        required
        {...bind(register, 'blockedReason')}
        placeholder="falta que la tienda mande los textos definitivos"
      />
      <TextField
        label="¿Quién lo destraba?"
        size="small"
        fullWidth
        required
        {...bind(register, 'blockerOwner')}
        placeholder="Nombre de la persona"
        helperText="Un bloqueo sin nombre no es un bloqueo, es un atraso."
      />
    </Stack>
  );
}

/**
 * Cuándo se empezó y cuándo se cerró. Es lo que la tarea rutinaria nunca dejó
 * ver: se clonaba sola y nadie sabía cuánto tardó de verdad.
 */
function Timeline({ task }: { task: Task }) {
  const theme = useTheme();
  if (!task.startedAt && !task.completedAt) return null;

  const start = task.startedAt ? new Date(task.startedAt) : null;
  const end = task.completedAt ? new Date(task.completedAt) : null;
  const hours = start && end ? (end.getTime() - start.getTime()) / 3_600_000 : null;
  const duracion =
    hours === null
      ? null
      : hours < 1
        ? `${Math.max(1, Math.round(hours * 60))} min`
        : hours < 24
          ? `${hours.toFixed(1)} h`
          : `${Math.round(hours / 24)} d`;

  return (
    <Stack
      direction="row"
      spacing={2}
      sx={{
        px: 1.25,
        py: 0.75,
        borderRadius: 2,
        bgcolor: alpha(theme.palette.text.primary, 0.03),
      }}
    >
      {start && (
        <Box>
          <Typography sx={{ fontSize: 9.5, color: 'text.disabled' }}>EMPEZADA</Typography>
          <Typography sx={{ fontSize: 11.5, fontWeight: 600 }}>{formatDue(task.startedAt)}</Typography>
        </Box>
      )}
      {end && (
        <Box>
          <Typography sx={{ fontSize: 9.5, color: 'text.disabled' }}>CERRADA</Typography>
          <Typography sx={{ fontSize: 11.5, fontWeight: 600 }}>{formatDue(task.completedAt)}</Typography>
        </Box>
      )}
      {duracion && (
        <Box>
          <Typography sx={{ fontSize: 9.5, color: 'text.disabled' }}>TARDÓ</Typography>
          <Typography
            sx={{ fontSize: 11.5, fontWeight: 700 }}
            color="success.main"
          >
            {duracion}
          </Typography>
        </Box>
      )}
    </Stack>
  );
}

/**
 * "A partir de esta plantilla" — el molde ya trae título, criterio de cierre,
 * responsable, tags y la fecha calculada en días hábiles. Prellena y se queda
 * fuera del camino: todo se puede cambiar antes de guardar.
 */
function TemplatePicker({
  setValue,
  onApply,
}: {
  setValue: UseFormSetValue<TaskFormValues>;
  onApply: (tpl: TaskTemplate | null) => void;
}) {
  const theme = useTheme();
  const [applied, setApplied] = useState<TaskTemplate | null>(null);

  const { data: templates = [] } = useQuery({
    queryKey: ['task-templates'],
    queryFn: () => templateService.list(),
    staleTime: 120_000,
  });

  if (!templates.length) return null;

  function apply(tpl: TaskTemplate | null) {
    setApplied(tpl);
    onApply(tpl);
    if (!tpl) return setValue('templateId', '');

    setValue('templateId', tpl._id);
    setValue('title', tpl.title);
    setValue('description', tpl.taskDescription || '');
    setValue('priority', tpl.priority);
    setValue('closureCriteria', tpl.closureCriteria || '');
    setValue('beneficiary', tpl.beneficiary || '');
    setValue('nextStep', tpl.nextStep || '');
    setValue('impact', tpl.impact || '');
    setValue('tags', (tpl.tags || []).join(', '));
    if (tpl.epicId) setValue('epicId', tpl.epicId);
    if (tpl.assigneeId) {
      setValue('assigneeId', tpl.assigneeId);
      setValue('assigneeName', tpl.assigneeName || '');
      setValue('assigneeAvatar', tpl.assigneeAvatar || '');
    }
    if (tpl.nextDueDate) {
      setValue('dueDate', toDateInput(tpl.nextDueDate));
      setValue('dueTime', tpl.dueTime || '');
    }
  }

  return (
    <Box
      sx={{
        p: 1.25,
        borderRadius: 2,
        bgcolor: alpha(theme.palette.primary.main, 0.05),
        border: `1px dashed ${alpha(theme.palette.primary.main, 0.3)}`,
      }}
    >
      <Autocomplete
        size="small"
        options={templates}
        value={applied}
        onChange={(_, v) => apply(v)}
        getOptionLabel={(o) => o.name}
        groupBy={(o) => o.departmentName || 'Sin área'}
        renderOption={(props, o) => (
          <li {...props}>
            <Stack
              direction="row"
              alignItems="center"
              spacing={1}
              width="100%"
            >
              <span>{o.icon}</span>
              <Box flex={1}
minWidth={0}>
                <Typography
                  fontSize={12.5}
                  fontWeight={600}
                  noWrap
                >
                  {o.name}
                </Typography>
                <Typography
                  fontSize={10}
                  color="text.secondary"
                  noWrap
                >
                  {o.title}
                </Typography>
              </Box>
              {o.scheduleEnabled && (
                <Chip
                  label="agendada"
                  size="small"
                  sx={{ height: 15, fontSize: 8.5, fontWeight: 700 }}
                />
              )}
            </Stack>
          </li>
        )}
        renderInput={(params) => (
          <TextField
            {...params}
            label="Empezar desde una plantilla"
            placeholder="Opcional — elegí un molde ya armado"
          />
        )}
      />
      {applied && (
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: 'block', mt: 0.75, fontSize: 10.5 }}
        >
          Rellenado con <b>{applied.name}</b>
          {applied.nextDueDate ? ` · vence ${formatDue(applied.nextDueDate)}` : ''}
          {applied.requiresStore ? ' · esta plantilla pide tienda' : ''}. Cambiá lo que haga falta.
        </Typography>
      )}
    </Box>
  );
}

/**
 * Tienda referenciada. Siempre opcional: soporte e instalación de tablets la
 * necesitan para llevar la cuenta de visitas, pero campo y audiencia también la
 * ponen cuando el trabajo es para una tienda concreta.
 */
function StoreField({
  control,
  setValue,
  highlight = false,
}: {
  control: Control<TaskFormValues>;
  setValue: UseFormSetValue<TaskFormValues>;
  /** La plantilla dijo que este trabajo es de una tienda: se marca, no se frena. */
  highlight?: boolean;
}) {
  const storeId = useWatch({ control, name: 'storeId' });
  const { data: stores = [], isLoading } = useStoresWithoutFilters();

  const selected = useMemo(
    () => stores.find((s: any) => String(s._id || s.id) === storeId) || null,
    [stores, storeId]
  );

  return (
    <Box>
      <Autocomplete
        fullWidth
        size="small"
        options={stores}
        value={selected}
        loading={isLoading}
        onChange={(_, v: any) => {
          setValue('storeId', v ? String(v._id || v.id) : '');
          setValue('storeName', v?.name || '');
        }}
        getOptionLabel={(o: any) => o.name || ''}
        renderOption={(props, o: any) => (
          <li {...props}>
            <Stack
              direction="row"
              alignItems="center"
              spacing={1}
              width="100%"
            >
              <Avatar
                src={o.image}
                variant="rounded"
                sx={{ width: 22, height: 22, fontSize: 10 }}
              >
                {o.name?.[0]}
              </Avatar>
              <Box flex={1}
minWidth={0}>
                <Typography
                  fontSize={12.5}
                  noWrap
                >
                  {o.name}
                </Typography>
                {o.address && (
                  <Typography
                    fontSize={10}
                    color="text.secondary"
                    noWrap
                  >
                    {o.address}
                  </Typography>
                )}
              </Box>
            </Stack>
          </li>
        )}
        renderInput={(params) => (
          <TextField
            {...params}
            label="Tienda"
            placeholder="Opcional — instalación, reparación, visita, campaña de una tienda"
            error={highlight && !storeId}
            helperText={
              highlight && !storeId
                ? 'Esta plantilla es de trabajo en tienda: sin ella no queda el historial de visitas.'
                : 'Referenciarla deja el historial: cuántas veces se ha ido y qué se hizo.'
            }
          />
        )}
      />
      {storeId && <StoreHistoryPanel storeId={storeId} />}
    </Box>
  );
}

/** "Qué se ha hecho en esta tienda" — se responde sin salir de la tarea. */
function StoreHistoryPanel({ storeId }: { storeId: string }) {
  const theme = useTheme();
  const { data, isLoading } = useQuery({
    queryKey: ['store-history', storeId],
    queryFn: () => templateService.storeHistory(storeId),
    staleTime: 60_000,
  });

  if (isLoading) {
    return (
      <Stack
        alignItems="center"
        py={1}
      >
        <CircularProgress size={14} />
      </Stack>
    );
  }
  if (!data || data.total === 0) {
    return (
      <Typography
        variant="caption"
        color="text.disabled"
        sx={{ display: 'block', mt: 0.75, fontSize: 10.5 }}
      >
        Primera tarea registrada para esta tienda.
      </Typography>
    );
  }

  return (
    <Box
      sx={{
        mt: 1,
        p: 1.25,
        borderRadius: 2,
        bgcolor: alpha(theme.palette.info.main, 0.05),
        border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
      }}
    >
      <Stack
        direction="row"
        spacing={1.5}
        mb={0.75}
        flexWrap="wrap"
      >
        <Metric
          value={data.total}
          label="tareas"
        />
        <Metric
          value={data.closed}
          label="cerradas"
        />
        <Metric
          value={data.open}
          label="abiertas"
        />
        {data.lastVisit && (
          <Metric
            value={formatDue(data.lastVisit)}
            label="última vez"
          />
        )}
      </Stack>
      <Stack spacing={0.35}>
        {data.tasks.slice(0, 5).map((t) => (
          <Stack
            key={t._id}
            direction="row"
            spacing={0.75}
            alignItems="center"
          >
            <Typography
              sx={{ fontSize: 9.5, fontFamily: 'monospace', color: 'text.disabled', flexShrink: 0 }}
            >
              {t.identifier}
            </Typography>
            <Typography
              sx={{ fontSize: 11, flex: 1, minWidth: 0 }}
              noWrap
            >
              {t.title}
            </Typography>
            <Typography
              sx={{ fontSize: 9.5, color: 'text.disabled', flexShrink: 0 }}
            >
              {t.completedAt ? formatDue(t.completedAt) : STATUS_LABEL[t.status] || t.status}
            </Typography>
          </Stack>
        ))}
      </Stack>
      {data.total > data.shown && (
        <Typography
          variant="caption"
          color="text.disabled"
          sx={{ fontSize: 10 }}
        >
          …y {data.total - data.shown} más
        </Typography>
      )}
    </Box>
  );
}

function Metric({ value, label }: { value: React.ReactNode; label: string }) {
  return (
    <Box>
      <Typography
        sx={{ fontSize: 13, fontWeight: 800, lineHeight: 1.1 }}
        color="info.main"
      >
        {value}
      </Typography>
      <Typography sx={{ fontSize: 9.5 }}>{label}</Typography>
    </Box>
  );
}

/**
 * Tags con catálogo: se eligen de lo que el equipo YA usa y se pueden escribir
 * nuevos. El catálogo sale de las tareas existentes, así que nunca queda
 * desactualizado ni hay que mantener una lista aparte.
 */
function TagsField({
  control,
  setValue,
}: {
  control: Control<TaskFormValues>;
  setValue: UseFormSetValue<TaskFormValues>;
}) {
  const raw = useWatch({ control, name: 'tags' });
  const { data: catalog = [] } = useQuery({
    queryKey: ['task-tags'],
    queryFn: () => templateService.tags(),
    staleTime: 300_000,
  });

  const value = useMemo(
    () => (raw || '').split(',').map((t) => t.trim()).filter(Boolean),
    [raw]
  );

  return (
    <Autocomplete
      multiple
      freeSolo
      size="small"
      options={catalog.map((c) => c.tag)}
      value={value}
      onChange={(_, v) => setValue('tags', (v as string[]).map((t) => t.trim()).filter(Boolean).join(', '))}
      renderTags={(tags, getTagProps) =>
        tags.map((t, i) => (
          <Chip
            key={t}
            label={t}
            size="small"
            {...getTagProps({ index: i })}
            sx={{ fontSize: 11, fontWeight: 600 }}
          />
        ))
      }
      renderInput={(params) => (
        <TextField
          {...params}
          label="Tags"
          placeholder="Escribí y Enter para uno nuevo"
          InputProps={{
            ...params.InputProps,
            startAdornment: (
              <>
                <InputAdornment position="start">
                  <TagRoundedIcon sx={{ fontSize: 15, opacity: 0.4 }} />
                </InputAdornment>
                {params.InputProps.startAdornment}
              </>
            ),
          }}
        />
      )}
    />
  );
}

/**
 * Épica = etiqueta que agrupa ("Manual de marca", "RCS"). No mueve la tarea de
 * proyecto ni abre otro tablero. Se puede crear escribiendo el nombre: obligar
 * a salir a otra pantalla para crearla es lo que hace que nadie las use.
 */
function EpicField({
  control,
  setValue,
  epics,
  projectId,
}: {
  control: Control<TaskFormValues>;
  setValue: UseFormSetValue<TaskFormValues>;
  epics: Epic[];
  projectId: string | null;
}) {
  const epicId = useWatch({ control, name: 'epicId' });
  const queryClient = useQueryClient();
  const selected = useMemo(() => epics.find((e) => e._id === epicId) || null, [epics, epicId]);

  const { mutate: createEpic, isPending } = useMutation({
    mutationFn: (name: string) =>
      epicService.create({
        name,
        projectId,
        color: EPIC_COLORS[epics.length % EPIC_COLORS.length],
      }),
    onSuccess: (epic) => {
      queryClient.invalidateQueries({ queryKey: ['epics'] });
      setValue('epicId', epic._id);
      toast.success(`Épica “${epic.name}” creada`);
    },
    onError: () => toast.error('No se pudo crear la épica'),
  });

  return (
    <Autocomplete
      fullWidth
      size="small"
      freeSolo
      options={epics}
      value={selected}
      disabled={isPending}
      onChange={(_, v: any) => {
        if (!v) return setValue('epicId', '');
        // Texto libre = épica nueva
        if (typeof v === 'string') return createEpic(v.trim());
        if (v.__create) return createEpic(v.inputValue);
        setValue('epicId', v._id);
      }}
      filterOptions={(options, state) => {
        const q = state.inputValue.trim().toLowerCase();
        const hits = options.filter((o: any) => o.name.toLowerCase().includes(q));
        if (q && !options.some((o: any) => o.name.toLowerCase() === q)) {
          return [...hits, { __create: true, inputValue: state.inputValue, name: state.inputValue } as any];
        }
        return hits;
      }}
      getOptionLabel={(o: any) => (typeof o === 'string' ? o : o.name || '')}
      renderOption={(props, option: any) => (
        <li {...props}>
          {option.__create ? (
            <Typography
              fontSize={12.5}
              fontWeight={600}
              color="primary.main"
            >
              + Crear épica “{option.inputValue}”
            </Typography>
          ) : (
            <Stack
              direction="row"
              alignItems="center"
              spacing={1}
              width="100%"
            >
              <Box sx={{ width: 9, height: 9, borderRadius: '2px', bgcolor: option.color }} />
              <Typography
                fontSize={12.5}
                flex={1}
                noWrap
              >
                {option.name}
              </Typography>
              {option.total > 0 && (
                <Typography
                  fontSize={10}
                  color="text.disabled"
                >
                  {option.done}/{option.total}
                </Typography>
              )}
            </Stack>
          )}
        </li>
      )}
      renderInput={(params) => (
        <TextField
          {...params}
          label="Épica"
          helperText="Opcional. Agrupa tareas de distintas áreas bajo un mismo objetivo."
          InputProps={{
            ...params.InputProps,
            startAdornment: selected ? (
              <Box
                sx={{ width: 9, height: 9, borderRadius: '2px', bgcolor: selected.color, ml: 0.75, mr: 0.25 }}
              />
            ) : undefined,
          }}
        />
      )}
    />
  );
}

function RecurrenceField({ control }: { control: Control<TaskFormValues> }) {
  return (
    <Controller
      control={control}
      name="recurrence"
      render={({ field }) => (
        <TextField
          {...field}
          label="Repetir"
          select
          fullWidth
          size="small"
          helperText={
            field.value !== 'none'
              ? 'Plantilla rutinaria: no sale en el board, se copia sola cada día que toca.'
              : undefined
          }
        >
          {(Object.keys(RECURRENCE_LABEL) as Recurrence[]).map((k) => (
            <MenuItem
              key={k}
              value={k}
            >
              <Stack
                direction="row"
                spacing={1}
                alignItems="center"
              >
                <RepeatRoundedIcon
                  sx={{ fontSize: 15, opacity: k === 'none' ? 0.25 : 1, color: k === 'none' ? undefined : 'primary.main' }}
                />
                <span>{RECURRENCE_LABEL[k]}</span>
              </Stack>
            </MenuItem>
          ))}
        </TextField>
      )}
    />
  );
}

function ProgressField({ control }: { control: Control<TaskFormValues> }) {
  return (
    <Controller
      control={control}
      name="progress"
      render={({ field }) => (
        <Box>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            mb={0.5}
          >
            <Typography
              variant="caption"
              fontWeight={600}
              color="text.secondary"
            >
              Progress
            </Typography>
            <Typography
              variant="caption"
              fontWeight={800}
              color="primary.main"
            >
              {field.value}%
            </Typography>
          </Stack>
          <Slider
            value={field.value}
            onChange={(_, v) => field.onChange(v as number)}
            min={0}
            max={100}
            step={5}
            size="small"
            marks={[
              { value: 0, label: '0' },
              { value: 50, label: '50' },
              { value: 100, label: '100' },
            ]}
            sx={{ '& .MuiSlider-markLabel': { fontSize: 10 } }}
          />
        </Box>
      )}
    />
  );
}

function SubmitBar({
  control,
  editingTask,
  submitting,
  onClose,
}: {
  control: Control<TaskFormValues>;
  editingTask: Task | null;
  submitting: boolean;
  onClose: () => void;
}) {
  const theme = useTheme();
  const [title, assigneeId, dueDate, closureCriteria, recurrence, status, blockedReason, blockerOwner] =
    useWatch({
      control,
      name: [
        'title',
        'assigneeId',
        'dueDate',
        'closureCriteria',
        'recurrence',
        'status',
        'blockedReason',
        'blockerOwner',
      ],
    });

  // Manual de Cowork: sin los 4 campos la tarea entra igual, pero sale marcada
  // como dato incompleto en el reporte diario. Mejor avisarlo aquí.
  const missing = missingTaskFields({
    title: title || '',
    assigneeId: assigneeId || '',
    dueDate: dueDate || '',
    closureCriteria: closureCriteria || '',
    recurrence,
  } as TaskFormState);
  const blockedIncomplete =
    status === 'blocked' && (!blockedReason?.trim() || !blockerOwner?.trim());
  // "Ninguna tarea sin fecha. Ninguna excepción" — sólo las rutinarias se salvan
  const needsDueDate = recurrence === 'none' && !dueDate;

  return (
    <>
      {missing.length > 0 && (
        <Typography
          variant="caption"
          color={needsDueDate ? 'error.main' : 'warning.main'}
          sx={{ flex: 1, minWidth: 200 }}
        >
          {needsDueDate
            ? 'Sin fecha límite no se puede guardar: ninguna tarea sin fecha.'
            : `Falta ${missing.join(', ')} — entra igual, pero saldrá en “datos incompletos”.`}
        </Typography>
      )}
      <Button
        onClick={onClose}
        sx={{ borderRadius: 1.5, textTransform: 'none' }}
      >
        Cancel
      </Button>
      <Button
        variant="contained"
        type="submit"
        disableElevation
        disabled={!title || submitting || blockedIncomplete || needsDueDate}
        sx={{
          fontWeight: 700,
          borderRadius: 1.5,
          textTransform: 'none',
          background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
        }}
      >
        {editingTask ? 'Save Changes' : 'Create Task'}
      </Button>
    </>
  );
}
