'use client';

/**
 * Ficha de la persona — la columna derecha, siempre a la vista.
 *
 * Arriba quién es y cómo se le habla; abajo TODO lo suyo (órdenes y listas) en
 * tarjetas, cada una con lo que se puede hacer sin salir de acá. Los productos
 * se piden sólo de la tarjeta abierta: una persona con seis pedidos no dispara
 * seis requests al seleccionarla.
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
import ContentCopyRounded from '@mui/icons-material/ContentCopyRounded';
import DoneAllRounded from '@mui/icons-material/DoneAllRounded';
import ExpandMoreRounded from '@mui/icons-material/ExpandMoreRounded';
import PhoneRounded from '@mui/icons-material/PhoneRounded';
import SmsRounded from '@mui/icons-material/SmsRounded';
import StorefrontRounded from '@mui/icons-material/StorefrontRounded';
import WhatsApp from '@mui/icons-material/WhatsApp';
import {
  alpha,
  Box,
  Button,
  Collapse,
  Divider,
  IconButton,
  LinearProgress,
  Skeleton,
  Stack,
  Typography,
  useTheme,
} from '@mui/material';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { dateTimeShort, paymentMeta, prettyPhone, splitStoreTitle, statusMeta } from './constants';
import type { PersonRow } from './matrix-model';
import { nextStage, waitingLabel } from './order-drawer';

/** Botón cuadrado de contacto: la acción más usada de la pantalla. */
function ContactTile({
  icon,
  label,
  href,
  onClick,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  href?: string;
  onClick?: () => void;
  tone: 'wa' | 'brand';
}) {
  const theme = useTheme();
  const isWa = tone === 'wa';
  return (
    <Box
      component={href ? 'a' : 'button'}
      href={href}
      target={href ? '_blank' : undefined}
      rel={href ? 'noopener' : undefined}
      onClick={onClick}
      sx={{
        font: 'inherit',
        cursor: 'pointer',
        border: 0,
        borderRadius: 3,
        py: 1.25,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 0.5,
        fontSize: 12,
        fontWeight: 700,
        textDecoration: 'none',
        bgcolor: isWa ? 'success.main' : alpha(theme.palette.primary.main, 0.08),
        color: isWa ? '#fff' : 'primary.main',
        '&:hover': { opacity: 0.9 },
      }}
    >
      {icon}
      {label}
    </Box>
  );
}

