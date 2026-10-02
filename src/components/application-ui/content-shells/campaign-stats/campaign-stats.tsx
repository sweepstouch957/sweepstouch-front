'use client';

/**
 * Estadísticas de UNA campaña. Contenedor: queries, mutation de sincronizar y modales.
 * Las secciones RCS (piloto, embudo, destinatarios) sólo aparecen si la campaña eligió
 * números para RCS; la actividad (clicks, listas, compras) sale para todas.
 */

import { useCampaignById } from '@/hooks/fetching/campaigns/useCampaignById';
import { campaignClient } from '@/services/campaing.service';
import { qboService } from '@/services/qbo.service';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import { Box, Button, Link, Skeleton, Stack, Typography } from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import dynamic from 'next/dynamic';
import NextLink from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { ActivityCard } from './activity-card';
import { AiSuggestions } from './ai-suggestions';
import { BillingCard } from './billing-card';
import { CollectionBlock } from './collection-block';
import { channelsPhrase, isMixedCampaign, isRcsCampaign, money, num, pct } from './constants';
import { DeliveryCard } from './delivery-card';
import { FlyerCard, FlyerDialog, MessageCard } from './message-flyer-cards';
import { RcsPilotCard } from './rcs-pilot-card';
import { RcsRecipientsCard } from './rcs-recipients-card';
import { SessionLinksCard } from './session-links-card';
import { SummaryCard } from './summary-card';
import { AutoGrid, StatTile } from './ui';

const CampaignLogsModal = dynamic(() => import('@/components/CampaignLogsModal'), { loading: () => null });
const CampaignResendModal = dynamic(() => import('@/components/CampaignResendModal'), { loading: () => null });

type Modal = 'flyer' | 'logs-sent' | 'logs-failed' | 'resend' | null;

export default function CampaignStats({ campaignId }: { campaignId: string }) {
  const router = useRouter();
  const qc = useQueryClient();
  const [modal, setModal] = useState<Modal>(null);
  const { data: campaign, isLoading, refetch } = useCampaignById(campaignId);

  // Lo FACTURADO a la tienda (campaign.cost) vs lo que COBRÓ Infobip, canal por canal.
  const { data: realCost } = useQuery({
    queryKey: ['campaign-cost', campaignId],
    queryFn: () => campaignClient.getCampaignCost(campaignId),
    enabled: !!campaignId,
    staleTime: 60_000,
  });

  // Entrega por canal + clicks + listas + compras. Sirve para toda campaña; mientras
  // siga en curso se refresca cada minuto.
  const { data: metrics } = useQuery({
    queryKey: ['rcs-metrics', campaignId],
    queryFn: () => campaignClient.getRcsMetrics(campaignId),
    enabled: !!campaignId,
    staleTime: 30_000,
    refetchInterval: (q) => {
      const d = q.state.data;
      const settled = d?.ok && ['completed', 'cancelled'].includes(d.campaign?.status) && !d.messages?.queued;
      return settled ? false : 60_000;
    },
  });

  const rcs = isRcsCampaign(campaign);
  const mixed = isMixedCampaign(campaign);
  // Tiempo a la apertura y fuente de los clicks: sólo vienen del resumen RCS.
  // Link con sesión: sólo si la campaña lo usa (#linklogin o piloto RCS).
  const { data: sessionLinks } = useQuery({
    queryKey: ['campaign-session-links', campaignId],
    queryFn: () => campaignClient.getSessionLinkSplit(campaignId),
    enabled: !!campaignId && (mixed || /#linklogin/i.test(campaign?.content || '')),
    staleTime: 5 * 60_000,
  });

  const { data: rcsSummary } = useQuery({
    queryKey: ['rcs-summary', [campaignId]],
    queryFn: () => campaignClient.getRcsSummary([campaignId]),
    enabled: !!campaignId && rcs,
    staleTime: 60_000,
    select: (s) => s[campaignId],
  });

  // Cobro: factura de QuickBooks que la cobró + saldo total de la tienda.
  const storeId = campaign ? String(typeof campaign.store === 'object' ? campaign.store?._id : campaign.store) : '';
  const { data: billing, isLoading: billingLoading } = useQuery({
    queryKey: ['qbo', 'campaign-billing', campaignId],
    queryFn: () => qboService.campaignBilling(campaignId),
    enabled: !!campaignId,
    staleTime: 5 * 60_000,
    retry: false,
  });
  const { data: storeQbo } = useQuery({
    queryKey: ['qbo', 'store', storeId],
    queryFn: () => qboService.storeDetail(storeId),
    enabled: !!storeId && !!billing?.linked,
    staleTime: 5 * 60_000,
    retry: false,
  });

  const sync = useMutation({
    mutationFn: () => campaignClient.syncCampaignMetrics({ campaignId, includeZeroSent: true }),
    onSuccess: (res: any) => {
      const logs = res?.details?.reduce((s: number, d: any) => s + (d.updatedLogs || 0), 0) || 0;
      toast.success(`Métricas actualizadas · ${num(logs)} mensajes`);
      qc.invalidateQueries({ queryKey: ['campaign-cost', campaignId] });
      qc.invalidateQueries({ queryKey: ['rcs-metrics', campaignId] });
      qc.invalidateQueries({ queryKey: ['campaign', 'logs', campaignId] });
      setTimeout(() => refetch(), 600);
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'No se pudieron actualizar las métricas'),
  });

  if (isLoading || !campaign) {
    return (
      <Stack gap={2.5}>
        <Skeleton variant="rounded"
height={104}
sx={{ borderRadius: 4.5 }} />
        <AutoGrid min={200}>
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i}
variant="rounded"
height={112}
sx={{ borderRadius: 4 }} />
          ))}
        </AutoGrid>
        <Skeleton variant="rounded"
