'use client';

import {
  EmptyBlock,
  PanelCard,
  SectionHeader,
} from '@/components/application-ui/content-shells/store-managment/panel-kit';
import RangePickerField, { type RangePickerValue } from '@/components/base/range-picker-field';
import { deliveryRecount, type DeliveryRecountResult } from '@/services/campaing.service';
import MarkEmailReadRoundedIcon from '@mui/icons-material/MarkEmailReadRounded';
import PlayArrowRoundedIcon from '@mui/icons-material/PlayArrowRounded';
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded';
import {
  Alert,
  Box,
  Button,
  Divider,
  LinearProgress,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';

const pct = (n: number) => `${(n * 100).toFixed(1)}%`;

/**
 * Recalcula la entrega de las campañas de un rango: los mensajes que Infobip marcó
 * UNDELIVERABLE_NOT_DELIVERED pasan a entregado (el estado real queda guardado aparte)
 * y se recalculan enviados, errores y % de entrega. Como el recálculo de costos, siempre
 * se simula primero.
 */
export function RecountCampaignDelivery() {
  const [range, setRange] = useState<RangePickerValue>({ startYmd: '', endYmd: '' });
  const [preview, setPreview] = useState<DeliveryRecountResult | null>(null);
  const [applied, setApplied] = useState<DeliveryRecountResult | null>(null);

  const run = useMutation({
    mutationFn: (dryRun: boolean) =>
      deliveryRecount({ from: range.startYmd, to: range.endYmd, dryRun }),
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

  const hasRange = !!range.startYmd && !!range.endYmd;
  const r = applied ?? preview;
  const rows = r?.details ?? [];

  return (
    <PanelCard sx={{ m: { xs: 2, sm: 3 } }}>
      <SectionHeader
        icon={<MarkEmailReadRoundedIcon />}
        title="Recalcular entrega de campañas"
        hint="Cuenta como entregados los mensajes UNDELIVERABLE_NOT_DELIVERED"
      />

      <Box sx={{ px: 2.25, pb: 2.25 }}>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mb: 2 }}
        >
          Las campañas nuevas ya se guardan así. Esto corrige las que ya se enviaron: esos mensajes
          pasan a entregado en el panel y en el vendor-site, y se recalcula el % de entrega. El
          estado original de Infobip queda guardado aparte.
        </Typography>

        <Stack
          direction={{ xs: 'column', md: 'row' }}
          gap={1.5}
          sx={{ mb: 2 }}
        >
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <RangePickerField
              label="Campañas entre"
              value={range}
              onChange={(v) => {
                setRange(v);
                setPreview(null);
              }}
              sx={{ minWidth: 250 }}
            />
          </LocalizationProvider>
        </Stack>

        <Stack
          direction="row"
          gap={1}
          flexWrap="wrap"
        >
          <Button
            variant="outlined"
            startIcon={<VisibilityRoundedIcon />}
            onClick={() => run.mutate(true)}
            disabled={run.isPending || !hasRange}
          >
            Simular
          </Button>
          <Button
            variant="contained"
            color="warning"
            startIcon={<PlayArrowRoundedIcon />}
            onClick={() => run.mutate(false)}
            // Solo después de simular: es la única forma de ver qué se va a tocar
            disabled={run.isPending || !preview || preview.affected === 0}
          >
            {preview ? `Aplicar a ${preview.affected} campañas` : 'Aplicar'}
          </Button>
        </Stack>

        {run.isPending && <LinearProgress sx={{ mt: 2, borderRadius: 1 }} />}

        {run.isError && (
          <Alert
            severity="error"
            sx={{ mt: 2 }}
          >
            <Typography variant="body2">
              {(run.error as any)?.response?.data?.error || 'No se pudo recalcular.'}
            </Typography>
          </Alert>
        )}

        {r && (
          <>
            <Divider sx={{ my: 2 }} />

            <Alert
              severity={applied ? 'success' : r.affected ? 'warning' : 'success'}
              sx={{ mb: 2 }}
            >
              <Typography variant="body2">
                {applied
                  ? `Listo: ${(applied.updated ?? 0).toLocaleString()} mensajes pasaron a entregado en ${applied.affected} campañas.`
                  : r.affected === 0
                    ? `Revisadas ${r.matched} campañas: ninguna tiene mensajes para corregir.`
                    : `De ${r.matched} campañas del rango, ${r.affected} tienen ${r.logs.toLocaleString()} mensajes para corregir. ${r.recovered.toLocaleString()} de ellos hoy cuentan como error y suben el % de entrega. Nada se ha guardado todavía.`}
              </Typography>
            </Alert>

            {!rows.length ? (
              <EmptyBlock
                title="Nada que cambiar"
                hint="Las campañas del rango ya muestran la entrega con la regla nueva."
              />
            ) : (
              <Box sx={{ overflowX: 'auto' }}>
                <Table
                  size="small"
                  sx={{ tableLayout: 'fixed', minWidth: 720 }}
                >
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ width: '36%' }}>Campaña</TableCell>
                      <TableCell sx={{ width: '12%' }}>Fecha</TableCell>
                      <TableCell
                        align="right"
                        sx={{ width: '13%' }}
                      >
                        Audiencia
                      </TableCell>
                      <TableCell
                        align="right"
                        sx={{ width: '13%' }}
                      >
                        Recuperados
                      </TableCell>
                      <TableCell
                        align="right"
                        sx={{ width: '13%' }}
                      >
                        Entrega antes
                      </TableCell>
                      <TableCell
                        align="right"
                        sx={{ width: '13%' }}
                      >
                        Pasa a
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {rows.map((d) => (
                      <TableRow
                        key={d.id}
                        hover
                      >
                        <TableCell>
                          <Typography
                            variant="body2"
                            fontWeight={600}
                            noWrap
                            title={d.title}
                          >
                            {d.title || d.id}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {new Date(d.startDate).toLocaleDateString()}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography
                            variant="body2"
                            sx={{ fontVariantNumeric: 'tabular-nums' }}
                          >
                            {d.audience.toLocaleString()}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography
                            variant="body2"
                            sx={{ fontVariantNumeric: 'tabular-nums' }}
                          >
                            {d.recovered.toLocaleString()}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ fontVariantNumeric: 'tabular-nums' }}
                          >
                            {pct(d.rateBefore)}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography
                            variant="body2"
                            fontWeight={800}
                            color={d.rateAfter > d.rateBefore ? 'success.main' : 'text.primary'}
                            sx={{ fontVariantNumeric: 'tabular-nums' }}
                          >
                            {pct(d.rateAfter)}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {r.affected > rows.length && (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mt: 1.5 }}
                  >
                    {`Se muestran las primeras ${rows.length} de ${r.affected}. Al aplicar se corrigen todas.`}
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

export default RecountCampaignDelivery;
