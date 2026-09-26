'use client';

// Pre-RCS de la tienda desde el panel admin: la misma lógica que el merchant tiene en su
// portal (circular + catálogo + validación de listas), más las métricas de compras por
// recibo. Este archivo es sólo el shell de pestañas: cada sección vive en su archivo, con
// su propio estado, y los datos compartidos salen de ./hooks (React Query los deduplica).
import CalendarMonthRoundedIcon from '@mui/icons-material/CalendarMonthRounded';
import EventRoundedIcon from '@mui/icons-material/EventRounded';
import FactCheckOutlinedIcon from '@mui/icons-material/FactCheckOutlined';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import ReceiptLongRoundedIcon from '@mui/icons-material/ReceiptLongRounded';
import SmsOutlinedIcon from '@mui/icons-material/SmsOutlined';
import { Alert, Box, Chip, Stack, Tab, Tabs, Typography } from '@mui/material';
import { useCallback, useState } from 'react';
import CampaignAutomationCard from './CampaignAutomationCard';
import CatalogSection from './CatalogSection';
import CircularPdfSection from './CircularPdfSection';
import { useUpcoming } from './hooks';
import ListsSection from './ListsSection';
import MessagesSection from './MessagesSection';
import PreRcsPreviewButton from './PreRcsPreviewButton';
import PurchasesSection from './PurchasesSection';
import { ImagePreviewDialog, type PanelProps } from './shared';
import StoreBannerSection from './StoreBannerSection';
import UpcomingProductsSection from './UpcomingProductsSection';
import WeeklyCircularCard from './WeeklyCircularCard';

/** Pestaña Circular: 1 automático · 2 circular de la semana · 3 PDF manual · 4 banner. */
function CircularTab({
  storeId,
  storeSlug,
  storeName,
  circularssUrl,
  upcomingCount,
  onOpenUpcoming,
}: Pick<PanelProps, 'storeId' | 'storeSlug' | 'storeName' | 'circularssUrl'> & {
  upcomingCount: number;
  onOpenUpcoming: () => void;
}) {
  // Un solo visor para toda la pestaña (arte, circular, portada del PDF).
  const [preview, setPreview] = useState<{ url: string; title: string } | null>(null);
  const openPreview = useCallback((url: string, title: string) => setPreview({ url, title }), []);

  return (
    <Stack spacing={2}>
      <CampaignAutomationCard
        storeId={storeId}
        storeSlug={storeSlug}
        upcomingCount={upcomingCount}
        onOpenUpcoming={onOpenUpcoming}
        onPreview={openPreview}
      />
      <WeeklyCircularCard
        storeId={storeId}
        storeSlug={storeSlug}
        storeName={storeName}
        onPreview={openPreview}
      />
      <CircularPdfSection
        storeSlug={storeSlug}
        storeName={storeName}
        circularssUrl={circularssUrl}
        onPreview={openPreview}
      />
      <StoreBannerSection
        storeSlug={storeSlug}
        storeId={storeId}
      />
      <ImagePreviewDialog
        key={preview?.url || 'none'}
        url={preview?.url ?? null}
        title={preview?.title}
        onClose={() => setPreview(null)}
      />
    </Stack>
  );
}

export default function StoreCircularPanel({
  storeId,
  storeSlug,
  storeName,
  provider,
  infobipSenderId,
  address,
  circularssUrl,
}: PanelProps) {
  const [tab, setTab] = useState(0);
  const openUpcoming = useCallback(() => setTab(1), []);
  // Contador de Próximos (misma query que la sección: comparten caché).
  const upcoming = useUpcoming(storeSlug);
  const upcomingCount = (upcoming.data?.total ?? 0) + (upcoming.data?.banners?.length ?? 0);

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
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        justifyContent="space-between"
        gap={1.5}
        sx={{ mb: 1 }}
      >
        <Typography
          variant="h5"
          fontWeight={800}
        >
          Circular & Listas {storeName ? `· ${storeName}` : ''}
        </Typography>
        {/* Al lado del título: ver la página tal cual la recibe el cliente. */}
        <PreRcsPreviewButton
          storeId={storeId}
          storeSlug={storeSlug}
        />
      </Stack>
      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v)}
        sx={{ mb: 2 }}
        variant="scrollable"
        allowScrollButtonsMobile
      >
        <Tab
          icon={<CalendarMonthRoundedIcon fontSize="small" />}
          iconPosition="start"
          label="Circular"
        />
        <Tab
          icon={<EventRoundedIcon fontSize="small" />}
          iconPosition="start"
          label={
            <Stack
              direction="row"
              alignItems="center"
              gap={0.75}
            >
              Próximos
              {upcomingCount > 0 && (
                <Chip
                  size="small"
                  color="primary"
                  label={upcomingCount}
                  sx={{ height: 18, fontSize: 11 }}
                />
              )}
            </Stack>
          }
        />
        <Tab
          icon={<Inventory2OutlinedIcon fontSize="small" />}
          iconPosition="start"
          label="Productos"
        />
        <Tab
          icon={<FactCheckOutlinedIcon fontSize="small" />}
          iconPosition="start"
          label="Listas"
        />
        <Tab
          icon={<ReceiptLongRoundedIcon fontSize="small" />}
          iconPosition="start"
          label="Compras"
        />
        <Tab
          icon={<SmsOutlinedIcon fontSize="small" />}
          iconPosition="start"
          label="Mensajes"
        />
      </Tabs>

      {/* Sólo se monta la pestaña abierta: las demás no piden datos ni renderizan. */}
      {tab === 0 && (
        <CircularTab
          storeId={storeId}
          storeSlug={storeSlug}
          storeName={storeName}
          circularssUrl={circularssUrl}
          upcomingCount={upcomingCount}
          onOpenUpcoming={openUpcoming}
        />
      )}
      {tab === 1 && <UpcomingProductsSection storeSlug={storeSlug} />}
      {tab === 2 && <CatalogSection storeSlug={storeSlug} />}
      {tab === 3 && <ListsSection storeSlug={storeSlug} />}
      {tab === 4 && <PurchasesSection storeSlug={storeSlug} />}
      {tab === 5 && (
        <MessagesSection
          storeId={storeId}
          storeSlug={storeSlug}
          storeName={storeName}
          provider={provider}
          infobipSenderId={infobipSenderId}
          address={address}
        />
      )}
    </Box>
  );
}
