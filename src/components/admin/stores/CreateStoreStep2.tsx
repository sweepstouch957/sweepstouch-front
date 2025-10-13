'use client';

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
  FormControlLabel,
  Checkbox,
  IconButton,
  InputAdornment,
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

type InventoryItem = {
  id: string;
  label: string;
  description?: string;
  price?: number;
};

// ---- MOCK DATA (replace later with API) ----
const tabletInventory: InventoryItem[] = [
  { id: 't1', label: "Tablet 9\" inch", description: 'Android, 64 GB, LTE', price: 200 },
  { id: 't2', label: "Tablet 14\" inch", description: 'Android, 128 GB, LTE', price: 500 },
  { id: 't3', label: 'iPad 10.2', description: 'Wi‑Fi 64 GB', price: 350 },
];

const printerInventory: InventoryItem[] = [
  { id: 'p1', label: 'Impresora térmica 80mm', description: 'USB + BT', price: 200 },
  { id: 'p2', label: 'Impresora térmica 58mm', description: 'USB', price: 150 },
  { id: 'p3', label: 'Impresora de inyección', description: 'Color', price: 180 },
];

type DeviceSelection = {
  selected: boolean;
  imei?: string;   // tablets only (required when selected)
  serie?: string;  // tablets & printers (required when selected)
};
type DeviceSelectionMap = Record<string, DeviceSelection>;

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
    setLocalSel((prev) => ({ ...prev, [id]: { ...prev[id], [field]: value, selected: prev[id]?.selected ?? true } }));

  const isValid = (): boolean => {
    // Validate required fields for selected items
    return Object.entries(localSel).every(([id, sel]) => {
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
              <ListItem
                key={it.id}
                alignItems="flex-start"
                secondaryAction={
                  <Checkbox
                    edge="end"
                    checked={!!sel.selected}
                    onChange={() => toggle(it.id)}
                  />
                }
              >
                <ListItemIcon>
                  <Checkbox edge="start" checked={!!sel.selected} tabIndex={-1} onChange={() => toggle(it.id)} />
                </ListItemIcon>
                <ListItemText
                  primary={`${it.label}${typeof it.price === 'number' ? ` — $${it.price}` : ''}`}
                  secondary={it.description}
                />
                {/* Inline fields for required info when selected */}
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
            if (!isValid()) return; // simple guard
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

export default function CreateStoreStep2(): React.JSX.Element {
  // Local state for selected devices/materials
  const [tabletSelections, setTabletSelections] = React.useState<DeviceSelectionMap>({});
  const [printerSelections, setPrinterSelections] = React.useState<DeviceSelectionMap>({});
  const [pickTablets, setPickTablets] = React.useState(false);
  const [pickPrinters, setPickPrinters] = React.useState(false);

  // Section B materials
  type MaterialRow = { id: string; product: string; material?: string; price?: number; checked: boolean; qty: number };
  const [materials, setMaterials] = React.useState<MaterialRow[]>([
    { id: 'm1', product: "Poster 5' x 5'", material: 'Coroplast', price: 175, checked: false, qty: 0 },
    { id: 'm2', product: "Poster 2' x 3'", material: 'Coroplast', price: 42, checked: false, qty: 0 },
    { id: 'm3', product: "Poster 4' x 5'", material: 'Coroplast', price: 140, checked: false, qty: 0 },
    { id: 'm4', product: "Poster 3' x 5'", material: 'Coroplast', price: 105, checked: false, qty: 0 },
    { id: 'm5', product: "Poster 5' x 7'", material: 'Coroplast', price: 245, checked: false, qty: 0 },
    { id: 'm6', product: "Poster 7' x 10'", material: 'Coroplast', price: 490, checked: false, qty: 0 },
    { id: 'm7', product: 'Ánfora acrílica pequeña', material: 'Acrílico', price: 250, checked: false, qty: 0 },
    { id: 'm8', product: 'Ánfora acrílica grande', material: 'Acrílico', price: 800, checked: false, qty: 0 },
    { id: 'm9', product: 'Stand A (incluye 1 póster)', material: 'Vinyl', price: 500, checked: false, qty: 0 },
    { id: 'm10', product: 'Delivery, instalación', material: '—', price: 100, checked: false, qty: 0 },
    { id: 'm11', product: 'Setup', material: '—', price: 999, checked: false, qty: 0 },
  ]);

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

  // Helpers to render selected devices summary
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

  const lineTotal = (price?: number, qty?: number) => {
    const p = typeof price === 'number' ? price : 0;
    const q = typeof qty === 'number' ? qty : 0;
    return p * q;
  };

  const grandTotal = materials.reduce((acc, r) => acc + lineTotal(r.price, r.qty), 0);

  return (
    <Container maxWidth="md" sx={{ py: 3 }}>
      <PageHeading
        title="Create Store — Step 2 (Equipos y Materiales)"
        description="Selecciona tablets, impresoras y materiales para la nueva tienda"
      />
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
                  {/* Footer row with Grand Total */}
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

          <Stack direction="row" justifyContent="flex-end" spacing={2} sx={{ mt: 3 }}>
            <Button variant="outlined">Cancelar</Button>
            <Button variant="contained">Guardar y continuar</Button>
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
