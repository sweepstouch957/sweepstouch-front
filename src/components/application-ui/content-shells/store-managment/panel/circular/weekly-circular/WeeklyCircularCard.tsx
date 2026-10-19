'use client';

/**
 * 3 · El circular que recibe los productos (de la campaña o del PDF): la base del catálogo.
 * Contenedor: queries y mutaciones acá; la ficha, las acciones y el diálogo reciben props.
 */
import { PanelCard } from '@/components/application-ui/content-shells/store-managment/panel-kit';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import { Box, Button, LinearProgress, Stack } from '@mui/material';
import { useState } from 'react';
import { useAiGuidance } from '../AiGuidanceFields';
import {
  productCount,
  useAddMissing,
  useCampaignImportJob,
  useCircularBusy,
  useCircularPreview,
  useExtractProducts,
  useLastCampaignArt,
  useLoadCatalog,
  useStoreCirculars,
} from '../hooks';
import { SectionHeader } from '../panelUi';
import { circularLabel } from '../shared';
import { CircularCardSkeleton } from '../skeletons';
import CircularActions from './CircularActions';
import CircularSummary from './CircularSummary';
import ReextractDialog from './ReextractDialog';
import { useAppendPages } from './use-weekly-circular';

type Props = {
  storeId: string;
  storeSlug: string;
  storeName?: string;
  onPreview: (url: string, title: string) => void;
};

const bodySx = { p: { xs: 2, md: 2.5 } } as const;

export default function WeeklyCircularCard({ storeId, storeSlug, storeName, onPreview }: Props) {
  const { top: circular, isLoading } = useStoreCirculars(storeSlug);
  const { campaign } = useLastCampaignArt(storeId);
  // Misma query que la sección 1: React Query la comparte, no suma pedidos.
  const { data: job } = useCampaignImportJob(campaign?._id);
  const { busy, extracting, adding, loading } = useCircularBusy(storeSlug);
  const extract = useExtractProducts(storeSlug);
  const addMissing = useAddMissing(storeSlug);
  const loadCatalog = useLoadCatalog(storeSlug);
  const preview = useCircularPreview(onPreview);
  // La bitácora de los robots y la auditoría por página viven en la pestaña Agentes IA.
  const appendPages = useAppendPages(storeSlug);

  // Indicaciones para la IA ("sólo productos Cherry Valley") + fotos de apoyo: van en cada
  // extracción de este circular. Se ven en la tarjeta y en el diálogo (mismo estado).
  const ai = useAiGuidance(storeSlug);

  // "Los primeros X" = los de foto grande (rápido, recortes limpios). 0 = todos de una.
  // Por defecto TODOS: la lista debe traer el circular completo. Los primeros X quedan como atajo.
  const [max, setMax] = useState(0);
  const [reextractOpen, setReextractOpen] = useState(false);

  if (isLoading) {
    return (
      <PanelCard>
        <Box sx={bodySx}>
          <CircularCardSkeleton />
        </Box>
      </PanelCard>
    );
  }
  if (!circular) return null;

  const n = productCount(circular);
  const runExtract = () =>
    extract.mutate({
      id: circular._id,
      max,
      guidance: ai.guidance,
      referenceImages: ai.referenceImages,
    });

  return (
    <PanelCard>
      <Stack
        spacing={2}
        sx={bodySx}
      >
        <SectionHeader
          step={3}
          title={circular.status === 'active' ? 'Circular de la semana' : 'Circular más reciente'}
          description="Es la base de productos de la tienda: de acá salen el catálogo y las listas de los clientes."
          action={
            circular.fileUrl && (
              <Button
                size="small"
                variant="outlined"
                startIcon={<VisibilityOutlinedIcon />}
                disabled={preview.isPending}
                onClick={() => preview.mutate(circular)}
              >
                {preview.isPending ? 'Abriendo…' : 'Ver circular'}
              </Button>
            )
          }
        />

        <CircularSummary
          circular={circular}
          label={circularLabel(circular, storeSlug, storeName)}
          receivedFromCampaign={
            job?.result?.circularId === circular._id ? (job?.result?.added ?? 0) : null
          }
          addingPages={appendPages.isPending}
          disabled={busy}
          onAppendPages={(files) => appendPages.mutate({ circularId: circular._id, files })}
        />

        <CircularActions
          hasFile={!!circular.fileUrl}
          productCount={n}
          busy={busy}
          extracting={extracting}
          adding={adding}
          loading={loading}
          max={max}
          onMaxChange={setMax}
          onExtract={runExtract}
          onLoadCatalog={() => loadCatalog.mutate(circular._id)}
          onAddMissing={() => addMissing.mutate(circular._id)}
          onReextract={() => setReextractOpen(true)}
        />
        {!busy && ai.fields}
        {(loading || busy) && <LinearProgress sx={{ borderRadius: 1 }} />}
      </Stack>

      <ReextractDialog
        open={reextractOpen}
        productCount={n}
        max={max}
        onMaxChange={setMax}
        guidanceFields={ai.fields}
        onClose={() => setReextractOpen(false)}
        onConfirm={() => {
          setReextractOpen(false);
          runExtract();
        }}
      />
    </PanelCard>
  );
}
