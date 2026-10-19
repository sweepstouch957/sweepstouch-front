'use client';

/**
 * Listas de compra por tienda (Store.listsEnabled / listsLinkUrl). Apagadas: el linktree no
 * muestra "haz tu lista", Mi cuenta esconde la pestaña y la tarjeta de lista, y el RCS del
 * piloto sale sin botón de lista. El link alternativo ocupa el lugar de la lista si existe.
 * "¿Quiere lista?" = No (12 oct 2026): además los agentes (Hermes y compañía, arte de campaña,
 * Revisión IA, Iris) no le cargan flyers ni productos — circular-service lo revisa.
 */
import {
  PanelCard,
  SectionHeader,
} from '@/components/application-ui/content-shells/store-managment/panel-kit';
import ChecklistRoundedIcon from '@mui/icons-material/ChecklistRounded';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  FormControlLabel,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import { Controller, useForm, useWatch, type Control, type FormState, type UseFormRegister } from 'react-hook-form';
import { useSaveListsSettings, type ListsValues } from './use-lists-settings';
import { validateListsLink } from './utils';

/** Lo que sólo aparece con "No quiere lista". Observa el switch acá para no repintar la tarjeta. */
function NoListExtras({
  control,
  register,
  errors,
}: {
  control: Control<ListsValues>;
  register: UseFormRegister<ListsValues>;
  errors: FormState<ListsValues>['errors'];
}) {
  const on = useWatch({ control, name: 'listsEnabled' });
  if (on) return null;
  const { ref, ...linkField } = register('listsLinkUrl', { validate: validateListsLink });
  return (
    <>
      <Alert
        severity="warning"
        sx={{ borderRadius: 2 }}
      >
        Los agentes no le cargarán flyers, arte de campaña ni productos a esta tienda, y la Revisión
        IA la salta.
      </Alert>
      {/* El link sólo tiene sentido con las listas apagadas: con Sí ni se muestra. */}
      <TextField
        {...linkField}
        inputRef={ref}
        size="small"
        label="Link que ocupa el lugar de la lista (opcional)"
        placeholder="https://..."
        error={!!errors.listsLinkUrl}
        helperText={
          errors.listsLinkUrl?.message ||
          'La tarjeta del linktree y Mi cuenta abren este link. Vacío = no se muestra nada.'
        }
      />
    </>
  );
}

export function ListsCard({
  storeId,
  listsEnabled = true,
  listsLinkUrl = '',
}: {
  storeId: string;
  listsEnabled?: boolean;
  listsLinkUrl?: string;
}) {
  const { control, register, handleSubmit, formState, reset } = useForm<ListsValues>({
    defaultValues: { listsEnabled, listsLinkUrl },
  });
  const save = useSaveListsSettings(storeId);

  const onSubmit = (v: ListsValues) =>
    save.mutate(v, {
      onSuccess: () => reset({ listsEnabled: v.listsEnabled, listsLinkUrl: v.listsLinkUrl.trim() }),
    });

  return (
    <PanelCard>
      <SectionHeader
        icon={<ChecklistRoundedIcon sx={{ fontSize: 20, color: 'primary.main' }} />}
        title="¿Quiere lista?"
        hint="Con No: los agentes no cargan flyer ni productos, y la lista se oculta en el linktree, Mi cuenta y el RCS"
      />
      <Box
        component="form"
        onSubmit={handleSubmit(onSubmit)}
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
        <NoListExtras
          control={control}
          register={register}
          errors={formState.errors}
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
