'use client';

/**
 * 2 · Subir el circular (respaldo manual): agendar con archivo, traer del link de la tienda y
 * el historial. Contenedor: es el único que toca React Query; las piezas reciben props.
 */
import { PanelCard } from '@/components/application-ui/content-shells/store-managment/panel-kit';
import { Stack } from '@mui/material';
import { useState } from 'react';
import { useStoreCirculars } from '../hooks';
import { SectionHeader } from '../panelUi';
import CircularHistory from './CircularHistory';
import ImportFromLink from './ImportFromLink';
import OverlapDialog from './OverlapDialog';
import ScheduleForm from './ScheduleForm';
import {
  isOverlapError,
  useHistoryActions,
  useImportFromLink,
  useScheduleCircular,
} from './use-circular-pdf';
import type { OverlapInfo, ScheduleValues } from './utils';

type Props = {
  storeSlug: string;
  storeName?: string;
  circularssUrl?: string;
  onPreview: (url: string, title: string) => void;
};

export default function CircularPdfSection({
  storeSlug,
  storeName,
  circularssUrl,
  onPreview,
}: Props) {
  const { items, top, hasCurrent, isLoading } = useStoreCirculars(storeSlug);
  const importFromUrl = useImportFromLink(storeSlug);
  const schedule = useScheduleCircular(storeSlug);
  const history = useHistoryActions(storeSlug, onPreview);

  // Al agendar bien el formulario se vuelve a montar: queda limpio con las fechas por defecto.
  const [formKey, setFormKey] = useState(0);
  // Solape: se guardan los valores para reintentar con `override` si la persona confirma.
  const [overlap, setOverlap] = useState<{ info: OverlapInfo; values: ScheduleValues } | null>(
    null
  );

  const submit = (values: ScheduleValues, override?: boolean) =>
    schedule.mutate(
      { values, override },
      {
        onSuccess: () => setFormKey((k) => k + 1),
        onError: (e: any) => {
          if (isOverlapError(e)) setOverlap({ info: e.response.data.overlap, values });
        },
      }
    );

  return (
    <PanelCard>
      <Stack
        spacing={2.5}
        sx={{ p: { xs: 2, md: 2.5 } }}
      >
        <SectionHeader
          step={2}
          title="Subir el circular"
          description="El PDF o las fotos que manda la tienda (también por páginas sueltas), con indicaciones para la IA si hace falta."
        />
        {/* Apilado: la tarjeta del link se aplastaba al lado del formulario. */}
        <ScheduleForm
          key={formKey}
          pending={schedule.isPending}
          onSubmit={submit}
        />
        <ImportFromLink
          circularssUrl={circularssUrl}
          hasCurrent={hasCurrent}
          pending={importFromUrl.isPending}
          onImport={() => importFromUrl.mutate()}
        />
        <CircularHistory
          items={items}
          topId={top?._id}
          isLoading={isLoading}
          storeSlug={storeSlug}
          storeName={storeName}
          extracting={history.extracting}
          loading={history.loading}
          previewing={history.previewing}
          onExtract={history.onExtract}
          onLoad={history.onLoad}
          onPreview={history.onOpen}
        />
      </Stack>
      <OverlapDialog
        overlap={overlap?.info ?? null}
        onCancel={() => setOverlap(null)}
        onConfirm={() => {
          if (overlap) submit(overlap.values, true);
          setOverlap(null);
        }}
      />
    </PanelCard>
  );
}
