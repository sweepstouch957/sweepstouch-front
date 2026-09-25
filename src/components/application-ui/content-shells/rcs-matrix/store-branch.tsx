'use client';

import { centsToUsd, type MatrixRow } from '@/services/rcs-matrix.service';
import ContentCopyRounded from '@mui/icons-material/ContentCopyRounded';
import ExpandMoreRounded from '@mui/icons-material/ExpandMoreRounded';
import LocalShippingRounded from '@mui/icons-material/LocalShippingRounded';
import PhoneRounded from '@mui/icons-material/PhoneRounded';
import ScheduleRounded from '@mui/icons-material/ScheduleRounded';
import SmsRounded from '@mui/icons-material/SmsRounded';
import StorefrontRounded from '@mui/icons-material/StorefrontRounded';
import WhatsApp from '@mui/icons-material/WhatsApp';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Avatar,
  Box,
  Chip,
  IconButton,
  Stack,
  Tooltip,
  Typography,
  alpha,
  useTheme,
} from '@mui/material';
import React from 'react';
import toast from 'react-hot-toast';
import { OPEN_STATUSES, paymentMeta, prettyPhone, splitStoreTitle, statusMeta, timeShort } from './constants';

interface Props {
  storeName: string;
  rows: MatrixRow[];
  defaultExpanded?: boolean;
}

/** Columnas de una fila en escritorio: persona · orden · plata · contacto. */
const ROW_GRID = {
  xs: '1fr',
  md: 'minmax(200px, 1.7fr) minmax(190px, 1.3fr) minmax(130px, 0.9fr) auto',
};

/**
 * Botonera de contacto — es la acción de la página, así que los botones son de
 * 40px reales con etiqueta accesible. Sin teléfono no hay por dónde llamar.
 */
function ContactButtons({ row }: { row: MatrixRow }): React.JSX.Element {
  const theme = useTheme();
  if (!row.contact) {
    return (
      <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
        Sin teléfono
      </Typography>
    );
  }

  const who = row.customerName || prettyPhone(row.customerPhone);
  const actions = [
    {
      key: 'wa',
      title: 'WhatsApp',
      label: `Escribir por WhatsApp a ${who}`,
      icon: <WhatsApp fontSize="small" />,
      color: '#25D366',
      props: { component: 'a' as const, href: row.contact.whatsapp, target: '_blank', rel: 'noopener' },
    },
    {
      key: 'call',
      title: 'Llamar',
      label: `Llamar a ${who}`,
      icon: <PhoneRounded fontSize="small" />,
      color: theme.palette.primary.main,
      props: { component: 'a' as const, href: row.contact.call },
    },
    {
      key: 'sms',
      title: 'SMS',
      label: `Mandar SMS a ${who}`,
      icon: <SmsRounded fontSize="small" />,
      color: theme.palette.info.main,
      props: { component: 'a' as const, href: row.contact.sms },
    },
    {
      key: 'copy',
      title: 'Copiar número',
      label: `Copiar el número de ${who}`,
      icon: <ContentCopyRounded fontSize="small" />,
      color: theme.palette.text.secondary,
      props: {
        onClick: () => {
          navigator.clipboard?.writeText(row.customerPhone);
          toast.success('Número copiado');
        },
      },
    },
  ];

  return (
    <Stack direction="row" spacing={0.75}>
      {actions.map((a) => (
        <Tooltip key={a.key} title={a.title}>
          <IconButton
            size="small"
            aria-label={a.label}
            {...(a.props as any)}
            sx={{
              width: 40,
              height: 40,
              color: a.color,
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 2,
              transition: 'background-color .15s ease, border-color .15s ease',
              '&:hover': { bgcolor: alpha(a.color, 0.1), borderColor: alpha(a.color, 0.5) },
            }}
          >
            {a.icon}
          </IconButton>
        </Tooltip>
      ))}
    </Stack>
  );
}

