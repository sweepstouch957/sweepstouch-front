'use client';

import { panelBorder } from '@/components/application-ui/content-shells/store-managment/panel-kit';
import type { campaignClient, RcsCampaignSummary } from '@/services/campaing.service';
import { alpha, Box, Stack, Typography, useTheme } from '@mui/material';
import { Fragment } from 'react';
import { num, pct } from './constants';
import { AutoGrid, Bar, StatsCard } from './ui';

export type RcsMetrics = Awaited<ReturnType<typeof campaignClient.getRcsMetrics>>;

const rate = (n: number, base: number) => (base > 0 ? Math.round((n / base) * 100) : 0);

function ChannelBox({
  tag,
  tagColor,
  title,
  value,
  foot,
}: {
  tag: string;
  tagColor: string;
  title: string;
  value: number;
  foot: string;
}) {
  const theme = useTheme();
  return (
    <Stack
      gap={1}
      sx={{ border: panelBorder(theme), borderRadius: 3.5, p: 2 }}
    >
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="baseline"
        gap={1}
      >
        <Stack
          direction="row"
          alignItems="center"
          gap={1}
          sx={{ fontWeight: 700, minWidth: 0 }}
        >
          <Box
            component="span"
            sx={{
              bgcolor: tagColor,
              color: theme.palette.getContrastText(tagColor),
              fontSize: 11,
              px: 0.9,
              py: 0.25,
              borderRadius: 1.5,
              fontWeight: 700,
            }}
          >
            {tag}
          </Box>
          <Typography
            noWrap
            sx={{ fontWeight: 700, fontSize: 14 }}
          >
            {title}
          </Typography>
        </Stack>
        <Typography sx={{ fontSize: 22, fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>{value}%</Typography>
      </Stack>
      <Bar
        value={value}
        color={tagColor}
      />
      <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>{foot}</Typography>
    </Stack>
  );
}

export function RcsPilotCard({
  metrics,
  summary,
  isMixed,
  costPerMsg,
}: {
  metrics: RcsMetrics;
  summary?: RcsCampaignSummary;
  isMixed: boolean;
  /** Costo por mensaje real por canal (de /cost). */
  costPerMsg: { rcs: number | null; sms: number | null };
}) {
  const theme = useTheme();
  const m = metrics.messages;
  const sms = metrics.sms;
  const primary = theme.palette.primary.main;
  const dark = theme.palette.text.primary;
  const failover = m.failover ?? 0;
  const hasButtons = [m.clicked, m.clicks, m.ctr].some((v) => v != null);
  const rcsRate = rate(m.delivered, m.total);
  const smsRate = sms ? rate(sms.delivered, sms.total) : 0;
  const diff = rcsRate - smsRate;

  const funnel = [
    { label: 'Enviados', n: m.total, step: '' },
    { label: 'Entregados', n: m.delivered, step: 'llegó' },
    { label: 'Vieron el mensaje', n: m.seen, step: 'lo abrió' },
    ...(hasButtons ? [{ label: 'Tocaron un botón', n: m.clicked ?? 0, step: 'tocó un botón' }] : []),
  ];
  const shades = [primary, primary, alpha(primary, 0.75), alpha(primary, 0.5)];

  return (
    <StatsCard
      title={isMixed ? 'Piloto RCS vs SMS' : 'Métricas RCS'}
      subtitle={
        isMixed
          ? `RCS a clientes con nombre (${num(m.total)}) · el resto recibió SMS/MMS`
          : `${num(m.total)} números elegidos para RCS`
      }
    >
      <AutoGrid
        min={380}
        gap={3.5}
      >
        <Stack gap={1.75}>
          {isMixed && sms ? (
            <>
              <Typography sx={{ fontSize: 13, fontWeight: 600, color: 'text.secondary' }}>
                ¿Qué canal entregó mejor?
              </Typography>
              <ChannelBox
                tag="RCS"
                tagColor={primary}
                title={`${num(m.total)} elegidos`}
                value={rcsRate}
                foot={`${num(m.delivered)} entregados${failover ? ` · ${num(failover)} sin RCS en el teléfono recibieron su SMS/MMS` : ''}`}
              />
              <ChannelBox
                tag="SMS/MMS"
                tagColor={dark}
                title={`${num(sms.total)} enviados`}
                value={smsRate}
                foot={`${num(sms.delivered)} entregados`}
              />
              <Typography sx={{ fontSize: 13, color: 'text.secondary', lineHeight: 1.5 }}>
                RCS entregó{' '}
                <strong>
                  {Math.abs(diff)} {Math.abs(diff) === 1 ? 'punto' : 'puntos'} {diff >= 0 ? 'más' : 'menos'}
                </strong>{' '}
                que SMS/MMS
                {costPerMsg.rcs != null && costPerMsg.sms != null && (
                  <>
                    {' '}
                    y costó <strong>${costPerMsg.rcs.toFixed(3)}</strong> por mensaje frente a{' '}
                    <strong>${costPerMsg.sms.toFixed(3)}</strong>
                  </>
                )}
                .
              </Typography>
            </>
          ) : (
            <>
              <Typography sx={{ fontSize: 13, fontWeight: 600, color: 'text.secondary' }}>
                Qué pasó con los elegidos
              </Typography>
              <ChannelBox
                tag="RCS"
                tagColor={primary}
                title="Entregados por RCS"
                value={rcsRate}
                foot={`${num(m.delivered)} de ${num(m.total)}`}
              />
              <AutoGrid min={120}>
                {[
                  { l: 'Por SMS/MMS', n: failover, c: 'warning.main' },
                  { l: 'No llegó', n: m.errors, c: 'error.main' },
                  { l: 'Pendientes', n: m.queued, c: 'info.main' },
                ].map((x) => (
                  <Stack
                    key={x.l}
                    gap={0.25}
                  >
                    <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>{x.l}</Typography>
                    <Typography sx={{ fontSize: 18, fontWeight: 700, color: x.c, fontVariantNumeric: 'tabular-nums' }}>
                      {num(x.n)}
                    </Typography>
                  </Stack>
                ))}
              </AutoGrid>
            </>
          )}
        </Stack>

        <Stack gap={1.75}>
          <Typography sx={{ fontSize: 13, fontWeight: 600, color: 'text.secondary' }}>
            Embudo RCS · de {num(m.total)} elegidos
          </Typography>
          <Stack gap={0.5}>
            {funnel.map((f, i) => (
              <Fragment key={f.label}>
                {i > 0 && (
                  <Typography sx={{ pl: { xs: 0, sm: '132px' }, fontSize: 11, color: 'text.secondary' }}>
                    ↓ {pct(f.n, funnel[i - 1].n, 0)} {f.step}
                  </Typography>
                )}
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '96px minmax(0,1fr) 56px', sm: '120px minmax(0,1fr) 64px' },
                    gap: 1.5,
                    alignItems: 'center',
                  }}
                >
                  <Typography sx={{ fontSize: 13 }}>{f.label}</Typography>
                  <Bar
                    value={m.total ? (f.n / m.total) * 100 : 0}
                    color={shades[i]}
                    height={30}
                  />
                  <Typography sx={{ fontWeight: 700, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                    {num(f.n)}
                  </Typography>
                </Box>
              </Fragment>
            ))}
          </Stack>
          <Stack gap={0.5}>
            {hasButtons && (
              <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
                {num(m.clicked)} clientes únicos tocaron botones {num(m.clicks)} veces · CTR{' '}
                {m.ctr != null ? `${m.ctr}%` : pct(m.clicked ?? 0, m.delivered, 0)} sobre entregados
                {summary?.clickSource === 'link' ? ' (medido por el link del botón)' : ''}
              </Typography>
            )}
            {summary?.seenMinutes != null && (
              <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
                Lo abrieron en promedio {summary.seenMinutes < 60
                  ? `a los ${Math.round(summary.seenMinutes)} min`
                  : `a las ${(summary.seenMinutes / 60).toLocaleString('es', { maximumFractionDigits: 1 })} h`}{' '}
                de recibirlo
              </Typography>
            )}
          </Stack>
        </Stack>
      </AutoGrid>
    </StatsCard>
  );
}
