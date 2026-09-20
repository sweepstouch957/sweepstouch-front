'use client';

/**
 * Registro de los números SELECCIONADOS para RCS en una campaña (piloto mixed /
 * canal rcs) y qué pasó con cada uno: entregado por RCS, llegó por failover
 * (MMS/SMS) o falló. "Copiar fallidos" deja los teléfonos listos para reintentar.
 */

import { useCampaignLogs } from '@/hooks/fetching/campaigns/useCampaignLogs';
import { campaignClient, type CampaignLog } from '@/services/campaing.service';
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import { useState } from 'react';
import toast from 'react-hot-toast';

type Outcome = { label: string; color: 'success' | 'warning' | 'error' | 'default' };

function outcomeOf(row: CampaignLog): Outcome {
  const status = String(row.status);
  // Failover = entregado PERO conserva el errorCode del RCS (ej. 7002). Un RCS entregado
  // nunca trae errorCode. messageType no sirve: el webhook etiqueta "sms" a RCS reales.
  const code = String(row.errorCode || '');
  if (status === 'sent' && code && code !== '0') {
    const via = String(row.messageType || '').toLowerCase();
    return { label: `Llegó por ${via === 'mms' ? 'MMS' : 'SMS/MMS'} (failover)`, color: 'warning' };
  }
  if (status === 'sent') return { label: row.seenAt ? 'RCS entregado · visto' : 'RCS entregado', color: 'success' };
  if (status === 'error') return { label: 'RCS falló', color: 'error' };
  return { label: 'Pendiente', color: 'default' };
}

const last10 = (p?: string) => String(p || '').replace(/\D/g, '').slice(-10);

const isFailedRow = (r: CampaignLog) => {
  const c = outcomeOf(r).color;
  return c !== 'success' && c !== 'default';
};

const PAGE_SIZE = 200; // tope del endpoint
const COPY_CAP = 5000;

export default function RcsSelectedTable({ campaignId }: { campaignId: string }) {
  const [onlyFailed, setOnlyFailed] = useState(false);
  const [copying, setCopying] = useState(false);

  // La tabla muestra una sola página de 200 (tope del endpoint). "Copiar fallidos"
  // no depende de ella: recorre TODAS las páginas de fallidos (ver copyFailed).
  const { data, isLoading } = useCampaignLogs(
    campaignId,
    { channel: 'rcs', rcsFailed: onlyFailed, limit: PAGE_SIZE, sort: 'asc' },
    { staleTime: 30_000 }
  );
  // Total real de fallidos para el botón. Con el filtro "RCS no llegó" activo es la
  // misma query que la de arriba (misma key): no hay una llamada extra.
  const { data: failedData } = useCampaignLogs(
    campaignId,
    { channel: 'rcs', rcsFailed: true, limit: PAGE_SIZE, sort: 'asc' },
    { staleTime: 30_000 }
  );

  const rows = data?.data ?? [];
  const failedTotal = failedData?.total ?? 0;

  const copyFailed = async () => {
    if (copying) return;
    setCopying(true);
    try {
      const phones = new Set<string>();
      let capped = false;
      for (let page = 1; ; page++) {
        const res = await campaignClient.getCampaignLogs(campaignId, {
          channel: 'rcs',
          rcsFailed: true,
          limit: PAGE_SIZE,
          sort: 'asc',
          page,
        });
        const batch = res?.data ?? [];
        for (const r of batch) {
          if (!isFailedRow(r)) continue;
          const p = last10(r.phone || r.destinationTn);
          if (p) phones.add(p);
          if (phones.size >= COPY_CAP) break;
        }
        if (phones.size >= COPY_CAP) {
          capped = page < (res?.totalPages ?? page) || batch.length === PAGE_SIZE;
          break;
        }
        // Fin: página vacía/incompleta, última página, o tope de páginas por seguridad.
        if (batch.length < PAGE_SIZE || page >= (res?.totalPages ?? page) || page * PAGE_SIZE >= COPY_CAP * 2) break;
      }

      if (!phones.size) {
        toast('No hay números fallidos para copiar.');
        return;
      }
      await navigator.clipboard.writeText([...phones].join('\n'));
      const n = phones.size.toLocaleString();
      toast.success(
        capped
          ? `Se copiaron ${n} números (tope de ${COPY_CAP.toLocaleString()}; hay más fallidos).`
          : `Se copiaron ${n} número${phones.size !== 1 ? 's' : ''} fallido${phones.size !== 1 ? 's' : ''}.`
      );
    } catch {
      toast.error('No se pudieron copiar los fallidos. Probá de nuevo.');
    } finally {
      setCopying(false);
    }
  };

  return (
    <Box mt={2.5}>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        flexWrap="wrap"
        gap={1}
        mb={1}
      >
        <Typography
          variant="subtitle2"
          fontWeight={700}
        >
          Seleccionados para RCS{data ? ` (${data.total})` : ''}
        </Typography>
        <Stack
          direction="row"
          spacing={1}
          alignItems="center"
        >
          <ToggleButtonGroup
            size="small"
            exclusive
            value={onlyFailed ? 'failed' : 'all'}
            onChange={(_e, v) => v && setOnlyFailed(v === 'failed')}
          >
            <ToggleButton value="all">Todos</ToggleButton>
            <ToggleButton value="failed">RCS no llegó</ToggleButton>
          </ToggleButtonGroup>
          <Button
            size="small"
            variant="outlined"
            disabled={!failedTotal || copying}
            onClick={copyFailed}
            startIcon={
              copying ? (
                <CircularProgress
                  size={14}
                  color="inherit"
                />
              ) : undefined
            }
          >
            {copying ? 'Copiando…' : `Copiar fallidos (${failedTotal.toLocaleString()})`}
          </Button>
        </Stack>
      </Stack>

      {isLoading ? (
        <Skeleton
          variant="rounded"
          height={120}
        />
      ) : rows.length === 0 ? (
        <Typography
          variant="body2"
          color="text.secondary"
        >
          {onlyFailed ? 'A todos los seleccionados les llegó el RCS.' : 'Esta campaña no seleccionó números para RCS.'}
        </Typography>
      ) : (
        <Box sx={{ overflowX: 'auto' }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Teléfono</TableCell>
                <TableCell>Resultado</TableCell>
                <TableCell>Motivo del RCS</TableCell>
                <TableCell>Estado proveedor</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((r, i) => {
                const o = outcomeOf(r);
                return (
                  <TableRow key={`${r.messageSid || r.phone}-${i}`}>
                    <TableCell sx={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{r.phone}</TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        color={o.color}
                        variant={o.color === 'default' ? 'outlined' : 'filled'}
                        label={o.label}
                      />
                    </TableCell>
                    <TableCell sx={{ color: 'text.secondary' }}>
                      {o.color === 'success' || o.color === 'default'
                        ? '—'
                        : [r.errorCode, r.errorMessage].filter(Boolean).join(' · ') || 'Sin detalle'}
                    </TableCell>
                    <TableCell sx={{ color: 'text.secondary' }}>{r.bwMessageStatus || '—'}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Box>
      )}
    </Box>
  );
}
