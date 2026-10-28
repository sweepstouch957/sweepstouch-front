'use client';

/**
 * Circular semanal de la tienda: el link de Circularss (de ahí se trae el PDF de la semana) y
 * qué circular manda en el linktree cuando hay los dos (Store.circularssUrl / circularPriority).
 * Antes sólo se editaba en el perfil de la tienda.
 */
import {
  PanelCard,
  SectionHeader,
} from '@/components/application-ui/content-shells/store-managment/panel-kit';
import { updateStorePatch } from '@/services/store.service';
import MenuBookOutlinedIcon from '@mui/icons-material/MenuBookOutlined';
import {
  Box,
  Button,
  CircularProgress,
  FormControlLabel,
  Stack,
  Switch,
  TextField,
} from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Controller, useForm } from 'react-hook-form';

type Values = { circularssUrl: string; panelFirst: boolean };

export function CircularSourceCard({
  storeId,
  circularssUrl = '',
  circularPriority = 'circularss',
}: {
  storeId: string;
  circularssUrl?: string;
  circularPriority?: 'circularss' | 'panel';
}) {
  const qc = useQueryClient();
  const { control, register, handleSubmit, formState, reset } = useForm<Values>({
    defaultValues: { circularssUrl, panelFirst: circularPriority === 'panel' },
  });
  const save = useMutation({
    mutationFn: (v: Values) =>
      updateStorePatch(storeId, {
        circularssUrl: v.circularssUrl.trim() || null,
        circularPriority: v.panelFirst ? 'panel' : 'circularss',
      } as any),
    onSuccess: (_r, v) => {
      toast.success('Circular semanal guardado');
      reset({ ...v, circularssUrl: v.circularssUrl.trim() });
      qc.invalidateQueries({ queryKey: ['store', storeId] });
    },
    onError: (e: any) => toast.error(e?.response?.data?.error || 'No se pudo guardar'),
  });
  const { ref, ...urlField } = register('circularssUrl', {
    validate: (v) => !v.trim() || /^https?:\/\//i.test(v.trim()) || 'Debe empezar con http(s)://',
  });

  return (
    <PanelCard>
      <SectionHeader
        icon={<MenuBookOutlinedIcon sx={{ fontSize: 20, color: 'primary.main' }} />}
        title="Circular semanal"
        hint="De dónde se trae el circular de la semana y cuál manda en el linktree"
      />
      <Box
        component="form"
        onSubmit={handleSubmit((v) => save.mutate(v))}
        sx={{ p: 2.25, display: 'grid', gap: 1.5 }}
      >
        <TextField
          {...urlField}
          inputRef={ref}
          size="small"
          label="Link de Circularss"
          placeholder="https://api.circularss.com/dl/..."
          error={!!formState.errors.circularssUrl}
          helperText={
            formState.errors.circularssUrl?.message ||
            'Vacío = la tienda no trae circular por link (se sube a mano).'
          }
        />
        <Controller
          name="panelFirst"
          control={control}
          render={({ field }) => (
            <FormControlLabel
              control={
                <Switch
                  checked={field.value}
                  onChange={(e) => field.onChange(e.target.checked)}
                />
              }
              label="En el linktree manda el PDF subido en el panel (si no, el de Circularss)"
            />
          )}
        />
        <Stack
          direction="row"
          justifyContent="flex-end"
        >
          <Button
            type="submit"
            variant="contained"
            disableElevation
            disabled={save.isPending || !formState.isDirty}
            startIcon={
              save.isPending ? (
                <CircularProgress
                  size={14}
                  color="inherit"
                />
              ) : undefined
            }
            sx={{ borderRadius: 999, fontWeight: 700 }}
          >
            Guardar
          </Button>
        </Stack>
      </Box>
    </PanelCard>
  );
}
