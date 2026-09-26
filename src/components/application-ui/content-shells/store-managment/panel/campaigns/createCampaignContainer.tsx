'use client';

import { campaignClient } from '@/services/campaing.service';
import { DEFAULT_INFOBIP_SENDER } from '@/services/store.service';
import { uploadCampaignArt, uploadCampaignImage, type CampaignArtUpload } from '@/services/upload.service';
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
import { useState } from 'react';
import CreateCampaignForm from './create-campaing';

interface CampaignFormContainerProps {
  storeId: string;
  provider: string;
  phoneNumber: string;
  totalAudience: number;
  initialData?: any;
  onCreate: () => void;
}

export default function CampaignFormContainer({
  storeId,
  provider,
  phoneNumber,
  totalAudience,
  initialData,
  onCreate,
}: CampaignFormContainerProps) {
  const [successOpen, setSuccessOpen] = useState(false);
  const [errorOpen, setErrorOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  // Con arte, al agendar se leen sus productos solos: se avisa para que nadie los cargue a mano.
  const [withArt, setWithArt] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [formData, setFormData] = useState<any>(null);

  const isEditing = !!initialData;

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      try {
        const hasImage = data.image && data.image.length > 0;
        let uploadedImage: CampaignArtUpload | null = null;
        if (
          hasImage &&
          typeof data.image[0] === 'object' &&
          !(data.image[0].url || data.image[0].startsWith?.('http'))
        ) {
          // Cualquier peso (hasta 100 MB): el MMS lleva la copia < 500 KB y el original
          // queda para leer los productos al agendar.
          uploadedImage = await uploadCampaignArt(data.image[0]);
        }

        // Miniatura del linktree — sube aparte, a su propia carpeta. Acá el
        // archivo nuevo GANA sobre el guardado: si alguien la cambia, es porque
        // quiere cambiarla.
        const hasThumb = data.thumbnail && data.thumbnail.length > 0;
        let uploadedThumb = null;
        if (
          hasThumb &&
          typeof data.thumbnail[0] === 'object' &&
          !(data.thumbnail[0].url || data.thumbnail[0].startsWith?.('http'))
        ) {
          uploadedThumb = await uploadCampaignImage(data.thumbnail[0], 'campaign-thumbnails');
        }

        const payload = {
          ...data,
          // El archivo recién subido GANA. Antes `initialData?.image` iba primero:
          // al editar una campaña y cambiarle la imagen, la vieja pisaba a la
          // nueva y la campaña salía con el arte anterior. Sin archivo nuevo, se
          // conserva lo que ya tenía.
          // imageRemoved: se tocó "Quitar" → la campaña queda sin arte (SMS), no vuelve el viejo.
          image: uploadedImage?.url || (data.imageRemoved ? null : data.imageUrl || initialData?.image || null),
          imagePublicId:
            uploadedImage?.public_id ||
            (data.imageRemoved ? null : data.imagePublicId || initialData?.imagePublicId || null),
          // Arte nuevo liviano → sin original aparte (vacío, para no leer productos del arte viejo).
          sourceImage: uploadedImage ? uploadedImage.originalUrl : data.imageRemoved ? '' : initialData?.sourceImage || '',
          sourceImagePublicId: uploadedImage
            ? uploadedImage.originalPublicId
            : data.imageRemoved
              ? ''
              : initialData?.sourceImagePublicId || '',
          thumbnailImage:
            uploadedThumb?.url || data.thumbnailImage || initialData?.thumbnailImage || null,
          thumbnailPublicId:
            uploadedThumb?.public_id || data.thumbnailPublicId || initialData?.thumbnailPublicId || null,
          customAudience: totalAudience,
          platform: provider || '',
          sourceTn: phoneNumber || DEFAULT_INFOBIP_SENDER,
        };

        delete (payload as any).thumbnail;
        delete (payload as any).imageRemoved;

        const response = isEditing
          ? await campaignClient.updateCampaign(initialData._id, payload)
          : await campaignClient.createCampaign(payload, storeId);

        return response;
      } catch (error) {
        console.error('❌ API error:', error);
        throw error;
      }
    },
    onSuccess: (_res, vars) => {
      setWithArt(!vars?.imageRemoved && Boolean(vars?.image?.length || vars?.imageUrl || initialData?.image));
      setSuccessOpen(true);
      setConfirmOpen(false);
      setFormData(null);

      setTimeout(() => {
        onCreate();
      }, 500);
    },
    onError: (e: any) => {
      setErrorMsg(e?.response?.data?.error || e?.message || '');
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
        storeId={storeId}
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
            {mutation.isPending ? 'Subiendo y guardando…' : 'Confirmar'}
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
          {withArt && ' Los productos del arte se cargan solos a la lista de la tienda; te avisamos en la campana.'}
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
          Hubo un error al {isEditing ? 'editar' : 'crear'} la campaña.{' '}
          {errorMsg || 'Inténtalo de nuevo.'}
        </Alert>
      </Snackbar>
    </>
  );
}
