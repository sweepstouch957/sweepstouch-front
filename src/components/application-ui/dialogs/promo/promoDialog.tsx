'use client';

import { promoService } from '@/services/promo.service';
import { Sweepstakes } from '@/services/sweepstakes.service';
import { uploadCampaignImage } from '@/services/upload.service';
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
  Snackbar,
  Stack,
  Switch,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { useMutation } from '@tanstack/react-query';
import { formatISO, parseISO } from 'date-fns';
import React, { useEffect, useState } from 'react';
import AvatarUploadLogo from '../../upload/avatar/avatar-upload-logo';

interface CreateOrEditPromoModalProps {
  open: boolean;
  onClose: () => void;
  sweepstakes: Sweepstakes[];
  stores: { _id: string; name: string }[];
  loadingSweepstakes?: boolean;
  storeId?: string;
  promo?: any; // ✅ promo precargado desde tabla
}

export const CreateOrEditPromoModal: React.FC<CreateOrEditPromoModalProps> = ({
  open,
  onClose,
  sweepstakes,
  stores,
  loadingSweepstakes,
  storeId,
  promo,
}) => {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const isEdit = Boolean(promo);

  const [uploadingImage, setUploadingImage] = useState(false);
  const [snack, setSnack] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error',
  });

  const [formData, setFormData] = useState({
    title: '',
    imageMobile: '',
    imageDesktop: '',
    link: '',
    type: 'tablet',
    category: storeId ? 'custom' : 'generic',
    sweepstakeId: '',
    storeId: storeId || '',
    startDate: new Date(),
    endDate: new Date(),
  });

  useEffect(() => {
    if (open) {
      if (promo) {
        setFormData({
          title: promo.title || '',
          imageMobile: promo.imageMobile || '',
          imageDesktop: promo.imageDesktop || '',
          link: promo.link || '',
          type: promo.type || 'tablet',
          category: promo.category || 'custom',
          sweepstakeId: promo.sweepstakeId || '',
          storeId: promo.storeId?._id || promo.storeId || '',
          startDate: promo.startDate ? parseISO(promo.startDate) : new Date(),
          endDate: promo.endDate ? parseISO(promo.endDate) : new Date(),
        });
      } else {
        setFormData((prev) => ({
          ...prev,
          category: storeId ? 'custom' : 'generic',
          storeId: storeId || '',
        }));
      }
    }
  }, [open, promo, storeId]);

  const handleChange = (key: string, value: any) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const mutation = useMutation({
    mutationFn: async () => {
      const payload: any = {
        ...formData,
        startDate: formatISO(formData.startDate),
        endDate: formatISO(formData.endDate),
      };

      if (isEdit) {
        if (formData.category === 'generic') {
          return promoService.updatePromosBySweepstake(formData.sweepstakeId, payload);
        } else {
          delete payload.sweepstakeId;
          return promoService.updatePromo(promo._id, payload);
        }
      } else {
        if (storeId) {
          return promoService.createPromo(payload);
        }
        if (formData.category === 'generic') {
          const { storeId, ...genericPayload } = payload;
          return promoService.createPromosBySweepstake(payload.sweepstakeId, genericPayload);
        } else {
          const { sweepstakeId, ...customPayload } = payload;
          return promoService.createPromo(customPayload);
        }
      }
    },
    onSuccess: (res) => {
      setSnack({
        open: true,
        message: res.data?.message || (isEdit ? 'Promoción actualizada' : '¡Promoción creada!'),
        severity: 'success',
      });

      setFormData({
        title: '',
        imageMobile: '',
        imageDesktop: '',
        link: '',
        type: '',
        category: '',
        sweepstakeId: '',
        storeId: '',
        startDate: new Date(),
        endDate: new Date(),
      });
      onClose();
    },
    onError: (err: any) => {
      setSnack({
        open: true,
        message: err?.response?.data?.error || 'Error',
        severity: 'error',
      });
    },
  });

  const handleSubmit = () => {
    if (!formData.imageMobile) {
      return setSnack({
        open: true,
        message: 'Debes subir una imagen',
        severity: 'error',
      });
    }
    mutation.mutate();
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        fullScreen={fullScreen}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, p: 1 } }}
      >
        <DialogTitle>
          <Typography
            fontWeight={700}
            fontSize={22}
            mb={1}
          >
            {isEdit ? 'Editar Promoción' : 'Crear Promoción'}
          </Typography>
        </DialogTitle>

        <DialogContent>
          <Stack
            spacing={2}
            mt={1}
          >
            <TextField
              label="Título"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              fullWidth
              variant="outlined"
            />

            {!storeId && !isEdit && (
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.category === 'generic'}
                    onChange={(e) =>
                      handleChange('category', e.target.checked ? 'generic' : 'custom')
                    }
                    color="primary"
                  />
                }
                label={
                  <Typography>
                    {formData.category === 'generic'
                      ? 'Promoción Genérica (por sorteo)'
                      : 'Promoción Personalizada (por tienda)'}
                  </Typography>
                }
              />
            )}

            {!storeId && formData.category === 'generic' && (
              <FormControl
                fullWidth
                disabled={loadingSweepstakes}
              >
                <InputLabel id="sweepstake-label">Sorteo</InputLabel>
                <Select
                  labelId="sweepstake-label"
                  value={formData.sweepstakeId}
                  onChange={(e) => {
                    const selectedId = e.target.value;
                    const selected = sweepstakes.find((s) => s.id === selectedId);
                    handleChange('sweepstakeId', selectedId);
                    if (selected) {
                      handleChange('startDate', new Date(selected.startDate));
                      handleChange('endDate', new Date(selected.endDate));
                    }
                  }}
                  label="Sorteo"
                >
                  {loadingSweepstakes ? (
                    <MenuItem disabled>Cargando sorteos...</MenuItem>
                  ) : (
                    sweepstakes.map((s) => (
                      <MenuItem
                        key={s.id}
                        value={s.id}
                      >
                        {s.name}
                      </MenuItem>
                    ))
                  )}
                </Select>
              </FormControl>
            )}

            {!storeId && formData.category === 'custom' && (
              <FormControl fullWidth>
                <InputLabel id="store-label">Tienda</InputLabel>
                <Select
                  labelId="store-label"
                  value={formData.storeId}
                  onChange={(e) => handleChange('storeId', e.target.value)}
                  label="Tienda"
                >
                  {stores.map((s) => (
                    <MenuItem
                      key={s._id}
                      value={s._id}
                    >
                      {s.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            <TextField
              label="Enlace (opcional)"
              value={formData.link}
              onChange={(e) => handleChange('link', e.target.value)}
              fullWidth
              variant="outlined"
            />

            <FormControl fullWidth>
              <InputLabel id="type-label">Tipo</InputLabel>
              <Select
                labelId="type-label"
                value={formData.type}
                onChange={(e) => handleChange('type', e.target.value)}
                label="Tipo"
              >
                <MenuItem value="tablet">Tablet</MenuItem>
                <MenuItem value="app">App</MenuItem>
                <MenuItem value="kiosk">Kiosk</MenuItem>
              </Select>
            </FormControl>

            <AvatarUploadLogo
              label="Imagen"
              initialUrl={formData.imageMobile}
              onSelect={async (file) => {
                if (!file) return;
                try {
                  setUploadingImage(true);
                  const { url } = await uploadCampaignImage(file, 'promos');
                  handleChange('imageMobile', url);
                } catch {
                  setSnack({ open: true, message: 'Error al subir imagen', severity: 'error' });
                } finally {
                  setUploadingImage(false);
                }
              }}
            />

            <DatePicker
              label="Fecha de inicio"
              value={formData.startDate}
              onChange={(date) => handleChange('startDate', date as Date)}
            />
            <DatePicker
              label="Fecha de fin"
              value={formData.endDate}
              onChange={(date) => handleChange('endDate', date as Date)}
            />
          </Stack>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={onClose}
            color="inherit"
            disabled={mutation.isPending || uploadingImage}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={mutation.isPending || uploadingImage}
          >
            {mutation.isPending || uploadingImage
              ? isEdit
                ? 'Actualizando...'
                : 'Guardando...'
              : isEdit
                ? 'Actualizar'
                : 'Crear'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snack.open}
        autoHideDuration={4000}
        onClose={() => setSnack({ ...snack, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity={snack.severity}
          variant="filled"
          onClose={() => setSnack({ ...snack, open: false })}
          sx={{ width: '100%' }}
        >
          {snack.message}
        </Alert>
      </Snackbar>
    </>
  );
};
