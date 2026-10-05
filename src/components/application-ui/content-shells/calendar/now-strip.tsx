'use client';

import type { CalendarEvent } from '@/services/calendar.service';
import { alpha, Box, ButtonBase, Stack, Typography, useTheme } from '@mui/material';
import React, { useMemo } from 'react';
import { endKey, eventColor, headline, isOngoing, shortDay, timeRange } from './constants';

interface Props {
  events: CalendarEvent[];
  today: string;
  onOpen: (e: CalendarEvent) => void;
}

const DAYS_AHEAD = 10;

/**
 * Lo primero que se ve al entrar: qué está pasando hoy / en curso y qué viene
 * en los próximos días. Tarjetas horizontales, deslizables en móvil.
 */
export const NowStrip = React.memo(function NowStrip({ events, today, onOpen }: Props) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const list = useMemo(() => {
    const limit = new Date(`${today}T12:00:00Z`);
    limit.setUTCDate(limit.getUTCDate() + DAYS_AHEAD);
    const until = limit.toISOString().slice(0, 10);
    return events
      .filter((e) => e.status !== 'cancelado' && endKey(e) >= today && e.date <= until)
      .sort((a, b) => {
        const oa = isOngoing(a, today) ? 0 : 1;
        const ob = isOngoing(b, today) ? 0 : 1;
        return oa - ob || (a.date < b.date ? -1 : a.date > b.date ? 1 : 0);
      })
      .slice(0, 12);
  }, [events, today]);

  if (!list.length) return null;

  return (
    <Box sx={{ mb: 2.5 }}>
      <Stack
        direction="row"
        alignItems="baseline"
        spacing={1}
        sx={{ mb: 1 }}
      >
        <Typography sx={{ fontSize: 13, fontWeight: 700 }}>
          Ahora y próximos {DAYS_AHEAD} días
        </Typography>
        <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
          {list.length} actividades
        </Typography>
      </Stack>
      <Box
        sx={{
          display: 'flex',
          gap: 1.25,
          overflowX: 'auto',
          pb: 0.5,
          scrollSnapType: 'x proximity',
          '&::-webkit-scrollbar': { height: 6 },
        }}
      >
        {list.map((e) => {
          const ty = eventColor(e);
          const ongoing = isOngoing(e, today);
          const multi = endKey(e) > e.date;
          const sd = shortDay(e.date);
          const { primary, secondary } = headline(e);
          const when = ongoing
            ? multi
              ? `En curso · hasta ${shortDay(endKey(e)).day} ${shortDay(
                  endKey(e)
                ).mon.toLowerCase()}`
              : 'Hoy'
            : `${sd.dow} ${sd.day} ${sd.mon.toLowerCase()}`;
          return (
            <ButtonBase
              key={e._id}
              onClick={() => onOpen(e)}
              sx={{
                flex: '0 0 auto',
                width: 230,
                scrollSnapAlign: 'start',
                textAlign: 'left',
                alignItems: 'stretch',
                flexDirection: 'column',
                borderRadius: 2.5,
                border: 1,
                borderColor: ongoing ? ty.bg : 'divider',
                bgcolor: ongoing ? alpha(ty.bg, isDark ? 0.18 : 0.08) : 'background.paper',
                p: 1.5,
                '&:hover': { borderColor: ty.bg },
              }}
            >
              <Stack
                direction="row"
                alignItems="center"
                spacing={0.75}
                sx={{ mb: 0.75 }}
              >
                <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: ty.bg }} />
                <Typography
                  sx={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: ongoing ? ty.bg : 'text.secondary',
                    textTransform: 'uppercase',
                    letterSpacing: '.04em',
                  }}
                  noWrap
                >
                  {when}
                </Typography>
              </Stack>
              <Typography
                noWrap
                sx={{ fontSize: 14, fontWeight: 700 }}
              >
                {primary}
              </Typography>
              <Typography
                noWrap
                sx={{ fontSize: 12, color: 'text.secondary' }}
              >
                {[secondary, timeRange(e), ty.label, e.ownerName ? e.ownerName.split(' ')[0] : '']
                  .filter(Boolean)
                  .join(' · ')}
              </Typography>
            </ButtonBase>
          );
        })}
      </Box>
    </Box>
  );
});
