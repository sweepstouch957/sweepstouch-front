'use client';

import SmsCampaignsModal from '@/components/billing/SmsCampaignsModal';
import { SmsLogsModal } from '@/components/SmsLogsModal';
import { MembershipType } from '@/services/billing.service';
import { useRangeBilling, useStoresRangeReport } from '@hooks/fetching/billing/useBilling';
import AccountBalanceWalletRoundedIcon from '@mui/icons-material/AccountBalanceWalletRounded';
import GroupRoundedIcon from '@mui/icons-material/GroupRounded';
import HowToRegRoundedIcon from '@mui/icons-material/HowToRegRounded';
import MessageRoundedIcon from '@mui/icons-material/MessageRounded';
import {
  alpha,
  Avatar,
  Box,
  Chip,
  colors,
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  LinearProgress,
  Link as MuiLink,
  Paper,
  Skeleton,
  Stack,
  Typography,
  useTheme,
} from '@mui/material';
import { useMemo, useState } from 'react';
import KpiCard from '@/components/application-ui/card-shells/kpi-card';
import AccountBalanceRoundedIcon from '@mui/icons-material/AccountBalanceRounded';
import { routes } from 'src/router/routes';
import { ServicesByStore } from '@/components/application-ui/content-shells/qbo-receivables/services-by-store';
import BillingFilters, { PaymentMethod } from './filters';
import { PieWithLegend } from './utils';

