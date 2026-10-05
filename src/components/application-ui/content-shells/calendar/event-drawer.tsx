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
import GroupsRoundedIcon from '@mui/icons-material/GroupsRounded';
import NotesRoundedIcon from '@mui/icons-material/NotesRounded';
import ScheduleRoundedIcon from '@mui/icons-material/ScheduleRounded';
import StorefrontRoundedIcon from '@mui/icons-material/StorefrontRounded';
import {
  alpha,
  Autocomplete,
  Box,
  Button,
  Checkbox,
  Chip,
  Drawer,
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
  /** one = una tienda · many = varias · none = celebración general */
  scope: 'one' | 'many' | 'none';
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

const Section = ({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) => (
  <Box sx={{ display: 'grid', gridTemplateColumns: '28px minmax(0,1fr)', gap: 1.5 }}>
    <Box sx={{ color: 'text.secondary', pt: 1, display: 'flex', justifyContent: 'center' }}>
      {icon}
    </Box>
    <Stack spacing={1.5}>
      <Typography
        sx={{
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '.08em',
          textTransform: 'uppercase',
          color: 'text.secondary',
        }}
      >
        {title}
      </Typography>
      {children}
    </Stack>
  </Box>
);

/* ── Subcomponentes que observan un campo (así el form grande no repinta por tecla) ── */

function TypeBar({ control }: { control: Control<FormValues> }) {
  const type = useWatch({ control, name: 'type' });
  const ty = EVENT_TYPES[type] || EVENT_TYPES.otro;
  return <Box sx={{ height: 6, bgcolor: ty.bg, transition: 'background .2s' }} />;
}

function DateFields({ control }: { control: Control<FormValues> }) {
  const multi = useWatch({ control, name: 'multi' });
  const date = useWatch({ control, name: 'date' });
  const endDate = useWatch({ control, name: 'endDate' });
  const days =
    multi && date && endDate && endDate > date
      ? Math.round((new Date(endDate).getTime() - new Date(date).getTime()) / 864e5) + 1
      : 0;
  return (
    <>
      <Controller
        control={control}
        name="multi"
        render={({ field }) => (
          <ToggleButtonGroup
            size="small"
            exclusive
            fullWidth
            value={field.value ? 'multi' : 'one'}
            onChange={(_, v) => v && field.onChange(v === 'multi')}
          >
            <ToggleButton value="one">Un día</ToggleButton>
            <ToggleButton value="multi">Varios días</ToggleButton>
          </ToggleButtonGroup>
        )}
      />
      <Stack
        direction="row"
        gap={1.25}
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
              fullWidth
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
                fullWidth
              />
            )}
          />
        )}
      </Stack>
      <Stack
        direction="row"
        gap={1.25}
      >
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
              fullWidth
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
              fullWidth
            />
          )}
        />
      </Stack>
      {days > 0 && (
        <Typography
          variant="caption"
          color="text.secondary"
        >
          Duración: {days} días
        </Typography>
      )}
    </>
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
          />
        )}
      />
    );
  }
  if (status === 'finalizado') {
    return (
      <Box
        sx={{
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

const isSame = (a: EventStore, b: EventStore) =>
  (a.storeId || a.storeName) === (b.storeId || b.storeName);

const renderStore = (props: React.HTMLAttributes<HTMLLIElement>, o: EventStore) => (
  <li
    {...props}
    key={o.storeId || o.storeName}
  >
    <Box>
      <Typography sx={{ fontSize: 13, fontWeight: 600 }}>{o.storeName}</Typography>
      <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>{o.storeAddress}</Typography>
    </Box>
  </li>
);

function StoresField({ control }: { control: Control<FormValues> }) {
  const theme = useTheme();
  const scope = useWatch({ control, name: 'scope' });
  const [input, setInput] = useState('');
  const q = useDebouncedValue(input, 300);
  const { data, isFetching } = useQuery({
    queryKey: ['stores', 'calendar-search', q],
    queryFn: () => getStores({ search: q, limit: 20, status: 'active' }),
    staleTime: 60_000,
    enabled: q.length >= 2 && scope !== 'none',
  });
  const options: EventStore[] = useMemo(
    () =>
      (data?.data || []).map((s) => ({
        storeId: s._id,
        storeName: s.name,
        storeAddress: s.address || '',
        contact: [s.phoneNumber, s.email].filter(Boolean).join(' · '),
        confirmed: false,
      })),
    [data]
  );

  return (
    <Controller
      control={control}
      name="stores"
      render={({ field }) => {
        const one = scope === 'one' ? field.value[0] : null;
        return (
          <>
            <Controller
              control={control}
              name="scope"
              render={({ field: sc }) => (
                <ToggleButtonGroup
                  size="small"
                  exclusive
                  fullWidth
                  value={sc.value}
                  onChange={(_, v) => {
                    if (!v) return;
                    sc.onChange(v);
                    if (v === 'one') field.onChange(field.value.slice(0, 1));
                    if (v === 'none') field.onChange([]);
                  }}
                >
                  <ToggleButton value="one">Una tienda</ToggleButton>
                  <ToggleButton value="many">Varias tiendas</ToggleButton>
                  <ToggleButton value="none">Sin tienda</ToggleButton>
                </ToggleButtonGroup>
              )}
            />
            {scope === 'none' && (
              <Typography
                variant="caption"
                color="text.secondary"
              >
                Celebración general: aplica a toda la red.
              </Typography>
            )}
            {scope === 'one' && (
              <Autocomplete
                size="small"
                options={options}
                value={one || null}
                loading={isFetching}
                filterOptions={(x) => x}
                isOptionEqualToValue={isSame}
                getOptionLabel={(o) => o.storeName}
                inputValue={input}
                onInputChange={(_, v, reason) => reason !== 'reset' && setInput(v)}
                onChange={(_, v) => field.onChange(v ? [v] : [])}
                renderOption={renderStore}
                renderInput={(p) => (
                  <TextField
                    {...p}
                    label="Tienda *"
                    placeholder="Buscar por nombre, ciudad o dirección…"
                  />
                )}
              />
            )}
            {scope === 'many' && (
              <Autocomplete
                multiple
                size="small"
                options={options}
                value={field.value}
                loading={isFetching}
                filterOptions={(x) => x}
                isOptionEqualToValue={isSame}
                getOptionLabel={(o) => o.storeName}
                inputValue={input}
                onInputChange={(_, v, reason) => reason !== 'reset' && setInput(v)}
                onChange={(_, v) => field.onChange(v)}
                renderTags={() => null}
                renderOption={renderStore}
                renderInput={(p) => (
                  <TextField
                    {...p}
                    label="Tiendas participantes *"
                    placeholder="Buscar por nombre, ciudad o dirección…"
                  />
                )}
              />
            )}
            {/* Una tienda: contacto a la vista, como en el mock */}
            {scope === 'one' && (
              <Box
                sx={{
                  px: 1.5,
                  py: 1.25,
                  border: 1,
                  borderColor: 'divider',
                  borderRadius: 2,
                  bgcolor: alpha(theme.palette.text.primary, 0.02),
                }}
              >
                <Typography
                  sx={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: 'text.secondary',
                    letterSpacing: '.06em',
                    textTransform: 'uppercase',
                  }}
                >
                  Contacto
                </Typography>
                <Typography sx={{ fontSize: 14, color: one ? 'text.primary' : 'text.secondary' }}>
                  {one
                    ? [one.storeName, one.storeAddress, one.contact || 'Sin contacto registrado']
                        .filter(Boolean)
                        .join(' · ')
                    : 'Selecciona una tienda para ver su contacto.'}
                </Typography>
                {one && (
                  <FormControlLabel
                    sx={{ mt: 0.5 }}
                    control={
                      <Checkbox
                        size="small"
                        color="success"
                        checked={one.confirmed}
                        onChange={(_, c) => field.onChange([{ ...one, confirmed: c }])}
                      />
                    }
                    label={<Typography variant="body2">La tienda ya confirmó</Typography>}
                  />
                )}
              </Box>
            )}
            {/* Varias: lista con check de confirmación por tienda */}
            {scope === 'many' && field.value.length > 0 && (
              <Box
                sx={{
                  border: 1,
                  borderColor: 'divider',
                  borderRadius: 2,
                  maxHeight: 220,
                  overflow: 'auto',
                }}
              >
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  sx={{ px: 1.25, py: 0.75, bgcolor: alpha(theme.palette.text.primary, 0.03) }}
                >
                  <Typography sx={{ fontSize: 11, fontWeight: 700, color: 'text.secondary' }}>
                    Contactos · marca las que confirmaron
                  </Typography>
                  <Typography sx={{ fontSize: 11, fontWeight: 700, color: 'success.main' }}>
                    {field.value.filter((s) => s.confirmed).length} de {field.value.length}
                  </Typography>
                </Stack>
                {field.value.map((s, i) => (
                  <Stack
                    key={s.storeId || s.storeName}
                    direction="row"
                    alignItems="center"
                    gap={1}
                    sx={{ px: 1, py: 0.5, borderTop: 1, borderColor: 'divider' }}
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
          </>
        );
      }}
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
    <>
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
    </>
  );
}

/* ── Drawer (estilo Google Calendar: panel lateral, cabecera con el color del tipo) ── */

export function EventDrawer({
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
          scope:
            editing.stores.length === 0 ? 'none' : editing.stores.length === 1 ? 'one' : 'many',
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
          scope: 'one',
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
    if (v.scope !== 'none' && !v.stores.length)
      return toast.error(
        v.scope === 'one' ? 'Selecciona la tienda.' : 'Selecciona al menos una tienda.'
      );
    onSubmit({
      title: v.title.trim(),
      type: v.type,
      date: v.date,
      endDate: v.multi ? v.endDate : '',
      startTime: v.startTime,
      endTime: v.endTime,
      status: v.status,
      description: v.description.trim(),
      stores: v.scope === 'none' ? [] : v.stores,
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
  const owner = editing
    ? { id: editing.ownerId || '', name: editing.ownerName, departmentId: editing.departmentId }
    : me;

  return (
    <Drawer
      anchor="right"
      open
      onClose={onClose}
      PaperProps={{
        component: 'form',
        onSubmit: handleSubmit(submit),
        sx: { width: { xs: '100%', sm: 520 }, maxWidth: '100%' },
      }}
    >
      <TypeBar control={control} />
      <Stack
        direction="row"
        alignItems="flex-start"
        justifyContent="space-between"
        sx={{ px: 3, pt: 2, pb: 1 }}
      >
        <Box>
          <Typography sx={{ fontSize: 20, fontWeight: 700 }}>
            {editing ? 'Editar evento' : 'Nuevo evento'}
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
          >
            Quien lo lleva, su área y Dirección reciben el aviso; luego recordatorios a 7 días, 1
            día y el mismo día.
          </Typography>
        </Box>
        <IconButton
          onClick={onClose}
          size="small"
        >
          <CloseRoundedIcon />
        </IconButton>
      </Stack>

      <Stack
        spacing={3}
        sx={{ px: 3, py: 2, flex: 1, overflowY: 'auto' }}
      >
        <Stack spacing={1.5}>
          <TextField
            inputRef={titleRef}
            {...titleField}
            variant="standard"
            placeholder="Nombre del evento *"
            required
            autoFocus={!editing}
            InputProps={{ sx: { fontSize: 22, fontWeight: 700 } }}
          />
          <Controller
            control={control}
            name="type"
            render={({ field }) => (
              <Stack
                direction="row"
                flexWrap="wrap"
                gap={0.75}
              >
                {TYPE_KEYS.map((k) => {
                  const on = field.value === k;
                  return (
                    <Chip
                      key={k}
                      size="small"
                      label={EVENT_TYPES[k].label}
                      onClick={() => field.onChange(k)}
                      sx={{
                        fontWeight: 600,
                        bgcolor: on ? EVENT_TYPES[k].bg : 'transparent',
                        color: on ? EVENT_TYPES[k].fg : 'text.primary',
                        border: 1,
                        borderColor: on ? EVENT_TYPES[k].bg : 'divider',
                        '&:hover': {
                          bgcolor: on ? EVENT_TYPES[k].bg : alpha(EVENT_TYPES[k].bg, 0.15),
                        },
                      }}
                    />
                  );
                })}
              </Stack>
            )}
          />
        </Stack>

        <Section
          icon={<ScheduleRoundedIcon fontSize="small" />}
          title="Cuándo"
        >
          <DateFields control={control} />
        </Section>

        <Section
          icon={<StorefrontRoundedIcon fontSize="small" />}
          title="Tiendas participantes"
        >
          <StoresField control={control} />
        </Section>

        <Section
          icon={<GroupsRoundedIcon fontSize="small" />}
          title="Involucrados"
        >
          <PeopleField
            control={control}
            me={owner}
            staff={staff}
            departmentName={departmentName}
          />
        </Section>

        <Section
          icon={<NotesRoundedIcon fontSize="small" />}
          title="Estado y detalle"
        >
          <Controller
            control={control}
            name="status"
            render={({ field }) => (
              <TextField
                {...field}
                select
                size="small"
                label="Estado general"
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
          />
          <Controller
            control={control}
            name="notify"
            render={({ field }) => (
              <FormControlLabel
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
        </Section>
      </Stack>

      <Stack
        direction="row"
        justifyContent="flex-end"
        spacing={1}
        sx={{ px: 3, py: 2, borderTop: 1, borderColor: 'divider', bgcolor: 'background.paper' }}
      >
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
      </Stack>
    </Drawer>
  );
}
