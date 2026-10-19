'use client';

/**
 * Mensaje de prueba: el mismo flujo que el merchant. Crea la lista de compras del cliente
 * elegido y le manda el SMS/MMS con su link, con los productos de lo que esté rigiendo.
 *
 * Fuente = flyer (arte de campaña) o circular PDF. Antes sólo miraba el circular PDF y una
 * tienda con flyer activo pero sin PDF quedaba con el botón apagado (19 oct 2026). El flyer
 * activo va primero: es lo que el cliente ve hoy ("flyer gana").
 */
import TestMmsShoppingListModal from '@/components/mms/TestMmsShoppingListModal';
import {
  EmptyBlock,
  PanelCard,
  SectionHeader,
} from '@/components/application-ui/content-shells/store-managment/panel-kit';
import SendRoundedIcon from '@mui/icons-material/SendRounded';
import SmsOutlinedIcon from '@mui/icons-material/SmsOutlined';
import { Alert, Box, Button, Skeleton, Stack } from '@mui/material';
import { useState } from 'react';
import { type PanelProps } from '../shared';
import SourceSelect from './SourceSelect';
import { useMessageSource } from './use-message-source';

export default function MessagesSection({
  storeId,
  storeSlug,
  storeName,
  provider,
  infobipSenderId,
  address,
}: PanelProps) {
  const [open, setOpen] = useState(false);
  const { isLoading, sources, picked, active, setPickedId, full, loadingProducts, count } =
    useMessageSource(storeSlug);

  return (
    <PanelCard>
      <SectionHeader
        icon={<SmsOutlinedIcon sx={{ fontSize: 20, color: 'primary.main' }} />}
        title="Mensaje de prueba"
        hint="Crea la lista de un cliente y le manda el SMS/MMS con su link, igual que en una campaña"
      />
      {isLoading ? (
        <Box sx={{ p: 2.25 }}>
          <Skeleton
            variant="rounded"
            height={40}
          />
        </Box>
      ) : !sources.length ? (
        <EmptyBlock
          title="Sin flyer ni circular con productos"
          hint="Agenda una campaña con arte o sube el PDF en la pestaña Circular."
        />
      ) : (
        <Box sx={{ p: 2.25, display: 'grid', gap: 2 }}>
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            alignItems={{ md: 'center' }}
            gap={2}
          >
            <SourceSelect
              sources={sources}
              value={picked?.c._id || ''}
              onChange={setPickedId}
            />
            <Button
              variant="contained"
              disableElevation
              startIcon={<SendRoundedIcon />}
              disabled={!active || loadingProducts || !count}
              onClick={() => setOpen(true)}
              sx={{ borderRadius: 999, fontWeight: 700, px: 2.5, whiteSpace: 'nowrap' }}
            >
              {loadingProducts ? 'Cargando productos…' : 'Enviar mensaje de prueba'}
            </Button>
          </Stack>
          {active && !loadingProducts && !count && (
            <Alert
              severity="warning"
              sx={{ borderRadius: 2 }}
            >
              Este {picked?.kind.toLowerCase()} todavía no tiene productos cargados: espera a los
              agentes o elige otro.
            </Alert>
          )}
        </Box>
      )}
      <TestMmsShoppingListModal
        open={open}
        onClose={() => setOpen(false)}
        storeId={storeId}
        storeSlug={storeSlug}
        storeName={storeName || storeSlug}
        products={(full?.products ?? []) as any[]}
        headline={full?.headline || active?.headline || ''}
        circularId={active?._id}
        // Si el circular es PDF pero ya tiene portada renderizada, ESA va como adjunto del MMS.
        circularFileUrl={active?.previewImageUrl || active?.fileUrl}
        storeProvider={provider}
        storeInfobipSenderId={infobipSenderId}
        storeAddress={address}
      />
    </PanelCard>
  );
}
