'use client';

/**
 * "A dónde llevó el link": cuántos clientes recibieron el link con su sesión iniciada (tienen
 * nombre) y cuántos el link normal. Es la regla del scheduler (loginUrlFor) aplicada a la
 * audiencia de hoy: una foto, no el registro exacto del envío.
 *
 * OJO: esto es el LINK, no el canal. Antes la fila decía "RCS con su sesión" en campañas que
 * salieron 100% por MMS y la gente leía "8.000 RCS" contra "11.000 MMS". Ahora el canal real
 * (lo que de verdad salió, mensaje por mensaje) va arriba y la fila sólo habla del link.
 */
import type { Campaing } from '@/models/campaing';
import type { SessionLinkSplit } from '@/services/campaing.service';
import { Stack, Typography, useTheme } from '@mui/material';
import { isRcsCampaign, num, pct } from './constants';
import { AutoGrid, Bar, MetaChip, StatsCard } from './ui';

function Row({ color, title, help, value, total }: { color: string; title: string; help: string; value: number; total: number }) {
  return (
    <Stack gap={0.75}>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="baseline"
        gap={1}
      >
        <Typography sx={{ fontSize: 14, fontWeight: 700 }}>{title}</Typography>
        <Typography sx={{ fontSize: 14, fontWeight: 800, whiteSpace: 'nowrap' }}>
          {num(value)}{' '}
          <Typography
            component="span"
            sx={{ fontSize: 12, color: 'text.secondary' }}
          >
            · {pct(value, total)}
          </Typography>
        </Typography>
      </Stack>
      <Bar
        value={total ? (value / total) * 100 : 0}
        color={color}
      />
      <Typography sx={{ fontSize: 12.5, color: 'text.secondary' }}>{help}</Typography>
    </Stack>
  );
}

// Nombres que devuelve /campaign/:id/cost: sms | mms | rcs | <tipo>_failover
const CHANNEL_LABEL: Record<string, string> = {
  sms: 'SMS',
  mms: 'MMS',
  rcs: 'RCS',
  sms_failover: 'SMS (respaldo de RCS)',
  mms_failover: 'MMS (respaldo de RCS)',
};

export function SessionLinksCard({
  data,
  campaign,
  sentByChannel = [],
}: {
  data: SessionLinkSplit;
  campaign?: Campaing;
  /** Lo que de verdad salió, por canal (del costo real de Infobip). */
  sentByChannel?: Array<{ channel: string; messages: number }>;
}) {
  const theme = useTheme();
  const rcs = isRcsCampaign(campaign);
  const sent = sentByChannel.filter((c) => c.messages > 0).sort((a, b) => b.messages - a.messages);
  const totalSent = sent.reduce((s, c) => s + c.messages, 0);
  const mainChannel = sent[0] ? CHANNEL_LABEL[sent[0].channel] || sent[0].channel.toUpperCase() : null;
  const soloUnCanal = sent.length === 1 && mainChannel;

  return (
    <StatsCard
      title="A dónde llevó el link"
      subtitle="Todos entran a Mi cuenta con su sesión. Lo que cambia es si ya tenían nombre y correo o si el dashboard se los pidió."
    >
      {sent.length > 0 && (
        <Stack
          direction="row"
          alignItems="center"
          flexWrap="wrap"
          gap={1}
        >
          <Typography sx={{ fontSize: 13, fontWeight: 700 }}>
            {soloUnCanal ? `Todos los mensajes salieron por ${mainChannel}` : 'Cómo salió, mensaje por mensaje'}
          </Typography>
          {sent.map((c) => (
            <MetaChip
              key={c.channel}
              strong={c.channel === sent[0].channel}
            >
              {CHANNEL_LABEL[c.channel] || c.channel.toUpperCase()}: {num(c.messages)}
              {totalSent ? ` · ${pct(c.messages, totalSent, 0)}` : ''}
            </MetaChip>
          ))}
          {!rcs && !sent.some((c) => c.channel.startsWith('rcs')) && <MetaChip>RCS: 0 (esta campaña no usó RCS)</MetaChip>}
        </Stack>
      )}

      <AutoGrid
        min={220}
        gap={2.5}
      >
        <Row
          color={theme.palette.primary.main}
          title="Perfil completo"
          help="Tienen nombre y correo: entran a Mi cuenta sin que se les pida nada."
          value={data.dashboard}
          total={data.total}
        />
        <Row
          color={theme.palette.secondary.main}
          title="Les faltaba nombre o correo"
          help={`Al abrir Mi cuenta ven el modal para completarlo.${mainChannel ? ` Les llegó por ${mainChannel}.` : ''}`}
          value={data.linktree}
          total={data.total}
        />
        {data.fills && (
          <Row
            color={theme.palette.success.main}
            title="Completaron datos en esta campaña"
            help={`Nombre: ${num(data.fills.name)} · Correo: ${num(data.fills.email)} · Ambos: ${num(data.fills.both)}. Contado desde el modal del dashboard.`}
            value={data.fills.any}
            total={data.total}
          />
        )}
        {data.plain > 0 && (
          <Row
            color={theme.palette.text.disabled}
            title="Link normal"
            help="Sin sesión."
            value={data.plain}
            total={data.total}
          />
        )}
      </AutoGrid>
      <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
        Calculado sobre la audiencia actual de la tienda ({num(data.total)} clientes) con la misma regla del envío. No es un conteo de canal.
      </Typography>
    </StatsCard>
  );
}
