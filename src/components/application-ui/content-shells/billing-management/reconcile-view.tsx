'use client';

import {
  EmptyBlock,
  KpiCard,
  KpiRow,
  PanelCard,
  SectionHeader,
} from '@/components/application-ui/content-shells/store-managment/panel-kit';
import { fmtDate, money } from '@/components/application-ui/content-shells/qbo-receivables/constants';
import RangePickerField, { type RangePickerValue } from '@/components/base/range-picker-field';
import { useQboReconcile } from '@hooks/fetching/qbo/useQbo';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import DifferenceRoundedIcon from '@mui/icons-material/DifferenceRounded';
import MoneyOffRoundedIcon from '@mui/icons-material/MoneyOffRounded';
import RuleRoundedIcon from '@mui/icons-material/RuleRounded';
import ScheduleRoundedIcon from '@mui/icons-material/ScheduleRounded';
import {
  Alert,
  AlertTitle,
  Box,
  Chip,
  LinearProgress,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from '@mui/material';
import { useMemo, useState } from 'react';

type View = 'notBilled' | 'withDiff' | 'billedNotFound';

const ymd = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/** Antigüedad contra el atraso normal medido (4–7 días). */
function ageColor(days: number): 'default' | 'warning' | 'error' {
  if (days <= 10) return 'default';
  if (days <= 30) return 'warning';
  return 'error';
}

/**
 * Conciliación por fecha de SERVICIO.
 *
 * Comparar por fecha de emisión nunca cuadra: la contadora factura con days de
 * atraso y en ventanas propias, así que las campañas del 28 al 30 de julio caen
 * en una factura del 3 de agosto. Acá cada campaña se parea con la línea que la
 * cobró usando fecha de servicio + audiencia, y cuándo se emitió deja de importar.
 */
export function ReconcileView() {
  const [range, setRange] = useState<RangePickerValue>(() => {
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - 60);
    return { startYmd: ymd(from), endYmd: ymd(to) };
  });
  const [view, setView] = useState<View>('notBilled');

  const data = useQboReconcile(range.startYmd, range.endYmd);
  const r = data.data;

  const rows = useMemo(() => {
    if (!r) return [];
    if (view === 'notBilled') return r.notBilled;
    if (view === 'withDiff') return r.withDiff;
    return r.billedNotFound;
  }, [r, view]);

  const VIEWS: Array<{ value: View; label: string; count: number; amount: number }> = [
    { value: 'notBilled', label: 'Sin facturar', count: r?.counts.notBilled ?? 0, amount: r?.totals.notBilled ?? 0 },
    { value: 'withDiff', label: 'Con diferencia', count: r?.counts.withDiff ?? 0, amount: r?.totals.diff ?? 0 },
    {
      value: 'billedNotFound',
      label: 'Facturado sin registro',
      count: r?.counts.billedNotFound ?? 0,
      amount: r?.totals.billedNotFound ?? 0,
    },
  ];

  return (
    <Stack gap={2.5}>
      <PanelCard>
        <SectionHeader
          icon={<RuleRoundedIcon />}
          title="Periodo a conciliar"
          hint="Por fecha de servicio, no de emisión: así el atraso de facturación no afecta"
          action={
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <RangePickerField
                label="Servicios entre"
                value={range}
                onChange={setRange}
                sx={{ width: 240 }}
              />
            </LocalizationProvider>
          }
        />
      </PanelCard>

      {data.isLoading && (
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
height={280}
sx={{ borderRadius: '18px' }} />
        </Stack>
      )}

      {data.isError && (
        <Alert severity="error">
          {(data.error as any)?.response?.data?.message ||
            (data.error as Error)?.message ||
            'No se pudo conciliar.'}
        </Alert>
      )}

      {r && !r.ok && <Alert severity="warning">{r.message || 'Falta el rango.'}</Alert>}

      {r?.ok && (
        <>
          <KpiRow>
            <KpiCard
              icon={<CheckCircleRoundedIcon />}
              label="Pareadas"
              value={r.counts.matched}
              delta={`${money(r.totals.billedCampaigns)} facturados`}
            />
            <KpiCard
              icon={<MoneyOffRoundedIcon />}
              label="Sin facturar"
              value={money(r.totals.notBilled)}
              delta={`${r.counts.notBilled} campañas`}
              tone={r.totals.notBilled > 0 ? 'error' : 'neutral'}
            />
            <KpiCard
              icon={<DifferenceRoundedIcon />}
              label="Diferencia en lo pareado"
              value={money(r.totals.diff)}
              delta={`${r.counts.withDiff} con desajuste`}
              tone={Math.abs(r.totals.diff) >= 1 ? 'warning' : 'neutral'}
            />
            <KpiCard
              icon={<ScheduleRoundedIcon />}
              label="Atraso de facturación"
              value={r.lag ? `${r.lag.median} d` : '—'}
              delta={r.lag ? `entre ${r.lag.min} y ${r.lag.max} días` : 'sin datos'}
            />
          </KpiRow>

          {r.totals.notBilled > 0 && (
            <Alert severity={r.notBilled[0]?.ageDays > 30 ? 'error' : 'info'}>
              <AlertTitle>
                {`${money(r.totals.notBilled)} en campañas completadas sin factura que las cobre`}
              </AlertTitle>
              <Typography variant="caption">
                {r.lag
                  ? `El atraso normal medido es de ${r.lag.min} a ${r.lag.max} días. Lo que aparezca por encima de eso ya no es atraso.`
                  : 'Revisa la antigüedad de cada una.'}
                {' Ojo: las líneas de tarifa plana no traen fecha en la descripción y no se pueden parear, así que algunas podrían estar facturadas.'}
              </Typography>
            </Alert>
          )}

          <PanelCard sx={{ overflow: 'hidden' }}>
            {data.isFetching && <LinearProgress sx={{ height: 2 }} />}
            <SectionHeader
              icon={<RuleRoundedIcon />}
              title="Detalle"
              hint={`Servicios del ${r.range.from} al ${r.range.to}`}
              action={
                <ToggleButtonGroup
                  size="small"
                  exclusive
                  value={view}
                  onChange={(_, v) => v && setView(v as View)}
                >
                  {VIEWS.map((v) => (
                    <ToggleButton key={v.value}
value={v.value}
sx={{ px: 1.25, whiteSpace: 'nowrap' }}>
                      {`${v.label} (${v.count})`}
                    </ToggleButton>
                  ))}
                </ToggleButtonGroup>
              }
            />

            <Box sx={{ px: 2.25, pb: 2 }}>
              {rows.length === 0 ? (
                <EmptyBlock
                  title="Nada en esta categoría"
                  hint="Todo lo del periodo cuadra en este eje. Prueba con otra vista o amplía el rango."
                />
              ) : (
                <Box sx={{ overflowX: 'auto' }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Tienda</TableCell>
                        <TableCell>Servicio</TableCell>
                        <TableCell align="center">Tipo</TableCell>
                        <TableCell align="right">Audiencia</TableCell>
                        {view === 'notBilled' && (
                          <>
                            <TableCell align="right">Costo</TableCell>
                            <TableCell align="center">Antigüedad</TableCell>
                          </>
                        )}
                        {view === 'withDiff' && (
                          <>
                            <TableCell align="right">Facturado</TableCell>
                            <TableCell align="right">Sistema</TableCell>
                            <TableCell align="right">Dif.</TableCell>
                            <TableCell>Factura</TableCell>
                          </>
                        )}
                        {view === 'billedNotFound' && (
                          <>
                            <TableCell align="right">Facturado</TableCell>
                            <TableCell>Factura</TableCell>
                          </>
                        )}
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
                          <TableCell sx={{ whiteSpace: 'nowrap' }}>{fmtDate(row.serviceDate)}</TableCell>
                          <TableCell align="center">
                            <Chip
                              size="small"
                              variant="outlined"
                              label={row.type}
                              sx={{ height: 19, '& .MuiChip-label': { px: 0.6, fontSize: '0.65rem' } }}
                            />
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
                                <Chip
                                  size="small"
                                  color={ageColor(row.ageDays)}
                                  variant={ageColor(row.ageDays) === 'default' ? 'outlined' : 'filled'}
                                  label={`${row.ageDays} d`}
                                  sx={{ height: 19, '& .MuiChip-label': { px: 0.6, fontSize: '0.65rem' } }}
                                />
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
                              <TableCell sx={{ whiteSpace: 'nowrap' }}>
                                <Tooltip
                                  title={
                                    row.lagDays != null
                                      ? `Emitida ${row.lagDays} días después del servicio`
                                      : ''
                                  }
                                >
                                  <Typography variant="caption">{row.docNumber}</Typography>
                                </Tooltip>
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
                                <Typography variant="caption">
                                  {`${row.docNumber} · ${fmtDate(row.issuedAt)}`}
                                </Typography>
                              </TableCell>
                            </>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  {rows.length > 200 && (
                    <Typography variant="caption"
color="text.secondary"
sx={{ display: 'block', mt: 1 }}>
                      {`Mostrando 200 de ${rows.length}. Acota el periodo para verlas todas.`}
                    </Typography>
                  )}
                </Box>
              )}
            </Box>
          </PanelCard>

          <PanelCard sx={{ overflow: 'hidden' }}>
            <SectionHeader
              icon={<RuleRoundedIcon />}
              title="Facturado en el periodo"
              hint="Membresía y opt-in no se parean: no llevan fecha de servicio en el texto"
            />
            <Box sx={{ px: 2.25, pb: 2.25 }}>
              <Stack direction={{ xs: 'column', sm: 'row' }}
gap={3}>
                {[
                  ['Membresías', r.totals.billedMembership],
                  ['Opt-in', r.totals.billedOptin],
                  ['Otros cargos', r.totals.billedOtros],
                ].map(([label, value]) => (
                  <Box key={label as string}>
                    <Typography variant="caption"
color="text.secondary"
fontWeight={600}>
                      {String(label).toUpperCase()}
                    </Typography>
                    <Typography variant="h5"
fontWeight={700}>
                      {money(value as number)}
                    </Typography>
                  </Box>
                ))}
              </Stack>
            </Box>
          </PanelCard>
        </>
      )}
    </Stack>
  );
}

export default ReconcileView;
