'use client';
import * as React from 'react';
import {
  Box,
  Container,
  Typography,
  Stack,
  Button,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  TextField,
  Card as MuiCard,
  CardContent as MuiCardContent,
  CardMedia,
  Divider,
  Checkbox,
} from '@mui/material';
import DevicesIcon from '@mui/icons-material/Devices';
import PrintIcon from '@mui/icons-material/Print';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { useRouter } from 'next/navigation';

type InventoryItem = {
  id: string;
  label: string;
  description?: string;
  price: number;
  image?: string;
};

type QtyMap = Record<string, number>;

const tabletInventory: InventoryItem[] = [
  { id: 't9', label: 'Tablet 9" inch', description: 'Android, 64 GB, LTE', price: 200, image: '/images/devices/tablet-9.png' },
  { id: 't14', label: 'Tablet 14" inch', description: 'Android, 128 GB, LTE', price: 500, image: '/images/devices/tablet-14.png' },
];

const printerInventory: InventoryItem[] = [
  { id: 'p1', label: 'Impresora térmica', description: 'USB/BT', price: 200, image: '/images/devices/printer-thermal.png' },
];

/** ===== Sección B (lista demo con los items de la captura) ===== */
type BItem = { id: string; name: string; material: string; price: number; checked: boolean; qty: number };
const initialBItems: BItem[] = [
  { id: 'b-5x5', name: `Poster 5' x 5'`, material: 'Coroplast', price: 175, checked: false, qty: 0 },
  { id: 'b-2x3', name: `Poster 2' x 3'`, material: 'Coroplast', price: 42, checked: false, qty: 0 },
  { id: 'b-4x5', name: `Poster 4' x 5'`, material: 'Coroplast', price: 140, checked: false, qty: 0 },
  { id: 'b-3x5', name: `Poster 3' x 5'`, material: 'Coroplast', price: 105, checked: false, qty: 0 },
  { id: 'b-5x7', name: `Poster 5' x 7'`, material: 'Coroplast', price: 245, checked: false, qty: 0 },
  { id: 'b-7x10', name: `Poster 7' x 10'`, material: 'Coroplast', price: 490, checked: false, qty: 0 },
  { id: 'b-a-sm', name: 'Ánfora acrílica pequeña', material: 'Acrílico', price: 250, checked: false, qty: 0 },
  { id: 'b-a-lg', name: 'Ánfora acrílica grande', material: 'Acrílico', price: 800, checked: false, qty: 0 },
  { id: 'b-stand', name: 'Stand A (incluye 1 póster)', material: 'Vinyl', price: 500, checked: false, qty: 0 },
  { id: 'b-deliv', name: 'Delivery, instalación', material: '—', price: 100, checked: false, qty: 0 },
  { id: 'b-setup', name: 'Setup', material: '—', price: 999, checked: false, qty: 0 },
];

/* Utils */
function selectedWithQty(items: InventoryItem[], qmap: QtyMap) {
  return items.filter(i => (qmap[i.id] ?? 0) > 0).map(i => ({ ...i, qty: qmap[i.id] ?? 0 }));
}
// duplica por cantidad para renderizar una card por unidad
function expandByQty<T extends { id: string; qty: number }>(items: T[]) {
  return items.flatMap((it) => Array.from({ length: it.qty }).map((_, i) => ({ ...it, uid: `${it.id}-${i}` })));
}

