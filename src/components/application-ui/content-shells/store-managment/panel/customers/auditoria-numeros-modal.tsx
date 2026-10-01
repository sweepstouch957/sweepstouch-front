'use client';

/**
 * Depuración SIN campaña.
 *
 * El depurador clásico necesita logs de entrega; una base importada que nunca recibió un
 * SMS no los tiene. Acá se le pregunta al carrier (Infobip Number Lookup / HLR) qué
 * números existen: válidos quedan marcados, muertos se inactivan. Cada consulta se paga,
 * por eso primero se muestra cuántos son y cuánto cuesta.
 */
import {
  customerClient,
  type PhoneAuditEstimate,
  type PhoneAuditJob,
  type PhoneAuditScope,
} from '@/services/customerService';
import VerifiedUserRoundedIcon from '@mui/icons-material/VerifiedUserRounded';
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
  FormControlLabel,
  LinearProgress,
  Radio,
  RadioGroup,
  Stack,
  Typography,
  useTheme,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

type Props = {
  open: boolean;
  storeId: string;
  storeName?: string;
  onClose: () => void;
  onDone?: () => void;
};

const n = (v: number) => v.toLocaleString('es-US');
const usd = (v: number) => `$${v.toFixed(2)}`;

function Stat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <Box
      sx={{
        p: 1.5,
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider',
        minWidth: 0,
      }}
    >
      <Typography variant="body2" color="text.secondary" noWrap>
        {label}
      </Typography>
      <Typography variant="h5" fontWeight={800} color={color || 'text.primary'}>
        {value}
      </Typography>
    </Box>
  );
}

