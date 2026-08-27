'use client';

/**
 * Compartir base entre dos negocios cualesquiera.
 *
 * El diálogo del dashboard de audiencia sólo ofrece los vecinos que el cruce
 * por zona encontró. Acá el origen y el destino se eligen a mano: sirve para
 * los casos que el radio no cubre (dos locales del mismo dueño en ciudades
 * distintas, una tienda que abre y hereda la base de la vieja).
 */

import { useApplyShare, useSharePreview } from '@/hooks/fetching/customers/useCustomerShare';
import { useStoreSearch } from '@/hooks/fetching/stores/useStoreSearch';
import { getStoreById } from '@/services/store.service';
import { useQuery } from '@tanstack/react-query';
import { PanelCard, numeric } from '@/components/audience/ui';
import type { Store } from '@/services/store.service';
import ShareRoundedIcon from '@mui/icons-material/ShareRounded';
import SouthRoundedIcon from '@mui/icons-material/SouthRounded';
import SwapVertRoundedIcon from '@mui/icons-material/SwapVertRounded';
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  CircularProgress,
  FormControlLabel,
  IconButton,
  Skeleton,
  Stack,
  Switch,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import React, { useEffect, useState } from 'react';

const nf = new Intl.NumberFormat('es-US');

function StorePicker({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: Store | null;
  onChange: (s: Store | null) => void;
  placeholder: string;
}) {
  const [term, setTerm] = useState('');
  const { options, loading, needsMoreChars } = useStoreSearch(term);

  return (
    <Autocomplete
      value={value}
      onChange={(_, v) => onChange(v)}
      onInputChange={(_, v) => setTerm(v)}
      options={options}
      loading={loading}
      getOptionLabel={(o) => o.name || ''}
      isOptionEqualToValue={(o, v) => o._id === v._id}
      noOptionsText={needsMoreChars ? 'Escribí al menos 2 letras' : 'Sin resultados'}
      renderOption={(props, option) => (
        <Box
          component="li"
          {...props}
          key={option._id}
        >
          <Stack minWidth={0}>
            <Typography
              variant="body2"
              noWrap
            >
              {option.name}
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={numeric}
            >
              {nf.format(option.customerCount ?? 0)} contactos · {option.zipCode}
            </Typography>
          </Stack>
        </Box>
      )}
      renderInput={(params) => (
        <TextField
          {...params}
          size="small"
          label={label}
          placeholder={placeholder}
          InputProps={{
            ...params.InputProps,
            endAdornment: (
              <>
                {loading ? <CircularProgress size={16} /> : null}
                {params.InputProps.endAdornment}
              </>
            ),
          }}
        />
      )}
    />
  );
}

/**
 * `initialFromId` llega del botón "Compartir base" de la ficha de una tienda
 * (`?from=<id>`): abrir la herramienta con el origen ya puesto evita tener que
 * volver a buscar el negocio del que se venía.
 */
