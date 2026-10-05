'use client';

import type { CalendarEvent } from '@/services/calendar.service';
import { alpha, Box, ButtonBase, Card, Stack, Typography, useTheme } from '@mui/material';
import React, { useMemo } from 'react';
import {
  endKey,
  EVENT_TYPES,
  shortDay,
  STATUS_LABEL,
  statusColor,
  storesLine,
  timeRange,
} from './constants';

interface Props {
  events: CalendarEvent[];
  today: string;
  onOpen: (e: CalendarEvent) => void;
}

const Block = ({
  title,
  count,
  children,
}: {
  title: string;
  count?: string;
  children: React.ReactNode;
}) => (
  <Card sx={{ p: 2 }}>
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

export const CalendarSidebar = React.memo(function CalendarSidebar({
  events,
  today,
  onOpen,
}: Props) {
  const theme = useTheme();

  const upcoming = useMemo(
    () => events.filter((e) => endKey(e) >= today && e.status !== 'cancelado'),
    [events, today]
  );
  const activations = useMemo(() => events.filter((e) => e.type === 'activacion'), [events]);
  const pending = useMemo(
    () => events.filter((e) => e.status === 'por_confirmar' && endKey(e) >= today),
    [events, today]
  );

  return (
    <Stack spacing={1.75}>
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
        {upcoming.slice(0, 6).map((e) => {
          const ty = EVENT_TYPES[e.type] || EVENT_TYPES.otro;
          const sd = shortDay(e.date);
          return (
            <ButtonBase
              key={e._id}
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
              <Box
                sx={{
                  borderRadius: 1.5,
                  py: 0.5,
                  textAlign: 'center',
                  bgcolor: ty.bg,
                  color: ty.fg,
                }}
              >
                <Typography sx={{ fontSize: 16, fontWeight: 700, lineHeight: 1 }}>
                  {sd.day}
                </Typography>
                <Typography sx={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase' }}>
                  {sd.mon}
                </Typography>
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <Typography
                  noWrap
                  sx={{ fontSize: 13, fontWeight: 600 }}
                >
                  {e.title}
                </Typography>
                <Typography
                  noWrap
                  sx={{ fontSize: 12, color: 'text.secondary' }}
                >
                  {[
                    e.date === today ? 'Hoy' : sd.dow,
                    timeRange(e),
                    ty.label,
                    e.ownerName ? e.ownerName.split(' ')[0] : '',
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </Typography>
              </Box>
            </ButtonBase>
          );
        })}
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
