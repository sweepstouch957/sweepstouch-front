'use client';

import {
  EmptyBlock,
  KpiCard,
  KpiRow,
  PanelCard,
  SectionHeader,
} from '@/components/application-ui/content-shells/store-managment/panel-kit';
import { money } from '@/components/application-ui/content-shells/qbo-receivables/constants';
import type { QboDraft } from '@/services/qbo.service';
import { useQboCreateDrafts, useQboDrafts } from '@hooks/fetching/qbo/useQbo';
import CampaignRoundedIcon from '@mui/icons-material/CampaignRounded';
import CardMembershipRoundedIcon from '@mui/icons-material/CardMembershipRounded';
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded';
import HowToRegRoundedIcon from '@mui/icons-material/HowToRegRounded';
import PendingActionsRoundedIcon from '@mui/icons-material/PendingActionsRounded';
import ReceiptLongRoundedIcon from '@mui/icons-material/ReceiptLongRounded';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import {
  Alert,
  AlertTitle,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Collapse,
  Divider,
  IconButton,
  LinearProgress,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material';
import { useMemo, useState } from 'react';
import { ConfirmCreateDialog } from './confirm-create-dialog';

const KIND = {
  campaign: { label: 'Campaña', icon: <CampaignRoundedIcon sx={{ fontSize: 15 }} /> },
  optin: { label: 'Opt-in', icon: <HowToRegRoundedIcon sx={{ fontSize: 15 }} /> },
  membership: { label: 'Membresía', icon: <CardMembershipRoundedIcon sx={{ fontSize: 15 }} /> },
} as const;

function DraftRow({
  draft,
  checked,
  onToggle,
}: {
  draft: QboDraft;
  checked: boolean;
  onToggle: () => void;
}) {
  const [open, setOpen] = useState(false);
  const counts = draft.lines.reduce<Record<string, number>>((a, l) => {
    a[l.kind] = (a[l.kind] || 0) + 1;
    return a;
  }, {});

  return (
    <>
      <TableRow hover
sx={{ '& td': { borderColor: 'divider', py: 1 } }}>
        <TableCell padding="checkbox">
          <Checkbox size="small"
checked={checked}
onChange={onToggle} />
        </TableCell>

        <TableCell>
          <Typography variant="body2"
fontWeight={600}
lineHeight={1.3}>
            {draft.storeName}
          </Typography>
          <Stack direction="row"
spacing={0.5}
sx={{ mt: 0.5 }}
flexWrap="wrap"
useFlexGap>
            {Object.entries(counts).map(([k, n]) => (
              <Chip
                key={k}
                size="small"
                variant="outlined"
                icon={KIND[k as keyof typeof KIND]?.icon}
                label={n > 1 ? `${KIND[k as keyof typeof KIND]?.label} ×${n}` : KIND[k as keyof typeof KIND]?.label}
                sx={{ height: 19, '& .MuiChip-label': { px: 0.6, fontSize: '0.65rem' } }}
              />
            ))}
            {draft.membershipType && (
              <Chip
                size="small"
                label={draft.membershipType}
                sx={{ height: 19, '& .MuiChip-label': { px: 0.6, fontSize: '0.65rem' } }}
              />
            )}
          </Stack>
        </TableCell>

        <TableCell align="right"
sx={{ whiteSpace: 'nowrap' }}>
          <Typography variant="body2"
fontWeight={700}>
            {money(draft.total)}
          </Typography>
        </TableCell>

        <TableCell align="center"
sx={{ width: 44 }}>
          {draft.warnings.length > 0 && (
            <Tooltip title={draft.warnings.join(' · ')}>
              <WarningAmberRoundedIcon sx={{ fontSize: 17, color: 'warning.main' }} />
            </Tooltip>
          )}
        </TableCell>

        <TableCell align="right"
sx={{ width: 44 }}>
          <IconButton size="small"
onClick={() => setOpen((v) => !v)}
aria-label="Ver detalle">
            <ExpandMoreRoundedIcon
              sx={{ fontSize: 18, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }}
            />
          </IconButton>
        </TableCell>
      </TableRow>

      <TableRow>
        <TableCell colSpan={5}
sx={{ p: 0, border: 0 }}>
          <Collapse in={open}
unmountOnExit>
            <Box sx={{ px: 2, py: 1.5, bgcolor: 'action.hover' }}>
              <Table size="small">
                <TableBody>
                  {draft.lines.map((l, i) => (
                    <TableRow key={i}>
                      <TableCell sx={{ border: 0, py: 0.5, width: 96 }}>
                        <Chip
                          size="small"
                          variant="outlined"
                          label={KIND[l.kind]?.label ?? l.kind}
                          sx={{ height: 18, '& .MuiChip-label': { px: 0.6, fontSize: '0.62rem' } }}
                        />
                      </TableCell>
                      <TableCell sx={{ border: 0, py: 0.5 }}>
                        <Typography variant="caption">{l.description}</Typography>
                        {l.source && (
                          <Typography variant="caption"
color="text.secondary"
sx={{ display: 'block' }}>
                            {l.source}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell align="right"
sx={{ border: 0, py: 0.5, whiteSpace: 'nowrap' }}>
                        {l.quantity ? (
                          <Typography variant="caption"
color="text.secondary">
                            {`${l.quantity.toLocaleString()} × ${money(l.unitPrice ?? 0)}`}
                          </Typography>
                        ) : null}
                      </TableCell>
                      <TableCell align="right"
sx={{ border: 0, py: 0.5, whiteSpace: 'nowrap' }}>
                        <Typography variant="caption"
fontWeight={700}>
                          {money(l.amount)}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {draft.skipped.length > 0 && (
                <Typography variant="body2"
color="text.secondary"
sx={{ display: 'block', mt: 1 }}>
                  {`${draft.skipped.filter((s) => s.reason === 'ya_facturada').length} cargo(s) omitidos por estar ya facturados en QuickBooks`}
                </Typography>
              )}
              {draft.warnings.map((w) => (
                <Typography key={w}
variant="caption"
color="warning.main"
sx={{ display: 'block', mt: 0.5 }}>
                  {w}
                </Typography>
              ))}
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
}

/**
 * Prefacturas de la semana (jueves→martes).
 *
 * Nada se emite sin confirmación explícita: la lista es una propuesta, y crear
 * facturas en QuickBooks es irreversible desde acá.
 */
export function DraftsView() {
  const [weekStart, setWeekStart] = useState<string | null>(null);
  const drafts = useQboDrafts(weekStart);
  const create = useQboCreateDrafts();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirmOpen, setConfirmOpen] = useState(false);

  const list = drafts.data?.drafts ?? [];
  const win = drafts.data?.window;
  const totals = drafts.data?.totals;

  const chosen = useMemo(() => list.filter((d) => selected.has(d.storeId)), [list, selected]);
  const chosenTotal = chosen.reduce((s, d) => s + d.total, 0);
  const allOn = list.length > 0 && selected.size === list.length;

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const shiftWeek = (days: number) => {
    const base = win ? new Date(`${win.from}T12:00:00Z`) : new Date();
    base.setUTCDate(base.getUTCDate() + days);
    setWeekStart(base.toISOString().slice(0, 10));
    setSelected(new Set());
  };

  if (drafts.isLoading) {
    return (
      <Stack gap={2}>
        <KpiRow>
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i}
variant="rounded"
height={92}
sx={{ borderRadius: '18px' }} />
          ))}
        </KpiRow>
        <Skeleton variant="rounded"
height={320}
sx={{ borderRadius: '18px' }} />
      </Stack>
    );
  }

  if (drafts.isError) {
    return (
      <Alert severity="error">
        {(drafts.error as any)?.response?.data?.message ||
          (drafts.error as Error)?.message ||
          'No se pudieron armar las prefacturas.'}
      </Alert>
    );
  }

  return (
    <Stack gap={2.5}>
      {/* El aviso que pediste: que se note que hay algo nuevo por revisar */}
      {list.length > 0 && (
        <Alert
          severity="info"
          icon={<PendingActionsRoundedIcon />}
          action={
            <Button size="small"
onClick={() => setSelected(new Set(list.map((d) => d.storeId)))}>
              Seleccionar todas
            </Button>
          }
        >
          <AlertTitle sx={{ mb: 0 }}>
            {`${list.length} prefacturas listas para revisar · ${money(totals?.amount ?? 0)}`}
          </AlertTitle>
          <Typography variant="body2">
            {`Semana del ${win?.from} al ${win?.to}. Ninguna se crea en QuickBooks hasta que la confirmes.`}
          </Typography>
        </Alert>
      )}

      {(drafts.data?.warnings ?? []).map((w) => (
        <Alert key={w}
severity="warning"
sx={{ py: 0.25 }}>
          <Typography variant="caption">{w}</Typography>
        </Alert>
      ))}

      <KpiRow>
        <KpiCard
          icon={<ReceiptLongRoundedIcon />}
          label="Total a facturar"
          value={money(totals?.amount ?? 0)}
          delta={`${totals?.drafts ?? 0} tiendas`}
        />
        <KpiCard
          icon={<CampaignRoundedIcon />}
          label="Campañas"
          value={money(totals?.campaigns ?? 0)}
          delta={`${totals?.alreadyBilled ?? 0} ya facturadas, omitidas`}
        />
        <KpiCard
          icon={<HowToRegRoundedIcon />}
          label="Opt-in"
          value={money(totals?.optin ?? 0)}
          // El conteo real es el punto: antes se cobraba una cifra plana
          delta={`${(totals?.optinSent ?? 0).toLocaleString()} MMS enviados`}
        />
        <KpiCard
          icon={<CardMembershipRoundedIcon />}
          label="Membresías"
          value={money(totals?.membership ?? 0)}
          delta={
            (totals?.withoutMembership ?? 0) > 0
              ? `${totals?.withoutMembership} sin precio previo`
              : 'leídas de QuickBooks'
          }
          tone={(totals?.withoutMembership ?? 0) > 0 ? 'warning' : 'neutral'}
        />
      </KpiRow>

      <PanelCard sx={{ overflow: 'hidden' }}>
        {(drafts.isFetching || create.isPending) && <LinearProgress sx={{ height: 2 }} />}
        <SectionHeader
          icon={<PendingActionsRoundedIcon />}
          title={`Semana ${win?.from ?? ''} → ${win?.to ?? ''}`}
          hint={win ? `Se cierra el ${win.closesOn}` : undefined}
          count={list.length}
          action={
            <Stack direction="row"
spacing={0.5}
alignItems="center">
              <Button size="small"
onClick={() => shiftWeek(-6)}>
                Anterior
              </Button>
              <Button size="small"
onClick={() => shiftWeek(6)}>
                Siguiente
              </Button>
              {weekStart && (
                <Button size="small"
color="inherit"
onClick={() => { setWeekStart(null); setSelected(new Set()); }}>
                  Actual
                </Button>
              )}
            </Stack>
          }
        />

        <Box sx={{ px: 2.25, pb: 1 }}>
          {list.length === 0 ? (
            <EmptyBlock
              title="Nada que facturar esta semana"
              hint="No hay campañas, opt-in ni membresías pendientes en la ventana. Prueba con la semana anterior."
            />
          ) : (
            <>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell padding="checkbox">
                      <Checkbox
                        size="small"
                        checked={allOn}
                        indeterminate={selected.size > 0 && !allOn}
                        onChange={() =>
                          setSelected(allOn ? new Set() : new Set(list.map((d) => d.storeId)))
                        }
                      />
                    </TableCell>
                    <TableCell>Tienda</TableCell>
                    <TableCell align="right">Total</TableCell>
                    <TableCell align="center" />
                    <TableCell align="right" />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {list.map((d) => (
                    <DraftRow
                      key={d.storeId}
                      draft={d}
                      checked={selected.has(d.storeId)}
                      onToggle={() => toggle(d.storeId)}
                    />
                  ))}
                </TableBody>
              </Table>

              <Divider sx={{ my: 1.5 }} />

              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                justifyContent="space-between"
                alignItems={{ xs: 'stretch', sm: 'center' }}
                spacing={1.5}
                sx={{ pb: 1 }}
              >
                <Typography variant="body2"
color="text.secondary">
                  {selected.size
                    ? `${selected.size} seleccionadas · ${money(chosenTotal)}`
                    : 'Selecciona las que quieras emitir'}
                </Typography>
                <Button
                  variant="contained"
                  disabled={!selected.size || create.isPending}
                  startIcon={create.isPending ? <CircularProgress size={14}
color="inherit" /> : undefined}
                  onClick={() => setConfirmOpen(true)}
                >
                  {`Crear ${selected.size || ''} en QuickBooks`.trim()}
                </Button>
              </Stack>
            </>
          )}
        </Box>
      </PanelCard>

      <ConfirmCreateDialog
        open={confirmOpen}
        drafts={chosen}
        total={chosenTotal}
        window={win}
        busy={create.isPending}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() =>
          create.mutate(
            { weekStart, storeIds: chosen.map((d) => d.storeId) },
            {
              onSuccess: () => {
                setConfirmOpen(false);
                setSelected(new Set());
              },
            }
          )
        }
      />
    </Stack>
  );
}

export default DraftsView;
