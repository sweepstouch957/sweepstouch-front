'use client';

import type { CalendarEvent } from '@/services/calendar.service';
import { alpha, Box, Button, ButtonBase, Stack, Typography, useTheme } from '@mui/material';
import React, { useMemo } from 'react';
import {
  endKey,
  EVENT_TYPES,
  MONTHS,
  pad,
  shortDay,
  STATUS_LABEL,
  statusColor,
  storesLine,
  timeRange,
} from './constants';

interface Props {
  year: number;
  events: CalendarEvent[];
  today: string;
  showPast: boolean;
  onTogglePast: () => void;
  onOpen: (e: CalendarEvent) => void;
}

export const AgendaView = React.memo(function AgendaView({
  year,
  events,
  today,
  showPast,
  onTogglePast,
  onOpen,
}: Props) {
  const theme = useTheme();

  const groups = useMemo(() => {
    const list = events.filter((e) => showPast || endKey(e) >= today);
    return MONTHS.map((title, mi) => ({
      title: `${title} ${year}`,
      items: list.filter((e) => e.date.startsWith(`${year}-${pad(mi + 1)}`)),
    })).filter((g) => g.items.length);
  }, [events, showPast, today, year]);

  return (
    <Stack spacing={2.25}>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        flexWrap="wrap"
        gap={1}
      >
        <Typography
          variant="h5"
          fontWeight={700}
        >
          Agenda
        </Typography>
        <Button
          size="small"
          variant="outlined"
          color="inherit"
          onClick={onTogglePast}
          sx={{ borderRadius: 999 }}
        >
          {showPast ? 'Ocultar pasados' : 'Mostrar pasados'}
        </Button>
      </Stack>
      {groups.length === 0 && (
        <Typography sx={{ py: 4, textAlign: 'center', color: 'text.secondary' }}>
          No hay eventos que coincidan.
        </Typography>
      )}
      {groups.map((g) => (
        <Stack key={g.title}>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="baseline"
            sx={{ pb: 1, borderBottom: 2, borderColor: 'text.primary' }}
          >
            <Typography sx={{ fontSize: 15, fontWeight: 700 }}>{g.title}</Typography>
            <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
              {g.items.length === 1 ? '1 evento' : `${g.items.length} eventos`}
            </Typography>
          </Stack>
          {g.items.map((e) => {
            const ty = EVENT_TYPES[e.type] || EVENT_TYPES.otro;
            const past = endKey(e) < today;
            const cancelled = e.status === 'cancelado';
            const sd = shortDay(e.date);
            const multi = endKey(e) > e.date;
            const sub = [
              timeRange(e),
              multi
                ? `hasta ${shortDay(e.endDate).day} ${shortDay(e.endDate).mon.toLowerCase()}`
                : '',
              ty.label,
              storesLine(e),
              e.ownerName ? `lleva ${e.ownerName.split(' ')[0]}` : '',
            ]
              .filter(Boolean)
              .join(' · ');
            const tag =
              e.status !== 'confirmado'
                ? STATUS_LABEL[e.status]
                : e.date === today
                  ? 'Hoy'
                  : e.source !== 'event'
                    ? e.source === 'task'
                      ? 'Cowork'
                      : 'Soporte'
                    : '';
            return (
              <ButtonBase
                key={e._id}
                onClick={() => onOpen(e)}
                sx={{
                  display: 'grid',
                  gridTemplateColumns: '56px 12px minmax(0,1fr) auto',
                  gap: 1.5,
                  alignItems: 'center',
                  textAlign: 'left',
                  borderBottom: 1,
                  borderColor: 'divider',
                  px: 0.5,
                  py: 1.25,
                  opacity: past || cancelled ? 0.55 : 1,
                  '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.05) },
                }}
              >
                <Box sx={{ lineHeight: 1.1 }}>
                  <Typography sx={{ fontSize: 18, fontWeight: 700 }}>{sd.day}</Typography>
                  <Typography
                    sx={{
                      fontSize: 11,
                      color: 'text.secondary',
                      textTransform: 'uppercase',
                      fontWeight: 600,
                    }}
                  >
                    {sd.dow}
                  </Typography>
                </Box>
                <Box sx={{ width: 10, height: 10, borderRadius: 0.75, bgcolor: ty.bg }} />
                <Box sx={{ minWidth: 0 }}>
                  <Typography
                    sx={{
                      fontSize: 14,
                      fontWeight: 600,
                      textDecoration: cancelled ? 'line-through' : 'none',
                    }}
                  >
                    {e.title}
                  </Typography>
                  <Typography
                    noWrap
                    sx={{ fontSize: 12, color: 'text.secondary' }}
                  >
                    {sub}
                  </Typography>
                </Box>
                <Typography
                  sx={{
                    fontSize: 11,
                    fontWeight: 600,
                    whiteSpace: 'nowrap',
                    color:
                      e.status !== 'confirmado' ? statusColor(theme, e.status) : 'primary.main',
                  }}
                >
                  {tag}
                </Typography>
              </ButtonBase>
            );
          })}
        </Stack>
      ))}
    </Stack>
  );
});
