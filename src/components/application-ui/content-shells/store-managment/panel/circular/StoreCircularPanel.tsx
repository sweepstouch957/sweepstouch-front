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
import SmartToyOutlinedIcon from '@mui/icons-material/SmartToyOutlined';
import SmsOutlinedIcon from '@mui/icons-material/SmsOutlined';
import {
  Alert,
  alpha,
  Box,
  Button,
  Chip,
  Paper,
  Stack,
  Tab,
  Tabs,
  Typography,
} from '@mui/material';
import NextLink from 'next/link';
import { useCallback, useState } from 'react';
import AgentsSection from './AgentsSection';
import CampaignAutomationCard from './CampaignAutomationCard';
import CatalogSection from './CatalogSection';
import CircularPdfSection from './CircularPdfSection';
import { useUpcoming } from './hooks';
import { ListsPhoneCard } from './ListsPhoneCard';
import ListsSection from './ListsSection';
import MessagesSection from './MessagesSection';
import PreRcsPreviewButton from './PreRcsPreviewButton';
import PurchasesSection from './PurchasesSection';
import { ImagePreviewDialog, type PanelProps } from './shared';
import StoreBannerSection from './StoreBannerSection';
import UpcomingProductsSection from './UpcomingProductsSection';
import WeeklyCircularCard from './WeeklyCircularCard';

/** Qué puede hacer la persona acá, en una línea por paso, con el botón que lo hace. */
function HowItWorks({
  storeId,
  onOpenAgents,
  onOpenProducts,
}: {
  storeId: string;
  onOpenAgents: () => void;
  onOpenProducts: () => void;
}) {
  const steps = [
    {
      n: 1,
      title: 'Agenda la campaña con su arte',
      text: 'Desde Campañas. Si la tienda no tiene arte, sube el PDF del circular más abajo.',
      action: (
        <Button
          size="small"
          component={NextLink}
          href={`/admin/management/stores/edit/${storeId}?tag=campaigns&action=create`}
        >
          Agendar campaña
        </Button>
      ),
    },
    {
      n: 2,
      title: 'Los robots leen el flyer solos',
      text: 'Siete agentes extraen productos, precios, fotos y deciden qué se ve. No hay que hacer nada.',
      action: (
        <Button
          size="small"
          onClick={onOpenAgents}
        >
          Ver la oficina
        </Button>
      ),
    },
    {
      n: 3,
      title: 'Revisa lo que quedó dudoso',
      text: 'Lo seguro se aplica solo; lo dudoso espera tu ok en Agentes IA. Precios y fotos se corrigen en Productos.',
      action: (
        <Button
          size="small"
          onClick={onOpenProducts}
        >
          Ir a Productos
        </Button>
      ),
    },
    {
      n: 4,
      title: 'El cliente arma su lista',
      text: 'El día de la campaña el link muestra SOLO ese flyer, con los precios del día.',
      action: null,
    },
  ];
  return (
    <Paper
      variant="outlined"
      sx={{
        p: { xs: 1.5, md: 2 },
        borderRadius: 3,
        bgcolor: (t) => alpha(t.palette.primary.main, 0.03),
        borderColor: (t) => alpha(t.palette.primary.main, 0.2),
      }}
    >
      <Typography
        variant="overline"
        color="primary"
        fontWeight={800}
      >
        Cómo funciona
      </Typography>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(4, 1fr)' },
          gap: 1.5,
          mt: 0.5,
        }}
      >
        {steps.map((s) => (
          <Stack
            key={s.n}
            spacing={0.5}
            sx={{
              p: 1.25,
              borderRadius: 2,
              bgcolor: 'background.paper',
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Stack
              direction="row"
              alignItems="center"
              gap={1}
            >
              <Box
                sx={{
                  width: 22,
                  height: 22,
                  borderRadius: 1,
                  display: 'grid',
                  placeItems: 'center',
                  fontSize: 12,
                  fontWeight: 800,
                  color: 'primary.contrastText',
                  bgcolor: 'primary.main',
                  flexShrink: 0,
                }}
              >
                {s.n}
              </Box>
              <Typography
                variant="body2"
                fontWeight={800}
                lineHeight={1.2}
              >
                {s.title}
              </Typography>
            </Stack>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ flex: 1 }}
            >
              {s.text}
            </Typography>
            {s.action && <Box sx={{ ml: -0.75 }}>{s.action}</Box>}
          </Stack>
        ))}
      </Box>
    </Paper>
  );
}

/** Pestaña Circular: guía · 1 automático · 2 PDF manual · 3 circular de la semana · 4 banner. */
function CircularTab({
  storeId,
  storeSlug,
  storeName,
  circularssUrl,
  upcomingCount,
  onOpenUpcoming,
  onOpenAgents,
  onOpenProducts,
}: Pick<PanelProps, 'storeId' | 'storeSlug' | 'storeName' | 'circularssUrl'> & {
  upcomingCount: number;
  onOpenUpcoming: () => void;
  onOpenAgents: () => void;
  onOpenProducts: () => void;
}) {
  // Un solo visor para toda la pestaña (arte, circular, portada del PDF).
  const [preview, setPreview] = useState<{ url: string; title: string } | null>(null);
  const openPreview = useCallback((url: string, title: string) => setPreview({ url, title }), []);

  return (
    <Stack spacing={2}>
      <HowItWorks
        storeId={storeId}
        onOpenAgents={onOpenAgents}
        onOpenProducts={onOpenProducts}
      />
      <CampaignAutomationCard
        storeId={storeId}
        storeSlug={storeSlug}
        upcomingCount={upcomingCount}
        onOpenUpcoming={onOpenUpcoming}
        onPreview={openPreview}
      />
      <CircularPdfSection
        storeSlug={storeSlug}
        storeName={storeName}
        circularssUrl={circularssUrl}
        onPreview={openPreview}
      />
      <WeeklyCircularCard
        storeId={storeId}
        storeSlug={storeSlug}
        storeName={storeName}
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
  listsPhone,
  listsPhoneEnabled,
}: PanelProps) {
  const [tab, setTab] = useState(0);
  const openUpcoming = useCallback(() => setTab(1), []);
  const openProducts = useCallback(() => setTab(2), []);
  const openAgents = useCallback(() => setTab(6), []);
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
        <Tab
          icon={<SmartToyOutlinedIcon fontSize="small" />}
          iconPosition="start"
          label="Agentes IA"
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
          onOpenAgents={openAgents}
          onOpenProducts={openProducts}
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
      {tab === 6 && (
        <AgentsSection
          storeSlug={storeSlug}
          storeName={storeName}
        />
      )}
      {/* El teléfono de las listas va al final (pedido del 2 oct 2026). */}
      <Box sx={{ mt: 3 }}>
        <ListsPhoneCard
          storeId={storeId}
          listsPhone={listsPhone}
          listsPhoneEnabled={listsPhoneEnabled}
        />
      </Box>
    </Box>
  );
}
