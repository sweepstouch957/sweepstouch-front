'use client';

import QboStoreBillingCard from '@/components/qbo/QboStoreBillingCard';
import { useQboStoreDetail } from '@hooks/fetching/qbo/useQbo';
import SyncRoundedIcon from '@mui/icons-material/SyncRounded';
import {
  Alert,
  AlertTitle,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Stack,
  Typography,
} from '@mui/material';
import { useState } from 'react';
import LinkCustomerCard from './LinkCustomerCard';
import SyncFromQboDialog from './SyncFromQboDialog';

type Props = { storeId: string; storeName?: string };

/**
 * Pestaña QuickBooks del panel de tienda.
 *
 * Orden deliberado: primero el vínculo, después lo que QuickBooks dice que debe,
 * y solo al final el botón que reemplaza la facturación local. Sincronizar sin
 * haber mirado las facturas es cómo se borra el historial equivocado.
 */
export function StoreQuickbooksPanel({ storeId, storeName }: Props) {
  const detail = useQboStoreDetail(storeId);
  const [syncOpen, setSyncOpen] = useState(false);

  const linked = detail.data?.linked === true;

  return (
    <Stack spacing={3}
p={3}>
      <Box>
        <Stack direction="row"
alignItems="center"
spacing={1.5}>
          <Typography variant="h5"
fontWeight={700}>
            QuickBooks
          </Typography>
          <Chip
            size="small"
            label={linked ? 'Vinculada' : 'Sin vincular'}
            color={linked ? 'success' : 'default'}
            variant={linked ? 'filled' : 'outlined'}
          />
        </Stack>
        <Typography variant="body2"
color="text.secondary">
          Vincula la tienda con su cliente en los libros del contador y revisa su cartera real.
        </Typography>
      </Box>

      {/* 1 — Vínculo */}
      <LinkCustomerCard storeId={storeId}
storeName={storeName} />

      {/* 2 — Lo que QuickBooks dice */}
      {linked ? (
        <QboStoreBillingCard storeId={storeId} />
      ) : (
        <Alert severity="info">
          Vincula la tienda para ver sus facturas y pagos en QuickBooks.
        </Alert>
      )}

      {/* 3 — Reemplazo destructivo, al final y solo si hay vínculo */}
      {linked && (
        <Card sx={{ borderColor: 'warning.main', borderWidth: 1, borderStyle: 'solid' }}>
          <CardContent>
            <Typography variant="h6"
fontWeight={600}
gutterBottom>
              Reemplazar facturación local
            </Typography>
            <Typography variant="body2"
color="text.secondary"
sx={{ mb: 2 }}>
              Borra las facturas y pagos de esta tienda en Sweepstouch y los reemplaza por los
              de QuickBooks. Úsalo cuando los libros del contador sean la versión buena y la
              de Sweepstouch esté incompleta o duplicada.
            </Typography>

            <Alert severity="warning"
sx={{ mb: 2 }}>
              <AlertTitle>Revisa antes</AlertTitle>
              Si el cliente está duplicado en QuickBooks, la mitad de su deuda vive en el otro
              registro y aquí se perdería. El contador debe fusionarlos primero.
            </Alert>

            <Button
              variant="outlined"
              color="warning"
              startIcon={<SyncRoundedIcon />}
              onClick={() => setSyncOpen(true)}
            >
              Sincronizar desde QuickBooks
            </Button>
          </CardContent>
        </Card>
      )}

      <SyncFromQboDialog open={syncOpen}
storeId={storeId}
onClose={() => setSyncOpen(false)} />
    </Stack>
  );
}

export default StoreQuickbooksPanel;
