/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Box, Typography, Stack, Chip, IconButton, Tooltip } from '@mui/material';
import TerminalIcon from '@mui/icons-material/Terminal';
import CircleIcon from '@mui/icons-material/Circle';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import { io, type Socket } from 'socket.io-client';

interface FeedEvent {
  orderNumber?: string;
  storeName?: string;
  storeSlug?: string;
  customerName?: string;
  event: string;
  fulfillmentStatus?: string;
  paidOnline?: boolean;
  totalCents?: number;
  ts: string;
}

// Etiqueta legible de cada transición que emite order-service (notifySupportOrderEvent).
const EVENT_LABEL: Record<string, string> = {
  created: 'Creada · falta revisión',
  reviewed: 'Revisada',
  paid_online: 'Pagada ONLINE',
  paid_in_store: 'Pagada en caja',
  preparing: 'Preparando',
  ready: 'Lista',
  completed: 'Completada',
  validated: 'Validada (QR)',
  cancelled: 'Cancelada',
};

const SOCKET_URL = process.env.NEXT_PUBLIC_NOTIFICATION_URL || 'http://localhost:4008';
const usd = (c?: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format((c || 0) / 100);

/**
 * Feed en vivo para SOPORTE TÉCNICO: cada cambio de estado de pedido de CUALQUIER tienda.
 * Escucha la sala global "support" (notification-service, evento "support_order_event").
 * Las órdenes pagadas EN LÍNEA se resaltan (prioridad) y se pueden filtrar.
 */
export default function SupportOrderFeed() {
  const [events, setEvents] = useState<FeedEvent[]>([]);
  const [onlyPriority, setOnlyPriority] = useState(false);
  const [connected, setConnected] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);
  const autoScroll = useRef(true);

  const push = useCallback((e: FeedEvent) => {
    setEvents((prev) => [...prev.slice(-499), e]); // cap 500
  }, []);

  useEffect(() => {
    const serverUrl = SOCKET_URL.startsWith('http') ? new URL(SOCKET_URL).origin : SOCKET_URL;
    const socket: Socket = io(serverUrl, {
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 3000,
      withCredentials: true,
    });
    socket.on('connect', () => {
      setConnected(true);
      socket.emit('join_room', { room: 'support' });
    });
    socket.on('disconnect', () => setConnected(false));
    socket.on('support_order_event', (data: any) => {
      const m = data?.metadata || data || {};
      push({
        orderNumber: m.orderNumber,
        storeName: m.storeName || m.storeSlug,
        storeSlug: m.storeSlug,
        customerName: m.customerName,
        event: m.event || m.fulfillmentStatus || 'update',
        fulfillmentStatus: m.fulfillmentStatus,
        paidOnline: !!m.paidOnline,
        totalCents: m.totalCents,
        ts: m.ts || new Date().toISOString(),
      });
    });
    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('support_order_event');
      socket.disconnect();
    };
  }, [push]);

  useEffect(() => {
    if (autoScroll.current && bodyRef.current) {
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    }
  }, [events]);

  const shown = onlyPriority ? events.filter((e) => e.paidOnline) : events;
  const priorityCount = events.filter((e) => e.paidOnline).length;

  return (
    <Box
      sx={{
        borderRadius: '14px',
        overflow: 'hidden',
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 8px 30px rgba(0,0,0,0.28)',
        bgcolor: '#0b1020',
      }}
    >
      {/* Header */}
      <Stack
        direction="row"
        alignItems="center"
        spacing={1.25}
        sx={{ px: 2, py: 1.1, bgcolor: '#0e1530', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
      >
        <TerminalIcon sx={{ color: '#7dd3fc', fontSize: 19 }} />
        <Typography sx={{ color: '#e2e8f0', fontWeight: 800, fontSize: 13.5, fontFamily: 'monospace' }}>
          soporte · pedidos en vivo
        </Typography>
        <Tooltip title={connected ? 'En vivo' : 'Conectando…'}>
          <CircleIcon
            sx={{
              fontSize: 10,
              color: connected ? '#22c55e' : '#64748b',
              '@keyframes livedot': { '0%,100%': { opacity: 1 }, '50%': { opacity: 0.35 } },
              animation: connected ? 'livedot 1.5s ease-in-out infinite' : 'none',
            }}
          />
        </Tooltip>
        <Box flex={1} />
        <Chip
          label={`⚡ prioridad ${priorityCount}`}
          size="small"
          onClick={() => setOnlyPriority((v) => !v)}
          sx={{
            height: 21,
            fontSize: 10.5,
            fontFamily: 'monospace',
            cursor: 'pointer',
            bgcolor: onlyPriority ? 'rgba(236,72,153,0.25)' : 'transparent',
            color: '#f9a8d4',
            border: '1px solid rgba(236,72,153,0.4)',
            '&:hover': { bgcolor: 'rgba(236,72,153,0.15)' },
          }}
        />
        <Tooltip title="Limpiar">
          <IconButton size="small" onClick={() => setEvents([])} sx={{ color: '#94a3b8' }}>
            <DeleteSweepIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Tooltip>
      </Stack>

      {/* Body */}
      <Box
        ref={bodyRef}
        onScroll={(e) => {
          const el = e.currentTarget;
          autoScroll.current = el.scrollHeight - el.scrollTop - el.clientHeight < 48;
        }}
        sx={{
          height: 380,
          overflowY: 'auto',
          px: 2,
          py: 1.4,
          fontFamily: 'monospace',
          fontSize: 12.5,
          lineHeight: 1.7,
          bgcolor: '#0b1020',
        }}
      >
        {shown.length === 0 ? (
          <Typography sx={{ color: '#64748b', fontFamily: 'monospace', fontSize: 12.5 }}>
            {'// esperando cambios de estado…'}
          </Typography>
        ) : (
          shown.map((e, i) => (
            <Box
              key={i}
              sx={{
                display: 'flex',
                gap: 1,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                px: e.paidOnline ? 0.75 : 0,
                py: e.paidOnline ? 0.25 : 0,
                my: e.paidOnline ? 0.25 : 0,
                borderRadius: e.paidOnline ? 1 : 0,
                bgcolor: e.paidOnline ? 'rgba(236,72,153,0.10)' : 'transparent',
                borderLeft: e.paidOnline ? '2px solid #ec4899' : '2px solid transparent',
              }}
            >
              <span style={{ color: '#475569' }}>
                {new Date(e.ts).toLocaleTimeString('es-US', { hour12: false })}
              </span>
              {e.paidOnline ? <span style={{ color: '#f9a8d4', fontWeight: 800 }}>⚡</span> : null}
              <span style={{ color: '#7dd3fc', minWidth: 120 }}>{e.storeName || '—'}</span>
              <span style={{ color: '#e2e8f0', fontWeight: 700, minWidth: 96 }}>{e.orderNumber || '—'}</span>
              <span style={{ color: e.paidOnline ? '#f9a8d4' : '#cbd5e1', flex: 1 }}>
                {EVENT_LABEL[e.event] || e.event}
                {e.customerName ? `  ·  ${e.customerName}` : ''}
                {typeof e.totalCents === 'number' ? `  ·  ${usd(e.totalCents)}` : ''}
              </span>
            </Box>
          ))
        )}
      </Box>
    </Box>
  );
}
