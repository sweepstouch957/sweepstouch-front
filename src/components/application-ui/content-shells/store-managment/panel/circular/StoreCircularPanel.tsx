'use client';

// Pre-RCS de la tienda desde el panel admin: la misma lógica que el merchant tiene en su
// portal (circular + catálogo + validación de listas), más las métricas de compras por
// recibo. Este archivo es sólo el shell de pestañas: cada módulo vive en su carpeta, con
// su propio estado, y los datos compartidos salen de ./hooks (React Query los deduplica).
import { Alert, Box, Skeleton } from '@mui/material';
import dynamic from 'next/dynamic';
import { useCallback, useMemo, useState } from 'react';
import CircularTab from './circular-tab';
import PanelHeader from './header/PanelHeader';
import { type PanelTab } from './header/tabs';
import { useUpcomingCount } from './hooks';
import { type PanelProps } from './shared';

// Las pestañas que no son la primera se bajan al abrirlas: Productos solo son 1300 líneas +
// herramientas de imagen, y antes se parseaban todas al entrar a Circular.
const tabSkeleton = () => (
  <Skeleton
    variant="rounded"
    height={320}
    sx={{ borderRadius: 3 }}
  />
);
const UpcomingProductsSection = dynamic(() => import('./upcoming'), { ssr: false, loading: tabSkeleton });
const CatalogSection = dynamic(() => import('./catalog'), { ssr: false, loading: tabSkeleton });
const ListsSection = dynamic(() => import('./lists'), { ssr: false, loading: tabSkeleton });
const PurchasesSection = dynamic(() => import('./purchases'), { ssr: false, loading: tabSkeleton });
const MessagesSection = dynamic(() => import('./messages'), { ssr: false, loading: tabSkeleton });
const AgentsSection = dynamic(() => import('./agents'), { ssr: false, loading: tabSkeleton });
const ConfigSection = dynamic(() => import('./config'), { ssr: false, loading: tabSkeleton });

export default function StoreCircularPanel({
  storeId,
  storeSlug,
  storeName,
  provider,
  infobipSenderId,
  address,
  circularssUrl,
  listsPhone,
  listsPhoneEnabled,
  listsEnabled,
  listsLinkUrl,
  flyerOnly,
}: PanelProps) {
  const [tab, setTab] = useState<PanelTab>('circular');
  const openUpcoming = useCallback(() => setTab('upcoming'), []);
  const openProducts = useCallback(() => setTab('products'), []);
  const openAgents = useCallback(() => setTab('agents'), []);
  // Contador de Próximos: misma query que la sección (comparten caché) pero acá sólo se
  // suscribe al número, y el sondeo por minuto corre sólo en Circular/Próximos.
  const upcomingCount = useUpcomingCount(storeSlug, tab === 'circular' || tab === 'upcoming');
  const badges = useMemo(() => ({ upcoming: upcomingCount }), [upcomingCount]);

  if (!storeSlug) {
    return (
      <Box p={3}>
        <Alert severity="warning">Esta tienda no tiene slug: el Pre-RCS trabaja por slug.</Alert>
      </Box>
    );
  }

  return (
    <Box
      px={{ xs: 1, md: 2 }}
      pt={2}
      pb={4}
    >
      <PanelHeader
        storeId={storeId}
        storeSlug={storeSlug}
        storeName={storeName}
        listsEnabled={listsEnabled}
        flyerOnly={flyerOnly}
        tab={tab}
        onTab={setTab}
        badges={badges}
      />

      {/* Sólo se monta la pestaña abierta: las demás no piden datos ni renderizan. */}
      {tab === 'circular' && (
        <CircularTab
          storeId={storeId}
          storeSlug={storeSlug}
          storeName={storeName}
          circularssUrl={circularssUrl}
          upcomingCount={upcomingCount}
          onOpenUpcoming={openUpcoming}
          onOpenAgents={openAgents}
          onOpenProducts={openProducts}
        />
      )}
      {tab === 'upcoming' && <UpcomingProductsSection storeSlug={storeSlug} />}
      {tab === 'products' && <CatalogSection storeSlug={storeSlug} />}
      {tab === 'lists' && <ListsSection storeSlug={storeSlug} />}
      {tab === 'purchases' && <PurchasesSection storeSlug={storeSlug} />}
      {tab === 'messages' && (
        <MessagesSection
          storeId={storeId}
          storeSlug={storeSlug}
          storeName={storeName}
          provider={provider}
          infobipSenderId={infobipSenderId}
          address={address}
        />
      )}
      {tab === 'agents' && (
        <AgentsSection
          storeSlug={storeSlug}
          storeName={storeName}
        />
      )}
      {tab === 'config' && (
        <ConfigSection
          storeId={storeId}
          listsEnabled={listsEnabled}
          listsLinkUrl={listsLinkUrl}
          listsPhone={listsPhone}
          listsPhoneEnabled={listsPhoneEnabled}
        />
      )}
    </Box>
  );
}
