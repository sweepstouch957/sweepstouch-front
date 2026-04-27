'use client';

import * as React from 'react';
import {
  alpha,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogContent,
  Divider,
  IconButton,
  Paper,
  Stack,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  AddRounded,
  CloseRounded,
  DevicesRounded,
  Inventory2Outlined,
  PrintRounded,
  RemoveRounded,
} from '@mui/icons-material';

/* ── Types ───────────────────────────────────────────────── */
type QtyMap = Record<string, number>;

type InventoryItem = {
  id: string;
  label: string;
  description?: string;
  price: number;
  image?: string;
};

export type BItem = {
  id: string;
  name: string;
  material: string;
  price: number;
  checked: boolean;
  qty: number;
};

export type EquipmentSection = 'tablets' | 'printers' | 'materials';

/* ── Catalogs ────────────────────────────────────────────── */
export const tabletCatalog: InventoryItem[] = [
  { id: 't9', label: 'Tablet 9"', description: 'Android 64 GB · LTE', price: 200, image: '/images/devices/tablet-9.png' },
  { id: 't14', label: 'Tablet 14"', description: 'Android 128 GB · LTE', price: 500, image: '/images/devices/tablet-14.png' },
];

export const printerCatalog: InventoryItem[] = [
  { id: 'p1', label: 'Impresora térmica', description: 'USB / Bluetooth', price: 200, image: '/images/devices/printer-thermal.png' },
];

export const materialCatalogDefault: BItem[] = [
  { id: 'b-5x5',  name: "Poster 5' x 5'",              material: 'Coroplast', price: 175, checked: false, qty: 0 },
  { id: 'b-2x3',  name: "Poster 2' x 3'",              material: 'Coroplast', price: 42,  checked: false, qty: 0 },
  { id: 'b-4x5',  name: "Poster 4' x 5'",              material: 'Coroplast', price: 140, checked: false, qty: 0 },
  { id: 'b-3x5',  name: "Poster 3' x 5'",              material: 'Coroplast', price: 105, checked: false, qty: 0 },
  { id: 'b-5x7',  name: "Poster 5' x 7'",              material: 'Coroplast', price: 245, checked: false, qty: 0 },
  { id: 'b-7x10', name: "Poster 7' x 10'",             material: 'Coroplast', price: 490, checked: false, qty: 0 },
  { id: 'b-a-sm', name: 'Ánfora acrílica pequeña',     material: 'Acrílico',  price: 250, checked: false, qty: 0 },
  { id: 'b-a-lg', name: 'Ánfora acrílica grande',      material: 'Acrílico',  price: 800, checked: false, qty: 0 },
  { id: 'b-stand',name: 'Stand A (incluye 1 póster)',  material: 'Vinyl',     price: 500, checked: false, qty: 0 },
  { id: 'b-deliv',name: 'Delivery, instalación',       material: '—',         price: 100, checked: false, qty: 0 },
  { id: 'b-setup',name: 'Setup',                       material: '—',         price: 999, checked: false, qty: 0 },
];

/* ── Qty Stepper ─────────────────────────────────────────── */
function QtyStepper({
  value, onChange, min = 0, max = 99,
}: { value: number; onChange: (v: number) => void; min?: number; max?: number }) {
  const theme = useTheme();
  const accent = theme.palette.primary.main;
  return (
    <Stack direction="row" alignItems="center" spacing={0.5} flexShrink={0}>
      <IconButton
        size="small"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        sx={{
          width: 30, height: 30, borderRadius: 1.5,
          border: `1px solid ${theme.palette.divider}`,
          '&:hover:not(:disabled)': { bgcolor: alpha(accent, 0.08) },
        }}
      >
        <RemoveRounded sx={{ fontSize: 14 }} />
      </IconButton>
      <Typography variant="body2" fontWeight={700} sx={{ minWidth: 26, textAlign: 'center' }}>
        {value}
      </Typography>
      <IconButton
        size="small"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        sx={{
          width: 30, height: 30, borderRadius: 1.5,
          border: `1px solid ${theme.palette.divider}`,
          '&:hover:not(:disabled)': { bgcolor: alpha(accent, 0.08) },
        }}
      >
        <AddRounded sx={{ fontSize: 14 }} />
      </IconButton>
    </Stack>
  );
}

