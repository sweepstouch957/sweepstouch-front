'use client';

import type { CalendarEvent } from '@/services/calendar.service';
import { alpha, Box, ButtonBase, Card, Stack, Typography, useTheme } from '@mui/material';
import React, { useMemo } from 'react';
import {
  endKey,
  EVENT_TYPES,
  headline,
  isOngoing,
  shortDay,
  STATUS_LABEL,
  statusColor,
  storesLine,
  timeRange,
  eventColor,
} from './constants';

interface Props {
  events: CalendarEvent[];
  today: string;
  onOpen: (e: CalendarEvent) => void;
}

const Block = ({
  title,
  count,
  accent,
  children,
}: {
  title: string;
  count?: string;
  accent?: boolean;
  children: React.ReactNode;
}) => (
  <Card sx={{ p: 2, ...(accent ? { borderColor: 'primary.main' } : {}) }}>
    <Stack
      direction="row"
      justifyContent="space-between"
      alignItems="center"
      sx={{ mb: 1 }}
    >
      <Typography sx={{ fontSize: 15, fontWeight: 700 }}>{title}</Typography>
      {count && (
        <Typography
          sx={{ fontSize: 12, color: 'text.secondary', fontVariantNumeric: 'tabular-nums' }}
        >
          {count}
        </Typography>
      )}
    </Stack>
    <Stack spacing={0.25}>{children}</Stack>
  </Card>
);

/** Fila con la fecha en un cuadrito del color del tipo. */
function Row({
  e,
  today,
  onOpen,
}: {
  e: CalendarEvent;
  today: string;
  onOpen: (e: CalendarEvent) => void;
}) {
  const theme = useTheme();
  const ty = eventColor(e);
  const sd = shortDay(e.date);
  const { primary, secondary } = headline(e);
  const multi = endKey(e) > e.date;
  const when = isOngoing(e, today)
    ? multi
      ? `En curso · hasta ${shortDay(endKey(e)).day} ${shortDay(endKey(e)).mon.toLowerCase()}`
      : 'Hoy'
    : sd.dow;
  return (
    <ButtonBase
      onClick={() => onOpen(e)}
      sx={{
        display: 'grid',
        gridTemplateColumns: '44px minmax(0,1fr)',
        gap: 1.25,
        alignItems: 'center',
        textAlign: 'left',
        p: '7px 4px',
        borderRadius: 1.5,
        '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.08) },
      }}
    >
      <Box sx={{ borderRadius: 1.5, py: 0.5, textAlign: 'center', bgcolor: ty.bg, color: ty.fg }}>
        <Typography sx={{ fontSize: 16, fontWeight: 700, lineHeight: 1 }}>{sd.day}</Typography>
        <Typography sx={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase' }}>
          {sd.mon}
        </Typography>
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography
          noWrap
          sx={{ fontSize: 13, fontWeight: 600 }}
        >
          {primary}
        </Typography>
        <Typography
          noWrap
          sx={{ fontSize: 12, color: 'text.secondary' }}
        >
          {[secondary, when, timeRange(e), ty.label, e.ownerName ? e.ownerName.split(' ')[0] : '']
            .filter(Boolean)
            .join(' · ')}
        </Typography>
      </Box>
    </ButtonBase>
  );
}

export const CalendarSidebar = React.memo(function CalendarSidebar({
  events,
  today,
  onOpen,
}: Props) {
  const theme = useTheme();

  const live = events.filter((e) => e.status !== 'cancelado');
  const ongoing = useMemo(() => live.filter((e) => isOngoing(e, today)), [live, today]);
  const upcoming = useMemo(() => live.filter((e) => e.date > today), [live, today]);
  const activations = useMemo(() => events.filter((e) => e.type === 'activacion'), [events]);
  const pending = useMemo(
    () => events.filter((e) => e.status === 'por_confirmar' && endKey(e) >= today),
    [events, today]
  );

  return (
    <Stack spacing={1.75}>
      {ongoing.length > 0 && (
        <Block
          title="Hoy y en curso"
          count={`${ongoing.length}`}
          accent
        >
          {ongoing.map((e) => (
            <Row
              key={e._id}
              e={e}
              today={today}
              onOpen={onOpen}
            />
          ))}
        </Block>
      )}

      <Block
        title="Próximos eventos"
        count={`${upcoming.length} restantes`}
      >
        {upcoming.length === 0 && (
          <Typography
            variant="body2"
            color="text.secondary"
          >
            Nada agendado. Agrega el primero con “+ Nuevo evento”.
          </Typography>
        )}
        {upcoming.slice(0, 6).map((e) => (
          <Row
            key={e._id}
            e={e}
            today={today}
            onOpen={onOpen}
          />
        ))}
      </Block>

      <Block title="Activaciones con apoyo Sweepstouch">
        {activations.length === 0 && (
          <Typography
            variant="body2"
            color="text.secondary"
          >
            Sin activaciones este año.
          </Typography>
        )}
        {activations.map((e) => {
          const past = endKey(e) < today;
          const st =
            e.status === 'cancelado'
              ? 'Cancelado'
              : e.status === 'finalizado' || past
                ? 'Finalizado'
                : isOngoing(e, today)
                  ? 'En curso'
                  : STATUS_LABEL[e.status];
          const col =
            e.status === 'cancelado'
              ? theme.palette.error.main
              : past || e.status === 'finalizado'
                ? theme.palette.text.secondary
                : EVENT_TYPES.activacion.bg;
          const sd = shortDay(e.date);
          return (
            <ButtonBase
              key={e._id}
              onClick={() => onOpen(e)}
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'stretch',
                textAlign: 'left',
                borderLeft: `3px solid ${EVENT_TYPES.activacion.bg}`,
                bgcolor: alpha(EVENT_TYPES.activacion.bg, 0.08),
                px: 1.25,
                py: 1,
                borderRadius: '0 6px 6px 0',
                mb: 0.75,
              }}
            >
              <Stack
                direction="row"
                justifyContent="space-between"
                gap={1}
              >
                <Typography sx={{ fontSize: 13, fontWeight: 600 }}>{e.title}</Typography>
                <Typography
                  sx={{ fontSize: 11, fontWeight: 600, color: col, whiteSpace: 'nowrap' }}
                >
                  {st}
                </Typography>
              </Stack>
              <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
                {sd.day} {sd.mon.toLowerCase()} · {storesLine(e) || 'sin tienda'}
              </Typography>
            </ButtonBase>
          );
        })}
      </Block>

      <Block title="Por confirmar">
        {pending.length === 0 && (
          <Typography
            variant="body2"
            color="text.secondary"
          >
            Todo lo que viene está confirmado.
          </Typography>
        )}
        {pending.map((e) => (
          <ButtonBase
            key={e._id}
            onClick={() => onOpen(e)}
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              textAlign: 'left',
              py: 1,
              borderTop: 1,
              borderColor: 'divider',
            }}
          >
            <Typography sx={{ fontSize: 13, fontWeight: 600 }}>{e.title}</Typography>
            {e.stores[0]?.storeAddress && (
              <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
                {e.stores[0].storeAddress}
              </Typography>
            )}
            <Typography
              sx={{ fontSize: 12, fontWeight: 600, color: statusColor(theme, 'por_confirmar') }}
            >
              {shortDay(e.date).day} {shortDay(e.date).mon.toLowerCase()}
              {e.description ? ` · ${e.description.slice(0, 60)}` : ''}
            </Typography>
          </ButtonBase>
        ))}
      </Block>
    </Stack>
  );
});
