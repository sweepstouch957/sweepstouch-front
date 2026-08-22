'use client';

import {
  EmptyBlock,
  PanelCard,
  SectionHeader,
} from '@/components/application-ui/content-shells/store-managment/panel-kit';
import { money } from '@/components/application-ui/content-shells/qbo-receivables/constants';
import {
  recalcCampaignCosts,
  type RecalcParams,
  type RecalcResult,
} from '@/services/campaing.service';
import CalculateRoundedIcon from '@mui/icons-material/CalculateRounded';
import PlayArrowRoundedIcon from '@mui/icons-material/PlayArrowRounded';
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded';
import {
  Alert,
  Box,
  Button,
  Chip,
  Divider,
  LinearProgress,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
  alpha,
  useTheme,
} from '@mui/material';
import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';

const BASIS: Record<string, { label: string; color: 'default' | 'warning' | 'info' }> = {
  standard: { label: 'Estándar', color: 'default' },
  custom: { label: 'Tarifa propia', color: 'warning' },
  flat: { label: 'Tarifa plana', color: 'info' },
};

/**
 * Recálculo masivo del costo de las campañas.
 *
 * Hace falta porque el costo se congela al crear la campaña: si una tienda
 * negoció $0.05 el MMS después, sus campañas viejas siguen calculadas a la
 * tarifa estándar y ese hueco aparece como descuadre contra QuickBooks.
 *
 * Siempre corre primero en simulación. Escribir sobre cientos de campañas ya
 * facturadas sin ver antes qué cambia no es algo que se deba poder hacer de un
 * solo clic.
 */
