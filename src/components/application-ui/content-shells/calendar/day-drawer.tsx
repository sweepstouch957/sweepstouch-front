'use client';

import type { CalendarEvent } from '@/services/calendar.service';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import PersonRoundedIcon from '@mui/icons-material/PersonRounded';
import {
  alpha,
  Avatar,
  Box,
  Button,
  ButtonBase,
  Drawer,
  IconButton,
  Stack,
  Typography,
  useTheme,
} from '@mui/material';
import React, { useMemo } from 'react';
import {
  eventColor,
  EVENT_TYPES,
  headline,
  longDate,
  SOURCE_LABEL,
  spansDay,
  STATUS_LABEL,
  statusColor,
  timeRange,
} from './constants';

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('') || '?';

/** Todos los eventos de un día con su responsable. Clic en uno → detalle; botón → crear. */
export function DayDrawer({
  day,
  events,
  onClose,
  onOpen,
  onAdd,
}: {
  day: string;
  events: CalendarEvent[];
  onClose: () => void;
  onOpen: (e: CalendarEvent) => void;
  onAdd: (day: string) => void;
}) {
  const theme = useTheme();
  const list = useMemo(
    () =>
      events
        .filter((e) => spansDay(e, day))
        // Sin hora al final; con hora, en orden
        .sort((a, b) => (a.startTime || '99').localeCompare(b.startTime || '99')),
    [events, day]
  );
  const people = new Set(list.map((e) => e.ownerName).filter(Boolean)).size;

  return (
    <Drawer
      anchor="right"
      open
      onClose={onClose}
      PaperProps={{ sx: { width: { xs: '100%', sm: 460 }, maxWidth: '100%' } }}
    >
      <Box
        sx={{
          px: 2.5,
          py: 2,
          bgcolor: 'primary.main',
          color: 'primary.contrastText',
        }}
      >
        <Stack
          direction="row"
          alignItems="flex-start"
          justifyContent="space-between"
        >
          <Box>
            <Typography
              sx={{ fontSize: 20, fontWeight: 700, lineHeight: 1.2, textTransform: 'capitalize' }}
            >
              {longDate({ date: day, endDate: '' })}
            </Typography>
            <Typography sx={{ fontSize: 13, opacity: 0.85, mt: 0.25 }}>
              {list.length === 1 ? '1 evento' : `${list.length} eventos`}
              {people ? ` · ${people === 1 ? '1 responsable' : `${people} responsables`}` : ''}
            </Typography>
          </Box>
          <IconButton
            onClick={onClose}
            sx={{ color: 'inherit' }}
            aria-label="Cerrar"
          >
            <CloseRoundedIcon />
          </IconButton>
        </Stack>
      </Box>

      <Stack
        spacing={1}
        sx={{ p: 2, flex: 1, overflowY: 'auto' }}
      >
        {!list.length && (
          <Typography
            color="text.secondary"
            sx={{ py: 4, textAlign: 'center' }}
          >
            No hay eventos este día.
          </Typography>
        )}
        {list.map((e) => {
          const ty = eventColor(e);
          const h = headline(e);
          const time = timeRange(e);
          return (
            <ButtonBase
              key={e._id}
              onClick={() => onOpen(e)}
              sx={{
                display: 'flex',
                alignItems: 'stretch',
                textAlign: 'left',
                width: '100%',
                borderRadius: 2,
                border: 1,
                borderColor: 'divider',
                overflow: 'hidden',
                opacity: e.status === 'cancelado' ? 0.55 : 1,
                '&:hover': {
                  borderColor: ty.bg,
                  bgcolor: alpha(ty.bg, 0.06),
                },
              }}
            >
              <Box sx={{ width: 5, flexShrink: 0, bgcolor: ty.bg }} />
              <Box sx={{ p: 1.5, minWidth: 0, flex: 1 }}>
                <Stack
                  direction="row"
                  spacing={1}
                  alignItems="center"
                  sx={{ mb: 0.25 }}
                >
                  <Typography
                    sx={{
                      fontSize: 11,
                      fontWeight: 700,
                      letterSpacing: '.04em',
                      textTransform: 'uppercase',
                      color: 'text.secondary',
                    }}
                  >
                    {e.source === 'event' ? EVENT_TYPES[e.type]?.label : SOURCE_LABEL[e.source]}
                    {time ? ` · ${time}` : ''}
                  </Typography>
                  <Typography
                    sx={{ fontSize: 11, fontWeight: 600, color: statusColor(theme, e.status) }}
                  >
                    {STATUS_LABEL[e.status]}
                  </Typography>
                </Stack>
                <Typography
                  sx={{
                    fontSize: 14,
                    fontWeight: 700,
                    textDecoration: e.status === 'cancelado' ? 'line-through' : 'none',
                  }}
                  noWrap
                >
                  {h.primary}
                </Typography>
                {h.secondary && (
                  <Typography
                    sx={{ fontSize: 13, color: 'text.secondary' }}
                    noWrap
                  >
                    {h.secondary}
                  </Typography>
                )}
                <Stack
                  direction="row"
                  spacing={0.75}
                  alignItems="center"
                  sx={{ mt: 1 }}
                >
                  {e.ownerName ? (
                    <Avatar
                      sx={{ width: 22, height: 22, fontSize: 10, bgcolor: ty.bg, color: ty.fg }}
                    >
                      {initials(e.ownerName)}
                    </Avatar>
                  ) : (
                    <PersonRoundedIcon sx={{ fontSize: 18, color: 'text.disabled' }} />
                  )}
                  <Typography
                    sx={{ fontSize: 12.5, fontWeight: 600 }}
                    noWrap
                  >
                    {e.ownerName || 'Sin responsable'}
                    {e.departmentName && (
                      <Box
                        component="span"
                        sx={{ fontWeight: 400, color: 'text.secondary' }}
                      >
                        {' '}
                        · {e.departmentName}
                      </Box>
                    )}
                  </Typography>
                </Stack>
              </Box>
            </ButtonBase>
          );
        })}
      </Stack>

      <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
        <Button
          fullWidth
          variant="contained"
          startIcon={<AddRoundedIcon />}
          onClick={() => onAdd(day)}
        >
          Agregar evento este día
        </Button>
      </Box>
    </Drawer>
  );
}
