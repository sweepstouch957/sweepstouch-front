'use client';

/**
 * Mensaje de prueba: el mismo flujo que el merchant. Crea la lista de compras del cliente
 * elegido y le manda el SMS/MMS con su link, con los productos del circular vigente.
 * La lista de circulares es la resumida (compartida con el resto del panel); los productos
 * completos del vigente se piden sólo en esta pestaña.
 */
import TestMmsShoppingListModal from '@/components/mms/TestMmsShoppingListModal';
import { circularService } from '@/services/circular.service';
import { Box, Button, Paper, Skeleton, Stack, Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { productCount, qk, useStoreCirculars } from './hooks';
import { type PanelProps } from './shared';

export default function MessagesSection({
  storeId,
  storeSlug,
  storeName,
  provider,
  infobipSenderId,
  address,
}: PanelProps) {
  const [open, setOpen] = useState(false);
  const { top: active, isLoading } = useStoreCirculars(storeSlug);
  const full = useQuery({
    queryKey: qk.circular(active?._id),
    queryFn: () => circularService.getCircular(active!._id),
    // Al abrir la pestaña (no al abrir el modal): así el envío nunca sale con 0 productos.
    enabled: !!active?._id,
    staleTime: 60_000,
  });

  return (
    <Paper
      variant="outlined"
      sx={{ p: 2.5, borderRadius: 2 }}
    >
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        flexWrap="wrap"
        gap={2}
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography
            variant="subtitle1"
            fontWeight={700}
          >
            Mensaje de prueba
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mt: 0.5, maxWidth: 560 }}
          >
            Crea la lista de compras de un cliente y le manda el SMS o MMS con su link, igual que lo
            recibe en una campaña.
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mt: 0.75 }}
          >
            {isLoading ? (
              <Skeleton
                variant="rounded"
                width={260}
                height={14}
                component="span"
                sx={{ display: 'inline-block' }}
              />
            ) : active ? (
              `Circular: ${active.title || 'sin título'} · ${productCount(active)} productos`
            ) : (
              'La tienda no tiene circular: carga uno en la pestaña Circular.'
            )}
          </Typography>
        </Box>
        <Button
          variant="contained"
          disabled={!active || full.isLoading}
          onClick={() => setOpen(true)}
        >
          Enviar mensaje de prueba
        </Button>
      </Stack>
      <TestMmsShoppingListModal
        open={open}
        onClose={() => setOpen(false)}
        storeId={storeId}
        storeSlug={storeSlug}
        storeName={storeName || storeSlug}
        products={(full.data?.products ?? []) as any[]}
        headline={full.data?.headline || active?.headline || ''}
        circularId={active?._id}
        // Si el circular es PDF pero ya tiene portada renderizada, ESA va como adjunto del MMS.
        circularFileUrl={active?.previewImageUrl || active?.fileUrl}
        storeProvider={provider}
        storeInfobipSenderId={infobipSenderId}
        storeAddress={address}
      />
    </Paper>
  );
}
