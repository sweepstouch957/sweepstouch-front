'use client';

/**
 * Postcard de la tienda (29 oct 2026): los productos y precios impresos en el
 * postcard mensual. El QR es uno por tienda y no cambia; lo que cambia cada mes
 * es esta lista. Es lo único que ve el cliente en /postal y la cajera en la tablet.
 */
import {
  PanelCard,
  SectionHeader,
} from '@/components/application-ui/content-shells/store-managment/panel-kit';
import { circularService, type StoreProduct } from '@/services/circular.service';
import { postcardService, type PostcardItem } from '@/services/postcard.service';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import MailOutlineRoundedIcon from '@mui/icons-material/MailOutlineRounded';
import QrCode2RoundedIcon from '@mui/icons-material/QrCode2Rounded';
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Chip,
  CircularProgress,
  IconButton,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

export default function PostcardSection({ storeSlug }: { storeSlug: string }) {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['postcard', storeSlug],
    queryFn: () => postcardService.get(storeSlug),
  });
  const [items, setItems] = useState<PostcardItem[]>([]);
  useEffect(() => {
    if (data) setItems(data.items);
  }, [data]);

  const [search, setSearch] = useState('');
  const { data: found, isFetching: searching } = useQuery({
    queryKey: ['postcard-catalog-search', storeSlug, search.trim()],
    queryFn: () => circularService.getCatalogAdmin(storeSlug, { page: 1, limit: 20, q: search }),
    enabled: search.trim().length >= 2,
  });

  const save = useMutation({
    mutationFn: () => postcardService.save(storeSlug, items),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['postcard', storeSlug] }),
  });

  const add = (p: StoreProduct) =>
    setItems((xs) => [
      ...xs,
      {
        name: p.name,
        price: p.price || '',
        originalPrice: p.originalPrice || '',
        unit: p.unit,
        imageUrl: p.imageUrl,
        category: p.category,
      },
    ]);
  const patch = (i: number, v: Partial<PostcardItem>) =>
    setItems((xs) => xs.map((x, j) => (j === i ? { ...x, ...v } : x)));

  async function downloadQr() {
    const url = URL.createObjectURL(await postcardService.qrBlob(storeSlug));
    const a = document.createElement('a');
    a.href = url;
    a.download = `postcard-qr-${storeSlug}.png`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (isLoading) return <CircularProgress />;

  return (
    <PanelCard>
      <SectionHeader
        icon={<MailOutlineRoundedIcon />}
        title="Postcard"
        hint="Productos y precios impresos en el postcard. El QR de la tienda no cambia: se actualiza esta lista cada mes."
        count={items.length}
        action={
          <Button startIcon={<QrCode2RoundedIcon />} onClick={downloadQr}>
            Descargar QR
          </Button>
        }
      />

      {data?.stats && (
        <Stack direction="row" gap={1} sx={{ my: 2 }} flexWrap="wrap">
          <Chip label={`${data.stats.scans} escaneos del QR`} />
          <Chip label={`${data.stats.lists} listas armadas`} />
          <Chip label={`${data.stats.validated} validadas en caja`} />
          <Chip color="primary" label={`${data.stats.newCustomers} clientes nuevos`} />
        </Stack>
      )}

      <Autocomplete
        options={found?.items || []}
        loading={searching}
        getOptionLabel={(p) => `${p.name} — ${p.price || ''}`}
        filterOptions={(x) => x}
        onInputChange={(_, v) => setSearch(v)}
        onChange={(_, p) => p && add(p)}
        value={null}
        blurOnSelect
        renderInput={(params) => (
          <TextField
            {...params}
            label="Agregar producto del catálogo"
            placeholder="Busca por nombre…"
          />
        )}
      />
      <Button sx={{ mt: 1 }} onClick={() => setItems((xs) => [...xs, { name: '', price: '' }])}>
        + Producto a mano
      </Button>

      <Stack gap={1.5} sx={{ mt: 2 }}>
        {items.map((it, i) => (
          <Stack key={it._id || i} direction="row" gap={1} alignItems="center">
            <Box sx={{ width: 48, height: 48, flexShrink: 0 }}>
              {it.imageUrl && (
                <img src={it.imageUrl} alt="" width={48} height={48} style={{ objectFit: 'contain' }} />
              )}
            </Box>
            <TextField size="small" label="Producto" value={it.name} onChange={(e) => patch(i, { name: e.target.value })} sx={{ flex: 2 }} />
            <TextField size="small" label="Precio postcard" value={it.price} onChange={(e) => patch(i, { price: e.target.value })} sx={{ flex: 1 }} />
            <TextField size="small" label="Precio normal" value={it.originalPrice || ''} onChange={(e) => patch(i, { originalPrice: e.target.value })} sx={{ flex: 1 }} />
            <TextField size="small" label="Unidad" value={it.unit || ''} onChange={(e) => patch(i, { unit: e.target.value })} sx={{ width: 90 }} />
            <IconButton aria-label="Quitar" onClick={() => setItems((xs) => xs.filter((_, j) => j !== i))}>
              <DeleteOutlineRoundedIcon />
            </IconButton>
          </Stack>
        ))}
        {items.length === 0 && (
          <Typography color="text.secondary">Sin productos: el cliente que escanee el QR no verá ofertas.</Typography>
        )}
      </Stack>

      {save.isError && <Alert severity="error" sx={{ mt: 2 }}>No se pudo guardar.</Alert>}
      {save.isSuccess && <Alert severity="success" sx={{ mt: 2 }}>Postcard guardado.</Alert>}
      <Button
        variant="contained"
        sx={{ mt: 2 }}
        disabled={save.isPending}
        onClick={() => save.mutate()}
      >
        {save.isPending ? 'Guardando…' : 'Guardar postcard'}
      </Button>
    </PanelCard>
  );
}
