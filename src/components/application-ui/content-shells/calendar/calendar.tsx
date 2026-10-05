'use client';

import { useAuth } from '@/hooks/use-auth';
import { usersApi } from '@/mocks/users';
import {
  calendarService,
  type CalendarEvent,
  type EventPayload,
  type EventType,
} from '@/services/calendar.service';
import { departmentService } from '@/services/department.service';
import { getStores } from '@/services/store.service';
import { isInternalStaff, STAFF_ROLE_QUERY } from '@/utils/staff';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import {
  Autocomplete,
  Box,
  Button,
  Card,
  Chip,
  Container,
  Skeleton,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import dynamic from 'next/dynamic';
import { useRouter, useSearchParams } from 'next/navigation';
import React, { useCallback, useDeferredValue, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { useCustomization } from 'src/hooks/use-customization';
import { AgendaView } from './agenda-view';
import { CalendarSidebar } from './calendar-sidebar';
import {
  CATEGORY_LABEL,
  endKey,
  EVENT_TYPES,
  fmtNum,
  inCategory,
  isOngoing,
  MONTHS,
  searchText,
  SEASONS,
  shortDay,
  STATUS_LABEL,
  todayKey,
  TYPE_KEYS,
  type Category,
} from './constants';
import type { StaffOption } from './event-drawer';
import { MonthView } from './month-view';
import { NowStrip } from './now-strip';
import { RankingView } from './ranking-view';
import { YearView } from './year-view';

const EventDrawer = dynamic(() => import('./event-drawer').then((m) => m.EventDrawer), {
  loading: () => null,
});
const EventDetailDialog = dynamic(
  () => import('./event-detail-dialog').then((m) => m.EventDetailDialog),
  { loading: () => null }
);

type View = 'mes' | 'ano' | 'agenda' | 'ranking';

function exportCsv(events: CalendarEvent[], year: number) {
  const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const rows = [
    [
      'Fecha',
      'Hasta',
      'Hora',
      'Mes',
      'Tipo',
      'Evento',
      'Estado',
      'Lo lleva',
      'Tiendas',
      'Involucrados',
      'Descripción',
      'Origen',
    ],
  ].concat(
    events.map((e) => [
      e.date,
      e.endDate || '',
      e.startTime || '',
      MONTHS[Number(e.date.slice(5, 7)) - 1],
      EVENT_TYPES[e.type]?.label || e.type,
      e.title,
      STATUS_LABEL[e.status],
      e.ownerName,
      e.stores
        .map((s) => `${s.storeName}${s.storeAddress ? ` (${s.storeAddress})` : ''}`)
        .join(' | '),
      e.participants.map((p) => p.name).join(' | '),
      e.description,
      e.source,
    ])
  );
  const blob = new Blob([`﻿${rows.map((r) => r.map(esc).join(',')).join('\n')}`], {
    type: 'text/csv;charset=utf-8',
  });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `eventos-${year}.csv`;
  a.click();
}

function Calendar(): React.JSX.Element {
  const customization = useCustomization();
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const { push } = useRouter();
  const { user: authUser } = useAuth();
  const today = todayKey();

  /* ── UI state ── */
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [view, setView] = useState<View>('agenda');
  const [typeFilter, setTypeFilter] = useState<'all' | EventType>('all');
  /** Pedido de Pedro: celebraciones del año vs actividades propias de cada tienda. */
  const [category, setCategory] = useState<Category>('all');
  /** Pedido de Pedro: teñir los días con el pastel de su estación. */
  const [seasons, setSeasons] = useState(false);
  const [search, setSearch] = useState('');
  const deferredSearch = useDeferredValue(search);
  const [showPast, setShowPast] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(searchParams.get('eventId'));
  const [dialog, setDialog] = useState<{ editing: CalendarEvent | null; date?: string } | null>(
    null
  );

  /* ── Data ── */
  const from = `${year}-01-01`;
  const to = `${year}-12-31`;
  const { data: events = [], isLoading } = useQuery({
    queryKey: ['calendar', year],
    queryFn: () => calendarService.feed(from, to),
    staleTime: 60_000,
  });

  const { data: departments = [] } = useQuery({
    queryKey: ['departments'],
    queryFn: departmentService.list,
    staleTime: 120_000,
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
    refetchOnWindowFocus: false,
  });
  const staff: StaffOption[] = useMemo(
    () =>
      allUsers.filter(isInternalStaff).map((u: any) => ({
        id: u._id || u.id,
        name: `${u.firstName || ''} ${u.lastName || ''}`.trim(),
        departmentId: u.departmentId || null,
      })),
    [allUsers]
  );
  const me: StaffOption | null = useMemo(() => {
    if (!authUser) return null;
    const id = (authUser as any)._id || authUser.id;
    return {
      id,
      name: `${authUser.firstName || ''} ${authUser.lastName || ''}`.trim(),
      departmentId: authUser.departmentId || staff.find((s) => s.id === id)?.departmentId || null,
    };
  }, [authUser, staff]);
  const departmentName = useCallback(
    (id?: string | null) => departments.find((d) => d._id === id)?.name || '',
    [departments]
  );

  const { data: rankingStores, isLoading: loadingRanking } = useQuery({
    queryKey: ['stores', 'ranking-audience'],
    queryFn: () =>
      getStores({ limit: 150, sortBy: 'customerCount', order: 'desc', status: 'active' }),
    staleTime: 5 * 60_000,
    enabled: view === 'ranking',
  });

  /* ── Mutations ── */
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['calendar'] });
  const createMut = useMutation({
    mutationFn: (p: EventPayload) => calendarService.create(p),
    onSuccess: (ev) => {
      invalidate();
      setDialog(null);
      setMonth(Number(ev.date.slice(5, 7)) - 1);
      setYear(Number(ev.date.slice(0, 4)));
      setSelectedId(ev._id);
      toast.success(
        ev.participants?.length
          ? `Evento guardado · aviso a ${ev.participants.length} personas`
          : 'Evento guardado'
      );
    },
    onError: (e: any) => toast.error(e?.response?.data?.error || 'No se pudo guardar el evento'),
  });
  const updateMut = useMutation({
    mutationFn: ({ id, p }: { id: string; p: Partial<EventPayload> }) =>
      calendarService.update(id, p),
    onSuccess: (ev) => {
      invalidate();
      setDialog(null);
      setSelectedId(ev._id);
      toast.success('Evento actualizado');
    },
    onError: (e: any) => toast.error(e?.response?.data?.error || 'No se pudo actualizar el evento'),
  });
  const deleteMut = useMutation({
    mutationFn: (id: string) => calendarService.remove(id),
    onSuccess: () => {
      invalidate();
      setSelectedId(null);
      toast.success('Evento eliminado');
    },
    onError: () => toast.error('No se pudo eliminar'),
  });
  const notifyMut = useMutation({
    mutationFn: (id: string) => calendarService.notify(id),
    onSuccess: (r) => {
      invalidate();
      toast.success(`Aviso enviado a ${r.sent} personas por WhatsApp y correo`);
    },
    onError: () => toast.error('No se pudo enviar el aviso'),
  });

  /* ── Derivados ── */
  const q = deferredSearch.trim().toLowerCase();
  const filtered = useMemo(
    () =>
      events.filter(
        (e) =>
          (typeFilter === 'all' || e.type === typeFilter) &&
          inCategory(e, category) &&
          (!q || searchText(e).includes(q))
      ),
    [events, typeFilter, category, q]
  );
  const selected = useMemo(
    () => events.find((e) => e._id === selectedId) || null,
    [events, selectedId]
  );
  const storeCount = useMemo(
    () => new Set(events.flatMap((e) => e.stores.map((s) => s.storeId || s.storeName))).size,
    [events]
  );
  // Autocompletado del buscador: tiendas (con cuántos eventos tienen), personas y eventos
  // que de verdad están en el calendario. Elegir una tienda filtra sus eventos.
  type SearchOption = { group: 'Tiendas' | 'Personas' | 'Eventos'; label: string; sub?: string; search: string };
  const searchOptions = useMemo<SearchOption[]>(() => {
    const stores = new Map<string, { label: string; sub: string; n: number }>();
    const people = new Set<string>();
    const titles = new Map<string, string>();
    for (const e of events) {
      for (const s of e.stores) {
        const k = s.storeId || s.storeName;
        const cur = stores.get(k);
        if (cur) cur.n += 1;
        else stores.set(k, { label: s.storeName, sub: s.storeAddress || '', n: 1 });
      }
      if (e.ownerName) people.add(e.ownerName);
      for (const p of e.participants) if (p.name) people.add(p.name);
      if (!titles.has(e.title)) titles.set(e.title, EVENT_TYPES[e.type]?.label || e.type);
    }
    const opt = (group: SearchOption['group'], label: string, sub?: string): SearchOption => ({
      group,
      label,
      sub,
      search: `${label} ${sub || ''}`.toLowerCase(),
    });
    return [
      ...[...stores.values()]
        .sort((a, b) => b.n - a.n || a.label.localeCompare(b.label))
        .map((s) => opt('Tiendas', s.label, `${s.sub ? `${s.sub} · ` : ''}${s.n} evento${s.n === 1 ? '' : 's'}`)),
      ...[...people].sort().map((p) => opt('Personas', p)),
      ...[...titles.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([t, ty]) => opt('Eventos', t, ty)),
    ];
  }, [events]);
  // "Próxima fecha" es la que viene, no la que ya está en curso (Hispanic Heritage Month dura un mes)
  const nextEv = useMemo(
    () => events.find((e) => e.date > today && e.status !== 'cancelado') || null,
    [events, today]
  );
  const ongoingCount = useMemo(
    () => events.filter((e) => isOngoing(e, today) && e.status !== 'cancelado').length,
    [events, today]
  );

  const openEvent = useCallback((e: CalendarEvent) => setSelectedId(e._id), []);
  const goMonth = useCallback((m: number) => {
    setMonth(m);
    setView('mes');
  }, []);

  const submit = (p: EventPayload) =>
    dialog?.editing ? updateMut.mutate({ id: dialog.editing._id, p }) : createMut.mutate(p);

  const Kpi = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <Box>
      <Typography
        sx={{
          fontSize: 11,
          color: 'text.secondary',
          textTransform: 'uppercase',
          letterSpacing: '.06em',
          fontWeight: 600,
        }}
      >
        {label}
      </Typography>
      <Typography
        sx={{ fontSize: 22, fontWeight: 700, fontVariantNumeric: 'tabular-nums', lineHeight: 1.2 }}
      >
        {value}
      </Typography>
    </Box>
  );

  return (
    <Container
      maxWidth={customization.stretch ? false : 'xl'}
      sx={{ py: { xs: 2, sm: 3 } }}
    >
      {/* Cabecera */}
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        justifyContent="space-between"
        alignItems={{ md: 'flex-end' }}
        gap={2}
        sx={{ mb: 2 }}
      >
        <Box>
          <Stack
            direction="row"
            alignItems="center"
            spacing={1}
            sx={{
              color: 'primary.main',
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: '.08em',
              textTransform: 'uppercase',
            }}
          >
            <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: 'primary.main' }} />
            <span>Sweepstouch · Planificación {year}</span>
          </Stack>
          <Typography
            variant="h3"
            sx={{ fontWeight: 700, letterSpacing: '-.01em', mt: 0.5 }}
          >
            Calendario de eventos y activaciones
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
          >
            Feriados de EE. UU., fechas culturales, aniversarios de tienda, activaciones, visitas y
            tareas en tienda
          </Typography>
        </Box>
        <Stack
          direction="row"
          flexWrap="wrap"
          gap={3}
          alignItems="flex-end"
        >
          <Kpi
            label="Eventos"
            value={isLoading ? <Skeleton width={40} /> : fmtNum(events.length)}
          />
          <Kpi
            label="Tiendas"
            value={isLoading ? <Skeleton width={40} /> : fmtNum(storeCount)}
          />
          <Kpi
            label="En curso"
            value={isLoading ? <Skeleton width={40} /> : fmtNum(ongoingCount)}
          />
          <Box sx={{ maxWidth: 240 }}>
            <Typography
              sx={{
                fontSize: 11,
                color: 'text.secondary',
                textTransform: 'uppercase',
                letterSpacing: '.06em',
                fontWeight: 600,
              }}
            >
              Próxima fecha
            </Typography>
            <Typography sx={{ fontSize: 15, fontWeight: 600, lineHeight: 1.3, pt: 0.375 }}>
              {nextEv
                ? `${shortDay(nextEv.date).day} ${shortDay(nextEv.date).mon.toLowerCase()} · ${nextEv.title
                }`
                : '—'}
            </Typography>
          </Box>
          <Stack
            direction="row"
            spacing={1}
          >
            <Button
              variant="outlined"
              color="inherit"
              startIcon={<FileDownloadOutlinedIcon fontSize="small" />}
              onClick={() => exportCsv(filtered, year)}
            >
              Exportar CSV
            </Button>
            <Button
              variant="contained"
              startIcon={<AddRoundedIcon />}
              onClick={() =>
                setDialog({
                  editing: null,
                  date:
                    year === now.getFullYear() && month === now.getMonth()
                      ? today
                      : `${year}-${String(month + 1).padStart(2, '0')}-01`,
                })
              }
            >
              Nuevo evento
            </Button>
          </Stack>
        </Stack>
      </Stack>

      {/* Barra de vistas y filtros */}
      <Card sx={{ p: 1.5, mb: 2.5, position: 'sticky', top: 0, zIndex: 5 }}>
        <Stack
          direction="row"
          flexWrap="wrap"
          gap={1.5}
          alignItems="center"
        >
          <ToggleButtonGroup
            size="small"
            exclusive
            value={view}
            onChange={(_, v) => v && setView(v)}
            color="primary"
          >
            <ToggleButton value="mes">Mes</ToggleButton>
            <ToggleButton value="ano">Año</ToggleButton>
            <ToggleButton value="agenda">Agenda</ToggleButton>
            <ToggleButton value="ranking">Ranking</ToggleButton>
          </ToggleButtonGroup>
          <ToggleButtonGroup
            size="small"
            exclusive
            value={year}
            onChange={(_, v) => v && setYear(v)}
          >
            {[now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1].map((y) => (
              <ToggleButton
                key={y}
                value={y}
              >
                {y}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
          {view !== 'ranking' && (
            <ToggleButtonGroup
              size="small"
              exclusive
              value={category}
              onChange={(_, v) => v && setCategory(v)}
            >
              {(Object.keys(CATEGORY_LABEL) as Category[]).map((c) => (
                <ToggleButton
                  key={c}
                  value={c}
                >
                  {CATEGORY_LABEL[c]}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
          )}
          {(view === 'mes' || view === 'ano') && (
            <Chip
              size="small"
              label={
                seasons
                  ? `Estaciones: ${Object.values(SEASONS)
                    .map((s) => s.emoji)
                    .join(' ')}`
                  : 'Estaciones'
              }
              onClick={() => setSeasons((v) => !v)}
              variant={seasons ? 'filled' : 'outlined'}
              color={seasons ? 'primary' : 'default'}
            />
          )}
          {view !== 'ranking' && (
            <Stack
              direction="row"
              flexWrap="wrap"
              gap={0.75}
            >
              <Chip
                size="small"
                label="Todos"
                onClick={() => setTypeFilter('all')}
                variant={typeFilter === 'all' ? 'filled' : 'outlined'}
                sx={
                  typeFilter === 'all' ? { bgcolor: 'text.primary', color: 'background.paper' } : {}
                }
              />
              {TYPE_KEYS.map((k) => (
                <Chip
                  key={k}
                  size="small"
                  icon={
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: 0.5,
                        bgcolor: `${EVENT_TYPES[k].bg} !important`,
                        ml: '8px !important',
                      }}
                    />
                  }
                  label={EVENT_TYPES[k].plural}
                  onClick={() => setTypeFilter(typeFilter === k ? 'all' : k)}
                  variant={typeFilter === k ? 'filled' : 'outlined'}
                  sx={
                    typeFilter === k ? { bgcolor: 'text.primary', color: 'background.paper' } : {}
                  }
                />
              ))}
            </Stack>
          )}
          <Autocomplete
            freeSolo
            size="small"
            options={searchOptions}
            groupBy={(o) => o.group}
            getOptionLabel={(o) => (typeof o === 'string' ? o : o.label)}
            filterOptions={(opts, { inputValue }) => {
              const v = inputValue.trim().toLowerCase();
              return (v ? opts.filter((o) => o.search.includes(v)) : opts).slice(0, 40);
            }}
            inputValue={search}
            onInputChange={(_, v) => setSearch(v)}
            onChange={(_, v) => setSearch(typeof v === 'string' ? v : v?.label || '')}
            renderOption={(props, o) => (
              <li
                {...props}
                key={`${o.group}-${o.label}`}
              >
                <Box>
                  <Typography sx={{ fontSize: 13, fontWeight: 600 }}>{o.label}</Typography>
                  {o.sub && (
                    <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>{o.sub}</Typography>
                  )}
                </Box>
              </li>
            )}
            renderInput={(p) => (
              <TextField
                {...p}
                placeholder="Buscar tienda, dirección, persona o evento…"
              />
            )}
            sx={{ flex: '1 1 260px', minWidth: 220 }}
          />
        </Stack>
      </Card>

      {/* Lo primero al entrar: qué está en curso y qué viene */}
      {!isLoading && view !== 'ranking' && (
        <NowStrip
          events={filtered}
          today={today}
          onOpen={openEvent}
        />
      )}

      {/* Contenido */}
      <Stack
        direction={{ xs: 'column', lg: 'row' }}
        gap={2.5}
        alignItems="flex-start"
      >
        <Card sx={{ flex: '1 1 640px', minWidth: 0, p: { xs: 1.5, md: 2.25 }, width: '100%' }}>
          {isLoading ? (
            <Skeleton
              variant="rounded"
              height={620}
            />
          ) : view === 'mes' ? (
            <MonthView
              year={year}
              month={month}
              events={filtered}
              today={today}
              onPickMonth={setMonth}
              onPrev={() => setMonth((m) => (m + 11) % 12)}
              onNext={() => setMonth((m) => (m + 1) % 12)}
              onAddAt={(d) => setDialog({ editing: null, date: d })}
              onOpen={openEvent}
              seasons={seasons}
            />
          ) : view === 'ano' ? (
            <YearView
              year={year}
              events={filtered}
              today={today}
              onGoMonth={goMonth}
              seasons={seasons}
            />
          ) : view === 'agenda' ? (
            <AgendaView
              year={year}
              events={filtered}
              today={today}
              showPast={showPast}
              onTogglePast={() => setShowPast((v) => !v)}
              onOpen={openEvent}
            />
          ) : (
            <RankingView
              stores={rankingStores?.data || []}
              loading={loadingRanking}
              events={events}
              search={deferredSearch}
            />
          )}
        </Card>
        {view !== 'ranking' && (
          <Box sx={{ flex: '1 1 300px', maxWidth: { lg: 380 }, width: '100%' }}>
            <CalendarSidebar
              events={filtered}
              today={today}
              onOpen={openEvent}
            />
          </Box>
        )}
      </Stack>

      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ display: 'block', mt: 2 }}
      >
        Eventos propios + tareas de Cowork con tienda + visitas de soporte técnico. Los avisos salen
        por WhatsApp (SweepsBot) y correo a quien lo lleva, a su área y a Dirección.
      </Typography>

      {selected && (
        <EventDetailDialog
          event={selected}
          onClose={() => setSelectedId(null)}
          onEdit={() => {
            setDialog({ editing: selected });
            setSelectedId(null);
          }}
          onDelete={() => {
            if (window.confirm('¿Eliminar este evento?')) deleteMut.mutate(selected._id);
          }}
          onNotify={() => notifyMut.mutate(selected._id)}
          onOpenLink={(link) => push(link)}
          notifying={notifyMut.isPending}
        />
      )}
      {dialog && (
        <EventDrawer
          editing={dialog.editing}
          initialDate={dialog.date}
          me={me}
          staff={staff}
          departmentName={departmentName}
          saving={createMut.isPending || updateMut.isPending}
          onClose={() => setDialog(null)}
          onSubmit={submit}
        />
      )}
    </Container>
  );
}

export default Calendar;
