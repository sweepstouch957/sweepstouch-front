import { RECURRENCE_LABEL, Task, taskClient, type Recurrence, type TaskFile } from '@/services/task.service';
import { uploadTaskEvidence } from '@/services/upload.service';
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
  missingTaskFields,
  priorityEntries,
  statusEntries,
  titleLacksVerb,
  type TaskFormState,
} from './constants';

type TaskDialogProps = {
  open: boolean;
  editingTask: Task | null;
  form: TaskFormState;
  setForm: React.Dispatch<React.SetStateAction<TaskFormState>>;
  status: string;
  onStatusChange: (s: string) => void;
  teamMembers: any[];
  submitting: boolean;
  onClose: () => void;
  onSubmit: () => void;
};

export function TaskDialog({
  open,
  editingTask,
  form,
  setForm,
  status,
  onStatusChange,
  teamMembers,
  submitting,
  onClose,
  onSubmit,
}: TaskDialogProps) {
  const theme = useTheme();

  const selectedAssignee = useMemo(
    () => teamMembers.find((u: any) => (u.id || u._id) === form.assigneeId),
    [teamMembers, form.assigneeId]
  );

  // Manual de Cowork: sin los 4 campos la tarea entra igual, pero sale marcada
  // como dato incompleto en el reporte diario. Mejor avisarlo aquí.
  const missing = useMemo(() => missingTaskFields(form), [form]);
  const noVerb = titleLacksVerb(form.title);
  const isBlocked = status === 'blocked';
  const blockedIncomplete = isBlocked && (!form.blockedReason.trim() || !form.blockerOwner.trim());
  // "Ninguna tarea sin fecha. Ninguna excepción" — sólo las rutinarias se salvan
  const needsDueDate = form.recurrence === 'none' && !form.dueDate;

  /* ── Evidencias ─────────────────────────────────────────────────────────
     Las evidencias viven en la tarea, no en un chat: el archivo va al servicio
     de upload (igual que el resto del panel) y aquí queda su URL. */
  const [files, setFiles] = useState<TaskFile[]>(editingTask?.files || []);
  const [uploading, setUploading] = useState(false);

  React.useEffect(() => {
    setFiles(editingTask?.files || []);
  }, [editingTask]);

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
      PaperProps={{ sx: { borderRadius: 3, overflow: 'visible' } }}
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
          {/* Title */}
          <TextField
            label="Título"
            fullWidth
            autoFocus
            required
            value={form.title}
            onChange={(e) => { const v = e.target.value; setForm(prev => ({ ...prev, title: v })); }}
            placeholder="Empieza con un verbo: confirmar, enviar, diseñar, llamar…"
            error={noVerb}
            helperText={
              noVerb
                ? 'Empieza con un verbo de acción. "Evento NSA" es un recordatorio; "Confirmar salón para el evento NSA" es una tarea.'
                : undefined
            }
            sx={{ '& .MuiOutlinedInput-root': { fontWeight: 600 } }}
          />

          {/* Description */}
          <TextField
            label="Description"
            fullWidth
            multiline
            rows={3}
            value={form.description}
            onChange={(e) => { const v = e.target.value; setForm(prev => ({ ...prev, description: v })); }}
            placeholder="Add more details…"
          />

          {/* Priority + Status */}
          <Stack
            direction="row"
            spacing={1.5}
          >
            <TextField
              label="Priority"
              select
              fullWidth
              size="small"
              value={form.priority}
              onChange={(e) => { const v = e.target.value; setForm(prev => ({ ...prev, priority: v })); }}
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
            <TextField
              label="Status"
              select
              fullWidth
              size="small"
              value={status}
              onChange={(e) => onStatusChange(e.target.value)}
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
          </Stack>

          {/* Assignee + Due date */}
          <Stack
            direction="row"
            spacing={1.5}
          >
            <Autocomplete
              fullWidth
              size="small"
              options={teamMembers}
              value={selectedAssignee || null}
              onChange={(_, v: any) => {
                if (v) {
                  setForm(prev => ({
                    ...prev,
                    assigneeId: v.id || v._id,
                    assigneeName: `${v.firstName} ${v.lastName || ''}`.trim(),
                    assigneeAvatar: v.profileImage || '',
                  }));
                } else {
                  setForm(prev => ({
                    ...prev,
                    assigneeId: '',
                    assigneeName: '',
                    assigneeAvatar: '',
                  }));
                }
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
                    startAdornment: form.assigneeId ? (
                      <Avatar
                        src={form.assigneeAvatar}
                        sx={{ width: 20, height: 20, mr: 0.5, ml: 0.5, fontSize: 9 }}
                      >
                        {form.assigneeName?.[0]}
                      </Avatar>
                    ) : undefined,
                  }}
                />
              )}
            />
            <TextField
              label="Fecha límite"
              type="date"
              size="small"
              fullWidth
              required={form.recurrence === 'none'}
              disabled={form.recurrence !== 'none'}
              value={form.recurrence !== 'none' ? '' : form.dueDate}
              onChange={(e) => { const v = e.target.value; setForm(prev => ({ ...prev, dueDate: v })); }}
              InputLabelProps={{ shrink: true }}
              error={form.recurrence === 'none' && !form.dueDate}
              helperText={
                form.recurrence !== 'none'
                  ? 'La pone el sistema cada día'
                  : !form.dueDate
                    ? 'Obligatoria. Si no se sabe, pon fecha para DEFINIR la fecha'
                    : 'Si no se sabe, pon fecha para definir la fecha'
              }
            />
          </Stack>

          {/* Criterio de cierre — cuarto campo obligatorio del manual */}
          <TextField
            label="Cierre cuando…"
            fullWidth
            size="small"
            required
            value={form.closureCriteria}
            onChange={(e) => { const v = e.target.value; setForm(prev => ({ ...prev, closureCriteria: v })); }}
            placeholder="exista contrato firmado con el salón y comprobante del depósito"
            helperText="Una línea: cómo sabremos que quedó lista. Es el árbitro cuando se discuta si terminó."
          />

          {/* Bloqueo — sólo cuando el estado es Bloqueada */}
          {isBlocked && (
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
                value={form.blockedReason}
                onChange={(e) => { const v = e.target.value; setForm(prev => ({ ...prev, blockedReason: v })); }}
                placeholder="falta que la tienda mande los textos definitivos"
              />
              <TextField
                label="¿Quién lo destraba?"
                size="small"
                fullWidth
                required
                value={form.blockerOwner}
                onChange={(e) => { const v = e.target.value; setForm(prev => ({ ...prev, blockerOwner: v })); }}
                placeholder="Nombre de la persona"
                helperText="Un bloqueo sin nombre no es un bloqueo, es un atraso."
              />
            </Stack>
          )}

          {/* Rutinaria */}
          <TextField
            label="Repetir"
            select
            fullWidth
            size="small"
            value={form.recurrence}
            onChange={(e) => {
              const v = e.target.value as Recurrence;
              setForm((prev) => ({ ...prev, recurrence: v }));
            }}
            helperText={
              form.recurrence !== 'none'
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

          {/* Tags */}
          <TextField
            label="Tags"
            size="small"
            fullWidth
            value={form.tags}
            onChange={(e) => { const v = e.target.value; setForm(prev => ({ ...prev, tags: v })); }}
            placeholder="frontend, bug, ux  (comma-separated)"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <TagRoundedIcon sx={{ fontSize: 15, opacity: 0.4 }} />
                </InputAdornment>
              ),
            }}
          />

          {/* Progress */}
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
                {form.progress}%
              </Typography>
            </Stack>
            <Slider
              value={form.progress}
              onChange={(_, v) => setForm(prev => ({ ...prev, progress: v as number }))}
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

          {/* AI Context */}
          <TextField
            label="AI Context"
            fullWidth
            multiline
            rows={2}
            size="small"
            value={form.aiContext}
            onChange={(e) => { const v = e.target.value; setForm(prev => ({ ...prev, aiContext: v })); }}
            placeholder="Describe what this task involves so AI can learn your team's work…"
            helperText="AI training context — helps the assistant understand team activities"
          />
        </Stack>
      </DialogContent>

      <DialogActions sx={{ p: 2, gap: 1, flexWrap: 'wrap' }}>
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
          onClick={onSubmit}
          disableElevation
          disabled={!form.title || submitting || blockedIncomplete || needsDueDate}
          sx={{
            fontWeight: 700,
            borderRadius: 1.5,
            textTransform: 'none',
            background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
          }}
        >
          {editingTask ? 'Save Changes' : 'Create Task'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
