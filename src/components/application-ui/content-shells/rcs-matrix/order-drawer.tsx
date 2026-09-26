'use client';

/**
 * Ficha de una solicitud — el detalle del CRM.
 *
 * Abre sobre la matriz sin sacar a nadie de la pantalla: quién es, qué pidió,
 * cuánto pagó, qué falta hacer, y el historial de esa persona (sus otras
 * órdenes y listas, que ya están cargadas en la matriz — no se piden de nuevo).
 *
 * Las acciones son los MISMOS endpoints del vendor site (`orderAdminService`):
 * acá no hay una segunda verdad, sólo una pantalla que ve todas las tiendas.
 */

import {
  centsToUsd,
  contactLinks,
  orderAdminService,
  type MatrixRow,
  type OrderDetail,
} from '@/services/rcs-matrix.service';
import CheckCircleRounded from '@mui/icons-material/CheckCircleRounded';
import CloseRounded from '@mui/icons-material/CloseRounded';
import DoneAllRounded from '@mui/icons-material/DoneAllRounded';
import InventoryRounded from '@mui/icons-material/InventoryRounded';
import LocalMallRounded from '@mui/icons-material/LocalMallRounded';
import PaidRounded from '@mui/icons-material/PaidRounded';
import PhoneRounded from '@mui/icons-material/PhoneRounded';
import SmsRounded from '@mui/icons-material/SmsRounded';
import StorefrontRounded from '@mui/icons-material/StorefrontRounded';
import WhatsApp from '@mui/icons-material/WhatsApp';
import {
  alpha,
  Box,
  Button,
  Chip,
  Divider,
  Drawer,
  IconButton,
  LinearProgress,
  Skeleton,
  Stack,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import React, { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { dateTimeShort, paymentMeta, prettyPhone, statusMeta } from './constants';
import { queueOf, waitingMinutes } from './matrix-model';

/** "hace 2 h 15 min" — el número que decide a quién se atiende primero. */
export function waitingLabel(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h} h ${m} min` : `${h} h`;
}

/** Etapa siguiente de una orden ya aprobada; null cuando no hay nada que avanzar. */
export function nextStage(status: string): { to: string; label: string } | null {
  if (status === 'paid') return { to: 'preparing', label: 'Empezar a armar' };
  if (status === 'preparing') return { to: 'ready', label: 'Marcar lista' };
  if (status === 'ready') return { to: 'completed', label: 'Entregada' };
  return null;
}

function Line({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <Stack
      direction="row"
      justifyContent="space-between"
      gap={2}
    >
      <Typography
        variant="caption"
        color="text.secondary"
      >
        {label}
      </Typography>
      <Typography
        variant="caption"
        fontWeight={700}
        textAlign="right"
      >
        {value}
      </Typography>
    </Stack>
  );
}

export function OrderDrawer({
  row,
  history,
  onClose,
  onChanged,
}: {
  /** Fila de la matriz que se abrió. `null` = cerrado. */
  row: MatrixRow | null;
  /** Otras filas de la MISMA persona (ya están en memoria: no se vuelve a pedir). */
  history: MatrixRow[];
  onClose: () => void;
  /** Se llama después de cada acción para refrescar la matriz. */
  onChanged: () => void;
}): React.JSX.Element {
  const theme = useTheme();
  const qc = useQueryClient();
  const isList = row?.kind === 'list';
  const orderId = row && !isList ? row._id : '';

  const detail = useQuery({
    queryKey: ['order-detail', orderId],
    queryFn: () => orderAdminService.detail(orderId),
    enabled: !!orderId,
    staleTime: 15_000,
  });

  const [busy, setBusy] = useState('');
  const run = async (label: string, fn: () => Promise<void>, ok: string) => {
    setBusy(label);
    try {
      await fn();
      await qc.invalidateQueries({ queryKey: ['order-detail', orderId] });
      onChanged();
      toast.success(ok);
    } catch (e: any) {
      toast.error(e?.response?.data?.error || 'No se pudo completar la acción');
    } finally {
      setBusy('');
    }
  };

  const unavailable = useMutation({
    mutationFn: (index: number) => orderAdminService.markUnavailable(orderId, index),
  });

  const o: OrderDetail | undefined = detail.data;
  const links = row?.customerPhone ? contactLinks(row.customerPhone) : null;
  const queue = row ? queueOf(row) : 'done';
  const waiting = row ? waitingLabel(waitingMinutes(row)) : '';
  const stage = o ? nextStage(o.fulfillmentStatus) : null;
  const st = row ? statusMeta(row.fulfillmentStatus) : null;
  const pay = o ? paymentMeta(o.paymentStatus) : null;

  return (
    <Drawer
      anchor="right"
      open={!!row}
      onClose={onClose}
      PaperProps={{ sx: { width: { xs: '100%', sm: 460 }, maxWidth: '100%' } }}
    >
      {!row ? null : (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          {/* Cabecera: quién y cuánto lleva esperando */}
          <Stack
            direction="row"
            alignItems="flex-start"
            gap={1}
            sx={{ p: 2, pb: 1.5 }}
          >
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography
                variant="h6"
                fontWeight={800}
                noWrap
              >
                {row.customerName || 'Sin nombre'}
              </Typography>
              <Typography
                variant="caption"
                color="text.secondary"
                display="block"
                noWrap
              >
                {row.orderNumber} · {dateTimeShort(row.createdAt)}
              </Typography>
              <Stack
                direction="row"
                gap={0.5}
                sx={{ mt: 0.75 }}
                flexWrap="wrap"
              >
                {st && (
                  <Chip
                    size="small"
                    label={st.label}
                    sx={{ height: 20, fontSize: 11, fontWeight: 700 }}
                  />
                )}
                {queue !== 'done' && (
                  <Chip
                    size="small"
                    color={queue === 'approve' ? 'warning' : 'default'}
                    variant="outlined"
                    label={`Esperando ${waiting}`}
                    sx={{ height: 20, fontSize: 11, fontWeight: 700 }}
                  />
                )}
                {o?.reviewed && (
                  <Chip
                    size="small"
                    color="success"
                    variant="outlined"
                    label="Aprobada"
                    sx={{ height: 20, fontSize: 11, fontWeight: 700 }}
                  />
                )}
              </Stack>
            </Box>
            <IconButton
              size="small"
              onClick={onClose}
              aria-label="Cerrar"
            >
              <CloseRounded fontSize="small" />
            </IconButton>
          </Stack>

          {/* Contacto: es lo que se hace desde esta pantalla */}
          {links && (
            <Stack
              direction="row"
              gap={1}
              sx={{ px: 2, pb: 1.5 }}
            >
              <Button
                size="small"
                variant="outlined"
                startIcon={<WhatsApp fontSize="small" />}
                href={links.whatsapp}
                target="_blank"
                rel="noopener"
              >
                WhatsApp
              </Button>
              <Button
                size="small"
                variant="outlined"
                startIcon={<PhoneRounded fontSize="small" />}
                href={links.call}
              >
                {prettyPhone(row.customerPhone)}
              </Button>
              <Tooltip title="SMS">
                <IconButton
                  size="small"
                  href={links.sms}
                >
                  <SmsRounded fontSize="small" />
                </IconButton>
              </Tooltip>
            </Stack>
          )}

          <Divider />
          {(detail.isFetching || !!busy) && <LinearProgress />}

          <Box sx={{ flex: 1, overflowY: 'auto', p: 2, display: 'grid', gap: 2 }}>
            {/* Tienda */}
            <Stack
              direction="row"
              alignItems="center"
              gap={1}
            >
              <StorefrontRounded
                fontSize="small"
                color="action"
              />
              <Typography
                variant="body2"
                fontWeight={700}
                noWrap
              >
                {row.storeName}
              </Typography>
            </Stack>

            {isList ? (
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: 2,
                  bgcolor: alpha(theme.palette.info.main, 0.06),
                  display: 'grid',
                  gap: 0.75,
                }}
              >
                <Typography
                  variant="caption"
                  fontWeight={800}
                >
                  Lista de compra (todavía sin pedido)
                </Typography>
                <Line
                  label="Productos"
                  value={row.itemCount}
                />
                <Line
                  label="Valor"
                  value={centsToUsd(row.subtotalCents)}
                />
                <Line
                  label="Puntos"
                  value={row.pointsAwarded ?? 0}
                />
                <Typography
                  variant="caption"
                  color="text.secondary"
                >
                  Una lista se valida en la caja con el QR. Si querés que compre online,
                  escribile por WhatsApp desde acá.
                </Typography>
              </Box>
            ) : detail.isLoading ? (
              <Skeleton
                variant="rounded"
                height={220}
              />
            ) : o ? (
              <>
                {/* Acciones: lo que falta hacer, en el orden en que se hace */}
                <Stack gap={1}>
                  {!o.reviewed && o.fulfillmentStatus !== 'awaiting_payment' && (
                    <Button
                      variant="contained"
                      color="success"
                      startIcon={<CheckCircleRounded />}
                      disabled={!!busy}
                      onClick={() =>
                        run('review', () => orderAdminService.review(o._id), 'Orden aprobada')
                      }
                    >
                      Aprobar pedido
                    </Button>
                  )}
                  {o.reviewed && stage && (
                    <Button
                      variant="contained"
                      startIcon={stage.to === 'completed' ? <DoneAllRounded /> : <InventoryRounded />}
                      disabled={!!busy}
                      onClick={() =>
                        run(
                          'stage',
                          () => orderAdminService.setFulfillment(o._id, stage.to),
                          `Pedido: ${stage.label.toLowerCase()}`
                        )
                      }
                    >
                      {stage.label}
                    </Button>
                  )}
                  {o.fulfillmentStatus === 'awaiting_payment' && (
                    <Button
                      variant="outlined"
                      startIcon={<PaidRounded />}
                      disabled={!!busy}
                      onClick={() =>
                        run(
                          'store',
                          () => orderAdminService.payInStore(o._id),
                          'Marcado como cobrado en la tienda'
                        )
                      }
                    >
                      Cobrado en la tienda
                    </Button>
                  )}
                  {o.pickupAt && !o.pickupConfirmed && (
                    <Button
                      variant="outlined"
                      disabled={!!busy}
                      onClick={() =>
                        run(
                          'pickup',
                          () => orderAdminService.confirmPickup(o._id),
                          'Hora de retiro confirmada'
                        )
                      }
                    >
                      Confirmar retiro {dateTimeShort(o.pickupAt)}
                    </Button>
                  )}
                  {!['completed', 'cancelled'].includes(o.fulfillmentStatus) && (
                    <Button
                      size="small"
                      color="error"
                      disabled={!!busy}
                      onClick={() => {
                        if (!window.confirm('¿Cancelar este pedido? El cliente recibe el aviso.')) return;
                        void run(
                          'cancel',
                          () => orderAdminService.setFulfillment(o._id, 'cancelled'),
                          'Pedido cancelado'
                        );
                      }}
                    >
                      Cancelar pedido
                    </Button>
                  )}
                </Stack>

                {/* Plata */}
                <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: alpha(theme.palette.text.primary, 0.03), display: 'grid', gap: 0.75 }}>
                  <Line
                    label="Pago"
                    value={pay?.label || o.paymentStatus}
                  />
                  {o.paymentMethod && (
                    <Line
                      label="Método"
                      value={o.paymentMethod}
                    />
                  )}
                  <Line
                    label="Subtotal"
                    value={centsToUsd(o.subtotalCents)}
                  />
                  {!!o.shippingCostCents && (
                    <Line
                      label="Envío"
                      value={centsToUsd(o.shippingCostCents)}
                    />
                  )}
                  {!!o.refundTotalCents && (
                    <Line
                      label="Reembolsado"
                      value={`− ${centsToUsd(o.refundTotalCents)}`}
                    />
                  )}
                  {!!o.payAtRegisterCents && (
                    <Line
                      label="Se paga en caja (EBT)"
                      value={centsToUsd(o.payAtRegisterCents)}
                    />
                  )}
                  <Divider sx={{ my: 0.5 }} />
                  <Line
                    label="Neto"
                    value={centsToUsd(o.subtotalCents - (o.refundTotalCents || 0))}
                  />
                </Box>

                {/* Productos: marcar el que no había reembolsa esa línea */}
                <Box>
                  <Typography
                    variant="caption"
                    fontWeight={800}
                    sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}
                  >
                    <LocalMallRounded sx={{ fontSize: 16 }} /> {o.items.length} productos
                  </Typography>
                  <Stack gap={0.5}>
                    {o.items.map((it, i) => {
                      const gone = it.available === false || (it.refundedCents ?? 0) >= it.lineCents;
                      return (
                        <Stack
                          key={`${it.name}-${i}`}
                          direction="row"
                          alignItems="center"
                          gap={1}
                          sx={{
                            p: 0.75,
                            borderRadius: 1.5,
                            border: `1px solid ${theme.palette.divider}`,
                            opacity: gone ? 0.5 : 1,
                          }}
                        >
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography
                              variant="body2"
                              fontWeight={600}
                              noWrap
                              sx={{ textDecoration: gone ? 'line-through' : 'none' }}
                            >
                              {it.name}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              {it.quantity} {it.unit || 'u'} · {centsToUsd(it.lineCents)}
                            </Typography>
                          </Box>
                          {!gone && o.fulfillmentStatus !== 'awaiting_payment' && (
                            <Button
                              size="small"
                              color="warning"
                              disabled={!!busy || unavailable.isPending}
                              onClick={() => {
                                if (!window.confirm(`¿"${it.name}" no había? Se le reembolsa esa línea.`)) return;
                                void run(
                                  'item',
                                  () => unavailable.mutateAsync(i),
                                  'Producto marcado como no disponible'
                                );
                              }}
                            >
                              No había
                            </Button>
                          )}
                        </Stack>
                      );
                    })}
                  </Stack>
                </Box>
              </>
            ) : (
              <Typography
                variant="body2"
                color="error"
              >
                No se pudo cargar el pedido.
              </Typography>
            )}

            {/* Historial: lo que hace que esto sea un CRM y no una tabla */}
            {history.length > 0 && (
              <Box>
                <Typography
                  variant="caption"
                  fontWeight={800}
                  display="block"
                  sx={{ mb: 0.5 }}
                >
                  Historial de esta persona ({history.length})
                </Typography>
                <Stack gap={0.5}>
                  {history.slice(0, 12).map((h) => (
                    <Stack
                      key={h._id}
                      direction="row"
                      justifyContent="space-between"
                      gap={1}
                      sx={{ px: 1, py: 0.5, borderRadius: 1, bgcolor: alpha(theme.palette.text.primary, 0.03) }}
                    >
                      <Typography
                        variant="caption"
                        noWrap
                      >
                        {h.orderNumber} · {statusMeta(h.fulfillmentStatus).label}
                      </Typography>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        noWrap
                      >
                        {dateTimeShort(h.createdAt)} · {centsToUsd(h.subtotalCents)}
                      </Typography>
                    </Stack>
                  ))}
                </Stack>
              </Box>
            )}
          </Box>
        </Box>
      )}
    </Drawer>
  );
}
