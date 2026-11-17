'use client';

/**
 * Vigencia en la cabecera de Productos: qué rige hoy y qué viene, con fechas. La vigencia la
 * manejan los agentes: cuando algo vence, sus productos se ocultan solos.
 */
import type { Circular } from '@/services/circular';
import EventAvailableRoundedIcon from '@mui/icons-material/EventAvailableRounded';
import UpdateRoundedIcon from '@mui/icons-material/UpdateRounded';
import { alpha, Box, Stack, Tooltip, Typography } from '@mui/material';
import { isFlyer } from '../domain/circulars';

const fmt = new Intl.DateTimeFormat('es', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  timeZone: 'America/New_York',
});
const range = (c: Circular) =>
  `${fmt.format(new Date(c.startDate))} → ${fmt.format(new Date(c.endDate))}`;
const what = (c: Circular) => (isFlyer(c) ? 'Flyer' : 'Circular');
const clean = (t?: string) => String(t || '').replace(/^(Flyer de campaña|Campaña):\s*/i, '');

function Row({
  tone,
  icon,
  label,
  c,
}: {
  tone: 'success' | 'info';
  icon: React.ReactNode;
  label: string;
  c: Circular;
}) {
  return (
    <Box
      sx={{
        flex: '1 1 260px',
        minWidth: 0,
        px: 1.5,
        py: 1,
        borderRadius: 2,
        bgcolor: (t) => alpha(t.palette[tone].main, 0.08),
        border: (t) => `1px solid ${alpha(t.palette[tone].main, 0.25)}`,
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        gap={0.75}
        sx={{ color: `${tone}.main` }}
      >
        {icon}
        <Typography
          variant="caption"
          fontWeight={800}
          sx={{ letterSpacing: 0.4, textTransform: 'uppercase' }}
        >
          {label} · {what(c)}
        </Typography>
      </Stack>
      <Typography
        fontWeight={700}
        noWrap
      >
        {clean(c.title)}
      </Typography>
      <Typography
        variant="body2"
        color="text.secondary"
      >
        {range(c)}
      </Typography>
    </Box>
  );
}

export function ValidityBar({
  current,
  next,
}: {
  current: Circular | null;
  next: Circular | null;
}) {
  return (
    <Tooltip
      placement="top-start"
      title="La vigencia la manejan los agentes: cuando una fecha vence, esos productos se ocultan solos de las listas. Tú sólo revisas y publicas."
    >
      <Stack
        direction="row"
        flexWrap="wrap"
        gap={1}
      >
        {current ? (
          <Row
            tone="success"
            icon={<EventAvailableRoundedIcon fontSize="small" />}
            label="Vigente ahora"
            c={current}
          />
        ) : (
          <Box
            sx={{
              flex: '1 1 260px',
              px: 1.5,
              py: 1,
              borderRadius: 2,
              border: '1px dashed',
              borderColor: 'divider',
            }}
          >
            <Typography
              variant="caption"
              fontWeight={800}
              color="text.secondary"
              sx={{ letterSpacing: 0.4, textTransform: 'uppercase' }}
            >
              Vigente ahora
            </Typography>
            <Typography fontWeight={700}>Nada vigente hoy</Typography>
            <Typography
              variant="body2"
              color="text.secondary"
            >
              Los clientes no ven ofertas hasta que entre un flyer o circular.
            </Typography>
          </Box>
        )}
        {next && (
          <Row
            tone="info"
            icon={<UpdateRoundedIcon fontSize="small" />}
            label="Próximo"
            c={next}
          />
        )}
      </Stack>
    </Tooltip>
  );
}