export default function AuditoriaNumerosModal({ open, storeId, storeName, onClose, onDone }: Props) {
  const theme = useTheme();
  const [scope, setScope] = useState<PhoneAuditScope>('unverified');
  const [estimate, setEstimate] = useState<PhoneAuditEstimate | null>(null);
  const [loading, setLoading] = useState(false);
  const [job, setJob] = useState<PhoneAuditJob | null>(null);

  // Vista previa al abrir y al cambiar el alcance (es una consulta a nuestra base, gratis).
  useEffect(() => {
    if (!open) return;
    let alive = true;
    setLoading(true);
    customerClient
      .auditPhones({ storeId, dryRun: true, scope })
      .then((d) => {
        if (!alive) return;
        const est = d as PhoneAuditEstimate;
        setEstimate(est);
        if (est.running) setJob(est.running);
      })
      .catch((e: any) => toast.error(e?.response?.data?.error || 'No se pudo calcular la vista previa'))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [open, storeId, scope]);

  // Mientras corre: progreso cada 2,5 s.
  const running = job?.status === 'running';
  const status = useQuery({
    queryKey: ['phone-audit', storeId],
    queryFn: () => customerClient.phoneAuditStatus(storeId),
    enabled: open && running,
    refetchInterval: running ? 2500 : false,
  });
  useEffect(() => {
    if (status.data?.job) setJob(status.data.job);
  }, [status.data]);
  useEffect(() => {
    if (job && job.status !== 'running') onDone?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [job?.status]);

  const start = async () => {
    setLoading(true);
    try {
      const d = await customerClient.auditPhones({ storeId, dryRun: false, scope });
      if ('job' in d) setJob(d.job);
    } catch (e: any) {
      const j = e?.response?.data?.job;
      if (j) setJob(j);
      toast.error(e?.response?.data?.error || 'No se pudo iniciar la auditoría');
    } finally {
      setLoading(false);
    }
  };

  const cancel = () =>
    customerClient.cancelPhoneAudit(storeId).catch(() => toast.error('No se pudo cancelar'));

  const pct = job && job.total ? Math.min(100, Math.round((job.done / job.total) * 100)) : 0;
  const validPct = job && job.done ? Math.round((job.valid / job.done) * 100) : 0;
  const topReasons = Object.entries(job?.reasons || {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);
  const topNetworks = Object.entries(job?.networks || {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);

  return (
    <Dialog open={open} onClose={running ? undefined : onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ pb: 1 }}>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 2,
              display: 'grid',
              placeItems: 'center',
              bgcolor: alpha(theme.palette.primary.main, 0.12),
              color: 'primary.main',
            }}
          >
            <VerifiedUserRoundedIcon fontSize="small" />
          </Box>
          <Box>
            <Typography variant="h6" fontWeight={800} lineHeight={1.2}>
              Depuración sin campaña
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {storeName || 'Tienda'} · Infobip Number Lookup
            </Typography>
          </Box>
        </Stack>
      </DialogTitle>

      <DialogContent>
        {!job && (
          <>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Le pregunta al carrier qué números existen de verdad, sin mandar ningún mensaje.
              Los que no existen se inactivan; los válidos quedan marcados. Así la primera
              campaña sale con alto porcentaje de entrega.
            </Typography>

            <RadioGroup value={scope} onChange={(e) => setScope(e.target.value as PhoneAuditScope)}>
              <FormControlLabel
                value="unverified"
                control={<Radio size="small" />}
                label={
                  <Box>
                    <Typography variant="body2" fontWeight={600}>
                      Sólo los nunca validados
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Activos sin resultado previo de lookup ni de depuración por logs.
                    </Typography>
                  </Box>
                }
                sx={{ alignItems: 'flex-start', mb: 1 }}
              />
              <FormControlLabel
                value="all"
                control={<Radio size="small" />}
                label={
                  <Box>
                    <Typography variant="body2" fontWeight={600}>
                      Todos los activos
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Vuelve a consultar también los ya validados (paga de nuevo).
                    </Typography>
                  </Box>
                }
                sx={{ alignItems: 'flex-start' }}
              />
            </RadioGroup>

            {loading && !estimate ? (
              <Stack alignItems="center" py={3}>
                <CircularProgress size={28} />
              </Stack>
            ) : estimate ? (
              <Box
                display="grid"
                gridTemplateColumns={{ xs: '1fr 1fr', sm: 'repeat(4, 1fr)' }}
                gap={1.5}
                mt={2}
              >
                <Stat label="A revisar" value={n(estimate.total)} />
                <Stat
                  label="Estructura inválida"
                  value={n(estimate.structureInvalid)}
                  color={estimate.structureInvalid ? 'error.main' : undefined}
                />
                <Stat label="Consultas a Infobip" value={n(estimate.toLookup)} />
                <Stat label="Costo estimado" value={usd(estimate.estCostUsd)} color="warning.main" />
              </Box>
            ) : null}

            {estimate && (estimate.validated > 0 || estimate.invalidated > 0) && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
                Ya auditados en esta tienda: {n(estimate.validated)} válidos ·{' '}
                {n(estimate.invalidated)} inválidos.
              </Typography>
            )}
            {estimate && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                Referencia {usd(estimate.costPerLookupUsd)} por consulta. Los de estructura
                inválida se inactivan gratis, sin consultar.
              </Typography>
            )}
          </>
        )}

        {job && (
          <>
            <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1}>
              <Typography variant="body2" fontWeight={600}>
                {job.status === 'running'
                  ? 'Consultando al carrier…'
                  : job.status === 'done'
                    ? 'Auditoría terminada'
                    : job.status === 'cancelled'
                      ? 'Cancelada (lo revisado queda guardado)'
                      : 'Falló'}
              </Typography>
              <Chip
                size="small"
                label={`${n(job.done)} / ${n(job.total)}`}
                color={job.status === 'running' ? 'info' : job.status === 'done' ? 'success' : 'default'}
              />
            </Stack>
            <LinearProgress
              variant="determinate"
              value={pct}
              sx={{ height: 8, borderRadius: 1, mb: 2 }}
            />
            {job.error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {job.error}
              </Alert>
            )}

            <Box display="grid" gridTemplateColumns={{ xs: '1fr 1fr', sm: 'repeat(4, 1fr)' }} gap={1.5}>
              <Stat label="Válidos" value={n(job.valid)} color="success.main" />
              <Stat label="Inactivados" value={n(job.invalid)} color="error.main" />
              <Stat label="Sin veredicto" value={n(job.unknown)} />
              <Stat label="Entrega esperada" value={job.done ? `${validPct}%` : '—'} color="primary.main" />
            </Box>

            {(topReasons.length > 0 || topNetworks.length > 0) && (
              <Stack direction={{ xs: 'column', sm: 'row' }} gap={2} mt={2}>
                {topReasons.length > 0 && (
                  <Box flex={1}>
                    <Typography variant="body2" fontWeight={600} gutterBottom>
                      Por qué se inactivaron
                    </Typography>
                    {topReasons.map(([k, v]) => (
                      <Typography key={k} variant="body2" color="text.secondary">
                        {n(v)} · {k}
                      </Typography>
                    ))}
                    {job.structureInvalid > 0 && (
                      <Typography variant="body2" color="text.secondary">
                        {n(job.structureInvalid)} · estructura inválida
                      </Typography>
                    )}
                  </Box>
                )}
                {topNetworks.length > 0 && (
                  <Box flex={1}>
                    <Typography variant="body2" fontWeight={600} gutterBottom>
                      Operadoras
                    </Typography>
                    {topNetworks.map(([k, v]) => (
                      <Typography key={k} variant="body2" color="text.secondary">
                        {n(v)} · {k}
                      </Typography>
                    ))}
                  </Box>
                )}
              </Stack>
            )}
            {job.status !== 'running' && job.unknown > 0 && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
                "Sin veredicto" = el carrier respondió con un error temporal (apagado, sin
                cobertura). Siguen activos; volver a correr "Sólo los nunca validados" los
                reintenta.
              </Typography>
            )}
          </>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        {!job && (
          <>
            <Button onClick={onClose} color="inherit">
              Cancelar
            </Button>
            <Button
              variant="contained"
              onClick={start}
              disabled={loading || !estimate || estimate.total === 0}
            >
              {estimate && estimate.total > 0
                ? `Validar ${n(estimate.total)} números (${usd(estimate.estCostUsd)})`
                : 'Nada para validar'}
            </Button>
          </>
        )}
        {job && running && (
          <Button onClick={cancel} color="inherit">
            Detener
          </Button>
        )}
        {job && !running && (
          <Button variant="contained" onClick={onClose}>
            Cerrar
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
