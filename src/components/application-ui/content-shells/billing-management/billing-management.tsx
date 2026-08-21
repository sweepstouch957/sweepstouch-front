'use client';

import { QboReceivables } from '@/components/application-ui/content-shells/qbo-receivables/qbo-receivables';
import type { QboBalanceRow } from '@/services/qbo.service';
import { useQboRetryPending } from '@hooks/fetching/qbo/useQbo';
import HubRoundedIcon from '@mui/icons-material/HubRounded';
import PendingActionsRoundedIcon from '@mui/icons-material/PendingActionsRounded';
import RuleRoundedIcon from '@mui/icons-material/RuleRounded';
import ReceiptLongRoundedIcon from '@mui/icons-material/ReceiptLongRounded';
import SyncRoundedIcon from '@mui/icons-material/SyncRounded';
import { Box, Button, Container, Stack, Tab, Tabs, Tooltip, Typography } from '@mui/material';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';
import { useCustomization } from 'src/hooks/use-customization';
import ConnectionCard from './connection-card';
import DraftsView from './drafts-view';
import LinkingView from './linking-view';
import ReconcileView from './reconcile-view';

// El estado de la conexión no tiene pestaña: vive en la tarjeta fija de arriba,
// porque si se cayó, las cuatro salen vacías y hay que verlo desde cualquiera.
const TABS = [
  { value: 'cartera', label: 'Cartera', icon: <ReceiptLongRoundedIcon /> },
  { value: 'prefacturas', label: 'Prefacturas', icon: <PendingActionsRoundedIcon /> },
  { value: 'conciliacion', label: 'Conciliación', icon: <RuleRoundedIcon /> },
  { value: 'vinculacion', label: 'Vinculación', icon: <HubRoundedIcon /> },
] as const;

type TabValue = (typeof TABS)[number]['value'];

/**
 * Centro de facturación: todo lo de QuickBooks en un lugar.
 *
 * La pestaña activa vive en la URL (`?tab=`) para que un enlace a "Vinculación"
 * abra ahí — Intuit apunta a esta página desde el perfil de la app y conviene
 * poder mandar a alguien directo a la sección de conexión.
 */
export function BillingManagement() {
  const customization = useCustomization();
  const router = useRouter();
  const params = useSearchParams();
  const retry = useQboRetryPending();

  const raw = params.get('tab');
  const tab: TabValue = (TABS.find((t) => t.value === raw)?.value ?? 'cartera') as TabValue;

  const setTab = useCallback(
    (value: string) => {
      const next = new URLSearchParams(Array.from(params.entries()));
      next.set('tab', value);
      router.replace(`?${next.toString()}`, { scroll: false });
    },
    [params, router]
  );

  const openStore = useCallback(
    (row: QboBalanceRow) => {
      if (!row.storeId) return; // cliente de QuickBooks sin tienda: no hay panel que abrir
      router.push(`/admin/management/stores/edit/${row.storeId}?tag=quickbooks`);
    },
    [router]
  );

  return (
    <Container
      maxWidth={customization.stretch ? false : 'xl'}
      sx={{ pt: { xs: 1, sm: 1.5 }, pb: { xs: 2, sm: 3 } }}
    >
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        spacing={1.5}
        sx={{ mb: 2 }}
      >
        <Box>
          <Typography variant="h3"
fontWeight={700}>
            Facturación
          </Typography>
          <Typography variant="body2"
color="text.secondary">
            Cartera, vinculación de tiendas y conexión con QuickBooks Online.
          </Typography>
        </Box>

        <Tooltip title="Reenvía a QuickBooks las facturas y pagos que quedaron sin sincronizar">
          <span>
            <Button
              variant="outlined"
              size="small"
              startIcon={<SyncRoundedIcon />}
              disabled={retry.isPending}
              onClick={() => retry.mutate(undefined)}
            >
              Reintentar pendientes
            </Button>
          </span>
        </Tooltip>
      </Stack>

      {/* La conexión va arriba en todas las pestañas: si se cayó, todo lo demás
          sale vacío y sin este cartel parecería que nadie debe nada. */}
      <Box sx={{ mb: 2.5 }}>
        <ConnectionCard />
      </Box>

      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v)}
        variant="scrollable"
        scrollButtons="auto"
        sx={{ mb: 2.5 }}
      >
        {TABS.map((t) => (
          <Tab key={t.value}
value={t.value}
label={t.label}
icon={t.icon}
iconPosition="start" />
        ))}
      </Tabs>

      {tab === 'cartera' && <QboReceivables embedded
onSelectStore={openStore} />}
      {tab === 'prefacturas' && <DraftsView />}
      {tab === 'conciliacion' && <ReconcileView />}
      {tab === 'vinculacion' && <LinkingView />}
    </Container>
  );
}

export default BillingManagement;
