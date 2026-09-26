import { Alert } from '@mui/material';

interface ProviderImageConstraintsProps {
  provider: string;
}

/**
 * Requisitos de la imagen. Ya no hay que achicarla a mano: se sube tal cual (hasta 100 MB),
 * el MMS lleva una copia de menos de 500 KB y el original queda para leer los productos.
 */
export default function ProviderImageConstraints(_props: ProviderImageConstraintsProps) {
  return (
    <Alert
      severity="info"
      sx={{ borderRadius: 2 }}
    >
      JPG o PNG hasta <strong>100 MB</strong>. Se comprime sola a menos de 500 KB para el MMS y el
      original se guarda para cargar los productos del arte a la lista de la tienda.
    </Alert>
  );
}
