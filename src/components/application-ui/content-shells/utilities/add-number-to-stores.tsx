'use client';

import { useStoreSearch } from '@/hooks/fetching/stores/useStoreSearch';
import { customerClient, type AddToStoresResult } from '@/services/customerService';
import { getStores, type Store } from '@/services/store.service';
import PhoneIphoneRoundedIcon from '@mui/icons-material/PhoneIphoneRounded';
import StorefrontRoundedIcon from '@mui/icons-material/StorefrontRounded';
import PublicRoundedIcon from '@mui/icons-material/PublicRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import {
  Alert,
  alpha,
  Autocomplete,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  useTheme,
} from '@mui/material';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';

type Mode = 'one' | 'all';

/** Mismo criterio que el backend (normalizeUsPhone): US de 10 dígitos, o 11 con el 1. */
function normalizeUsPhone(raw: string): string | null {
  const d = String(raw ?? '').replace(/\D/g, '');
  if (!d) return null;
  if (d.length === 10) return `+1${d}`;
  if (d.length === 11 && d.startsWith('1')) return `+${d}`;
  return null;
}

export default function AddNumberToStores() {
  const theme = useTheme();

  const [mode, setMode] = useState<Mode>('one');
  const [phone, setPhone] = useState('');
  const [firstName, setFirstName] = useState('');
  const [selectedStores, setSelectedStores] = useState<Store[]>([]);
  const [result, setResult] = useState<AddToStoresResult | null>(null);

  // Búsqueda server-side por nombre (debounced). Antes traía TODAS las tiendas
  // al abrir la página solo para filtrar en el cliente.
  const [storeTerm, setStoreTerm] = useState('');
  const { options: storeOptions, loading: loadingStores, needsMoreChars } =
    useStoreSearch(storeTerm);

  // Solo el TOTAL (limit:1) para el aviso de "todas las tiendas" — no la lista.
  const { data: totalStores } = useQuery({
    queryKey: ['stores', 'total'],
    queryFn: async () => (await getStores({ limit: 1 })).total,
    staleTime: 1000 * 60 * 10,
  });

  const normalized = useMemo(() => normalizeUsPhone(phone), [phone]);
  const phoneTouched = phone.trim().length > 0;
  const phoneError = phoneTouched && !normalized;

  const canSubmit =
    Boolean(normalized) && (mode === 'all' || selectedStores.length > 0);

  const mutation = useMutation({
    mutationFn: () =>
      customerClient.addNumberToStores({
        phoneNumber: phone,
        firstName: firstName.trim() || undefined,
        ...(mode === 'all'
          ? { allStores: true }
          : { storeIds: selectedStores.map((s) => s._id) }),
      }),
    onSuccess: (data) => setResult(data),
  });

  const handleSubmit = () => {
    if (!canSubmit) return;
    if (mode === 'all') {
      const ok = window.confirm(
        `Se agregará ${normalized} a TODAS las tiendas${totalStores ? ` (${totalStores})` : ''}. ¿Continuar?`
      );
      if (!ok) return;
    }
    setResult(null);
    mutation.mutate();
  };

  const handleReset = () => {
    setPhone('');
    setFirstName('');
    setSelectedStores([]);
    setResult(null);
    mutation.reset();
  };

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      <Card
        variant="outlined"
        sx={{
          bgcolor: 'background.paper',
          borderColor: 'divider',
        }}
      >
        <CardContent>
          <Stack spacing={2.5}>
            {/* Encabezado */}
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Box
                sx={{
                  width: 38,
                  height: 38,
                  borderRadius: 2,
                  display: 'grid',
                  placeItems: 'center',
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                  color: 'primary.main',
                }}
              >
                <PhoneIphoneRoundedIcon fontSize="small" />
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <Typography fontWeight={800}>Agregar número a tiendas</Typography>
                <Typography variant="caption" color="text.secondary">
                  Suma un teléfono a la audiencia de una, varias o todas las tiendas
                </Typography>
              </Box>
            </Stack>

            <Divider />

            {/* Modo */}
            <ToggleButtonGroup
              exclusive
              size="small"
              value={mode}
              onChange={(_, v: Mode | null) => {
                if (!v) return;
                setMode(v);
                setResult(null);
              }}
              sx={{ alignSelf: 'flex-start' }}
            >
              <ToggleButton value="one" sx={{ textTransform: 'none', px: 2, gap: 0.75 }}>
                <StorefrontRoundedIcon sx={{ fontSize: 16 }} />
                Tiendas específicas
              </ToggleButton>
              <ToggleButton value="all" sx={{ textTransform: 'none', px: 2, gap: 0.75 }}>
                <PublicRoundedIcon sx={{ fontSize: 16 }} />
                Todas las tiendas
              </ToggleButton>
            </ToggleButtonGroup>

            {/* Datos */}
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
              <TextField
                size="small"
                label="Número de teléfono"
                placeholder="(555) 123-4567"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  setResult(null);
                }}
                error={phoneError}
                helperText={
                  phoneError
                    ? 'Debe ser un número US de 10 dígitos'
                    : normalized
                      ? `Se guardará como ${normalized}`
                      : 'Se aceptan formatos con ( ) - o espacios'
                }
                sx={{ flex: 1 }}
              />
              <TextField
                size="small"
                label="Nombre (opcional)"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                sx={{ flex: 1 }}
              />
            </Stack>

            {mode === 'one' ? (
              <Autocomplete
                multiple
                size="small"
                options={storeOptions}
                loading={loadingStores}
                value={selectedStores}
                onChange={(_, v) => {
                  setSelectedStores(v);
                  setResult(null);
                }}
                inputValue={storeTerm}
                onInputChange={(_, v, reason) => {
                  // 'reset' se dispara al seleccionar: no borres el término,
                  // así podés seguir sumando tiendas de la misma búsqueda.
                  if (reason !== 'reset') setStoreTerm(v);
                }}
                // El backend ya filtró por nombre — si además filtramos acá,
                // MUI esconde resultados válidos (ej. match por slug/dirección).
                filterOptions={(x) => x}
                getOptionLabel={(o) => o.name || ''}
                isOptionEqualToValue={(a, b) => a._id === b._id}
                noOptionsText={
                  needsMoreChars
                    ? 'Escribí al menos 2 letras...'
                    : storeTerm.trim()
                      ? 'Sin resultados'
                      : 'Escribí para buscar una tienda'
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Tiendas"
                    placeholder="Buscar tienda por nombre..."
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {loadingStores ? <CircularProgress size={16} /> : null}
                          {params.InputProps.endAdornment}
                        </>
                      ),
                    }}
                  />
                )}
              />
            ) : (
              <Alert severity="warning" sx={{ borderRadius: 2 }}>
                El número se agregará a <strong>todas las tiendas</strong>
                {totalStores ? ` (${totalStores})` : ''}. Recibirá las campañas de
                cada una.
              </Alert>
            )}

            {mutation.isError && (
              <Alert severity="error" sx={{ borderRadius: 2 }}>
                {(mutation.error as any)?.response?.data?.error ||
                  'No se pudo agregar el número.'}
              </Alert>
            )}

            {/* Resultado */}
            {result && (
              <Alert
                severity="success"
                icon={<CheckCircleRoundedIcon fontSize="inherit" />}
                sx={{ borderRadius: 2 }}
              >
                <Typography fontWeight={700} variant="body2">
                  {result.created ? 'Cliente creado' : 'Cliente actualizado'} ·{' '}
                  {result.phoneNumber}
                </Typography>
                <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: 'wrap', gap: 1 }}>
                  <Chip size="small" label={`Agregado a ${result.addedTo}`} color="success" />
                  {result.alreadyIn > 0 && (
                    <Chip size="small" label={`Ya estaba en ${result.alreadyIn}`} />
                  )}
                  <Chip size="small" variant="outlined" label={`Total: ${result.totalStores} tiendas`} />
                </Stack>
              </Alert>
            )}

            <Stack direction="row" spacing={1.5}>
              <Button
                variant="contained"
                disabled={!canSubmit || mutation.isPending}
                onClick={handleSubmit}
                startIcon={
                  mutation.isPending ? (
                    <CircularProgress size={16} color="inherit" />
                  ) : (
                    <PhoneIphoneRoundedIcon />
                  )
                }
                sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}
              >
                {mutation.isPending ? 'Agregando...' : 'Agregar número'}
              </Button>
              <Button
                variant="text"
                onClick={handleReset}
                disabled={mutation.isPending}
                sx={{ borderRadius: 2, textTransform: 'none' }}
              >
                Limpiar
              </Button>
            </Stack>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}
