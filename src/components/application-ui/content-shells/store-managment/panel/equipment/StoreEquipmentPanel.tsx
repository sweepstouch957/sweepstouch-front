'use client';

import * as React from 'react';
import {
  Box,
  Breadcrumbs,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
  useTheme,
} from '@mui/material';
import DevicesIcon from '@mui/icons-material/Devices';
import PrintIcon from '@mui/icons-material/Print';
import EditIcon from '@mui/icons-material/Edit';
import CloseIcon from '@mui/icons-material/Close';
import InventoryIcon from '@mui/icons-material/Inventory2Outlined';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

import type { EquipmentItem, MaterialItem, Store } from '@/services/store.service';
import { updateStorePatch } from '@/services/store.service';
import CreateStoreStep2 from '@/components/admin/stores/CreateStoreStep2';

/* ─── Props ─────────────────────────────────────────────────────────────── */
interface Props {
  store: Store;
  storeId: string;
}

/* ─────────────────────────────────────────────────────────────────────────
 * Normaliza el campo equipment que puede venir de 2 formatos desde el backend:
 *   A) Array plano (nuevo):  [{ id, label, qty, price, type }, ...]
 *   B) Objeto (viejo):        { tablets: [...], printers: [...] }
 * ─────────────────────────────────────────────────────────────────────── */
function normalizeEquipment(raw: any): EquipmentItem[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw as EquipmentItem[];

  // Formato objeto { tablets, printers }
  const tablets: EquipmentItem[] = (raw.tablets ?? []).map((t: any) => ({
    ...t,
    type: 'tablet' as const,
  }));
  const printers: EquipmentItem[] = (raw.printers ?? []).map((p: any) => ({
    ...p,
    type: 'printer' as const,
  }));
  return [...tablets, ...printers];
}

/* ─── Device summary card ──────────────────────────────────────────────── */
function DeviceCard({
  icon,
  label,
  items,
}: {
  icon: React.ReactNode;
  label: string;
  items: EquipmentItem[];
}) {
  const theme = useTheme();
  const totalQty = items.reduce((s, i) => s + (i.qty ?? 0), 0);
  const totalPrice = items.reduce((s, i) => s + (i.qty ?? 0) * (i.price ?? 0), 0);

  if (totalQty === 0) return null;

  return (
    <Card
      variant="outlined"
      sx={{
        borderRadius: 2,
        background:
          theme.palette.mode === 'dark'
            ? 'rgba(255,255,255,0.04)'
            : 'rgba(0,0,0,0.02)',
      }}
    >
      <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
        <Stack direction="row" spacing={1.5} alignItems="center" mb={1.5}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 1.5,
              bgcolor: 'primary.main',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
            }}
          >
            {icon}
          </Box>
          <Box>
            <Typography variant="subtitle2" fontWeight={700}>
              {label}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {totalQty} unid. &nbsp;·&nbsp; ${totalPrice.toLocaleString()} total
            </Typography>
          </Box>
        </Stack>

        <Stack spacing={0.75}>
          {items.map((it, idx) => (
            <Stack
              key={it.id ?? idx}
              direction="row"
              justifyContent="space-between"
              alignItems="center"
            >
              <Typography variant="body2" color="text.secondary">
                {it.label ?? it.id ?? '—'}
              </Typography>
              <Stack direction="row" spacing={1} alignItems="center">
                <Chip label={`x${it.qty}`} size="small" />
                <Typography variant="caption" color="text.secondary">
                  ${((it.qty ?? 0) * (it.price ?? 0)).toLocaleString()}
                </Typography>
              </Stack>
            </Stack>
          ))}
        </Stack>
      </CardContent>
    </Card>
  );
}

/* ─── Empty-state hint card ─────────────────────────────────────────────── */
function EmptyHint({
  icon,
  title,
  description,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
}) {
  const theme = useTheme();
  return (
    <Card
      variant="outlined"
      onClick={onClick}
      sx={{
        borderRadius: 2,
        borderStyle: 'dashed',
        cursor: 'pointer',
        transition: 'border-color 0.2s, box-shadow 0.2s',
        '&:hover': {
          borderColor: 'primary.main',
          boxShadow: `0 0 0 2px ${theme.palette.primary.main}22`,
        },
      }}
    >
      <CardContent
        sx={{
          p: 3,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          gap: 1,
          '&:last-child': { pb: 3 },
        }}
      >
        <Box sx={{ color: 'text.disabled', fontSize: 40, lineHeight: 1 }}>{icon}</Box>
        <Typography variant="subtitle2" fontWeight={700} color="text.secondary">
          {title}
        </Typography>
        <Typography variant="caption" color="text.disabled">
          {description}
        </Typography>
        <Box
          sx={{
            mt: 0.5,
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
            color: 'primary.main',
            fontWeight: 600,
            fontSize: '0.8rem',
          }}
        >
          <AddCircleOutlineIcon fontSize="small" />
          Agregar
        </Box>
      </CardContent>
    </Card>
  );
}

