'use client';
/* eslint-disable react/jsx-max-props-per-line */

import * as React from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Checkbox,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
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
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart';
import DevicesIcon from '@mui/icons-material/Devices';
import PrintIcon from '@mui/icons-material/Print';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import PageHeading from '@/components/base/page-heading';

// ======================
// 🔸 Tipos de datos
// ======================
type InventoryItem = {
  id: string;
  label: string;
  description?: string;
  price?: number;
};

type DeviceSelection = {
  selected: boolean;
  imei?: string;   // tablets only
  serie?: string;  // tablets & printers
};

type DeviceSelectionMap = Record<string, DeviceSelection>;

interface CreateStoreStep2Props {
  onBack: () => void;
  onSubmit: (data: any) => Promise<void>;
  initialData?: any;
}

// ======================
// 🔹 Inventario Mock
// ======================
const tabletInventory: InventoryItem[] = [
  { id: 't1', label: "Tablet 9\" inch", description: 'Android, 64 GB, LTE', price: 200 },
  { id: 't2', label: "Tablet 14\" inch", description: 'Android, 128 GB, LTE', price: 500 },
  { id: 't3', label: 'iPad 10.2', description: 'Wi-Fi 64 GB', price: 350 },
];

const printerInventory: InventoryItem[] = [
  { id: 'p1', label: 'Impresora térmica 80mm', description: 'USB + BT', price: 200 },
  { id: 'p2', label: 'Impresora térmica 58mm', description: 'USB', price: 150 },
  { id: 'p3', label: 'Impresora de inyección', description: 'Color', price: 180 },
];

