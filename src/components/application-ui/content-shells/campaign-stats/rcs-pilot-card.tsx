'use client';

import { panelBorder } from '@/components/application-ui/content-shells/store-managment/panel-kit';
import type { campaignClient, RcsCampaignSummary } from '@/services/campaing.service';
import { tint } from '@/theme/semantic';
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
    { label: 'Elegidos', n: m.total, step: '' },
    { label: 'Recibieron RCS', n: m.delivered, step: 'recibió el RCS' },
    { label: 'Lo abrieron', n: m.seen, step: 'lo abrió' },
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
      <Box sx={{ bgcolor: tint(theme, 'primary', 0.06), borderRadius: 3, px: 2, py: 1.75 }}>
        <Typography sx={{ fontSize: 14, lineHeight: 1.65 }}>
          De <strong>{num(m.total)}</strong> clientes elegidos para RCS,{' '}
          <strong>{num(m.delivered)} lo recibieron como RCS</strong> ({pct(m.delivered, m.total, 0)})
          {m.seen > 0 && <>, <strong>{num(m.seen)} lo abrieron</strong></>}
          {hasButtons && (m.clicked ?? 0) > 0 && <> y <strong>{num(m.clicked)} tocaron un botón</strong></>}.
          {failover > 0 && <> A {num(failover)} que no tienen RCS en el teléfono les llegó el SMS/MMS normal.</>}
          {m.errors > 0 && <> {num(m.errors)} no recibieron nada.</>}
          {m.queued > 0 && <> {num(m.queued)} siguen pendientes.</>}
        </Typography>
        <Typography sx={{ fontSize: 12, color: 'text.secondary', mt: 0.75, lineHeight: 1.5 }}>
          RCS es el mensaje enriquecido de Android: lleva foto, botones y avisa cuando lo leen. Si el teléfono no lo
          soporta, Infobip manda el SMS/MMS en su lugar, así que el cliente no se queda sin mensaje.
        </Typography>
      </Box>

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
                    y cada RCS costó <strong>${costPerMsg.rcs.toFixed(3)}</strong> frente a{' '}
                    <strong>${costPerMsg.sms.toFixed(3)}</strong> por SMS/MMS
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
