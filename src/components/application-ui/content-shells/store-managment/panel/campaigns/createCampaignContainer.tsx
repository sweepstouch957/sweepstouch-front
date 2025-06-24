'use client';

import { campaignClient } from '@/services/campaing.service';
import { uploadCampaignImage } from '@/services/upload.service';
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Snackbar,
} from '@mui/material';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import CreateCampaignForm from './create-campaing';

interface CampaignFormContainerProps {
  storeId: string;
  provider: string;
  phoneNumber: string;
  totalAudience: number;
  initialData?: any;
}

export default function CampaignFormContainer({
  storeId,
  provider,
  phoneNumber,
  totalAudience,
  initialData,
}: CampaignFormContainerProps) {
  const [successOpen, setSuccessOpen] = useState(false);
  const [errorOpen, setErrorOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [formData, setFormData] = useState<any>(null);
  const router = useRouter();

  const isEditing = !!initialData;


  const mutation = useMutation({
    mutationFn: async (data: any) => {
      try {
        const hasImage = data.image && data.image.length > 0;
        let uploadedImage = null;

        // Solo sube si no es una URL existente
        if (
          hasImage &&
          typeof data.image[0] === 'object' &&
          !(data.image[0].url || data.image[0].startsWith?.('http'))
        ) {
          uploadedImage = await uploadCampaignImage(data.image[0]);
        }

        const payload = {
          ...data,
          image: uploadedImage?.url || data.imageUrl || null,
          imagePublicId: uploadedImage?.public_id || data.imagePublicId || null,
          customAudience: totalAudience,
        };

        const response = isEditing
          ? await campaignClient.updateCampaign(initialData._id, payload)
          : await campaignClient.createCampaign(payload, storeId);

        return response;
      } catch (error) {
        console.error('❌ API error:', error);
        throw error;
      }
    },
    onSuccess: () => {
      setSuccessOpen(true);
      setConfirmOpen(false);
      setFormData(null);

      setTimeout(() => {
        router.back();
      }, 500);
    },
    onError: () => {
      setErrorOpen(true);
      setConfirmOpen(false);
    },
    onSettled: (data, error) => {
      console.log('🎯 Mutation settled:', { data, error });
    },
  });

  const handleSubmit = (data: any) => {
    setFormData(data);
    setConfirmOpen(true);
  };

  const confirmAndSend = () => {
    if (formData) {
      mutation.mutate(formData);
    }
  };

  return (
    <>
      <CreateCampaignForm
        onSubmit={handleSubmit}
        provider={provider}
        phoneNumber={phoneNumber}
        totalAudience={totalAudience}
        initialValues={initialData}
        isEditing={isEditing}
      />

      <Dialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
      >
        <DialogTitle>Confirmar {isEditing ? 'edición' : 'creación'}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            ¿Estás seguro de que deseas {isEditing ? 'editar' : 'crear'} esta campaña?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setConfirmOpen(false)}
            color="secondary"
          >
            Cancelar
          </Button>
          <Button
            onClick={confirmAndSend}
            color="primary"
            variant="contained"
            disabled={mutation.isPending}
          >
            {mutation.isPending ? (isEditing ? 'Guardando...' : 'Creando...') : 'Confirmar'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={successOpen}
        autoHideDuration={6000}
        onClose={() => setSuccessOpen(false)}
      >
        <Alert
          onClose={() => setSuccessOpen(false)}
          severity="success"
          sx={{ width: '100%' }}
        >
          ¡Campaña {isEditing ? 'actualizada' : 'creada'} con éxito!
        </Alert>
      </Snackbar>

      <Snackbar
        open={errorOpen}
        autoHideDuration={6000}
        onClose={() => setErrorOpen(false)}
      >
        <Alert
          onClose={() => setErrorOpen(false)}
          severity="error"
          sx={{ width: '100%' }}
        >
          Hubo un error al {isEditing ? 'editar' : 'crear'} la campaña. Inténtalo de nuevo.
        </Alert>
      </Snackbar>
    </>
  );
}
