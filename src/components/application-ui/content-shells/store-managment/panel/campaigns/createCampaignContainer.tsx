// Suponiendo que ya importaste este formulario como `CreateCampaignForm`

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
import { campaignClient } from '@/services/campaing.service';

export default function CreateCampaignContainer({
  storeId,
  provider,
  phoneNumber,
  totalAudience,
}: {
  storeId: string;
  provider: string;
  phoneNumber: string;
  totalAudience: number;
}) {
  const [successOpen, setSuccessOpen] = useState(false);
  const [errorOpen, setErrorOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [formData, setFormData] = useState<any>(null);
  const [image, setImage] = useState<File | null>(null);

  const mutation = useMutation({
    mutationFn: (data: any) => campaignClient.createCampaign(data, storeId, image),
    onSuccess: () => {
      setSuccessOpen(true);
    },
    onError: () => {
      setErrorOpen(true);
    },
  });

  const handleSubmit = (data: any) => {
    setFormData(data);
    if (data.image?.length) {
      setImage(data.image[0]);
    } else {
      setImage(null);
    }
    setConfirmOpen(true);
  };

  const confirmAndSend = () => {
    setConfirmOpen(false);
    mutation.mutate(formData);
  };

  return (
    <>
      <CreateCampaignForm
        onSubmit={handleSubmit}
        provider={provider}
        phoneNumber={phoneNumber}
        totalAudience={totalAudience}
      />

      <Dialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
      >
        <DialogTitle>Confirmar envío</DialogTitle>
        <DialogContent>
          <DialogContentText>
            ¿Estás seguro de que deseas crear esta campaña? Asegúrate de revisar el contenido antes
            de continuar.
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
          >
            Confirmar
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
          ¡Campaña creada con éxito!
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
          Hubo un error al crear la campaña. Inténtalo de nuevo.
        </Alert>
      </Snackbar>
    </>
  );
}