/** Una orden o una lista, con lo que se puede hacer con ella. */
function RequestCard({
  row,
  expanded,
  onToggle,
  onChanged,
}: {
  row: MatrixRow;
  expanded: boolean;
  onToggle: () => void;
  onChanged: () => void;
}) {
  const theme = useTheme();
  const qc = useQueryClient();
  const isList = row.kind === 'list';
  const [busy, setBusy] = useState(false);

  const detail = useQuery({
    queryKey: ['order-detail', row._id],
    queryFn: () => orderAdminService.detail(row._id),
    enabled: expanded && !isList,
    staleTime: 15_000,
  });
  const o: OrderDetail | undefined = detail.data;

  const run = async (fn: () => Promise<void>, ok: string) => {
    setBusy(true);
    try {
      await fn();
      await qc.invalidateQueries({ queryKey: ['order-detail', row._id] });
      onChanged();
      toast.success(ok);
    } catch (e: any) {
      toast.error(e?.response?.data?.error || 'No se pudo completar la acción');
    } finally {
      setBusy(false);
    }
  };

  const st = statusMeta(row.fulfillmentStatus);
  const pay = paymentMeta(row.paymentStatus);
  const stage = o && o.reviewed ? nextStage(o.fulfillmentStatus) : null;

  return (
    <Box sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 4, overflow: 'hidden' }}>
      <Stack
        direction="row"
        alignItems="center"
        gap={1}
        onClick={onToggle}
        sx={{
          px: 1.75,
          py: 1.5,
          cursor: 'pointer',
          bgcolor: 'action.hover',
        }}
      >
        <Box
          sx={{
            px: 0.75,
            py: 0.25,
            borderRadius: 1.5,
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '.08em',
            color: isList ? 'text.secondary' : 'primary.main',
            border: `1px solid ${isList ? theme.palette.divider : alpha(theme.palette.primary.main, 0.4)}`,
          }}
        >
          {isList ? 'LISTA' : 'ORDEN'}
        </Box>
        <Typography
          variant="body2"
          fontWeight={700}
          noWrap
          sx={{ flex: 1, minWidth: 0 }}
        >
          {row.orderNumber}
        </Typography>
        <Typography
          variant="caption"
          color="text.secondary"
          noWrap
        >
          {dateTimeShort(row.createdAt)}
        </Typography>
        <ExpandMoreRounded
          fontSize="small"
          sx={{ transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }}
        />
      </Stack>

      <Stack
        direction="row"
        alignItems="baseline"
        justifyContent="space-between"
        gap={1}
        sx={{ px: 1.75, pb: 1.25 }}
      >
        <Typography
          variant="caption"
          fontWeight={700}
          sx={{ color: 'text.secondary' }}
        >
          {st.label}
          {!isList && pay?.label ? ` · ${pay.label}` : ''}
        </Typography>
        <Typography
          variant="h6"
          fontWeight={700}
        >
          {centsToUsd(row.subtotalCents - row.refundTotalCents)}
        </Typography>
      </Stack>

      <Collapse
        in={expanded}
        unmountOnExit
      >
        {busy && <LinearProgress />}
        <Box sx={{ px: 1.75, pb: 1.75 }}>
          {isList ? (
            <Typography
              variant="caption"
              color="text.secondary"
            >
              {row.itemCount} productos · se valida en la caja con el QR. Si querés que compre
              online, escribile por WhatsApp.
            </Typography>
          ) : detail.isLoading ? (
            <Skeleton
              variant="rounded"
              height={120}
            />
          ) : o ? (
            <Stack gap={1.25}>
              <Stack gap={0.25}>
                {o.items.map((it, i) => {
                  const gone = it.available === false || (it.refundedCents ?? 0) >= it.lineCents;
                  return (
                    <Stack
                      key={`${it.name}-${i}`}
                      direction="row"
                      alignItems="center"
                      gap={1}
                      sx={{ py: 0.75, borderBottom: `1px solid ${theme.palette.divider}` }}
                    >
                      <Typography
                        variant="body2"
                        fontWeight={600}
                        noWrap
                        sx={{ flex: 1, minWidth: 0, textDecoration: gone ? 'line-through' : 'none', opacity: gone ? 0.5 : 1 }}
                      >
                        {it.name}
                      </Typography>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        noWrap
                      >
                        {it.quantity} {it.unit || 'u'} · {centsToUsd(it.lineCents)}
                      </Typography>
                      {!gone && o.fulfillmentStatus !== 'awaiting_payment' && (
                        <Button
                          size="small"
                          color="warning"
                          disabled={busy}
                          sx={{ textTransform: 'none', minWidth: 0 }}
                          onClick={() => {
                            if (!window.confirm(`¿"${it.name}" no había? Se le reembolsa esa línea.`)) return;
                            void run(
                              () => orderAdminService.markUnavailable(o._id, i),
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

              <Stack
                direction="row"
                gap={1}
                flexWrap="wrap"
              >
                {!o.reviewed && o.fulfillmentStatus !== 'awaiting_payment' && (
                  <Button
                    size="small"
                    variant="contained"
                    color="success"
                    disabled={busy}
                    startIcon={<CheckCircleRounded fontSize="small" />}
                    sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 700 }}
                    onClick={() => void run(() => orderAdminService.review(o._id), 'Orden aprobada')}
                  >
                    Aprobar
                  </Button>
                )}
                {stage && (
                  <Button
                    size="small"
                    variant="outlined"
                    disabled={busy}
                    sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 700 }}
                    onClick={() =>
                      void run(
                        () => orderAdminService.setFulfillment(o._id, stage.to),
                        `${row.orderNumber}: ${stage.label.toLowerCase()}`
                      )
                    }
                  >
                    {stage.label}
                  </Button>
                )}
                {o.fulfillmentStatus === 'awaiting_payment' && (
                  <Button
                    size="small"
                    variant="outlined"
                    disabled={busy}
                    sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 700 }}
                    onClick={() =>
                      void run(() => orderAdminService.payInStore(o._id), 'Cobrado en la tienda')
                    }
                  >
                    Cobrado en la tienda
                  </Button>
                )}
                {o.pickupAt && !o.pickupConfirmed && (
                  <Button
                    size="small"
                    variant="outlined"
                    disabled={busy}
                    sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 700 }}
                    onClick={() =>
                      void run(() => orderAdminService.confirmPickup(o._id), 'Retiro confirmado')
                    }
                  >
                    Confirmar retiro
                  </Button>
                )}
                {!['completed', 'cancelled'].includes(o.fulfillmentStatus) && (
                  <Button
                    size="small"
                    color="error"
                    disabled={busy}
                    sx={{ textTransform: 'none', fontWeight: 700 }}
                    onClick={() => {
                      if (!window.confirm('¿Cancelar este pedido? El cliente recibe el aviso.')) return;
                      void run(
                        () => orderAdminService.setFulfillment(o._id, 'cancelled'),
                        'Pedido cancelado'
                      );
                    }}
                  >
                    Cancelar
                  </Button>
                )}
              </Stack>
            </Stack>
          ) : (
            <Typography
              variant="body2"
              color="error"
            >
              No se pudo cargar el pedido.
            </Typography>
          )}
        </Box>
      </Collapse>
    </Box>
  );
}

