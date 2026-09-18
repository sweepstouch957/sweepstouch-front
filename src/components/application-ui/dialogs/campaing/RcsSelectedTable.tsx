'use client';

/**
 * Registro de los números SELECCIONADOS para RCS en una campaña (piloto mixed /
 * canal rcs) y qué pasó con cada uno: entregado por RCS, llegó por failover
 * (MMS/SMS) o falló. "Copiar fallidos" deja los teléfonos listos para reintentar.
 */

import { useCampaignLogs } from '@/hooks/fetching/campaigns/useCampaignLogs';
import type { CampaignLog } from '@/services/campaing.service';
import {
  Box,
  Button,
  Chip,
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

export default function RcsSelectedTable({ campaignId }: { campaignId: string }) {
  const [onlyFailed, setOnlyFailed] = useState(false);
  const [copied, setCopied] = useState(false);

  // ponytail: una sola página de 200 (tope del endpoint). El piloto elige ≤50 o el 10%
  // de los que tienen nombre; si una campaña supera 200 elegidos, paginar acá.
  const { data, isLoading } = useCampaignLogs(
    campaignId,
    { channel: 'rcs', rcsFailed: onlyFailed, limit: 200, sort: 'asc' },
    { staleTime: 30_000 }
  );

  const rows = data?.data ?? [];
  const failedPhones = [
    ...new Set(rows.filter((r) => outcomeOf(r).color !== 'success' && outcomeOf(r).color !== 'default').map((r) => last10(r.phone))),
  ].filter(Boolean);

  const copyFailed = async () => {
    try {
      await navigator.clipboard.writeText(failedPhones.join('\n'));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard bloqueado: la lista igual queda visible en la tabla */
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
            disabled={!failedPhones.length}
            onClick={copyFailed}
          >
            {copied ? 'Copiado' : `Copiar fallidos (${failedPhones.length})`}
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
