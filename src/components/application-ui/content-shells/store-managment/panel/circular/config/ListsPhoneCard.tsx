'use client';

/**
 * Número para listas: el teléfono que la tienda quiere mostrar a sus clientes. Si está
 * prendido, el bot de WhatsApp lo pone al final de todos sus mensajes de esa tienda
 * (Store.listsPhone / listsPhoneEnabled, ver whatsapp-bot-service shopperTemplates).
 */
import {
  PanelCard,
  SectionHeader,
} from '@/components/application-ui/content-shells/store-managment/panel-kit';
import PhoneInTalkRoundedIcon from '@mui/icons-material/PhoneInTalkRounded';
import {
  Box,
  Button,
  CircularProgress,
  FormControlLabel,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import { Controller, useForm, useWatch, type Control } from 'react-hook-form';
import { Label } from '../panelUi';
import { useSaveListsPhone, type ListsPhoneValues } from './use-lists-settings';
import { digits, prettyPhone, validateListsPhone } from './utils';

/** Cómo sale al final del mensaje del bot. */
function Preview({ control }: { control: Control<ListsPhoneValues> }) {
  const [phone, on] = useWatch({ control, name: ['listsPhone', 'listsPhoneEnabled'] });
  const ok = on && digits(phone || '').length >= 10;
  return (
    <Box
      sx={{
        p: 1.5,
        borderRadius: 2,
        bgcolor: 'action.hover',
        fontSize: 13,
        whiteSpace: 'pre-line',
        color: ok ? 'text.primary' : 'text.disabled',
      }}
    >
      {ok
        ? `…\n3️⃣ Just browsing\n\n📞 Questions about your list? Contact the store: ${prettyPhone(phone)}`
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
  const { control, register, handleSubmit, formState, reset } = useForm<ListsPhoneValues>({
    defaultValues: { listsPhone, listsPhoneEnabled },
  });
  const save = useSaveListsPhone(storeId);

  const onSubmit = (v: ListsPhoneValues) =>
    save.mutate(v, {
      onSuccess: () =>
        reset({ listsPhone: digits(v.listsPhone), listsPhoneEnabled: v.listsPhoneEnabled }),
    });

  const { ref, ...phoneField } = register('listsPhone', { validate: validateListsPhone });

  return (
    <PanelCard>
      <SectionHeader
        icon={<PhoneInTalkRoundedIcon sx={{ fontSize: 20, color: 'success.main' }} />}
        title="Número para listas (WhatsApp)"
        hint="Sale al final de los mensajes del bot a los clientes de esta tienda"
      />
      <Box
        component="form"
        onSubmit={handleSubmit(onSubmit)}
        sx={{
          p: 2.25,
          display: 'grid',
          gap: 2,
          gridTemplateColumns: { xs: '1fr', md: 'minmax(0,1fr) minmax(0,1.2fr)' },
        }}
      >
        <Stack gap={1.5}>
          <TextField
            {...phoneField}
            inputRef={ref}
            size="small"
            label="Teléfono de la tienda para listas"
            placeholder="(718) 293-3032"
            error={!!formState.errors.listsPhone}
            helperText={
              formState.errors.listsPhone?.message ||
              'Al que los clientes llaman o escriben por su lista.'
            }
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
                  label={
                    <Typography sx={{ fontSize: 14, fontWeight: 600 }}>
                      {field.value ? 'Mostrar en el bot' : 'No mostrar'}
                    </Typography>
                  }
                />
              )}
            />
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
        </Stack>
        <Box>
          <Label>Así sale al final del mensaje</Label>
          <Preview control={control} />
        </Box>
      </Box>
    </PanelCard>
  );
}
