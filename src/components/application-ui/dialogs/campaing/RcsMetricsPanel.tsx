'use client';

/**
 * Métricas de una campaña RCS: embudo completo — entregados, vistos (apertura),
 * clicks en los botones del RCS, clicks del short link, listas creadas y compras
 * de quienes clickearon.
 * Se muestra dentro del detalle de campaña sólo cuando la campaña es RCS.
 */

import { campaignClient } from '@/services/campaing.service';
import {
  Box,
  Card,
  Chip,
  Divider,
  LinearProgress,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import RcsSelectedTable from './RcsSelectedTable';

function Kpi({
  label,
  value,
  sub,
}: {
  label: string;
  value: string | number;
  sub?: string;
}) {
  return (
    <Card
      variant="outlined"
      sx={{ p: 2, flex: 1, minWidth: 140 }}
    >
      <Typography
        variant="caption"
        color="text.secondary"
        fontWeight={700}
        textTransform="uppercase"
        letterSpacing={0.5}
      >
        {label}
      </Typography>
      <Typography
        variant="h5"
        fontWeight={800}
        mt={0.5}
      >
        {value}
      </Typography>
      {sub && (
        <Typography
          variant="caption"
          color="text.secondary"
        >
          {sub}
        </Typography>
      )}
    </Card>
  );
}

/** Porcentaje seguro: nunca NaN ni fuera de 0–100. Sin dato = "—". */
const clampPct = (v: unknown): number | null => {
  const n = Number(v);
  return v == null || !Number.isFinite(n) ? null : Math.min(100, Math.max(0, Math.round(n)));
};
const pctLabel = (v: unknown) => {
  const n = clampPct(v);
  return n == null ? '—' : `${n}%`;
};
const ratio = (n: number, base: number) => (base > 0 ? (n / base) * 100 : null);
const count = (v: unknown) => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : 0;
};

const FINAL_STATUS = new Set(['completed', 'cancelled']);

function FunnelRow({ label, value, base }: { label: string; value: number; base: number }) {
  const pct = base > 0 ? Math.min(100, Math.round((value / base) * 100)) : 0;
  return (
    <Box>
      <Stack
        direction="row"
        justifyContent="space-between"
        mb={0.4}
      >
        <Typography
          variant="body2"
          fontWeight={600}
        >
          {label}
        </Typography>
        <Typography
          variant="body2"
          color="text.secondary"
        >
          {value.toLocaleString()} · {pct}%
        </Typography>
      </Stack>
      <LinearProgress
        variant="determinate"
        value={pct}
        sx={{ height: 8, borderRadius: 4 }}
      />
    </Box>
  );
}

