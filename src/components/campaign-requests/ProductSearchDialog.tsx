'use client';

import { campaignRequestService, RepositoryProduct, CampaignProduct } from '@/services/campaign-request.service';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import {
  Box, Button, Chip, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle,
  InputAdornment, Stack, TextField, Typography,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';

interface Props {
  open: boolean;
  onClose: () => void;
  onAdd: (products: CampaignProduct[]) => void;
  existingNames: string[];
}

export default function ProductSearchDialog({ open, onClose, onAdd, existingNames }: Props) {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<RepositoryProduct[]>([]);

  const { data, isFetching } = useQuery({
    queryKey: ['repo-products', search],
    queryFn: () => campaignRequestService.searchProducts({ q: search, limit: 30 }),
    enabled: search.length >= 2,
    staleTime: 30_000,
  });

  const products = data?.data ?? [];
  const existingSet = new Set(existingNames.map(n => n.toUpperCase()));

  const toggle = (p: RepositoryProduct) => {
    setSelected(prev =>
      prev.find(s => s.id_product === p.id_product) ? prev.filter(s => s.id_product !== p.id_product) : [...prev, p]
    );
  };

  const handleAdd = () => {
    const mapped: CampaignProduct[] = selected.map(p => ({
      name: p.desc_full_product?.toUpperCase() || '',
      price: p.sale_price || p.regular_price || 0,
      originalPrice: p.regular_price || undefined,
      unit: 'EA',
      imageUrl: p.url_image || '',
      description: p.brand || '',
    }));
    onAdd(mapped);
    setSelected([]);
    setSearch('');
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Buscar productos del repositorio</DialogTitle>
      <DialogContent>
        <TextField
          fullWidth autoFocus size="small" placeholder="Ej: chicken, banana, del monte..."
          value={search} onChange={e => setSearch(e.target.value)} sx={{ mb: 2, mt: 1 }}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
        />
        {isFetching && <Box textAlign="center" py={3}><CircularProgress size={24} /></Box>}
        {!isFetching && products.length === 0 && search.length >= 2 && (
          <Typography color="text.secondary" textAlign="center" py={3}>Sin resultados para "{search}"</Typography>
        )}
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 1.5, maxHeight: 400, overflowY: 'auto' }}>
          {products.map(p => {
            const isSelected = selected.some(s => s.id_product === p.id_product);
            const alreadyAdded = existingSet.has((p.desc_full_product || '').toUpperCase());
            return (
              <Box
                key={p.id_product}
                onClick={() => !alreadyAdded && toggle(p)}
                sx={{
                  border: '1px solid', borderColor: isSelected ? 'primary.main' : 'divider',
                  borderRadius: 1.5, p: 1, cursor: alreadyAdded ? 'default' : 'pointer', opacity: alreadyAdded ? 0.4 : 1,
                  bgcolor: isSelected ? 'primary.lighter' : 'background.paper', transition: 'all .15s',
                  '&:hover': alreadyAdded ? {} : { borderColor: 'primary.main', bgcolor: 'action.hover' },
                }}
              >
                {p.url_image ? (
                  <Box component="img" src={p.url_image} sx={{ width: '100%', height: 80, objectFit: 'contain', borderRadius: 0.5, mb: 0.5 }} />
                ) : (
                  <Box sx={{ width: '100%', height: 80, bgcolor: 'grey.100', borderRadius: 0.5, mb: 0.5, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Typography variant="caption" color="text.disabled">Sin imagen</Typography>
                  </Box>
                )}
                <Typography variant="caption" fontWeight={700} noWrap display="block">{p.desc_full_product}</Typography>
                {p.brand && <Typography variant="caption" color="text.secondary" fontSize={10}>{p.brand}</Typography>}
                <Stack direction="row" spacing={0.5} mt={0.5}>
                  {p.sale_price && <Chip label={`$${p.sale_price}`} size="small" color="success" sx={{ fontSize: 10, height: 18 }} />}
                  {isSelected && <CheckCircleIcon color="primary" sx={{ fontSize: 14, ml: 'auto' }} />}
                  {alreadyAdded && <Chip label="Ya agregado" size="small" sx={{ fontSize: 9, height: 16 }} />}
                </Stack>
              </Box>
            );
          })}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleAdd} disabled={selected.length === 0}>
          Agregar {selected.length > 0 ? `(${selected.length})` : ''}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
