'use client';

import { Stack } from '@mui/material';
import { useCallback, useState } from 'react';
import CampaignAutomationCard from '../campaign-automation';
import CircularCompare from '../circular-compare';
import CircularPdfSection from '../circular-pdf';
import ListStatusCard from '../list-status';
import { ImagePreviewDialog, type PanelProps } from '../shared';
import StoreBannerSection from '../store-banner';
import WeeklyCircularCard from '../weekly-circular';
import HowItWorks from './HowItWorks';

/** Pestaña Circular: guía · 1 automático · 2 PDF manual · 3 circular de la semana · 4 banner. */
export default function CircularTab({
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
      <ListStatusCard
        storeSlug={storeSlug}
        onOpenProducts={onOpenProducts}
        onOpenUpcoming={onOpenUpcoming}
        onOpenAgents={onOpenAgents}
      />
      <CampaignAutomationCard
        storeId={storeId}
        storeSlug={storeSlug}
        upcomingCount={upcomingCount}
        onOpenUpcoming={onOpenUpcoming}
        onPreview={openPreview}
      />
      <CircularCompare
        storeSlug={storeSlug}
        storeName={storeName}
        onOpenUpcoming={onOpenUpcoming}
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