export function RecalcCampaignCosts() {
  const theme = useTheme();
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [type, setType] = useState('');
  const [storeId, setStoreId] = useState('');
  const [preview, setPreview] = useState<RecalcResult | null>(null);
  const [applied, setApplied] = useState<RecalcResult | null>(null);

  const params = (dryRun: boolean): RecalcParams => ({
    dryRun,
    ...(from ? { from } : {}),
    ...(to ? { to } : {}),
    ...(type ? { type: type as 'SMS' | 'MMS' } : {}),
    ...(storeId.trim() ? { storeId: storeId.trim() } : {}),
  });

  const run = useMutation({
    mutationFn: (dryRun: boolean) => recalcCampaignCosts(params(dryRun)),
    onSuccess: (data) => {
      if (data.dryRun) {
        setPreview(data);
        setApplied(null);
      } else {
        setApplied(data);
        setPreview(null);
      }
    },
  });

  const r = applied ?? preview;
  const delta = r ? r.totalAfter - r.totalBefore : 0;
  const changedRows = (r?.details ?? []).filter((d) => d.changed).slice(0, 100);

  return (
    <PanelCard sx={{ m: { xs: 2, sm: 3 } }}>
      <SectionHeader
        icon={<CalculateRoundedIcon />}
        title="Recalcular costo de campañas"
        hint="Aplica las tarifas vigentes de cada tienda a las campañas ya creadas"
      />

      <Box sx={{ px: 2.25, pb: 2.25 }}>
        <Typography variant="body2"
color="text.secondary"
sx={{ mb: 2 }}>
          El costo se guarda al crear la campaña, así que cambiar la tarifa de una tienda no
          mueve lo que ya pasó. Esto lo recalcula hacia atrás con las tarifas de hoy: la propia
          de la tienda si tiene, la del código si no. Sin filtros toca todas las campañas.
        </Typography>

        <Stack direction={{ xs: 'column', md: 'row' }}
gap={1.5}
sx={{ mb: 2 }}>
          <TextField
            label="Desde"
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            size="small"
            fullWidth
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label="Hasta"
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            size="small"
            fullWidth
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label="Tipo"
            select
            value={type}
            onChange={(e) => setType(e.target.value)}
            size="small"
            fullWidth
          >
            <MenuItem value="">Todos</MenuItem>
            <MenuItem value="SMS">SMS</MenuItem>
            <MenuItem value="MMS">MMS</MenuItem>
          </TextField>
          <TextField
            label="Una sola tienda (id)"
            value={storeId}
            onChange={(e) => setStoreId(e.target.value)}
            placeholder="opcional"
            size="small"
            fullWidth
          />
        </Stack>

        <Stack direction="row"
gap={1}
flexWrap="wrap">
          <Button
            variant="outlined"
            startIcon={<VisibilityRoundedIcon />}
            onClick={() => run.mutate(true)}
            disabled={run.isPending}
          >
            Simular
          </Button>
          <Button
            variant="contained"
            color="warning"
            startIcon={<PlayArrowRoundedIcon />}
            onClick={() => run.mutate(false)}
            // Solo después de simular: es la única forma de saber qué se va a tocar
            disabled={run.isPending || !preview || preview.changed === 0}
          >
            {preview ? `Aplicar a ${preview.changed} campañas` : 'Aplicar'}
          </Button>
        </Stack>

        {run.isPending && <LinearProgress sx={{ mt: 2, borderRadius: 1 }} />}

        {run.isError && (
          <Alert severity="error"
sx={{ mt: 2 }}>
            <Typography variant="body2">
              {(run.error as any)?.response?.data?.error || 'No se pudo recalcular.'}
            </Typography>
          </Alert>
        )}

        {r && (
          <>
            <Divider sx={{ my: 2 }} />

            <Alert severity={applied ? 'success' : r.changed ? 'warning' : 'success'}
sx={{ mb: 2 }}>
              <Typography variant="body2">
                {applied
                  ? `Listo: ${applied.updated} campañas actualizadas de ${applied.matched} revisadas.`
                  : r.changed === 0
                    ? `Revisadas ${r.matched} campañas y ninguna cambia: los costos ya están bien.`
                    : `De ${r.matched} campañas revisadas, ${r.changed} cambian de costo. El total pasa de ${money(r.totalBefore)} a ${money(r.totalAfter)}, ${delta >= 0 ? 'sube' : 'baja'} ${money(Math.abs(delta))}. Nada se ha guardado todavía.`}
              </Typography>
            </Alert>

            {r.byBasis && (
              <Stack direction="row"
gap={1}
flexWrap="wrap"
sx={{ mb: 2 }}>
                {Object.entries(r.byBasis)
                  .filter(([, n]) => n > 0)
                  .map(([k, n]) => (
                    <Chip
                      key={k}
                      size="small"
                      variant="outlined"
                      color={BASIS[k]?.color ?? 'default'}
                      label={`${BASIS[k]?.label ?? k}: ${n}`}
                    />
                  ))}
              </Stack>
            )}

            {!changedRows.length ? (
              <EmptyBlock
                title="Nada que cambiar"
                hint="Todas las campañas del filtro ya tienen el costo que les toca."
              />
            ) : (
              <Box sx={{ overflowX: 'auto' }}>
                <Table size="small"
sx={{ tableLayout: 'fixed', minWidth: 720 }}>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ width: '30%' }}>Tienda</TableCell>
                      <TableCell sx={{ width: '10%' }}>Tipo</TableCell>
                      <TableCell align="right"
sx={{ width: '13%' }}>
                        Mensajes
                      </TableCell>
                      <TableCell align="right"
sx={{ width: '14%' }}>
                        Costaba
                      </TableCell>
                      <TableCell align="right"
sx={{ width: '14%' }}>
                        Pasa a
                      </TableCell>
                      <TableCell sx={{ width: '19%' }}>Cómo se calculó</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {changedRows.map((d) => {
                      const before = Number(d.costBefore);
                      const after = Number(d.costAfter);
                      const up = after > before;
                      return (
                        <TableRow
                          key={d.id}
                          hover
                          sx={{
                            bgcolor:
                              d.basis === 'standard'
                                ? undefined
                                : alpha(theme.palette.warning.main, 0.04),
                          }}
                        >
                          <TableCell>
                            <Typography variant="body2"
fontWeight={600}
noWrap>
                              {d.storeName || d.storeId || '—'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">{d.type}</Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography
                              variant="body2"
                              sx={{ fontVariantNumeric: 'tabular-nums' }}
                            >
                              {(d.status === 'completed' ? d.sent : d.audience).toLocaleString()}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              sx={{ fontVariantNumeric: 'tabular-nums' }}
                            >
                              {money(before)}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography
                              variant="body2"
                              fontWeight={800}
                              color={up ? 'success.main' : 'error.main'}
                              sx={{ fontVariantNumeric: 'tabular-nums' }}
                            >
                              {money(after)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2"
color="text.secondary">
                              {d.basis === 'flat'
                                ? `Plana desde ${d.threshold?.toLocaleString()}`
                                : d.rate != null
                                  ? `$${d.rate} por mensaje`
                                  : '—'}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>

                {r.changed > changedRows.length && (
                  <Typography variant="body2"
color="text.secondary"
sx={{ mt: 1.5 }}>
                    {`Se muestran las primeras ${changedRows.length} de ${r.changed}. Al aplicar se actualizan todas.`}
                  </Typography>
                )}
              </Box>
            )}
          </>
        )}
      </Box>
    </PanelCard>
  );
}

export default RecalcCampaignCosts;