/* ─── Main panel ────────────────────────────────────────────────────────── */
export function StoreEquipmentPanel({ store, storeId }: Props) {
  const queryClient = useQueryClient();
  const [editOpen, setEditOpen] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  // Normalizar equipment (puede ser array o { tablets, printers })
  const equipment: EquipmentItem[] = React.useMemo(
    () => normalizeEquipment((store as any).equipment),
    [store],
  );
  const materials: MaterialItem[] = React.useMemo(
    () => (Array.isArray(store.materials) ? store.materials : []),
    [store],
  );

  const tablets = equipment.filter((e) => e.type === 'tablet');
  const printers = equipment.filter((e) => e.type === 'printer');

  const hasTablets = tablets.length > 0 && tablets.some((t) => t.qty > 0);
  const hasPrinters = printers.length > 0 && printers.some((p) => p.qty > 0);
  const hasMaterials = materials.length > 0;
  const hasData = hasTablets || hasPrinters || hasMaterials;

  /* Build initialData for CreateStoreStep2 */
  const step2InitialData = React.useMemo(() => {
    const tabletQty: Record<string, number> = {};
    const printerQty: Record<string, number> = {};

    equipment.forEach((e) => {
      if (e.type === 'tablet') tabletQty[e.id] = e.qty ?? 0;
      else printerQty[e.id] = e.qty ?? 0;
    });

    const initialBIds = [
      'b-5x5', 'b-2x3', 'b-4x5', 'b-3x5', 'b-5x7',
      'b-7x10', 'b-a-sm', 'b-a-lg', 'b-stand', 'b-deliv', 'b-setup',
    ];
    const matMap: Record<string, MaterialItem> = {};
    materials.forEach((m) => { matMap[m.id] = m; });

    const sectionB = initialBIds.map((id) => {
      const found = matMap[id];
      return {
        id,
        name: found?.name ?? id,
        material: found?.material ?? '—',
        price: found?.price ?? 0,
        checked: !!found,
        qty: found?.qty ?? 0,
      };
    });

    return { tabletQty, printerQty, sectionB };
  }, [equipment, materials]);

  const handleSave = async (step2Data: any) => {
    setSaving(true);
    try {
      await updateStorePatch(storeId, {
        equipment: step2Data.equipment,
        materials: step2Data.materials,
        equipmentTotal: step2Data.equipmentTotal,
        sectionBTotal: step2Data.sectionBTotal,
        grandTotal: step2Data.grandTotal,
      });
      await queryClient.invalidateQueries({ queryKey: ['store', storeId] });
      toast.success('Equipamiento actualizado');
      setEditOpen(false);
    } catch (err: any) {
      toast.error(err?.response?.data?.error ?? 'Error al actualizar equipamiento');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box p={3}>
      {/* ── Breadcrumbs ─────────────────────────────────────── */}
      <Breadcrumbs sx={{ mb: 2 }} aria-label="breadcrumb">
        <Typography variant="caption" color="text.secondary">
          {store.name}
        </Typography>
        <Typography variant="caption" color="text.primary" fontWeight={600}>
          Equipamiento
        </Typography>
      </Breadcrumbs>

      {/* ── Header ──────────────────────────────────────────── */}
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={3}>
        <Box>
          <Typography variant="h5" fontWeight={700}>
            Equipamiento
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Tablets, impresoras y materiales asignados a esta tienda
          </Typography>
        </Box>
        {hasData && (
          <Button
            variant="contained"
            startIcon={<EditIcon />}
            onClick={() => setEditOpen(true)}
            sx={{ borderRadius: 2, textTransform: 'none' }}
          >
            Editar
          </Button>
        )}
      </Stack>

      {/* ── Empty state: hint cards ───────────────────────────── */}
      {!hasData && (
        <Grid container spacing={2} mb={3}>
          <Grid item xs={12} sm={4}>
            <EmptyHint
              icon={<DevicesIcon fontSize="inherit" />}
              title="Sin tablets"
              description={"No hay tablets asignadas. Agrega Tablet 9\" o 14\" desde el catálogo."} onClick={() => setEditOpen(true)}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <EmptyHint
              icon={<PrintIcon fontSize="inherit" />}
              title="Sin impresoras"
              description="No hay impresoras térmicas asignadas a esta tienda."
              onClick={() => setEditOpen(true)}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <EmptyHint
              icon={<InventoryIcon fontSize="inherit" />}
              title="Sin materiales"
              description="No hay posters, ánforas ni stands asignados."
              onClick={() => setEditOpen(true)}
            />
          </Grid>
        </Grid>
      )}

      {/* ── Section A: Devices ──────────────────────────────── */}
      {(hasTablets || hasPrinters) && (
        <>
          <Typography
            variant="subtitle1"
            fontWeight={700}
            mb={1.5}
            sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
          >
            <DevicesIcon fontSize="small" /> Dispositivos
          </Typography>

          <Grid container spacing={2} mb={3}>
            {hasTablets && (
              <Grid item xs={12} sm={6}>
                <DeviceCard
                  icon={<DevicesIcon fontSize="small" />}
                  label="Tablets"
                  items={tablets}
                />
              </Grid>
            )}
            {hasPrinters && (
              <Grid item xs={12} sm={6}>
                <DeviceCard
                  icon={<PrintIcon fontSize="small" />}
                  label="Impresoras"
                  items={printers}
                />
              </Grid>
            )}
          </Grid>
        </>
      )}

      {/* ── Section B: Materials ────────────────────────────── */}
      {hasMaterials && (
        <>
          <Divider sx={{ mb: 2.5 }} />
          <Typography
            variant="subtitle1"
            fontWeight={700}
            mb={1.5}
            sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
          >
            <InventoryIcon fontSize="small" /> Materiales adicionales
          </Typography>

          <Box
            sx={{
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 2,
              overflow: 'hidden',
            }}
          >
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: 'action.hover' }}>
                  <TableCell sx={{ fontWeight: 700 }}>Producto</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Material</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>P/U</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>Cant.</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>Total</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {materials.map((m, idx) => (
                  <TableRow key={m.id ?? idx} hover>
                    <TableCell>{m.name}</TableCell>
                    <TableCell>{m.material}</TableCell>
                    <TableCell align="right">${m.price}</TableCell>
                    <TableCell align="right">{m.qty}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>
                      ${(m.qty * m.price).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        </>
      )}

      {/* ── Totals ──────────────────────────────────────────── */}
      {hasData && (
        <Stack
          direction="row"
          justifyContent="flex-end"
          spacing={3}
          mt={2.5}
          flexWrap="wrap"
        >
          {(store.equipmentTotal ?? 0) > 0 && (
            <Typography variant="body2" color="text.secondary">
              Equipos: <strong>${(store.equipmentTotal ?? 0).toLocaleString()}</strong>
            </Typography>
          )}
          {(store.sectionBTotal ?? 0) > 0 && (
            <Typography variant="body2" color="text.secondary">
              Materiales: <strong>${(store.sectionBTotal ?? 0).toLocaleString()}</strong>
            </Typography>
          )}
          {(store.grandTotal ?? 0) > 0 && (
            <Typography variant="body2" fontWeight={700}>
              Grand Total: ${(store.grandTotal ?? 0).toLocaleString()}
            </Typography>
          )}
        </Stack>
      )}

      {/* ── Edit Dialog ─────────────────────────────────────── */}
      <Dialog
        open={editOpen}
        onClose={() => !saving && setEditOpen(false)}
        maxWidth="lg"
        fullWidth
        scroll="paper"
      >
        <DialogTitle sx={{ pr: 6, fontWeight: 700 }}>
          {hasData ? 'Editar equipamiento' : 'Agregar equipamiento'}
        </DialogTitle>
        <IconButton
          onClick={() => setEditOpen(false)}
          disabled={saving}
          sx={{ position: 'absolute', right: 8, top: 8 }}
        >
          <CloseIcon />
        </IconButton>
        <DialogContent dividers sx={{ p: 0 }}>
          <CreateStoreStep2
            initialData={step2InitialData}
            onBack={() => setEditOpen(false)}
            onSubmit={handleSave}
          />
        </DialogContent>
      </Dialog>
    </Box>
  );
}