function ItemCardCompact({
  title, desc, price, image, onRemove,
}: { title: string; desc?: string; price: number; image?: string; onRemove?: () => void }) {
  return (
    <MuiCard variant="outlined"
      sx={{ display: 'flex', alignItems: 'stretch', height: 96 }}>
      {image ? (
        <CardMedia component="img"
          image={image}
          alt={title}
          sx={{ width: 120, height: '100%', objectFit: 'cover', borderRight: '1px solid', borderColor: 'divider' }} />
      ) : <Box sx={{ width: 120, height: '100%', bgcolor: 'action.hover' }} />}
      <MuiCardContent sx={{ p: 1.25, flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Typography variant="body2"
          sx={{ fontWeight: 600, lineHeight: 1.2 }}>{title}</Typography>
        {desc && <Typography variant="caption"
          sx={{ color: 'text.secondary', mt: 0.25 }}>{desc}</Typography>}
        <Box sx={{ mt: 'auto', display: 'flex', alignItems: 'center' }}>
          <Typography variant="caption">${price} c/u</Typography>
          <Box sx={{ ml: 'auto' }}>
            <IconButton size="small"
              onClick={onRemove}
              aria-label="Eliminar">
              <DeleteOutlineIcon fontSize="small" />
            </IconButton>
          </Box>
        </Box>
      </MuiCardContent>
    </MuiCard>
  );
}

type Props = {
  /** lo envía el stepper padre */
  onBack?: () => void;
  onSubmit?: (data: any) => void | Promise<void>;
  initialData?: {
    tabletQty?: QtyMap;
    printerQty?: QtyMap;
    sectionB?: BItem[];
  };
};

export default function CreateStoreStep2({ onBack, onSubmit, initialData }: Props) {
  const router = useRouter();

  /** Sección A */
  const [tabletQty, setTabletQty] = React.useState<QtyMap>(initialData?.tabletQty ?? {});
  const [printerQty, setPrinterQty] = React.useState<QtyMap>(initialData?.printerQty ?? {});
  const [openTablets, setOpenTablets] = React.useState(false);
  const [openPrinters, setOpenPrinters] = React.useState(false);

  const changeQty = (
    setter: React.Dispatch<React.SetStateAction<QtyMap>>,
    map: QtyMap,
    id: string,
    delta: number,
  ) => setter({ ...map, [id]: Math.max(0, (map[id] ?? 0) + delta) });

  const equipmentTotal = React.useMemo(() => {
    const all = [...tabletInventory, ...printerInventory];
    const allQty: QtyMap = { ...tabletQty, ...printerQty };
    return Object.entries(allQty).reduce((acc, [id, qty]) => {
      const item = all.find(i => i.id === id);
      return acc + (item?.price ?? 0) * qty;
    }, 0);
  }, [tabletQty, printerQty]);

  /** Sección B (restaurada) */
  const [sectionB, setSectionB] = React.useState<BItem[]>(initialData?.sectionB ?? initialBItems);
  const sectionBTotal = sectionB.reduce((acc, it) => acc + (it.checked ? it.qty * it.price : 0), 0);

  /** Guardar todo el step 2 */
  const handleSave = async () => {
    const payload = {
      tabletQty,
      printerQty,
      sectionB,
      equipmentTotal,
      sectionBTotal,
      grandTotal: equipmentTotal + sectionBTotal,
    };
    await onSubmit?.(payload);
  };

  const handleBack = () => {
    if (onBack) return onBack();
    router.back();
  };

  return (
    <Container maxWidth="lg"
      sx={{ py: 3 }}>
      <Typography variant="h6"
        sx={{ mb: 2, fontWeight: 600 }}>Equipos y Materiales</Typography>

      {/* ====== Sección A: Tablets ====== */}
      <Stack direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        alignItems="center"
        sx={{ mb: 1.5 }}>
        <DevicesIcon />
        <Box sx={{ flex: 1 }}>
          <Typography variant="subtitle1">Tablets</Typography>
          <Typography variant="body2"
            sx={{ color: 'text.secondary' }}>Selecciona la cantidad desde el inventario</Typography>
        </Box>
        <Button variant="outlined"
          onClick={() => setOpenTablets(true)}>Agregar</Button>
      </Stack>

      <Grid container
        spacing={1.5}>
        {expandByQty(selectedWithQty(tabletInventory, tabletQty)).map((it) => (
          <Grid key={it.uid}
            item
            xs={12}
            sm={6}
            md={4}>
            <ItemCardCompact
              title={it.label}
              desc={it.description}
              price={it.price}
              image={it.image}
              onRemove={() => setTabletQty(prev => ({ ...prev, [it.id]: Math.max(0, (prev[it.id] ?? 0) - 1) }))}
            />
          </Grid>
        ))}
      </Grid>

      {/* ====== Sección A: Impresora térmica ====== */}
      <Stack direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        alignItems="center"
        sx={{ mt: 2.5, mb: 1.5 }}>
        <PrintIcon />
        <Box sx={{ flex: 1 }}>
          <Typography variant="subtitle1">Impresora térmica</Typography>
          <Typography variant="body2"
            sx={{ color: 'text.secondary' }}>Selecciona la cantidad desde el inventario</Typography>
        </Box>
        <Button variant="outlined"
          onClick={() => setOpenPrinters(true)}>Agregar</Button>
      </Stack>

      <Grid container
        spacing={1.5}>
        {expandByQty(selectedWithQty(printerInventory, printerQty)).map((it) => (
          <Grid key={it.uid}
            item
            xs={12}
            sm={6}
            md={4}>
            <ItemCardCompact
              title={it.label}
              desc={it.description}
              price={it.price}
              image={it.image}
              onRemove={() => setPrinterQty(prev => ({ ...prev, [it.id]: Math.max(0, (prev[it.id] ?? 0) - 1) }))}
            />
          </Grid>
        ))}
      </Grid>

      <Typography variant="body2"
        sx={{ textAlign: 'right', mt: 2, color: 'text.secondary' }}>
        Total equipos: <strong>${equipmentTotal}</strong>
      </Typography>

      {/* ===== Modales de selección ===== */}
      <Dialog open={openTablets}
        onClose={() => setOpenTablets(false)}
        maxWidth="sm"
        fullWidth>
        <DialogTitle sx={{ pr: 6 }}>Seleccionar tablets del inventario</DialogTitle>
        <IconButton onClick={() => setOpenTablets(false)}
          sx={{ position: 'absolute', right: 8, top: 8 }}>
          <CloseIcon />
        </IconButton>
        <DialogContent dividers>
          <Stack spacing={1.5}>
            {tabletInventory.map((it) => (
              <Box key={it.id}
                sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                {it.image ? (
                  <Box sx={{
                    width: 72,
                    height: 54, overflow: 'hidden', borderRadius: 1, bgcolor: 'action.hover'
                  }}>
                    <img src={it.image}
                      alt={it.label}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </Box>
                ) : <Box sx={{ width: 72, height: 54, bgcolor: 'action.hover' }} />}
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2"
                    sx={{ fontWeight: 600 }}>{it.label}</Typography>
                  <Typography variant="caption"
                    sx={{ color: 'text.secondary' }}>{it.description}</Typography>
                </Box>
                <Typography variant="body2"
                  sx={{ width: 80 }}>${it.price}</Typography>
                <IconButton size="small"
                  onClick={() => changeQty(setTabletQty, tabletQty, it.id, -1)}><RemoveIcon fontSize="small" /></IconButton>
                <TextField size="small"
                  value={tabletQty[it.id] ?? 0}
                  inputProps={{ style: { width: 36, textAlign: 'center' } }} />
                <IconButton size="small"
                  onClick={() => changeQty(setTabletQty, tabletQty, it.id, +1)}><AddIcon fontSize="small" /></IconButton>
              </Box>
            ))}
          </Stack>
        </DialogContent>
        <Box sx={{ p: 1.5, display: 'flex', justifyContent: 'flex-end' }}>
          <Button variant="contained"
            onClick={() => setOpenTablets(false)}>Agregar</Button>
        </Box>
      </Dialog>

      <Dialog open={openPrinters}
        onClose={() => setOpenPrinters(false)}
        maxWidth="sm"
        fullWidth>
        <DialogTitle sx={{ pr: 6 }}>Seleccionar impresoras del inventario</DialogTitle>
        <IconButton onClick={() => setOpenPrinters(false)}
          sx={{ position: 'absolute', right: 8, top: 8 }}>
          <CloseIcon />
        </IconButton>
        <DialogContent dividers>
          <Stack spacing={1.5}>
            {printerInventory.map((it) => (
              <Box key={it.id}
                sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                {it.image ? (
                  <Box sx={{ width: 72, height: 54, overflow: 'hidden', borderRadius: 1, bgcolor: 'action.hover' }}>
                    <img src={it.image}
                      alt={it.label}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </Box>
                ) : <Box sx={{ width: 72, height: 54, bgcolor: 'action.hover' }} />}
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2"
                    sx={{ fontWeight: 600 }}>{it.label}</Typography>
                  <Typography variant="caption"
                    sx={{ color: 'text.secondary' }}>{it.description}</Typography>
                </Box>
                <Typography variant="body2"
                  sx={{ width: 80 }}>${it.price}</Typography>
                <IconButton size="small"
                  onClick={() => changeQty(setPrinterQty, printerQty, it.id, -1)}><RemoveIcon fontSize="small" /></IconButton>
                <TextField size="small"
                  value={printerQty[it.id] ?? 0}
                  inputProps={{ style: { width: 36, textAlign: 'center' } }} />
                <IconButton size="small"
                  onClick={() => changeQty(setPrinterQty, printerQty, it.id, +1)}><AddIcon fontSize="small" /></IconButton>
              </Box>
            ))}
          </Stack>
        </DialogContent>
        <Box sx={{ p: 1.5, display: 'flex', justifyContent: 'flex-end' }}>
          <Button variant="contained"
            onClick={() => setOpenPrinters(false)}>Agregar</Button>
        </Box>
      </Dialog>

      <Divider sx={{ my: 3 }} />

      {/* ===== Sección B (RESTABLECIDA) ===== */}
      <Typography variant="h6"
        sx={{ mb: 1, fontWeight: 600 }}>Sección B: Posters y Materiales</Typography>

      {/* Encabezados */}
      <Box sx={{
        display: 'grid',
        gridTemplateColumns: 'minmax(170px,1.4fr) 140px 110px 130px 120px 120px',
        gap: 1, px: 1, py: 1, bgcolor: 'background.paper',
        border: '1px solid', borderColor: 'divider', borderRadius: 1, fontWeight: 600,
      }}>
        <Typography variant="caption">PRODUCTO</Typography>
        <Typography variant="caption">MATERIAL</Typography>
        <Typography variant="caption">PRECIO</Typography>
        <Typography variant="caption">SELECCIONAR</Typography>
        <Typography variant="caption">CANTIDAD</Typography>
        <Typography variant="caption">TOTAL</Typography>
      </Box>

      {/* Filas */}
      <Box sx={{ mt: 0.75 }}>
        {sectionB.map((row, idx) => {
          const total = row.checked ? row.qty * row.price : 0;

          const setQty = (next: number) => {
            setSectionB(prev =>
              prev.map((r, i) =>
                i === idx
                  ? { ...r, qty: next, checked: next > 0 ? true : false }
                  : r
              ),
            );
          };

          return (
            <Box
              key={row.id}
              sx={{
                display: 'grid',
                gridTemplateColumns:
                  'minmax(170px,1.4fr) 140px 110px 130px 120px 120px',
                gap: 1,
                alignItems: 'center',
                p: 1,
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1,
                mb: 0.75,
              }}
            >
              <Typography variant="body2"
                sx={{ fontWeight: 600 }}>
                {row.name}
              </Typography>
              <Typography variant="body2">{row.material}</Typography>
              <Typography variant="body2">${row.price}</Typography>

              <Checkbox
                checked={row.checked}
                onChange={(_, c) =>
                  setSectionB(prev =>
                    prev.map((r, i) => (i === idx ? { ...r, checked: c } : r)),
                  )
                }
              />

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <IconButton
                  size="small"
                  onClick={() => setQty(Math.max(0, row.qty - 1))}
                >
                  <RemoveIcon fontSize="small" />
                </IconButton>

                <TextField
                  size="small"
                  type="number"
                  value={row.qty}
                  onChange={(e) => {
                    const v = Math.max(0, parseInt(e.target.value || '0', 10));
                    setQty(v);
                  }}
                  InputProps={{ inputProps: { min: 0 } }}
                  sx={{
                    width: 56,
                    '& input': {
                      textAlign: 'center',
                      padding: '6px 0',
                    },
                  }}
                />

                <IconButton size="small"
                  onClick={() => setQty(row.qty + 1)}>
                  <AddIcon fontSize="small" />
                </IconButton>
              </Box>

              <TextField
                size="small"
                value={`$${total}`}
                InputProps={{ readOnly: true }}
                sx={{
                  '& input': { textAlign: 'center', fontWeight: 600 },
                }}
              />
            </Box>
          );
        })}

      </Box>

      <Typography variant="body2"
        sx={{ textAlign: 'right', mt: 1.5, color: 'text.secondary' }}>
        Total Sección B: <strong>${sectionBTotal}</strong>
      </Typography>

      {/* Footer acciones del Step 2 */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
        <Button variant="outlined"
          onClick={handleBack}>Atrás</Button>
        <Button variant="contained"
          onClick={handleSave}>Guardar</Button>
      </Box>
    </Container>
  );
}
