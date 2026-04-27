'use client';

import * as React from 'react';
import {
  alpha,
  Box,
  Chip,
  Divider,
  Grid,
  Paper,
  Stack,
  Typography,
  useTheme,
} from '@mui/material';
import {
  AddCircleOutlineRounded,
  DevicesRounded,
  EditRounded,
  Inventory2Outlined,
  PrintRounded,
} from '@mui/icons-material';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

import type { EquipmentItem, MaterialItem, Store } from '@/services/store.service';
import { updateStorePatch } from '@/services/store.service';
import {
  type BItem,
  type EquipmentSection,
  EquipmentSectionModal,
  materialCatalogDefault,
  printerCatalog,
  tabletCatalog,
} from './EquipmentSectionModal';

/* ─── Props ─────────────────────────────────────────────────────────────── */
interface Props {
  store: Store;
  storeId: string;
}

/* ─── normalize equipment (array or { tablets, printers } object) ────── */
function normalizeEquipment(raw: any): EquipmentItem[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw as EquipmentItem[];
  const tablets: EquipmentItem[] = (raw.tablets ?? []).map((t: any) => ({
    ...t, type: 'tablet' as const, imei: Array.isArray(t.imei) ? t.imei : [],
  }));
  const printers: EquipmentItem[] = (raw.printers ?? []).map((p: any) => ({
    ...p, type: 'printer' as const,
  }));
  return [...tablets, ...printers];
}

