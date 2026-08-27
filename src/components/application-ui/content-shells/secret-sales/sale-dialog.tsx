'use client';

import type { CreateSecretSaleDto, SecretSale } from '@/services/secret-sale.service';
import { uploadCampaignImage } from '@/services/upload.service';
import CloudUploadRounded from '@mui/icons-material/CloudUploadRounded';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { addDays, formatISO } from 'date-fns';
import Image from 'next/image';
import React, { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';

export type SaleFormValues = Omit<CreateSecretSaleDto, 'storeId'>;

interface Props {
  open: boolean;
  onClose: () => void;
  /** null = crear */
  editing: SecretSale | null;
  saving: boolean;
  onSubmit: (values: SaleFormValues) => void;
}

/**
 * Alta/edición de una secret sale. El form vive acá dentro (react-hook-form):
 * el shell sólo recibe los valores ya armados.
 */
export function SaleDialog({ open, onClose, editing, saving, onSubmit }: Props) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));

  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const {
    control,
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<{
    title: string;
    description: string;
    flyerImage: string;
    startDate: Date;
    endDate: Date;
  }>({
    defaultValues: {
      title: editing?.title ?? '',
      description: editing?.description ?? '',
      flyerImage: editing?.flyerImage ?? '',
      startDate: editing ? new Date(editing.startDate) : new Date(),
      // Una semana: es lo que dura un flyer de supermercado. Se puede cambiar.
      endDate: editing ? new Date(editing.endDate) : addDays(new Date(), 7),
    },
  });

  const flyerImage = watch('flyerImage');

  const handleFile = async (file?: File | null) => {
    if (!file) return;
    setUploadError('');
    setUploading(true);
    try {
      const { url } = await uploadCampaignImage(file, 'secret-sales');
      setValue('flyerImage', url, { shouldValidate: true });
    } catch {
      setUploadError('No se pudo subir el flyer. Probá de nuevo.');
    } finally {
      setUploading(false);
    }
  };

  const submit = handleSubmit((values) => {
    onSubmit({
      title: values.title.trim(),
      description: values.description.trim(),
      flyerImage: values.flyerImage,
      startDate: formatISO(values.startDate),
      endDate: formatISO(values.endDate),
    });
  });

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen={fullScreen}
      maxWidth="sm"
      fullWidth
      PaperProps={{ component: 'form', onSubmit: submit, sx: { borderRadius: 3 } }}
    >
      <DialogTitle sx={{ fontWeight: 700 }}>
        {editing ? 'Editar secret sale' : 'Nueva secret sale'}
      </DialogTitle>

      <DialogContent>
        <Stack spacing={2.5} sx={{ mt: 1 }}>
          <TextField
            label="Título"
            fullWidth
            error={!!errors.title}
            helperText={errors.title ? 'El título es obligatorio' : 'Lo ve la persona antes de desbloquear'}
            {...register('title', { required: true })}
          />

          <TextField
            label="Descripción (opcional)"
            fullWidth
            multiline
            minRows={2}
            {...register('description')}
          />

          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Flyer de ofertas
            </Typography>

            {flyerImage ? (
              <Box
                sx={{
                  position: 'relative',
                  width: '100%',
                  aspectRatio: '4 / 5',
                  borderRadius: 2,
                  overflow: 'hidden',
                  mb: 1,
                }}
              >
                <Image src={flyerImage} alt="Flyer" fill sizes="480px" style={{ objectFit: 'cover' }} />
              </Box>
            ) : null}

            <Button
              component="label"
              variant="outlined"
              startIcon={uploading ? <CircularProgress size={16} /> : <CloudUploadRounded />}
              disabled={uploading}
              sx={{ textTransform: 'none', borderRadius: 2 }}
            >
              {flyerImage ? 'Cambiar flyer' : 'Subir flyer'}
              <input
                hidden
                type="file"
                accept="image/*"
                onChange={(e) => handleFile(e.target.files?.[0])}
              />
            </Button>

            {/* El input real es hidden; esto sostiene el valor para react-hook-form */}
            <input type="hidden" {...register('flyerImage', { required: true })} />

            {errors.flyerImage ? (
              <Typography variant="caption" color="error" sx={{ display: 'block', mt: 1 }}>
                Subí el flyer antes de guardar
              </Typography>
            ) : null}
            {uploadError ? (
              <Alert severity="error" sx={{ mt: 1 }}>
                {uploadError}
              </Alert>
            ) : null}
          </Box>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <Controller
              control={control}
              name="startDate"
              render={({ field }) => (
                <DatePicker
                  label="Inicio"
                  value={field.value}
                  onChange={(v) => field.onChange(v)}
                  slotProps={{ textField: { fullWidth: true } }}
                />
              )}
            />
            <Controller
              control={control}
              name="endDate"
              rules={{
                validate: (v, all) =>
                  v > all.startDate || 'El vencimiento tiene que ser posterior al inicio',
              }}
              render={({ field, fieldState }) => (
                <DatePicker
                  label="Vencimiento"
                  value={field.value}
                  minDate={watch('startDate')}
                  onChange={(v) => field.onChange(v)}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      error: !!fieldState.error,
                      helperText: fieldState.error?.message ?? 'Después de esta fecha deja de mostrarse sola',
                    },
                  }}
                />
              )}
            />
          </Stack>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} sx={{ textTransform: 'none' }}>
          Cancelar
        </Button>
        <Button
          type="submit"
          variant="contained"
          disabled={saving || uploading}
          sx={{ textTransform: 'none', borderRadius: 2, px: 3 }}
        >
          {saving ? 'Guardando…' : editing ? 'Guardar cambios' : 'Crear secret sale'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