export default function ShareTool({ initialFromId }: { initialFromId?: string | null }) {
  const [from, setFrom] = useState<Store | null>(null);
  const [to, setTo] = useState<Store | null>(null);
  const [activeOnly, setActiveOnly] = useState(true);
  const [note, setNote] = useState('');
  const [confirmed, setConfirmed] = useState(false);

  const initialStore = useQuery({
    queryKey: ['stores', 'by-id', initialFromId],
    queryFn: () => getStoreById(initialFromId!),
    enabled: Boolean(initialFromId),
    staleTime: 5 * 60_000,
  });

  // Sólo pisa el origen mientras el usuario no eligió nada: si ya tocó el
  // selector, la respuesta tardía de la query no le puede cambiar la elección.
  useEffect(() => {
    if (initialStore.data && !from) setFrom(initialStore.data);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialStore.data]);

  const preview = useSharePreview(from?._id, to?._id, activeOnly);
  const apply = useApplyShare();

  const sameStore = Boolean(from && to && from._id === to._id);

  const reset = () => {
    setFrom(null);
    setTo(null);
    setNote('');
    setConfirmed(false);
    apply.reset();
  };

  const handleApply = () => {
    if (!from || !to) return;
    apply.mutate({
      fromStoreId: from._id,
      toStoreId: to._id,
      activeOnly,
      note: note.trim() || undefined,
    });
  };

  const errorMessage =
    (apply.error as any)?.response?.data?.error ||
    (apply.isError ? 'No se pudo compartir la base.' : null);
  const previewError =
    (preview.error as any)?.response?.data?.error ||
    (preview.isError ? 'No se pudo calcular la vista previa.' : null);

  const canApply =
    Boolean(from && to) &&
    !sameStore &&
    confirmed &&
    !apply.isPending &&
    Boolean(preview.data) &&
    preview.data!.willShare > 0 &&
    !preview.data!.exceedsLimit;

  return (
    <PanelCard
      title="Compartir base"
      subtitle="Los contactos del origen empiezan a recibir también las campañas del destino"
      icon={<ShareRoundedIcon fontSize="small" />}
      tone="success"
    >
      {apply.isSuccess && apply.data ? (
        <Stack gap={2}>
          <Alert
            severity="success"
            action={
              <Button
                size="small"
                onClick={reset}
                sx={{ textTransform: 'none' }}
              >
                Compartir otra
              </Button>
            }
          >
            <b>{nf.format(apply.data.shared)}</b> contactos de {apply.data.from.name} ahora también
            reciben las campañas de {apply.data.to.name}. Se puede revertir desde el historial de
            abajo.
          </Alert>
        </Stack>
      ) : (
        <Stack gap={2}>
          <StorePicker
            label="Origen — la base que está parada"
            value={from}
            onChange={(s) => {
              setFrom(s);
              setConfirmed(false);
            }}
            placeholder="Buscar negocio…"
          />

          <Stack
            direction="row"
            alignItems="center"
            justifyContent="center"
            gap={1}
          >
            <SouthRoundedIcon sx={{ fontSize: 18, color: 'text.disabled' }} />
            <Tooltip title="Invertir origen y destino">
              <span>
                <IconButton
                  size="small"
                  disabled={!from && !to}
                  onClick={() => {
                    setFrom(to);
                    setTo(from);
                    setConfirmed(false);
                  }}
                  aria-label="Invertir origen y destino"
                >
                  <SwapVertRoundedIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
          </Stack>

          <StorePicker
            label="Destino — la que manda las campañas"
            value={to}
            onChange={(s) => {
              setTo(s);
              setConfirmed(false);
            }}
            placeholder="Buscar negocio…"
          />

          {sameStore && (
            <Alert severity="warning">El origen y el destino no pueden ser el mismo negocio.</Alert>
          )}

          {from && to && !sameStore && (
            <Box
              sx={{ p: 1.75, borderRadius: 1.5, border: '1px solid', borderColor: 'divider' }}
            >
              {preview.isLoading ? (
                <Skeleton
                  variant="text"
                  width="70%"
                  height={30}
                />
              ) : previewError ? (
                <Typography
                  variant="body2"
                  color="error"
                >
                  {previewError}
                </Typography>
              ) : preview.data ? (
                <Stack gap={0.5}>
                  <Stack
                    direction="row"
                    alignItems="baseline"
                    gap={1}
                  >
                    <Typography
                      variant="h5"
                      fontWeight={700}
                      sx={numeric}
                    >
                      {nf.format(preview.data.willShare)}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                    >
                      contactos se activan
                    </Typography>
                  </Stack>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                  >
                    {nf.format(preview.data.alreadyInTarget)} ya estaban en el destino y no se
                    tocan. El origen conserva sus {nf.format(preview.data.totalInSource)}{' '}
                    contactos: compartir no mueve a nadie.
                  </Typography>
                  {preview.data.sample.length > 0 && (
                    <Typography
                      variant="caption"
                      color="text.disabled"
                      sx={numeric}
                    >
                      Ej.: {preview.data.sample.map((c) => c.phoneNumber).join(' · ')}
                    </Typography>
                  )}
                  {preview.data.exceedsLimit && (
                    <Alert
                      severity="error"
                      sx={{ mt: 1 }}
                    >
                      Son más de {nf.format(preview.data.maxShare)} contactos, el máximo por
                      operación.
                    </Alert>
                  )}
                  {preview.data.willShare === 0 && (
                    <Alert
                      severity="info"
                      sx={{ mt: 1 }}
                    >
                      No hay nada que compartir: todos los contactos del origen ya están en el
                      destino.
                    </Alert>
                  )}
                </Stack>
              ) : null}
            </Box>
          )}

          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            gap={2}
            alignItems={{ sm: 'center' }}
          >
            <FormControlLabel
              control={
                <Switch
                  size="small"
                  checked={activeOnly}
                  onChange={(e) => {
                    setActiveOnly(e.target.checked);
                    // El confirm de abajo dice un número: si cambia el filtro,
                    // cambia el número y la confirmación deja de valer.
                    setConfirmed(false);
                  }}
                />
              }
              label="Sólo contactos activos"
              slotProps={{ typography: { variant: 'body2' } }}
            />
            <TextField
              size="small"
              label="Nota (opcional)"
              placeholder="Por qué se comparte — queda en el historial"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              sx={{ flex: 1 }}
            />
          </Stack>

          {/* Toca miles de clientes: el switch obliga a leer el número de arriba. */}
          {preview.data && preview.data.willShare > 0 && !preview.data.exceedsLimit && (
            <FormControlLabel
              control={
                <Switch
                  size="small"
                  color="success"
                  checked={confirmed}
                  onChange={(e) => setConfirmed(e.target.checked)}
                />
              }
              label={`Confirmo compartir ${nf.format(preview.data.willShare)} contactos`}
              slotProps={{ typography: { variant: 'body2', fontWeight: 600 } }}
            />
          )}

          {errorMessage && <Alert severity="error">{errorMessage}</Alert>}

          <Stack direction="row">
            <Button
              variant="contained"
              color="success"
              startIcon={<ShareRoundedIcon />}
              disabled={!canApply}
              onClick={handleApply}
              sx={{ textTransform: 'none' }}
            >
              {apply.isPending ? 'Compartiendo…' : 'Compartir base'}
            </Button>
          </Stack>
        </Stack>
      )}
    </PanelCard>
  );
}
