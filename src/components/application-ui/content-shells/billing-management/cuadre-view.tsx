'use client';

import { fmtDate, money } from '@/components/application-ui/content-shells/qbo-receivables/constants';
import { EmptyBlock } from '@/components/application-ui/content-shells/store-managment/panel-kit';
import type { QboCuadreRow } from '@/services/qbo.service';
import { useQboCuadre, useQboRefreshCuadre } from '@hooks/fetching/qbo/useQbo';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import LinkOffRoundedIcon from '@mui/icons-material/LinkOffRounded';
import PriceChangeRoundedIcon from '@mui/icons-material/PriceChangeRounded';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import TrendingDownRoundedIcon from '@mui/icons-material/TrendingDownRounded';
import TrendingUpRoundedIcon from '@mui/icons-material/TrendingUpRounded';
import type { SvgIconComponent } from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Chip,
  InputAdornment,
  LinearProgress,
  Paper,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
  alpha,
  useTheme,
} from '@mui/material';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';

type View = 'todas' | 'falta' | 'sobra' | 'sin_vinculo';

const FLAG_LABEL: Record<string, { label: string; tone: 'default' | 'warning' | 'error' | 'info' }> = {
  tarifa_cruzada: { label: 'Tarifa cruzada', tone: 'error' },
  cortesia: { label: 'En cortesía', tone: 'info' },
  sin_facturas: { label: 'Sin facturas', tone: 'warning' },
  de_baja: { label: 'De baja', tone: 'default' },
  sin_fecha_contrato: { label: 'Sin fecha de contrato', tone: 'warning' },
};

function StateCard({
  icon: Icon,
  tone,
  title,
  question,
  value,
  detail,
  active,
  onClick,
}: {
  icon: SvgIconComponent;
  tone: 'success' | 'error' | 'warning' | 'info';
  title: string;
  question: string;
  value: string;
  detail: string;
  active?: boolean;
  onClick?: () => void;
}) {
  const theme = useTheme();
  const color = theme.palette[tone].main;
  return (
    <Paper
      variant="outlined"
      onClick={onClick}
      sx={{
        p: 2,
        flex: 1,
        borderRadius: 2,
        minWidth: 0,
        cursor: onClick ? 'pointer' : 'default',
        borderColor: active ? color : 'divider',
        borderWidth: active ? 2 : 1,
        bgcolor: active ? alpha(color, 0.04) : 'transparent',
      }}
    >
      <Stack direction="row"
alignItems="center"
spacing={1}
sx={{ mb: 0.5 }}>
        <Icon sx={{ fontSize: 19, color }} />
        <Typography variant="subtitle2"
fontWeight={700}>
          {title}
        </Typography>
      </Stack>
      <Typography variant="body2"
color="text.secondary"
sx={{ mb: 1, minHeight: 40 }}>
        {question}
      </Typography>
      <Typography variant="h4"
fontWeight={700}
sx={{ fontVariantNumeric: 'tabular-nums', lineHeight: 1.2 }}>
        {value}
      </Typography>
      <Typography variant="body2"
color="text.secondary">
        {detail}
      </Typography>
    </Paper>
  );
}

