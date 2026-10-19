'use client';

/**
 * Alta / edición de un banner. El formulario es dueño de sus campos; el padre lo monta con
 * `key` por banner (y lo vuelve a montar al guardar), así los valores por defecto alcanzan.
 */
import type { StoreBanner } from '@/services/circular.service';
import { Box, Button, Stack, TextField, Typography } from '@mui/material';
import { Controller, useForm, useWatch, type Control, type UseFormRegister } from 'react-hook-form';
import BannerImagePicker from './BannerImagePicker';
import { bannerDefaults, blockSx, validRange, type BannerValues } from './utils';

export default function BannerForm({
  editing,
  saving,
  uploading,
  onUpload,
  onSave,
  onCancel,
}: {
  /** Banner que se edita; null = nuevo. */
  editing: StoreBanner | null;
  saving: boolean;
  uploading: boolean;
  /** Sube la imagen y devuelve su URL (null si falló: el aviso lo da la mutación). */
  onUpload: (file: File) => Promise<string | null>;
  onSave: (values: BannerValues) => void;
  onCancel: () => void;
}) {
  const { control, register, handleSubmit } = useForm<BannerValues>({
    defaultValues: bannerDefaults(editing),
  });
  const { ref: titleRef, ...title } = register('title');

  return (
    <Box
      component="form"
      noValidate
      onSubmit={handleSubmit((v) => {
        if (v.imageUrl && validRange(v.startDate, v.endDate)) onSave(v);
      })}
      sx={{
        ...blockSx,
        borderColor: editing ? 'primary.main' : 'divider',
        display: 'flex',
        flexDirection: 'column',
        gap: 1.5,
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ minHeight: 30 }}
      >
        <Typography
          variant="subtitle2"
          fontWeight={700}
        >
          {editing ? 'Editando banner' : 'Nuevo banner'}
        </Typography>
        {editing && (
          <Button
            size="small"
            color="inherit"
            onClick={onCancel}
          >
            Cancelar
          </Button>
        )}
      </Stack>
      <Controller
        control={control}
        name="imageUrl"
        render={({ field }) => (
          <BannerImagePicker
            value={field.value}
            uploading={uploading}
            onFile={async (file) => {
              const url = await onUpload(file);
              if (url) field.onChange(url);
            }}
          />
        )}
      />
      <TextField
        size="small"
        fullWidth
        label="Título (texto alternativo)"
        placeholder="Ej.: Labor Day Sale"
        inputRef={titleRef}
        {...title}
        inputProps={{ maxLength: 120 }}
      />
      <DateFields
        control={control}
        register={register}
      />
      <SubmitBar
        control={control}
        editing={!!editing}
        saving={saving}
        uploading={uploading}
      />
    </Box>
  );
}

function DateFields({
  control,
  register,
}: {
  control: Control<BannerValues>;
  register: UseFormRegister<BannerValues>;
}) {
  const [start, end] = useWatch({ control, name: ['startDate', 'endDate'] });
  const valid = validRange(start, end);
  const { ref: startRef, ...startField } = register('startDate');
  const { ref: endRef, ...endField } = register('endDate');
  return (
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      gap={1.5}
    >
      <TextField
        size="small"
        fullWidth
        type="date"
        label="Desde"
        InputLabelProps={{ shrink: true }}
        inputRef={startRef}
        {...startField}
      />
      <TextField
        size="small"
        fullWidth
        type="date"
        label="Hasta (inclusive)"
        InputLabelProps={{ shrink: true }}
        inputRef={endRef}
        {...endField}
        error={!valid}
        helperText={!valid ? 'El fin no puede ser antes del inicio' : undefined}
      />
    </Stack>
  );
}

function SubmitBar({
  control,
  editing,
  saving,
  uploading,
}: {
  control: Control<BannerValues>;
  editing: boolean;
  saving: boolean;
  uploading: boolean;
}) {
  const [imageUrl, start, end] = useWatch({
    control,
    name: ['imageUrl', 'startDate', 'endDate'],
  });
  const canSave = !!imageUrl && validRange(start, end) && !uploading && !saving;
  return (
    <Button
      type="submit"
      variant="contained"
      disabled={!canSave}
      sx={{ alignSelf: { xs: 'stretch', sm: 'flex-end' } }}
    >
      {saving ? 'Guardando…' : editing ? 'Guardar cambios' : 'Guardar banner'}
    </Button>
  );
}