export function PersonDetail({
  person,
  attended,
  onAttend,
  onChanged,
  onClose,
}: {
  person: PersonRow | null;
  attended: boolean;
  onAttend: () => void;
  onChanged: () => void;
  /** Sólo en pantallas chicas, donde esta columna es un drawer. */
  onClose?: () => void;
}): React.JSX.Element {
  const theme = useTheme();
  const [open, setOpen] = useState<string>('');

  // Al cambiar de persona se abre su solicitud más urgente, que es la que se va a mirar.
  useEffect(() => setOpen(person?.lead._id ?? ''), [person]);

  if (!person) {
    return (
      <Stack
        alignItems="center"
        justifyContent="center"
        sx={{ height: '100%', p: 6, textAlign: 'center', color: 'text.secondary' }}
      >
        <Typography variant="body2">
          Elegí a alguien de la lista para ver sus órdenes y listas.
        </Typography>
      </Stack>
    );
  }

  const links = person.phone ? contactLinks(person.phone) : null;
  const { title, address } = splitStoreTitle(person.storeName);

  return (
    <Stack sx={{ height: '100%', minHeight: 0, overflowY: 'auto', bgcolor: 'background.paper' }}>
      <Stack
        gap={1.75}
        sx={{ p: 2.5, borderBottom: `1px solid ${theme.palette.divider}` }}
      >
        <Stack
          direction="row"
          alignItems="flex-start"
          gap={1.5}
        >
          <Box
            sx={{
              width: 46,
              height: 46,
              flexShrink: 0,
              borderRadius: '50%',
              bgcolor: alpha(theme.palette.primary.main, 0.1),
              color: 'primary.main',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: 17,
            }}
          >
            {(person.name || '#').trim().charAt(0).toUpperCase()}
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              variant="h6"
              fontWeight={700}
              noWrap
            >
              {person.name}
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
            >
              {person.phone ? prettyPhone(person.phone) : 'Sin teléfono'}
            </Typography>
          </Box>
          {onClose && (
            <IconButton
              size="small"
              onClick={onClose}
              aria-label="Cerrar"
            >
              <CloseRounded fontSize="small" />
            </IconButton>
          )}
        </Stack>

        <Stack
          direction="row"
          gap={0.75}
          flexWrap="wrap"
        >
          <Box
            sx={{
              px: 1.25,
              py: 0.5,
              borderRadius: 999,
              fontSize: 12,
              fontWeight: 700,
              bgcolor: alpha(theme.palette.primary.main, 0.08),
              color: 'primary.main',
            }}
          >
            {person.queue === 'done' ? 'Sin pendientes' : `Esperando ${waitingLabel(person.waitMinutes)}`}
          </Box>
          <Box
            sx={{
              px: 1.25,
              py: 0.5,
              borderRadius: 999,
              fontSize: 12,
              fontWeight: 700,
              bgcolor: 'action.hover',
              color: 'text.secondary',
            }}
          >
            {person.orders} órdenes · {person.lists} listas
          </Box>
          {attended && (
            <Box
              sx={{
                px: 1.25,
                py: 0.5,
                borderRadius: 999,
                fontSize: 12,
                fontWeight: 700,
                bgcolor: 'action.hover',
                color: 'text.secondary',
              }}
            >
              Atendida
            </Box>
          )}
        </Stack>

        <Stack
          direction="row"
          alignItems="center"
          gap={1.25}
          sx={{ p: 1.25, borderRadius: 3, bgcolor: 'action.hover' }}
        >
          <StorefrontRounded
            fontSize="small"
            sx={{ color: 'text.secondary' }}
          />
          <Box sx={{ minWidth: 0 }}>
            <Typography
              variant="body2"
              fontWeight={700}
              noWrap
            >
              {title}
            </Typography>
            {address && (
              <Typography
                variant="caption"
                color="text.secondary"
                noWrap
                display="block"
              >
                {address}
              </Typography>
            )}
          </Box>
        </Stack>

        {links && (
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 1 }}>
            <ContactTile
              tone="wa"
              icon={<WhatsApp fontSize="small" />}
              label="WhatsApp"
              href={links.whatsapp}
            />
            <ContactTile
              tone="brand"
              icon={<PhoneRounded fontSize="small" />}
              label="Llamar"
              href={links.call}
            />
            <ContactTile
              tone="brand"
              icon={<SmsRounded fontSize="small" />}
              label="SMS"
              href={links.sms}
            />
            <ContactTile
              tone="brand"
              icon={<ContentCopyRounded fontSize="small" />}
              label="Copiar"
              onClick={() => {
                navigator.clipboard?.writeText(person.phone);
                toast.success('Número copiado');
              }}
            />
          </Box>
        )}

        <Button
          fullWidth
          variant="contained"
          startIcon={<DoneAllRounded />}
          onClick={onAttend}
          sx={{
            borderRadius: 999,
            textTransform: 'none',
            fontWeight: 700,
            bgcolor: attended ? 'success.main' : 'text.primary',
            '&:hover': { bgcolor: attended ? 'success.dark' : 'primary.main' },
          }}
        >
          {attended ? 'Atendida — desmarcar' : 'Marcar como atendida'}
        </Button>
      </Stack>

      <Stack
        gap={1.5}
        sx={{ p: 2.5 }}
      >
        {person.rows.map((r) => (
          <RequestCard
            key={r._id}
            row={r}
            expanded={open === r._id}
            onToggle={() => setOpen((cur) => (cur === r._id ? '' : r._id))}
            onChanged={onChanged}
          />
        ))}
        <Divider />
        <Typography
          variant="caption"
          color="text.secondary"
        >
          {person.rows.length === 1
            ? 'Primera vez que aparece en este período.'
            : `${person.rows.length} solicitudes en el período elegido.`}
        </Typography>
      </Stack>
    </Stack>
  );
}
