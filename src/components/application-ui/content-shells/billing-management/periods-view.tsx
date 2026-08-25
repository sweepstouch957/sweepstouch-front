'use client';

import {
  EmptyBlock,
  PanelCard,
  SectionHeader,
} from '@/components/application-ui/content-shells/store-managment/panel-kit';
import { fmtDate, money } from '@/components/application-ui/content-shells/qbo-receivables/constants';
import { InvoicePdfButton } from '@/components/application-ui/content-shells/qbo-receivables/invoice-pdf-button';
import { type QboPeriodRow, type QboPeriods } from '@/services/qbo.service';
import CardMembershipRoundedIcon from '@mui/icons-material/CardMembershipRounded';
import HowToRegRoundedIcon from '@mui/icons-material/HowToRegRounded';
import {
  Alert,
  Box,
  Chip,
  Divider,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
  alpha,
  useMediaQuery,
  useTheme,
} from '@mui/material';

/** La ventana en palabras: "5 ago → 11 ago". */
function windowLabel(row: QboPeriodRow) {
  if (!row.coversFrom) return `Primer cobro (${fmtDate(row.coversTo)})`;
  return `${fmtDate(row.coversFrom)} → ${fmtDate(row.coversTo)}`;
}

const clamp2 = {
  display: '-webkit-box',
  WebkitLineClamp: 2,
  WebkitBoxOrient: 'vertical' as const,
  overflow: 'hidden',
};

const nums = { fontVariantNumeric: 'tabular-nums' as const };

/* ── Opt-in ────────────────────────────────────────────────────────── */

function OptinCard({ row }: { row: QboPeriodRow }) {
  const theme = useTheme();
  const missing = row.diff ?? 0;
  return (
    <Box
      sx={{
        p: 1.5,
        borderRadius: 2,
        border: `1px solid ${alpha(theme.palette.divider, 0.8)}`,
        bgcolor: missing > 1 ? alpha(theme.palette.error.main, 0.04) : 'transparent',
      }}
    >
      <Stack direction="row"
justifyContent="space-between"
alignItems="flex-start"
gap={1}>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="subtitle2"
fontWeight={700}
sx={clamp2}>
            {row.storeName}
          </Typography>
          <Typography variant="body2"
color="text.secondary">
            {windowLabel(row)}
          </Typography>
        </Box>
        <InvoicePdfButton qboId={row.invoiceQboId}
docNumber={row.docNumber} />
      </Stack>
      <Divider sx={{ my: 1 }} />
      <Stack direction="row"
justifyContent="space-between"
gap={1}>
        <Box>
          <Typography variant="body2"
color="text.secondary">
            Se enviaron
          </Typography>
          <Typography variant="subtitle2"
fontWeight={700}
sx={nums}>
            {row.realSent != null ? row.realSent.toLocaleString() : '—'}
          </Typography>
        </Box>
        <Box>
          <Typography variant="body2"
color="text.secondary">
            Cobró
          </Typography>
          <Typography variant="subtitle2"
fontWeight={700}
sx={nums}>
            {money(row.chargedAmount)}
          </Typography>
        </Box>
        <Box>
          <Typography variant="body2"
color="text.secondary">
            Debía cobrar
          </Typography>
          <Typography variant="subtitle2"
fontWeight={700}
sx={nums}>
            {row.expectedAmount != null ? money(row.expectedAmount) : '—'}
          </Typography>
        </Box>
        <Box sx={{ textAlign: 'right' }}>
          <Typography variant="body2"
color="text.secondary">
            Falta
          </Typography>
          <Typography
            variant="subtitle2"
            fontWeight={800}
            color={missing > 1 ? 'error.main' : 'text.disabled'}
            sx={nums}
          >
            {row.diff != null ? money(row.diff) : '—'}
          </Typography>
        </Box>
      </Stack>
    </Box>
  );
}

