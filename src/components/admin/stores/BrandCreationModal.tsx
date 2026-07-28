import { useBrands } from '@/hooks/fetching/brands/useBrands';
import { uploadCampaignImage } from '@/services/upload.service';
import brandService, { Brand } from '@/services/brand.service';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
  Switch,
  FormControlLabel,
} from '@mui/material';
import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import AvatarUploadLogo from 'src/components/application-ui/upload/avatar/avatar-upload-logo';

interface BrandCreationModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: (newBrandId: string) => void;
  initialData?: Brand | null;
}

export const BrandCreationModal: React.FC<BrandCreationModalProps> = ({
  open,
  onClose,
  onSuccess,
  initialData,
}) => {
  const { refetch } = useBrands();
  const [name, setName] = useState('');
  const [active, setActive] = useState(true);
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string>('');

  useEffect(() => {
    if (initialData && open) {
      setName(initialData.name || '');
      setActive(initialData.active !== false);
      setImageUrl(initialData.image || '');
      setImageFile(null);
    } else if (open) {
      setName('');
      setActive(true);
      setImageUrl('');
      setImageFile(null);
    }
  }, [initialData, open]);

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error('El nombre de la marca es obligatorio');
      return;
    }

    setLoading(true);

    try {
      // 1. Upload image if exists
      let finalImageUrl = imageUrl || 'no-image.jpg';
      if (imageFile) {
        const uploadRes = await uploadCampaignImage(imageFile, 'brands');
        finalImageUrl = uploadRes.url || finalImageUrl;
      }

      // 2. Create or Update Brand
      let newBrandId = '';
      if (initialData?.id || initialData?._id) {
         await brandService.updateBrand(initialData.id || initialData._id!, {
           name: name.trim(),
           image: finalImageUrl,
           active: active,
         });
         toast.success('Marca actualizada exitosamente');
      } else {
         const brandRes = await brandService.createBrand({
           name: name.trim(),
           image: finalImageUrl,
           active: active,
         });
         newBrandId = brandRes?.id || brandRes?._id;
         toast.success('Marca creada exitosamente');
      }

      refetch(); // refresca la lista de marcas

      if (onSuccess && newBrandId) {
        onSuccess(newBrandId);
      }

      handleClose();
    } catch (error: any) {
      console.error('Error saving brand:', error);
      toast.error(error?.response?.data?.error || 'Error al guardar la marca');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setName('');
    setImageFile(null);
    setImageUrl('');
    onClose();
  };

  const isEdit = Boolean(initialData);

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>{isEdit ? 'Editar Marca' : 'Crear Nueva Marca'}</DialogTitle>
      <DialogContent>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mb: 3 }}
        >
          {isEdit ? 'Edita los campos de la marca.' : 'Ingresa el nombre de la marca y opcionalmente su logotipo.'}
        </Typography>

        <TextField
          autoFocus
          margin="dense"
          label="Nombre de la Marca"
          type="text"
          fullWidth
          value={name}
          onChange={(e) => setName(e.target.value)}
          sx={{ mb: 3 }}
        />

        {isEdit && (
          <FormControlLabel
            control={
              <Switch checked={active} onChange={(e) => setActive(e.target.checked)} />
            }
            label={active ? 'Marca Activa' : 'Marca Inactiva'}
            sx={{ mb: 3, display: 'block' }}
          />
        )}

        <Box sx={{ mb: 2 }}>
           <AvatarUploadLogo 
              label="Logotipo de la Marca"
              initialUrl={imageUrl}
              onSelect={(file, url) => {
                 setImageFile(file);
                 if (url) setImageUrl(url);
              }}
           />
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 2, pt: 0 }}>
        <Button
          onClick={handleClose}
          color="inherit"
          disabled={loading}
        >
          Cancelar
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading || !name.trim()}
        >
          {loading ? 'Guardando...' : (isEdit ? 'Guardar Cambios' : 'Crear Marca')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
