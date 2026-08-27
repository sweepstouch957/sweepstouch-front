'use client';

import { useSecretSaleQr } from '@/hooks/fetching/secret-sales/useSecretSales';
import { downloadRemoteFile } from '@/services/download.service';
import { secretSaleService } from '@/services/secret-sale.service';
import ContentCopyRounded from '@mui/icons-material/ContentCopyRounded';
import DownloadRounded from '@mui/icons-material/DownloadRounded';
import OpenInNewRounded from '@mui/icons-material/OpenInNewRounded';
import QrCode2Rounded from '@mui/icons-material/QrCode2Rounded';
import RefreshRounded from '@mui/icons-material/RefreshRounded';
import {
  Alert,
  Box,
  Button,
  Card,
  CircularProgress,
  Skeleton,
  Stack,
  TextField,
  Typography,
  alpha,
  useTheme,
} from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import Image from 'next/image';
import React from 'react';
import toast from 'react-hot-toast';

interface Props {
  storeId: string;
  storeName?: string;
}

/**
 * El QR que se imprime y se pega en la tienda.
 *
 * Se genera **una sola vez por tienda** y después sale de la base: el destino es
 * `<linktree>/secret-sales?slug=<slug>` y no depende del flyer publicado. Lo que
 * cambia cada semana es la oferta que hay detrás, no el cartel de la caja — por
 * eso acá no hay botón de "generar": llega hecho.
 */
export function QrCard({ storeId, storeName }: Props) {
  const theme = useTheme();
  const qc = useQueryClient();
  const { data, isPending, error } = useSecretSaleQr(storeId);

  const regenerate = useMutation({
    mutationFn: () => secretSaleService.qr(storeId, true),
    onSuccess: (fresh) => {
      qc.setQueryData(['secret-sale-qr', storeId], fresh);
      toast.success('QR regenerado — hay que volver a imprimirlo');
    },
    onError: () => toast.error('No se pudo regenerar el QR'),
  });

  const copy = async () => {
    if (!data?.link) return;
    await navigator.clipboard.writeText(data.link);
    toast.success('Link copiado');
  };

  const askRegenerate = () => {
    // Regenerar cambia la imagen: el QR impreso que hay pegado en la tienda
    // sigue funcionando (el link no cambia), pero no es una acción de rutina.
    if (window.confirm('El QR actual ya está impreso. ¿Rehacer la imagen igual?')) {
      regenerate.mutate();
    }
  };

  // 409 del backend: la tienda todavía no tiene slug, así que no tiene link público.
  const noSlug = (error as any)?.response?.data?.error === 'STORE_WITHOUT_SLUG';

  if (noSlug) {
    return (
      <Card sx={{ p: 3, borderRadius: 3 }}>
        <Alert severity="info" sx={{ borderRadius: 2 }}>
          Esta tienda no tiene <b>slug</b>, así que todavía no tiene link público. Cargale el slug en
          el detalle de la tienda y el QR sale solo.
        </Alert>
      </Card>
    );
  }

  return (
    <Card sx={{ p: 3, borderRadius: 3 }}>
      <Stack spacing={2}>
        <Stack direction="row" spacing={1} alignItems="center">
          <QrCode2Rounded color="primary" />
          <Typography variant="h6" fontWeight={700}>
            QR de la tienda
          </Typography>
        </Stack>

        <Typography variant="body2" color="text.secondary">
          Se imprime una vez y queda pegado en la caja. Cuando subís un flyer nuevo, el mismo QR
          muestra la oferta nueva — no hay que reimprimir nada.
        </Typography>

        <Box
          sx={{
            position: 'relative',
            width: '100%',
            aspectRatio: '1 / 1',
            borderRadius: 3,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.12 : 0.06),
          }}
        >
          {isPending || regenerate.isPending ? (
            <Skeleton variant="rounded" width="86%" height="86%" />
          ) : data?.qrUrl ? (
            <Image
              src={data.qrUrl}
              alt={`QR secret sales ${storeName || ''}`}
              fill
              sizes="320px"
              style={{ objectFit: 'contain', padding: 16 }}
            />
          ) : (
            <Stack alignItems="center" spacing={1} sx={{ px: 3, textAlign: 'center' }}>
              <QrCode2Rounded sx={{ fontSize: 56, color: 'text.disabled' }} />
              <Typography variant="body2" color="text.secondary">
                No pudimos traer el QR. Probá recargar.
              </Typography>
            </Stack>
          )}
        </Box>

        <TextField
          size="small"
          label="Link público"
          value={data?.link ?? ''}
          InputProps={{ readOnly: true }}
          fullWidth
        />

        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          <Button
            variant="contained"
            startIcon={<DownloadRounded />}
            disabled={!data?.qrUrl}
            onClick={() => downloadRemoteFile(data!.qrUrl, `secret-sales-${data!.slug}.png`)}
            sx={{ textTransform: 'none', borderRadius: 2 }}
          >
            Descargar
          </Button>

          <Button
            variant="text"
            startIcon={<ContentCopyRounded />}
            onClick={copy}
            disabled={!data?.link}
            sx={{ textTransform: 'none' }}
          >
            Copiar link
          </Button>

          <Button
            variant="text"
            startIcon={<OpenInNewRounded />}
            href={data?.link || '#'}
            target="_blank"
            rel="noopener noreferrer"
            disabled={!data?.link}
            sx={{ textTransform: 'none' }}
          >
            Probar
          </Button>

          <Button
            variant="text"
            color="inherit"
            startIcon={
              regenerate.isPending ? <CircularProgress size={14} /> : <RefreshRounded />
            }
            onClick={askRegenerate}
            disabled={!data || regenerate.isPending}
            sx={{ textTransform: 'none', color: 'text.secondary' }}
          >
            Regenerar
          </Button>
        </Stack>
      </Stack>
    </Card>
  );
}
