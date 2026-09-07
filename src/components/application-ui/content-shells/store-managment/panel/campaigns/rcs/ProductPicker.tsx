'use client';

/** Grid de productos del catálogo con búsqueda y selección numerada. */

import {
  Alert,
  Avatar,
  Box,
  Card,
  CircularProgress,
  TextField,
  Typography,
} from '@mui/material';
import { CardData, CatalogProduct } from './rcs-domain';

export default function ProductPicker({
  products,
  filtered,
  loading,
  search,
  onSearch,
  cards,
  onToggle,
}: {
  products: CatalogProduct[];
  filtered: CatalogProduct[];
  loading: boolean;
  search: string;
  onSearch: (s: string) => void;
  cards: CardData[];
  onToggle: (p: CatalogProduct) => void;
}) {
  return (
    <>
      <TextField
        size="small"
        fullWidth
        placeholder="Buscar producto del catálogo…"
        value={search}
        onChange={(e) => onSearch(e.target.value)}
        sx={{ mb: 1.5 }}
      />
      {loading ? (
        <Box
          py={3}
          textAlign="center"
        >
          <CircularProgress size={26} />
        </Box>
      ) : products.length === 0 ? (
        <Alert severity="warning">
          Esta tienda no tiene productos en su catálogo. Cargalos en la página de Productos,
          o usá una card en blanco.
        </Alert>
      ) : (
        <Box
          display="grid"
          gridTemplateColumns={{ xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)', lg: 'repeat(4, 1fr)' }}
          gap={1.5}
          maxHeight={280}
          overflow="auto"
          pr={0.5}
        >
          {filtered.map((p) => {
            const idx = cards.findIndex((c) => c.productId === p._id);
            const isSel = idx >= 0;
            return (
              <Card
                key={p._id}
                variant="outlined"
                onClick={() => onToggle(p)}
                sx={{
                  cursor: 'pointer',
                  position: 'relative',
                  borderColor: isSel ? 'primary.main' : 'divider',
                  borderWidth: isSel ? 2 : 1,
                  '&:hover': { borderColor: 'primary.main' },
                }}
              >
                {isSel && (
                  <Avatar
                    sx={{
                      position: 'absolute',
                      top: 6,
                      right: 6,
                      width: 22,
                      height: 22,
                      fontSize: 12,
                      fontWeight: 800,
                      bgcolor: 'primary.main',
                      zIndex: 1,
                    }}
                  >
                    {idx + 1}
                  </Avatar>
                )}
                <Box
                  sx={{
                    height: 72,
                    bgcolor: 'action.hover',
                    backgroundImage: p.imageUrl ? `url(${p.imageUrl})` : undefined,
                    backgroundSize: 'contain',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                  }}
                />
                <Box p={1}>
                  <Typography
                    variant="caption"
                    fontWeight={600}
                    display="block"
                    noWrap
                  >
                    {p.name}
                  </Typography>
                  <Typography
                    variant="caption"
                    color={isSel ? 'primary.main' : 'text.secondary'}
                    fontWeight={700}
                  >
                    {p.price || '—'}
                  </Typography>
                </Box>
              </Card>
            );
          })}
        </Box>
      )}
    </>
  );
}
