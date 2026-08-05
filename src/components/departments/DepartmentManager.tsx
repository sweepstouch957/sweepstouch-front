'use client';

import { FC, useMemo, useState } from 'react';
import { Controller, useForm, useWatch, type Control, type UseFormRegister } from 'react-hook-form';
import {
  alpha,
  Autocomplete,
  Avatar,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  MenuItem,
  Stack,
  TextField,
  Tooltip,
  Typography,
  useTheme } from '@mui/material';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded';
import PaletteRoundedIcon from '@mui/icons-material/PaletteRounded';
import GroupsRoundedIcon from '@mui/icons-material/GroupsRounded';
import AutoFixHighRoundedIcon from '@mui/icons-material/AutoFixHighRounded';
import SyncRoundedIcon from '@mui/icons-material/SyncRounded';
import BadgeRoundedIcon from '@mui/icons-material/BadgeRounded';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  departmentService,
  Department,
  CreateDepartmentDto,
  WORK_TYPE_HINT,
  WORK_TYPE_LABEL,
  WorkType,
} from '@/services/department.service';
import { api } from '@/libs/axios';
import { isInternalStaff } from '@/utils/staff';
import { teamService } from '@/services/team.service';
import toast from 'react-hot-toast';

const PRESET_COLORS = [
  '#E91E63', '#FF9800', '#2196F3', '#9C27B0', '#F44336',
  '#4CAF50', '#00BCD4', '#FF5722', '#607D8B', '#795548',
  '#3F51B5', '#009688', '#CDDC39', '#FFC107', '#673AB7',
];

interface DepartmentManagerProps {
  open: boolean;
  onClose: () => void;
}

