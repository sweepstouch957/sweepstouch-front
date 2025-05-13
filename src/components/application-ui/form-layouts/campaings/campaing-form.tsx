import { zodResolver } from '@hookform/resolvers/zod';
import {
  Autocomplete,
  Box,
  Button,
  FormHelperText,
  Input,
  InputLabel,
  MenuItem,
  TextField,
} from '@mui/material';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import dayjs from 'dayjs';
import React from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { useStores } from '../../../../hooks/stores/useStores';

const campaignSchema = z
  .object({
    title: z.string().min(1, 'El título es obligatorio'),
    type: z.enum(['SMS', 'MMS', 'Flyer', 'Sale', 'Promotion'], {
      errorMap: () => ({ message: 'Seleccione un tipo de campaña válido' }),
    }),
    description: z.string().optional(),
    content: z.string().min(1, 'El contenido es obligatorio'),
    startDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
      message: 'Fecha de inicio inválida',
    }),
    endDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
      message: 'Fecha de finalización inválida',
    }),
    image: z
      .any()
      .refine((file) => file instanceof File, {
        message: 'Se requiere una imagen para campañas MMS',
      })
      .optional(),
    storeId: z.string().min(1, 'La tienda es obligatoria'),
  })
  .superRefine((data, ctx) => {
    const start = Date.parse(data.startDate);
    const end = Date.parse(data.endDate);

    if (!isNaN(start) && !isNaN(end) && end <= start) {
      ctx.addIssue({
        path: ['endDate'],
        code: z.ZodIssueCode.custom,
        message: 'La fecha de finalización debe ser posterior a la de inicio',
      });
    }

    if (data.type === 'MMS' && !(data.image instanceof File)) {
      ctx.addIssue({
        path: ['image'],
        code: z.ZodIssueCode.custom,
        message: 'Se requiere una imagen para campañas MMS',
      });
    }
  });

const CampaignForm = ({ onSubmit }) => {
  const { stores } = useStores({ limit: 300 });

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(campaignSchema),
    mode: 'onBlur',
    defaultValues: {
      title: '',
      type: '',
      description: '',
      content: '',
      startDate: '',
      endDate: '',
      image: null,
      storeId: '',
    },
  });

  const campaignType = watch('type');

  const handleFileChange = (e) => {
    setValue('image', e.target.files[0]);
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box
        component="form"
        onSubmit={handleSubmit(onSubmit)}
        sx={{
          p: 2,
        }}
      >
        <Controller
          name="title"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              label="Título"
              fullWidth
              margin="normal"
              error={!!errors.title}
              helperText={errors.title?.message}
            />
          )}
        />

        <Controller
          name="type"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              select
              label="Tipo"
              fullWidth
              margin="normal"
              error={!!errors.type}
              helperText={errors.type?.message}
            >
              {['SMS', 'MMS', 'Flyer', 'Sale', 'Promotion'].map((option) => (
                <MenuItem
                  key={option}
                  value={option}
                >
                  {option}
                </MenuItem>
              ))}
            </TextField>
          )}
        />

        <Controller
          name="storeId"
          control={control}
          render={({ field: { onChange, value } }) => (
            <Autocomplete
              options={stores || []}
              getOptionLabel={(option) => option.name || ''}
              onChange={(_, selected) => onChange(selected?.id || '')}
              value={stores.find((s) => s.id === value) || null}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Tienda"
                  margin="normal"
                  fullWidth
                  error={!!errors.storeId}
                  helperText={errors.storeId?.message}
                />
              )}
            />
          )}
        />

        {campaignType === 'MMS' && (
          <Box marginY={2}>
            <InputLabel htmlFor="image">Imagen</InputLabel>
            <Input
              id="image"
              type="file"
              onChange={handleFileChange}
              error={!!errors.image}
            />
            {errors.image && (
              <FormHelperText error>{errors.image.message.toString()}</FormHelperText>
            )}
          </Box>
        )}

        <Controller
          name="description"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              label="Descripción"
              fullWidth
              margin="normal"
              multiline
              rows={4}
            />
          )}
        />

        <Controller
          name="content"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              label="Contenido"
              fullWidth
              margin="normal"
              multiline
              rows={4}
              error={!!errors.content}
              helperText={
                errors.content?.message ||
                'Puedes usar #StoreName, #code, #n para insertar variables dinámicas'
              }
            />
          )}
        />

        <Controller
          name="startDate"
          control={control}
          render={({ field }) => (
            <DatePicker
              {...field}
              label="Fecha de Inicio"
              minDate={dayjs()}
              value={field.value ? dayjs(field.value) : null}
              onChange={(date) => field.onChange(date?.toISOString() || '')}
              slotProps={{
                textField: {
                  fullWidth: true,
                  margin: 'normal',
                  error: !!errors.startDate,
                  helperText: errors.startDate?.message,
                },
              }}
            />
          )}
        />

        <Controller
          name="endDate"
          control={control}
          render={({ field }) => (
            <DatePicker
              {...field}
              label="Fecha de Finalización"
              minDate={dayjs()}
              value={field.value ? dayjs(field.value) : null}
              onChange={(date) => field.onChange(date?.toISOString() || '')}
              slotProps={{
                textField: {
                  fullWidth: true,
                  margin: 'normal',
                  error: !!errors.endDate,
                  helperText: errors.endDate?.message,
                },
              }}
            />
          )}
        />

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
          <Button
            type="submit"
            variant="contained"
            color="primary"
          >
            Guardar
          </Button>
        </Box>
      </Box>
    </LocalizationProvider>
  );
};

export default CampaignForm;
