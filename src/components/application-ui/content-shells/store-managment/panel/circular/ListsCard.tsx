'use client';

/**
 * Listas de compra por tienda (Store.listsEnabled / listsLinkUrl). Apagadas: el linktree no
 * muestra "haz tu lista", Mi cuenta esconde la pestaña y la tarjeta de lista, y el RCS del
 * piloto sale sin botón de lista. El link alternativo ocupa el lugar de la lista si existe.
 */

import { PanelCard, SectionHeader } from '@/components/application-ui/content-shells/store-managment/panel-kit';
import { updateStorePatch } from '@/services/store.service';
import ChecklistRoundedIcon from '@mui/icons-material/ChecklistRounded';
import { Box, Button, CircularProgress, FormControlLabel, Stack, Switch, TextField, Typography } from '@mui/material';
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
      toast.success(v.listsEnabled ? 'Listas activas para esta tienda' : 'Listas ocultas para esta tienda');
      reset({ listsEnabled: v.listsEnabled, listsLinkUrl: v.listsLinkUrl.trim() });
      qc.invalidateQueries({ queryKey: ['store', storeId] });
    },
    onError: (e: any) => toast.error(e?.response?.data?.error || 'No se pudo guardar'),
  });

  return (
    <PanelCard sx={{ mb: 2 }}>
      <SectionHeader
        icon={<ChecklistRoundedIcon sx={{ fontSize: 20, color: 'primary.main' }} />}
        title="Listas de compra"
        hint="Si la tienda no quiere listas, se ocultan en el linktree, en Mi cuenta y en el RCS"
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
                  {field.value ? 'Listas activas' : 'Sin listas en esta tienda'}
                </Typography>
              }
            />
          )}
        />
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
