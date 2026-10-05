'use client';

import { useDebouncedValue } from '@/hooks/useDebounceValue';
import type {
  CalendarEvent,
  EventPayload,
  EventStatus,
  EventStore,
  EventType,
} from '@/services/calendar.service';
import { getStores } from '@/services/store.service';
import { uploadTaskEvidence } from '@/services/upload.service';
import AddPhotoAlternateRoundedIcon from '@mui/icons-material/AddPhotoAlternateRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import {
  alpha,
  Autocomplete,
  Box,
  Button,
  Checkbox,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  IconButton,
  MenuItem,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  useTheme,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import React, { useMemo, useState } from 'react';
import { Controller, useForm, useWatch, type Control } from 'react-hook-form';
import toast from 'react-hot-toast';
import { EVENT_TYPES, STATUS_LABEL, todayKey, TYPE_KEYS } from './constants';

export interface StaffOption {
  id: string;
  name: string;
  departmentId?: string | null;
}

interface Props {
  editing: CalendarEvent | null;
  /** Día preseleccionado al crear desde la grilla. */
  initialDate?: string;
  me: StaffOption | null;
  staff: StaffOption[];
  departmentName: (id?: string | null) => string;
  saving: boolean;
  onClose: () => void;
  onSubmit: (payload: EventPayload) => void;
}

type FormValues = {
  title: string;
  type: EventType;
  multi: boolean;
  date: string;
  endDate: string;
  startTime: string;
  endTime: string;
  status: EventStatus;
  description: string;
  stores: EventStore[];
  extraUserIds: string[];
  cancelReason: string;
  numbers: string;
  reportNote: string;
  evidence: string[];
  notify: boolean;
};

/** Dirección siempre se entera (mismo criterio que el backend). */
const esDireccion = (name: string) =>
  /^(juan carlos|carolina reyes)\b/i.test(name.normalize('NFD').replace(/[̀-ͯ]/g, '').trim());

/* ── Subcomponentes que observan un campo (así el form grande no repinta por tecla) ── */

function DateFields({ control }: { control: Control<FormValues> }) {
  const multi = useWatch({ control, name: 'multi' });
  const date = useWatch({ control, name: 'date' });
  const endDate = useWatch({ control, name: 'endDate' });
  const days =
    multi && date && endDate && endDate > date
      ? Math.round((new Date(endDate).getTime() - new Date(date).getTime()) / 864e5) + 1
      : 0;
  return (
    <Stack
      spacing={0.75}
      sx={{ gridColumn: '1 / -1' }}
    >
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        flexWrap="wrap"
        gap={1}
      >
        <Typography sx={{ fontSize: 12, fontWeight: 600, color: 'text.secondary' }}>
          Fecha *
        </Typography>
        <Controller
          control={control}
          name="multi"
          render={({ field }) => (
            <ToggleButtonGroup
              size="small"
              exclusive
              value={field.value ? 'multi' : 'one'}
              onChange={(_, v) => v && field.onChange(v === 'multi')}
            >
              <ToggleButton value="one">Un día</ToggleButton>
              <ToggleButton value="multi">Varios días</ToggleButton>
            </ToggleButtonGroup>
          )}
        />
      </Stack>
      <Stack
        direction="row"
        gap={1.25}
        flexWrap="wrap"
      >
        <Controller
          control={control}
          name="date"
          rules={{ required: true }}
          render={({ field }) => (
            <TextField
              {...field}
              type="date"
              size="small"
              label={multi ? 'Desde' : 'Día'}
              InputLabelProps={{ shrink: true }}
              sx={{ flex: '1 1 160px' }}
            />
          )}
        />
        {multi && (
          <Controller
            control={control}
            name="endDate"
            render={({ field }) => (
              <TextField
                {...field}
                type="date"
                size="small"
                label="Hasta"
                InputLabelProps={{ shrink: true }}
                inputProps={{ min: date }}
                sx={{ flex: '1 1 160px' }}
              />
            )}
          />
        )}
      </Stack>
      {days > 0 && (
        <Typography
          variant="caption"
          color="text.secondary"
        >
          Duración: {days} días
        </Typography>
      )}
    </Stack>
  );
}

