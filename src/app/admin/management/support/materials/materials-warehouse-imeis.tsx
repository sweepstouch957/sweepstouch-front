'use client';

import * as api from '@/services/material-control.service';
import RefreshRounded from '@mui/icons-material/RefreshRounded';
import { Box, Checkbox, FormControlLabel, Stack, TextField, Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { ButtonSoft } from 'src/components/base/styles/button-soft';
import { useMaterials } from './materials-context';
import { toggleImei, warehouseImeis } from './materials-movement-utils';
import { QueryFeedback } from './materials-shared';
import { parseSeries } from './materials-utils';

export function WarehouseImeis({
  active,
  materialId,
  serialText,
  reservedImeis,
  disabled,
  onChange,
}: {
  active: boolean;
  materialId: string;
  serialText: string;
  reservedImeis: string[];
  disabled: boolean;
  onChange: (value: string) => void;
}) {
  const { scope, enabled } = useMaterials();
  const [search, setSearch] = useState('');
  const result = useQuery({
    queryKey: [...scope, 'warehouse-imeis', materialId],
    queryFn: () =>
      api.collectPages((page) =>
        api.getEquipment({ material: materialId, estado: 'bodega', page, limit: 200 })
      ),
    enabled: enabled && active,
    staleTime: 0,
    retry: false,
  });
  const imeis = useMemo(
    () => warehouseImeis(result.data || [], materialId),
    [result.data, materialId]
  );
  const selected = new Set(parseSeries(serialText, 'imei').map((serial) => serial.v));
  const reserved = new Set(reservedImeis);
  const term = search.replace(/[^0-9A-Za-z]/g, '').toUpperCase();
  const visible = imeis.filter((imei) => imei.includes(term));
  return (
    <Stack
      spacing={1}
      sx={{ minWidth: 0, gridColumn: { md: 'span 2' } }}
    >
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        spacing={1}
      >
        <Typography variant="subtitle2">IMEI de tablets en bodega</Typography>
        <ButtonSoft
          type="button"
          size="small"
          startIcon={<RefreshRounded />}
          disabled={disabled || result.isFetching}
          onClick={() => {
            void result.refetch();
          }}
        >
          Actualizar
        </ButtonSoft>
      </Stack>
      <Typography
        variant="caption"
        color="text.secondary"
      >
        Marca uno o varios para agregarlos al campo de IMEI. Desmárcalos para quitarlos.
      </Typography>
      <TextField
        label="Buscar IMEI en bodega"
        size="small"
        value={search}
        disabled={disabled}
        onChange={(event) => setSearch(event.target.value)}
      />
      <QueryFeedback
        pending={result.isPending || result.isFetching}
        error={result.error}
      >
        <Box sx={{ maxHeight: (theme) => theme.spacing(24), overflowY: 'auto' }}>
          {visible.map((imei) => (
            <FormControlLabel
              key={imei}
              sx={{ display: 'flex', mx: 0 }}
              control={
                <Checkbox
                  size="small"
                  checked={selected.has(imei)}
                  disabled={disabled || reserved.has(imei)}
                  onChange={(_, checked) => onChange(toggleImei(serialText, imei, checked))}
                />
              }
              label={
                <Typography variant="body2">
                  {imei}
                  {reserved.has(imei) ? ' · Seleccionado en otra fila' : ''}
                </Typography>
              }
            />
          ))}
          {!visible.length && (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ py: 1 }}
            >
              {imeis.length
                ? 'No hay IMEI que coincidan con la búsqueda.'
                : 'No hay tablets con IMEI registradas en bodega.'}
            </Typography>
          )}
        </Box>
        <Typography
          variant="caption"
          color="text.secondary"
        >
          {visible.length} de {imeis.length} IMEI en bodega ·{' '}
          {imeis.filter((imei) => selected.has(imei)).length} seleccionados
        </Typography>
      </QueryFeedback>
    </Stack>
  );
}
