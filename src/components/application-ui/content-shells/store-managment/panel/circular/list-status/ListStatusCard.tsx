'use client';

/**
 * Estado de la lista del cliente, de un vistazo: cuántos productos ve HOY, cuántos están
 * ocultos, cuántos esperan su fecha, y qué flyer o circular manda. Es la primera pregunta de
 * la tienda ("¿cuántos salen?") y antes había que ir a Productos y contar. Desde acá se ve el
 * flyer vigente y se manda a los agentes a arreglarlo (duplicados, visibilidad, auditoría).
 *
 * Contenedor: es el único de la carpeta que toca React Query; el resto recibe props.
 */
import {
  EmptyBlock,
  PanelCard,
  SectionHeader,
} from '@/components/application-ui/content-shells/store-managment/panel-kit';
import SmartToyOutlinedIcon from '@mui/icons-material/SmartToyOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import { Box, Button, Chip, Stack } from '@mui/material';
import { useCallback, useMemo, useState } from 'react';
import { useCatalogSummary } from '../hooks';
import { MoreMenu, type MoreMenuItem } from '../panelUi';
import { fmtDate, ImagePreviewDialog } from '../shared';
import { KpiSkeleton } from '../skeletons';
import AgentsFixDialog from './AgentsFixDialog';
import FixEndDialog from './FixEndDialog';
import HideCircularDialog from './HideCircularDialog';
import ImportJobAlerts from './ImportJobAlerts';
import ListStatusKpis from './ListStatusKpis';
import {
  useAgentsFix,
  useCatalogSources,
  useFixEndOfDay,
  useHideCircularProducts,
  useImportJobs,
  useRetryImportJob,
  useRulingPreview,
} from './use-list-status';
import { jobsNeedingAttention } from './utils';

type Props = {
  storeSlug: string;
  onOpenProducts: () => void;
  onOpenUpcoming: () => void;
  onOpenAgents: () => void;
};

type DialogKind = 'fix' | 'hide' | 'end' | null;

const TITLE = 'Lo que ve el cliente hoy';