function StatusSections({
  control,
  evidence,
  onEvidence,
}: {
  control: Control<FormValues>;
  evidence: string[];
  onEvidence: (urls: string[]) => void;
}) {
  const theme = useTheme();
  const status = useWatch({ control, name: 'status' });
  const [uploading, setUploading] = useState(false);

  const onFiles = async (ev: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(ev.target.files || []);
    ev.target.value = '';
    if (!files.length) return;
    setUploading(true);
    try {
      const urls = await Promise.all(files.map(uploadTaskEvidence));
      onEvidence([...evidence, ...urls]);
    } catch {
      toast.error('No se pudo subir la evidencia');
    } finally {
      setUploading(false);
    }
  };

  if (status === 'cancelado') {
    return (
      <Controller
        control={control}
        name="cancelReason"
        rules={{ required: true }}
        render={({ field, fieldState }) => (
          <TextField
            {...field}
            label="Motivo de la cancelación *"
            multiline
            minRows={2}
            size="small"
            color="error"
            error={!!fieldState.error}
            helperText={fieldState.error ? 'Indica por qué se canceló' : ''}
            sx={{ gridColumn: '1 / -1' }}
          />
        )}
      />
    );
  }
  if (status === 'finalizado') {
    return (
      <Box
        sx={{
          gridColumn: '1 / -1',
          p: 1.75,
          borderRadius: 2.5,
          bgcolor: alpha(theme.palette.success.main, 0.07),
          border: `1px solid ${alpha(theme.palette.success.main, 0.3)}`,
        }}
      >
        <Typography sx={{ fontSize: 15, fontWeight: 700, color: 'success.dark' }}>
          Reporte del evento
        </Typography>
        <Typography
          variant="caption"
          color="text.secondary"
        >
          Se adjunta al evento y se puede descargar.
        </Typography>
        <Stack
          spacing={1.5}
          sx={{ mt: 1.5 }}
        >
          <Controller
            control={control}
            name="numbers"
            rules={{ required: true, min: 0 }}
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                type="number"
                size="small"
                label="Números registrados en el evento *"
                inputProps={{ min: 0, step: 1 }}
                error={!!fieldState.error}
              />
            )}
          />
          <Controller
            control={control}
            name="reportNote"
            render={({ field }) => (
              <TextField
                {...field}
                size="small"
                label="Resultados / observaciones"
                multiline
                minRows={3}
                placeholder="Cómo resultó, premios entregados, participación, incidencias…"
              />
            )}
          />
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
          >
            <Typography sx={{ fontSize: 12, fontWeight: 600, color: 'text.secondary' }}>
              Evidencias ·{' '}
              {evidence.length
                ? `${evidence.length} foto${evidence.length === 1 ? '' : 's'}`
                : 'ninguna'}
            </Typography>
            <Button
              component="label"
              size="small"
              variant="outlined"
              color="success"
              startIcon={<AddPhotoAlternateRoundedIcon />}
              disabled={uploading}
            >
              {uploading ? 'Subiendo…' : evidence.length ? '+ Agregar más' : '+ Agregar fotos'}
              <input
                type="file"
                accept="image/*"
                multiple
                hidden
                onChange={onFiles}
              />
            </Button>
          </Stack>
          {evidence.length > 0 && (
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(88px,1fr))',
                gap: 1,
              }}
            >
              {evidence.map((u, k) => (
                <Box
                  key={u}
                  sx={{
                    position: 'relative',
                    aspectRatio: '1',
                    borderRadius: 2,
                    overflow: 'hidden',
                    border: 1,
                    borderColor: 'divider',
                  }}
                >
                  <Box
                    component="img"
                    src={u}
                    alt=""
                    sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  />
                  <IconButton
                    size="small"
                    onClick={() => onEvidence(evidence.filter((_, j) => j !== k))}
                    sx={{
                      position: 'absolute',
                      top: 4,
                      right: 4,
                      bgcolor: alpha(theme.palette.common.black, 0.7),
                      color: 'common.white',
                      '&:hover': { bgcolor: 'common.black' },
                    }}
                  >
                    <CloseRoundedIcon sx={{ fontSize: 14 }} />
                  </IconButton>
                </Box>
              ))}
            </Box>
          )}
        </Stack>
      </Box>
    );
  }
  return null;
}

