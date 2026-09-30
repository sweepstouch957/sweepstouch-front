'use client';

/**
 * Número para listas: el teléfono que la tienda quiere mostrar a sus clientes. Si está
 * prendido, el bot de WhatsApp lo pone al final de todos sus mensajes de esa tienda
 * (Store.listsPhone / listsPhoneEnabled, ver whatsapp-bot-service shopperTemplates).
 */

import { PanelCard, SectionHeader } from '@/components/application-ui/content-shells/store-managment/panel-kit';
import { updateStorePatch } from '@/services/store.service';
import PhoneInTalkRoundedIcon from '@mui/icons-material/PhoneInTalkRounded';
import { Box, Button, CircularProgress, FormControlLabel, Stack, Switch, TextField, Typography } from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Controller, useForm, useWatch } from 'react-hook-form';
import toast from 'react-hot-toast';

type Values = { listsPhone: string; listsPhoneEnabled: boolean };

const digits = (v: string) => v.replace(/\D/g, '');
const pretty = (v: string) => {
  const d = digits(v);
  const ten = d.length === 11 && d.startsWith('1') ? d.slice(1) : d;
  return ten.length === 10 ? `(${ten.slice(0, 3)}) ${ten.slice(3, 6)}-${ten.slice(6)}` : v;
};

/** Cómo sale al final del mensaje del bot. */
function Preview({ control }: { control: any }) {
  const [phone, on] = useWatch({ control, name: ['listsPhone', 'listsPhoneEnabled'] });
  const ok = on && digits(phone || '').length >= 10;
  return (
    <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: 'action.hover', fontSize: 13, whiteSpace: 'pre-line', color: ok ? 'text.primary' : 'text.disabled' }}>
      {ok
        ? `…\n3️⃣ Just browsing\n\n📞 Questions about your list? Contact the store: ${pretty(phone)}`
        : 'Apagado: el bot no muestra ningún número de la tienda.'}
    </Box>
  );
}

export function ListsPhoneCard({
  storeId,
  listsPhone = '',
  listsPhoneEnabled = false,
}: {
  storeId: string;
  listsPhone?: string;
  listsPhoneEnabled?: boolean;
}) {
  const qc = useQueryClient();
  const { control, register, handleSubmit, formState, reset } = useForm<Values>({
    defaultValues: { listsPhone, listsPhoneEnabled },
  });

  const save = useMutation({
    mutationFn: (v: Values) =>
      updateStorePatch(storeId, { listsPhone: digits(v.listsPhone), listsPhoneEnabled: v.listsPhoneEnabled }),
    onSuccess: (_r, v) => {
      toast.success(v.listsPhoneEnabled ? 'Número guardado: ya sale en el bot' : 'Guardado: el bot no muestra el número');
      reset({ listsPhone: digits(v.listsPhone), listsPhoneEnabled: v.listsPhoneEnabled });
      qc.invalidateQueries({ queryKey: ['store', storeId] });
    },
    onError: (e: any) => toast.error(e?.response?.data?.error || 'No se pudo guardar'),
  });

  const { ref, ...phoneField } = register('listsPhone', {
    validate: (v) => !v || digits(v).length === 10 || (digits(v).length === 11 && digits(v).startsWith('1')) || 'Número de 10 dígitos',
  });

  return (
    <PanelCard sx={{ mb: 2 }}>
      <SectionHeader
        icon={<PhoneInTalkRoundedIcon sx={{ fontSize: 20, color: 'success.main' }} />}
        title="Número para listas (WhatsApp)"
        hint="Sale al final de los mensajes del bot a los clientes de esta tienda"
      />
      <Box
        component="form"
        onSubmit={handleSubmit((v) => save.mutate(v))}
        sx={{ p: 2.25, display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: 'minmax(0,1fr) minmax(0,1.2fr)' } }}
      >
        <Stack gap={1.5}>
          <TextField
            {...phoneField}
            inputRef={ref}
            size="small"
            label="Teléfono de la tienda para listas"
            placeholder="(718) 293-3032"
            error={!!formState.errors.listsPhone}
            helperText={formState.errors.listsPhone?.message || 'Al que los clientes llaman o escriben por su lista.'}
            inputProps={{ inputMode: 'tel' }}
          />
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            gap={1}
            flexWrap="wrap"
          >
            <Controller
              name="listsPhoneEnabled"
              control={control}
              render={({ field }) => (
                <FormControlLabel
                  control={
                    <Switch
                      checked={field.value}
                      onChange={(e) => field.onChange(e.target.checked)}
                    />
                  }
                  label={<Typography sx={{ fontSize: 14, fontWeight: 600 }}>{field.value ? 'Mostrar en el bot' : 'No mostrar'}</Typography>}
                />
              )}
            />
            <Button
              type="submit"
              variant="contained"
              disableElevation
              disabled={save.isPending || !formState.isDirty}
              startIcon={save.isPending ? <CircularProgress size={14}
color="inherit" /> : undefined}
              sx={{ borderRadius: 999, fontWeight: 700 }}
            >
              Guardar
            </Button>
          </Stack>
        </Stack>
        <Stack gap={0.75}>
          <Typography variant="caption"
color="text.secondary"
fontWeight={700}>
            ASÍ SALE AL FINAL DEL MENSAJE
          </Typography>
          <Preview control={control} />
        </Stack>
      </Box>
    </PanelCard>
  );
}