/* ─── Section category card ─────────────────────────────────────────────── */
function EquipmentCard({
  icon,
  label,
  accent,
  gradient,
  items,
  total,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  accent: string;
  gradient: string;
  items: { label: string; qty: number; detail?: string; imeis?: string[] }[];
  total: number;
  onClick: () => void;
}) {
  const theme = useTheme();
  const isEmpty = items.length === 0;

  return (
    <Paper
      component="button"
      onClick={onClick}
      variant="outlined"
      sx={{
        all: 'unset',
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        boxSizing: 'border-box',
        borderRadius: 3,
        overflow: 'hidden',
        cursor: 'pointer',
        border: `1px solid ${isEmpty ? alpha(accent, 0.2) : alpha(accent, 0.38)}`,
        transition: 'all 0.2s ease',
        bgcolor: 'background.paper',
        '&:hover': {
          borderColor: accent,
          boxShadow: `0 6px 28px ${alpha(accent, 0.18)}`,
          transform: 'translateY(-3px)',
        },
        '&:focus-visible': {
          outline: `2px solid ${accent}`,
          outlineOffset: 2,
        },
      }}
    >
      {/* Top gradient bar */}
      <Box sx={{ height: 4, background: gradient, flexShrink: 0 }} />

      {/* Header */}
      <Box px={2.25} pt={2} pb={1.25}>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          {/* Icon box */}
          <Box
            sx={{
              width: 46, height: 46, borderRadius: 2, flexShrink: 0,
              bgcolor: isEmpty ? alpha(accent, 0.07) : alpha(accent, 0.12),
              border: isEmpty ? `1.5px dashed ${alpha(accent, 0.3)}` : `1.5px solid ${alpha(accent, 0.28)}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: accent,
            }}
          >
            {icon}
          </Box>

          <Box flex={1} minWidth={0}>
            <Typography variant="subtitle1" fontWeight={800} lineHeight={1.2}>
              {label}
            </Typography>
            <Typography variant="caption" color={isEmpty ? 'text.disabled' : 'text.secondary'} sx={{ lineHeight: 1.3, display: 'block' }}>
              {isEmpty
                ? 'Sin asignar'
                : `${items.reduce((s, i) => s + i.qty, 0)} unidades`}
            </Typography>
          </Box>

          {!isEmpty && (
            <Chip
              label={`$${total.toLocaleString()}`}
              size="small"
              sx={{
                height: 22, fontSize: 11, fontWeight: 700,
                bgcolor: alpha(accent, 0.1),
                color: accent,
                border: `1px solid ${alpha(accent, 0.25)}`,
                '& .MuiChip-label': { px: 1 },
                flexShrink: 0,
              }}
            />
          )}
        </Stack>
      </Box>

      <Divider sx={{ mx: 2.25, borderColor: alpha(accent, 0.12) }} />

      {/* Body */}
      <Box px={2.25} py={1.75} flex={1}>
        {isEmpty ? (
          <Stack alignItems="center" justifyContent="center" py={1.5} spacing={1}>
            <Typography variant="body2" color="text.disabled" textAlign="center" fontSize={13}>
              Ningún elemento asignado
            </Typography>
            <Box
              sx={{
                display: 'inline-flex', alignItems: 'center', gap: 0.5,
                color: accent, fontWeight: 700, fontSize: '0.8rem',
                px: 1.5, py: 0.4, borderRadius: 99,
                border: `1px solid ${alpha(accent, 0.3)}`,
                bgcolor: alpha(accent, 0.06),
              }}
            >
              <AddCircleOutlineRounded sx={{ fontSize: 14 }} />
              Agregar
            </Box>
          </Stack>
        ) : (
          <Stack spacing={0.6}>
            {items.map((item, i) => (
              <Box key={i}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2" color="text.secondary" noWrap sx={{ maxWidth: '65%', fontSize: 13 }}>
                    {item.label}
                  </Typography>
                  <Stack direction="row" spacing={0.75} alignItems="center">
                    {item.detail && (
                      <Typography variant="caption" color="text.disabled">{item.detail}</Typography>
                    )}
                    <Chip
                      label={`×${item.qty}`}
                      size="small"
                      sx={{
                        height: 18, fontSize: 10, fontWeight: 700,
                        bgcolor: alpha(accent, 0.1), color: accent,
                        '& .MuiChip-label': { px: 0.75 },
                      }}
                    />
                  </Stack>
                </Stack>
                {item.imeis && item.imeis.filter(Boolean).length > 0 && (
                  <Stack direction="row" flexWrap="wrap" gap={0.5} mt={0.4}>
                    {item.imeis.filter(Boolean).slice(0, 2).map((imei, j) => (
                      <Chip
                        key={j}
                        label={`${imei.slice(0, 12)}…`}
                        size="small"
                        variant="outlined"
                        sx={{ fontSize: '0.6rem', fontFamily: 'monospace', height: 17, '& .MuiChip-label': { px: 0.5 } }}
                      />
                    ))}
                    {item.imeis.filter(Boolean).length > 2 && (
                      <Typography variant="caption" color="text.disabled" fontSize={10}>
                        +{item.imeis.filter(Boolean).length - 2} más
                      </Typography>
                    )}
                  </Stack>
                )}
              </Box>
            ))}
          </Stack>
        )}
      </Box>

      {/* Footer */}
      {!isEmpty && (
        <Box
          sx={{
            px: 2.25, py: 1.1, flexShrink: 0,
            borderTop: `1px solid ${alpha(accent, 0.1)}`,
            bgcolor: alpha(accent, 0.03),
            display: 'flex', justifyContent: 'flex-end', alignItems: 'center',
          }}
        >
          <Box
            sx={{
              display: 'inline-flex', alignItems: 'center', gap: 0.5,
              color: accent, fontWeight: 600, fontSize: '0.78rem',
            }}
          >
            <EditRounded sx={{ fontSize: 13 }} />
            Editar
          </Box>
        </Box>
      )}
    </Paper>
  );
}

/* ─── Main panel ────────────────────────────────────────────────────────── */
export function StoreEquipmentPanel({ store, storeId }: Props) {
  const theme = useTheme();
  const queryClient = useQueryClient();
  const [openModal, setOpenModal] = React.useState<EquipmentSection | null>(null);

  /* normalize data */
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

  /* Build initialData for modal */
  const initialTabletQty = React.useMemo(() => {
    const map: Record<string, number> = {};
    tablets.forEach((t) => { map[t.id] = t.qty ?? 0; });
    return map;
  }, [tablets]);

  const initialTabletImei = React.useMemo(() => {
    const map: Record<string, string[]> = {};
    tablets.forEach((t) => {
      const imeis = (t as any).imei;
      if (Array.isArray(imeis) && imeis.length) map[t.id] = imeis;
    });
    return map;
  }, [tablets]);

  const initialPrinterQty = React.useMemo(() => {
    const map: Record<string, number> = {};
    printers.forEach((p) => { map[p.id] = p.qty ?? 0; });
    return map;
  }, [printers]);

  /* Card items */
  const tabletCardItems = tablets
    .filter((t) => (t.qty ?? 0) > 0)
    .map((t) => ({ label: t.label ?? t.id, qty: t.qty, detail: `$${t.price}`, imeis: (t as any).imei }));

  const printerCardItems = printers
    .filter((p) => (p.qty ?? 0) > 0)
    .map((p) => ({ label: p.label ?? p.id, qty: p.qty, detail: `$${p.price}` }));

  const materialCardItems = materials.map((m) => ({
    label: m.name, qty: m.qty, detail: m.material,
  }));

  const equipmentTotal = equipment.reduce((s, e) => s + (e.qty ?? 0) * (e.price ?? 0), 0);
  const materialsTotal = materials.reduce((s, m) => s + m.qty * m.price, 0);
  const tabletTotal = tablets.reduce((s, t) => s + (t.qty ?? 0) * (t.price ?? 0), 0);
  const printerTotal = printers.reduce((s, p) => s + (p.qty ?? 0) * (p.price ?? 0), 0);

  /* Save handler */
  const handleSectionSave = async (
    section: EquipmentSection,
    data: { tabletQty: Record<string, number>; tabletImei: Record<string, string[]>; printerQty: Record<string, number>; materials: BItem[] },
  ) => {
    let newEquipment = [...equipment];
    let newMaterials = materials;

    if (section === 'tablets') {
      const nonTablets = equipment.filter((e) => e.type === 'printer');
      const newTablets = tabletCatalog
        .filter((t) => (data.tabletQty[t.id] ?? 0) > 0)
        .map((t) => ({
          id: t.id, label: t.label, description: t.description,
          qty: data.tabletQty[t.id], price: t.price,
          type: 'tablet' as const,
          imei: (data.tabletImei[t.id] ?? []).filter(Boolean),
        }));
      newEquipment = [...nonTablets, ...newTablets];
    } else if (section === 'printers') {
      const nonPrinters = equipment.filter((e) => e.type === 'tablet');
      const newPrinters = printerCatalog
        .filter((p) => (data.printerQty[p.id] ?? 0) > 0)
        .map((p) => ({
          id: p.id, label: p.label, description: p.description,
          qty: data.printerQty[p.id], price: p.price,
          type: 'printer' as const,
        }));
      newEquipment = [...nonPrinters, ...newPrinters];
    } else {
      newMaterials = data.materials
        .filter((m) => m.checked && m.qty > 0)
        .map(({ id, name, material, price, qty }) => ({ id, name, material, price, qty }));
    }

    const newEquipmentTotal = newEquipment.reduce((s, e) => s + (e.qty ?? 0) * (e.price ?? 0), 0);
    const newSectionBTotal = newMaterials.reduce((s, m) => s + m.qty * m.price, 0);

    await updateStorePatch(storeId, {
      equipment: newEquipment,
      materials: newMaterials,
      equipmentTotal: newEquipmentTotal,
      sectionBTotal: newSectionBTotal,
      grandTotal: newEquipmentTotal + newSectionBTotal,
    });
    await queryClient.invalidateQueries({ queryKey: ['store', storeId] });

    const labels = { tablets: 'Tablets', printers: 'Impresoras', materials: 'Materiales' };
    toast.success(`${labels[section]} actualizados`);
    setOpenModal(null);
  };

  /* Accent colors */
  const tabletAccent  = theme.palette.primary.main;
  const printerAccent = theme.palette.info.main;
  const matAccent     = theme.palette.success.main;

  const tabletGrad  = `linear-gradient(135deg, ${theme.palette.primary.dark}, ${theme.palette.primary.main})`;
  const printerGrad = `linear-gradient(135deg, ${theme.palette.info.dark}, ${theme.palette.info.main})`;
  const matGrad     = `linear-gradient(135deg, ${theme.palette.success.dark}, ${theme.palette.success.main})`;

  const grandTotal = equipmentTotal + materialsTotal;

  return (
    <Box p={{ xs: 2, md: 3 }}>

      {/* ── Page title ───────────────────────── */}
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2.5} flexWrap="wrap" gap={1}>
        <Box>
          <Typography variant="subtitle1" fontWeight={800} lineHeight={1.2}>
            Equipamiento
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Toca una tarjeta para agregar o editar
          </Typography>
        </Box>
        {grandTotal > 0 && (
          <Chip
            label={`Grand Total $${grandTotal.toLocaleString()}`}
            variant="outlined"
            size="small"
            sx={{ fontWeight: 700, fontSize: 12, borderRadius: 99 }}
          />
        )}
      </Stack>

      {/* ── 3 cards ──────────────────────────── */}
      <Grid container spacing={2}>
        <Grid item xs={12} sm={4}>
          <EquipmentCard
            icon={<DevicesRounded sx={{ fontSize: 22 }} />}
            label="Tablets"
            accent={tabletAccent}
            gradient={tabletGrad}
            items={tabletCardItems}
            total={tabletTotal}
            onClick={() => setOpenModal('tablets')}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <EquipmentCard
            icon={<PrintRounded sx={{ fontSize: 22 }} />}
            label="Impresoras"
            accent={printerAccent}
            gradient={printerGrad}
            items={printerCardItems}
            total={printerTotal}
            onClick={() => setOpenModal('printers')}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <EquipmentCard
            icon={<Inventory2Outlined sx={{ fontSize: 22 }} />}
            label="Materiales"
            accent={matAccent}
            gradient={matGrad}
            items={materialCardItems}
            total={materialsTotal}
            onClick={() => setOpenModal('materials')}
          />
        </Grid>
      </Grid>

      {/* ── Modals ───────────────────────────── */}
      <EquipmentSectionModal
        open={openModal === 'tablets'}
        section="tablets"
        onClose={() => setOpenModal(null)}
        onSave={handleSectionSave}
        initialTabletQty={initialTabletQty}
        initialTabletImei={initialTabletImei}
        initialPrinterQty={initialPrinterQty}
        initialMaterials={materials}
      />
      <EquipmentSectionModal
        open={openModal === 'printers'}
        section="printers"
        onClose={() => setOpenModal(null)}
        onSave={handleSectionSave}
        initialTabletQty={initialTabletQty}
        initialTabletImei={initialTabletImei}
        initialPrinterQty={initialPrinterQty}
        initialMaterials={materials}
      />
      <EquipmentSectionModal
        open={openModal === 'materials'}
        section="materials"
        onClose={() => setOpenModal(null)}
        onSave={handleSectionSave}
        initialTabletQty={initialTabletQty}
        initialTabletImei={initialTabletImei}
        initialPrinterQty={initialPrinterQty}
        initialMaterials={materials}
      />
    </Box>
  );
}
