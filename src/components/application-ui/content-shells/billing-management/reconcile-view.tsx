'use client';

import {
  EmptyBlock,
  PanelCard,
  SectionHeader,
} from '@/components/application-ui/content-shells/store-managment/panel-kit';
import { fmtDate, money } from '@/components/application-ui/content-shells/qbo-receivables/constants';
import RangePickerField, { type RangePickerValue } from '@/components/base/range-picker-field';
import { useQboReconcile } from '@hooks/fetching/qbo/useQbo';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import PriceChangeRoundedIcon from '@mui/icons-material/PriceChangeRounded';
import ReceiptLongRoundedIcon from '@mui/icons-material/ReceiptLongRounded';
import RuleRoundedIcon from '@mui/icons-material/RuleRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import type { SvgIconComponent } from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Chip,
  Divider,
  LinearProgress,
  Paper,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
  alpha,
  useTheme,
} from '@mui/material';
import { useMemo, useState } from 'react';
import { EvidenceDialog, type EvidenceTarget } from './evidence-dialog';
import { PeriodsView } from './periods-view';

type View = 'notBilled' | 'withDiff' | 'billedNotFound';

const ymd = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/** Antigüedad contra el atraso normal medido (4 a 7 días). */
function ageColor(days: number): 'default' | 'warning' | 'error' {
  if (days <= 10) return 'default';
  if (days <= 30) return 'warning';
  return 'error';
}

/**
 * Tarjeta de un estado de la conciliación.
 *
 * Cada una responde una pregunta en español llano y filtra la tabla al tocarla.
 * Antes eran indicadores mudos con nombres técnicos —"pareadas", "diferencia en
 * lo pareado"— que había que traducir mentalmente antes de poder usarlos.
 */
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
      {/* body2 y no caption: el tema pone caption en versalitas, y una frase
          entera en mayúsculas no se lee, se descifra. */}
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

