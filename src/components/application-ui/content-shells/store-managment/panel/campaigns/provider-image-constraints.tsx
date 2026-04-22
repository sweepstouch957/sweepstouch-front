import React from 'react';
import { Alert, AlertTitle, Box, Typography } from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

interface ProviderImageConstraintsProps {
  provider: string; // 'twilio', 'bandwidth', 'infobip', etc.
}

export function isValidImageSizeForProvider(fileSize: number, provider: string): boolean {
  // Configuración de límites por proveedor
  if (provider.toLowerCase() === 'infobip') {
    return fileSize <= 2 * 1024 * 1024; // 2MB
  }
  // Twilio / Bandwidth u otros (conservador)
  return fileSize <= 500 * 1024; // 500 KB
}

export function getProviderImageErrorMessage(provider: string): string {
  if (provider.toLowerCase() === 'infobip') {
    return 'La imagen no puede superar los 2 MB para envíos con Infobip. Por favor usa una más ligera.';
  }
  return 'La imagen no puede superar los 500 KB. Por favor usa una más ligera.';
}

export default function ProviderImageConstraints({ provider }: ProviderImageConstraintsProps) {
  const isInfobip = provider.toLowerCase() === 'infobip';

  return (
    <Box mb={2}>
      {isInfobip ? (
        <Alert severity="info" icon={<InfoOutlinedIcon />} sx={{ borderRadius: 2 }}>
          <AlertTitle sx={{ fontWeight: 600 }}>Limitaciones de MMS para Infobip</AlertTitle>
          <Typography variant="body2" sx={{ mb: 1 }}>
            Para garantizar la máxima tasa de entrega en la red celular con Infobip:
          </Typography>
          <Typography variant="body2" component="ul" sx={{ mt: 0, pl: 2, mb: 0 }}>
            <li>Formatos permitidos: <strong>JPG, PNG, GIF</strong>.</li>
            <li>Tamaño máximo sugerido: <strong>2 MB</strong> (hasta 5 MB en algunas operadoras, recomendamos 2 MB).</li>
            <li>Archivos WebP pueden no ser mostrados nativamente en dispositivos iOS/Android antiguos.</li>
          </Typography>
        </Alert>
      ) : (
        <Alert severity="warning" sx={{ borderRadius: 2 }}>
          El tamaño máximo permitido para la imagen de campaña es de <strong>500 KB</strong> para asegurar la entrega del MMS en la red actual.
        </Alert>
      )}
    </Box>
  );
}
