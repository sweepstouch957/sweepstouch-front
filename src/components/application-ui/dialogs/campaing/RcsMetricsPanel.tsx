'use client';

/**
 * Métricas de una campaña RCS: embudo completo — entregados, vistos (apertura),
 * clicks del short link, listas creadas y compras de quienes clickearon.
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
    refetchInterval: 60_000,
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

  const { messages: m, clicks: c, engagement: e } = data;
  const base = m.total || 1;

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
          Métricas RCS
        </Typography>
        <Chip
          size="small"
          variant="outlined"
          color="primary"
          label="Canal Google · sender sweepstouch"
        />
      </Stack>

      {/* KPIs */}
      <Stack
        direction="row"
        spacing={1.5}
        flexWrap="wrap"
        useFlexGap
      >
        <Kpi
          label="Entregados"
          value={`${m.deliveryRate}%`}
          sub={`${m.delivered.toLocaleString()} de ${m.total.toLocaleString()}`}
        />
        <Kpi
          label="Apertura (vistos)"
          value={`${m.seenRate}%`}
          sub={`${m.seen.toLocaleString()} vieron el mensaje`}
        />
        <Kpi
          label="Clicks"
          value={`${c.clickRate}%`}
          sub={`${c.clickedLinks.toLocaleString()} clientes · ${c.totalClicks.toLocaleString()} taps`}
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
        <FunnelRow
          label="Clickearon"
          value={c.clickedLinks}
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
        Apertura = seen reports del canal RCS (sólo teléfonos con RCS). Clicks = short links
        de la campaña. Listas y compras = actividad de los clientes que clickearon, desde el
        inicio de la campaña.
      </Typography>
    </Card>
  );
}