// Util: YYYY-MM-DD
const toYYYYMMDD = (d: Date | null | undefined) =>
  d
    ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
        d.getDate()
      ).padStart(2, '0')}`
    : '';

// Currency formatter — Intl instance allocated once at module scope
const usdFmt = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
const fmt = (v: number) => usdFmt.format(v);

// Static sx values — allocated once at module scope (no component-local deps)
const cardBodySx = { p: 2.5 } as const;

const iconAvatarSx = (color: string) => ({
  width: 38,
  height: 38,
  bgcolor: alpha(color, 0.12),
  color,
  borderRadius: 1.5,
});

const kpiLabelSx = {
  variant: 'caption' as const,
  fontWeight: 600,
  textTransform: 'uppercase' as const,
  letterSpacing: 0.5,
  color: 'text.secondary',
};

export default function BillingPage() {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const { common } = colors;

  // Estado del modal de logs de SMS
  const [isSmsModalOpen, setIsSmsModalOpen] = useState(false);
  const handleOpenSmsModal = () => setIsSmsModalOpen(true);
  const handleCloseSmsModal = () => setIsSmsModalOpen(false);

  // Colores para el gráfico
  const colorSMS = theme.palette.success.light;
  const colorMMS = theme.palette.info.light;
  const colorStoreFees = theme.palette.secondary.light;

  // Rango por defecto: últimos 14 días
  const [startDate, setStartDate] = useState<Date | null>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 13);
    return d;
  });
  const [endDate, setEndDate] = useState<Date | null>(new Date());

  // Filtros
  const [membershipType, setMembershipType] = useState<MembershipType>('all');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | ''>('');
  const [periods, setPeriods] = useState<number>(0);

  const startStr = useMemo(() => toYYYYMMDD(startDate), [startDate]);
  const endStr = useMemo(() => toYYYYMMDD(endDate), [endDate]);

  // Queries
  const range = useRangeBilling(
    startDate && endDate
      ? {
          start: startStr,
          end: endStr,
          periods,
          paymentMethod: paymentMethod || undefined,
          membershipType,
        }
      : undefined
  );

  const storesReport = useStoresRangeReport(
    startDate && endDate
      ? {
          start: startStr,
          end: endStr,
          periods,
          paymentMethod: paymentMethod || undefined,
          membershipType,
        }
      : undefined
  );

  // Totales (global)
  const sms = range.data?.breakdown.campaigns.sms ?? 0;
  const mms = range.data?.breakdown.campaigns.mms ?? 0;
  const storesFee = range.data?.breakdown.membership.subtotal ?? 0;
  const optinCost = range.data?.breakdown.optin?.cost ?? 0;
  const optinCount = range.data?.breakdown.optin?.count ?? 0;
  const optinUnit = range.data?.breakdown.optin?.unitPrice ?? 0;
  const extrasTotal = range.data?.breakdown.extras?.total ?? 0;
  const grandTotal = range.data?.total ?? 0;
  const membershipMeta = range.data?.breakdown.membership;
  const qboTotals = range.data?.breakdown.qbo ?? null;
  const membershipHint =
    membershipMeta?.source === 'no-disponible'
      ? 'QuickBooks no respondió · Ver tiendas'
      : `Facturado en QuickBooks${
          membershipMeta?.unlinkedMembership
            ? ` · ${fmt(membershipMeta.unlinkedMembership)} sin tienda vinculada`
            : ''
        }`;

  const cardSx = {
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: 3,
  } as const;

  const cardHeaderSx = {
    px: 2.5,
    py: 2,
    borderBottom: `1px solid ${theme.palette.divider}`,
    bgcolor: isDark ? alpha(common.black, 0.15) : alpha(common.black, 0.015),
  } as const;

  // KPI cards data
  // Cada KPI declara a dónde lleva (href) o qué abre (onClick). Si no lleva a
  // ningún lado, no se marca como clickeable — así se ve cuál navega y cuál no.
  const kpis: {
    label: string;
    value?: string;
    hint: string;
    icon: React.ReactNode;
    variant?: 'error' | 'info' | 'success' | 'warning';
    href?: string;
    onClick?: () => void;
  }[] = [
    {
      label: 'Grand Total',
      value: range.isLoading ? undefined : fmt(grandTotal),
      hint: `${startStr} → ${endStr}`,
      icon: <AccountBalanceWalletRoundedIcon fontSize="small" />,
    },
    {
      label: 'Campaigns SMS + MMS',
      value: range.isLoading ? undefined : fmt(sms + mms),
      hint: 'Ver logs de envíos',
      icon: <MessageRoundedIcon fontSize="small" />,
      variant: 'success',
      onClick: handleOpenSmsModal,
    },
    {
      label: 'Memberships',
      value: range.isLoading ? undefined : fmt(storesFee),
      // La membresía la crea la contadora en QuickBooks: aquí solo se lee lo
      // facturado en el rango, ya no se multiplica por periodos.
      hint: membershipHint,
      icon: <GroupRoundedIcon fontSize="small" />,
      variant: 'info',
      href: routes.admin.management.stores.listing,
    },
    {
      label: 'Opt-in',
      value: range.isLoading ? undefined : fmt(optinCost),
      hint: `${optinCount} × ${fmt(optinUnit)} · Ver Opt-in MMS`,
      icon: <HowToRegRoundedIcon fontSize="small" />,
      variant: 'warning',
      href: routes.admin.management.campaings.optin,
    },
    // Lo que QuickBooks facturó en el rango contra lo que calcula el sistema.
    // La membresía histórica se emitía hasta tres semanas tarde, así que un
    // corte mensual nunca cuadra exacto: el cuadre bueno es el acumulado.
    {
      label: 'QuickBooks facturó',
      value: range.isLoading ? undefined : qboTotals ? fmt(qboTotals.billedTotal) : '—',
      hint: qboTotals
        ? `Descuadre ${qboTotals.diff > 0 ? '+' : ''}${fmt(qboTotals.diff)} · Ver cuadre acumulado`
        : 'QuickBooks no respondió',
      icon: <AccountBalanceWalletRoundedIcon fontSize="small" />,
      variant: qboTotals && Math.abs(qboTotals.diff) < 1 ? 'success' : 'error',
      href: routes.admin.management['billing-cuadre'],
    },
  ];

  // Qué causa del descuadre está abierta en el dialog de detalle
  const [whyOpen, setWhyOpen] = useState<null | 'services' | 'campaigns' | 'optin' | 'unlinked'>(
    null
  );
  const whyDetail = storesReport.data?.totals.qbo?.why?.detail;
  const extras = storesReport.data?.totals.extras;
  // Item "Sin categoría" abierto: sus líneas una por una
  const [itemOpen, setItemOpen] = useState<string | null>(null);
  const openItem = storesReport.data?.totals.qbo?.items?.find((it) => it.id === itemOpen);

  // Store summary rows
  const storeRows: {
    label: string;
    value: string | number;
    highlight?: boolean;
    sub?: boolean;
    whyKey?: 'services' | 'campaigns' | 'optin' | 'unlinked';
    itemId?: string;
  }[] = [
    {
      label: 'Stores included',
      value: storesReport.data?.stores.length ?? 0,
    },
    {
      label: 'Total Campaigns',
      value: fmt(storesReport.data?.totals.campaigns.total ?? 0),
    },
    {
      label: 'Total Memberships',
      value: fmt(storesReport.data?.totals.membership ?? 0),
    },
    {
      label: 'Total Opt-in cost',
      value: fmt(storesReport.data?.totals.optin?.cost ?? 0),
    },
    {
      label: 'Opt-in signups',
      value: storesReport.data?.totals.optin?.count ?? 0,
    },
    // Lo que solo existe en QuickBooks entra al total leído de ahí, igual que
    // la membresía: así el descuadre queda en lo que de verdad no cuadra.
    ...(extras && extras.setup
      ? [{ label: 'Merchant Set-Up', value: fmt(extras.setup) }]
      : []),
    ...(extras && extras.otros
      ? [{ label: 'Otros servicios (Promotional, Flyers, Design…)', value: fmt(extras.otros) }]
      : []),
    {
      label: 'Grand Total',
      value: fmt(storesReport.data?.totals.grandTotal ?? 0),
      highlight: true,
    },
    {
      label: 'Facturado en QuickBooks',
      value: fmt(storesReport.data?.totals.qbo?.billedTotal ?? 0),
    },
    // TODOS los items del catálogo del contador (Set-Up, Promotional Items,
    // Flyers, Sin categoría…): el descuadre deja de ser una cifra opaca.
    ...(storesReport.data?.totals.qbo?.items ?? []).map((it) => ({
      label: it.detail ? `${it.label} (${it.lines} líneas · ver)` : it.label,
      value: fmt(it.amount),
      sub: true,
      itemId: it.detail ? it.id : undefined,
    })),
    {
      label: 'Descuadre vs QuickBooks',
      value: `${(storesReport.data?.totals.qbo?.diff ?? 0) > 0 ? '+' : ''}${fmt(storesReport.data?.totals.qbo?.diff ?? 0)}`,
      highlight: true,
    },
    // El PORQUÉ del descuadre, causa por causa. La suma de estas filas ≈ la
    // fila de arriba: nada queda sin explicar.
    ...(() => {
      const why = storesReport.data?.totals.qbo?.why;
      if (!why) return [];
      const causes: Array<['services' | 'campaigns' | 'optin' | 'unlinked', string, number]> = [
        ['services', 'Servicios que el sistema no suma (Set-Up, Promotional, Flyers…)', why.services],
        ['campaigns', 'Campañas: QuickBooks vs sistema', why.campaignsDiff],
        ['optin', 'Opt-in: QuickBooks vs sistema', why.optinDiff],
        ['unlinked', 'Clientes sin tienda vinculada o fuera del filtro', why.unlinked],
      ];
      return causes
        .filter(([, , v]) => Math.abs(v) >= 0.01)
        .map(([whyKey, label, v]) => ({
          label,
          value: `${v > 0 ? '+' : ''}${fmt(v)}`,
          sub: true,
          whyKey,
        }));
    })(),
  ];

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* Modals */}
      <SmsLogsModal
        open={isSmsModalOpen}
        onClose={handleCloseSmsModal}
        start={startStr}
        end={endStr}
      />
      <SmsCampaignsModal
        open={isSmsModalOpen}
        onClose={() => setIsSmsModalOpen(false)}
        startDate={startStr}
        endDate={endStr}
      />

      {/* Page Header */}
      <Stack
        direction="row"
        alignItems="center"
        flexWrap="wrap"
        gap={2}
        sx={{ mb: 3 }}
      >
        <Avatar
          sx={{
            width: 44,
            height: 44,
            bgcolor: alpha(theme.palette.primary.main, 0.12),
            color: theme.palette.primary.main,
            borderRadius: 2,
          }}
        >
          <AccountBalanceWalletRoundedIcon />
        </Avatar>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            variant="h5"
            fontWeight={800}
            letterSpacing={-0.5}
            lineHeight={1.2}
          >
            Billing · Sweepstouch
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
            fontWeight={500}
          >
            {startStr} → {endStr}
          </Typography>
        </Box>
        {!range.isLoading && grandTotal > 0 && (
          <Chip
            label={fmt(grandTotal)}
            size="medium"
            sx={{
              fontWeight: 800,
              fontSize: 14,
              bgcolor: alpha(theme.palette.primary.main, 0.1),
              color: theme.palette.primary.main,
              borderRadius: 2,
              px: 0.5,
            }}
          />
        )}
      </Stack>

      {/* Filters Card */}
      <Paper
        elevation={0}
        sx={{ ...cardSx, borderRadius: 2.5, mb: 2.5 }}
      >
        <Box sx={cardHeaderSx}>
          <Typography
            variant="subtitle2"
            fontWeight={700}
          >
            Filters
          </Typography>
        </Box>
        <Box sx={cardBodySx}>
          <BillingFilters
            startDate={startDate}
            endDate={endDate}
            onChangeDates={(s, e) => {
              setStartDate(s);
              setEndDate(e);
            }}
            membershipType={membershipType}
            onMembershipChange={setMembershipType}
            paymentMethod={paymentMethod}
            onPaymentMethodChange={setPaymentMethod}
            periods={periods}
            onPeriodsChange={setPeriods}
          />
        </Box>
      </Paper>

      {/* Loading bar */}
      {(range.isLoading || storesReport.isLoading) && (
        <LinearProgress
          sx={{ borderRadius: 1, mb: 2 }}
        />
      )}

      {/* Arrastre por fecha de emisión: hay líneas facturadas sin fecha de
          servicio (ni ServiceDate ni fecha en la descripción). Esas se ubican
          por la fecha de la factura, así que un cargo servido fuera del rango
          (campaña del 31/7 facturada el 3/8) entra igual y descuadra contra lo
          que calcula el sistema, que sí filtra por fecha de servicio. */}
      {!range.isLoading && (qboTotals?.inferred ?? 0) > 0 && (
        <Alert
          severity="warning"
          sx={{ mb: 2 }}
          action={
            <Button
              size="small"
              color="inherit"
              href={routes.admin.management['billing-cuadre']}
            >
              Ver cuadre
            </Button>
          }
        >
          {fmt(qboTotals!.inferred!)} de lo facturado en QuickBooks (
          {qboTotals!.inferredLines ?? 0} línea{(qboTotals!.inferredLines ?? 0) === 1 ? '' : 's'})
          se ubicó en este periodo solo por la <strong>fecha de emisión</strong> de la factura:
          esas líneas no traen fecha de servicio ni como dato ni en la descripción. Pueden ser
          cargos servidos en otro periodo arrastrados a este — por eso el total de QuickBooks
          puede no cuadrar con lo calculado por el sistema en el mismo rango. El cuadre que
          manda para membresías es el acumulado.
        </Alert>
      )}

      {/* KPI Grid — 5 tarjetas: la quinta es el descuadre contra QuickBooks */}
      <Grid
        container
        spacing={2}
        sx={{ mb: 2.5 }}
      >
        {kpis.map((kpi) => (
          <Grid
            item
            xs={12}
            sm={6}
            md={2.4}
            key={kpi.label}
          >
            <KpiCard
              layout="horizontal"
              icon={kpi.icon}
              label={kpi.label}
              value={kpi.value ?? '—'}
              descriptions={kpi.hint}
              variant={kpi.variant}
              href={kpi.href}
              onClick={kpi.onClick}
            />
          </Grid>
        ))}
      </Grid>

      {/* Bottom two-column grid: Pie chart + Stores summary */}
      <Grid
        container
        spacing={2}
        sx={{ mb: 2.5 }}
      >
        {/* Left: Composition Pie */}
        <Grid
          item
          xs={12}
          md={5}
        >
          <Paper
            elevation={0}
            sx={{ ...cardSx, borderRadius: 3, height: '100%' }}
          >
            <Box sx={cardHeaderSx}>
              <Typography
                variant="subtitle2"
                fontWeight={700}
              >
                Composition
              </Typography>
              <Typography
                variant="caption"
                color="text.secondary"
              >
                Campaigns vs Memberships vs Opt-in
              </Typography>
            </Box>
            <Box sx={cardBodySx}>
              {range.isLoading ? (
                <Skeleton
                  variant="rounded"
                  height={260}
                />
              ) : (
                <Box
                  sx={{
                    height: { xs: 220, sm: 240, md: 260 },
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <PieWithLegend
                    smsValue={sms}
                    mmsValue={mms}
                    storesValue={storesFee}
                    optinValue={optinCost}
                    extrasValue={extrasTotal}
                    colorSMS={colorSMS}
                    colorMMS={colorMMS}
                    colorStores={colorStoreFees}
                    colorOptin={theme.palette.warning.light}
                    colorExtras={theme.palette.error.light}
                    grandTotal={grandTotal}
                    onClickSMS={handleOpenSmsModal}
                  />
                </Box>
              )}
            </Box>
          </Paper>
        </Grid>

        {/* Right: Stores Summary */}
        <Grid
          item
          xs={12}
          md={7}
        >
          <Paper
            elevation={0}
            sx={{ ...cardSx, borderRadius: 3, height: '100%' }}
          >
            <Box sx={cardHeaderSx}>
              <Typography
                variant="subtitle2"
                fontWeight={700}
              >
                Stores Summary
              </Typography>
              <Typography
                variant="caption"
                color="text.secondary"
              >
                {startStr} → {endStr}
              </Typography>
            </Box>
            <Box sx={cardBodySx}>
              {storesReport.isLoading ? (
                <Stack spacing={1.5}>
                  {[...Array(6)].map((_, i) => (
                    <Skeleton
                      key={i}
                      variant="rounded"
                      height={36}
                    />
                  ))}
                </Stack>
              ) : (
                <Stack
                  divider={
                    <Divider
                      orientation="horizontal"
                      flexItem
                    />
                  }
                >
                  {storeRows.map((row, i) => (
                    <Box
                      key={`${row.label}-${i}`}
                      onClick={
                        row.whyKey
                          ? () => setWhyOpen(row.whyKey!)
                          : row.itemId
                            ? () => setItemOpen(row.itemId!)
                            : undefined
                      }
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        py: row.sub ? 0.5 : 1.25,
                        pl: row.sub ? 2 : undefined,
                        // Las causas del descuadre abren su detalle con las tiendas
                        cursor: row.whyKey || row.itemId ? 'pointer' : undefined,
                        '&:hover': row.whyKey || row.itemId
                          ? { bgcolor: alpha(theme.palette.primary.main, 0.06), borderRadius: 1 }
                          : undefined,
                        borderRadius: row.highlight ? 1.5 : 0,
                        bgcolor: row.highlight
                          ? isDark
                            ? alpha(theme.palette.primary.main, 0.1)
                            : alpha(theme.palette.primary.main, 0.06)
                          : 'transparent',
                        mx: row.highlight ? -0.5 : 0,
                        px: row.highlight ? 1 : 0.5,
                      }}
                    >
                      <Typography
                        variant={row.sub ? 'caption' : 'body2'}
                        color={row.highlight ? 'text.primary' : 'text.secondary'}
                        fontWeight={row.highlight ? 700 : 400}
                      >
                        {row.sub ? `· ${row.label}` : row.label}
                      </Typography>
                      <Typography
                        variant={row.sub ? 'caption' : 'body2'}
                        fontWeight={row.highlight ? 800 : row.sub ? 500 : 600}
                        color={row.highlight ? 'primary.main' : row.sub ? 'text.secondary' : 'text.primary'}
                      >
                        {row.value}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Detalle de una causa del descuadre: QUÉ tiendas o clientes la componen,
          con link directo para ir a cuadrar cada una. */}
      <Dialog
        open={Boolean(whyOpen)}
        onClose={() => setWhyOpen(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {whyOpen === 'services' && 'Servicios que el sistema no suma'}
          {whyOpen === 'campaigns' && 'Campañas: QuickBooks vs sistema'}
          {whyOpen === 'optin' && 'Opt-in: QuickBooks vs sistema'}
          {whyOpen === 'unlinked' && 'Clientes sin tienda vinculada o fuera del filtro'}
        </DialogTitle>
        <DialogContent dividers>
          <Stack divider={<Divider flexItem />}>
            {whyOpen === 'services' &&
              (whyDetail?.services ?? []).map((d) => (
                <Stack
                  key={d.storeId}
                  direction="row"
                  alignItems="center"
                  justifyContent="space-between"
                  sx={{ py: 1 }}
                >
                  <MuiLink
                    href={`/admin/management/stores/edit/${d.storeId}?tag=billing`}
                    underline="hover"
                    variant="body2"
                    fontWeight={600}
                  >
                    {d.name}
                  </MuiLink>
                  <Typography variant="body2"
fontWeight={600}>
                    {fmt(d.amount)}
                  </Typography>
                </Stack>
              ))}

            {(whyOpen === 'campaigns' || whyOpen === 'optin') &&
              ((whyOpen === 'campaigns' ? whyDetail?.campaigns : whyDetail?.optin) ?? []).map(
                (d) => (
                  <Stack
                    key={d.storeId}
                    direction="row"
                    alignItems="center"
                    justifyContent="space-between"
                    sx={{ py: 1 }}
                  >
                    <Box sx={{ minWidth: 0 }}>
                      <MuiLink
                        href={`/admin/management/stores/edit/${d.storeId}?tag=billing`}
                        underline="hover"
                        variant="body2"
                        fontWeight={600}
                      >
                        {d.name}
                      </MuiLink>
                      <Typography variant="caption"
display="block"
color="text.secondary">
                        QuickBooks {fmt(d.qbo)} · Sistema {fmt(d.system)}
                      </Typography>
                    </Box>
                    <Typography
                      variant="body2"
                      fontWeight={700}
                      color={d.diff > 0 ? 'error.main' : 'success.main'}
                    >
                      {d.diff > 0 ? '+' : ''}
                      {fmt(d.diff)}
                    </Typography>
                  </Stack>
                )
              )}

            {whyOpen === 'unlinked' &&
              (whyDetail?.unlinked ?? []).map((d) => (
                <Stack
                  key={d.qboCustomerId}
                  direction="row"
                  alignItems="center"
                  justifyContent="space-between"
                  sx={{ py: 1 }}
                >
                  <Typography variant="body2"
fontWeight={600}>
                    {d.name}
                  </Typography>
                  <Typography variant="body2"
fontWeight={600}>
                    {fmt(d.total)}
                  </Typography>
                </Stack>
              ))}
          </Stack>
          {whyOpen === 'unlinked' && (
            <Typography variant="caption"
color="text.secondary"
sx={{ mt: 1.5, display: 'block' }}>
              Estos clientes existen en QuickBooks pero ninguna tienda del filtro los reclama:
              vincúlalos desde la Cartera (botón Vincular) o desde la pestaña QuickBooks de la
              tienda, y su facturación entrará al reporte.
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          {whyOpen === 'unlinked' && (
            <Button href={routes.admin.management.billing}
size="small">
              Abrir cartera para vincular
            </Button>
          )}
          <Button onClick={() => setWhyOpen(null)}
size="small">
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Líneas "Sin categoría": la contadora puso monto sin elegir producto.
          Se ven una por una para corregirlas en QuickBooks. */}
      <Dialog
        open={Boolean(openItem)}
        onClose={() => setItemOpen(null)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>{openItem?.label}</DialogTitle>
        <DialogContent dividers>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ mb: 1.5, display: 'block' }}
          >
            Líneas facturadas sin producto. Se clasifican por lo que dice la descripción; para
            que cuadren siempre, asígnales el producto correcto en QuickBooks.
          </Typography>
          <Stack divider={<Divider flexItem />}>
            {(openItem?.detail ?? []).map((d, i) => (
              <Stack
                key={`${d.docNumber}-${i}`}
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                spacing={2}
                sx={{ py: 1 }}
              >
                <Box sx={{ minWidth: 0 }}>
                  <Typography
                    variant="body2"
                    fontWeight={600}
                  >
                    {d.customerName}
                  </Typography>
                  <Typography
                    variant="caption"
                    display="block"
                    color="text.secondary"
                  >
                    Factura #{d.docNumber} · {d.date} · {d.description || 'sin descripción'}
                  </Typography>
                </Box>
                <Typography
                  variant="body2"
                  fontWeight={600}
                >
                  {fmt(d.amount)}
                </Typography>
              </Stack>
            ))}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setItemOpen(null)}
            size="small"
          >
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Todos los servicios del catálogo del contador, tienda por tienda:
          membresía, campañas, Design Fee, Merchant Set-Up, Promotional Items,
          Flyers… Sigue el mismo rango de fechas de los filtros de arriba. */}
      <Box sx={{ mb: 2.5 }}>
        <ServicesByStore range={{ from: startStr || null, to: endStr || null }} />
      </Box>

      {/* Puente, no duplicado: la cartera completa vive en Facturación. Tenerla
          embebida acá daba dos pantallas con los mismos números y ninguna manda. */}
      <Alert
        severity="info"
        icon={<AccountBalanceRoundedIcon />}
        action={
          <Button size="small"
href={routes.admin.management.billing}>
            Abrir
          </Button>
        }
        sx={{ mb: 2.5 }}
      >
        Lo que las tiendas deben, la antigüedad de la cartera y la conciliación con
        QuickBooks están en <strong>Management → Facturación</strong>. Esta pantalla mide lo
        que se generó en el periodo; aquella, lo que está sin cobrar.
      </Alert>

    </Box>
  );
}
