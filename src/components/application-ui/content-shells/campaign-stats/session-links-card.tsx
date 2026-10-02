'use client';

/**
 * "A dónde llevó el link": cuántos clientes recibieron el link directo a su panel Mi cuenta
 * (tienen nombre y correo), cuántos la portada de la tienda con la sesión iniciada (sólo
 * nombre) y cuántos un link normal. Es la regla del scheduler (loginUrlFor) aplicada a la
 * audiencia de hoy: una foto, no el registro exacto del envío.
 */
import type { SessionLinkSplit } from '@/services/campaing.service';
import { Stack, Typography, useTheme } from '@mui/material';
import { num, pct } from './constants';
import { AutoGrid, Bar, StatsCard } from './ui';

function Row({ color, title, help, value, total }: { color: string; title: string; help: string; value: number; total: number }) {
  return (
    <Stack gap={0.75}>
      <Stack direction="row" justifyContent="space-between" alignItems="baseline" gap={1}>
        <Typography sx={{ fontSize: 14, fontWeight: 700 }}>{title}</Typography>
        <Typography sx={{ fontSize: 14, fontWeight: 800, whiteSpace: 'nowrap' }}>
          {num(value)} <Typography component="span" sx={{ fontSize: 12, color: 'text.secondary' }}>· {pct(value, total)}</Typography>
        </Typography>
      </Stack>
      <Bar value={total ? (value / total) * 100 : 0} color={color} />
      <Typography sx={{ fontSize: 12.5, color: 'text.secondary' }}>{help}</Typography>
    </Stack>
  );
}

export function SessionLinksCard({ data }: { data: SessionLinkSplit }) {
  const theme = useTheme();
  return (
    <StatsCard
      title="A dónde llevó el link"
      subtitle="Cada cliente recibió el link según lo que sabemos de él"
    >
      <AutoGrid min={220} gap={2.5}>
        <Row
          color={theme.palette.success.main}
          title="A su panel Mi cuenta"
          help="Tienen nombre y correo: el link abre su dashboard con la sesión ya iniciada."
          value={data.dashboard}
          total={data.total}
        />
        <Row
          color={theme.palette.primary.main}
          title="A la tienda, con sesión"
          help="Sólo tienen nombre: abren la portada ya identificados y ahí se les pide el correo."
          value={data.linktree}
          total={data.total}
        />
        <Row
          color={theme.palette.text.disabled}
          title="Link normal"
          help="Sin nombre usable: reciben el SMS de siempre, sin sesión personal."
          value={data.plain}
          total={data.total}
        />
      </AutoGrid>
      <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
        Calculado sobre la audiencia actual de la tienda ({num(data.total)} clientes) con la misma regla del envío.
      </Typography>
    </StatsCard>
  );
}
