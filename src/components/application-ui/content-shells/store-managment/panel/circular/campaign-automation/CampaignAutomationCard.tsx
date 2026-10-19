'use client';

/**
 * 1 · Automático: al agendar una campaña con arte, sus productos y su banner llegan solos a
 * la lista del cliente (cola /campaign-import de circular-service). Acá se ve el flujo, se
 * reintenta si falló y se puede releer el arte a mano.
 *
 * Contenedor: el único de la carpeta que toca React Query y la navegación.
 */
import {
  PanelCard,
  SectionHeader,
  StatusPill,
} from '@/components/application-ui/content-shells/store-managment/panel-kit';
import { cloudinaryThumb } from '@/utils/cloudinary';
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded';
import EventRoundedIcon from '@mui/icons-material/EventRounded';
import { Box, Button, Divider, LinearProgress, Stack, Typography } from '@mui/material';
import NextLink from 'next/link';
import { useMemo, useState } from 'react';
import {
  useCampaignImportJob,
  useCircularBusy,
  useLastCampaignArt,
  useStoreCirculars,
} from '../hooks';
import { MoreMenu } from '../panelUi';
import { fmtDate } from '../shared';
import { FlowSkeleton } from '../skeletons';
import ArtRow from './ArtRow';
import CampaignAutomationFlow from './CampaignAutomationFlow';
import ReadByHandDialog from './ReadByHandDialog';
import { buildSteps } from './steps';
import {
  useFixList,
  useReadArtByHand,
  useRefreshWhenImportDone,
  useRetryCampaignImport,
  type ReadByHandValues,
} from './use-campaign-automation';

type Props = {
  storeId: string;
  storeSlug: string;
  upcomingCount: number;
  onOpenUpcoming: () => void;
  onPreview: (url: string, title: string) => void;
};

