
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
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
  List,
  ListItem,
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
  IconButton,
} from '@mui/material';
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart';
import DevicesIcon from '@mui/icons-material/Devices';
import PrintIcon from '@mui/icons-material/Print';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import PageHeading from '@/components/base/page-heading';

export type CreateStoreStep2Props = {
  onBack?: () => void;
  onSubmit?: (data: any) => void | Promise<void>;
  initialData?: any;
};

type InventoryItem = { id: string; label: string; description?: string; price?: number };
const tabletInventory: InventoryItem[] = [
  { id: 't1', label: 'Tablet 9\" inch', description: 'Android, 64 GB, LTE', price: 200 },
  { id: 't2', label: 'Tablet 14\" inch', description: 'Android, 128 GB, LTE', price: 500 },
  { id: 't3', label: 'iPad 10.2', description: 'Wi‑Fi 64 GB', price: 350 },
];

const printerInventory: InventoryItem[] = [{ id: 'p1', label: 'Impresora térmica', description: 'USB/BT', price: 200 }];

type QuantityMap = Record<string, number>;

function InventoryPicker({
  open,
  onClose,
  title,
  items,
  quantities,
  onApply,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  items: InventoryItem[];
  quantities: QuantityMap;
  onApply: (n: QuantityMap) => void;
}) {
  const [query, setQuery] = React.useState('');
  const [localQty, setLocalQty] = React.useState<QuantityMap>(quantities);
  React.useEffect(() => setLocalQty(quantities), [quantities]);

  const filtered = items.filter(
    (i) =>
      i.label.toLowerCase().includes(query.toLowerCase()) ||
      (i.description ?? '').toLowerCase().includes(query.toLowerCase()),
  );

  const changeQty = (id: string, d: number) =>
    setLocalQty((prev) => ({ ...prev, [id]: Math.max(0, (prev[id] ?? 0) + d) }));
  const setQty = (id: string, v: number) => setLocalQty((prev) => ({ ...prev, [id]: Math.max(0, v) }));

  const lineTotal = (p?: number, q?: number) => (typeof p === 'number' ? p : 0) * (typeof q === 'number' ? q : 0);
  const modalTotal = filtered.reduce((acc, it) => acc + lineTotal(it.price, localQty[it.id] ?? 0), 0);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
    >
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
            const qty = localQty[it.id] ?? 0;
            return (
              <ListItem
                key={it.id}
                alignItems="flex-start"
              >
                <ListItemText
                  primary={`${it.label}${typeof it.price === 'number' ? ` — $${it.price}` : ''}`}
                  secondary={it.description}
                />
                <Stack
                  direction="row"
                  alignItems="center"
                  spacing={1}
                  sx={{ minWidth: 220 }}
                >
                  <IconButton
                    size="small"
                    onClick={() => changeQty(it.id, -1)}
                  >
                    <RemoveIcon fontSize="small" />
                  </IconButton>
                  <TextField
                    type="number"
                    size="small"
                    sx={{ width: 80 }}
                    value={qty}
                    inputProps={{ min: 0 }}
                    onChange={(e) => setQty(it.id, Number(e.target.value || 0))}
                  />
                  <IconButton
                    size="small"
                    onClick={() => changeQty(it.id, 1)}
                  >
                    <AddIcon fontSize="small" />
                  </IconButton>
                  <Box
                    sx={{ ml: 2, minWidth: 80, textAlign: 'right' }}
                  >
                    <Typography variant="body2">
                      <strong>${lineTotal(it.price, qty)}</strong>
                    </Typography>
                  </Box>
                </Stack>
              </ListItem>
            );
          })}
        </List>
      </DialogContent>
      <DialogActions
        sx={{ justifyContent: 'space-between', px: 3 }}
      >
        <Typography variant="subtitle2">Total: ${modalTotal}</Typography>
        <Box>
          <Button
            onClick={onClose}
            sx={{ mr: 1 }}
          >
            Cancelar
          </Button>
          <Button
            variant="contained"
            startIcon={<AddShoppingCartIcon />}
            onClick={() => {
              onApply(localQty);
              onClose();
            }}
          >
            Agregar
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
}

