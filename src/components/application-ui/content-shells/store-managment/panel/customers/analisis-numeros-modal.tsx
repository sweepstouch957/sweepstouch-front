'use client';

import {
  customerClient,
  type PhoneAnalysisClass,
  type PhoneAnalysisResponse,
} from '@/services/customerService';
import BlockRoundedIcon from '@mui/icons-material/BlockRounded';
import HistoryToggleOffRoundedIcon from '@mui/icons-material/HistoryToggleOffRounded';
import PhoneDisabledRoundedIcon from '@mui/icons-material/PhoneDisabledRounded';
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded';
import {
  alpha,
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  LinearProgress,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material';
import { format } from 'date-fns';
import React, { useState } from 'react';

/**
 * Diagnóstico de números antes de inactivar.
 *
 * El depurador clásico sólo mira códigos permanentes. Este mira la ventana
 * completa (90 días por defecto) y separa lo que nunca va a recibir un mensaje
 * de lo que sólo tuvo un mal día. Nada se inactiva hasta que se revisa acá.
 */
type Props = {
  open: boolean;
  storeId: string;
  onClose: () => void;
  onDone?: () => void;
};

const CLASS_META: Record<
  Exclude<PhoneAnalysisClass, never>,
  { label: string; help: string; color: 'error' | 'warning' | 'info' | 'success'; icon: React.ReactNode }
> = {
  optout: {
    label: 'Opt-out',
    help: 'El usuario mandó STOP o el carrier lo bloqueó. No se le puede volver a escribir.',
    color: 'error',
    icon: <BlockRoundedIcon sx={{ fontSize: 16 }} />,
  },
  invalid: {
    label: 'Inválidos',
    help: 'El número no existe o no puede recibir SMS. Nunca va a llegar.',
    color: 'error',
    icon: <PhoneDisabledRoundedIcon sx={{ fontSize: 16 }} />,
  },
  recurrent: {
    label: 'Reincidentes',
    help: 'Sólo errores blandos, pero repetidos en toda la ventana y sin una sola entrega.',
    color: 'warning',
    icon: <HistoryToggleOffRoundedIcon sx={{ fontSize: 16 }} />,
  },
  watch: {
    label: 'En observación',
    help: 'Falló poco o llegó a recibir algún mensaje. NO se inactiva.',
    color: 'info',
    icon: <VisibilityRoundedIcon sx={{ fontSize: 16 }} />,
  },
};

const PURGEABLE: PhoneAnalysisClass[] = ['optout', 'invalid', 'recurrent'];

export default function AnalisisNumerosModal({ open, storeId, onClose, onDone }: Props) {
  const theme = useTheme();

  const [windowDays, setWindowDays] = useState(90);
  const [minFailures, setMinFailures] = useState(3);
  const [selected, setSelected] = useState<PhoneAnalysisClass[]>(PURGEABLE);

  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PhoneAnalysisResponse | null>(null);
  const [applied, setApplied] = useState<PhoneAnalysisResponse | null>(null);

  const toggleClass = (c: PhoneAnalysisClass) =>
    setSelected((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));

  async function runPreview() {
    setLoading(true);
    setError(null);
    setApplied(null);
    try {
      const data = await customerClient.analizarPhones({
        storeId,
        windowDays,
        minFailures,
        classes: selected,
        pageSize: 200,
        dryRun: true,
      });
      setResult(data);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'No se pudo analizar la base.');
    } finally {
      setLoading(false);
    }
  }

  async function apply() {
    setApplying(true);
    setError(null);
    try {
      const data = await customerClient.analizarPhones({
        storeId,
        windowDays,
        minFailures,
        // "En observación" nunca se manda: no se inactiva algo que aún puede recibir
        classes: selected.filter((c) => c !== 'watch'),
        dryRun: false,
      });
      setApplied(data);
      onDone?.();
    } catch (err: any) {
      setError(err?.response?.data?.error || 'No se pudieron inactivar los números.');
    } finally {
      setApplying(false);
    }
  }

  const rows = result?.rows ?? [];
  const selectedPurgeable = selected.filter((c) => c !== 'watch');
  const toPurge = selectedPurgeable.reduce((acc, c) => acc + (result?.totals?.[c] ?? 0), 0);

  return (
    <Dialog
      open={open}
      onClose={loading || applying ? undefined : onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{ sx: { borderRadius: 3 } }}
    >
      <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>
        Analizar números
        <Typography
          variant="caption"
          color="text.secondary"
          display="block"
        >
          Revisa qué números no van a recibir nunca un mensaje. Los que saques se quitan de
          la audiencia de <b>esta tienda</b>; en sus otras tiendas siguen igual.
        </Typography>
      </DialogTitle>
      <Divider />

      <DialogContent sx={{ pt: 2.5 }}>
        {/* ── Parámetros ── */}
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2}
          mb={2}
        >
          <TextField
            label="Ventana (días)"
            type="number"
            size="small"
            value={windowDays}
            onChange={(e) => setWindowDays(Number(e.target.value))}
            helperText="90 = últimos 3 meses"
            sx={{ width: 180 }}
          />
          <TextField
            label="Fallos mínimos"
            type="number"
            size="small"
            value={minFailures}
            onChange={(e) => setMinFailures(Number(e.target.value))}
            helperText="Para contar como reincidente"
            sx={{ width: 180 }}
          />
          <Box flex={1} />
          <Button
            variant="outlined"
            onClick={runPreview}
            disabled={loading || applying}
            startIcon={loading ? <CircularProgress size={14} /> : undefined}
            sx={{ alignSelf: 'flex-start', borderRadius: 1.5, textTransform: 'none' }}
          >
            {loading ? 'Analizando…' : 'Analizar'}
          </Button>
        </Stack>

        {loading && <LinearProgress sx={{ mb: 2, borderRadius: 2 }} />}

        {error && (
          <Alert
            severity="error"
            sx={{ mb: 2, borderRadius: 2 }}
          >
            {error}
          </Alert>
        )}

        {applied && (
          <Alert
            severity="success"
            sx={{ mb: 2, borderRadius: 2 }}
          >
            {applied.updated ?? 0} de {applied.matched ?? 0} números quitados de esta tienda.
            {(applied.deactivated ?? 0) > 0 && (
              <>
                {' '}
                {applied.deactivated} quedaron sin ninguna tienda y se marcaron inactivos.
              </>
            )}
          </Alert>
        )}

        {result?.note && (
          <Alert
            severity="info"
            sx={{ mb: 2, borderRadius: 2 }}
          >
            {result.note}
          </Alert>
        )}

        {/* ── Filtros por clase ── */}
        {result && (
          <>
            <Typography
              variant="caption"
              fontWeight={700}
              color="text.secondary"
              display="block"
              mb={1}
            >
              QUÉ INCLUIR
            </Typography>
            <Stack
              direction="row"
              spacing={1}
              flexWrap="wrap"
              useFlexGap
              mb={2}
            >
              {(Object.keys(CLASS_META) as PhoneAnalysisClass[]).map((c) => {
                const meta = CLASS_META[c];
                const active = selected.includes(c);
                return (
                  <Tooltip
                    key={c}
                    title={meta.help}
                    arrow
                  >
                    <Chip
                      icon={meta.icon as any}
                      label={`${meta.label} · ${result.totals?.[c] ?? 0}`}
                      onClick={() => toggleClass(c)}
                      variant={active ? 'filled' : 'outlined'}
                      color={active ? meta.color : 'default'}
                      sx={{ fontWeight: 700, borderRadius: 1.5, cursor: 'pointer' }}
                    />
                  </Tooltip>
                );
              })}
            </Stack>

            {selected.includes('watch') && (
              <Alert
                severity="info"
                sx={{ mb: 2, borderRadius: 2 }}
              >
                Los de <b>observación</b> se muestran para revisarlos, pero no se tocan:
                todavía pueden recibir mensajes.
              </Alert>
            )}

            {/* ── Listado ── */}
            <Box sx={{ maxHeight: 340, overflow: 'auto', borderRadius: 2, border: `1px solid ${alpha(theme.palette.divider, 0.6)}` }}>
              <Table
                size="small"
                stickyHeader
              >
                <TableHead>
                  <TableRow>
                    <TableCell>Número</TableCell>
                    <TableCell>Clase</TableCell>
                    <TableCell align="right">Fallos</TableCell>
                    <TableCell align="right">Entregas</TableCell>
                    <TableCell>Último fallo</TableCell>
                    <TableCell>Motivo</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        align="center"
                        sx={{ py: 4, color: 'text.disabled' }}
                      >
                        Sin números en las clases seleccionadas.
                      </TableCell>
                    </TableRow>
                  ) : (
                    rows.map((r) => {
                      const meta = CLASS_META[r.class];
                      return (
                        <TableRow
                          key={r.phone}
                          hover
                        >
                          <TableCell sx={{ fontFamily: 'monospace', fontSize: 12 }}>{r.phone}</TableCell>
                          <TableCell>
                            <Chip
                              label={meta.label}
                              size="small"
                              color={meta.color}
                              variant="outlined"
                              sx={{ height: 20, fontSize: 10, fontWeight: 700 }}
                            />
                          </TableCell>
                          <TableCell align="right">{r.failures}</TableCell>
                          <TableCell align="right">{r.deliveries}</TableCell>
                          <TableCell sx={{ fontSize: 11.5 }}>
                            {r.lastFailAt ? format(new Date(r.lastFailAt), 'dd MMM yyyy') : '—'}
                            {r.spanDays > 0 && (
                              <Typography
                                variant="caption"
                                color="text.disabled"
                                display="block"
                              >
                                {r.spanDays} días fallando
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell sx={{ fontSize: 11.5 }}>{r.mainReason}</TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </Box>

            {(result.totalRows ?? 0) > rows.length && (
              <Typography
                variant="caption"
                color="text.secondary"
                mt={1}
                display="block"
              >
                Mostrando {rows.length} de {result.totalRows}. Al aplicar se inactivan todos, no
                sólo los visibles.
              </Typography>
            )}
          </>
        )}
      </DialogContent>

      <Divider />
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button
          onClick={onClose}
          disabled={applying}
          variant="outlined"
          sx={{ borderRadius: 1.5, textTransform: 'none' }}
        >
          Cerrar
        </Button>
        <Button
          onClick={apply}
          disabled={!result || applying || toPurge === 0}
          variant="contained"
          color="error"
          disableElevation
          startIcon={applying ? <CircularProgress size={14} color="inherit" /> : undefined}
          sx={{ borderRadius: 1.5, textTransform: 'none', fontWeight: 700 }}
        >
          {applying ? 'Quitando…' : `Quitar de la tienda (${toPurge})`}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