export default function CampaignAutomationCard({
  storeId,
  storeSlug,
  upcomingCount,
  onOpenUpcoming,
  onPreview,
}: Props) {
  const { campaign, image, source, isLoading: campaignLoading } = useLastCampaignArt(storeId);
  const { current, flyers } = useStoreCirculars(storeSlug);
  // Flyer vigente (el circular de campaña activo/agendado): para verlo aunque la última
  // campaña no tenga arte o sea otra.
  const liveFlyer = useMemo(
    () =>
      flyers.find((f) => f.status === 'active') ||
      flyers.find((f) => f.status === 'scheduled') ||
      flyers[0] ||
      null,
    [flyers]
  );
  const { busy } = useCircularBusy(storeSlug);

  // Mientras corre el import se consulta seguido; al terminar llega aviso a la campana.
  const campaignId: string | undefined = campaign?._id;
  const job = useCampaignImportJob(campaignId);
  const status = job.data?.status;
  useRefreshWhenImportDone(storeSlug, status);

  const steps = useMemo(
    () => buildSteps(image ? campaign : null, job.data ?? null),
    [image, campaign, job.data]
  );

  const fixList = useFixList(storeSlug);
  const retry = useRetryCampaignImport(campaignId);
  const readByHand = useReadArtByHand(storeSlug);
  const [askOpen, setAskOpen] = useState(false);

  const retryImport = () =>
    retry.mutate({
      campaignId: campaign._id,
      storeId,
      imageUrl: source,
      startDate: campaign.startDate,
      title: campaign.title,
    });
  const startReading = (values: ReadByHandValues) => {
    setAskOpen(false);
    readByHand.mutate({ ...values, current, source });
  };

  return (
    <PanelCard>
      <SectionHeader
        icon={<AutoAwesomeRoundedIcon sx={{ fontSize: 20, color: 'primary.main' }} />}
        title="Campaña → lista del cliente"
        hint={
          <Stack
            direction="row"
            gap={0.75}
          >
            <StatusPill
              label="Automático"
              dot={false}
            />
            {status === 'running' && (
              <StatusPill
                label="Trabajando ahora"
                tone="info"
              />
            )}
          </Stack>
        }
        action={
          <MoreMenu
            items={[
              {
                label: fixList.isPending ? 'Arreglando la lista…' : 'Arreglar productos de la lista',
                hint: 'Si la lista muestra productos de un flyer viejo o le faltan los del vigente: deja visibles sólo los del flyer de hoy.',
                disabled: fixList.isPending || busy,
                onClick: () => fixList.mutate(),
              },
            ]}
          />
        }
      />

      <Stack
        spacing={2.5}
        sx={{ p: 2.25 }}
      >
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          alignItems={{ md: 'center' }}
          justifyContent="space-between"
          gap={1.5}
        >
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ maxWidth: 720 }}
          >
            Al agendar una campaña, la IA lee los productos y el banner de su arte (o del circular
            de la tienda si no tiene arte) y los suma a la lista con los precios del día de la
            campaña. Ese día la lista muestra SOLO ese flyer; el anterior deja de verse.
          </Typography>
          <Stack
            direction="row"
            gap={1}
            flexWrap="wrap"
            sx={{ flexShrink: 0 }}
          >
            {upcomingCount > 0 && (
              <Button
                variant="text"
                startIcon={<EventRoundedIcon />}
                onClick={onOpenUpcoming}
              >
                {upcomingCount} próximo{upcomingCount !== 1 ? 's' : ''}
              </Button>
            )}
            <Button
              component={NextLink}
              href={`/admin/management/stores/edit/${storeId}?tag=campaigns&action=create`}
              variant="contained"
            >
              Agendar campaña
            </Button>
          </Stack>
        </Stack>

        {campaignLoading ? <FlowSkeleton /> : <CampaignAutomationFlow steps={steps} />}

        {!image && liveFlyer?.fileUrl && (
          <>
            <Divider />
            <ArtRow
              thumbUrl={cloudinaryThumb(
                liveFlyer.previewImageUrl || liveFlyer.fileUrl,
                144,
                200,
                'fill'
              )}
              thumbLabel="Ver el flyer vigente en grande"
              onOpen={() => onPreview(liveFlyer.fileUrl, liveFlyer.title || 'Flyer de campaña')}
              title="Flyer vigente"
              subtitle={`${liveFlyer.title} · ${fmtDate(liveFlyer.startDate)} → ${fmtDate(
                liveFlyer.endDate
              )}`}
              actions={
                <Button
                  variant="outlined"
                  onClick={() => onPreview(liveFlyer.fileUrl, liveFlyer.title || 'Flyer de campaña')}
                >
                  Ver flyer
                </Button>
              }
            />
          </>
        )}

        {image && (
          <Box>
            <Divider sx={{ mb: 2.5 }} />
            <ArtRow
              thumbUrl={image}
              thumbLabel="Ver el arte de la campaña en grande"
              onOpen={() => onPreview(image, campaign?.title || 'Arte de la campaña')}
              title="Arte de la última campaña"
              subtitle={`${campaign?.title || 'Sin título'}${
                campaign?.startDate ? ` · ${fmtDate(campaign.startDate)}` : ''
              }`}
              help={
                job.data
                  ? 'Si faltó algún producto, se puede volver a leer a mano: sólo suma los que no están.'
                  : 'Esta campaña se agendó antes de la automatización: carga sus productos a mano.'
              }
              actions={
                <>
                  {status === 'failed' && (
                    <Button
                      variant="contained"
                      color="error"
                      disabled={retry.isPending}
                      onClick={retryImport}
                    >
                      {retry.isPending ? 'Reintentando…' : 'Reintentar automático'}
                    </Button>
                  )}
                  <Button
                    variant="outlined"
                    disabled={readByHand.isPending || busy}
                    onClick={() => setAskOpen(true)}
                  >
                    {readByHand.isPending
                      ? 'Leyendo la imagen…'
                      : job.data
                        ? 'Leer de nuevo a mano'
                        : 'Cargar productos de la campaña'}
                  </Button>
                </>
              }
            />
            {readByHand.isPending && <LinearProgress sx={{ mt: 1.5, borderRadius: 1 }} />}
          </Box>
        )}
      </Stack>

      {askOpen && (
        <ReadByHandDialog
          hasCurrent={!!current}
          onClose={() => setAskOpen(false)}
          onSubmit={startReading}
        />
      )}
    </PanelCard>
  );
}