height={360}
sx={{ borderRadius: 4.5 }} />
        {!isLoading && (
          <Typography sx={{ color: 'text.secondary', textAlign: 'center' }}>No se encontró la campaña.</Typography>
        )}
      </Stack>
    );
  }

  const audience = campaign.audience ?? 0;
  const sent = campaign.sent ?? 0;
  const errors = campaign.errors ?? 0;
  const pending = Math.max(0, audience - sent - errors);
  const charged = Number(campaign.cost || 0);
  const channels = channelsPhrase(campaign);
  const realTotal = realCost?.totalCost ?? 0;

  // Costo por mensaje real: RCS vs el canal principal (SMS o MMS) para la comparación.
  const mainChannel = realCost?.channels
    ?.filter((c) => !c.channel.startsWith('rcs') && !c.channel.includes('failover'))
    .sort((a, b) => b.messages - a.messages)[0];
  const costPerMsg = {
    rcs: realCost?.rcsPricePerMessage ?? null,
    sms: mainChannel?.messages ? mainChannel.cost / mainChannel.messages : null,
  };

  const openResend = () => setModal('resend');

  return (
    <Stack
      gap={2.5}
      sx={{ fontVariantNumeric: 'tabular-nums', pb: 6 }}
    >
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        gap={1.5}
        flexWrap="wrap"
      >
        <Button
          startIcon={<ArrowBackRoundedIcon />}
          onClick={() => router.back()}
          sx={{ fontWeight: 600, px: 1 }}
        >
          Volver
        </Button>
        <Stack
          direction="row"
          gap={1}
          sx={{ fontSize: 13, color: 'text.secondary' }}
        >
          <Link
            component={NextLink}
            href="/admin/management/campaings"
            underline="hover"
            color="text.secondary"
          >
            Campañas
          </Link>
          <span>/</span>
          <Box
            component="span"
            sx={{ color: 'text.primary', fontWeight: 600 }}
          >
            Estadísticas
          </Box>
        </Stack>
      </Stack>

      <SummaryCard
        campaign={campaign}
        errors={errors}
        syncing={sync.isPending}
        onSync={() => sync.mutate()}
        onResend={openResend}
        onOpenFlyer={() => setModal('flyer')}
      />

      <AutoGrid min={200}>
        <StatTile
          label="Audiencia"
          value={num(audience)}
          hint="clientes en la lista"
        />
        <StatTile
          label="Entregados"
          value={num(sent)}
          tone="success"
          hint={`${pct(sent, audience)} de la audiencia`}
          onClick={() => setModal('logs-sent')}
        />
        <StatTile
          label="No entregados"
          value={num(errors)}
          tone={errors ? 'error' : 'neutral'}
          hint={`${pct(errors, audience)}${pending ? ` · ${num(pending)} aún pendientes` : ''}`}
          onClick={errors ? () => setModal('logs-failed') : undefined}
        />
        <StatTile
          label="Cobrado a la tienda"
          value={money(charged)}
          hint={audience ? `$${(charged / audience).toFixed(4)} por mensaje` : undefined}
        />
        {realTotal > 0 && (
          <StatTile
            label="Costo real Infobip"
            value={money(realTotal)}
            hint={`${charged - realTotal < 0 ? '−' : '+'}${money(Math.abs(charged - realTotal))} vs. lo cobrado`}
            hintTone={charged - realTotal < 0 ? 'error' : 'success'}
          />
        )}
      </AutoGrid>

      <AutoGrid
        min={460}
        gap={2.5}
      >
        <DeliveryCard
          audience={audience}
          sent={sent}
          errors={errors}
          pending={pending}
          channels={channels}
          onOpenDelivered={() => setModal('logs-sent')}
          onOpenErrors={() => setModal('logs-failed')}
          onResend={openResend}
        />
        <BillingCard
            charged={charged}
            cost={realCost}
            collection={
              <CollectionBlock
                charged={charged}
                audience={audience}
                billing={billing}
                loading={billingLoading}
                store={storeQbo}
              />
            }
          />
      </AutoGrid>

      {sessionLinks?.applies && sessionLinks.total > 0 && <SessionLinksCard data={sessionLinks} />}

      {rcs && metrics?.ok && metrics.messages.total > 0 && (
        <RcsPilotCard
          metrics={metrics}
          summary={rcsSummary}
          isMixed={mixed}
          costPerMsg={costPerMsg}
        />
      )}

      {metrics?.ok && (
        <ActivityCard
          metrics={metrics}
          delivered={sent}
          channels={channels}
        />
      )}

      {rcs && metrics?.ok && metrics.messages.total > 0 && (
        <RcsRecipientsCard
          campaignId={campaignId}
          metrics={metrics}
        />
      )}

      <AutoGrid
        min={420}
        gap={2.5}
      >
        <MessageCard
          content={campaign.content}
          description={campaign.description}
        >
          <AiSuggestions
            platform={campaign.platform}
            type={campaign.type}
            channels={channels}
            audience={audience}
            sent={sent}
            errors={errors}
          />
        </MessageCard>
        <FlyerCard
          image={campaign.image}
          onOpen={() => setModal('flyer')}
        />
      </AutoGrid>

      <FlyerDialog
        open={modal === 'flyer'}
        image={campaign.image}
        onClose={() => setModal(null)}
      />
      {(modal === 'logs-sent' || modal === 'logs-failed') && (
        <CampaignLogsModal
          open
          onClose={() => setModal(null)}
          campaignId={campaignId}
          defaultStatus={modal === 'logs-sent' ? 'sent' : 'failed'}
        />
      )}
      {modal === 'resend' && (
        <CampaignResendModal
          open
          onClose={() => {
            setModal(null);
            setTimeout(() => refetch(), 1000);
          }}
          campaignId={campaignId}
        />
      )}
    </Stack>
  );
}