function OptinPanel({ optin }: { optin: QboPeriods['optin'] }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const t = optin.totals;
  const rows = optin.rows.filter((r) => r.realSent != null).slice(0, 60);

  return (
    <PanelCard sx={{ overflow: 'hidden' }}>
      <SectionHeader
        icon={<HowToRegRoundedIcon />}
        title="Opt-in: se cobra parejo, pero no se envía parejo"
        hint={`${t.invoices} facturas con línea de opt-in · ${t.measurable} se pudieron medir`}
      />
      <Box sx={{ px: 2.25, pb: 2.25 }}>
        <Alert severity={t.diff > 1 ? 'warning' : 'success'}
sx={{ mb: 2 }}>
          <Typography variant="body2">
            {t.diff > 1
              ? `Se enviaron ${t.realSent.toLocaleString()} mensajes de opt-in en este periodo. A $${optin.unitPrice} cada uno son ${money(t.expected)}, y en las facturas aparecen ${money(t.charged)}. Faltan ${money(t.diff)} por cobrar.`
              : `Se enviaron ${t.realSent.toLocaleString()} mensajes de opt-in y lo facturado (${money(t.charged)}) coincide con lo que deberían costar.`}
          </Typography>
        </Alert>

        <Typography variant="body2"
color="text.secondary"
sx={{ mb: 2 }}>
          El opt-in no lleva fecha en la descripción de la factura, así que el periodo se
          deduce: cada factura cubre desde el día siguiente a la anterior de esa misma tienda.
          Si una salió el 3 y otra el 11, la del 11 cubre del 4 al 11.
        </Typography>

        {optin.error && (
          <Alert severity="error"
sx={{ mb: 2 }}>
            <Typography variant="body2">
              {`No se pudo contar el opt-in real: ${optin.error}`}
            </Typography>
          </Alert>
        )}

        {!rows.length ? (
          <EmptyBlock
            title="Sin opt-in facturado en el periodo"
            hint="Ninguna factura emitida en estas fechas trae línea de opt-in."
          />
        ) : isMobile ? (
          <Stack gap={1.25}>
            {rows.map((r) => (
              <OptinCard key={`${r.invoiceQboId}-${r.storeId}`}
row={r} />
            ))}
          </Stack>
        ) : (
          <Box sx={{ overflowX: 'auto' }}>
            <Table size="small"
sx={{ tableLayout: 'fixed', minWidth: 760 }}>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ width: '25%' }}>Tienda</TableCell>
                  <TableCell sx={{ width: '22%' }}>Periodo que cubre</TableCell>
                  <TableCell align="right"
sx={{ width: '12%' }}>
                    Se enviaron
                  </TableCell>
                  <TableCell align="right"
sx={{ width: '11%' }}>
                    Cobró
                  </TableCell>
                  <TableCell align="right"
sx={{ width: '12%' }}>
                    Debía cobrar
                  </TableCell>
                  <TableCell align="right"
sx={{ width: '10%' }}>
                    Falta
                  </TableCell>
                  <TableCell align="right"
sx={{ width: '14%' }}>
                    Factura
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((r) => {
                  const missing = r.diff ?? 0;
                  return (
                    <TableRow key={`${r.invoiceQboId}-${r.storeId}`}
hover>
                      <TableCell>
                        <Typography variant="body2"
fontWeight={600}
sx={clamp2}>
                          {r.storeName}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2"
color="text.secondary">
                          {windowLabel(r)}
                        </Typography>
                        {r.days != null && (
                          <Typography variant="body2"
color="text.disabled">
                            {`${r.days} días`}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2"
sx={nums}>
                          {r.realSent?.toLocaleString() ?? '—'}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2"
sx={nums}>
                          {money(r.chargedAmount)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2"
fontWeight={600}
sx={nums}>
                          {r.expectedAmount != null ? money(r.expectedAmount) : '—'}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography
                          variant="body2"
                          fontWeight={800}
                          color={missing > 1 ? 'error.main' : 'text.disabled'}
                          sx={nums}
                        >
                          {r.diff != null ? money(r.diff) : '—'}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <InvoicePdfButton qboId={r.invoiceQboId}
docNumber={r.docNumber} />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Box>
        )}
      </Box>
    </PanelCard>
  );
}

/* ── Membresía ─────────────────────────────────────────────────────── */

const FLAG_TEXT: Record<
  string,
  { label: string; color: 'error' | 'warning' | 'info'; why: string }
> = {
  hueco: {
    label: 'Se saltó cobros',
    color: 'error',
    why: 'Pasaron más de dos semanas desde el cobro anterior.',
  },
  doble: {
    label: 'Cobro repetido',
    color: 'warning',
    why: 'Se cobró otra vez a los pocos días del anterior.',
  },
  reactivacion: {
    label: 'Tienda que volvió',
    color: 'info',
    why: 'Llevaba meses sin cobros: no es un olvido, es una reactivación.',
  },
  primera: {
    label: 'Primer cobro',
    color: 'info',
    why: 'No hay factura anterior con la que comparar.',
  },
};

function MembershipPanel({ membership }: { membership: QboPeriods['membership'] }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const t = membership.totals;
  // Solo lo que necesita revisión: las cientos de filas normales no aportan nada.
  const rows = membership.rows.filter((r) => r.flag).slice(0, 60);

  return (
    <PanelCard sx={{ overflow: 'hidden' }}>
      <SectionHeader
        icon={<CardMembershipRoundedIcon />}
        title="Membresía: se cobra cada semana"
        hint={`${t.invoices} cobros en el periodo · ${money(t.charged)}`}
      />
      <Box sx={{ px: 2.25, pb: 2.25 }}>
        <Alert severity={t.gaps > 0 ? 'warning' : 'success'}
sx={{ mb: 2 }}>
          <Typography variant="body2">
            {t.gaps > 0
              ? `A ${t.gaps} ${t.gaps === 1 ? 'tienda se le saltaron cobros' : 'tiendas se les saltaron cobros'} de membresía: ${t.weeksMissed} semanas sin facturar, ${money(t.missedAmount)} que no se cobraron.`
              : 'Todas las tiendas tienen su membresía cobrada semana a semana, sin huecos.'}
          </Typography>
        </Alert>

        <Typography variant="body2"
color="text.secondary"
sx={{ mb: 2 }}>
          La membresía tampoco lleva fecha de servicio: se mide por los días entre un cobro y
          el siguiente de la misma tienda. Lo normal son {membership.cadenceDays} días.
        </Typography>

        {!rows.length ? (
          <EmptyBlock
            title="Nada que revisar"
            hint="Ninguna tienda tiene huecos ni cobros repetidos de membresía en el periodo."
          />
        ) : isMobile ? (
          <Stack gap={1.25}>
            {rows.map((r) => {
              const f = FLAG_TEXT[r.flag as string];
              return (
                <Box
                  key={`${r.invoiceQboId}-${r.storeId}`}
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    border: `1px solid ${alpha(theme.palette.divider, 0.8)}`,
                  }}
                >
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="flex-start"
                    gap={1}
                  >
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="subtitle2"
fontWeight={700}
sx={clamp2}>
                        {r.storeName}
                      </Typography>
                      <Chip
                        size="small"
                        label={f?.label}
                        color={f?.color}
                        variant="outlined"
                        sx={{ mt: 0.5 }}
                      />
                    </Box>
                    <InvoicePdfButton qboId={r.invoiceQboId}
docNumber={r.docNumber} />
                  </Stack>
                  <Typography variant="body2"
color="text.secondary"
sx={{ mt: 1 }}>
                    {r.days != null
                      ? `${r.days} días desde el cobro anterior (${windowLabel(r)})`
                      : f?.why}
                  </Typography>
                  {(r.missedAmount ?? 0) > 0 && (
                    <Typography
                      variant="subtitle2"
                      color="error.main"
                      fontWeight={800}
                      sx={{ mt: 0.5 }}
                    >
                      {`Faltan ${money(r.missedAmount as number)} (${r.weeksMissed} semanas)`}
                    </Typography>
                  )}
                </Box>
              );
            })}
          </Stack>
        ) : (
          <Box sx={{ overflowX: 'auto' }}>
            <Table size="small"
sx={{ tableLayout: 'fixed', minWidth: 720 }}>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ width: '26%' }}>Tienda</TableCell>
                  <TableCell sx={{ width: '19%' }}>Qué pasó</TableCell>
                  <TableCell sx={{ width: '25%' }}>Entre un cobro y otro</TableCell>
                  <TableCell align="right"
sx={{ width: '10%' }}>
                    Cobró
                  </TableCell>
                  <TableCell align="right"
sx={{ width: '11%' }}>
                    Falta
                  </TableCell>
                  <TableCell align="right"
sx={{ width: '13%' }}>
                    Factura
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((r) => {
                  const f = FLAG_TEXT[r.flag as string];
                  return (
                    <TableRow key={`${r.invoiceQboId}-${r.storeId}`}
hover>
                      <TableCell>
                        <Typography variant="body2"
fontWeight={600}
sx={clamp2}>
                          {r.storeName}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip size="small"
label={f?.label}
color={f?.color}
variant="outlined" />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2"
color="text.secondary">
                          {r.days != null ? `${r.days} días` : f?.why}
                        </Typography>
                        {r.coversFrom && (
                          <Typography variant="body2"
color="text.disabled">
                            {windowLabel(r)}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2"
sx={nums}>
                          {money(r.chargedAmount)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography
                          variant="body2"
                          fontWeight={800}
                          color={(r.missedAmount ?? 0) > 0 ? 'error.main' : 'text.disabled'}
                          sx={nums}
                        >
                          {(r.missedAmount ?? 0) > 0 ? money(r.missedAmount as number) : '—'}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <InvoicePdfButton qboId={r.invoiceQboId}
docNumber={r.docNumber} />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Box>
        )}
      </Box>
    </PanelCard>
  );
}

/**
 * Opt-in y membresía: los cargos que no se pueden parear por fecha de servicio
 * porque no la traen escrita. La ventana sale de la emisión de la factura
 * anterior de la misma tienda, y con eso ya se puede contar el consumo real.
 */
export function PeriodsView({ periods }: { periods?: QboPeriods }) {
  if (!periods) return null;
  return (
    <>
      <OptinPanel optin={periods.optin} />
      <MembershipPanel membership={periods.membership} />
    </>
  );
}

export default PeriodsView;
