'use client';

import { qboService } from '@/services/qbo.service';
import PictureAsPdfRoundedIcon from '@mui/icons-material/PictureAsPdfRounded';
import { Button, CircularProgress, Snackbar, Alert, type ButtonProps } from '@mui/material';
import { useState } from 'react';

type Props = Omit<ButtonProps, 'onClick' | 'href'> & {
  qboId: string;
  /** Número visible de la factura, para el nombre del archivo y el texto. */
  docNumber?: string;
  /** Al disco en vez de abrir pestaña. */
  download?: boolean;
  children?: React.ReactNode;
};

/**
 * Abre la factura de QuickBooks.
 *
 * Existe como componente y no como href porque el endpoint pide Bearer y un
 * `<a>` no lo manda: linkeado directo responde UNAUTHORIZED. Aquí baja por
 * axios, que sí lleva el token, y de paso muestra el error si falla en vez de
 * dejar al usuario en una pestaña en blanco.
 */
export function InvoicePdfButton({
  qboId,
  docNumber,
  download,
  children,
  ...rest
}: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handle = async () => {
    setLoading(true);
    try {
      await qboService.openInvoicePdf(qboId, { download, docNumber });
    } catch (e: any) {
      setError(
        e?.response?.status === 401
          ? 'Tu sesión expiró. Vuelve a entrar y prueba otra vez.'
          : e?.message || 'No se pudo abrir la factura.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        size="small"
        variant="outlined"
        onClick={handle}
        disabled={loading || !qboId}
        startIcon={
          loading ? (
            <CircularProgress size={14}
color="inherit" />
          ) : (
            <PictureAsPdfRoundedIcon fontSize="small" />
          )
        }
        sx={{ whiteSpace: 'nowrap', minWidth: 0, ...(rest.sx || {}) }}
        {...rest}
      >
        {children ?? docNumber ?? 'Ver factura'}
      </Button>

      <Snackbar
        open={Boolean(error)}
        autoHideDuration={6000}
        onClose={() => setError(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="error"
onClose={() => setError(null)}
variant="filled">
          {error}
        </Alert>
      </Snackbar>
    </>
  );
}

export default InvoicePdfButton;