export default function ListStatusCard({
  storeSlug,
  onOpenProducts,
  onOpenUpcoming,
  onOpenAgents,
}: Props) {
  const q = useCatalogSummary(storeSlug);
  const s = q.data;
  const r = s?.ruling ?? null;

  const [dialog, setDialog] = useState<DialogKind>(null);
  const closeDialog = useCallback(() => setDialog(null), []);
  const [preview, setPreview] = useState<{ url: string; title: string } | null>(null);
  const openPreview = useCallback((url: string, title: string) => setPreview({ url, title }), []);

  const openFlyer = useRulingPreview(openPreview);
  const fix = useAgentsFix(storeSlug);
  const fixEnd = useFixEndOfDay(storeSlug);
  const hide = useHideCircularProducts(storeSlug);
  const sources = useCatalogSources(storeSlug, dialog === 'hide');

  const jobs = useImportJobs(storeSlug);
  const { refetch: refetchJobs } = jobs;
  const onRetried = useCallback(() => void refetchJobs(), [refetchJobs]);
  const retry = useRetryImportJob(onRetried);
  const attention = useMemo(() => jobsNeedingAttention(jobs.data?.jobs || []), [jobs.data]);

  if (q.isLoading) {
    return (
      <PanelCard>
        <SectionHeader
          icon={<VisibilityOutlinedIcon sx={{ fontSize: 20, color: 'primary.main' }} />}
          title={TITLE}
        />
        <Box sx={{ p: 2.25 }}>
          <KpiSkeleton count={5} />
        </Box>
      </PanelCard>
    );
  }
  if (!s) {
    return (
      <PanelCard>
        <SectionHeader
          icon={<VisibilityOutlinedIcon sx={{ fontSize: 20, color: 'primary.main' }} />}
          title={TITLE}
        />
        <EmptyBlock
          title="No se pudo leer el estado de la lista"
          hint="Recarga la pestaña en un momento; si sigue igual, revisa los productos en Productos."
        />
      </PanelCard>
    );
  }

  const warn = !!r && (r.duplicates > 0 || s.visible > r.uniqueProducts);
  const viewFlyer = () => openFlyer.mutate(r);

  // Una acción principal a la vista; el resto en "Más acciones".
  const more: MoreMenuItem[] = [
    ...(r?.hasFile
      ? [
          {
            label: openFlyer.isPending ? 'Abriendo…' : 'Ver flyer vigente',
            hint: 'El arte o la portada del PDF que manda hoy en la lista.',
            disabled: openFlyer.isPending,
            onClick: viewFlyer,
          },
        ]
      : []),
    ...(r
      ? [
          {
            label: 'Ocultar los del circular',
            hint: 'Elige con qué flyer quedarte: todo lo demás se oculta.',
            onClick: () => setDialog('hide'),
          },
          {
            label: 'Corregir vigencia',
            hint: 'Si el flyer dejó de verse antes de su último día (23:59 de Nueva York).',
            onClick: () => setDialog('end'),
          },
        ]
      : []),
    ...(s.pending > 0
      ? [{ label: `Ver los ${s.pending} que esperan`, onClick: onOpenUpcoming }]
      : []),
  ];

  return (
    <PanelCard>
      <SectionHeader
        icon={<VisibilityOutlinedIcon sx={{ fontSize: 20, color: 'primary.main' }} />}
        title={TITLE}
        hint={
          r ? (
            <Chip
              size="small"
              color={r.kind === 'flyer' ? 'primary' : 'default'}
              variant="outlined"
              label={`${r.kind === 'flyer' ? 'Flyer' : 'Circular'}: ${r.title} · hasta ${fmtDate(
                r.endDate
              )}`}
              onClick={r.hasFile ? viewFlyer : undefined}
              sx={{ maxWidth: '100%' }}
            />
          ) : (
            <Chip
              size="small"
              color="warning"
              variant="outlined"
              label="Sin flyer ni circular vigente"
            />
          )
        }
        action={<MoreMenu items={more} />}
      />

      <ImportJobAlerts
        jobs={attention}
        retrying={retry.isPending}
        onRetry={retry.mutate}
      />

      <Stack
        direction="row"
        gap={1}
        flexWrap="wrap"
        sx={{ px: 2.25, py: 2 }}
      >
        {r ? (
          <Button
            size="small"
            variant={warn ? 'contained' : 'outlined'}
            color={warn ? 'warning' : 'primary'}
            startIcon={<SmartToyOutlinedIcon />}
            onClick={() => setDialog('fix')}
          >
            Que los agentes lo arreglen
          </Button>
        ) : (
          <Button
            size="small"
            variant="contained"
            color="warning"
            onClick={() => setDialog('end')}
          >
            Corregir vigencia
          </Button>
        )}
        <Button
          size="small"
          variant="outlined"
          onClick={onOpenProducts}
        >
          Ver productos
        </Button>
      </Stack>

      <ListStatusKpis summary={s} />

      <ImagePreviewDialog
        key={preview?.url || 'none'}
        url={preview?.url ?? null}
        title={preview?.title}
        onClose={() => setPreview(null)}
      />

      {dialog === 'end' && (
        <FixEndDialog
          pending={fixEnd.isPending}
          onClose={closeDialog}
          onSubmit={(until) => fixEnd.mutate(until, { onSuccess: closeDialog })}
        />
      )}

      {dialog === 'hide' && (
        <HideCircularDialog
          sources={sources.data?.sources || []}
          loading={sources.isLoading}
          pending={hide.isPending}
          onClose={closeDialog}
          onSubmit={(keepId) => hide.mutate(keepId, { onSuccess: closeDialog })}
        />
      )}

      {dialog === 'fix' && (
        <AgentsFixDialog
          ruling={r}
          pending={fix.isPending}
          onClose={closeDialog}
          onOpenAgents={onOpenAgents}
          onConfirm={() => fix.mutate(r, { onSuccess: closeDialog })}
        />
      )}
    </PanelCard>
  );
}
