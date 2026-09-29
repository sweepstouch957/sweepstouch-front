'use client';

import { panelDivider } from '@/components/application-ui/content-shells/store-managment/panel-kit';
import { Box, Stack, Typography, useTheme } from '@mui/material';
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
  const theme = useTheme();
  const c = metrics.clicks;
  const e = metrics.engagement;
  const line = panelDivider(theme);
  const top = (e.topProducts ?? []).slice(0, 8);

  return (
    <StatsCard
      title="Actividad de los clientes"
      subtitle={`Qué hicieron después de recibir el mensaje ${channels}`}
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
          hint={`${num(e.itemsInLists)} productos agregados${e.validatedLists ? ` · ${num(e.validatedLists)} validadas` : ''}`}
        />
        <ActivityTile
          label="Compras"
          value={num(e.purchases)}
          hint={`${num(e.buyers)} compradores · ${num(e.productsPurchased)} productos${e.pointsAwarded ? ` · ${num(e.pointsAwarded)} puntos` : ''}`}
        />
      </AutoGrid>

      {top.length > 0 && (
        <Stack gap={1}>
          <Typography sx={{ fontSize: 13, fontWeight: 600, color: 'text.secondary' }}>Lo que compraron</Typography>
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
                  <Box component="th"
sx={{ textAlign: 'right !important' }}>Cantidad</Box>
                  <Box component="th"
sx={{ textAlign: 'right !important' }}>Clientes</Box>
                  <Box component="th"
sx={{ textAlign: 'right !important' }}>Precio</Box>
                </Box>
              </thead>
              <tbody>
                {top.map((p) => (
                  <Box
                    component="tr"
                    key={p.name}
                    sx={{ '& td': { py: 1.25, borderBottom: `1px solid ${line}` } }}
                  >
                    <Box component="td"
sx={{ fontWeight: 600 }}>{p.name}</Box>
                    <Box component="td"
sx={{ textAlign: 'right' }}>{num(p.quantity)}</Box>
                    <Box component="td"
sx={{ textAlign: 'right' }}>{num(p.uniqueCustomers)}</Box>
                    <Box component="td"
sx={{ textAlign: 'right', color: 'text.secondary' }}>
                      {p.price != null ? money(p.price) : '—'}
                    </Box>
                  </Box>
                ))}
              </tbody>
            </Box>
          </Box>
        </Stack>
      )}

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
            <strong>Listas y compras:</strong> actividad de quienes clickearon un link, desde el inicio de la campaña.
          </Box>
          <Box sx={{ lineHeight: 1.5 }}>
            <strong>Vieron el mensaje (RCS):</strong> confirmación de lectura; sólo existe en teléfonos con RCS.
          </Box>
          <Box sx={{ lineHeight: 1.5 }}>
            <strong>Tocaron un botón (RCS):</strong> clientes que tocaron un botón del RCS. El CTR va sobre RCS entregados.
          </Box>
        </AutoGrid>
      </Box>
    </StatsCard>
  );
}
