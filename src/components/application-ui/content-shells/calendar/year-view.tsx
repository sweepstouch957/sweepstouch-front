'use client';

import type { CalendarEvent } from '@/services/calendar.service';
import { alpha, Box, ButtonBase, Stack, Typography, useTheme } from '@mui/material';
import React, { useMemo } from 'react';
import { DOW, EVENT_TYPES, MONTHS, pad, spansDay } from './constants';

interface Props {
  year: number;
  events: CalendarEvent[];
  today: string;
  onGoMonth: (m: number) => void;
}

export const YearView = React.memo(function YearView({ year, events, today, onGoMonth }: Props) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const months = useMemo(
    () =>
      MONTHS.map((title, mi) => {
        const s0 = new Date(year, mi, 1).getDay();
        const n = new Date(year, mi + 1, 0).getDate();
        const days: {
          key: string;
          num: number | '';
          first: CalendarEvent | null;
          tip: string;
          isToday: boolean;
        }[] = [];
        for (let i = 0; i < s0; i++)
          days.push({ key: `pad-${i}`, num: '', first: null, tip: '', isToday: false });
        for (let dd = 1; dd <= n; dd++) {
          const key = `${year}-${pad(mi + 1)}-${pad(dd)}`;
          const list = events.filter((e) => spansDay(e, key));
          days.push({
            key,
            num: dd,
            first: list[0] || null,
            tip: list.map((e) => e.title).join(' · '),
            isToday: key === today,
          });
        }
        const count = events.filter((e) => e.date.startsWith(`${year}-${pad(mi + 1)}`)).length;
        return { title, days, count };
      }),
    [events, year, today]
  );

  return (
    <Stack spacing={1.75}>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="baseline"
        flexWrap="wrap"
        gap={1}
      >
        <Typography
          variant="h5"
          fontWeight={700}
        >
          {year} completo
        </Typography>
        <Typography
          variant="body2"
          color="text.secondary"
        >
          {events.length} eventos · clic en un día para ver el mes
        </Typography>
      </Stack>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))',
          gap: '18px 16px',
        }}
      >
        {months.map((m, mi) => (
          <Stack
            key={m.title}
            spacing={0.75}
          >
            <ButtonBase
              onClick={() => onGoMonth(mi)}
              sx={{ justifyContent: 'space-between', px: 0, borderRadius: 1 }}
            >
              <Typography sx={{ fontSize: 14, fontWeight: 700 }}>{m.title}</Typography>
              <Typography
                sx={{ fontSize: 11, color: 'text.secondary', fontVariantNumeric: 'tabular-nums' }}
              >
                {m.count || ''}
              </Typography>
            </ButtonBase>
            <Box
              sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0,1fr))', gap: '2px' }}
            >
              {DOW.map((d) => (
                <Typography
                  key={d}
                  sx={{ fontSize: 9, fontWeight: 600, color: 'text.disabled', textAlign: 'center' }}
                >
                  {d[0]}
                </Typography>
              ))}
              {m.days.map((d) => (
                <ButtonBase
                  key={d.key}
                  disabled={d.num === ''}
                  title={d.tip}
                  onClick={() => onGoMonth(mi)}
                  sx={{
                    aspectRatio: '1',
                    borderRadius: 1,
                    fontSize: 10,
                    fontWeight: 500,
                    bgcolor: d.first
                      ? (EVENT_TYPES[d.first.type] || EVENT_TYPES.otro).bg
                      : d.num === ''
                        ? 'transparent'
                        : d.isToday
                          ? alpha(theme.palette.primary.main, 0.18)
                          : alpha(theme.palette.text.primary, isDark ? 0.06 : 0.04),
                    color: d.first
                      ? (EVENT_TYPES[d.first.type] || EVENT_TYPES.otro).fg
                      : 'text.primary',
                    outline: d.isToday ? `2px solid ${theme.palette.text.primary}` : 'none',
                    outlineOffset: -1,
                  }}
                >
                  {d.num}
                </ButtonBase>
              ))}
            </Box>
          </Stack>
        ))}
      </Box>
    </Stack>
  );
});
