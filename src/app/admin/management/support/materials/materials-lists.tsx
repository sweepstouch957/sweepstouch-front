'use client';

import * as api from '@/services/material-control.service';
import AddRounded from '@mui/icons-material/AddRounded';
import DeleteOutlineRounded from '@mui/icons-material/DeleteOutlineRounded';
import DevicesOutlined from '@mui/icons-material/DevicesOutlined';
import HistoryRounded from '@mui/icons-material/HistoryRounded';
import StorefrontOutlined from '@mui/icons-material/StorefrontOutlined';
import {
  Box,
  Button,
  Divider,
  IconButton,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useState, type FormEvent } from 'react';
import {
  EmptyBlock,
  PanelCard,
  SectionHeader,
  StatusPill,
} from 'src/components/application-ui/content-shells/store-managment/panel-kit';
import ConfirmDialog from 'src/components/base/confirm-dialog';
import { ButtonSoft } from 'src/components/base/styles/button-soft';
import { useMaterials } from './materials-context';
import {
  grid2,
  grid3,
  MovementTable,
  PageControls,
  QueryFeedback,
  Section,
  useDebouncedValue,
} from './materials-shared';
import { stateLabels, storeAddress, typeLabels } from './materials-utils';

export function EquipmentView({ active }: { active: boolean }) {
  const { scope, enabled, materials } = useMaterials();
  const [filters, setFilters] = useState({
    query: '',
    material: '',
    state: '' as api.EquipmentState | '',
    page: 1,
  });
  const query = useDebouncedValue(filters.query);
  const params: api.EquipmentParams = {
    page: filters.page,
    limit: 20,
    q: query || undefined,
    material: filters.material || undefined,
    estado: filters.state || undefined,
  };
  const result = useQuery({
    queryKey: [...scope, 'equipment', params],
    queryFn: () => api.getEquipment(params),
    enabled: enabled && active,
    staleTime: 0,
    retry: false,
  });
  return (
    <Stack spacing={1.5}>
      <Section
        title="Buscar equipos"
        icon={<DevicesOutlined color="primary" />}
      >
        <Box sx={grid3}>
          <TextField
            label="Buscar"
            placeholder="IMEI, SIM, ICCID o tienda"
            size="small"
            value={filters.query}
            onChange={(event) => setFilters({ ...filters, query: event.target.value, page: 1 })}
          />
          <TextField
            label="Tipo de equipo"
            select
            size="small"
            value={filters.material}
            onChange={(event) => setFilters({ ...filters, material: event.target.value, page: 1 })}
          >
            <MenuItem value="">Todos</MenuItem>
            {materials.flatMap((row) =>
              row.serie
                ? [
                    <MenuItem
                      key={row.id}
                      value={row.id}
                    >
                      {row.nombre}
                    </MenuItem>,
                  ]
                : []
            )}
          </TextField>
          <TextField
            label="Ubicación"
            select
            size="small"
            value={filters.state}
            onChange={(event) =>
              setFilters({
                ...filters,
                state: event.target.value as api.EquipmentState | '',
                page: 1,
              })
            }
          >
            <MenuItem value="">Todas</MenuItem>
            {(Object.keys(stateLabels) as api.EquipmentState[]).map((state) => (
              <MenuItem
                key={state}
                value={state}
              >
                {stateLabels[state]}
              </MenuItem>
            ))}
          </TextField>
        </Box>
      </Section>
      <Section
        title="IMEI y SIM"
        icon={<DevicesOutlined color="primary" />}
      >
        <QueryFeedback
          pending={result.isPending || result.isFetching}
          error={result.error}
        >
          {result.data?.docs.length ? (
            <TableContainer>
              <Table
                size="small"
                aria-label="Equipos y números de serie"
              >
                <TableHead>
                  <TableRow>
                    {['Equipo', 'IMEI / Número', 'ICCID', 'Ubicación', 'Último movimiento'].map(
                      (label) => (
                        <TableCell key={label}>{label}</TableCell>
                      )
                    )}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {result.data.docs.map((row) => (
                    <TableRow key={JSON.stringify([row.m, row.v])}>
                      <TableCell>
                        <Box component="details">
                          <Typography
                            component="summary"
                            variant="body2"
                            sx={{ cursor: 'pointer' }}
                          >
                            {materials.find((material) => material.id === row.m)?.nombre || row.m}
                          </Typography>
                          <Stack
                            spacing={0.5}
                            sx={{ mt: 1 }}
                          >
                            {[...row.hist].reverse().map((entry, index) => (
                              <Typography
                                key={`${entry.movimientoId}-${index}`}
                                variant="caption"
                                color="text.secondary"
                              >
                                {entry.fecha} · {typeLabels[entry.tipo]} · {entry.motivo} ·{' '}
                                {entry.resp}
                                {entry.cond
                                  ? ` · ${entry.cond === 'danado' ? 'Dañado' : 'Buen estado'}`
                                  : ''}
                              </Typography>
                            ))}
                          </Stack>
                        </Box>
                      </TableCell>
                      <TableCell>{row.v}</TableCell>
                      <TableCell>{row.iccid || 'Sin ICCID registrado'}</TableCell>
                      <TableCell>
                        <Stack
                          spacing={0.5}
                          alignItems="flex-start"
                        >
                          <StatusPill
                            label={stateLabels[row.estado]}
                            tone={
                              row.estado === 'danado'
                                ? 'error'
                                : row.estado === 'tienda'
                                  ? 'info'
                                  : 'neutral'
                            }
                          />
                          {row.estado === 'tienda' && (
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              {row.tienda?.nombre || 'Tienda no disponible'}
                            </Typography>
                          )}
                        </Stack>
                      </TableCell>
                      <TableCell>{row.fecha}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <EmptyBlock
              title="Sin equipos"
              hint="Registra un material con número de serie o ajusta los filtros."
            />
          )}
        </QueryFeedback>
        {!result.error && (
          <PageControls
            result={result.data}
            page={filters.page}
            onChange={(page) => setFilters({ ...filters, page })}
          />
        )}
      </Section>
    </Stack>
  );
}

export function HistoryView({ active }: { active: boolean }) {
  const { scope, enabled, materials, stores, busy, write } = useMaterials();
  const [filters, setFilters] = useState({
    type: '' as api.MovementKind | '',
    material: '',
    store: '',
    from: '',
    to: '',
    query: '',
    page: 1,
  });
  const [deleting, setDeleting] = useState<api.Movement | null>(null);
  const query = useDebouncedValue(filters.query);
  const params: api.MovementParams = {
    page: filters.page,
    limit: 20,
    tipo: filters.type || undefined,
    material: filters.material || undefined,
    tiendaId: filters.store || undefined,
    desde: filters.from || undefined,
    hasta: filters.to || undefined,
    q: query || undefined,
  };
  const result = useQuery({
    queryKey: [...scope, 'history', params],
    queryFn: () => api.getMovements(params),
    enabled: enabled && active,
    staleTime: 0,
    retry: false,
  });
  return (
    <Stack spacing={1.5}>
      <Section
        title="Filtrar historial"
        icon={<HistoryRounded color="primary" />}
      >
        <Box sx={grid3}>
          <TextField
            label="Tipo"
            select
            size="small"
            value={filters.type}
            onChange={(event) =>
              setFilters({ ...filters, type: event.target.value as api.MovementKind | '', page: 1 })
            }
          >
            <MenuItem value="">Todos</MenuItem>
            {(Object.keys(typeLabels) as api.MovementKind[]).map((value) => (
              <MenuItem
                key={value}
                value={value}
              >
                {typeLabels[value]}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            label="Material"
            select
            size="small"
            value={filters.material}
            onChange={(event) => setFilters({ ...filters, material: event.target.value, page: 1 })}
          >
            <MenuItem value="">Todos</MenuItem>
            {materials.map((row) => (
              <MenuItem
                key={row.id}
                value={row.id}
              >
                {row.nombre}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            label="Tienda"
            select
            size="small"
            value={filters.store}
            onChange={(event) => setFilters({ ...filters, store: event.target.value, page: 1 })}
          >
            <MenuItem value="">Todas</MenuItem>
            {stores.map((store) => (
              <MenuItem
                key={store.id}
                value={store.id}
              >
                {store.nombre}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            label="Desde"
            type="date"
            size="small"
            InputLabelProps={{ shrink: true }}
            value={filters.from}
            onChange={(event) => setFilters({ ...filters, from: event.target.value, page: 1 })}
          />
          <TextField
            label="Hasta"
            type="date"
            size="small"
            inputProps={{ min: filters.from || undefined }}
            InputLabelProps={{ shrink: true }}
            value={filters.to}
            onChange={(event) => setFilters({ ...filters, to: event.target.value, page: 1 })}
          />
          <TextField
            label="Buscar"
            size="small"
            placeholder="Técnico, nota, motivo…"
            value={filters.query}
            onChange={(event) => setFilters({ ...filters, query: event.target.value, page: 1 })}
          />
        </Box>
      </Section>
      <Section
        title="Historial de movimientos"
        icon={<HistoryRounded color="primary" />}
      >
        <QueryFeedback
          pending={result.isPending || result.isFetching}
          error={result.error}
        >
          <MovementTable
            rows={result.data?.docs || []}
            action={(row) => (
              <Tooltip title="Eliminar movimiento">
                <span>
                  <IconButton
                    type="button"
                    aria-label="Eliminar movimiento"
                    disabled={busy}
                    onClick={() => setDeleting(row)}
                  >
                    <DeleteOutlineRounded />
                  </IconButton>
                </span>
              </Tooltip>
            )}
          />
        </QueryFeedback>
        {!result.error && (
          <PageControls
            result={result.data}
            page={filters.page}
            onChange={(page) => setFilters({ ...filters, page })}
          />
        )}
      </Section>
      <ConfirmDialog
        open={Boolean(deleting)}
        title="Eliminar movimiento"
        description={
          deleting
            ? `Se eliminará ${typeLabels[deleting.tipo].toLowerCase()} del ${
                deleting.fecha
              } y se recalcularán las existencias y la ubicación de los equipos.`
            : ''
        }
        confirmLabel="Eliminar"
        severity="error"
        loading={busy}
        onClose={() => setDeleting(null)}
        onConfirm={() => {
          if (deleting)
            void write(
              () => api.deleteMovement(deleting._id),
              'Movimiento eliminado.',
              () => {
                setDeleting(null);
                if (result.data?.docs.length === 1 && filters.page > 1)
                  setFilters((current) => ({ ...current, page: current.page - 1 }));
              }
            );
        }}
      />
    </Stack>
  );
}

function StoreDetails({
  store,
  active,
  onRegister,
}: {
  store: api.MaterialStore;
  active: boolean;
  onRegister: (id: string) => void;
}) {
  const { scope, enabled, inventory, materials, busy } = useMaterials();
  const [expanded, setExpanded] = useState(false);
  const [page, setPage] = useState(1);
  const result = useQuery({
    queryKey: [...scope, 'store-history', store.id, page],
    queryFn: () => api.getMovements({ tiendaId: store.id, page, limit: 20 }),
    enabled: enabled && active && expanded,
    staleTime: 0,
    retry: false,
  });
  const installed = Object.entries(inventory.porTienda[store.id] || {}).filter(
    ([, quantity]) => quantity !== 0
  );
  return (
    <PanelCard>
      <SectionHeader
        title={store.nombre}
        hint={storeAddress(store)}
        icon={<StorefrontOutlined color="primary" />}
      />
      <Box
        component="details"
        onToggle={(event) => setExpanded((event.currentTarget as HTMLDetailsElement).open)}
        sx={{ p: 2 }}
      >
        <Box
          component="summary"
          sx={{ cursor: 'pointer' }}
        >
          <Typography
            component="span"
            variant="body2"
            fontWeight={600}
          >
            {installed.length
              ? installed
                  .map(
                    ([id, quantity]) =>
                      `${quantity} ${
                        materials.find((material) => material.id === id)?.nombre || id
                      }`
                  )
                  .join(' · ')
              : 'Sin materiales instalados'}
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: 'block', mt: 0.5 }}
          >
            Ver movimientos de esta tienda
          </Typography>
        </Box>
        {expanded && (
          <Stack
            spacing={1.5}
            sx={{ mt: 2 }}
          >
            <QueryFeedback
              pending={result.isPending || result.isFetching}
              error={result.error}
            >
              <MovementTable rows={result.data?.docs || []} />
            </QueryFeedback>
            {!result.error && (
              <PageControls
                result={result.data}
                page={page}
                onChange={setPage}
              />
            )}
            <Box>
              <Button
                type="button"
                variant="contained"
                size="small"
                disabled={busy || !materials.length}
                onClick={() => onRegister(store.id)}
              >
                Registrar salida a esta tienda
              </Button>
            </Box>
          </Stack>
        )}
      </Box>
    </PanelCard>
  );
}

export function StoresView({
  active,
  onRegister,
}: {
  active: boolean;
  onRegister: (id: string) => void;
}) {
  const { stores, busy, write, reportError } = useMaterials();
  const [query, setQuery] = useState('');
  const [newStoreOpen, setNewStoreOpen] = useState(false);
  const [form, setForm] = useState({
    nombre: '',
    direccion: '',
    ciudad: '',
    estado: 'NY',
    zip: '',
  });
  const visibleStores = stores.filter((store) =>
    `${store.nombre} ${storeAddress(store)}`.toLowerCase().includes(query.toLowerCase())
  );
  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const body = Object.fromEntries(
      Object.entries(form).map(([key, value]) => [key, value.trim()])
    ) as api.StoreInput;
    if (!body.nombre || !body.direccion || !body.ciudad || !body.estado) {
      reportError(new Error('Completa el nombre y la ubicación de la tienda.'));
      return;
    }
    await write(
      () => api.createMaterialStore(body),
      'Tienda guardada.',
      () => {
        setForm({ nombre: '', direccion: '', ciudad: '', estado: 'NY', zip: '' });
        setNewStoreOpen(false);
      }
    );
  };
  return (
    <Stack spacing={1.5}>
      <Section
        title="Tiendas"
        icon={<StorefrontOutlined color="primary" />}
        action={
          <ButtonSoft
            type="button"
            size="small"
            disabled={busy}
            onClick={() => setNewStoreOpen(!newStoreOpen)}
            startIcon={<AddRounded />}
          >
            {newStoreOpen ? 'Cerrar formulario' : 'Nueva tienda'}
          </ButtonSoft>
        }
      >
        <TextField
          label="Buscar tienda"
          placeholder="Nombre, ciudad o dirección"
          size="small"
          fullWidth
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        {newStoreOpen && (
          <Stack
            component="form"
            spacing={1.5}
            sx={{ mt: 2 }}
            onSubmit={save}
          >
            <Divider />
            <Box sx={grid2}>
              <TextField
                label="Nombre de la tienda"
                required
                size="small"
                disabled={busy}
                value={form.nombre}
                onChange={(event) => setForm({ ...form, nombre: event.target.value })}
              />
              <TextField
                label="Dirección"
                required
                size="small"
                disabled={busy}
                value={form.direccion}
                onChange={(event) => setForm({ ...form, direccion: event.target.value })}
              />
            </Box>
            <Box sx={grid3}>
              <TextField
                label="Ciudad"
                required
                size="small"
                disabled={busy}
                value={form.ciudad}
                onChange={(event) => setForm({ ...form, ciudad: event.target.value })}
              />
              <TextField
                label="Estado"
                required
                size="small"
                disabled={busy}
                value={form.estado}
                inputProps={{ maxLength: 2 }}
                onChange={(event) => setForm({ ...form, estado: event.target.value.toUpperCase() })}
              />
              <TextField
                label="ZIP"
                size="small"
                disabled={busy}
                inputProps={{ inputMode: 'numeric' }}
                value={form.zip}
                onChange={(event) => setForm({ ...form, zip: event.target.value })}
              />
            </Box>
            <Box>
              <Button
                type="submit"
                variant="contained"
                size="small"
                disabled={busy}
              >
                Guardar tienda
              </Button>
            </Box>
          </Stack>
        )}
      </Section>
      {visibleStores.map((store) => (
        <StoreDetails
          key={store.id}
          store={store}
          active={active}
          onRegister={onRegister}
        />
      ))}
      {!visibleStores.length && (
        <PanelCard>
          <EmptyBlock
            title="Sin tiendas"
            hint={
              stores.length
                ? 'Busca por otro nombre, ciudad o dirección.'
                : 'Crea una tienda para registrar instalaciones y retiros.'
            }
          />
        </PanelCard>
      )}
    </Stack>
  );
}
