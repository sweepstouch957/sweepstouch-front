'use client';

import { PanelCard, SectionHeader } from '@/components/application-ui/content-shells/store-managment/panel-kit';
import { useStoreSearch } from '@/hooks/fetching/stores/useStoreSearch';
import type { AudienceExperimentConfig, SaveAudienceExperimentDto } from '@/services/audienceExperiment.service';
import SaveRoundedIcon from '@mui/icons-material/SaveRounded';
import TuneRoundedIcon from '@mui/icons-material/TuneRounded';
import {
  Autocomplete,
  Box,
  Button,
  Chip,
  CircularProgress,
  FormControlLabel,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';

type StoreOpt = { _id: string; name: string };

type FormValues = {
  active: boolean;
  sources: StoreOpt[];
  threshold: number;
  extraPct: number;
  startDate: string;
};

export function ConfigCard({
  config,
  saving,
  onSubmit,
}: {
  config: AudienceExperimentConfig;
  saving: boolean;
  onSubmit: (dto: SaveAudienceExperimentDto) => void;
}) {
  const { control, register, handleSubmit, formState } = useForm<FormValues>({
    defaultValues: {
      active: config.active,
      sources: (config.sources ?? []).map((s) => ({ _id: s.storeId, name: s.name })),
      threshold: config.threshold,
      extraPct: config.extraPct ?? 2,
      startDate: config.startDate ? config.startDate.slice(0, 10) : new Date().toISOString().slice(0, 10),
    },
  });
  const [term, setTerm] = useState('');
  // Las fuentes son tiendas dadas de baja (active:false → estado "cancelled" en /store/filter).
  const { options, loading, needsMoreChars } = useStoreSearch(term, { status: 'cancelled' });

  const submit = (v: FormValues) =>
    onSubmit({
      active: v.active,
      sourceStoreIds: v.sources.map((s) => s._id),
      threshold: Number(v.threshold),
      extraPct: Number(v.extraPct),
      startDate: v.startDate ? new Date(`${v.startDate}T00:00:00`).toISOString() : null,
    });

  const { ref: thrRef, ...thr } = register('threshold', { required: true, min: 100, valueAsNumber: true });
  const { ref: wkRef, ...wk } = register('extraPct', { required: true, min: 0, max: 100, valueAsNumber: true });
  const { ref: dtRef, ...dt } = register('startDate', { required: true });

  return (
    <PanelCard>
      <SectionHeader
        icon={<TuneRoundedIcon sx={{ fontSize: 20, color: 'primary.main' }} />}
        title="Configuración"
        hint="De qué tiendas salen los números y a qué ritmo"
      />
      <Box
        component="form"
        onSubmit={handleSubmit(submit)}
        sx={{ p: 2.25, display: 'flex', flexDirection: 'column', gap: 2 }}
      >
        <Controller
          name="sources"
          control={control}
          rules={{ validate: (v) => v.length > 0 || 'Elige al menos una tienda fuente' }}
          render={({ field, fieldState }) => (
            <Autocomplete
              multiple
              size="small"
              options={options.map((o) => ({ _id: o._id, name: o.name }))}
              loading={loading}
              value={field.value}
              onChange={(_, v) => field.onChange(v)}
              inputValue={term}
              onInputChange={(_, v, reason) => reason !== 'reset' && setTerm(v)}
              filterOptions={(x) => x}
              getOptionLabel={(o) => o.name || ''}
              isOptionEqualToValue={(a, b) => a._id === b._id}
              noOptionsText={needsMoreChars ? 'Escribe al menos 2 letras…' : 'Sin resultados'}
              renderTags={(value, getTagProps) =>
                value.map((o, i) => (
                  <Chip
                    {...getTagProps({ index: i })}
                    key={o._id}
                    size="small"
                    label={o.name}
                  />
                ))
              }
              renderInput={(p) => (
                <TextField
                  {...p}
                  label="Tiendas inactivas de donde salen los números"
                  placeholder="Buscar tienda inactiva (ej. Cirilo Moronta)"
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message || 'Sólo tiendas dadas de baja. Los números se toman parejo de todas.'}
                  InputProps={{
                    ...p.InputProps,
                    endAdornment: (
                      <>
                        {loading ? <CircularProgress size={16} /> : null}
                        {p.InputProps.endAdornment}
                      </>
                    ),
                  }}
                />
              )}
            />
          )}
        />

        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))', gap: 1.5 }}>
          <TextField
            {...thr}
            inputRef={thrRef}
            type="number"
            size="small"
            label="Tiendas con menos de"
            helperText="números (umbral)"
            error={!!formState.errors.threshold}
          />
          <TextField
            {...wk}
            inputRef={wkRef}
            type="number"
            size="small"
            label="Extra sobre lo depurado"
            helperText="% — 500 depurados + 2% = 510"
            error={!!formState.errors.extraPct}
          />
          <TextField
            {...dt}
            inputRef={dtRef}
            type="date"
            size="small"
            label="Empieza"
            InputLabelProps={{ shrink: true }}
            helperText="las depuraciones anteriores no cuentan"
            error={!!formState.errors.startDate}
          />
        </Box>

        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          gap={1.5}
          flexWrap="wrap"
        >
          <Controller
            name="active"
            control={control}
            render={({ field }) => (
              <FormControlLabel
                control={
                  <Switch
                    checked={field.value}
                    onChange={(e) => field.onChange(e.target.checked)}
                  />
                }
                label={
                  <Typography sx={{ fontSize: 14, fontWeight: 600 }}>
                    {field.value ? 'Relleno encendido (corre solo cada día)' : 'Relleno apagado'}
                  </Typography>
                }
              />
            )}
          />
          <Button
            type="submit"
            variant="contained"
            disableElevation
            disabled={saving}
            startIcon={saving ? <CircularProgress size={16}
color="inherit" /> : <SaveRoundedIcon />}
            sx={{ borderRadius: 2.5, fontWeight: 700 }}
          >
            Guardar
          </Button>
        </Stack>
      </Box>
    </PanelCard>
  );
}
