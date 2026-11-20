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
import MenuBookOutlinedIcon from '@mui/icons-material/MenuBookOutlined';
import OpenInNewRoundedIcon from '@mui/icons-material/OpenInNewRounded';
import {
  Box,
  Button,
  CircularProgress,
  FormControlLabel,
  Stack,
  Switch,
  TextField,
} from '@mui/material';
import { Controller, useForm } from 'react-hook-form';
import { linktreeUrl } from 'src/utils/sweepstouch-urls';
import { useSaveCircularSource, type CircularSourceValues as Values } from './use-circular-source';

export function CircularSourceCard({
  storeId,
  storeSlug,
  circularssUrl = '',
  circularPriority = 'circularss',
}: {
  storeId: string;
  storeSlug?: string;
  circularssUrl?: string;
  circularPriority?: 'circularss' | 'panel';
}) {
  const { control, register, handleSubmit, formState, reset } = useForm<Values>({
    defaultValues: { circularssUrl, panelFirst: circularPriority === 'panel' },
  });
  const save = useSaveCircularSource(storeId);
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
        onSubmit={handleSubmit((v) =>
          save.mutate(v, {
            onSuccess: () => reset({ ...v, circularssUrl: v.circularssUrl.trim() }),
          })
        )}
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
          gap={1}
        >
          {storeSlug && (
            <Button
              href={linktreeUrl(storeSlug)}
              target="_blank"
              rel="noopener noreferrer"
              endIcon={<OpenInNewRoundedIcon />}
              sx={{ borderRadius: 999, fontWeight: 700 }}
            >
              Ver en el linktree
            </Button>
          )}
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
