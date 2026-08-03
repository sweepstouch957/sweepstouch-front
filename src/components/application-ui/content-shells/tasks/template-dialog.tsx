'use client';

import { type Department } from '@/services/department.service';
import { type Epic } from '@/services/epic.service';
import { type Project } from '@/services/task.service';
import {
  TEMPLATE_ICONS,
  templateService,
  WEEKDAYS,
  type TaskTemplate,
  type TemplateDto,
} from '@/services/template.service';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import EventRepeatRoundedIcon from '@mui/icons-material/EventRepeatRounded';
import StorefrontRoundedIcon from '@mui/icons-material/StorefrontRounded';
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
  MenuItem,
  Stack,
  Switch,
  TextField,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import React, { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { IMPACT_OPTIONS, priorityEntries } from './constants';

const EMPTY: TemplateDto = {
  name: '',
  description: '',
  icon: '📋',
  departmentId: null,
  departmentName: '',
  projectId: null,
  epicId: null,
  title: '',
  taskDescription: '',
  priority: 'medium',
  closureCriteria: '',
  beneficiary: '',
  nextStep: '',
  impact: '',
  tags: [],
  assigneeId: null,
  assigneeName: '',
  assigneeAvatar: '',
  dueInDays: 1,
  dueTime: '',
  requiresStore: false,
  scheduleEnabled: false,
  scheduleDays: [],
};

function toDto(t: TaskTemplate): TemplateDto {
  return {
    name: t.name,
    description: t.description,
    icon: t.icon,
    departmentId: t.departmentId,
    departmentName: t.departmentName,
    projectId: t.projectId,
    epicId: t.epicId,
    title: t.title,
    taskDescription: t.taskDescription,
    priority: t.priority,
    closureCriteria: t.closureCriteria,
    beneficiary: t.beneficiary,
    nextStep: t.nextStep,
    impact: t.impact,
    tags: t.tags || [],
    assigneeId: t.assigneeId,
    assigneeName: t.assigneeName,
    assigneeAvatar: t.assigneeAvatar,
    dueInDays: t.dueInDays,
    dueTime: t.dueTime,
    requiresStore: t.requiresStore,
    scheduleEnabled: t.scheduleEnabled,
    scheduleDays: t.scheduleDays || [],
  };
}

function scheduleLabel(t: TaskTemplate): string {
  if (!t.scheduleEnabled) return '';
  if (!t.scheduleDays?.length) return 'todos los días';
  const days = WEEKDAYS.filter((d) => t.scheduleDays.includes(d.value)).map((d) => d.label);
  return `todos los ${days.join(', ')}`;
}

/**
 * Gestor de plantillas. Una plantilla es el molde de una tarea que se repite:
 * "todos los lunes, Campañas manda el recordatorio de la lista de productos".
 * Cada área arma las suyas y se marcan como suyas (departmentId).
 */
export function TemplateDialog({
  open,
  onClose,
  departments,
  projects,
  epics,
  teamMembers,
}: {
  open: boolean;
  onClose: () => void;
  departments: Department[];
  projects: Project[];
  epics: Epic[];
  teamMembers: any[];
}) {
  const theme = useTheme();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<TaskTemplate | null>(null);
  const [form, setForm] = useState<TemplateDto | null>(null);

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['task-templates'],
    queryFn: () => templateService.list(),
    staleTime: 60_000,
  });

  const { data: tagCatalog = [] } = useQuery({
    queryKey: ['task-tags'],
    queryFn: () => templateService.tags(),
    staleTime: 300_000,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['task-templates'] });
    queryClient.invalidateQueries({ queryKey: ['task-tags'] });
  };

  const { mutate: save, isPending: saving } = useMutation({
    mutationFn: (dto: TemplateDto) =>
      editing ? templateService.update(editing._id, dto) : templateService.create(dto),
    onSuccess: () => {
      invalidate();
      toast.success(editing ? 'Plantilla actualizada' : 'Plantilla creada');
      setForm(null);
      setEditing(null);
    },
    onError: (e: any) => toast.error(e?.response?.data?.error || 'No se pudo guardar'),
  });

  const { mutate: remove } = useMutation({
    mutationFn: (id: string) => templateService.remove(id),
    onSuccess: () => {
      invalidate();
      toast.success('Plantilla desactivada');
    },
  });

  const set = (patch: Partial<TemplateDto>) => setForm((f) => ({ ...(f as TemplateDto), ...patch }));

  const byDept = useMemo(() => {
    const map: Record<string, TaskTemplate[]> = {};
    for (const t of templates) {
      const k = t.departmentName || 'Sin área';
      (map[k] ||= []).push(t);
    }
    return map;
  }, [templates]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{ sx: { borderRadius: 3 } }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Stack
          direction="row"
          alignItems="center"
          spacing={1}
        >
          {form && (
            <IconButton
              size="small"
              onClick={() => {
                setForm(null);
                setEditing(null);
              }}
            >
              <ArrowBackRoundedIcon sx={{ fontSize: 18 }} />
            </IconButton>
          )}
          <Typography
            variant="h6"
            fontWeight={700}
            flex={1}
          >
            {form ? (editing ? 'Editar plantilla' : 'Nueva plantilla') : 'Plantillas de tarea'}
          </Typography>
          {!form && (
            <Button
              size="small"
              variant="contained"
              disableElevation
              startIcon={<AddRoundedIcon sx={{ fontSize: 15 }} />}
              onClick={() => {
                setEditing(null);
                setForm({ ...EMPTY });
              }}
              sx={{ textTransform: 'none', borderRadius: 1.5, fontWeight: 700 }}
            >
              Nueva
            </Button>
          )}
        </Stack>
      </DialogTitle>

      <DialogContent
        dividers
        sx={{ pt: 2 }}
      >
        {/* ── Lista ── */}
        {!form && (
          <>
            {isLoading && (
              <Stack
                alignItems="center"
                py={4}
              >
                <CircularProgress size={22} />
              </Stack>
            )}

            {!isLoading && templates.length === 0 && (
              <Box
                sx={{
                  textAlign: 'center',
                  py: 4,
                  px: 2,
                  borderRadius: 2,
                  border: `1px dashed ${alpha(theme.palette.divider, 0.8)}`,
                }}
              >
                <Typography
                  variant="body2"
                  fontWeight={600}
                  gutterBottom
                >
                  Todavía no hay plantillas
                </Typography>
                <Typography
                  variant="caption"
                  color="text.secondary"
                >
                  Una plantilla es el molde de una tarea que se repite: “todos los lunes, mandar el
                  recordatorio de la lista de productos”. La tarea que sale es normal — se ve en el
                  board y se sabe cuándo se empezó y cuándo se cerró.
                </Typography>
              </Box>
            )}

            {Object.entries(byDept).map(([dept, list]) => (
              <Box
                key={dept}
                mb={2}
              >
                <Typography
                  variant="caption"
                  fontWeight={800}
                  color="text.secondary"
                  sx={{ display: 'block', mb: 0.75, fontSize: 10.5, letterSpacing: 0.5 }}
                >
                  {dept.toUpperCase()}
                </Typography>
                <Stack spacing={0.75}>
                  {list.map((t) => (
                    <Stack
                      key={t._id}
                      direction="row"
                      alignItems="center"
                      spacing={1.25}
                      onClick={() => {
                        setEditing(t);
                        setForm(toDto(t));
                      }}
                      sx={{
                        px: 1.25,
                        py: 1,
                        borderRadius: 2,
                        cursor: 'pointer',
                        border: `1px solid ${alpha(theme.palette.divider, 0.7)}`,
                        '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.05) },
                      }}
                    >
                      <Box sx={{ fontSize: 18 }}>{t.icon}</Box>
                      <Box flex={1}
minWidth={0}>
                        <Typography
                          fontSize={12.5}
                          fontWeight={700}
                          noWrap
                        >
                          {t.name}
                        </Typography>
                        <Typography
                          fontSize={10.5}
                          color="text.secondary"
                          noWrap
                        >
                          {t.title}
                        </Typography>
                      </Box>
                      {t.requiresStore && (
                        <Tooltip
                          title="Pide tienda al crear"
                          arrow
                        >
                          <StorefrontRoundedIcon sx={{ fontSize: 14, color: 'text.disabled' }} />
                        </Tooltip>
                      )}
                      {t.scheduleEnabled && (
                        <Chip
                          icon={<EventRepeatRoundedIcon sx={{ fontSize: '11px !important' }} />}
                          label={scheduleLabel(t)}
                          size="small"
                          color="primary"
                          sx={{ height: 18, fontSize: 9, fontWeight: 700 }}
                        />
                      )}
                      {t.usageCount > 0 && (
                        <Typography
                          fontSize={10}
                          color="text.disabled"
                        >
                          {t.usageCount}×
                        </Typography>
                      )}
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          remove(t._id);
                        }}
                      >
                        <DeleteOutlineRoundedIcon sx={{ fontSize: 15 }} />
                      </IconButton>
                    </Stack>
                  ))}
                </Stack>
              </Box>
            ))}
          </>
        )}

        {/* ── Formulario ── */}
        {form && (
          <Stack spacing={2}>
            <Stack
              direction="row"
              spacing={1.5}
            >
              <TextField
                label="Icono"
                select
                size="small"
                value={form.icon}
                onChange={(e) => set({ icon: e.target.value })}
                sx={{ width: 90 }}
              >
                {TEMPLATE_ICONS.map((i) => (
                  <MenuItem
                    key={i}
                    value={i}
                  >
                    {i}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                label="Nombre de la plantilla"
                size="small"
                fullWidth
                required
                value={form.name}
                onChange={(e) => set({ name: e.target.value })}
                placeholder="Recordatorio semanal de lista de productos"
                helperText="Cómo la busca el equipo, no el título de la tarea"
              />
            </Stack>

            <TextField
              label="Área dueña"
              select
              size="small"
              fullWidth
              value={form.departmentId || ''}
              onChange={(e) => {
                const d = departments.find((x) => x._id === e.target.value);
                set({ departmentId: e.target.value || null, departmentName: d?.name || '' });
              }}
              helperText="“Esta plantilla es de Diseño”, “esta es de Campañas”"
            >
              <MenuItem value="">Sin área</MenuItem>
              {departments.map((d) => (
                <MenuItem
                  key={d._id}
                  value={d._id}
                >
                  <Stack
                    direction="row"
                    alignItems="center"
                    spacing={1}
                  >
                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: d.color }} />
                    <span>{d.name}</span>
                  </Stack>
                </MenuItem>
              ))}
            </TextField>

            <Box sx={{ height: '1px', bgcolor: alpha(theme.palette.divider, 0.8) }} />
            <Typography
              variant="caption"
              fontWeight={800}
              color="text.secondary"
              sx={{ fontSize: 10.5, letterSpacing: 0.5 }}
            >
              LO QUE SE COPIA A LA TAREA
            </Typography>

            <TextField
              label="Título de la tarea"
              size="small"
              fullWidth
              required
              value={form.title}
              onChange={(e) => set({ title: e.target.value })}
              placeholder="Enviar la lista de productos de la semana"
              helperText="Empieza con un verbo: enviar, confirmar, diseñar…"
            />

            <TextField
              label="Descripción"
              size="small"
              fullWidth
              multiline
              rows={2}
              value={form.taskDescription}
              onChange={(e) => set({ taskDescription: e.target.value })}
            />

            <TextField
              label="Cierre cuando…"
              size="small"
              fullWidth
              value={form.closureCriteria}
              onChange={(e) => set({ closureCriteria: e.target.value })}
              placeholder="la lista esté en el drive y confirmada por la tienda"
              helperText="Escrito una vez acá, no lo tiene que inventar nadie cada semana"
            />

            <Stack
              direction="row"
              spacing={1.5}
            >
              <TextField
                label="Prioridad"
                select
                size="small"
                fullWidth
                value={form.priority}
                onChange={(e) => set({ priority: e.target.value as TemplateDto['priority'] })}
              >
                {priorityEntries(theme).map(([k, c]) => (
                  <MenuItem
                    key={k}
                    value={k}
                  >
                    {c.label}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                label="Impacto"
                select
                size="small"
                fullWidth
                value={form.impact || ''}
                onChange={(e) => set({ impact: e.target.value })}
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

            <Stack
              direction="row"
              spacing={1.5}
            >
              <TextField
                label="Vence en (días hábiles)"
                type="number"
                size="small"
                fullWidth
                value={form.dueInDays}
                onChange={(e) => set({ dueInDays: Math.max(0, Number(e.target.value) || 0) })}
                inputProps={{ min: 0, max: 90 }}
                helperText="0 = mismo día"
              />
              <TextField
                label="Hora"
                type="time"
                size="small"
                sx={{ width: 140, flexShrink: 0 }}
                value={form.dueTime}
                onChange={(e) => set({ dueTime: e.target.value })}
                InputLabelProps={{ shrink: true }}
                helperText="Opcional"
              />
            </Stack>

            <Autocomplete
              size="small"
              options={teamMembers}
              value={teamMembers.find((u: any) => (u._id || u.id) === form.assigneeId) || null}
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
                    sx={{ width: 22, height: 22, mr: 1, fontSize: 10 }}
                  >
                    {o.firstName?.[0]}
                  </Avatar>
                  {o.firstName} {o.lastName || ''}
                </li>
              )}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Responsable por defecto"
                  helperText="Opcional — si no, lo elige quien cree la tarea"
                />
              )}
            />

            <Autocomplete
              multiple
              freeSolo
              size="small"
              options={tagCatalog.map((c) => c.tag)}
              value={form.tags || []}
              onChange={(_, v) => set({ tags: (v as string[]).map((t) => t.trim()).filter(Boolean) })}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Tags"
                  placeholder="Escribí y Enter"
                />
              )}
            />

            <Stack
              direction="row"
              spacing={1.5}
            >
              <TextField
                label="Proyecto"
                select
                size="small"
                fullWidth
                value={form.projectId || ''}
                onChange={(e) => set({ projectId: e.target.value || null })}
                helperText="Obligatorio si se agenda sola"
              >
                <MenuItem value="">Sin proyecto</MenuItem>
                {projects.map((p) => (
                  <MenuItem
                    key={p._id}
                    value={p._id}
                  >
                    {p.name}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                label="Épica"
                select
                size="small"
                fullWidth
                value={form.epicId || ''}
                onChange={(e) => set({ epicId: e.target.value || null })}
                helperText="Opcional"
              >
                <MenuItem value="">Sin épica</MenuItem>
                {epics.map((ep) => (
                  <MenuItem
                    key={ep._id}
                    value={ep._id}
                  >
                    {ep.name}
                  </MenuItem>
                ))}
              </TextField>
            </Stack>

            {/* Pide tienda */}
            <Stack
              direction="row"
              alignItems="center"
              spacing={1}
              sx={{
                px: 1.25,
                py: 0.75,
                borderRadius: 2,
                border: `1px solid ${alpha(theme.palette.divider, 0.7)}`,
              }}
            >
              <StorefrontRoundedIcon sx={{ fontSize: 17, color: 'text.secondary' }} />
              <Box flex={1}>
                <Typography
                  fontSize={12}
                  fontWeight={600}
                >
                  Pedir tienda al crear
                </Typography>
                <Typography
                  fontSize={10}
                  color="text.secondary"
                >
                  Instalación de tablets, reparación, visita: así queda el historial por tienda.
                </Typography>
              </Box>
              <Switch
                size="small"
                checked={!!form.requiresStore}
                onChange={(e) => set({ requiresStore: e.target.checked })}
              />
            </Stack>

            {/* Agenda */}
            <Box
              sx={{
                p: 1.25,
                borderRadius: 2,
                border: `1px solid ${alpha(
                  form.scheduleEnabled ? theme.palette.primary.main : theme.palette.divider,
                  form.scheduleEnabled ? 0.35 : 0.7
                )}`,
                bgcolor: form.scheduleEnabled
                  ? alpha(theme.palette.primary.main, 0.04)
                  : 'transparent',
              }}
            >
              <Stack
                direction="row"
                alignItems="center"
                spacing={1}
              >
                <EventRepeatRoundedIcon sx={{ fontSize: 17, color: 'text.secondary' }} />
                <Box flex={1}>
                  <Typography
                    fontSize={12}
                    fontWeight={600}
                  >
                    Crear la tarea sola
                  </Typography>
                  <Typography
                    fontSize={10}
                    color="text.secondary"
                  >
                    Los días marcados aparece en el board a nombre del responsable.
                  </Typography>
                </Box>
                <Switch
                  size="small"
                  checked={!!form.scheduleEnabled}
                  onChange={(e) => set({ scheduleEnabled: e.target.checked })}
                />
              </Stack>

              {form.scheduleEnabled && (
                <>
                  <Stack
                    direction="row"
                    spacing={0.5}
                    mt={1.25}
                    flexWrap="wrap"
                    useFlexGap
                  >
                    {WEEKDAYS.map((d) => {
                      const on = (form.scheduleDays || []).includes(d.value);
                      return (
                        <Chip
                          key={d.value}
                          label={d.label}
                          size="small"
                          onClick={() =>
                            set({
                              scheduleDays: on
                                ? (form.scheduleDays || []).filter((x) => x !== d.value)
                                : [...(form.scheduleDays || []), d.value],
                            })
                          }
                          sx={{
                            height: 24,
                            width: 42,
                            fontSize: 10.5,
                            fontWeight: 700,
                            borderRadius: 1.5,
                            cursor: 'pointer',
                            bgcolor: on ? 'primary.main' : 'transparent',
                            color: on ? 'primary.contrastText' : 'text.secondary',
                            border: `1px solid ${alpha(theme.palette.primary.main, on ? 1 : 0.25)}`,
                          }}
                        />
                      );
                    })}
                  </Stack>
                  {!form.projectId && (
                    <Typography
                      variant="caption"
                      color="error.main"
                      sx={{ display: 'block', mt: 0.75, fontSize: 10.5 }}
                    >
                      Elegí un proyecto: sin él no hay dónde crear la tarea.
                    </Typography>
                  )}
                  {!(form.scheduleDays || []).length && (
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ display: 'block', mt: 0.75, fontSize: 10.5 }}
                    >
                      Sin días marcados se crea todos los días.
                    </Typography>
                  )}
                </>
              )}
            </Box>
          </Stack>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button
          onClick={form ? () => { setForm(null); setEditing(null); } : onClose}
          sx={{ borderRadius: 1.5, textTransform: 'none' }}
        >
          {form ? 'Cancelar' : 'Cerrar'}
        </Button>
        {form && (
          <Button
            variant="contained"
            disableElevation
            disabled={
              saving ||
              !form.name?.trim() ||
              !form.title?.trim() ||
              (!!form.scheduleEnabled && !form.projectId)
            }
            onClick={() => save(form)}
            sx={{ borderRadius: 1.5, textTransform: 'none', fontWeight: 700 }}
          >
            {editing ? 'Guardar' : 'Crear plantilla'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
