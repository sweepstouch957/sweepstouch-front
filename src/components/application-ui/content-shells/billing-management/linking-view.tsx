'use client';

import { money } from '@/components/application-ui/content-shells/qbo-receivables/constants';
import type { QboProposal } from '@/services/qbo.service';
import { useQboLinkCustomers, useQboProposals } from '@hooks/fetching/qbo/useQbo';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import HelpOutlineRoundedIcon from '@mui/icons-material/HelpOutlineRounded';
import OpenInNewRoundedIcon from '@mui/icons-material/OpenInNewRounded';
import RemoveCircleOutlineRoundedIcon from '@mui/icons-material/RemoveCircleOutlineRounded';
import {
  Alert,
  AlertTitle,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  IconButton,
  LinearProgress,
  Paper,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from '@mui/material';
import { useRouter } from 'next/navigation';
import React, { useMemo, useState } from 'react';

type Filter = 'auto' | 'review' | 'none';

const META: Record<
  Filter,
  { label: string; color: 'success' | 'warning' | 'default'; icon: React.ReactNode; hint: string }
> = {
  auto: {
    label: 'Automáticas',
    color: 'success',
    icon: <CheckCircleRoundedIcon fontSize="small" />,
    hint: 'Número de calle y marca coinciden, y no hay empate. Se pueden aplicar de una.',
  },
  review: {
    label: 'A revisar',
    color: 'warning',
    icon: <HelpOutlineRoundedIcon fontSize="small" />,
    hint: 'Margen cero suele significar que QuickBooks tiene el local duplicado. Elegir uno parte el saldo.',
  },
  none: {
    label: 'Sin candidato',
    color: 'default',
    icon: <RemoveCircleOutlineRoundedIcon fontSize="small" />,
    hint: 'Ni el número de calle coincide. Se vinculan a mano desde la pestaña QuickBooks de cada tienda.',
  },
};

function ProposalRow({ p, onOpen }: { p: QboProposal; onOpen: (id: string) => void }) {
  const best = p.candidates[0];
  return (
    <TableRow hover>
      <TableCell>
        <Typography variant="body2"
fontWeight={600}>
          {p.storeName}
        </Typography>
        <Typography variant="caption"
color="text.secondary">
          {p.storeAddress}
        </Typography>
      </TableCell>

      <TableCell>
        {best ? (
          <>
            <Typography variant="body2"
fontWeight={600}>
              {best.qboName}
            </Typography>
            <Typography variant="caption"
color="text.secondary">
              {best.address || 'Sin dirección'}
            </Typography>
          </>
        ) : (
          <Typography variant="body2"
color="text.secondary">
            —
          </Typography>
        )}
      </TableCell>

      <TableCell>
        {best && (
          <Stack direction="row"
spacing={0.5}
flexWrap="wrap"
useFlexGap>
            {best.streetHit && <Chip size="small"
label="Calle"
color="success"
variant="outlined" />}
            {best.zipHit && <Chip size="small"
label="ZIP"
color="success"
variant="outlined" />}
            <Chip
              size="small"
              label={`Marca ${Math.round(best.brandSim * 100)}%`}
              color={best.brandSim >= 0.55 ? 'success' : 'warning'}
              variant="outlined"
            />
            {p.conflict && <Chip size="small"
label="Ya vinculado"
color="error" />}
          </Stack>
        )}
      </TableCell>

      <TableCell align="center">
        <Tooltip title={p.margin === 0 ? 'Empate: posible duplicado en QuickBooks' : 'Ventaja sobre el 2º candidato'}>
          <Typography
            variant="body2"
            fontWeight={600}
            color={p.margin === 0 ? 'warning.main' : 'text.secondary'}
          >
            {p.margin}
          </Typography>
        </Tooltip>
      </TableCell>

      <TableCell align="right">{best ? money(best.balance) : '—'}</TableCell>

      <TableCell align="right">
        <Tooltip title="Abrir la tienda para vincular a mano">
          <IconButton size="small"
onClick={() => onOpen(p.storeId)}>
            <OpenInNewRoundedIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </TableCell>
    </TableRow>
  );
}

/**
 * Estado de vinculación tienda ↔ cliente de QuickBooks.
 *
 * El emparejamiento va por dirección, no por nombre: medido contra producción,
 * el nombre exacto casaba 1 de 111 porque los sistemas los escriben distinto
 * ("Ctown Supermarket 910 18th Ave" vs "C-Town Supermarket - 910 18th Ave").
 */
export function LinkingView() {
  const router = useRouter();
  const proposals = useQboProposals();
  const apply = useQboLinkCustomers();
  const [filter, setFilter] = useState<Filter>('auto');

  const counts = proposals.data?.summary;
  const rows = useMemo(
    () => (proposals.data?.proposals ?? []).filter((p) => p.confidence === filter),
    [proposals.data, filter]
  );

  const openStore = (storeId: string) =>
    router.push(`/admin/management/stores/edit/${storeId}?tag=quickbooks`);

  if (proposals.isLoading) return <Skeleton variant="rounded"
height={320}
sx={{ borderRadius: 2 }} />;

  if (proposals.isError) {
    return (
      <Alert severity="error">
        {(proposals.error as Error)?.message || 'No se pudieron cargar las propuestas.'}
      </Alert>
    );
  }

  return (
    <Stack spacing={2.5}>
      <Stack direction={{ xs: 'column', md: 'row' }}
spacing={2}>
        {(Object.keys(META) as Filter[]).map((k) => (
          <Paper
            key={k}
            variant="outlined"
            sx={{
              p: 2,
              flex: 1,
              borderRadius: 2,
              cursor: 'pointer',
              borderColor: filter === k ? `${META[k].color === 'default' ? 'divider' : `${META[k].color}.main`}` : 'divider',
              borderWidth: filter === k ? 2 : 1,
            }}
            onClick={() => setFilter(k)}
          >
            <Stack direction="row"
alignItems="center"
spacing={1}>
              {META[k].icon}
              <Typography variant="caption"
fontWeight={700}
sx={{ textTransform: 'uppercase' }}>
                {META[k].label}
              </Typography>
            </Stack>
            <Typography variant="h3"
fontWeight={700}>
              {counts ? counts[k] : '—'}
            </Typography>
            <Typography variant="caption"
color="text.secondary">
              {META[k].hint}
            </Typography>
          </Paper>
        ))}
      </Stack>

      {filter === 'auto' && (counts?.auto ?? 0) > 0 && (
        <Alert
          severity="info"
          action={
            <Button size="small"
disabled={apply.isPending}
onClick={() => apply.mutate(true)}>
              Aplicar {counts?.auto}
            </Button>
          }
        >
          <AlertTitle>Vinculación en lote</AlertTitle>
          Solo se aplican las automáticas. Las de revisión se dejan fuera a propósito: un empate
          casi siempre es un cliente duplicado en QuickBooks.
        </Alert>
      )}

      <Card>
        {(proposals.isFetching || apply.isPending) && <LinearProgress />}
        <CardContent>
          <Stack direction="row"
justifyContent="space-between"
alignItems="center"
sx={{ mb: 1.5 }}>
            <Typography variant="subtitle1"
fontWeight={700}>
              {META[filter].label}
            </Typography>
            <ToggleButtonGroup
              size="small"
              exclusive
              value={filter}
              onChange={(_, v) => v && setFilter(v as Filter)}
            >
              {(Object.keys(META) as Filter[]).map((k) => (
                <ToggleButton key={k}
value={k}>
                  {META[k].label}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
          </Stack>

          {rows.length === 0 ? (
            <Box py={5}
textAlign="center">
              <Typography color="text.secondary">Nada en esta categoría.</Typography>
            </Box>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Tienda (Sweepstouch)</TableCell>
                    <TableCell>Mejor candidato (QuickBooks)</TableCell>
                    <TableCell>Evidencia</TableCell>
                    <TableCell align="center">Margen</TableCell>
                    <TableCell align="right">Debe</TableCell>
                    <TableCell align="right" />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.map((p) => (
                    <ProposalRow key={p.storeId}
p={p}
onOpen={openStore} />
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>
    </Stack>
  );
}

export default LinkingView;
