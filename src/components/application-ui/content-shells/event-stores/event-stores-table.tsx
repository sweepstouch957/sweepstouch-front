'use client';

/** Tabla del módulo Eventos. Presentacional: recibe filas y callbacks por props. */

import type { EventStoreRow } from '@/services/sweepstakes.service';
import { kioskUrl } from 'src/utils/sweepstouch-urls';
import ContentCopyRounded from '@mui/icons-material/ContentCopyRounded';
import DownloadRounded from '@mui/icons-material/DownloadRounded';
import InsightsRounded from '@mui/icons-material/InsightsRounded';
import QrCode2Rounded from '@mui/icons-material/QrCode2Rounded';
import StorefrontRounded from '@mui/icons-material/StorefrontRounded';
import {
  Box,
  Chip,
  CircularProgress,
  IconButton,
  LinearProgress,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material';
import { format } from 'date-fns';
import Link from 'next/link';
import React from 'react';
import { routes } from 'src/router/routes';

const OPTIN_LABEL: Record<string, string> = {
  event: 'Evento — Owner / Employee',
  nsa: 'NSA — Owner/Manager · Seller/Brand',
  generic: 'Genérico',
};

/** El link público del opt-in: el que va en el QR impreso. */
export function optinLink(row: EventStoreRow): string {
  const base = row.sweepstake?.confirmationLink?.replace(/\/+$/, '');
  if (base) return `${base}/${row.store.slug}`;
  return row.store.genericOptinLink || '';
}

/** El link que soporte técnico carga en las tablets del evento. */
export function kioskLink(row: EventStoreRow): string {
  return kioskUrl(row.store.slug);
}

function fmt(d?: string | null, withTime = false): string {
  if (!d) return '—';
  const parsed = new Date(d);
  if (Number.isNaN(parsed.getTime())) return '—';
  return format(parsed, withTime ? 'dd/MM/yyyy HH:mm' : 'dd/MM/yyyy');
}

/** Etiqueta + URL truncada + copiar. Dos de estas por fila. */
function LinkRow({
  label,
  url,
  empty,
  onCopy,
}: {
  label: string;
  url: string;
  empty: string;
  onCopy: (url: string) => void;
}) {
  return (
    <Stack
      direction="row"
      alignItems="center"
      gap={0.75}
    >
      <Chip
        size="small"
        label={label}
        variant="outlined"
        sx={{ height: 18, fontSize: 10, minWidth: 54 }}
      />
      {url ? (
        <>
          <Typography
            variant="caption"
            noWrap
            sx={{ maxWidth: 170, color: 'text.secondary' }}
            title={url}
          >
            {url}
          </Typography>
          <Tooltip title={`Copiar ${label}`}>
            <IconButton
              size="small"
              onClick={() => onCopy(url)}
            >
              <ContentCopyRounded sx={{ fontSize: 13 }} />
            </IconButton>
          </Tooltip>
        </>
      ) : (
        <Typography
          variant="caption"
          color="text.disabled"
        >
          {empty}
        </Typography>
      )}
    </Stack>
  );
}

type Props = {
  rows: EventStoreRow[];
  exportingId: string | null;
  onCopy: (link: string) => void;
  onExport: (row: EventStoreRow) => void;
};

export default function EventStoresTable({ rows, exportingId, onCopy, onExport }: Props) {
  return (
    <Table size="small">
      <TableHead>
        <TableRow>
          <TableCell>Evento</TableCell>
          <TableCell>Tienda</TableCell>
          <TableCell>Fechas</TableCell>
          <TableCell align="right">Números</TableCell>
          <TableCell>Nuevos / Existentes</TableCell>
          <TableCell>Roles</TableCell>
          <TableCell>Último registro</TableCell>
          <TableCell>Links</TableCell>
          <TableCell align="right">Acciones</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {rows.map((row) => {
          const link = optinLink(row);
          const pctNuevos = row.participants
            ? Math.round((row.newUsers / row.participants) * 100)
            : 0;
          const isNsa = row.sweepstake?.optinType === 'nsa';
          const qrUrl = row.store.genericQr?.secureUrl;
          const kiosk = kioskLink(row);

          return (
            <TableRow
              key={row.store._id}
              hover
            >
              <TableCell>
                <Stack gap={0.5}>
                  <Typography
                    variant="body2"
                    fontWeight={700}
                  >
                    {row.sweepstake?.name || 'Sin sorteo asignado'}
                  </Typography>
                  <Stack
                    direction="row"
                    gap={0.5}
                    flexWrap="wrap"
                  >
                    {row.sweepstake && (
                      <Chip
                        size="small"
                        label={row.sweepstake.status}
                        color={row.sweepstake.status === 'in progress' ? 'success' : 'default'}
                        variant="outlined"
                      />
                    )}
                    {row.sweepstake?.optinType && (
                      <Chip
                        size="small"
                        label={OPTIN_LABEL[row.sweepstake.optinType] || row.sweepstake.optinType}
                        variant="outlined"
                      />
                    )}
                  </Stack>
                </Stack>
              </TableCell>

              <TableCell>
                <Stack
                  direction="row"
                  alignItems="center"
                  gap={1}
                >
                  <StorefrontRounded
                    fontSize="small"
                    color="action"
                  />
                  <Stack minWidth={0}>
                    <Typography variant="body2">{row.store.name}</Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      noWrap
                    >
                      {row.store.address || '—'}
                    </Typography>
                  </Stack>
                </Stack>
              </TableCell>

              <TableCell>
                <Typography variant="caption">
                  {fmt(row.sweepstake?.startDate)} → {fmt(row.sweepstake?.endDate)}
                </Typography>
              </TableCell>

              <TableCell align="right">
                <Typography
                  variant="body2"
                  fontWeight={700}
                >
                  {row.participants.toLocaleString()}
                </Typography>
              </TableCell>

              <TableCell sx={{ minWidth: 150 }}>
                <Typography variant="caption">
                  {row.newUsers.toLocaleString()} · {row.existingUsers.toLocaleString()}
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={pctNuevos}
                  color="success"
                  sx={{ height: 6, borderRadius: 3, mt: 0.5 }}
                />
              </TableCell>

              <TableCell>
                {isNsa ? (
                  <Stack
                    direction="row"
                    gap={0.5}
                    flexWrap="wrap"
                  >
                    <Chip
                      size="small"
                      label={`Owner ${row.ownerManager}`}
                      color="warning"
                      variant="outlined"
                    />
                    <Chip
                      size="small"
                      label={`Seller ${row.sellerBrand}`}
                      color="info"
                      variant="outlined"
                    />
                    {row.noRole > 0 && (
                      <Chip
                        size="small"
                        label={`Sin rol ${row.noRole}`}
                        variant="outlined"
                      />
                    )}
                  </Stack>
                ) : (
                  <Typography
                    variant="caption"
                    color="text.secondary"
                  >
                    No aplica
                  </Typography>
                )}
              </TableCell>

              <TableCell>
                <Typography variant="caption">{fmt(row.lastRegisteredAt, true)}</Typography>
              </TableCell>

              {/* Soporte técnico configura las tablets con el link de kiosko: va
                  visible, no escondido detrás de un ícono. */}
              <TableCell sx={{ minWidth: 260 }}>
                <Stack gap={0.5}>
                  <LinkRow
                    label="Opt-in"
                    url={link}
                    empty="Falta el link del sorteo"
                    onCopy={onCopy}
                  />
                  <LinkRow
                    label="Kiosko"
                    url={kiosk}
                    empty="Sin slug"
                    onCopy={onCopy}
                  />
                </Stack>
              </TableCell>

              <TableCell align="right">
                <Stack
                  direction="row"
                  justifyContent="flex-end"
                  gap={0.5}
                >
                  {qrUrl && (
                    <Tooltip title="Abrir QR">
                      <IconButton
                        size="small"
                        component="a"
                        href={qrUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <QrCode2Rounded fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                  {row.sweepstake && (
                    <Tooltip title="Ver participantes">
                      <IconButton
                        size="small"
                        component={Link}
                        href={routes.admin.management.sweepstakes.stats(row.sweepstake._id)}
                      >
                        <InsightsRounded fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                  <Tooltip title="Exportar números (CSV)">
                    <Box component="span">
                      <IconButton
                        size="small"
                        disabled={exportingId === row.store._id}
                        onClick={() => onExport(row)}
                      >
                        {exportingId === row.store._id ? (
                          <CircularProgress size={16} />
                        ) : (
                          <DownloadRounded fontSize="small" />
                        )}
                      </IconButton>
                    </Box>
                  </Tooltip>
                </Stack>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