/** Una persona a la que hay que contactar, con el estado de su orden. */
function ContactRow({ row }: { row: MatrixRow }): React.JSX.Element {
  const meta = statusMeta(row.fulfillmentStatus);
  const pay = paymentMeta(row.paymentStatus);
  const initial = (row.customerName || '#').trim().charAt(0).toUpperCase();
  const payColor = { ok: 'success.main', warn: 'warning.main', bad: 'error.main', muted: 'text.secondary' }[pay.tone];

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: ROW_GRID,
        alignItems: 'center',
        columnGap: 2.5,
        rowGap: 1.5,
        px: { xs: 2, md: 2.5 },
        py: 2,
        borderTop: '1px solid',
        borderColor: 'divider',
        transition: 'background-color .15s ease',
        '&:hover': { bgcolor: 'action.hover' },
      }}
    >
      {/* Quién */}
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ minWidth: 0 }}>
        <Avatar sx={{ width: 40, height: 40, bgcolor: 'primary.main', fontSize: 16, fontWeight: 700 }}>
          {initial}
        </Avatar>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="subtitle2" fontWeight={700} noWrap>
            {row.customerName || 'Sin nombre'}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ fontVariantNumeric: 'tabular-nums' }}>
            {prettyPhone(row.customerPhone)}
          </Typography>
          {row.address ? (
            <Tooltip title={row.address}>
              <Typography variant="caption" color="text.disabled" display="block" noWrap>
                {row.address}
              </Typography>
            </Tooltip>
          ) : null}
        </Box>
      </Stack>

      {/* Su orden */}
      <Stack spacing={0.75} sx={{ minWidth: 0 }}>
        <Stack direction="row" spacing={0.75} alignItems="center" sx={{ color: 'text.secondary' }}>
          <Typography variant="caption" fontWeight={700} sx={{ fontVariantNumeric: 'tabular-nums' }} noWrap>
            #{row.orderNumber}
          </Typography>
          <ScheduleRounded sx={{ fontSize: 13 }} />
          <Typography variant="caption" sx={{ fontVariantNumeric: 'tabular-nums' }}>
            {timeShort(row.createdAt)}
          </Typography>
        </Stack>
        <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
          <Chip size="small" label={meta.label} color={meta.color} sx={{ fontWeight: 700 }} />
          {row.deliveryMethod === 'delivery' ? (
            <Chip size="small" icon={<LocalShippingRounded />} label="Envío" variant="outlined" />
          ) : null}
          {row.pickupAt ? (
            <Chip size="small" label={`Pickup ${timeShort(row.pickupAt)}`} variant="outlined" />
          ) : null}
        </Stack>
      </Stack>

      {/* Cuánto */}
      <Stack spacing={0.25} sx={{ minWidth: 0 }}>
        <Typography variant="subtitle1" fontWeight={800} sx={{ fontVariantNumeric: 'tabular-nums', lineHeight: 1.2 }}>
          {centsToUsd(row.subtotalCents - row.refundTotalCents)}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {row.itemCount} artículo{row.itemCount === 1 ? '' : 's'}
        </Typography>
        <Typography variant="caption" fontWeight={700} sx={{ color: payColor }}>
          {pay.label}
        </Typography>
      </Stack>

      <ContactButtons row={row} />
    </Box>
  );
}

const MemoRow = React.memo(ContactRow);

/** Rama del árbol: una tienda con toda su gente del día. */
export function StoreBranch({ storeName, rows, defaultExpanded }: Props): React.JSX.Element {
  const theme = useTheme();
  const { title, address } = splitStoreTitle(storeName);
  const open = rows.filter((r) => OPEN_STATUSES.includes(r.fulfillmentStatus)).length;
  const total = rows.reduce((n, r) => n + r.subtotalCents - r.refundTotalCents, 0);

  return (
    <Accordion
      defaultExpanded={defaultExpanded}
      disableGutters
      elevation={0}
      sx={{
        borderRadius: 3,
        border: '1px solid',
        borderColor: 'divider',
        overflow: 'hidden',
        '&:before': { display: 'none' },
        '&.Mui-expanded': { borderColor: alpha(theme.palette.primary.main, 0.35) },
      }}
    >
      <AccordionSummary
        expandIcon={<ExpandMoreRounded />}
        sx={{
          px: { xs: 2, md: 2.5 },
          py: 1,
          minHeight: 72,
          '& .MuiAccordionSummary-content': { alignItems: 'center', gap: 2, my: 1 },
        }}
      >
        <Avatar
          variant="rounded"
          sx={{ width: 40, height: 40, bgcolor: alpha(theme.palette.primary.main, 0.12), color: 'primary.main' }}
        >
          <StorefrontRounded fontSize="small" />
        </Avatar>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="subtitle1" fontWeight={800} noWrap>
            {title}
          </Typography>
          {address ? (
            <Typography variant="caption" color="text.secondary" noWrap display="block">
              {address}
            </Typography>
          ) : null}
        </Box>

        <Stack direction="row" spacing={1} alignItems="center" sx={{ pr: 1, flexShrink: 0 }}>
          {open > 0 ? (
            <Chip size="small" color="warning" label={`${open} por atender`} sx={{ fontWeight: 700 }} />
          ) : null}
          <Chip size="small" variant="outlined" label={`${rows.length} órdenes`} />
          <Typography
            variant="subtitle1"
            fontWeight={800}
            sx={{ fontVariantNumeric: 'tabular-nums', display: { xs: 'none', sm: 'block' }, minWidth: 92, textAlign: 'right' }}
          >
            {centsToUsd(total)}
          </Typography>
        </Stack>
      </AccordionSummary>

      <AccordionDetails sx={{ p: 0 }}>
        {rows.map((r) => (
          <MemoRow key={r._id} row={r} />
        ))}
      </AccordionDetails>
    </Accordion>
  );
}
