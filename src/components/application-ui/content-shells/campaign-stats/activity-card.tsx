'use client';

import { panelDivider } from '@/components/application-ui/content-shells/store-managment/panel-kit';
import { alpha, Box, Stack, Tooltip, Typography, useTheme } from '@mui/material';
import { money, num, pct } from './constants';
import type { RcsMetrics } from './rcs-pilot-card';
import { AutoGrid, soft, StatsCard } from './ui';

function ActivityTile({ label, value, unit, hint }: { label: string; value: string; unit?: string; hint: string }) {
  const theme = useTheme();
  return (
    <Stack
      gap={0.25}
      sx={{ bgcolor: soft(theme), borderRadius: 3, px: 2, py: 1.75 }}
    >
      <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>{label}</Typography>
      <Typography sx={{ fontSize: 20, fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>
        {value}{' '}
        {unit && (
          <Box
            component="span"
            sx={{ fontSize: 13, fontWeight: 600, color: 'text.secondary' }}
          >
            {unit}
          </Box>
        )}
      </Typography>
      <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>{hint}</Typography>
    </Stack>
  );
}

type Row = { name: string; quantity: number; price?: number | string; uniqueCustomers: number };

function ProductsTable({ title, rows }: { title: string; rows: Row[] }) {
  const theme = useTheme();
  const line = panelDivider(theme);
  if (!rows.length) return null;
  const priceOf = (p?: number | string) => {
    const n = typeof p === 'string' ? Number(String(p).replace(/[^0-9.]/g, '')) : p;
    return n != null && Number.isFinite(n) && n > 0 ? money(n) : '—';
  };
  return (
    <Stack gap={1}>
      <Typography sx={{ fontSize: 13, fontWeight: 600, color: 'text.secondary' }}>{title}</Typography>
      <Box sx={{ overflowX: 'auto' }}>
        <Box
          component="table"
          sx={{ width: '100%', minWidth: 420, borderCollapse: 'collapse', fontSize: 13, fontVariantNumeric: 'tabular-nums' }}
        >
          <thead>
            <Box
              component="tr"
              sx={{ '& th': { textAlign: 'left', fontSize: 12, fontWeight: 600, color: 'text.secondary', pb: 1, borderBottom: `1px solid ${line}` } }}
            >
              <th>Producto</th>
              <Box
                component="th"
                sx={{ textAlign: 'right !important' }}
              >
                Cantidad
              </Box>
              <Box
                component="th"
                sx={{ textAlign: 'right !important' }}
              >
                Clientes
              </Box>
              <Box
                component="th"
                sx={{ textAlign: 'right !important' }}
              >
                Precio
              </Box>
            </Box>
          </thead>
          <tbody>
            {rows.map((p) => (
              <Box
                component="tr"
                key={p.name}
                sx={{ '& td': { py: 1.25, borderBottom: `1px solid ${line}` } }}
              >
                <Box
                  component="td"
                  sx={{ fontWeight: 600 }}
                >
                  {p.name}
                </Box>
                <Box
                  component="td"
                  sx={{ textAlign: 'right' }}
                >
                  {num(p.quantity)}
                </Box>
                <Box
                  component="td"
                  sx={{ textAlign: 'right' }}
                >
                  {num(p.uniqueCustomers)}
                </Box>
                <Box
                  component="td"
                  sx={{ textAlign: 'right', color: 'text.secondary' }}
                >
                  {priceOf(p.price)}
                </Box>
              </Box>
            ))}
          </tbody>
        </Box>
      </Box>
    </Stack>
  );
}

/** Barras por día: cuándo hicieron las listas después del envío. */
function ListsByDay({ days }: { days: { date: string; lists: number; validated: number }[] }) {
  const theme = useTheme();
  if (days.length < 2) return null;
  const max = Math.max(1, ...days.map((d) => d.lists));
  return (
    <Stack gap={1}>
      <Typography sx={{ fontSize: 13, fontWeight: 600, color: 'text.secondary' }}>Listas por día</Typography>
      <Stack
        direction="row"
        alignItems="flex-end"
        gap={0.5}
        sx={{ height: 72, overflowX: 'auto' }}
      >
        {days.map((d) => (
          <Tooltip
            key={d.date}
            title={`${d.date} · ${num(d.lists)} listas · ${num(d.validated)} validadas`}
          >
            <Stack
              alignItems="center"
              gap={0.5}
              sx={{ flex: '1 0 18px', minWidth: 18 }}
            >
              <Box sx={{ width: '100%', borderRadius: 1, bgcolor: alpha(theme.palette.primary.main, 0.25), height: `${Math.max(3, (d.lists / max) * 56)}px`, position: 'relative', overflow: 'hidden' }}>
                <Box sx={{ position: 'absolute', bottom: 0, left: 0, right: 0, bgcolor: 'primary.main', height: `${d.lists ? (d.validated / d.lists) * 100 : 0}%` }} />
              </Box>
              <Typography sx={{ fontSize: 10, color: 'text.secondary' }}>{d.date.slice(5)}</Typography>
            </Stack>
          </Tooltip>
        ))}
      </Stack>
    </Stack>
  );
}

export function ActivityCard({
  metrics,
  delivered,
  channels,
}: {
  metrics: RcsMetrics;
  /** Entregados de toda la campaña: base del % de clicks. */
  delivered: number;
  channels: string;
}) {
  const c = metrics.clicks;
  const e = metrics.engagement;
  const w = e.window;
  const at = e.attribution;
  const sv = e.surveys;
  const fmtDay = (iso?: string) =>
    iso ? new Date(iso).toLocaleDateString('es-US', { day: 'numeric', month: 'short' }) : '';

  return (
    <StatsCard
      title="Actividad de los clientes"
      subtitle={`Qué hicieron después de recibir el mensaje ${channels}${w ? ` · del ${fmtDay(w.since)} al ${fmtDay(w.until)}` : ''}`}
    >
      <AutoGrid min={200}>
        <ActivityTile
          label="Clicks en links"
          value={num(c.clickedLinks)}
          unit="clientes"
          hint={
            c.links > 0
              ? `${pct(c.clickedLinks, delivered, 0)} de los entregados · ${num(c.totalClicks)} taps`
              : 'Esta campaña no llevaba links medibles'
          }
        />
        <ActivityTile
          label="Listas creadas"
          value={num(e.lists)}
          hint={`${num(e.listCustomers)} clientes${e.validatedLists ? ` · ${num(e.validatedLists)} validadas en caja` : ''}${e.lists && delivered ? ` · ${pct(e.listCustomers, delivered, 1)} de los entregados` : ''}`}
        />
        <ActivityTile
          label="Productos en listas"
          value={num(e.itemsInLists)}
          unit="unidades"
          hint={`${e.lists ? `${(e.itemsInLists / e.lists).toFixed(1)} por lista` : 'sin listas'}${e.estimatedSavings ? ` · ${money(e.estimatedSavings)} de ahorro estimado` : ''}`}
        />
        <ActivityTile
          label="Compras"
          value={num(e.purchases)}
          hint={`${num(e.buyers)} compradores · ${num(e.productsPurchased)} productos${e.pointsAwarded ? ` · ${num(e.pointsAwarded)} puntos` : ''}`}
        />
        {sv && (
          <ActivityTile
            label="Encuestas"
            value={num(sv.total)}
            hint={sv.total ? `${num(sv.customers)} clientes · ${num(sv.quick)} rápidas · ${num(sv.full)} completas${sv.coupons ? ` · ${num(sv.coupons)} cupones` : ''}` : 'Nadie respondió todavía'}
          />
        )}
        {e.newCustomers != null && (
          <ActivityTile
            label="Clientes nuevos"
            value={num(e.newCustomers)}
            unit="leads"
            hint="Se registraron en la tienda durante la campaña"
          />
        )}
      </AutoGrid>

      {at && e.lists > 0 && (
        <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
          Atribución: {num(at.byCampaign)} por el link de la campaña · {num(at.byClick)} de clientes que clickearon · {num(at.byStore)} de la tienda en el período
          {at.clickedCustomers ? ` · ${num(at.clickedCustomers)} clientes identificados por click` : ''}
        </Typography>
      )}

      <ListsByDay days={e.listsByDay ?? []} />

      <AutoGrid
        min={380}
        gap={2.5}
      >
        <ProductsTable
          title="Lo que agregaron a la lista"
          rows={(e.topListProducts ?? []).slice(0, 10)}
        />
        <ProductsTable
          title="Lo que compraron"
          rows={(e.topProducts ?? []).slice(0, 10)}
        />
      </AutoGrid>

      <Box
        component="details"
        sx={{ fontSize: 13, color: 'text.secondary', '& summary::-webkit-details-marker': { display: 'none' } }}
      >
        <Box
          component="summary"
          sx={{ cursor: 'pointer', color: 'primary.main', fontWeight: 600, listStyle: 'none' }}
        >
          ¿Qué significa cada métrica?
        </Box>
        <AutoGrid
          min={260}
          gap={1.25}
        >
          <Box sx={{ mt: 1.5, lineHeight: 1.5 }}>
            <strong>Clicks en links:</strong> clientes únicos que abrieron un short link de la campaña, en todos los canales.
          </Box>
          <Box sx={{ mt: { xs: 0, sm: 1.5 }, lineHeight: 1.5 }}>
            <strong>Listas, productos, encuestas y compras:</strong> lo que pasó desde el envío hasta la siguiente campaña de la tienda. Una lista cuenta si la trajo el link de esta campaña, si la hizo un cliente que clickeó, o si es de la tienda en ese período.
          </Box>
          <Box sx={{ lineHeight: 1.5 }}>
            <strong>Clientes nuevos:</strong> registros propios en la tienda durante el período (no cuenta relleno de audiencia).
          </Box>
          <Box sx={{ lineHeight: 1.5 }}>
            <strong>Vieron / tocaron (RCS):</strong> confirmación de lectura y taps de botón; sólo existen en teléfonos con RCS.
          </Box>
        </AutoGrid>
      </Box>
    </StatsCard>
  );
}
