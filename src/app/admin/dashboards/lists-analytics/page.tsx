'use client';

// Analítica de LISTAS Pre-RCS por tienda — el gemelo de campaign-analytics
// pero para el flujo de listas: listas armadas, recibos escaneados por OCR,
// puntos acreditados y qué compra cada cliente. Datos de /tracking/list-admin.
import ListsAnalyticsDashboard from '@/components/lists-analytics/ListsAnalyticsDashboard';
import { useStoreSearch } from '@/hooks/fetching/stores/useStoreSearch';
import type { Store } from '@/services/store.service';
import FactCheckRoundedIcon from '@mui/icons-material/FactCheckRounded';
import { Autocomplete, Box, Paper, Stack, TextField, Typography } from '@mui/material';
import { useState } from 'react';


export default function ListsAnalyticsPage() {
  const [term, setTerm] = useState('');
  const [store, setStore] = useState<Store | null>(null);
  const search = useStoreSearch(term);
  const storeSlug = store?.slug || '';

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Stack
        direction="row"
        alignItems="center"
        flexWrap="wrap"
        gap={2}
        sx={{ mb: 2.5 }}
      >
        <FactCheckRoundedIcon color="primary" />
        <Box sx={{ flex: 1, minWidth: 200 }}>
          <Typography
            variant="h5"
            fontWeight={800}
          >
            Listas Pre-RCS
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
          >
            Listas, recibos validados por OCR y compras por cliente
          </Typography>
        </Box>
        <Autocomplete
          size="small"
          sx={{ width: { xs: '100%', sm: 320 } }}
          options={search.options}
          loading={search.loading}
          value={store}
          onChange={(_, v) => setStore(v)}
          inputValue={term}
          onInputChange={(_, v) => setTerm(v)}
          filterOptions={(x) => x}
          getOptionLabel={(o) => o.name || o.slug || ''}
          isOptionEqualToValue={(a, b) => a._id === b._id}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Tienda"
              placeholder="Escribe 2+ letras…"
            />
          )}
        />
      </Stack>

      {!storeSlug ? (
        <Paper
          variant="outlined"
          sx={{ p: 6, borderRadius: 3, textAlign: 'center', color: 'text.secondary' }}
        >
          Elige una tienda para ver su analítica de listas.
        </Paper>
      ) : (
        <ListsAnalyticsDashboard storeSlug={storeSlug} />
      )}
    </Box>
  );
}
