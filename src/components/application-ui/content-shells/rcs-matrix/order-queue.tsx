'use client';

/**
 * Cola de atención — la bandeja de entrada del CRM.
 *
 * La matriz muestra TODO lo que pasó; esta cola muestra sólo lo que falta hacer,
 * y en el orden en que se hace: primero la plata que ya entró y nadie miró.
 * Cada fila tiene su acción de un toque (aprobar / armar / entregar) y abre la
 * ficha completa al tocarla.
 */

import { centsToUsd, contactLinks, orderAdminService, type MatrixRow } from '@/services/rcs-matrix.service';
import CheckCircleRounded from '@mui/icons-material/CheckCircleRounded';
import DoneAllRounded from '@mui/icons-material/DoneAllRounded';
import InventoryRounded from '@mui/icons-material/InventoryRounded';
import ReceiptLongRounded from '@mui/icons-material/ReceiptLongRounded';
import WhatsApp from '@mui/icons-material/WhatsApp';
import {
  alpha,
  Badge,
  Box,
  Button,
  Card,
  Chip,
  Stack,
  Tab,
  Tabs,
  Typography,
  useTheme,
} from '@mui/material';
import React, { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { dateTimeShort, splitStoreTitle } from './constants';
import { buildQueues, waitingMinutes, type QueueBucket, type QueueKey } from './matrix-model';
import { nextStage, waitingLabel } from './order-drawer';

/** Título, explicación y color de cada cola. El texto es lo que se hace, no el estado. */
export const QUEUE_META: Record<QueueKey, { label: string; hint: string; color: 'warning' | 'info' | 'success' | 'error' | 'default' }> = {
  approve: { label: 'Por aprobar', hint: 'Pagadas y sin revisar: el cliente ya puso la plata', color: 'error' },
  prepare: { label: 'Por armar', hint: 'Aprobadas: hay que juntar los productos', color: 'warning' },
  deliver: { label: 'Por entregar', hint: 'Listas en el mostrador, esperando al cliente', color: 'info' },
  unpaid: { label: 'Sin pagar', hint: 'Se quedaron en el checkout: hay que perseguirlas', color: 'default' },
  list: { label: 'Listas vigentes', hint: 'Armaron su lista pero todavía no compraron', color: 'default' },
  done: { label: 'Cerradas', hint: 'Entregadas, canceladas o vencidas', color: 'success' },
};

function QueueCard({
  bucket,
  active,
  onClick,
}: {
  bucket: QueueBucket;
  active: boolean;
  onClick: () => void;
}) {
  const theme = useTheme();
  const meta = QUEUE_META[bucket.key];
  const color = meta.color === 'default' ? theme.palette.text.primary : theme.palette[meta.color].main;
  return (
    <Card
      onClick={onClick}
      elevation={0}
      sx={{
        p: 1.5,
        cursor: 'pointer',
        minWidth: 150,
        flex: '1 1 150px',
        border: `1.5px solid ${active ? color : theme.palette.divider}`,
        bgcolor: active ? alpha(color, 0.06) : 'background.paper',
        transition: 'border-color .15s, background-color .15s',
      }}
    >
      <Typography
        variant="caption"
        fontWeight={800}
        color="text.secondary"
        noWrap
      >
        {meta.label}
      </Typography>
      <Typography
        variant="h5"
        fontWeight={900}
        sx={{ color, lineHeight: 1.2 }}
      >
        {bucket.rows.length}
      </Typography>
      <Typography
        variant="caption"
        color="text.secondary"
        noWrap
        display="block"
      >
        {bucket.cents > 0 ? centsToUsd(bucket.cents) : '—'}
        {bucket.oldestMinutes > 0 && bucket.key !== 'done' ? ` · ${waitingLabel(bucket.oldestMinutes)}` : ''}
      </Typography>
    </Card>
  );
}

/** Acción de un toque para la cola en la que está la fila. */
function QuickAction({
  row,
  queue,
  onDone,
}: {
  row: MatrixRow;
  queue: QueueKey;
  onDone: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const stage = nextStage(row.fulfillmentStatus);

  const act = async (fn: () => Promise<void>, ok: string) => {
    setBusy(true);
    try {
      await fn();
      onDone();
      toast.success(ok);
    } catch (e: any) {
      toast.error(e?.response?.data?.error || 'No se pudo completar la acción');
    } finally {
      setBusy(false);
    }
  };

  if (queue === 'approve') {
    return (
      <Button
        size="small"
        variant="contained"
        color="success"
        disabled={busy}
        startIcon={<CheckCircleRounded fontSize="small" />}
        onClick={(e) => {
          e.stopPropagation();
          void act(() => orderAdminService.review(row._id), `${row.orderNumber} aprobada`);
        }}
      >
        Aprobar
      </Button>
    );
  }
  if ((queue === 'prepare' || queue === 'deliver') && stage) {
    return (
      <Button
        size="small"
        variant="outlined"
        disabled={busy}
        startIcon={stage.to === 'completed' ? <DoneAllRounded fontSize="small" /> : <InventoryRounded fontSize="small" />}
        onClick={(e) => {
          e.stopPropagation();
          void act(() => orderAdminService.setFulfillment(row._id, stage.to), `${row.orderNumber}: ${stage.label.toLowerCase()}`);
        }}
      >
        {stage.label}
      </Button>
    );
  }
  // Sin pagar y listas: no hay nada que tocar en el backend, hay que hablarle.
  const links = row.customerPhone ? contactLinks(row.customerPhone) : null;
  return links ? (
    <Button
      size="small"
      variant="outlined"
      color="success"
      href={links.whatsapp}
      target="_blank"
      rel="noopener"
      onClick={(e) => e.stopPropagation()}
      startIcon={<WhatsApp fontSize="small" />}
    >
      Escribir
    </Button>
  ) : (
    <span />
  );
}

export function OrderQueue({
  rows,
  onOpen,
  onChanged,
}: {
  /** Filas ya filtradas por período, tienda y búsqueda. */
  rows: MatrixRow[];
  onOpen: (row: MatrixRow) => void;
  onChanged: () => void;
}): React.JSX.Element {
  const theme = useTheme();
  const queues = useMemo(() => buildQueues(rows), [rows]);
  // Arranca en la primera cola que tenga trabajo: la pantalla abre donde duele.
  const first = queues.find((q) => q.rows.length > 0 && q.key !== 'done')?.key ?? 'approve';
  const [tab, setTab] = useState<QueueKey>(first);
  const [showAll, setShowAll] = useState(false);
  const active = queues.find((q) => q.key === tab) ?? queues[0];
  const visible = showAll ? active.rows : active.rows.slice(0, 25);

  return (
    <Card
      elevation={0}
      sx={{ p: 2, border: `1px solid ${theme.palette.divider}` }}
    >
      <Stack
        direction="row"
        alignItems="center"
        gap={1}
        sx={{ mb: 1.5 }}
      >
        <ReceiptLongRounded fontSize="small" />
        <Typography
          variant="subtitle2"
          fontWeight={800}
        >
          Solicitudes por atender
        </Typography>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ ml: 'auto' }}
        >
          {QUEUE_META[active.key].hint}
        </Typography>
      </Stack>

      <Stack
        direction="row"
        gap={1}
        flexWrap="wrap"
        sx={{ mb: 1.5 }}
      >
        {queues.map((q) => (
          <QueueCard
            key={q.key}
            bucket={q}
            active={q.key === tab}
            onClick={() => {
              setTab(q.key);
              setShowAll(false);
            }}
          />
        ))}
      </Stack>

      {active.rows.length === 0 ? (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ py: 3, textAlign: 'center' }}
        >
          Nada pendiente en esta cola. 🎉
        </Typography>
      ) : (
        <Stack gap={0.75}>
          {visible.map((r) => {
            const wait = waitingMinutes(r);
            const old = wait >= 120 && active.key !== 'done';
            return (
              <Stack
                key={r._id}
                direction={{ xs: 'column', sm: 'row' }}
                alignItems={{ xs: 'stretch', sm: 'center' }}
                gap={1}
                onClick={() => onOpen(r)}
                sx={{
                  p: 1,
                  borderRadius: 1.5,
                  cursor: 'pointer',
                  border: `1px solid ${old ? alpha(theme.palette.error.main, 0.4) : theme.palette.divider}`,
                  bgcolor: old ? alpha(theme.palette.error.main, 0.04) : 'transparent',
                  '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.05) },
                }}
              >
                <Box sx={{ minWidth: 0, flex: 1.4 }}>
                  <Typography
                    variant="body2"
                    fontWeight={700}
                    noWrap
                  >
                    {r.customerName || 'Sin nombre'}
                  </Typography>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    noWrap
                    display="block"
                  >
                    {r.orderNumber} · {r.itemCount} prod. · {dateTimeShort(r.createdAt)}
                  </Typography>
                </Box>
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Typography
                    variant="caption"
                    noWrap
                    display="block"
                    fontWeight={600}
                  >
                    {splitStoreTitle(r.storeName).title}
                  </Typography>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    noWrap
                  >
                    {centsToUsd(r.subtotalCents - r.refundTotalCents)}
                  </Typography>
                </Box>
                {active.key !== 'done' && (
                  <Chip
                    size="small"
                    variant="outlined"
                    color={old ? 'error' : 'default'}
                    label={waitingLabel(wait)}
                    sx={{ height: 20, fontSize: 11, fontWeight: 700, flexShrink: 0 }}
                  />
                )}
                <Box sx={{ flexShrink: 0 }}>
                  <QuickAction
                    row={r}
                    queue={active.key}
                    onDone={onChanged}
                  />
                </Box>
              </Stack>
            );
          })}
          {active.rows.length > visible.length && (
            <Button
              size="small"
              onClick={() => setShowAll(true)}
            >
              Ver las {active.rows.length - visible.length} restantes
            </Button>
          )}
        </Stack>
      )}
    </Card>
  );
}