/* ── Device product card ─────────────────────────────────── */
function DeviceProductCard({
  item, qty, accent, gradient, onChangeQty,
  imeis, onImeiChange,
}: {
  item: InventoryItem;
  qty: number;
  accent: string;
  gradient: string;
  onChangeQty: (delta: number) => void;
  imeis?: string[];
  onImeiChange?: (index: number, value: string) => void;
}) {
  const theme = useTheme();
  const [imgErr, setImgErr] = React.useState(false);
  const Icon = item.image?.includes('tablet') ? DevicesRounded : PrintRounded;

  return (
    <Paper
      variant="outlined"
      sx={{
        borderRadius: 2.5,
        overflow: 'hidden',
        borderColor: qty > 0 ? alpha(accent, 0.45) : theme.palette.divider,
        bgcolor: qty > 0 ? alpha(accent, 0.02) : 'transparent',
        transition: 'border-color 0.2s, background 0.2s',
      }}
    >
      <Stack direction="row" alignItems="center" p={1.5} spacing={1.5}>
        {/* Product image */}
        <Box
          sx={{
            width: 68, height: 68, borderRadius: 2, overflow: 'hidden', flexShrink: 0,
            bgcolor: theme.palette.mode === 'dark' ? alpha('#fff', 0.06) : 'grey.50',
            border: `1px solid ${theme.palette.divider}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          {item.image && !imgErr ? (
            <Box
              component="img"
              src={item.image}
              alt={item.label}
              onError={() => setImgErr(true)}
              sx={{ width: '100%', height: '100%', objectFit: 'contain', p: 0.75 }}
            />
          ) : (
            <Icon sx={{ fontSize: 30, color: 'text.disabled' }} />
          )}
        </Box>

        {/* Info */}
        <Box flex={1} minWidth={0}>
          <Typography variant="subtitle2" fontWeight={700} lineHeight={1.3}>{item.label}</Typography>
          {item.description && (
            <Typography variant="caption" color="text.secondary" display="block">{item.description}</Typography>
          )}
          <Typography variant="caption" fontWeight={600} sx={{ color: qty > 0 ? accent : 'text.disabled' }}>
            ${item.price.toLocaleString()} c/u
            {qty > 0 && (
              <Box component="span" sx={{ ml: 0.75, color: accent }}>
                · ${(item.price * qty).toLocaleString()} total
              </Box>
            )}
          </Typography>
        </Box>

        {/* Stepper */}
        <QtyStepper value={qty} onChange={(v) => onChangeQty(v - qty)} />
      </Stack>

      {/* IMEI section */}
      {qty > 0 && onImeiChange && (
        <>
          <Divider />
          <Box px={1.5} pb={1.5} pt={1.25}>
            <Typography
              variant="caption"
              fontWeight={700}
              color="text.secondary"
              textTransform="uppercase"
              letterSpacing={0.6}
              display="block"
              mb={1}
            >
              IMEIs — {qty} unidad{qty > 1 ? 'es' : ''}
            </Typography>
            <Stack spacing={0.75}>
              {Array.from({ length: qty }).map((_, i) => (
                <TextField
                  key={i}
                  size="small"
                  fullWidth
                  label={`IMEI ${i + 1}`}
                  value={(imeis ?? [])[i] ?? ''}
                  onChange={(e) => onImeiChange(i, e.target.value)}
                  placeholder="35xxxxxxxxxxxxxxx"
                  inputProps={{ maxLength: 18, style: { fontFamily: 'monospace', fontSize: 12 } }}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }}
                />
              ))}
            </Stack>
          </Box>
        </>
      )}
    </Paper>
  );
}

/* ── Props ───────────────────────────────────────────────── */
export interface EquipmentSectionModalProps {
  open: boolean;
  section: EquipmentSection;
  onClose: () => void;
  onSave: (
    section: EquipmentSection,
    data: {
      tabletQty: QtyMap;
      tabletImei: Record<string, string[]>;
      printerQty: QtyMap;
      materials: BItem[];
    },
  ) => Promise<void>;
  initialTabletQty?: QtyMap;
  initialTabletImei?: Record<string, string[]>;
  initialPrinterQty?: QtyMap;
  initialMaterials?: { id: string; name: string; material: string; price: number; qty: number }[];
}

/* ── Main modal ──────────────────────────────────────────── */
export function EquipmentSectionModal({
  open, section, onClose, onSave,
  initialTabletQty = {}, initialTabletImei = {},
  initialPrinterQty = {}, initialMaterials = [],
}: EquipmentSectionModalProps) {
  const theme = useTheme();
  const smUp = useMediaQuery(theme.breakpoints.up('sm'));
  const [saving, setSaving] = React.useState(false);

  /* section config */
  const sectionCfg = {
    tablets:   { Icon: DevicesRounded,   label: 'Tablets',     desc: 'Selecciona modelos y registra los IMEIs', accent: theme.palette.primary.main, gradient: `linear-gradient(135deg, ${theme.palette.primary.dark}, ${theme.palette.primary.main})` },
    printers:  { Icon: PrintRounded,     label: 'Impresoras',  desc: 'Impresoras térmicas asignadas a la tienda', accent: theme.palette.info.main,    gradient: `linear-gradient(135deg, ${theme.palette.info.dark}, ${theme.palette.info.main})` },
    materials: { Icon: Inventory2Outlined, label: 'Materiales', desc: 'Posters, ánforas, stands y servicios',   accent: theme.palette.success.main, gradient: `linear-gradient(135deg, ${theme.palette.success.dark}, ${theme.palette.success.main})` },
  }[section];

  /* local state */
  const [tabletQty, setTabletQty] = React.useState<QtyMap>(initialTabletQty);
  const [tabletImei, setTabletImei] = React.useState<Record<string, string[]>>(initialTabletImei);
  const [printerQty, setPrinterQty] = React.useState<QtyMap>(initialPrinterQty);

  const buildMaterials = React.useCallback((): BItem[] => {
    const matMap = Object.fromEntries(initialMaterials.map((m) => [m.id, m]));
    return materialCatalogDefault.map((base) => {
      const found = matMap[base.id];
      return found ? { ...base, checked: true, qty: found.qty } : { ...base };
    });
  }, [initialMaterials]);

  const [materials, setMaterials] = React.useState<BItem[]>(buildMaterials);

  /* reset on open */
  React.useEffect(() => {
    if (open) {
      setTabletQty(initialTabletQty);
      setTabletImei(initialTabletImei);
      setPrinterQty(initialPrinterQty);
      setMaterials(buildMaterials());
      setSaving(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  /* handlers */
  const changeTabletQty = (id: string, delta: number) =>
    setTabletQty((p) => ({ ...p, [id]: Math.max(0, (p[id] ?? 0) + delta) }));

  const updateImei = (tabletId: string, index: number, value: string) =>
    setTabletImei((p) => {
      const arr = [...(p[tabletId] ?? [])];
      arr[index] = value;
      return { ...p, [tabletId]: arr };
    });

  const changePrinterQty = (id: string, delta: number) =>
    setPrinterQty((p) => ({ ...p, [id]: Math.max(0, (p[id] ?? 0) + delta) }));

  const toggleMaterial = (id: string) =>
    setMaterials((p) =>
      p.map((m) =>
        m.id === id ? { ...m, checked: !m.checked, qty: !m.checked ? Math.max(1, m.qty) : m.qty } : m
      )
    );

  const changeMaterialQty = (id: string, delta: number) =>
    setMaterials((p) =>
      p.map((m) => (m.id === id ? { ...m, qty: Math.max(0, m.qty + delta) } : m))
    );

  /* totals */
  const tabletTotal = tabletCatalog.reduce((s, t) => s + (tabletQty[t.id] ?? 0) * t.price, 0);
  const printerTotal = printerCatalog.reduce((s, p) => s + (printerQty[p.id] ?? 0) * p.price, 0);
  const materialsTotal = materials.reduce((s, m) => s + (m.checked && m.qty > 0 ? m.qty * m.price : 0), 0);
  const currentTotal =
    section === 'tablets' ? tabletTotal :
    section === 'printers' ? printerTotal :
    materialsTotal;

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(section, { tabletQty, tabletImei, printerQty, materials });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={() => !saving && onClose()}
      maxWidth="sm"
      fullWidth
      fullScreen={!smUp}
      PaperProps={{ sx: { borderRadius: smUp ? 3 : 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' } }}
    >
      {/* ── Gradient banner ─────────────────────── */}
      <Box sx={{ background: sectionCfg.gradient, px: 2.5, py: 2, flexShrink: 0 }}>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Box
            sx={{
              width: 46, height: 46, borderRadius: 2,
              bgcolor: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(4px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', flexShrink: 0,
            }}
          >
            <sectionCfg.Icon sx={{ fontSize: 22 }} />
          </Box>
          <Box flex={1} minWidth={0}>
            <Typography variant="subtitle1" fontWeight={800} color="#fff" lineHeight={1.2}>
              {sectionCfg.label}
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.75)' }}>
              {sectionCfg.desc}
            </Typography>
          </Box>
          <IconButton
            onClick={() => !saving && onClose()}
            disabled={saving}
            size="small"
            sx={{ color: 'rgba(255,255,255,0.85)', '&:hover': { bgcolor: 'rgba(255,255,255,0.12)' } }}
          >
            <CloseRounded />
          </IconButton>
        </Stack>
      </Box>

      {/* ── Scrollable content ──────────────────── */}
      <DialogContent sx={{ p: 2.5, flex: 1, overflowY: 'auto' }}>

        {/* TABLETS */}
        {section === 'tablets' && (
          <Stack spacing={2}>
            {tabletCatalog.map((tablet) => (
              <DeviceProductCard
                key={tablet.id}
                item={tablet}
                qty={tabletQty[tablet.id] ?? 0}
                accent={sectionCfg.accent}
                gradient={sectionCfg.gradient}
                onChangeQty={(delta) => changeTabletQty(tablet.id, delta)}
                imeis={tabletImei[tablet.id]}
                onImeiChange={(i, v) => updateImei(tablet.id, i, v)}
              />
            ))}
          </Stack>
        )}

        {/* PRINTERS */}
        {section === 'printers' && (
          <Stack spacing={2}>
            {printerCatalog.map((printer) => (
              <DeviceProductCard
                key={printer.id}
                item={printer}
                qty={printerQty[printer.id] ?? 0}
                accent={sectionCfg.accent}
                gradient={sectionCfg.gradient}
                onChangeQty={(delta) => changePrinterQty(printer.id, delta)}
              />
            ))}
          </Stack>
        )}

        {/* MATERIALS */}
        {section === 'materials' && (
          <Stack spacing={1}>
            {materials.map((mat) => (
              <Paper
                key={mat.id}
                variant="outlined"
                sx={{
                  borderRadius: 2, overflow: 'hidden',
                  borderColor: mat.checked ? alpha(sectionCfg.accent, 0.45) : theme.palette.divider,
                  bgcolor: mat.checked ? alpha(sectionCfg.accent, 0.025) : 'transparent',
                  transition: 'all 0.18s',
                }}
              >
                <Stack direction="row" alignItems="center" px={1.25} py={1} spacing={0.75}>
                  <Checkbox
                    size="small"
                    checked={mat.checked}
                    onChange={() => toggleMaterial(mat.id)}
                    sx={{
                      p: 0.5, flexShrink: 0,
                      color: alpha(sectionCfg.accent, 0.4),
                      '&.Mui-checked': { color: sectionCfg.accent },
                    }}
                  />
                  <Box flex={1} minWidth={0}>
                    <Typography variant="body2" fontWeight={mat.checked ? 700 : 400} noWrap>
                      {mat.name}
                    </Typography>
                    <Typography variant="caption" color="text.disabled" noWrap>
                      {mat.material} · ${mat.price}
                    </Typography>
                  </Box>
                  {mat.checked && (
                    <Stack direction="row" alignItems="center" spacing={1} flexShrink={0}>
                      <QtyStepper value={mat.qty} min={1} onChange={(v) => changeMaterialQty(mat.id, v - mat.qty)} />
                      <Typography
                        variant="caption"
                        fontWeight={600}
                        sx={{ color: sectionCfg.accent, minWidth: 52, textAlign: 'right' }}
                      >
                        ${(mat.qty * mat.price).toLocaleString()}
                      </Typography>
                    </Stack>
                  )}
                </Stack>
              </Paper>
            ))}
          </Stack>
        )}
      </DialogContent>

      {/* ── Sticky footer ───────────────────────── */}
      <Box
        sx={{
          px: 2.5, py: 2, flexShrink: 0,
          borderTop: `1px solid ${theme.palette.divider}`,
          bgcolor: alpha(sectionCfg.accent, 0.03),
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2,
        }}
      >
        <Box>
          <Typography variant="caption" color="text.secondary" display="block" lineHeight={1.2}>
            Total sección
          </Typography>
          <Typography variant="h6" fontWeight={800} sx={{ color: sectionCfg.accent, lineHeight: 1.3 }}>
            ${currentTotal.toLocaleString()}
          </Typography>
        </Box>
        <Stack direction="row" spacing={1} flexShrink={0}>
          <Button
            onClick={onClose}
            disabled={saving}
            sx={{ borderRadius: 2, textTransform: 'none' }}
          >
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={saving}
            startIcon={saving ? <CircularProgress size={14} color="inherit" /> : null}
            sx={{
              borderRadius: 2, textTransform: 'none',
              background: sectionCfg.gradient,
              boxShadow: `0 4px 14px ${alpha(sectionCfg.accent, 0.35)}`,
              '&:hover': { background: sectionCfg.gradient, filter: 'brightness(1.07)' },
            }}
          >
            {saving ? 'Guardando…' : 'Guardar'}
          </Button>
        </Stack>
      </Box>
    </Dialog>
  );
}