const DepartmentManager: FC<DepartmentManagerProps> = ({ open, onClose }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const queryClient = useQueryClient();

  const EMPTY_FORM: CreateDepartmentDto = {
    name: '',
    color: '#5569ff',
    description: '',
    workType: 'project',
    lead: null,
    helpTopics: [],
    metricLabel: '',
    weeklyGoal: 0,
  };

  const [editing, setEditing] = useState<Department | null>(null);
  const [creating, setCreating] = useState(false);
  const { register, control, handleSubmit: rhfHandleSubmit, reset } = useForm<CreateDepartmentDto>({
    defaultValues: EMPTY_FORM,
  });

  const { data: departments = [], isLoading } = useQuery({
    queryKey: ['departments'],
    queryFn: departmentService.list,
    staleTime: 60_000,
  });

  // Staff para elegir encargado de área
  const { data: staff = [] } = useQuery({
    queryKey: ['dept-manager-staff'],
    queryFn: async () => {
      const res = await api.get('/auth/users', {
        params: { lean: 'true', select: 'firstName,lastName,role,position,profileImage,departmentId' },
      });
      const list: any[] = Array.isArray(res.data) ? res.data : res.data?.data ?? [];
      return list.filter(isInternalStaff);
    },
    staleTime: 300_000,
  });

  const staffById = useMemo(() => {
    const map: Record<string, any> = {};
    for (const u of staff) map[u._id || u.id] = u;
    return map;
  }, [staff]);

  const seedMutation = useMutation({
    mutationFn: departmentService.seed,
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      toast.success(`${res.created} creadas · ${res.updated ?? 0} actualizadas`);
    },
  });

  // Organigrama: cuánta gente ya tiene cargo aplicado y quién falta crear
  const { data: org } = useQuery({
    queryKey: ['team-org'],
    queryFn: teamService.org,
    enabled: open,
    staleTime: 60_000,
  });
  const withPosition = useMemo(
    () => (org?.people || []).filter((p) => p.position).length,
    [org]
  );

  /**
   * Paso 1: escribe los cargos del catálogo sobre los usuarios. Sin esto, las
   * Promotions Managers del equipo no se distinguen de las de campo.
   */
  const teamSyncMutation = useMutation({
    mutationFn: () => teamService.sync(true),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['team-org'] });
      queryClient.invalidateQueries({ queryKey: ['dept-board-users'] });
      queryClient.invalidateQueries({ queryKey: ['dept-manager-staff'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success(
        `${res.updated} cargos aplicados${res.notFound.length ? ` · ${res.notFound.length} sin usuario` : ''}`
      );
      if (res.notFound.length) {
        console.info('[team-sync] falta crearlos en la plataforma:', res.notFound);
      }
    },
    onError: (err: any) => toast.error(err?.response?.data?.error || 'No se pudieron aplicar los cargos'),
  });

  const syncLeadsMutation = useMutation({
    mutationFn: departmentService.syncLeads,
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      toast.success(`${res.assigned.length} encargados asignados`);
      if (res.skipped.length) {
        console.info('[departments] sin asignar:', res.skipped);
      }
    },
    onError: (err: any) => toast.error(err?.response?.data?.error || 'No se pudo sincronizar'),
  });

  const createMutation = useMutation({
    mutationFn: (dto: CreateDepartmentDto) => departmentService.create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      toast.success('Área creada');
      setCreating(false);
      reset(EMPTY_FORM);
    },
    onError: (err: any) => toast.error(err?.response?.data?.error || 'Error'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: Partial<CreateDepartmentDto> }) =>
      departmentService.update(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      toast.success('Área actualizada');
      setEditing(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => departmentService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      toast.success('Área desactivada');
    },
  });

  const handleSave = rhfHandleSubmit((values) => {
    if (editing) {
      updateMutation.mutate({ id: editing._id, dto: values });
    } else {
      createMutation.mutate(values);
    }
  });

  const handleStartEdit = (dept: Department) => {
    setEditing(dept);
    setCreating(true);
    reset({
      name: dept.name,
      color: dept.color,
      description: dept.description,
      workType: dept.workType || 'project',
      lead: dept.lead || null,
      helpTopics: dept.helpTopics || [],
      metricLabel: dept.metricLabel || '',
      weeklyGoal: dept.weeklyGoal || 0,
    });
  };

  const handleCancel = () => {
    setEditing(null);
    setCreating(false);
    reset(EMPTY_FORM);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
        },
      }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, pb: 1 }}>
        <GroupsRoundedIcon color="primary" />
        <Typography variant="h6" fontWeight={700} flex={1}>
          Áreas y equipo
        </Typography>
      </DialogTitle>
      <Divider />
      <DialogContent sx={{ p: 0 }}>
        {/* ─── Sincronización con el catálogo del equipo ─── */}
        <Box
          sx={{
            px: 2.5,
            py: 1.75,
            bgcolor: alpha(theme.palette.primary.main, isDark ? 0.08 : 0.04),
            borderBottom: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
          }}
        >
          <Stack direction="row" alignItems="center" spacing={1} mb={0.5}>
            <SyncRoundedIcon sx={{ fontSize: 16, color: 'primary.main' }} />
            <Typography fontWeight={700} fontSize={13}>
              Sincronización
            </Typography>
          </Stack>
          <Typography fontSize={11} color="text.secondary" mb={1.25}>
            Corre los tres en orden la primera vez. Sin el paso 1 nadie tiene cargo, y
            las Promotions Managers del equipo no aparecen en el tablero.
          </Typography>

          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Tooltip title="Escribe cargo, área, jefe y descripción sobre cada persona del catálogo" arrow>
              <Button
                size="small"
                variant="contained"
                disableElevation
                startIcon={<BadgeRoundedIcon />}
                onClick={() => teamSyncMutation.mutate()}
                disabled={teamSyncMutation.isPending}
                sx={{ borderRadius: 1.5, textTransform: 'none' }}
              >
                1 · Cargos del equipo
              </Button>
            </Tooltip>
            <Tooltip title="Crea/actualiza las áreas reales de la empresa (RCS no: es un proyecto)" arrow>
              <Button
                size="small"
                variant="outlined"
                onClick={() => seedMutation.mutate()}
                disabled={seedMutation.isPending}
                sx={{ borderRadius: 1.5, textTransform: 'none' }}
              >
                2 · Áreas
              </Button>
            </Tooltip>
            <Tooltip title="Asigna el encargado de cada área. Es a quien el bot manda cuando alguien pide ayuda" arrow>
              <Button
                size="small"
                variant="outlined"
                startIcon={<AutoFixHighRoundedIcon />}
                onClick={() => syncLeadsMutation.mutate()}
                disabled={syncLeadsMutation.isPending || departments.length === 0}
                sx={{ borderRadius: 1.5, textTransform: 'none' }}
              >
                3 · Encargados
              </Button>
            </Tooltip>
          </Stack>

          {/* Estado: cuánta gente ya tiene cargo y quién falta */}
          {org && (
            <Stack direction="row" spacing={0.75} mt={1.25} flexWrap="wrap" useFlexGap>
              <Chip
                size="small"
                label={`${withPosition} con cargo`}
                sx={{ height: 20, fontSize: 10, fontWeight: 700 }}
                color={withPosition > 0 ? 'success' : 'default'}
                variant="outlined"
              />
              {org.missing.length > 0 && (
                <Tooltip
                  arrow
                  title={org.missing.map((m) => `${m.name} — ${m.position}`).join(' · ')}
                >
                  <Chip
                    size="small"
                    color="warning"
                    variant="outlined"
                    label={`${org.missing.length} sin usuario en la plataforma`}
                    sx={{ height: 20, fontSize: 10, fontWeight: 700 }}
                  />
                </Tooltip>
              )}
            </Stack>
          )}
        </Box>
        {/* ─── Department List ─── */}
        <List dense disablePadding>
          {departments.map((dept) => (
            <ListItem
              key={dept._id}
              sx={{
                px: 2.5,
                py: 1.2,
                borderBottom: `1px solid ${alpha(theme.palette.divider, 0.06)}`,
                '&:hover': { bgcolor: alpha(dept.color, 0.04) },
              }}
              secondaryAction={
                <Stack direction="row" spacing={0.5}>
                  <Tooltip title="Edit" arrow>
                    <IconButton size="small" onClick={() => handleStartEdit(dept)}>
                      <EditRoundedIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete" arrow>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => deleteMutation.mutate(dept._id)}
                    >
                      <DeleteRoundedIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  </Tooltip>
                </Stack>
              }
            >
              <ListItemIcon sx={{ minWidth: 40 }}>
                <Avatar
                  sx={{
                    width: 32,
                    height: 32,
                    bgcolor: alpha(dept.color, 0.15),
                    color: dept.color,
                    fontSize: 14,
                    fontWeight: 700,
                  }}
                >
                  {dept.name[0]}
                </Avatar>
              </ListItemIcon>
              <ListItemText
                primary={
                  <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap">
                    <Typography fontWeight={600} fontSize={13}>
                      {dept.name}
                    </Typography>
                    <Chip
                      label={WORK_TYPE_LABEL[dept.workType || 'project']}
                      size="small"
                      sx={{
                        height: 16,
                        fontSize: 9,
                        fontWeight: 700,
                        bgcolor: alpha(dept.color, 0.12),
                        color: dept.color,
                        '& .MuiChip-label': { px: 0.6 },
                      }}
                    />
                    <Box
                      sx={{
                        width: 10,
                        height: 10,
                        borderRadius: '50%',
                        bgcolor: dept.color,
                        border: `2px solid ${alpha(dept.color, 0.3)}`,
                      }}
                    />
                  </Stack>
                }
                secondary={
                  <>
                    {dept.leadName ? `Encargado: ${dept.leadName}` : '⚠️ Sin encargado asignado'}
                    {dept.description ? ` · ${dept.description}` : ''}
                  </>
                }
                secondaryTypographyProps={{ fontSize: 11, color: dept.leadName ? 'text.disabled' : 'warning.main' }}
              />
            </ListItem>
          ))}
          {departments.length === 0 && !isLoading && (
            <Box py={4} textAlign="center">
              <Typography variant="body2" color="text.secondary">
                Todavía no hay áreas. Usa "Sincronizar áreas" para cargar las de la empresa.
              </Typography>
            </Box>
          )}
        </List>

        {/* ─── Create / Edit Form ─── */}
        {creating ? (
          <Box px={2.5} py={2} sx={{ bgcolor: isDark ? alpha('#000', 0.2) : alpha('#000', 0.02) }}>
            <Typography variant="subtitle2" fontWeight={700} mb={1.5}>
              {editing ? `Editar: ${editing.name}` : 'Nueva área'}
            </Typography>
            <Stack spacing={1.5}>
              <TextField
                label="Nombre"
                size="small"
                {...rhf(register, 'name')}
                fullWidth
              />
              <TextField
                label="Descripción"
                size="small"
                {...rhf(register, 'description')}
                fullWidth
                multiline
                rows={2}
              />

              {/* Encargado del área — es a quien el bot manda cuando alguien pide ayuda */}
              <Controller
                control={control}
                name="lead"
                render={({ field }) => (
              <Autocomplete
                size="small"
                options={staff}
                value={field.value ? staffById[field.value] || null : null}
                onChange={(_, v: any) => field.onChange(v ? v._id || v.id : null)}
                getOptionLabel={(o: any) => `${o.firstName || ''} ${o.lastName || ''}`.trim()}
                renderOption={(props, option: any) => (
                  <li {...props}>
                    <Avatar src={option.profileImage} sx={{ width: 22, height: 22, mr: 1, fontSize: 10 }}>
                      {option.firstName?.[0]}
                    </Avatar>
                    <Box>
                      <Typography fontSize={12} fontWeight={600}>
                        {option.firstName} {option.lastName || ''}
                      </Typography>
                      {option.position && (
                        <Typography fontSize={10} color="text.secondary">
                          {option.position}
                        </Typography>
                      )}
                    </Box>
                  </li>
                )}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Encargado del área"
                    helperText="El bot da su nombre y contacto cuando alguien escribe pidiendo ayuda de esta área."
                  />
                )}
              />
                )}
              />

              {/* Tipo de trabajo — decide cómo se mide el área en el reporte diario */}
              <WorkTypeFields control={control} register={register} />

              {/* Temas: las palabras con las que la gente llega a esta área por WhatsApp */}
              <Controller
                control={control}
                name="helpTopics"
                render={({ field }) => (
              <Autocomplete
                multiple
                freeSolo
                size="small"
                options={[]}
                value={field.value || []}
                onChange={(_, v) => field.onChange(v as string[])}
                renderTags={(value: readonly string[], getTagProps) =>
                  value.map((option, index) => (
                    <Chip label={option} size="small" {...getTagProps({ index })} key={option} />
                  ))
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Temas que llegan a esta área"
                    placeholder="tablet, kiosko, no funciona…"
                    helperText='Si alguien escribe "no me carga el dashboard", el bot lo manda al área cuyo tema coincida.'
                  />
                )}
              />
                )}
              />
              <Box>
                <Typography variant="caption" fontWeight={600} color="text.secondary" mb={0.5} display="block">
                  <PaletteRoundedIcon sx={{ fontSize: 14, mr: 0.5, verticalAlign: 'middle' }} />
                  Color
                </Typography>
                <Controller
                  control={control}
                  name="color"
                  render={({ field }) => (
                    <Stack direction="row" flexWrap="wrap" gap={0.5}>
                      {PRESET_COLORS.map((c) => (
                        <Box
                          key={c}
                          onClick={() => field.onChange(c)}
                          sx={{
                            width: 24,
                            height: 24,
                            borderRadius: 1,
                            bgcolor: c,
                            cursor: 'pointer',
                            border: field.value === c ? `3px solid ${theme.palette.background.paper}` : '3px solid transparent',
                            boxShadow: field.value === c ? `0 0 0 2px ${c}` : 'none',
                            transition: 'all 0.15s',
                            '&:hover': { transform: 'scale(1.2)' },
                          }}
                        />
                      ))}
                    </Stack>
                  )}
                />
              </Box>
              <Stack direction="row" spacing={1} justifyContent="flex-end">
                <Button size="small" onClick={handleCancel}>Cancelar</Button>
                <SaveDepartmentButton
                  control={control}
                  onClick={handleSave}
                  saving={createMutation.isPending || updateMutation.isPending}
                  isEdit={!!editing}
                />
              </Stack>
            </Stack>
          </Box>
        ) : (
          <Box px={2.5} py={1.5}>
            <Button
              startIcon={<AddRoundedIcon />}
              size="small"
              onClick={() => setCreating(true)}
              sx={{ borderRadius: 1.5 }}
            >
              Agregar área
            </Button>
          </Box>
        )}
      </DialogContent>
      <Divider />
      <DialogActions sx={{ px: 2, py: 1.5 }}>
        <Button onClick={onClose} size="small" sx={{ borderRadius: 1.5 }}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DepartmentManager;


