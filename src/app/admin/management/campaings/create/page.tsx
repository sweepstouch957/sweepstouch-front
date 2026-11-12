'use client';

/**
 * "Nueva campaña": una campaña siempre es de una tienda, así que primero se
 * elige la tienda y luego se abre el formulario real dentro de su panel.
 * (Antes esta ruta mostraba una plantilla de producto que no guardaba nada.)
 */
import { useStoreSearch } from '@/hooks/fetching/stores/useStoreSearch';
import type { Store } from '@/services/store.service';
import ArrowBackRounded from '@mui/icons-material/ArrowBackRounded';
import StorefrontRounded from '@mui/icons-material/StorefrontRounded';
import {
  Autocomplete,
  Button,
  Card,
  CircularProgress,
  Container,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';

type Kind = 'create' | 'create-rcs';

function Page(): React.JSX.Element {
  const router = useRouter();
  const [term, setTerm] = useState('');
  const [store, setStore] = useState<Store | null>(null);
  const [kind, setKind] = useState<Kind>('create');
  const { options, loading, needsMoreChars } = useStoreSearch(term, { status: 'active' });

  const go = () => {
    if (!store) return;
    router.push(`/admin/management/stores/edit/${store._id || store.id}?tag=campaigns&action=${kind}`);
  };

  return (
    <Container
      maxWidth="sm"
      sx={{ py: { xs: 3, md: 6 } }}
    >
      <Button
        component={Link}
        href="/admin/management/campaings"
        startIcon={<ArrowBackRounded />}
        size="small"
        sx={{ mb: 2 }}
      >
        Volver a campañas
      </Button>
      <Card sx={{ p: { xs: 2.5, md: 4 } }}>
        <Stack gap={3}>
          <Stack gap={0.5}>
            <Typography variant="h4">Nueva campaña</Typography>
            <Typography color="text.secondary">
              ¿Para qué tienda es? Elige la tienda y sigues con el mensaje, la fecha y la audiencia.
            </Typography>
          </Stack>

          <Autocomplete<Store>
            autoHighlight
            value={store}
            onChange={(_, v) => setStore(v)}
            inputValue={term}
            onInputChange={(_, v) => setTerm(v)}
            options={options}
            loading={loading}
            filterOptions={(x) => x}
            getOptionLabel={(o) => o.name || ''}
            isOptionEqualToValue={(a, b) => (a._id || a.id) === (b._id || b.id)}
            noOptionsText={
              needsMoreChars
                ? 'Escribe al menos 2 letras'
                : term.trim()
                  ? 'Ninguna tienda activa con ese nombre'
                  : 'Escribe el nombre de la tienda'
            }
            loadingText="Buscando…"
            renderOption={(props, o) => (
              <li
                {...props}
                key={o._id || o.id}
              >
                <StorefrontRounded
                  fontSize="small"
                  color="action"
                  sx={{ mr: 1.5, flexShrink: 0 }}
                />
                <Stack minWidth={0}>
                  <Typography variant="body2">{o.name}</Typography>
                  {o.address && (
                    <Typography
                      variant="caption"
                      color="text.secondary"
                    >
                      {o.address}
                    </Typography>
                  )}
                </Stack>
              </li>
            )}
            renderInput={(params) => (
              <TextField
                {...params}
                autoFocus
                label="Tienda"
                placeholder="Escribe el nombre de la tienda"
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {loading && <CircularProgress size={18} />}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
              />
            )}
          />

          <Stack gap={1}>
            <Typography variant="subtitle2">Tipo de campaña</Typography>
            <ToggleButtonGroup
              exclusive
              fullWidth
              size="small"
              color="primary"
              value={kind}
              onChange={(_, v: Kind | null) => v && setKind(v)}
            >
              <ToggleButton value="create">SMS / MMS</ToggleButton>
              <ToggleButton value="create-rcs">RCS (carrusel)</ToggleButton>
            </ToggleButtonGroup>
          </Stack>

          <Button
            variant="contained"
            size="large"
            disableElevation
            disabled={!store}
            onClick={go}
          >
            {store ? `Continuar con ${store.name}` : 'Elige una tienda para continuar'}
          </Button>
        </Stack>
      </Card>
    </Container>
  );
}
export default Page;
