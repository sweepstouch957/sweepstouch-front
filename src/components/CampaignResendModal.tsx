'use client';

import { api } from '@/libs/axios';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import ReplayIcon from '@mui/icons-material/Replay';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import {
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
  IconButton,
  LinearProgress,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import * as React from 'react';

// ─── Codigos de error con descripcion amigable ───────────────────────────────
const ERROR_LABELS: Record<string, string> = {
  '9902': 'DLR Timeout (carrier no confirmó en 2h)',
  '902':  'DLR Timeout (carrier no confirmó en 2h)',
  '4750': 'Número inválido o sin servicio',
  '9999': 'Error interno del carrier',
  '4720': 'Número inactivo / desconectado',
  '4731': 'Número bloqueado (spam/opt-out)',
  '4432': 'Toll-free no verificado para este carrier',
  'unknown': 'Error desconocido',
};

function errLabel(code: string) {
  return ERROR_LABELS[code] ?? `Error ${code}`;
}

// ─── Servicio API ─────────────────────────────────────────────────────────────
interface ResendPreview {
  success: boolean;
  campaignId: string;
  campaign: {
    title: string;
    type: string;
    platform: string;
    audience: number;
    sent: number;
    errors: number;
  } | null;
  totalErrors: number;
  // Resendables
  resendableCount: number;
  uniqueResendPhones: number;
  resendBreakdown: { code: string; count: number; resendable: boolean }[];
  // Permanentes (opt-outs, números muertos, etc.)
  permanentCount: number;
  permanentBreakdown: { code: string; count: number; resendable: boolean }[];
}

interface ResendResult {
  success: boolean;
  campaignId: string;
  totalErrors: number;
  uniquePhones: number;
  resent: number;
  permanentSkipped?: number;
  message?: string;
}

async function fetchResendPreview(campaignId: string): Promise<ResendPreview> {
  const res = await api.get(`/tracking/campaigns/${campaignId}/resend-preview`);
  return res.data;
}

async function executeResend(campaignId: string): Promise<ResendResult> {
  const res = await api.post(`/tracking/campaigns/${campaignId}/resend-errors`);
  return res.data;
}

// ─── Props ────────────────────────────────────────────────────────────────────
type Step = 'preview' | 'loading-preview' | 'confirm' | 'sending' | 'done' | 'error';

interface Props {
  open: boolean;
  onClose: () => void;
  campaignId: string;
}

// ─── Component ────────────────────────────────────────────────────────────────
const CampaignResendModal: React.FC<Props> = ({ open, onClose, campaignId }) => {
  const [step, setStep] = React.useState<Step>('loading-preview');
  const [preview, setPreview] = React.useState<ResendPreview | null>(null);
  const [result, setResult] = React.useState<ResendResult | null>(null);
  const [errorMsg, setErrorMsg] = React.useState('');

  // Cargar preview cada vez que se abre el modal
  React.useEffect(() => {
    if (!open) return;
    setStep('loading-preview');
    setPreview(null);
    setResult(null);
    setErrorMsg('');

    fetchResendPreview(campaignId)
      .then((data) => {
        setPreview(data);
        setStep('confirm');
      })
      .catch((e) => {
        setErrorMsg(e?.response?.data?.error || e?.message || 'Error al cargar el preview');
        setStep('error');
      });
  }, [open, campaignId]);

  const handleResend = async () => {
    setStep('sending');
    try {
      const data = await executeResend(campaignId);
      setResult(data);
      setStep('done');
    } catch (e: any) {
      setErrorMsg(e?.response?.data?.error || e?.message || 'Error al reenviar');
      setStep('error');
    }
  };

  const handleClose = () => {
    if (step === 'sending') return; // No cerrar mientras envía
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{ sx: { borderRadius: 3 } }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          pb: 1,
        }}
      >
        <ReplayIcon color="warning" />
        <Typography variant="h6" fontWeight={800} sx={{ flexGrow: 1 }}>
          Resend Failed Messages
        </Typography>
        {step !== 'sending' && (
          <IconButton size="small" onClick={handleClose}>
            <CloseIcon />
          </IconButton>
        )}
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ pt: 2 }}>
        {/* ─── Loading preview ─────────────────────────────────────── */}
        {step === 'loading-preview' && (
          <Stack alignItems="center" spacing={2} py={4}>
            <CircularProgress size={40} />
            <Typography color="text.secondary">Analizando mensajes fallidos…</Typography>
          </Stack>
        )}

        {/* ─── Confirm (preview loaded) ─────────────────────────────── */}
        {step === 'confirm' && preview && (
          <Stack spacing={2.5}>
            {preview.resendableCount === 0 ? (
              <Alert severity="success" icon={<CheckCircleIcon />}>
                {preview.permanentCount > 0
                  ? `Los ${preview.permanentCount} errores son permanentes (STOP, números inválidos, etc.) — no hay nada que reenviar.`
                  : 'No hay mensajes con error. ¡Todo está entregado!'}
              </Alert>
            ) : (
              <>
                <Alert severity="warning" icon={<WarningAmberIcon />}>
                  Se reenviarán <strong>{preview.uniqueResendPhones.toLocaleString()}</strong> números únicos
                  ({preview.resendableCount.toLocaleString()} logs con errores temporales).
                  {preview.permanentCount > 0 && (
                    <> <strong>{preview.permanentCount.toLocaleString()} errores permanentes</strong> serán omitidos (STOP, inválidos, etc.).</>
                  )}
                </Alert>

                {/* Chips de info */}
                <Stack direction="row" flexWrap="wrap" gap={1}>
                  <Chip label={`Campaign: ${preview.campaign?.title ?? campaignId}`} size="small" variant="outlined" />
                  <Chip label={`Tipo: ${preview.campaign?.type?.toUpperCase() ?? '-'}`} size="small" color="primary" variant="outlined" />
                  <Chip label={`Platform: ${preview.campaign?.platform ?? 'bandwidth'}`} size="small" color="secondary" variant="outlined" />
                </Stack>

                {/* Errores RESENDABLES */}
                {preview.resendBreakdown.length > 0 && (
                  <Box>
                    <Typography variant="caption" color="success.main" fontWeight={700} mb={0.5} display="block">
                      ✅ Se reenviarán ({preview.resendableCount.toLocaleString()} mensajes)
                    </Typography>
                    <Stack spacing={0.6}>
                      {preview.resendBreakdown.map(({ code, count }) => (
                        <Stack
                          key={code}
                          direction="row"
                          alignItems="center"
                          justifyContent="space-between"
                          sx={{ px: 1.5, py: 0.7, border: '1px solid', borderColor: 'success.light', borderRadius: 2, bgcolor: 'success.50' }}
                        >
                          <Stack direction="row" spacing={1} alignItems="center">
                            <ErrorOutlineIcon fontSize="small" color="warning" />
                            <Typography variant="body2" fontWeight={600}>{code}</Typography>
                            <Typography variant="caption" color="text.secondary">{errLabel(code)}</Typography>
                          </Stack>
                          <Chip label={count.toLocaleString()} size="small" color="warning" variant="outlined" />
                        </Stack>
                      ))}
                    </Stack>
                  </Box>
                )}

                {/* Errores PERMANENTES — solo info, no se reenvían */}
                {preview.permanentBreakdown.length > 0 && (
                  <Box>
                    <Typography variant="caption" color="error.main" fontWeight={700} mb={0.5} display="block">
                      ❌ Se omitirán — permanentes ({preview.permanentCount.toLocaleString()} mensajes)
                    </Typography>
                    <Stack spacing={0.6}>
                      {preview.permanentBreakdown.map(({ code, count }) => (
                        <Stack
                          key={code}
                          direction="row"
                          alignItems="center"
                          justifyContent="space-between"
                          sx={{ px: 1.5, py: 0.7, border: '1px solid', borderColor: 'error.light', borderRadius: 2, opacity: 0.75 }}
                        >
                          <Stack direction="row" spacing={1} alignItems="center">
                            <ErrorOutlineIcon fontSize="small" color="error" />
                            <Tooltip title={
                              code === '4475' ? 'STOP/Opt-out — ilegal reenviar' :
                              code === '4406' ? 'Número no asignado — no existe' :
                              code === '4720' ? 'Número inválido o landline' :
                              code === '4721' ? 'Número desactivado' :
                              code === '4482' ? 'Número en blacklist' : 'Error permanente'
                            }>
                              <Typography variant="body2" fontWeight={600}>{code}</Typography>
                            </Tooltip>
                            <Typography variant="caption" color="text.secondary">{errLabel(code)}</Typography>
                          </Stack>
                          <Chip label={count.toLocaleString()} size="small" color="error" variant="outlined" />
                        </Stack>
                      ))}
                    </Stack>
                  </Box>
                )}

                <Alert severity="info" sx={{ fontSize: 13 }}>
                  <strong>Sin duplicados:</strong> cada número único se envía una sola vez.
                  Los STOP y números muertos jamás se reenvían.
                </Alert>
              </>
            )}
          </Stack>
        )}

        {/* ─── Sending ─────────────────────────────────────────────── */}
        {step === 'sending' && (
          <Stack spacing={2} py={2}>
            <LinearProgress color="warning" />
            <Typography align="center" color="text.secondary">
              Enviando mensajes… esto puede tardar unos segundos.
            </Typography>
            <Typography align="center" variant="caption" color="text.disabled">
              No cierres esta ventana.
            </Typography>
          </Stack>
        )}

        {/* ─── Done ────────────────────────────────────────────────── */}
        {step === 'done' && result && (
          <Stack spacing={2} alignItems="center" py={2}>
            <CheckCircleIcon sx={{ fontSize: 56, color: '#19B278' }} />
            <Typography variant="h6" fontWeight={800}>
              Reenvío completado
            </Typography>
            <Stack direction="row" spacing={1.5} flexWrap="wrap" justifyContent="center">
              <Chip label={`${result.resent.toLocaleString()} enviados`} color="success" size="medium" />
              <Chip label={`${result.uniquePhones.toLocaleString()} números únicos`} color="primary" variant="outlined" size="medium" />
              {(result.permanentSkipped ?? 0) > 0 && (
                <Chip label={`${result.permanentSkipped!.toLocaleString()} permanentes omitidos`} color="error" variant="outlined" size="medium" />
              )}
            </Stack>
            <Alert severity="success" sx={{ width: '100%' }}>
              Los mensajes fueron encolados. Las métricas subirán conforme Bandwidth confirme las entregas.
            </Alert>
          </Stack>
        )}

        {/* ─── Error ───────────────────────────────────────────────── */}
        {step === 'error' && (
          <Stack spacing={2} py={2}>
            <Alert severity="error">
              {errorMsg || 'Ocurrió un error inesperado.'}
            </Alert>
          </Stack>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
        <Button onClick={handleClose} variant="outlined" disabled={step === 'sending'}>
          {step === 'done' ? 'Cerrar' : 'Cancelar'}
        </Button>

        {step === 'confirm' && (preview?.resendableCount ?? 0) > 0 && (
          <Button
            onClick={handleResend}
            variant="contained"
            color="warning"
            startIcon={<ReplayIcon />}
            sx={{ fontWeight: 700 }}
          >
            Resend {preview!.uniqueResendPhones.toLocaleString()} messages
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default CampaignResendModal;