function StoresField({ control }: { control: Control<FormValues> }) {
  const [input, setInput] = useState('');
  const q = useDebouncedValue(input, 300);
  const { data, isFetching } = useQuery({
    queryKey: ['stores', 'calendar-search', q],
    queryFn: () => getStores({ search: q, limit: 20, status: 'active' }),
    staleTime: 60_000,
    enabled: q.length >= 2,
  });
  const options: EventStore[] = useMemo(
    () =>
      (data?.data || []).map((s) => ({
        storeId: s._id,
        storeName: s.name,
        storeAddress: s.address || '',
        contact: s.phoneNumber || '',
        confirmed: false,
      })),
    [data]
  );
  return (
    <Controller
      control={control}
      name="stores"
      render={({ field }) => (
        <Stack
          spacing={1}
          sx={{ gridColumn: '1 / -1' }}
        >
          <Autocomplete
            multiple
            size="small"
            options={options}
            value={field.value}
            loading={isFetching}
            filterOptions={(x) => x}
            isOptionEqualToValue={(a, b) =>
              (a.storeId || a.storeName) === (b.storeId || b.storeName)
            }
            getOptionLabel={(o) => o.storeName}
            inputValue={input}
            onInputChange={(_, v, reason) => reason !== 'reset' && setInput(v)}
            onChange={(_, v) => field.onChange(v)}
            renderTags={() => null}
            renderOption={(props, o) => (
              <li
                {...props}
                key={o.storeId || o.storeName}
              >
                <Box>
                  <Typography sx={{ fontSize: 13, fontWeight: 600 }}>{o.storeName}</Typography>
                  <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>
                    {o.storeAddress}
                  </Typography>
                </Box>
              </li>
            )}
            renderInput={(p) => (
              <TextField
                {...p}
                label="Tiendas participantes"
                placeholder="Buscar tienda por nombre o ciudad…"
                helperText={
                  q.length < 2 && !field.value.length ? 'Escribe al menos 2 letras para buscar' : ''
                }
              />
            )}
          />
          {field.value.length > 0 && (
            <Box
              sx={{
                border: 1,
                borderColor: 'divider',
                borderRadius: 2,
                maxHeight: 220,
                overflow: 'auto',
              }}
            >
              {field.value.map((s, i) => (
                <Stack
                  key={s.storeId || s.storeName}
                  direction="row"
                  alignItems="center"
                  gap={1}
                  sx={{
                    px: 1.25,
                    py: 0.75,
                    borderBottom: i < field.value.length - 1 ? 1 : 0,
                    borderColor: 'divider',
                  }}
                >
                  <Checkbox
                    size="small"
                    color="success"
                    checked={s.confirmed}
                    onChange={(_, c) =>
                      field.onChange(
                        field.value.map((x, j) => (j === i ? { ...x, confirmed: c } : x))
                      )
                    }
                  />
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Typography sx={{ fontSize: 13, fontWeight: 600 }}>{s.storeName}</Typography>
                    <Typography
                      noWrap
                      sx={{ fontSize: 11, color: 'text.secondary' }}
                    >
                      {[s.storeAddress, s.contact].filter(Boolean).join(' · ') ||
                        'Sin contacto registrado'}
                    </Typography>
                  </Box>
                  <Typography
                    sx={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: s.confirmed ? 'success.main' : 'warning.main',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {s.confirmed ? 'Confirmada' : 'Pendiente'}
                  </Typography>
                  <IconButton
                    size="small"
                    onClick={() => field.onChange(field.value.filter((_, j) => j !== i))}
                  >
                    <CloseRoundedIcon fontSize="small" />
                  </IconButton>
                </Stack>
              ))}
            </Box>
          )}
        </Stack>
      )}
    />
  );
}

function PeopleField({
  control,
  me,
  staff,
  departmentName,
}: {
  control: Control<FormValues>;
  me: StaffOption | null;
  staff: StaffOption[];
  departmentName: (id?: string | null) => string;
}) {
  const extra = useWatch({ control, name: 'extraUserIds' });
  const preview = useMemo(() => {
    const ids = new Set<string>();
    const out: { name: string; why: string }[] = [];
    const add = (p: StaffOption | undefined, why: string) => {
      if (p && !ids.has(p.id)) {
        ids.add(p.id);
        out.push({ name: p.name, why });
      }
    };
    add(me || undefined, 'lo lleva');
    if (me?.departmentId)
      for (const p of staff)
        if (p.departmentId === me.departmentId)
          add(p, departmentName(me.departmentId) || 'su área');
    for (const p of staff) if (esDireccion(p.name)) add(p, 'Dirección');
    for (const id of extra)
      add(
        staff.find((p) => p.id === id),
        'sumado'
      );
    return out;
  }, [me, staff, extra, departmentName]);

  return (
    <Stack
      spacing={1}
      sx={{ gridColumn: '1 / -1' }}
    >
      <Controller
        control={control}
        name="extraUserIds"
        render={({ field }) => (
          <Autocomplete
            multiple
            size="small"
            options={staff}
            getOptionLabel={(o) => o.name}
            value={staff.filter((p) => field.value.includes(p.id))}
            onChange={(_, v) => field.onChange(v.map((p) => p.id))}
            renderInput={(p) => (
              <TextField
                {...p}
                label="Sumar personas"
                placeholder="Además del área y Dirección…"
              />
            )}
          />
        )}
      />
      <Box>
        <Typography
          variant="caption"
          color="text.secondary"
        >
          Se avisará por WhatsApp y correo a:
        </Typography>
        <Stack
          direction="row"
          flexWrap="wrap"
          gap={0.5}
          sx={{ mt: 0.5 }}
        >
          {preview.map((p) => (
            <Chip
              key={p.name}
              size="small"
              label={`${p.name} · ${p.why}`}
              variant="outlined"
            />
          ))}
          {!preview.length && (
            <Typography variant="caption">
              Nadie todavía: elige quién lo lleva o suma personas.
            </Typography>
          )}
        </Stack>
      </Box>
    </Stack>
  );
}

/* ── Diálogo ── */

export function EventDialog({
  editing,
  initialDate,
  me,
  staff,
  departmentName,
  saving,
  onClose,
  onSubmit,
}: Props) {
  const { control, register, handleSubmit, setValue, watch } = useForm<FormValues>({
    defaultValues: editing
      ? {
          title: editing.title,
          type: editing.type,
          multi: !!editing.endDate && editing.endDate > editing.date,
          date: editing.date,
          endDate: editing.endDate || '',
          startTime: editing.startTime || '',
          endTime: editing.endTime || '',
          status: editing.status,
          description: editing.description || '',
          stores: editing.stores || [],
          extraUserIds: editing.extraUserIds || [],
          cancelReason: editing.cancelReason || '',
          numbers: editing.report?.numbers != null ? String(editing.report.numbers) : '',
          reportNote: editing.report?.note || '',
          evidence: editing.report?.evidence || [],
          notify: true,
        }
      : {
          title: '',
          type: 'activacion',
          multi: false,
          date: initialDate || todayKey(),
          endDate: '',
          startTime: '',
          endTime: '',
          status: 'por_confirmar',
          description: '',
          stores: [],
          extraUserIds: [],
          cancelReason: '',
          numbers: '',
          reportNote: '',
          evidence: [],
          notify: true,
        },
  });
  const evidence = watch('evidence');

  const submit = (v: FormValues) => {
    if (v.multi && v.endDate && v.endDate <= v.date)
      return toast.error('La fecha final debe ser después de la inicial.');
    if (v.startTime && v.endTime && v.endTime <= v.startTime && !v.multi)
      return toast.error('La hora de fin debe ser después del inicio.');
    onSubmit({
      title: v.title.trim(),
      type: v.type,
      date: v.date,
      endDate: v.multi ? v.endDate : '',
      startTime: v.startTime,
      endTime: v.endTime,
      status: v.status,
      description: v.description.trim(),
      stores: v.stores,
      extraUserIds: v.extraUserIds,
      cancelReason: v.status === 'cancelado' ? v.cancelReason.trim() : '',
      report:
        v.status === 'finalizado'
          ? {
              numbers: v.numbers === '' ? null : Math.round(Number(v.numbers)),
              note: v.reportNote.trim(),
              evidence: v.evidence,
            }
          : undefined,
      ownerId: editing?.ownerId ?? me?.id ?? null,
      ownerName: editing?.ownerName || me?.name || '',
      notify: v.notify,
    });
  };

  const { ref: titleRef, ...titleField } = register('title', { required: true });
  const { ref: descRef, ...descField } = register('description');

  return (
    <Dialog
      open
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        component: 'form',
        onSubmit: handleSubmit(submit),
        sx: { borderRadius: 3, borderTop: 5, borderColor: 'primary.main' },
      }}
    >
      <DialogTitle sx={{ pb: 0.5 }}>
        <Typography sx={{ fontSize: 20, fontWeight: 700 }}>
          {editing ? 'Editar evento' : 'Nuevo evento'}
        </Typography>
        <Typography
          variant="body2"
          color="text.secondary"
        >
          Quien lo lleva, toda su área y Dirección reciben el aviso por WhatsApp y correo; después
          recordatorios a 7 días, 1 día y el mismo día.
        </Typography>
      </DialogTitle>
      <DialogContent>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, minmax(0,1fr))',
            gap: '14px 14px',
            pt: 1.5,
          }}
        >
          <DateFields control={control} />
          <Controller
            control={control}
            name="startTime"
            render={({ field }) => (
              <TextField
                {...field}
                type="time"
                size="small"
                label="Hora de inicio"
                InputLabelProps={{ shrink: true }}
              />
            )}
          />
          <Controller
            control={control}
            name="endTime"
            render={({ field }) => (
              <TextField
                {...field}
                type="time"
                size="small"
                label="Hora de fin"
                InputLabelProps={{ shrink: true }}
              />
            )}
          />
          <Controller
            control={control}
            name="type"
            render={({ field }) => (
              <TextField
                {...field}
                select
                size="small"
                label="Tipo"
                sx={{ gridColumn: '1 / -1' }}
              >
                {TYPE_KEYS.map((k) => (
                  <MenuItem
                    key={k}
                    value={k}
                  >
                    <Stack
                      direction="row"
                      alignItems="center"
                      spacing={1}
                    >
                      <Box
                        sx={{
                          width: 10,
                          height: 10,
                          borderRadius: 0.75,
                          bgcolor: EVENT_TYPES[k].bg,
                        }}
                      />
                      <span>{EVENT_TYPES[k].label}</span>
                    </Stack>
                  </MenuItem>
                ))}
              </TextField>
            )}
          />
          <TextField
            inputRef={titleRef}
            {...titleField}
            size="small"
            label="Nombre del evento *"
            placeholder="Ej. Sorteo de aniversario"
            required
            sx={{ gridColumn: '1 / -1' }}
          />
          <StoresField control={control} />
          <PeopleField
            control={control}
            me={
              editing
                ? {
                    id: editing.ownerId || '',
                    name: editing.ownerName,
                    departmentId: editing.departmentId,
                  }
                : me
            }
            staff={staff}
            departmentName={departmentName}
          />
          <Controller
            control={control}
            name="status"
            render={({ field }) => (
              <TextField
                {...field}
                select
                size="small"
                label="Estado general"
                sx={{ gridColumn: '1 / -1' }}
              >
                {(Object.keys(STATUS_LABEL) as EventStatus[]).map((k) => (
                  <MenuItem
                    key={k}
                    value={k}
                  >
                    {STATUS_LABEL[k]}
                  </MenuItem>
                ))}
              </TextField>
            )}
          />
          <StatusSections
            control={control}
            evidence={evidence}
            onEvidence={(urls) => setValue('evidence', urls)}
          />
          <TextField
            inputRef={descRef}
            {...descField}
            size="small"
            label="Descripción del evento"
            multiline
            minRows={4}
            placeholder="Detalles, premios, horarios, materiales, responsables…"
            sx={{ gridColumn: '1 / -1' }}
          />
          <Controller
            control={control}
            name="notify"
            render={({ field }) => (
              <FormControlLabel
                sx={{ gridColumn: '1 / -1' }}
                control={
                  <Checkbox
                    size="small"
                    checked={field.value}
                    onChange={(_, c) => field.onChange(c)}
                  />
                }
                label={
                  <Typography variant="body2">
                    {editing
                      ? 'Avisar a los involucrados si cambia la fecha o se cancela'
                      : 'Avisar ahora a los involucrados'}
                  </Typography>
                }
              />
            )}
          />
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button
          onClick={onClose}
          color="inherit"
          variant="outlined"
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          variant="contained"
          disabled={saving}
        >
          {saving ? 'Guardando…' : 'Guardar evento'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