export function ReconcileView() {
  const [range, setRange] = useState<RangePickerValue>(() => {
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - 60);
    return { startYmd: ymd(from), endYmd: ymd(to) };
  });
  const [view, setView] = useState<View>('notBilled');
  const [evidence, setEvidence] = useState<EvidenceTarget | null>(null);

  const data = useQboReconcile(range.startYmd, range.endYmd);
  const r = data.data;

  const rows = useMemo(() => {
    if (!r) return [];
    if (view === 'notBilled') return r.notBilled;
    if (view === 'withDiff') return r.withDiff;
    return r.billedNotFound;
  }, [r, view]);

  const totalCampaigns = (r?.counts.matched ?? 0) + (r?.counts.notBilled ?? 0);
  const billedPct = totalCampaigns > 0 ? ((r?.counts.matched ?? 0) / totalCampaigns) * 100 : 0;

  return (
    <Stack gap={2.5}>
      <PanelCard>
        <SectionHeader
          icon={<RuleRoundedIcon />}
          title="Qué periodo revisar"
          hint="Se cuenta por el día en que se hizo la campaña, no por cuándo se emitió la factura"
          action={
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <RangePickerField
                label="Campañas hechas entre"
                value={range}
                onChange={setRange}
                sx={{ width: 250 }}
              />
            </LocalizationProvider>
          }
        />
      </PanelCard>

      {data.isLoading && (
        <Stack gap={2}>
          <Skeleton variant="rounded"
height={120}
sx={{ borderRadius: '18px' }} />
          <Skeleton variant="rounded"
height={280}
sx={{ borderRadius: '18px' }} />
        </Stack>
      )}

      {data.isError && (
        <Alert severity="error">
          {(data.error as any)?.response?.data?.message ||
            (data.error as Error)?.message ||
            'No se pudo revisar el periodo.'}
        </Alert>
      )}

      {r && !r.ok && <Alert severity="warning">{r.message || 'Elige un periodo.'}</Alert>}

      {r?.ok && (
        <>
          {/* La frase primero. Cuatro números sueltos obligan a armar la historia
              en la cabeza; esto la cuenta y las tarjetas la detallan. */}
          <PanelCard>
            <Box sx={{ p: 2.25 }}>
              <Typography variant="h6"
fontWeight={700}
sx={{ mb: 0.5 }}>
                {`Se hicieron ${totalCampaigns} campañas en este periodo`}
              </Typography>
              <Typography variant="body1"
color="text.secondary"
sx={{ mb: 2 }}>
                {`${r.counts.matched} ya están cobradas en QuickBooks. Faltan ${r.counts.notBilled} por cobrar, que suman `}
                <Box component="span"
sx={{ color: 'error.main', fontWeight: 700 }}>
                  {money(r.totals.notBilled)}
                </Box>
                {r.counts.withDiff > 0
                  ? `. Otras ${r.counts.withDiff} se cobraron por un monto distinto al que calcula el sistema.`
                  : '.'}
              </Typography>

              <Stack direction="row"
alignItems="center"
spacing={1.5}>
                <Box sx={{ flex: 1 }}>
                  <LinearProgress
                    variant="determinate"
                    value={billedPct}
                    color="success"
                    sx={{ height: 10, borderRadius: 99 }}
                  />
                </Box>
                <Typography variant="body2"
fontWeight={700}
sx={{ whiteSpace: 'nowrap' }}>
                  {`${billedPct.toFixed(0)}% cobrado`}
                </Typography>
              </Stack>
            </Box>
          </PanelCard>

          <Stack direction={{ xs: 'column', md: 'row' }}
gap={2}>
            <StateCard
              icon={CheckCircleRoundedIcon}
              tone="success"
              title="Todo bien"
              question="El sistema las registró y QuickBooks las cobró por el mismo monto."
              value={String(Math.max(0, r.counts.matched - r.counts.withDiff))}
              detail={`${money(r.totals.billedCampaigns)} facturados`}
            />
            <StateCard
              icon={WarningAmberRoundedIcon}
              tone="error"
              title="Falta cobrarlas"
              question="Se hizo la campaña pero ninguna factura la cobra todavía."
              value={money(r.totals.notBilled)}
              detail={`${r.counts.notBilled} campañas · toca para verlas`}
              active={view === 'notBilled'}
              onClick={() => setView('notBilled')}
            />
            <StateCard
              icon={PriceChangeRoundedIcon}
              tone="warning"
              title="Se cobró distinto"
              question="Sí se cobraron, pero por un monto que no coincide con el del sistema."
              value={money(Math.abs(r.totals.diff))}
              detail={`${r.counts.withDiff} campañas · toca para verlas`}
              active={view === 'withDiff'}
              onClick={() => setView('withDiff')}
            />
            <StateCard
              icon={SearchRoundedIcon}
              tone="info"
              title="Cobrado sin respaldo"
              question="QuickBooks cobró una campaña que el sistema no tiene registrada."
              value={money(r.totals.billedNotFound)}
              detail={`${r.counts.billedNotFound} líneas · toca para verlas`}
              active={view === 'billedNotFound'}
              onClick={() => setView('billedNotFound')}
            />
          </Stack>

          {r.totals.notBilled > 0 && (
            <Alert severity="info">
              <Typography variant="body2">
                {`Normalmente la factura sale ${r.lag ? `entre ${r.lag.min} y ${r.lag.max}` : 'unos'} días después de la campaña. Lo que lleve más tiempo que eso probablemente se quedó sin cobrar.`}
              </Typography>
              <Typography variant="body2"
color="text.secondary"
sx={{ mt: 0.5 }}>
                Aviso: algunas campañas se cobran con precio cerrado y su factura no dice la
                fecha, así que no se pueden emparejar. Esas pueden aparecer acá aunque sí
                estén cobradas.
              </Typography>
            </Alert>
          )}

          <PanelCard sx={{ overflow: 'hidden' }}>
            {data.isFetching && <LinearProgress sx={{ height: 2 }} />}
            <SectionHeader
              icon={
                view === 'notBilled' ? (
                  <WarningAmberRoundedIcon />
                ) : view === 'withDiff' ? (
                  <PriceChangeRoundedIcon />
                ) : (
                  <SearchRoundedIcon />
                )
              }
              title={
                view === 'notBilled'
                  ? 'Campañas que falta cobrar'
                  : view === 'withDiff'
                    ? 'Campañas cobradas por otro monto'
                    : 'Cobros sin campaña registrada'
              }
              hint="Toca «Ver por qué» en cualquier fila para abrir la factura y la campaña"
              count={rows.length}
            />

            <Box sx={{ px: 2.25, pb: 2 }}>
              {rows.length === 0 ? (
                <EmptyBlock
                  title="Nada pendiente acá"
                  hint="Todo lo de este grupo cuadra en el periodo elegido. Prueba con otro grupo o amplía las fechas."
                />
              ) : (
                <Box sx={{ overflowX: 'auto' }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Tienda</TableCell>
                        <TableCell>Día de la campaña</TableCell>
                        <TableCell align="right">Destinatarios</TableCell>
                        {view === 'notBilled' && (
                          <>
                            <TableCell align="right">Debería cobrarse</TableCell>
                            <TableCell align="center">Espera</TableCell>
                          </>
                        )}
                        {view === 'withDiff' && (
                          <>
                            <TableCell align="right">Se cobró</TableCell>
                            <TableCell align="right">Debía ser</TableCell>
                            <TableCell align="right">Diferencia</TableCell>
                          </>
                        )}
                        {view === 'billedNotFound' && (
                          <>
                            <TableCell align="right">Se cobró</TableCell>
                            <TableCell>Factura</TableCell>
                          </>
                        )}
                        <TableCell align="right" />
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {rows.slice(0, 200).map((row: any, i: number) => (
                        <TableRow key={`${row.storeId}-${row.serviceDate}-${i}`}
hover>
                          <TableCell sx={{ maxWidth: 260 }}>
                            <Typography variant="body2"
noWrap>
                              {row.storeName || '—'}
                            </Typography>
                          </TableCell>
                          <TableCell sx={{ whiteSpace: 'nowrap' }}>
                            {fmtDate(row.serviceDate)}
                          </TableCell>
                          <TableCell align="right">
                            {(row.audience ?? row.billedAudience)?.toLocaleString() ?? '—'}
                          </TableCell>

                          {view === 'notBilled' && (
                            <>
                              <TableCell align="right">
                                <Typography variant="body2"
fontWeight={700}>
                                  {money(row.systemCost)}
                                </Typography>
                              </TableCell>
                              <TableCell align="center">
                                <Tooltip
                                  title={
                                    row.ageDays > 30
                                      ? 'Muy por encima del tiempo normal de facturación'
                                      : 'Dentro del tiempo normal'
                                  }
                                >
                                  <Chip
                                    size="small"
                                    color={ageColor(row.ageDays)}
                                    variant={ageColor(row.ageDays) === 'default' ? 'outlined' : 'filled'}
                                    label={`${row.ageDays} días`}
                                    sx={{ height: 20, '& .MuiChip-label': { px: 0.75, fontSize: '0.68rem' } }}
                                  />
                                </Tooltip>
                              </TableCell>
                            </>
                          )}

                          {view === 'withDiff' && (
                            <>
                              <TableCell align="right">{money(row.billedAmount)}</TableCell>
                              <TableCell align="right">{money(row.systemCost)}</TableCell>
                              <TableCell align="right">
                                <Typography
                                  variant="body2"
                                  fontWeight={700}
                                  color={row.diff > 0 ? 'success.main' : 'error.main'}
                                >
                                  {`${row.diff > 0 ? '+' : ''}${money(row.diff)}`}
                                </Typography>
                              </TableCell>
                            </>
                          )}

                          {view === 'billedNotFound' && (
                            <>
                              <TableCell align="right">
                                <Typography variant="body2"
fontWeight={700}>
                                  {money(row.amount)}
                                </Typography>
                              </TableCell>
                              <TableCell sx={{ whiteSpace: 'nowrap' }}>
                                <Typography variant="body2">
                                  {`${row.docNumber} · ${fmtDate(row.issuedAt)}`}
                                </Typography>
                              </TableCell>
                            </>
                          )}

                          {/* Botón visible en cada fila: una fila clicable sin
                              afordancia obliga a descubrirla por accidente. */}
                          <TableCell align="right"
sx={{ whiteSpace: 'nowrap' }}>
                            <Button
                              size="small"
                              variant="outlined"
                              startIcon={<SearchRoundedIcon sx={{ fontSize: 15 }} />}
                              onClick={() => setEvidence({ ...row, view } as EvidenceTarget)}
                              sx={{ py: 0.25, px: 1, fontSize: '0.72rem' }}
                            >
                              Ver por qué
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  {rows.length > 200 && (
                    <Typography variant="body2"
color="text.secondary"
sx={{ mt: 1 }}>
                      {`Se muestran 200 de ${rows.length}. Acorta el periodo para verlas todas.`}
                    </Typography>
                  )}
                </Box>
              )}
            </Box>
          </PanelCard>

          <PanelCard sx={{ overflow: 'hidden' }}>
            <SectionHeader
              icon={<ReceiptLongRoundedIcon />}
              title="Todo lo que se cobró en el periodo"
              hint={`${r.totals.invoicesInRange} facturas emitidas · ${r.totals.paymentsInRange} pagos recibidos`}
            />
            <Box sx={{ px: 2.25, pb: 2.25 }}>
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                divider={<Divider orientation="vertical"
flexItem />}
                gap={2.5}
                sx={{ mb: 2 }}
              >
                {[
                  ['Les facturamos', r.totals.billedInRange, 'en facturas emitidas'],
                  ['Nos pagaron', r.totals.paidInRange, 'en pagos recibidos'],
                  ['Nos deben de eso', r.totals.openFromRange, 'de esas mismas facturas'],
                ].map(([label, value, hint]) => (
                  <Box key={label as string}
flex={1}
minWidth={0}>
                    <Typography variant="subtitle2"
fontWeight={700}>
                      {label as string}
                    </Typography>
                    <Typography variant="h5"
fontWeight={700}
sx={{ fontVariantNumeric: 'tabular-nums' }}>
                      {money(value as number)}
                    </Typography>
                    <Typography variant="body2"
color="text.secondary">
                      {hint as string}
                    </Typography>
                  </Box>
                ))}
              </Stack>

              <Typography variant="body2"
color="text.secondary"
sx={{ mb: 1.5 }}>
                Lo facturado y lo pagado no tienen por qué coincidir: un pago de este mes
                puede estar saldando una factura de hace meses.
              </Typography>

              <Divider sx={{ mb: 1.5 }} />

              <Typography variant="subtitle2"
fontWeight={700}
sx={{ mb: 0.5 }}>
                Desglose por servicio
              </Typography>

              <Box sx={{ overflowX: 'auto' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Categoría</TableCell>
                      <TableCell>Servicio</TableCell>
                      <TableCell align="right">Veces cobrado</TableCell>
                      <TableCell align="right">Total</TableCell>
                      <TableCell align="right">Peso</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {r.billingMap.map((m) => (
                      <TableRow key={m.full}
hover>
                        <TableCell>
                          <Chip
                            size="small"
                            variant="outlined"
                            label={m.group}
                            sx={{ height: 20, '& .MuiChip-label': { px: 0.75, fontSize: '0.68rem' } }}
                          />
                        </TableCell>
                        <TableCell>{m.label}</TableCell>
                        <TableCell align="right">{m.lines.toLocaleString()}</TableCell>
                        <TableCell align="right">
                          <Typography variant="body2"
fontWeight={700}>
                            {money(m.amount)}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2"
color="text.secondary">
                            {r.totals.billedInRange > 0
                              ? `${((m.amount / r.totals.billedInRange) * 100).toFixed(1)}%`
                              : '—'}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>
            </Box>
          </PanelCard>
          {/* Opt-in y membresía: se fechan por la ventana entre facturas */}
          <PeriodsView periods={r.periods} />
        </>
      )}

      <EvidenceDialog target={evidence}
onClose={() => setEvidence(null)} />
    </Stack>
  );
}

export default ReconcileView;