export default function RcsMetricsPanel({ campaignId }: { campaignId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ['rcs-metrics', campaignId],
    queryFn: () => campaignClient.getRcsMetrics(campaignId),
    enabled: !!campaignId,
    // Deja de refrescar cuando la campaña terminó y no queda nada en cola.
    refetchInterval: (query) => {
      const d = query.state.data;
      const settled = !!d?.ok && FINAL_STATUS.has(String(d.campaign?.status)) && count(d.messages?.queued) === 0;
      return settled ? false : 60_000;
    },
  });

  if (isLoading) {
    return (
      <Card
        variant="outlined"
        sx={{ p: 2.5, mt: 2 }}
      >
        <Skeleton width={180}
height={24} />
        <Stack
          direction="row"
          spacing={1.5}
          mt={1.5}
        >
          {[0, 1, 2, 3].map((i) => (
            <Skeleton
              key={i}
              variant="rounded"
              height={84}
              sx={{ flex: 1 }}
            />
          ))}
        </Stack>
      </Card>
    );
  }

  if (!data?.ok) return null;

  const { messages: m, clicks: c, engagement: e, sms } = data;
  const base = m.total || 1;
  const isMixed = data.campaign?.channel === 'mixed' || data.campaign?.type === 'MIXED';

  // Clicks en los botones del RCS (distinto de los clicks de short links). El backend
  // manda ctr / clickToSeen; si faltan se calculan acá con la división protegida.
  const hasButtonClicks = [m.clicked, m.clicks, m.ctr, m.clickToSeen].some((v) => v != null);
  const btnClicked = count(m.clicked);
  const btnClicks = count(m.clicks);
  // En mixed `delivered` ya viene sin failover; en RCS puro hay que restarlo.
  const rcsDelivered = isMixed ? count(m.delivered) : Math.max(0, count(m.delivered) - count(m.failover));
  const btnCtr = m.ctr ?? ratio(btnClicked, rcsDelivered);
  const btnClickToSeen = m.clickToSeen ?? ratio(btnClicked, count(m.seen));

  return (
    <Card
      variant="outlined"
      sx={{ p: 2.5, mt: 2 }}
    >
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        flexWrap="wrap"
        gap={1}
        mb={2}
      >
        <Typography
          variant="subtitle1"
          fontWeight={800}
        >
          {isMixed ? 'Piloto mixto · RCS vs SMS' : 'Métricas RCS'}
        </Typography>
        <Chip
          size="small"
          variant="outlined"
          color="primary"
          label={isMixed ? 'RCS a clientes con nombre · resto SMS/MMS' : 'Canal Google · sender sweepstouch'}
        />
      </Stack>

      {/* Piloto mixed: RCS (con nombre + botón) contra el grupo SMS/MMS normal */}
      {isMixed && sms && (
        <Stack
          direction="row"
          spacing={1.5}
          flexWrap="wrap"
          useFlexGap
          mb={2}
        >
          <Kpi
            label="RCS · entregados"
            value={pctLabel(m.deliveryRate)}
            sub={`${m.delivered.toLocaleString()} de ${m.total.toLocaleString()} elegidos · ${(m.failover ?? 0).toLocaleString()} por failover MMS/SMS`}
          />
          <Kpi
            label="SMS/MMS · entregados"
            value={pctLabel(sms.deliveryRate)}
            sub={`${sms.delivered.toLocaleString()} de ${sms.total.toLocaleString()} enviados por SMS`}
          />
          {/* El botón del piloto lleva el link directo de la tienda (sin short por
              cliente): sus taps salen en "Clicks en botones RCS", no en "Clicks en links". */}
          <Kpi
            label="Sin RCS · failover"
            value={(m.failover ?? 0).toLocaleString()}
            sub="elegidos sin RCS en el teléfono: recibieron su MMS/SMS"
          />
        </Stack>
      )}

      {/* KPIs */}
      <Stack
        direction="row"
        spacing={1.5}
        flexWrap="wrap"
        useFlexGap
      >
        <Kpi
          label="Entregados"
          value={pctLabel(m.deliveryRate)}
          sub={`${m.delivered.toLocaleString()} de ${m.total.toLocaleString()}`}
        />
        <Kpi
          label="Apertura (vistos)"
          value={pctLabel(m.seenRate)}
          sub={`${m.seen.toLocaleString()} vieron el mensaje`}
        />
        {hasButtonClicks && (
          <>
            <Kpi
              label="Clicks en botones RCS"
              value={btnClicked.toLocaleString()}
              sub={`clientes únicos · ${btnClicks.toLocaleString()} taps en total`}
            />
            <Kpi
              label="CTR botones RCS"
              value={pctLabel(btnCtr)}
              sub={`${btnClicked.toLocaleString()} de ${rcsDelivered.toLocaleString()} RCS entregados`}
            />
            <Kpi
              label="Click / vistos · botones RCS"
              value={pctLabel(btnClickToSeen)}
              sub="de los que abrieron, tocaron un botón"
            />
          </>
        )}
        <Kpi
          label="Clicks en links"
          value={pctLabel(c.clickRate)}
          sub={`${count(c.clickedLinks).toLocaleString()} clientes · ${count(c.totalClicks).toLocaleString()} taps en short links`}
        />
        <Kpi
          label="Listas creadas"
          value={e.lists.toLocaleString()}
          sub={`${e.itemsInLists.toLocaleString()} productos agregados`}
        />
        <Kpi
          label="Compras"
          value={e.purchases.toLocaleString()}
          sub={`${e.buyers.toLocaleString()} compradores · ${e.productsPurchased.toLocaleString()} productos`}
        />
      </Stack>

      {/* Embudo */}
      <Stack
        spacing={1.5}
        mt={2.5}
      >
        <FunnelRow
          label="Enviados"
          value={m.total}
          base={base}
        />
        <FunnelRow
          label="Entregados"
          value={m.delivered}
          base={base}
        />
        <FunnelRow
          label="Vistos"
          value={m.seen}
          base={base}
        />
        {hasButtonClicks && (
          <FunnelRow
            label="Tocaron un botón RCS"
            value={btnClicked}
            base={base}
          />
        )}
        <FunnelRow
          label="Clickearon un link"
          value={count(c.clickedLinks)}
          base={base}
        />
        <FunnelRow
          label="Armaron lista"
          value={e.listCustomers}
          base={base}
        />
        <FunnelRow
          label="Compraron"
          value={e.buyers}
          base={base}
        />
      </Stack>

      {/* Registro por número: a quién se eligió para RCS y qué pasó (para reintentar) */}
      <RcsSelectedTable campaignId={campaignId} />

      {/* Lo que compraron */}
      {e.topProducts.length > 0 && (
        <>
          <Divider sx={{ my: 2.5 }} />
          <Typography
            variant="subtitle2"
            fontWeight={700}
            mb={1}
          >
            Lo que compraron
          </Typography>
          <Box sx={{ overflowX: 'auto' }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Producto</TableCell>
                  <TableCell align="right">Cantidad</TableCell>
                  <TableCell align="right">Clientes</TableCell>
                  <TableCell align="right">Precio</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {e.topProducts.map((p) => (
                  <TableRow key={p.name}>
                    <TableCell sx={{ fontWeight: 600 }}>{p.name}</TableCell>
                    <TableCell align="right">{p.quantity}</TableCell>
                    <TableCell align="right">{p.uniqueCustomers}</TableCell>
                    <TableCell align="right">
                      {p.price != null ? `$${Number(p.price).toFixed(2)}` : '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        </>
      )}

      <Typography
        variant="caption"
        color="text.secondary"
        display="block"
        mt={2}
      >
        Apertura = seen reports del canal RCS (sólo teléfonos con RCS). Clicks en botones RCS =
        clientes que tocaron un botón del mensaje (CTR sobre RCS entregados). Clicks en links =
        short links de la campaña. Listas y compras = actividad de los clientes que clickearon
        un link, desde el inicio de la campaña.
      </Typography>
    </Card>
  );
}
