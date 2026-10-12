'use client';

/**
 * Listas de compra por tienda (Store.listsEnabled / listsLinkUrl). Apagadas: el linktree no
 * muestra "haz tu lista", Mi cuenta esconde la pestaña y la tarjeta de lista, y el RCS del
 * piloto sale sin botón de lista. El link alternativo ocupa el lugar de la lista si existe.
 * "¿Quiere lista?" = No (12 oct 2026): además los agentes (Hermes y compañía, arte de campaña,
 * Revisión IA, Iris) no le cargan flyers ni productos — circular-service lo revisa.
 */

import { PanelCard, SectionHeader } from '@/components/application-ui/content-shells/store-managment/panel-kit';
import { updateStorePatch } from '@/services/store.service';
import ChecklistRoundedIcon from '@mui/icons-material/ChecklistRounded';
import { Alert, Box, Button, CircularProgress, FormControlLabel, Stack, Switch, TextField, Typography } from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Controller, useForm } from 'react-hook-form';
import toast from 'react-hot-toast';

type Values = { listsEnabled: boolean; listsLinkUrl: string };

export function ListsCard({
  storeId,
  listsEnabled = true,
  listsLinkUrl = '',
}: {
  storeId: string;
  listsEnabled?: boolean;
  listsLinkUrl?: string;
}) {
  const qc = useQueryClient();
  const { control, register, handleSubmit, formState, reset, watch } = useForm<Values>({
    defaultValues: { listsEnabled, listsLinkUrl },
  });
  const on = watch('listsEnabled');

  const save = useMutation({
    mutationFn: (v: Values) =>
      updateStorePatch(storeId, { listsEnabled: v.listsEnabled, listsLinkUrl: v.listsLinkUrl.trim() }),
    onSuccess: (_r, v) => {
      toast.success(v.listsEnabled ? 'La tienda quiere lista: los agentes vuelven a cargar' : 'Sin lista: los agentes no cargarán flyers ni productos');
      reset({ listsEnabled: v.listsEnabled, listsLinkUrl: v.listsLinkUrl.trim() });
      qc.invalidateQueries({ queryKey: ['store', storeId] });
    },
    onError: (e: any) => toast.error(e?.response?.data?.error || 'No se pudo guardar'),
  });

  return (
    <PanelCard sx={{ mb: 2 }}>
      <SectionHeader
        icon={<ChecklistRoundedIcon sx={{ fontSize: 20, color: 'primary.main' }} />}
        title="¿Quiere lista?"
        hint="Con No: los agentes no cargan flyer ni productos, y la lista se oculta en el linktree, Mi cuenta y el RCS"
      />
      <Box
        component="form"
        onSubmit={handleSubmit((v) => save.mutate(v))}
        sx={{ p: 2.25, display: 'grid', gap: 1.5 }}
      >
        <Controller
          name="listsEnabled"
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
                  {field.value ? 'Sí, quiere lista' : 'No quiere lista'}
                </Typography>
              }
            />
          )}
        />
        {!on && (
          <Alert severity="warning" sx={{ borderRadius: 2 }}>
            Los agentes no le cargarán flyers, arte de campaña ni productos a esta tienda, y la Revisión IA la salta.
          </Alert>
        )}
        <TextField
          {...register('listsLinkUrl', {
            validate: (v) =>
              !v.trim() || /^(https?:\/\/)?[a-z0-9.-]+\.[a-z]{2,}(\/\S*)?$/i.test(v.trim()) || 'Link inválido',
          })}
          size="small"
          label="Link que ocupa el lugar de la lista (opcional)"
          placeholder="https://..."
          disabled={on}
          error={!!formState.errors.listsLinkUrl}
          helperText={
            formState.errors.listsLinkUrl?.message ||
            (on
              ? 'Sólo aplica con las listas apagadas.'
              : 'Con listas apagadas, la tarjeta del linktree y Mi cuenta abren este link. Vacío = no se muestra nada.')
          }
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
            startIcon={save.isPending ? <CircularProgress size={14} color="inherit" /> : undefined}
            sx={{ borderRadius: 999, fontWeight: 700 }}
          >
            Guardar
          </Button>
        </Stack>
      </Box>
    </PanelCard>
  );
}
