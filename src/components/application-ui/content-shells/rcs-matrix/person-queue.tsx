'use client';

/**
 * Cola de trabajo — el centro de la pantalla.
 *
 * Una fila por PERSONA (no por orden): a quien tiene dos pedidos y una lista se
 * le llama una vez. Arriba, un chip por cola con su contador; abajo, los grupos
 * con lo más viejo primero. Todo se puede hacer sin soltar el teclado:
 * J/K para moverse, E para marcar atendida, W para abrir su WhatsApp.
 */

import { centsToUsd, contactLinks, type MatrixRow } from '@/services/rcs-matrix.service';
import CheckRounded from '@mui/icons-material/CheckRounded';
import CloseRounded from '@mui/icons-material/CloseRounded';
import DoneAllRounded from '@mui/icons-material/DoneAllRounded';
import SearchRounded from '@mui/icons-material/SearchRounded';
import TaskAltRounded from '@mui/icons-material/TaskAltRounded';
import WhatsApp from '@mui/icons-material/WhatsApp';
import {
  alpha,
  Box,
  Button,
  IconButton,
  InputBase,
  Stack,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { dateTimeShort, splitStoreTitle } from './constants';
import { peopleByQueue, QUEUE_ORDER, type PersonRow, type QueueKey } from './matrix-model';
import { waitingLabel } from './order-drawer';
import { QUEUE_META } from './order-queue';

/**
 * Dos estados y nada más: normal o urgente (más de 2 h esperando). El color de
 * marca se reserva para lo urgente y para lo seleccionado; el resto es neutro.
 */
function isUrgent(minutes: number, queue: QueueKey): boolean {
  return queue !== 'done' && minutes >= 120;
}

function Initial({ name, urgent }: { name: string; urgent: boolean }) {
  const theme = useTheme();
  const color = urgent ? theme.palette.primary.main : theme.palette.text.secondary;
  return (
    <Box
      sx={{
        width: 38,
        height: 38,
        flexShrink: 0,
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 800,
        fontSize: 14,
        bgcolor: alpha(theme.palette.text.primary, 0.06),
        color,
      }}
    >
      {(name || '#').trim().charAt(0).toUpperCase()}
    </Box>
  );
}

export function PersonQueue({
  people,
  selectedKey,
  onSelect,
  checked,
  onToggleCheck,
  onCheckMany,
  onClearChecks,
  onAttend,
  onBulkSend,
  q,
  onQ,
}: {
  people: PersonRow[];
  selectedKey: string;
  onSelect: (p: PersonRow) => void;
  checked: Set<string>;
  onToggleCheck: (key: string) => void;
  onCheckMany: (keys: string[]) => void;
  onClearChecks: () => void;
  /** Marcar como atendidas (marca local, ver attended.ts). */
  onAttend: (keys: string[]) => void;
  onBulkSend: (people: PersonRow[]) => void;
  q: string;
  onQ: (v: string) => void;
}): React.JSX.Element {
  const theme = useTheme();
  const [tab, setTab] = useState<QueueKey | 'all'>('all');

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const p of people) c[p.queue] = (c[p.queue] || 0) + 1;
    return c;
  }, [people]);

  const shown = useMemo(
    () => (tab === 'all' ? people : people.filter((p) => p.queue === tab)),
    [people, tab]
  );
  const buckets = useMemo(() => peopleByQueue(shown), [shown]);
  const flat = useMemo(() => buckets.flatMap((b) => b.people), [buckets]);

  // Teclado: la cola se trabaja sin mouse.
  const cursor = useMemo(() => flat.findIndex((p) => p.key === selectedKey), [flat, selectedKey]);
  const listRef = useRef<HTMLDivElement>(null);
  const move = useCallback(
    (delta: number) => {
      if (!flat.length) return;
      const next = Math.min(flat.length - 1, Math.max(0, (cursor < 0 ? -1 : cursor) + delta));
      onSelect(flat[next]);
      listRef.current
        ?.querySelector(`[data-person="${CSS.escape(flat[next].key)}"]`)
        ?.scrollIntoView({ block: 'nearest' });
    },
    [cursor, flat, onSelect]
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      // No robar teclas mientras se escribe en un campo.
      if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable)) return;
      const current = flat[cursor];
      if (e.key === 'j' || e.key === 'J') {
        e.preventDefault();
        move(1);
      } else if (e.key === 'k' || e.key === 'K') {
        e.preventDefault();
        move(-1);
      } else if ((e.key === 'e' || e.key === 'E') && current) {
        e.preventDefault();
        onAttend([current.key]);
      } else if ((e.key === 'w' || e.key === 'W') && current?.phone) {
        e.preventDefault();
        window.open(contactLinks(current.phone)!.whatsapp, '_blank', 'noopener');
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [cursor, flat, move, onAttend]);

  const chipsOf = (p: PersonRow): { label: string; tone: 'error' | 'warning' | 'info' | 'default' }[] => {
    const out: { label: string; tone: 'error' | 'warning' | 'info' | 'default' }[] = [];
    if (p.orders) out.push({ label: `${p.orders} ${p.orders === 1 ? 'orden' : 'órdenes'} · ${centsToUsd(p.cents)}`, tone: 'default' });
    if (p.lists) out.push({ label: `${p.lists} ${p.lists === 1 ? 'lista' : 'listas'}`, tone: 'info' });
    return out;
  };

  const tabs: { key: QueueKey | 'all'; label: string; count: number }[] = [
    { key: 'all', label: 'Todas', count: people.length },
    ...QUEUE_ORDER.map((k) => ({ key: k, label: QUEUE_META[k].label, count: counts[k] || 0 })).filter(
      (t) => t.count > 0
    ),
  ];

  return (
    <Stack sx={{ height: '100%', minHeight: 0, position: 'relative' }}>
      {/* Cabecera pegada: buscador y colas siempre a mano */}
      <Stack
        gap={1.25}
        sx={{
          position: 'sticky',
          top: 0,
          zIndex: 5,
          px: 2.5,
          py: 1.75,
          borderBottom: `1px solid ${theme.palette.divider}`,
          bgcolor: alpha(theme.palette.background.default, 0.94),
          backdropFilter: 'blur(8px)',
        }}
      >
        <Stack
          direction="row"
          alignItems="center"
          gap={1.5}
          flexWrap="wrap"
        >
          <Box sx={{ flex: '1 1 220px', minWidth: 0 }}>
            <Typography
              variant="subtitle1"
              fontWeight={800}
              noWrap
            >
              {tab === 'all' ? 'Todo lo pendiente' : QUEUE_META[tab].label}
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              noWrap
              display="block"
            >
              {tab === 'all'
                ? `${people.length} personas · lo más urgente arriba`
                : QUEUE_META[tab].hint}
            </Typography>
          </Box>
          <Stack
            direction="row"
            alignItems="center"
            gap={1}
            sx={{
              height: 38,
              flex: '0 1 260px',
              minWidth: 160,
              px: 1.25,
              borderRadius: 2.5,
              bgcolor: 'background.paper',
              border: `1px solid ${theme.palette.divider}`,
            }}
          >
            <SearchRounded
              fontSize="small"
              sx={{ color: 'text.disabled' }}
            />
            <InputBase
              value={q}
              onChange={(e) => onQ(e.target.value)}
              placeholder="Nombre, teléfono, orden…"
              sx={{ flex: 1, fontSize: 13 }}
            />
          </Stack>
        </Stack>

        <Stack
          direction="row"
          gap={0.75}
          flexWrap="wrap"
        >
          {tabs.map((t) => {
            const on = t.key === tab;
            const color = theme.palette.primary.main;
            return (
              <Box
                key={t.key}
                component="button"
                onClick={() => setTab(t.key)}
                sx={{
                  font: 'inherit',
                  cursor: 'pointer',
                  borderRadius: 999,
                  px: 1.5,
                  py: 0.75,
                  fontSize: 12,
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.75,
                  border: `1px solid ${on ? color : theme.palette.divider}`,
                  bgcolor: on ? alpha(color, 0.08) : 'background.paper',
                  color: on ? color : 'text.secondary',
                }}
              >
                {t.label}
                <Box
                  component="span"
                  sx={{ fontWeight: 800, opacity: 0.7 }}
                >
                  {t.count}
                </Box>
              </Box>
            );
          })}
        </Stack>
      </Stack>

      {/* Grupos */}
      <Box
        ref={listRef}
        sx={{ flex: 1, minHeight: 0, overflowY: 'auto', px: 2.5, py: 2, pb: 10 }}
      >
        {buckets.length === 0 ? (
          <Stack
            alignItems="center"
            gap={1}
            sx={{ py: 8, color: 'text.secondary', textAlign: 'center' }}
          >
            <TaskAltRounded sx={{ fontSize: 44, color: 'success.main' }} />
            <Typography
              variant="subtitle1"
              fontWeight={800}
              color="text.primary"
            >
              Nada pendiente acá
            </Typography>
            <Typography variant="body2">Cambiá de cola, de tienda o de período.</Typography>
          </Stack>
        ) : (
          <Stack gap={2.75}>
            {buckets.map((b) => {
              const meta = QUEUE_META[b.key];
              const color = theme.palette.text.secondary;
              return (
                <Stack
                  key={b.key}
                  gap={1}
                >
                  <Stack
                    direction="row"
                    alignItems="center"
                    gap={1.25}
                    sx={{ px: 0.5 }}
                  >
                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: color }} />
                    <Typography
                      variant="caption"
                      fontWeight={800}
                      sx={{ color }}
                    >
                      {meta.label}
                    </Typography>
                    <Typography
                      variant="caption"
                      fontWeight={700}
                      color="text.secondary"
                    >
                      {b.people.length}
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      noWrap
                      sx={{ flex: 1, minWidth: 0 }}
                    >
                      {meta.hint}
                    </Typography>
                    <Button
                      size="small"
                      onClick={() => onCheckMany(b.people.map((p) => p.key))}
                      sx={{ textTransform: 'none', fontWeight: 700, minWidth: 0 }}
                    >
                      Seleccionar
                    </Button>
                  </Stack>

                  {b.people.map((p) => {
                    const urgent = isUrgent(p.waitMinutes, p.queue);
                    const on = p.key === selectedKey;
                    const isChecked = checked.has(p.key);
                    const links = p.phone ? contactLinks(p.phone) : null;
                    return (
                      <Stack
                        key={p.key}
                        data-person={p.key}
                        direction="row"
                        alignItems="center"
                        gap={1.5}
                        onClick={() => onSelect(p)}
                        sx={{
                          p: 1.25,
                          borderRadius: 3.5,
                          cursor: 'pointer',
                          flexWrap: 'wrap',
                          bgcolor: 'background.paper',
                          border: `1px solid ${on ? theme.palette.primary.main : theme.palette.divider}`,
                          '&:hover': { borderColor: theme.palette.primary.light },
                        }}
                      >
                        <Box
                          component="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleCheck(p.key);
                          }}
                          aria-label={`Seleccionar ${p.name}`}
                          sx={{
                            width: 20,
                            height: 20,
                            flexShrink: 0,
                            p: 0,
                            borderRadius: 1.5,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: `1.5px solid ${isChecked ? theme.palette.primary.main : theme.palette.divider}`,
                            bgcolor: isChecked ? 'primary.main' : 'transparent',
                            color: 'primary.contrastText',
                          }}
                        >
                          {isChecked && <CheckRounded sx={{ fontSize: 14 }} />}
                        </Box>

                        <Initial
                          name={p.name}
                          urgent={urgent}
                        />

                        <Box sx={{ flex: '1 1 160px', minWidth: 0 }}>
                          <Typography
                            variant="body2"
                            fontWeight={700}
                            noWrap
                          >
                            {p.name}
                          </Typography>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            noWrap
                            display="block"
                          >
                            {splitStoreTitle(p.storeName).title} · {dateTimeShort(p.lead.createdAt)}
                          </Typography>
                        </Box>

                        <Stack
                          direction="row"
                          gap={0.75}
                          sx={{ flex: '1 1 200px', minWidth: 0, flexWrap: 'wrap' }}
                        >
                          {chipsOf(p).map((c) => (
                            <Box
                              key={c.label}
                              sx={{
                                px: 1,
                                py: 0.5,
                                borderRadius: 2,
                                fontSize: 12,
                                fontWeight: 700,
                                whiteSpace: 'nowrap',
                                bgcolor: alpha(theme.palette.text.primary, 0.05),
                                color: 'text.secondary',
                              }}
                            >
                              {c.label}
                            </Box>
                          ))}
                        </Stack>

                        <Box
                          sx={{
                            px: 1.25,
                            py: 0.5,
                            borderRadius: 999,
                            fontSize: 12,
                            fontWeight: 800,
                            whiteSpace: 'nowrap',
                            bgcolor: urgent
                              ? alpha(theme.palette.primary.main, 0.08)
                              : alpha(theme.palette.text.primary, 0.05),
                            color: urgent ? 'primary.main' : 'text.secondary',
                          }}
                        >
                          {p.queue === 'done' ? 'Cerrada' : waitingLabel(p.waitMinutes)}
                        </Box>

                        <Stack
                          direction="row"
                          gap={0.75}
                          onClick={(e) => e.stopPropagation()}
                        >
                          {links && (
                            <Tooltip title="WhatsApp (W)">
                              <IconButton
                                size="small"
                                href={links.whatsapp}
                                target="_blank"
                                rel="noopener"
                                sx={{
                                  border: `1px solid ${theme.palette.divider}`,
                                  color: 'success.main',
                                  '&:hover': { bgcolor: 'action.hover' },
                                }}
                              >
                                <WhatsApp fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                          <Tooltip title="Marcar atendida (E)">
                            <IconButton
                              size="small"
                              onClick={() => onAttend([p.key])}
                              sx={{
                                border: `1px solid ${theme.palette.divider}`,
                                '&:hover': { bgcolor: 'text.primary', color: 'background.paper' },
                              }}
                            >
                              <DoneAllRounded fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </Stack>
                    );
                  })}
                </Stack>
              );
            })}

            <Typography
              variant="caption"
              color="text.secondary"
              textAlign="center"
            >
              Atajos: <b>J</b>/<b>K</b> moverse · <b>E</b> marcar atendida · <b>W</b> abrir WhatsApp
            </Typography>
          </Stack>
        )}
      </Box>

      {/* Barra de selección: aparece sólo cuando hay gente tildada */}
      {checked.size > 0 && (
        <Stack
          direction="row"
          alignItems="center"
          gap={1.25}
          sx={{
            position: 'absolute',
            bottom: 16,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 6,
            px: 1,
            pl: 2.25,
            py: 1,
            borderRadius: 999,
            bgcolor: 'text.primary',
            color: 'background.paper',
            boxShadow: `0 12px 40px ${alpha(theme.palette.common.black, 0.3)}`,
            flexWrap: 'wrap',
          }}
        >
          <Typography
            variant="body2"
            fontWeight={700}
          >
            {checked.size} seleccionadas
          </Typography>
          <Button
            size="small"
            variant="contained"
            color="success"
            sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 700 }}
            onClick={() => onBulkSend(people.filter((p) => checked.has(p.key)))}
          >
            Enviar bot
          </Button>
          <Button
            size="small"
            sx={{
              borderRadius: 999,
              textTransform: 'none',
              fontWeight: 700,
              bgcolor: 'background.paper',
              color: 'text.primary',
              '&:hover': { bgcolor: 'background.paper', opacity: 0.9 },
            }}
            onClick={() => onAttend([...checked])}
          >
            Marcar atendidas
          </Button>
          <IconButton
            size="small"
            onClick={onClearChecks}
            sx={{ color: 'background.paper' }}
            aria-label="Limpiar selección"
          >
            <CloseRounded fontSize="small" />
          </IconButton>
        </Stack>
      )}
    </Stack>
  );
}
