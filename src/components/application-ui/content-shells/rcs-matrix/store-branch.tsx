'use client';

import { centsToUsd, type MatrixRow } from '@/services/rcs-matrix.service';
import ContentCopyRounded from '@mui/icons-material/ContentCopyRounded';
import ExpandMoreRounded from '@mui/icons-material/ExpandMoreRounded';
import LocalShippingRounded from '@mui/icons-material/LocalShippingRounded';
import PhoneRounded from '@mui/icons-material/PhoneRounded';
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
  Divider,
  IconButton,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import React from 'react';
import toast from 'react-hot-toast';
import { OPEN_STATUSES, prettyPhone, statusMeta, timeShort } from './constants';

interface Props {
  storeName: string;
  rows: MatrixRow[];
  defaultExpanded?: boolean;
}

/** Botonera de contacto. Sin teléfono en la orden no hay por dónde llamar. */
function ContactButtons({ row }: { row: MatrixRow }): React.JSX.Element {
  if (!row.contact) {
    return (
      <Typography variant="caption" color="text.secondary">
        Sin teléfono
      </Typography>
    );
  }
  return (
    <Stack direction="row" spacing={0.5}>
      <Tooltip title="WhatsApp">
        <IconButton
          size="small"
          component="a"
          href={row.contact.whatsapp}
          target="_blank"
          rel="noopener"
          sx={{ color: '#25D366' }}
        >
          <WhatsApp fontSize="small" />
        </IconButton>
      </Tooltip>
      <Tooltip title="Llamar">
        <IconButton size="small" component="a" href={row.contact.call} color="primary">
          <PhoneRounded fontSize="small" />
        </IconButton>
      </Tooltip>
      <Tooltip title="SMS">
        <IconButton size="small" component="a" href={row.contact.sms} color="info">
          <SmsRounded fontSize="small" />
        </IconButton>
      </Tooltip>
      <Tooltip title="Copiar número">
        <IconButton
          size="small"
          onClick={() => {
            navigator.clipboard?.writeText(row.customerPhone);
            toast.success('Número copiado');
          }}
        >
          <ContentCopyRounded fontSize="small" />
        </IconButton>
      </Tooltip>
    </Stack>
  );
}

/** Una persona a la que hay que contactar, con el estado de su orden. */
function ContactRow({ row }: { row: MatrixRow }): React.JSX.Element {
  const meta = statusMeta(row.fulfillmentStatus);
  const initial = (row.customerName || '#').trim().charAt(0).toUpperCase();

  return (
    <Stack
      direction={{ xs: 'column', md: 'row' }}
      spacing={1.5}
      alignItems={{ xs: 'flex-start', md: 'center' }}
      sx={{
        py: 1.25,
        px: { xs: 1, md: 1.5 },
        '&:hover': { bgcolor: 'action.hover' },
        borderRadius: 1,
      }}
    >
      <Avatar sx={{ width: 36, height: 36, bgcolor: 'primary.main', fontSize: 15 }}>
        {initial}
      </Avatar>

      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Typography variant="subtitle2" fontWeight={700} noWrap>
          {row.customerName || 'Sin nombre'}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {prettyPhone(row.customerPhone)}
        </Typography>
        {row.address ? (
          <Typography variant="caption" color="text.secondary" display="block" noWrap>
            {row.address}
          </Typography>
        ) : null}
      </Box>

      <Stack spacing={0.5} sx={{ minWidth: 170 }}>
        <Typography variant="caption" color="text.secondary">
          #{row.orderNumber} · {timeShort(row.createdAt)}
        </Typography>
        <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
          <Chip size="small" label={meta.label} color={meta.color} variant="filled" />
          {row.deliveryMethod === 'delivery' ? (
            <Chip size="small" icon={<LocalShippingRounded />} label="Envío" variant="outlined" />
          ) : null}
          {row.pickupAt ? (
            <Chip size="small" label={`Pickup ${timeShort(row.pickupAt)}`} variant="outlined" />
          ) : null}
        </Stack>
      </Stack>

      <Stack sx={{ minWidth: 110 }}>
        <Typography variant="subtitle2" fontWeight={700}>
          {centsToUsd(row.subtotalCents - row.refundTotalCents)}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {row.itemCount} art. · {row.paymentStatus === 'succeeded' ? 'Pagado' : row.paymentStatus}
        </Typography>
      </Stack>

      <ContactButtons row={row} />
    </Stack>
  );
}

const MemoRow = React.memo(ContactRow);

/** Rama del árbol: una tienda con toda su gente del día. */
export function StoreBranch({ storeName, rows, defaultExpanded }: Props): React.JSX.Element {
  const open = rows.filter((r) => OPEN_STATUSES.includes(r.fulfillmentStatus)).length;
  const total = rows.reduce((n, r) => n + r.subtotalCents - r.refundTotalCents, 0);

  return (
    <Accordion
      defaultExpanded={defaultExpanded}
      disableGutters
      sx={{ '&:before': { display: 'none' } }}
    >
      <AccordionSummary expandIcon={<ExpandMoreRounded />}>
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ width: '100%', pr: 2 }}>
          <StorefrontRounded color="primary" />
          <Typography variant="subtitle1" fontWeight={800} sx={{ flex: 1, minWidth: 0 }} noWrap>
            {storeName}
          </Typography>
          <Chip size="small" label={`${rows.length} órdenes`} />
          {open > 0 ? <Chip size="small" color="warning" label={`${open} por atender`} /> : null}
          <Typography variant="subtitle2" fontWeight={700}>
            {centsToUsd(total)}
          </Typography>
        </Stack>
      </AccordionSummary>
      <AccordionDetails sx={{ pt: 0 }}>
        <Divider sx={{ mb: 1 }} />
        {rows.map((r) => (
          <MemoRow key={r._id} row={r} />
        ))}
      </AccordionDetails>
    </Accordion>
  );
}
