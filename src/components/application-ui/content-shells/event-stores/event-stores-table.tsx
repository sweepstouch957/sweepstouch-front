'use client';

/** Tabla del módulo Eventos. Presentacional: recibe filas y callbacks por props. */

import type { EventStoreRow } from '@/services/sweepstakes.service';
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

/** El link que se imprime en el QR y se carga en la tablet. */
export function optinLink(row: EventStoreRow): string {
  const base = row.sweepstake?.confirmationLink?.replace(/\/+$/, '');
  if (base) return `${base}/${row.store.slug}`;
  return row.store.genericOptinLink || '';
}

function fmt(d?: string | null, withTime = false): string {
  if (!d) return '—';
  const parsed = new Date(d);
  if (Number.isNaN(parsed.getTime())) return '—';
  return format(parsed, withTime ? 'dd/MM/yyyy HH:mm' : 'dd/MM/yyyy');
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

              <TableCell align="right">
                <Stack
                  direction="row"
                  justifyContent="flex-end"
                  gap={0.5}
                >
                  {link && (
                    <Tooltip title={`Copiar link: ${link}`}>
                      <IconButton
                        size="small"
                        onClick={() => onCopy(link)}
                      >
                        <ContentCopyRounded fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
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