export default function CreateStoreStep2({ onBack, onSubmit }: CreateStoreStep2Props) {
  const router = useRouter();
  const goBack = () => {
    if (onBack) return onBack();
    router.push('/admin/management/stores/create');
  };

  const [tabletQty, setTabletQty] = React.useState<QuantityMap>({});
  const [printerQty, setPrinterQty] = React.useState<QuantityMap>({});
  const [pickTablets, setPickTablets] = React.useState(false);
  const [pickPrinters, setPickPrinters] = React.useState(false);

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
  const changeQty = (id: string, d: number) =>
    setMaterials((rows) =>
      rows.map((r) => (r.id === id ? { ...r, qty: Math.max(0, (r.qty ?? 0) + d), checked: (r.qty ?? 0) + d > 0 || r.checked } : r)),
    );
  const setQty = (id: string, v: number) =>
    setMaterials((rows) => rows.map((r) => (r.id === id ? { ...r, qty: Math.max(0, v), checked: v > 0 || r.checked } : r)));

  const summarizeQty = (items: InventoryItem[], qmap: QuantityMap) =>
    items
      .filter((i) => (qmap[i.id] ?? 0) > 0)
      .map((i) => `${i.label} x ${qmap[i.id]}`)
      .join(', ') || '—';

  const lineTotal = (p?: number, q?: number) => (typeof p === 'number' ? p : 0) * (typeof q === 'number' ? q : 0);
  const grandTotal = materials.reduce((a, r) => a + lineTotal(r.price, r.qty), 0);

  const equipmentTotal =
    tabletInventory.reduce((acc, i) => acc + lineTotal(i.price, tabletQty[i.id] ?? 0), 0) +
    printerInventory.reduce((acc, i) => acc + lineTotal(i.price, printerQty[i.id] ?? 0), 0);

  return (
    <Container
      maxWidth="md"
      sx={{ py: 3 }}
    >
      <PageHeading
        title="Create Store — Step 2 (Equipos y Materiales)"
        description="Selecciona tablets, impresoras y materiales para la nueva tienda."
      />
      <Card>
        <CardContent>
          <Box>
            <Typography
              variant="h6"
              sx={{ fontWeight: 600, mb: 1 }}
            >
              Sección A: Equipos
            </Typography>
            <Divider sx={{ mb: 2 }} />

            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={2}
              alignItems="center"
              sx={{ mb: 2 }}
            >
              <DevicesIcon />
              <Box sx={{ flex: 1 }}>
                <Typography variant="subtitle1">Tablets</Typography>
                <Typography sx={{ mt: 1 }}>
                  <strong>Seleccionadas:</strong> {summarizeQty(tabletInventory, tabletQty)}
                </Typography>
              </Box>
              <Button
                variant="outlined"
                onClick={() => setPickTablets(true)}
              >
                Agregar
              </Button>
            </Stack>

            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={2}
              alignItems="center"
              sx={{ mb: 3 }}
            >
              <PrintIcon />
              <Box sx={{ flex: 1 }}>
                <Typography variant="subtitle1">Impresora térmica</Typography>
                <Typography sx={{ mt: 1 }}>
                  <strong>Seleccionadas:</strong> {summarizeQty(printerInventory, printerQty)}
                </Typography>
              </Box>
              <Button
                variant="outlined"
                onClick={() => setPickPrinters(true)}
              >
                Agregar
              </Button>
            </Stack>

            <Typography
              variant="body2"
              sx={{ textAlign: 'right', color: 'text.secondary' }}
            >
              Total equipos: <strong>${equipmentTotal}</strong>
            </Typography>
          </Box>

          <Box sx={{ mt: 4 }}>
            <Typography
              variant="h6"
              sx={{ fontWeight: 600, mb: 1 }}
            >
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
                    <TableRow
                      key={row.id}
                      hover
                    >
                      <TableCell>{row.product}</TableCell>
                      <TableCell>{row.material ?? '—'}</TableCell>
                      <TableCell>{typeof row.price === 'number' ? `$${row.price}` : '—'}</TableCell>
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={row.checked}
                          onChange={() => toggleMaterial(row.id)}
                        />
                      </TableCell>
                      <TableCell>
                        <Stack
                          direction="row"
                          alignItems="center"
                          spacing={1}
                        >
                          <IconButton
                            size="small"
                            onClick={() => changeQty(row.id, -1)}
                          >
                            <RemoveIcon fontSize="small" />
                          </IconButton>
                          <TextField
                            type="number"
                            size="small"
                            sx={{ width: 80 }}
                            value={row.qty}
                            inputProps={{ min: 0 }}
                            onChange={(e) => setQty(row.id, Number(e.target.value || 0))}
                          />
                          <IconButton
                            size="small"
                            onClick={() => changeQty(row.id, 1)}
                          >
                            <AddIcon fontSize="small" />
                          </IconButton>
                        </Stack>
                      </TableCell>
                      <TableCell>{`$${lineTotal(row.price, row.qty)}`}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      align="right"
                    >
                      <strong>Total general (materiales)</strong>
                    </TableCell>
                    <TableCell>
                      <strong>{`$${grandTotal}`}</strong>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Box>

          <Stack
            direction="row"
            justifyContent="space-between"
            spacing={2}
            sx={{ mt: 3 }}
          >
            <Button
              variant="outlined"
              onClick={goBack}
            >
              Atrás
            </Button>
            <Button
              variant="contained"
              onClick={() => onSubmit?.({ tablets: tabletQty, printers: printerQty, materials })}
            >
              Guardar y continuar
            </Button>
          </Stack>
        </CardContent>
      </Card>

      <InventoryPicker
        open={pickTablets}
        onClose={() => setPickTablets(false)}
        title="Seleccionar tablets del inventario"
        items={tabletInventory}
        quantities={tabletQty}
        onApply={setTabletQty}
      />
      <InventoryPicker
        open={pickPrinters}
        onClose={() => setPickPrinters(false)}
        title="Seleccionar impresora térmica"
        items={printerInventory}
        quantities={printerQty}
        onApply={setPrinterQty}
      />
    </Container>
  );
}
