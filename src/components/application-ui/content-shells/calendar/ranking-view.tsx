'use client';

import type { CalendarEvent } from '@/services/calendar.service';
import type { Store } from '@/services/store.service';
import { alpha, Box, Skeleton, Stack, Typography, useTheme } from '@mui/material';
import React, { useMemo } from 'react';
import { fmtNum, shortDay } from './constants';

interface Props {
  stores: Store[];
  loading: boolean;
  events: CalendarEvent[];
  search: string;
}

/** Tiendas por audiencia, con su aniversario y eventos del año cruzados por storeId. */
export const RankingView = React.memo(function RankingView({
  stores,
  loading,
  events,
  search,
}: Props) {
  const theme = useTheme();
  const q = search.trim().toLowerCase();

  const byStore = useMemo(() => {
    const map: Record<string, CalendarEvent[]> = {};
    for (const e of events)
      for (const s of e.stores) if (s.storeId) (map[s.storeId] ||= []).push(e);
    return map;
  }, [events]);

  const rows = useMemo(
    () =>
      stores
        .filter(
          (s) => !q || `${s.name} ${s.address} ${s.phoneNumber || ''}`.toLowerCase().includes(q)
        )
        .map((s, i) => ({ s, i, evs: byStore[s._id] || [] })),
    [stores, q, byStore]
  );
  const maxAud = Math.max(1, ...stores.map((s) => s.customerCount || 0));
  const totalAud = rows.reduce((a, r) => a + (r.s.customerCount || 0), 0);

  const head = (t: string, center = false) => (
    <Box
      sx={{
        position: 'sticky',
        top: 0,
        bgcolor: 'text.primary',
        color: 'background.paper',
        px: 1,
        py: 1.125,
        fontWeight: 600,
        fontSize: 11,
        textTransform: 'uppercase',
        letterSpacing: '.06em',
        textAlign: center ? 'center' : 'left',
        zIndex: 1,
      }}
    >
      {t}
    </Box>
  );
  const cell = (i: number, extra = {}) => ({
    px: 1,
    py: 1.125,
    borderBottom: 1,
    borderColor: 'divider',
    bgcolor: i % 2 ? alpha(theme.palette.text.primary, 0.025) : 'transparent',
    fontSize: 13,
    ...extra,
  });

  return (
    <Stack spacing={1.5}>
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
          Tiendas por audiencia
        </Typography>
        <Typography
          variant="body2"
          color="text.secondary"
        >
          {rows.length} tiendas · {fmtNum(totalAud)} de audiencia
        </Typography>
      </Stack>
      {loading ? (
        <Skeleton
          variant="rounded"
          height={420}
        />
      ) : (
        <Box
          sx={{
            overflow: 'auto',
            maxHeight: '70vh',
            border: 1,
            borderColor: 'divider',
            borderRadius: 2,
          }}
        >
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns:
                '44px minmax(200px,2fr) minmax(130px,1fr) minmax(160px,1.2fr) minmax(170px,1.3fr)',
              minWidth: 760,
            }}
          >
            {head('#', true)}
            {head('Tienda')}
            {head('Audiencia')}
            {head('Contacto')}
            {head('Eventos del año')}
            {rows.map(({ s, i, evs }) => {
              const anniv = evs.find((e) => e.type === 'aniversario');
              return (
                <React.Fragment key={s._id}>
                  <Box
                    sx={cell(i, {
                      textAlign: 'center',
                      color: 'primary.main',
                      fontWeight: 600,
                      fontVariantNumeric: 'tabular-nums',
                    })}
                  >
                    {i + 1}
                  </Box>
                  <Box sx={cell(i, { minWidth: 0 })}>
                    <Typography sx={{ fontWeight: 600, fontSize: 13 }}>{s.name}</Typography>
                    <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
                      {s.address}
                    </Typography>
                    {anniv && (
                      <Typography sx={{ fontSize: 11, fontWeight: 600, color: 'primary.main' }}>
                        Aniversario · {shortDay(anniv.date).day}{' '}
                        {shortDay(anniv.date).mon.toLowerCase()}
                      </Typography>
                    )}
                  </Box>
                  <Box
                    sx={cell(i, {
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 0.625,
                      justifyContent: 'center',
                    })}
                  >
                    <Typography sx={{ fontVariantNumeric: 'tabular-nums', fontWeight: 500 }}>
                      {fmtNum(s.customerCount || 0)}
                    </Typography>
                    <Box
                      sx={{
                        height: 5,
                        borderRadius: 3,
                        bgcolor: alpha(theme.palette.primary.main, 0.15),
                        overflow: 'hidden',
                      }}
                    >
                      <Box
                        sx={{
                          height: '100%',
                          bgcolor: 'primary.main',
                          width: `${(((s.customerCount || 0) / maxAud) * 100).toFixed(1)}%`,
                        }}
                      />
                    </Box>
                  </Box>
                  <Box sx={cell(i, { fontSize: 12, wordBreak: 'break-word' })}>
                    {s.phoneNumber || s.email || '—'}
                  </Box>
                  <Box
                    sx={cell(i, {
                      fontSize: 12,
                      color: evs.length ? 'text.primary' : 'error.main',
                      fontWeight: evs.length ? 400 : 600,
                    })}
                  >
                    {evs.length
                      ? evs
                          .map(
                            (e) =>
                              `${shortDay(e.date).day} ${shortDay(e.date).mon.toLowerCase()} · ${
                                e.title
                              }`
                          )
                          .slice(0, 3)
                          .join('\n')
                      : 'Sin eventos este año'}
                  </Box>
                </React.Fragment>
              );
            })}
          </Box>
        </Box>
      )}
    </Stack>
  );
});