/** Saldo con signo y color: verde al día, rojo falta, naranja se cobró de más. */
function Saldo({ value, tolerance }: { value: number; tolerance: number }) {
  const theme = useTheme();
  const color =
    Math.abs(value) <= tolerance
      ? theme.palette.success.main
      : value < 0
        ? theme.palette.error.main
        : theme.palette.warning.main;
  return (
    <Typography
      variant="body2"
      fontWeight={700}
      sx={{ color, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}
    >
      {value > 0 ? '+' : ''}
      {money(value)}
    </Typography>
  );
}

/** Par "esperado vs facturado" en una celda, con el saldo debajo. */
function VsCell({ top, bottom, saldo, tolerance }: { top: string; bottom: string; saldo: number; tolerance: number }) {
  return (
    <Box sx={{ textAlign: 'right' }}>
      <Typography variant="body2"
sx={{ fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
        {top}
      </Typography>
      <Typography variant="caption"
color="text.secondary"
sx={{ fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap', display: 'block' }}>
        {bottom}
      </Typography>
      <Saldo value={saldo}
tolerance={tolerance} />
    </Box>
  );
}

/**
 * Cuadre acumulado contra QuickBooks.
 *
 * Responde "¿está al día esta tienda?" en vez de "¿cuadra julio?": con la
 * facturación histórica emitida hasta tres semanas tarde no existe corte
 * mensual que cuadre, así que se compara todo lo esperado desde el inicio de
 * contrato contra todo lo facturado, sin asignarle mes a nada.
 */
export function CuadreView() {
  const router = useRouter();
  const [view, setView] = useState<View>('todas');
  const [search, setSearch] = useState('');
  const { data, isLoading, isError, refetch } = useQboCuadre();
  const refresh = useQboRefreshCuadre();

  const rows = useMemo(() => {
    if (!data) return [];
    const q = search.trim().toLowerCase();
    let list: QboCuadreRow[] = data.stores;
    if (view === 'falta') list = list.filter((r) => r.status === 'falta');
    if (view === 'sobra') list = list.filter((r) => r.status === 'sobra');
    if (q) list = list.filter((r) => r.storeName?.toLowerCase().includes(q) || r.customerName?.toLowerCase().includes(q));
    return list;
  }, [data, view, search]);

  const unlinked = useMemo(() => {
    if (!data) return [];
    const q = search.trim().toLowerCase();
    return q ? data.unlinked.filter((u) => u.customerName?.toLowerCase().includes(q)) : data.unlinked;
  }, [data, search]);

  if (isLoading) {
    return (
      <Stack spacing={2}>
        <Skeleton variant="rounded"
height={120} />
        <Skeleton variant="rounded"
height={420} />
      </Stack>
    );
  }

  if (isError || !data?.ok) {
    return (
      <Alert
        severity="error"
        action={
          <Button color="inherit"
size="small"
onClick={() => refetch()}>
            Reintentar
          </Button>
        }
      >
        No se pudo calcular el cuadre contra QuickBooks.
      </Alert>
    );
  }

  const t = data.totals;

  return (
    <Stack spacing={2.5}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        spacing={1}
      >
        <Typography variant="body2"
color="text.secondary">
          Acumulado por tienda desde su inicio de contrato hasta el domingo {fmtDate(data.cutoff)}. Tarifas: semanal{' '}
          {money(data.rates.semanal)} · mensual {money(data.rates.mensual)}.
        </Typography>
        <Button
          size="small"
          variant="outlined"
          startIcon={<RefreshRoundedIcon />}
          disabled={refresh.isPending}
          onClick={() => refresh.mutate()}
        >
          Actualizar desde QuickBooks
        </Button>
      </Stack>
      {refresh.isPending && <LinearProgress />}

      <Stack direction={{ xs: 'column', md: 'row' }}
spacing={1.5}>
        <StateCard
          icon={CheckCircleRoundedIcon}
          tone="success"
          title="Al día"
          question="¿Cuántas tiendas cuadran con QuickBooks?"
          value={String(data.counts.alDia)}
          detail={`de ${data.counts.stores} vinculadas`}
          active={view === 'todas'}
          onClick={() => setView('todas')}
        />
        <StateCard
          icon={TrendingDownRoundedIcon}
          tone="error"
          title="Falta facturar"
          question="¿A quién se le cobró menos de lo que debía?"
          value={String(data.counts.falta)}
          detail="tiendas con saldo negativo"
          active={view === 'falta'}
          onClick={() => setView('falta')}
        />
        <StateCard
          icon={TrendingUpRoundedIcon}
          tone="warning"
          title="Se cobró de más"
          question="¿A quién se le cobró por encima de lo esperado?"
          value={String(data.counts.sobra)}
          detail="tiendas con saldo positivo"
          active={view === 'sobra'}
          onClick={() => setView('sobra')}
        />
        <StateCard
          icon={LinkOffRoundedIcon}
          tone="info"
          title="Sin vincular"
          question="¿Cuánto dinero facturado no tiene tienda donde aparecer?"
          value={money(t.unlinkedBilled)}
          detail={`${data.counts.unlinked} clientes de QuickBooks`}
          active={view === 'sin_vinculo'}
          onClick={() => setView('sin_vinculo')}
        />
      </Stack>

      {data.counts.crossRate > 0 && (
        <Alert severity="error"
icon={<PriceChangeRoundedIcon />}>
          {data.counts.crossRate} {data.counts.crossRate === 1 ? 'tienda tiene' : 'tiendas tienen'} tarifa cruzada: el
          último cobro de membresía en QuickBooks no es la tarifa de su plan. Hay que corregirlo allá — la prefactura ya
          no la repite, pero el histórico queda descuadrado hasta ajustarlo.
        </Alert>
      )}

      <TextField
        size="small"
        placeholder="Buscar tienda o cliente…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        sx={{ maxWidth: 360 }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchRoundedIcon fontSize="small" />
            </InputAdornment>
          ),
        }}
      />

      {view === 'sin_vinculo' ? (
        <Paper variant="outlined"
sx={{ borderRadius: 2, overflowX: 'auto' }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Cliente en QuickBooks</TableCell>
                <TableCell align="right">Facturado</TableCell>
                <TableCell align="right">Membresía</TableCell>
                <TableCell align="center">Facturas</TableCell>
                <TableCell>Última emisión</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {unlinked.map((u) => (
                <TableRow key={u.qboCustomerId}
hover>
                  <TableCell>{u.customerName || u.qboCustomerId}</TableCell>
                  <TableCell align="right"
sx={{ fontVariantNumeric: 'tabular-nums' }}>
                    {money(u.billedTotal)}
                  </TableCell>
                  <TableCell align="right"
sx={{ fontVariantNumeric: 'tabular-nums' }}>
                    {money(u.membership)}
                  </TableCell>
                  <TableCell align="center">{u.invoices}</TableCell>
                  <TableCell>{u.lastIssued ? fmtDate(u.lastIssued) : '—'}</TableCell>
                </TableRow>
              ))}
              {!unlinked.length && (
                <TableRow>
                  <TableCell colSpan={5}>
                    <EmptyBlock title="Nada por aquí"
hint="Todos los clientes facturados tienen tienda vinculada." />
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Paper>
      ) : (
        <Paper variant="outlined"
sx={{ borderRadius: 2, overflowX: 'auto' }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Tienda</TableCell>
                <TableCell>Se cobra desde</TableCell>
                <TableCell align="right">
                  Membresía
                  <Typography variant="caption"
display="block"
color="text.secondary">
                    facturada / esperada
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  Campañas
                  <Typography variant="caption"
display="block"
color="text.secondary">
                    facturadas / sistema
                  </Typography>
                </TableCell>
                <TableCell align="right">Otros cobros</TableCell>
                <TableCell align="right">Créditos</TableCell>
                <TableCell align="right">Saldo</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((r) => (
                <TableRow
                  key={r.storeId}
                  hover
                  onClick={() => router.push(`/admin/management/stores/edit/${r.storeId}?tag=quickbooks`)}
                  sx={{ cursor: 'pointer' }}
                >
                  <TableCell sx={{ maxWidth: 260 }}>
                    <Typography variant="body2"
fontWeight={600}
noWrap>
                      {r.storeName}
                    </Typography>
                    <Stack direction="row"
spacing={0.5}
sx={{ mt: 0.25, flexWrap: 'wrap' }}>
                      {r.membershipType && (
                        <Chip size="small"
variant="outlined"
label={r.membershipType} />
                      )}
                      {r.flags.map((f) => (
                        <Chip
                          key={f}
                          size="small"
                          color={FLAG_LABEL[f]?.tone === 'default' ? undefined : (FLAG_LABEL[f]?.tone as any)}
                          variant="outlined"
                          label={FLAG_LABEL[f]?.label ?? f}
                        />
                      ))}
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Tooltip
                      title={
                        r.basis === 'contrato'
                          ? 'Desde la fecha de contrato, descontado el mes de cortesía'
                          : r.basis === 'primera-factura'
                            ? 'La tienda no tiene fecha de contrato: se usa su primera factura'
                            : 'Sin fecha de contrato ni facturas: no se puede calcular lo esperado'
                      }
                    >
                      <Typography variant="body2"
sx={{ whiteSpace: 'nowrap' }}>
                        {r.chargeFrom ? fmtDate(r.chargeFrom) : '—'}
                      </Typography>
                    </Tooltip>
                  </TableCell>
                  <TableCell align="right">
                    <VsCell
                      top={money(r.membership.billed)}
                      bottom={`${money(r.membership.expected)} (${r.membership.units} × ${money(r.membership.unitFee)})`}
                      saldo={r.membership.saldo}
                      tolerance={data.tolerance}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <VsCell
                      top={money(r.campaigns.billed)}
                      bottom={`${money(r.campaigns.system)} (${r.campaigns.count} campañas)`}
                      saldo={r.campaigns.saldo}
                      tolerance={data.tolerance}
                    />
                  </TableCell>
                  <TableCell align="right"
sx={{ fontVariantNumeric: 'tabular-nums' }}>
                    <Tooltip title={`Opt-in ${money(r.optinBilled)} · Setup ${money(r.setupBilled)} · Otros ${money(r.otrosBilled)} — informativos, no entran al saldo`}>
                      <span>{money(r.optinBilled + r.setupBilled + r.otrosBilled)}</span>
                    </Tooltip>
                  </TableCell>
                  <TableCell align="right"
sx={{ fontVariantNumeric: 'tabular-nums' }}>
                    {r.credits ? `−${money(r.credits)}` : '—'}
                  </TableCell>
                  <TableCell align="right">
                    <Saldo value={r.saldo}
tolerance={data.tolerance} />
                  </TableCell>
                </TableRow>
              ))}
              {!rows.length && (
                <TableRow>
                  <TableCell colSpan={7}>
                    <EmptyBlock title="Sin resultados"
hint="Ninguna tienda coincide con el filtro." />
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Paper>
      )}

      <Typography variant="caption"
color="text.secondary">
        Saldo = (membresía facturada − esperada) + (campañas facturadas − registradas) − notas de crédito. Se considera
        al día con hasta {money(data.tolerance)} de diferencia (una semana de membresía). Opt-in, setup y otros cargos
        se muestran pero no entran al saldo: no tienen esperado confiable en el histórico.
      </Typography>
    </Stack>
  );
}

export default CuadreView;
