'use client';

import * as api from '@/services/material-control.service';
import AddRounded from '@mui/icons-material/AddRounded';
import HistoryRounded from '@mui/icons-material/HistoryRounded';
import Inventory2Outlined from '@mui/icons-material/Inventory2Outlined';
import {
  Box,
  Button,
  Divider,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { useState, type FormEvent } from 'react';
import {
  EmptyBlock,
  KpiCard,
  KpiRow,
  StatusPill,
} from 'src/components/application-ui/content-shells/store-managment/panel-kit';
import ConfirmDialog from 'src/components/base/confirm-dialog';
import { ButtonSoft } from 'src/components/base/styles/button-soft';
import { useMaterials } from './materials-context';
import { grid2, MovementTable, rowLayout, Section } from './materials-shared';
import { defaultCatalog, materialSlug } from './materials-utils';

export function InventoryView() {
  const { inventory, materials, recent, busy, write, reportError } = useMaterials();
  const [editor, setEditor] = useState<{ open: boolean; minimums: Record<string, number> }>({
    open: false,
    minimums: {},
  });
  const [initializeOpen, setInitializeOpen] = useState(false);
  const [newMaterial, setNewMaterial] = useState<{ name: string; serial: api.SerialKind }>({
    name: '',
    serial: '',
  });
  const openEditor = () =>
    setEditor({
      open: !editor.open,
      minimums: Object.fromEntries(materials.map((row) => [row.id, row.minimo])),
    });
  const save = async () => {
    const items = materials.map((row) => ({
      id: row.id,
      nombre: row.nombre,
      serie: row.serie,
      minimo: editor.minimums[row.id] ?? row.minimo,
    }));
    if (items.some((row) => !Number.isInteger(row.minimo) || row.minimo < 0)) {
      reportError(new Error('Los mínimos deben ser enteros iguales o mayores que cero.'));
      return;
    }
    await write(
      () => api.saveMinimums(items),
      'Mínimos guardados.',
      () => setEditor({ open: false, minimums: {} })
    );
  };
  const addMaterial = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const name = newMaterial.name.trim();
    const id = materialSlug(name);
    if (!name || !id) {
      reportError(new Error('Ingresa un nombre de material válido.'));
      return;
    }
    if (materials.some((row) => row.id === id || row.nombre.toLowerCase() === name.toLowerCase())) {
      reportError(new Error('Ese material ya existe.'));
      return;
    }
    await write(
      () => api.createMaterial({ id, nombre: name, minimo: 0, serie: newMaterial.serial }),
      'Material agregado.',
      () => setNewMaterial({ name: '', serial: '' })
    );
  };
  const totals = inventory.totals;
  return (
    <Stack spacing={1.5}>
      <KpiRow>
        <KpiCard
          label="En bodega"
          value={totals.bodega}
        />
        <KpiCard
          label="Instalado en tiendas"
          value={totals.tiendas}
        />
        <KpiCard
          label="Retirado dañado"
          value={totals.danados}
        />
        <KpiCard
          label="Bajo mínimo"
          value={totals.bajoMinimo}
          tone="warning"
          delta="Materiales que requieren reposición"
        />
      </KpiRow>
      <Section
        title="Existencias por material"
        icon={<Inventory2Outlined color="primary" />}
        hint="Stock = entradas − salidas + retiros en buen estado"
        action={
          materials.length > 0 && (
            <ButtonSoft
              type="button"
              size="small"
              disabled={busy}
              onClick={openEditor}
            >
              {editor.open ? 'Cancelar mínimos' : 'Editar mínimos'}
            </ButtonSoft>
          )
        }
      >
        {!inventory.docs.length ? (
          <Stack spacing={1.5}>
            <EmptyBlock
              title="Catálogo vacío"
              hint="Agrega tu primer material o inicializa el catálogo estándar para comenzar."
            />
            {!materials.length && (
              <Box>
                <Button
                  type="button"
                  variant="contained"
                  size="small"
                  disabled={busy}
                  onClick={() => setInitializeOpen(true)}
                >
                  Inicializar catálogo estándar
                </Button>
              </Box>
            )}
          </Stack>
        ) : (
          <TableContainer>
            <Table
              size="small"
              aria-label="Inventario de materiales"
            >
              <TableHead>
                <TableRow>
                  <TableCell>Material</TableCell>
                  {['En bodega', 'En tiendas', 'Dañados', 'Mínimo'].map((label) => (
                    <TableCell
                      key={label}
                      align="right"
                    >
                      {label}
                    </TableCell>
                  ))}
                  <TableCell>Estado</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {inventory.docs.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>
                      <Typography
                        variant="body2"
                        fontWeight={600}
                      >
                        {row.nombre}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography
                        variant="body1"
                        fontWeight={700}
                      >
                        {row.bodega}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">{row.tiendas}</TableCell>
                    <TableCell align="right">{row.danados}</TableCell>
                    <TableCell align="right">{row.minimo}</TableCell>
                    <TableCell>
                      <StatusPill
                        label={
                          row.bodega <= 0
                            ? 'Sin stock'
                            : row.estado === 'bajo_minimo'
                              ? 'Bajo mínimo'
                              : 'OK'
                        }
                        tone={
                          row.bodega <= 0
                            ? 'error'
                            : row.estado === 'bajo_minimo'
                              ? 'warning'
                              : 'success'
                        }
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
        {editor.open && (
          <Stack
            spacing={1.5}
            sx={{ mt: 2 }}
          >
            <Divider />
            <Typography
              variant="body2"
              color="text.secondary"
            >
              Los mínimos se aplican al inventario cuando guardes los cambios.
            </Typography>
            <Box sx={grid2}>
              {materials.map((row) => (
                <TextField
                  key={row.id}
                  label={row.nombre}
                  type="number"
                  size="small"
                  disabled={busy}
                  inputProps={{ min: 0, step: 1 }}
                  value={editor.minimums[row.id] ?? row.minimo}
                  onChange={(event) =>
                    setEditor({
                      ...editor,
                      minimums: { ...editor.minimums, [row.id]: Number(event.target.value) },
                    })
                  }
                />
              ))}
            </Box>
            <Box>
              <Button
                type="button"
                variant="contained"
                size="small"
                disabled={busy}
                onClick={save}
              >
                Guardar mínimos
              </Button>
            </Box>
          </Stack>
        )}
      </Section>
      <Section
        title="Agregar material"
        icon={<AddRounded color="primary" />}
      >
        <Stack
          component="form"
          spacing={1.5}
          onSubmit={addMaterial}
        >
          <Box sx={grid2}>
            <TextField
              label="Nombre del material"
              size="small"
              required
              disabled={busy}
              placeholder="Ej. Soportes de pared"
              value={newMaterial.name}
              onChange={(event) => setNewMaterial({ ...newMaterial, name: event.target.value })}
              helperText={
                newMaterial.name ? `Identificador: ${materialSlug(newMaterial.name)}` : undefined
              }
            />
            <TextField
              label="Número de serie"
              select
              size="small"
              disabled={busy}
              value={newMaterial.serial}
              onChange={(event) =>
                setNewMaterial({ ...newMaterial, serial: event.target.value as api.SerialKind })
              }
            >
              <MenuItem value="">Sin número de serie</MenuItem>
              <MenuItem value="imei">Registrar IMEI</MenuItem>
              <MenuItem value="sim">Registrar número de SIM</MenuItem>
            </TextField>
          </Box>
          <Box sx={rowLayout}>
            <Button
              type="submit"
              variant="contained"
              size="small"
              disabled={busy}
            >
              Agregar material
            </Button>
          </Box>
        </Stack>
      </Section>
      <Section
        title="Últimos movimientos"
        icon={<HistoryRounded color="primary" />}
      >
        <MovementTable rows={recent} />
      </Section>
      <ConfirmDialog
        open={initializeOpen}
        title="Inicializar catálogo"
        description="Se crearán los nueve materiales estándar con sus mínimos y tipos de serie. Las existencias comenzarán en cero y se calcularán a partir de los movimientos que registres."
        confirmLabel="Inicializar catálogo"
        severity="primary"
        loading={busy}
        onClose={() => setInitializeOpen(false)}
        onConfirm={() => {
          void write(
            async () => {
              const current = await api.getAllMaterials();
              if (current.length)
                throw new Error(
                  'El catálogo ya contiene materiales. Actualiza la vista antes de continuar.'
                );
              await api.saveMinimums(defaultCatalog);
            },
            'Catálogo inicializado.',
            () => setInitializeOpen(false)
          );
        }}
      />
    </Stack>
  );
}
