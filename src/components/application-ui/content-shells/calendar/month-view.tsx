'use client';

import type { CalendarEvent } from '@/services/calendar.service';
import ChevronLeftRoundedIcon from '@mui/icons-material/ChevronLeftRounded';
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';
import { alpha, Box, ButtonBase, IconButton, Stack, Typography, useTheme } from '@mui/material';
import React, { useMemo } from 'react';
import {
  DOW,
  endKey,
  EVENT_TYPES,
  isoKey,
  MONTHS,
  pad,
  seasonOf,
  SEASONS,
  spansDay,
  TYPE_KEYS,
} from './constants';

interface Props {
  year: number;
  month: number; // 0-11
  events: CalendarEvent[];
  today: string;
  onPickMonth: (m: number) => void;
  onPrev: () => void;
  onNext: () => void;
  onAddAt: (key: string) => void;
  onOpen: (e: CalendarEvent) => void;
  /** Tinte pastel por estación en cada día. */
  seasons?: boolean;
}

export const MonthView = React.memo(function MonthView({
  year,
  month,
  events,
  today,
  onPickMonth,
  onPrev,
  onNext,
  onAddAt,
  onOpen,
  seasons = false,
}: Props) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const seasonBg = (key: string) => alpha(SEASONS[seasonOf(key)].color, isDark ? 0.16 : 0.22);

  const counts = useMemo(
    () =>
      MONTHS.map((_, i) => events.filter((e) => e.date.startsWith(`${year}-${pad(i + 1)}`)).length),
    [events, year]
  );
  const maxC = Math.max(1, ...counts);

  const cells = useMemo(() => {
    const first = new Date(year, month, 1);
    const start = first.getDay();
    const dim = new Date(year, month + 1, 0).getDate();
    const total = Math.ceil((start + dim) / 7) * 7;
    const out: {
      key: string;
      num: number;
      inMonth: boolean;
      isToday: boolean;
      list: CalendarEvent[];
    }[] = [];
    for (let i = 0; i < total; i++) {
      const d = new Date(year, month, 1 - start + i);
      const key = isoKey(d);
      const inMonth = d.getMonth() === month;
      out.push({
        key,
        num: d.getDate(),
        inMonth,
        isToday: key === today,
        list: inMonth ? events.filter((e) => spansDay(e, key)) : [],
      });
    }
    return out;
  }, [year, month, events, today]);

  const monthCount = counts[month];

  return (
    <Stack spacing={1.75}>
      {/* Tira de meses con barritas */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(12, minmax(0,1fr))', gap: 0.5 }}>
        {MONTHS.map((l, i) => {
          const on = i === month;
          return (
            <ButtonBase
              key={l}
              onClick={() => onPickMonth(i)}
              sx={{
                borderRadius: 1.5,
                p: '6px 2px 5px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 0.5,
                bgcolor: on
                  ? alpha(theme.palette.primary.main, isDark ? 0.18 : 0.1)
                  : 'transparent',
                '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.08) },
              }}
            >
              <Box
                sx={{
                  height: 28,
                  width: '100%',
                  display: 'flex',
                  alignItems: 'flex-end',
                  justifyContent: 'center',
                }}
              >
                <Box
                  sx={{
                    width: 14,
                    borderRadius: '3px 3px 0 0',
                    height: `${Math.max(3, Math.round((counts[i] / maxC) * 28))}px`,
                    bgcolor: on ? 'primary.main' : alpha(theme.palette.primary.main, 0.3),
                  }}
                />
              </Box>
              <Typography
                sx={{ fontSize: 11, fontWeight: 600, color: on ? 'primary.main' : 'text.primary' }}
              >
                {l.slice(0, 3)}
              </Typography>
              <Typography
                sx={{ fontSize: 10, color: 'text.secondary', fontVariantNumeric: 'tabular-nums' }}
              >
                {counts[i]}
              </Typography>
            </ButtonBase>
          );
        })}
      </Box>

      {/* Navegación */}
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        flexWrap="wrap"
        gap={1}
      >
        <Stack
          direction="row"
          alignItems="center"
          spacing={1}
        >
          <IconButton
            size="small"
            onClick={onPrev}
            sx={{ border: 1, borderColor: 'divider', borderRadius: 2 }}
          >
            <ChevronLeftRoundedIcon fontSize="small" />
          </IconButton>
          <Typography
            variant="h5"
            sx={{ minWidth: 190, textAlign: 'center', fontWeight: 700 }}
          >
            {MONTHS[month]} {year}
          </Typography>
          <IconButton
            size="small"
            onClick={onNext}
            sx={{ border: 1, borderColor: 'divider', borderRadius: 2 }}
          >
            <ChevronRightRoundedIcon fontSize="small" />
          </IconButton>
        </Stack>
        <Typography
          variant="body2"
          color="text.secondary"
        >
          {monthCount === 1 ? '1 evento este mes' : `${monthCount} eventos este mes`} · clic en un
          día para agregar
        </Typography>
      </Stack>

      {/* Grilla */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0,1fr))', gap: 0.75 }}>
        {DOW.map((d) => (
          <Typography
            key={d}
            sx={{
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: '.06em',
              textTransform: 'uppercase',
              color: 'text.secondary',
              textAlign: 'center',
              py: 0.25,
            }}
          >
            {d}
          </Typography>
        ))}
        {cells.map((c) => (
          <Box
            key={c.key}
            onClick={() => c.inMonth && onAddAt(c.key)}
            title={c.inMonth ? 'Agregar evento' : undefined}
            sx={{
              minHeight: { xs: 72, md: 104 },
              borderRadius: 2,
              p: 0.75,
              display: 'flex',
              flexDirection: 'column',
              gap: 0.375,
              minWidth: 0,
              cursor: c.inMonth ? 'pointer' : 'default',
              bgcolor: c.inMonth
                ? c.isToday
                  ? alpha(theme.palette.primary.main, isDark ? 0.14 : 0.06)
                  : seasons
                    ? seasonBg(c.key)
                    : 'background.paper'
                : alpha(theme.palette.text.primary, isDark ? 0.04 : 0.025),
              border: c.isToday
                ? `2px solid ${theme.palette.primary.main}`
                : `1px solid ${theme.palette.divider}`,
              '&:hover': c.inMonth
                ? { boxShadow: `inset 0 0 0 1px ${theme.palette.primary.main}` }
                : {},
            }}
          >
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
            >
              <Typography
                sx={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: c.inMonth ? 'text.primary' : 'text.disabled',
                }}
              >
                {c.num}
              </Typography>
              {c.isToday && (
                <Typography sx={{ fontSize: 10, fontWeight: 600, color: 'primary.main' }}>
                  Hoy
                </Typography>
              )}
            </Stack>
            {c.list.slice(0, 3).map((e) => {
              const ty = EVENT_TYPES[e.type] || EVENT_TYPES.otro;
              const cancelled = e.status === 'cancelado';
              const multi = endKey(e) > e.date;
              return (
                <ButtonBase
                  key={e._id}
                  onClick={(ev) => {
                    ev.stopPropagation();
                    onOpen(e);
                  }}
                  title={e.title}
                  sx={{
                    display: 'block',
                    width: '100%',
                    textAlign: 'left',
                    fontSize: 11,
                    lineHeight: 1.2,
                    fontWeight: 600,
                    px: 0.75,
                    py: 0.375,
                    borderRadius: 1,
                    bgcolor: ty.bg,
                    color: ty.fg,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    opacity: cancelled ? 0.5 : 1,
                    textDecoration: cancelled ? 'line-through' : 'none',
                    outline: e.source !== 'event' ? `2px dashed ${alpha(ty.fg, 0.85)}` : 'none',
                    outlineOffset: -2,
                    ...(multi && c.key !== e.date
                      ? { borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }
                      : {}),
                  }}
                >
                  {e.startTime ? `${e.startTime} ` : ''}
                  {e.title}
                </ButtonBase>
              );
            })}
            {c.list.length > 3 && (
              <Typography sx={{ fontSize: 10, fontWeight: 600, color: 'text.secondary', pl: 0.25 }}>
                +{c.list.length - 3} más
              </Typography>
            )}
          </Box>
        ))}
      </Box>

      {/* Leyenda */}
      <Stack
        direction="row"
        flexWrap="wrap"
        gap={1.75}
        sx={{ pt: 1, borderTop: 1, borderColor: 'divider', fontSize: 12, color: 'text.secondary' }}
      >
        {TYPE_KEYS.map((k) => (
          <Stack
            key={k}
            direction="row"
            alignItems="center"
            spacing={0.75}
            sx={{ pt: 1 }}
          >
            <Box sx={{ width: 10, height: 10, borderRadius: 0.75, bgcolor: EVENT_TYPES[k].bg }} />
            <Typography variant="caption">{EVENT_TYPES[k].label}</Typography>
          </Stack>
        ))}
        <Stack
          direction="row"
          alignItems="center"
          spacing={0.75}
          sx={{ pt: 1 }}
        >
          <Box
            sx={{
              width: 10,
              height: 10,
              borderRadius: 0.75,
              border: `2px dashed ${theme.palette.text.primary}`,
            }}
          />
          <Typography variant="caption">Tarea de Cowork / visita de soporte</Typography>
        </Stack>
        {seasons &&
          (Object.keys(SEASONS) as (keyof typeof SEASONS)[]).map((k) => (
            <Stack
              key={k}
              direction="row"
              alignItems="center"
              spacing={0.75}
              sx={{ pt: 1 }}
            >
              <Box
                sx={{
                  width: 10,
                  height: 10,
                  borderRadius: 0.75,
                  bgcolor: seasonBg(
                    `2026-${{ invierno: '01', primavera: '04', verano: '07', otono: '10' }[k]}-01`
                  ),
                }}
              />
              <Typography variant="caption">
                {SEASONS[k].emoji} {SEASONS[k].label}
              </Typography>
            </Stack>
          ))}
      </Stack>
    </Stack>
  );
});
