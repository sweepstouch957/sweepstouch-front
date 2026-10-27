'use client';

import * as api from '@/services/material-control.service';
import AddRounded from '@mui/icons-material/AddRounded';
import DeleteOutlineRounded from '@mui/icons-material/DeleteOutlineRounded';
import SwapHorizRounded from '@mui/icons-material/SwapHorizRounded';
import {
  Alert,
  Box,
  Button,
  IconButton,
  MenuItem,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from '@mui/material';
import { useMemo, useRef, useState, type FormEvent } from 'react';
import { panelDivider } from 'src/components/application-ui/content-shells/store-managment/panel-kit';
import { ButtonSoft } from 'src/components/base/styles/button-soft';
import { useMaterials } from './materials-context';
import { movementReason } from './materials-movement-utils';
import { grid3, rowLayout, Section } from './materials-shared';
import { MaterialStoreSearch } from './materials-store-search';
import {
  localDate,
  movementItems,
  parseSeries,
  reasons,
  storeAddress,
  typeLabels,
  type FormItem,
} from './materials-utils';
import { WarehouseImeis } from './materials-warehouse-imeis';

const materialPriority: Record<string, number> = { tablet: 0, impresora: 1, router: 2 };

export function MovementView({
  active,
  selectedStore,
  setSelectedStore,
  type,
  setType,
}: {
  active: boolean;
  selectedStore: string;
  setSelectedStore: (value: string) => void;
  type: api.MovementKind;
  setType: (value: api.MovementKind) => void;
}) {
  const { materials, stores, inventory, busy, write, reportError } = useMaterials();
  const orderedMaterials = useMemo(
    () =>
      [...materials].sort((a, b) => (materialPriority[a.id] ?? 3) - (materialPriority[b.id] ?? 3)),
    [materials]
  );
  const materialById = useMemo(() => new Map(materials.map((row) => [row.id, row])), [materials]);
  const stockById = useMemo(
    () => new Map(inventory.docs.map((row) => [row.id, row.bodega])),
    [inventory.docs]
  );
  const nextId = useRef(2);
  const makeItem = (id: number): FormItem => ({
    id,
    material: orderedMaterials[0]?.id || '',
    quantity: 1,
    condition: 'buena',
    serialText: '',
  });
  const [items, setItems] = useState<FormItem[]>(() => [makeItem(1)]);
  const [form, setForm] = useState({
    date: localDate(),
    reason: reasons[type][0],
    reasonType: type,
    otherReason: '',
    person: '',
    note: '',
  });
  const reason = form.reasonType === type ? form.reason : reasons[type][0];
  const selectedShop = stores.find((store) => store.id === selectedStore);
  const updateItem = (id: number, patch: Partial<FormItem>) =>
    setItems(items.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  const changeType = (value: api.MovementKind) => {
    setType(value);
    setForm({ ...form, reason: reasons[value][0], reasonType: value, otherReason: '' });
  };
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    let payload: api.MovementInput;
    try {
      if (!form.person.trim() || !form.date || !reason.trim())
        throw new Error('Completa la fecha, el motivo y el responsable.');
      if (type !== 'entrada' && !stores.some((store) => store.id === selectedStore))
        throw new Error('Selecciona una tienda válida.');
      payload = {
        tipo: type,
        fecha: form.date,
        motivo: movementReason(reason, form.otherReason),
        responsable: form.person.trim(),
        tiendaId: type === 'entrada' ? null : selectedStore,
        nota: form.note.trim(),
        items: movementItems(items, materials, type),
      };
    } catch (error) {
      reportError(error);
      return;
    }
    await write(
      () => api.createMovement(payload),
      'Movimiento guardado.',
      () => {
        setForm((current) => ({ ...current, note: '', otherReason: '' }));
        setItems([makeItem(nextId.current++)]);
      }
    );
  };
  const requested = new Map<string, number>();
  for (const item of items) {
    const material = materialById.get(item.material);
    const quantity = material?.serie
      ? parseSeries(item.serialText, material.serie).length
      : item.quantity;
    requested.set(item.material, (requested.get(item.material) || 0) + quantity);
  }
  const stockWarning =
    type === 'salida' &&
    [...requested].some(([id, quantity]) => quantity > (stockById.get(id) ?? 0));
  return (
    <Section
      title="Nuevo movimiento"
      icon={<SwapHorizRounded color="primary" />}
      hint="Entradas, instalaciones y retiros de materiales"
    >
      <Stack
        component="form"
        spacing={2}
        onSubmit={handleSubmit}
      >
        {!materials.length && (
          <Alert severity="info">
            Inicializa el catálogo o agrega un material en Inventario antes de registrar
            movimientos.
          </Alert>
        )}
        <ToggleButtonGroup
          value={type}
          exclusive
          color="primary"
          fullWidth
          disabled={busy}
          aria-label="Tipo de movimiento"
          onChange={(_, value: api.MovementKind | null) => {
            if (value) changeType(value);
          }}
        >
          {(Object.keys(typeLabels) as api.MovementKind[]).map((value, index) => (
            <ToggleButton
              key={value}
              value={value}
            >
              <Stack>
                <Typography
                  variant="body2"
                  fontWeight={600}
                >
                  {typeLabels[value]}
                </Typography>
                <Typography
                  variant="caption"
                  color="text.secondary"
                >
                  {['llega a bodega', 'se instala en tienda', 'vuelve de tienda'][index]}
                </Typography>
              </Stack>
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
        <Box sx={{ ...grid3, alignItems: 'start' }}>
          <TextField
            label="Fecha"
            type="date"
            size="small"
            required
            disabled={busy}
            InputLabelProps={{ shrink: true }}
            value={form.date}
            onChange={(event) => setForm({ ...form, date: event.target.value })}
          />
          <Stack spacing={1.5}>
            <TextField
              label="Motivo"
              select
              size="small"
              disabled={busy}
              value={reason}
              onChange={(event) =>
                setForm({ ...form, reason: event.target.value, reasonType: type, otherReason: '' })
              }
            >
              {reasons[type].map((reason) => (
                <MenuItem
                  key={reason}
                  value={reason}
                >
                  {reason}
                </MenuItem>
              ))}
            </TextField>
            {reason === 'Otro' && (
              <TextField
                label="Especifica el motivo"
                placeholder="Escribe el motivo del movimiento"
                size="small"
                required
                disabled={busy}
                value={form.otherReason}
                onChange={(event) => setForm({ ...form, otherReason: event.target.value })}
              />
            )}
          </Stack>
          <TextField
            label="Técnico / responsable"
            size="small"
            required
            disabled={busy}
            value={form.person}
            onChange={(event) => setForm({ ...form, person: event.target.value })}
          />
        </Box>
        {type !== 'entrada' && (
          <MaterialStoreSearch
            stores={stores}
            required
            disabled={busy}
            value={selectedStore}
            onChange={setSelectedStore}
            helperText={
              selectedShop
                ? storeAddress(selectedShop)
                : 'Crea una tienda en la pestaña Tiendas si todavía no está registrada.'
            }
          />
        )}
        <Typography variant="subtitle2">Materiales</Typography>
        {items.map((item) => {
          const material = materialById.get(item.material);
          return (
            <Stack
              key={item.id}
              spacing={1.5}
              sx={{ pb: 1.5, borderBottom: (theme) => `1px solid ${panelDivider(theme)}` }}
            >
              <Box sx={{ ...grid3, alignItems: 'start' }}>
                <TextField
                  label="Material"
                  select
                  size="small"
                  disabled={busy || !materials.length}
                  value={item.material}
                  onChange={(event) =>
                    updateItem(item.id, {
                      material: event.target.value,
                      serialText: '',
                      quantity: 1,
                    })
                  }
                >
                  <MenuItem value="">Selecciona un material</MenuItem>
                  {orderedMaterials.map((row) => (
                    <MenuItem
                      key={row.id}
                      value={row.id}
                    >
                      {row.nombre}
                    </MenuItem>
                  ))}
                </TextField>
                <TextField
                  label="Cantidad"
                  type="number"
                  size="small"
                  required
                  disabled={busy}
                  inputProps={{ min: 1, step: 1, readOnly: Boolean(material?.serie) }}
                  value={
                    material?.serie
                      ? parseSeries(item.serialText, material.serie).length
                      : item.quantity
                  }
                  onChange={(event) =>
                    updateItem(item.id, { quantity: Number(event.target.value) })
                  }
                  helperText={material?.serie ? 'Calculada según los identificadores.' : undefined}
                />
                <Box sx={rowLayout}>
                  {type === 'retiro' && (
                    <TextField
                      label="Condición"
                      select
                      size="small"
                      disabled={busy}
                      value={item.condition}
                      onChange={(event) =>
                        updateItem(item.id, {
                          condition: event.target.value as FormItem['condition'],
                        })
                      }
                      sx={{ flex: 1 }}
                    >
                      <MenuItem value="buena">Buen estado</MenuItem>
                      <MenuItem value="danado">Dañado</MenuItem>
                    </TextField>
                  )}
                  <Tooltip title="Eliminar material">
                    <span>
                      <IconButton
                        type="button"
                        aria-label="Eliminar material"
                        disabled={busy || items.length === 1}
                        onClick={() => setItems(items.filter((row) => row.id !== item.id))}
                      >
                        <DeleteOutlineRounded />
                      </IconButton>
                    </span>
                  </Tooltip>
                </Box>
              </Box>
              {material?.serie && (
                <Box sx={grid3}>
                  <TextField
                    label={
                      material.serie === 'sim' ? 'Números de SIM e ICCID' : 'IMEI (uno o varios)'
                    }
                    size="small"
                    multiline
                    minRows={3}
                    maxRows={6}
                    placeholder={
                      material.serie === 'sim'
                        ? 'Un SIM por línea; ICCID opcional tras una coma'
                        : 'Ejemplo:\n123456789012345\n123456789012346'
                    }
                    required
                    disabled={busy}
                    value={item.serialText}
                    onChange={(event) => updateItem(item.id, { serialText: event.target.value })}
                    helperText={
                      material.serie === 'sim'
                        ? 'Puedes pegar varios SIM a la vez, uno por línea. Separa el ICCID opcional con coma o punto y coma.'
                        : 'Pega varios IMEI al mismo tiempo, uno por línea y sin duplicados. La cantidad se calcula automáticamente.'
                    }
                  />
                  {type === 'salida' && material.id === 'tablet' && material.serie === 'imei' && (
                    <WarehouseImeis
                      active={active}
                      materialId={material.id}
                      serialText={item.serialText}
                      disabled={busy}
                      reservedImeis={items
                        .filter((row) => row.id !== item.id && row.material === item.material)
                        .flatMap((row) =>
                          parseSeries(row.serialText, 'imei').map((serial) => serial.v)
                        )}
                      onChange={(serialText) => updateItem(item.id, { serialText })}
                    />
                  )}
                </Box>
              )}
            </Stack>
          );
        })}
        {stockWarning && (
          <Alert severity="warning">
            La salida supera las existencias disponibles. El backend permite stock negativo; revisa
            las cantidades antes de guardar.
          </Alert>
        )}
        <Box>
          <ButtonSoft
            type="button"
            size="small"
            disabled={busy || !materials.length}
            startIcon={<AddRounded />}
            onClick={() => setItems([...items, makeItem(nextId.current++)])}
          >
            Agregar otro material
          </ButtonSoft>
        </Box>
        <TextField
          label="Nota"
          multiline
          minRows={3}
          disabled={busy}
          value={form.note}
          onChange={(event) => setForm({ ...form, note: event.target.value })}
        />
        <Box>
          <Button
            type="submit"
            variant="contained"
            disabled={busy || !materials.length || (type !== 'entrada' && !stores.length)}
          >
            Guardar movimiento
          </Button>
        </Box>
      </Stack>
    </Section>
  );
}