/* ══════════════════════════════════════════════════════════════════
   Trozos del formulario suscritos con `useWatch`: escribir un campo
   no repinta la lista de áreas ni el resto del diálogo.
   ══════════════════════════════════════════════════════════════════ */

/** MUI espera el ref del input en `inputRef`, no en `ref`. */
function rhf(register: UseFormRegister<CreateDepartmentDto>, name: keyof CreateDepartmentDto) {
  const { ref, ...rest } = register(name);
  return { inputRef: ref, ...rest };
}

/** El tipo de trabajo decide si se piden meta y número a reportar. */
function WorkTypeFields({
  control,
  register,
}: {
  control: Control<CreateDepartmentDto>;
  register: UseFormRegister<CreateDepartmentDto>;
}) {
  const workType = (useWatch({ control, name: 'workType' }) || 'project') as WorkType;

  return (
    <>
      <Controller
        control={control}
        name="workType"
        render={({ field }) => (
          <TextField
            {...field}
            value={field.value || 'project'}
            label="Tipo de trabajo"
            select
            size="small"
            fullWidth
            helperText={WORK_TYPE_HINT[workType]}
          >
            {(Object.keys(WORK_TYPE_LABEL) as WorkType[]).map((k) => (
              <MenuItem key={k} value={k}>
                {WORK_TYPE_LABEL[k]}
              </MenuItem>
            ))}
          </TextField>
        )}
      />

      {/* Sólo áreas recurrentes: qué número se reporta y contra qué meta */}
      {workType === 'recurring' && (
        <Stack direction="row" spacing={1.5}>
          <TextField
            label="Número que se reporta"
            size="small"
            fullWidth
            {...rhf(register, 'metricLabel')}
            placeholder="Contactos netos incorporados"
          />
          <TextField
            label="Meta semanal"
            size="small"
            type="number"
            sx={{ width: 140 }}
            {...register('weeklyGoal', { valueAsNumber: true })}
          />
        </Stack>
      )}
    </>
  );
}

function SaveDepartmentButton({
  control,
  onClick,
  saving,
  isEdit,
}: {
  control: Control<CreateDepartmentDto>;
  onClick: () => void;
  saving: boolean;
  isEdit: boolean;
}) {
  const name = useWatch({ control, name: 'name' });

  return (
    <Button
      size="small"
      variant="contained"
      onClick={onClick}
      disabled={!name?.trim() || saving}
      disableElevation
      sx={{ borderRadius: 1.5 }}
    >
      {isEdit ? 'Guardar' : 'Crear'}
    </Button>
  );
}