// ======================
// 🔸 Componente Picker
// ======================
function InventoryPicker({
  open,
  onClose,
  title,
  items,
  selections,
  onApply,
  mode, // 'tablet' | 'printer'
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  items: InventoryItem[];
  selections: DeviceSelectionMap;
  onApply: (next: DeviceSelectionMap) => void;
  mode: 'tablet' | 'printer';
}) {
  const [query, setQuery] = React.useState('');
  const [localSel, setLocalSel] = React.useState<DeviceSelectionMap>(selections);

  React.useEffect(() => setLocalSel(selections), [selections]);

  const filtered = items.filter(
    (i) =>
      i.label.toLowerCase().includes(query.toLowerCase()) ||
      (i.description ?? '').toLowerCase().includes(query.toLowerCase())
  );

  const toggle = (id: string) =>
    setLocalSel((prev) => ({
      ...prev,
      [id]: { selected: !prev[id]?.selected, imei: prev[id]?.imei ?? '', serie: prev[id]?.serie ?? '' },
    }));

  const setField = (id: string, field: 'imei' | 'serie', value: string) =>
    setLocalSel((prev) => ({
      ...prev,
      [id]: { ...prev[id], [field]: value, selected: prev[id]?.selected ?? true },
    }));

  const isValid = (): boolean => {
    return Object.entries(localSel).every(([_, sel]) => {
      if (!sel?.selected) return true;
      if (mode === 'tablet') return !!sel.imei && !!sel.serie;
      return !!sel.serie;
    });
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <TextField
          fullWidth
          size="small"
          margin="dense"
          placeholder="Buscar en inventario..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <List dense>
          {filtered.map((it) => {
            const sel = localSel[it.id] ?? { selected: false, imei: '', serie: '' };
            return (
              <ListItem key={it.id} alignItems="flex-start">
                <ListItemIcon>
                  <Checkbox checked={!!sel.selected} onChange={() => toggle(it.id)} />
                </ListItemIcon>
                <ListItemText
                  primary={`${it.label}${typeof it.price === 'number' ? ` — $${it.price}` : ''}`}
                  secondary={it.description}
                />
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, ml: 2, minWidth: 220 }}>
                  {mode === 'tablet' && (
                    <TextField
                      size="small"
                      label="IMEI"
                      value={sel.imei ?? ''}
                      onChange={(e) => setField(it.id, 'imei', e.target.value)}
                      disabled={!sel.selected}
                      required
                    />
                  )}
                  <TextField
                    size="small"
                    label="Serie"
                    value={sel.serie ?? ''}
                    onChange={(e) => setField(it.id, 'serie', e.target.value)}
                    disabled={!sel.selected}
                    required
                  />
                </Box>
              </ListItem>
            );
          })}
        </List>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button
          variant="contained"
          onClick={() => {
            if (!isValid()) return;
            onApply(localSel);
            onClose();
          }}
          startIcon={<AddShoppingCartIcon />}
        >
          Agregar seleccionados
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ======================
// 🔸 Componente Principal
// ======================
export default function CreateStoreStep2({
  onBack,
  onSubmit,
  initialData,
}: CreateStoreStep2Props): React.JSX.Element {
  const [tabletSelections, setTabletSelections] = React.useState<DeviceSelectionMap>(
    initialData?.tablets ?? {}
  );
  const [printerSelections, setPrinterSelections] = React.useState<DeviceSelectionMap>(
    initialData?.printers ?? {}
  );
  const [pickTablets, setPickTablets] = React.useState(false);
  const [pickPrinters, setPickPrinters] = React.useState(false);

  // materiales
  type MaterialRow = {
    id: string;
    product: string;
    material?: string;
    price?: number;
    checked: boolean;
    qty: number;
  };

  const [materials, setMaterials] = React.useState<MaterialRow[]>(
    initialData?.materials ?? [
      { id: 'm1', product: "Poster 5' x 5'", material: 'Coroplast', price: 175, checked: false, qty: 0 },
      { id: 'm2', product: "Poster 2' x 3'", material: 'Coroplast', price: 42, checked: false, qty: 0 },
      { id: 'm3', product: "Poster 4' x 5'", material: 'Coroplast', price: 140, checked: false, qty: 0 },
    ]
  );

  const toggleMaterial = (id: string) =>
    setMaterials((rows) => rows.map((r) => (r.id === id ? { ...r, checked: !r.checked } : r)));

  const changeQty = (id: string, delta: number) =>
    setMaterials((rows) =>
      rows.map((r) => {
        if (r.id !== id) return r;
        const next = Math.max(0, (r.qty ?? 0) + delta);
        return { ...r, qty: next, checked: next > 0 ? true : r.checked };
      })
    );

  const setQty = (id: string, value: number) =>
    setMaterials((rows) =>
      rows.map((r) => (r.id === id ? { ...r, qty: Math.max(0, value), checked: value > 0 ? true : r.checked } : r))
    );

  const summarize = (items: InventoryItem[], map: DeviceSelectionMap) =>
    items
      .filter((i) => map[i.id]?.selected)
      .map((i) => {
        const s = map[i.id];
        if (!s) return i.label;
        if (s.imei) return `${i.label} (IMEI: ${s.imei}, Serie: ${s.serie})`;
        return `${i.label} (Serie: ${s.serie})`;
      })
      .join(', ') || '—';

  const lineTotal = (price?: number, qty?: number) => (price ?? 0) * (qty ?? 0);
  const grandTotal = materials.reduce((acc, r) => acc + lineTotal(r.price, r.qty), 0);

  return (
    <Container maxWidth="md" sx={{ py: 3 }}>
      <PageHeading title="" description="" />
      <Card>
        <CardContent>
          {/* Sección A */}
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
              Sección A: Equipos
            </Typography>
            <Divider sx={{ mb: 2 }} />

            {/* Tablets */}
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center" sx={{ mb: 2 }}>
              <DevicesIcon />
              <Box sx={{ flex: 1 }}>
                <Typography variant="subtitle1">Tablets</Typography>
                <Typography sx={{ mt: 1 }}>
                  <strong>Seleccionadas:</strong> {summarize(tabletInventory, tabletSelections)}
                </Typography>
              </Box>
              <Button variant="outlined" onClick={() => setPickTablets(true)}>
                Elegir del inventario
              </Button>
            </Stack>

            {/* Printers */}
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center" sx={{ mb: 3 }}>
              <PrintIcon />
              <Box sx={{ flex: 1 }}>
                <Typography variant="subtitle1">Impresoras</Typography>
                <Typography sx={{ mt: 1 }}>
                  <strong>Seleccionadas:</strong> {summarize(printerInventory, printerSelections)}
                </Typography>
              </Box>
              <Button variant="outlined" onClick={() => setPickPrinters(true)}>
                Elegir del inventario
              </Button>
            </Stack>
          </Box>

          {/* Sección B */}
          <Box sx={{ mt: 4 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
              Sección B: Posters y Materiales
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Producto</TableCell>
                    <TableCell>Material</TableCell>
                    <TableCell>Precio</TableCell>
                    <TableCell>Seleccionar</TableCell>
                    <TableCell>Cantidad</TableCell>
                    <TableCell>Total</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {materials.map((row) => (
                    <TableRow key={row.id} hover>
                      <TableCell>{row.product}</TableCell>
                      <TableCell>{row.material ?? '—'}</TableCell>
                      <TableCell>{typeof row.price === 'number' ? `$${row.price}` : '—'}</TableCell>
                      <TableCell>
                        <Checkbox checked={row.checked} onChange={() => toggleMaterial(row.id)} />
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <IconButton size="small" onClick={() => changeQty(row.id, -1)}>
                            <RemoveIcon fontSize="small" />
                          </IconButton>
                          <TextField
                            type="number"
                            size="small"
                            value={row.qty}
                            inputProps={{ min: 0 }}
                            onChange={(e) => setQty(row.id, Number(e.target.value || 0))}
                            sx={{ width: 80 }}
                          />
                          <IconButton size="small" onClick={() => changeQty(row.id, 1)}>
                            <AddIcon fontSize="small" />
                          </IconButton>
                        </Stack>
                      </TableCell>
                      <TableCell>{`$${lineTotal(row.price, row.qty)}`}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow>
                    <TableCell colSpan={5} align="right">
                      <strong>Total general</strong>
                    </TableCell>
                    <TableCell>
                      <strong>{`$${grandTotal}`}</strong>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Box>

          {/* Botones navegación */}
          <Stack direction="row" justifyContent="flex-end" spacing={2} sx={{ mt: 3 }}>
            <Button variant="outlined" onClick={onBack}>
              Atrás
            </Button>
            <Button
              variant="contained"
              onClick={() => onSubmit({ tablets: tabletSelections, printers: printerSelections, materials })}
            >
              Guardar y continuar
            </Button>
          </Stack>
        </CardContent>
      </Card>




      {/* Pickers */}
      <InventoryPicker
        open={pickTablets}
        onClose={() => setPickTablets(false)}
        title="Seleccionar tablets del inventario"
        items={tabletInventory}
        selections={tabletSelections}
        onApply={setTabletSelections}
        mode="tablet"
      />
      <InventoryPicker
        open={pickPrinters}
        onClose={() => setPickPrinters(false)}
        title="Seleccionar impresoras del inventario"
        items={printerInventory}
        selections={printerSelections}
        onApply={setPrinterSelections}
        mode="printer"
      />
    </Container>
  );
}
