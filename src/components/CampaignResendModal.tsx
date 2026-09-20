'use client';

import { campaignClient, type ResendPreview, type ResendResult } from '@/services/campaing.service';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CheckCircleRounded from '@mui/icons-material/CheckCircleRounded';
import CancelRounded from '@mui/icons-material/CancelRounded';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import ReplayIcon from '@mui/icons-material/Replay';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  IconButton,
  LinearProgress,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useQueryClient } from '@tanstack/react-query';
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
// Tipos ResendPreview / ResendResult: ver campaing.service.ts (contrato del tracking-service).

/** Mensaje del servidor (409 reenvío en curso, 422 no reenviable, etc.) antes que uno genérico. */
function serverMessage(e: any, fallback: string): string {
  const data = e?.response?.data;
  const msg = (typeof data === 'string' ? data : data?.error || data?.message) || '';
  if (msg) return String(msg);
  const status = e?.response?.status;
  if (status === 409) return 'Ya hay un reenvío en curso para esta campaña. Esperá a que termine.';
  if (status === 422) return 'Esta campaña no se puede reenviar.';
  return e?.message || fallback;
}

async function fetchResendPreview(campaignId: string): Promise<ResendPreview> {
  return campaignClient.getResendPreview(campaignId);
}

async function executeResend(campaignId: string): Promise<ResendResult> {
  return campaignClient.resendCampaignErrors(campaignId);
}

// ─── Props ────────────────────────────────────────────────────────────────────
type Step = 'preview' | 'loading-preview' | 'confirm' | 'sending' | 'done' | 'error';

interface Props {
  open: boolean;
  onClose: () => void;
  campaignId: string;
}

// ─── Reducer ─────────────────────────────────────────────────────────────────
// ✅ useReducer: replaces 4 useState + 4-8 cascading setState calls in a single useEffect
type ModalState = {
  step: Step;
  preview: ResendPreview | null;
  result: ResendResult | null;
  errorMsg: string;
};

type ModalAction =
  | { type: 'RESET' }
  | { type: 'SET_PREVIEW'; payload: ResendPreview }
  | { type: 'SET_RESULT'; payload: ResendResult }
  | { type: 'SET_STEP'; payload: Step }
  | { type: 'SET_ERROR'; payload: string };

function modalReducer(state: ModalState, action: ModalAction): ModalState {
  switch (action.type) {
    case 'RESET':
      return { step: 'loading-preview', preview: null, result: null, errorMsg: '' };
    case 'SET_PREVIEW':
      return { ...state, preview: action.payload, step: 'confirm' };
    case 'SET_RESULT':
      return { ...state, result: action.payload, step: 'done' };
    case 'SET_STEP':
      return { ...state, step: action.payload };
    case 'SET_ERROR':
      return { ...state, errorMsg: action.payload, step: 'error' };
    default:
      return state;
  }
}

// ─── Component ────────────────────────────────────────────────────────────────
const CampaignResendModal: React.FC<Props> = ({ open, onClose, campaignId }) => {
  const [state, dispatch] = React.useReducer(modalReducer, {
    step: 'loading-preview',
    preview: null,
    result: null,
    errorMsg: '',
  } satisfies ModalState);

  const { step, preview, result, errorMsg } = state;
  const queryClient = useQueryClient();
  // Confirmación explícita: el reenvío manda SMS reales que cuestan dinero.
  const [ack, setAck] = React.useState(false);
  const sendingRef = React.useRef(false);

  const resendableCount = Number(preview?.resendableCount) || 0;
  const uniqueResendPhones = Number(preview?.uniqueResendPhones) || 0;
  const permanentCount = Number(preview?.permanentCount) || 0;
  const alreadyResentCount = Number(preview?.alreadyResentCount) || 0;
  const resendBreakdown = preview?.resendBreakdown ?? [];
  const permanentBreakdown = preview?.permanentBreakdown ?? [];

  // Resultado: cuando no había nada que reenviar el backend sólo manda { success, message, resent: 0 }.
  const resent = Number(result?.resent) || 0;
  const resultPhones = Number(result?.uniquePhones) || 0;
  const permanentSkipped = Number(result?.permanentSkipped) || 0;
  const failedChunks = Number(result?.failedChunks) || 0;
  const notResent = Math.max(0, resultPhones - resent);
  const nothingSent = resent === 0;

  // Cargar preview cada vez que se abre el modal
  React.useEffect(() => {
    if (!open || !campaignId) return;
    // Si el modal se cierra o cambia de campaña, la respuesta vieja se descarta.
    let cancelled = false;
    // ✅ single dispatch replaces 4 cascading setStates
    dispatch({ type: 'RESET' });
    setAck(false);

    fetchResendPreview(campaignId)
      .then((data) => {
        if (cancelled) return;
        if (data?.success === false) {
          dispatch({ type: 'SET_ERROR', payload: 'No se pudo cargar el preview del reenvío.' });
          return;
        }
        dispatch({ type: 'SET_PREVIEW', payload: data });
      })
      .catch((e) => {
        if (cancelled) return;
        dispatch({ type: 'SET_ERROR', payload: serverMessage(e, 'Error al cargar el preview') });
      });
    return () => {
      cancelled = true;
    };
  }, [open, campaignId]);

  const refreshCampaignQueries = React.useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['campaign', campaignId] });
    queryClient.invalidateQueries({ queryKey: ['campaign', 'logs', campaignId] });
    queryClient.invalidateQueries({ queryKey: ['rcs-metrics', campaignId] });
    queryClient.invalidateQueries({ queryKey: ['rcs-summary'] });
    queryClient.invalidateQueries({ queryKey: ['campaigns'] });
  }, [queryClient, campaignId]);

  const handleResend = async () => {
    // Sin confirmación, sin nada que reenviar o con un envío ya en vuelo: no se manda.
    if (!ack || resendableCount <= 0 || sendingRef.current) return;
    sendingRef.current = true;
    dispatch({ type: 'SET_STEP', payload: 'sending' });
    try {
      const data = await executeResend(campaignId);
      if (data?.success === false) {
        dispatch({ type: 'SET_ERROR', payload: data?.message || 'El servidor no pudo reenviar los mensajes.' });
        return;
      }
      dispatch({ type: 'SET_RESULT', payload: data });
      refreshCampaignQueries();
      // El backend recalcula las métricas de la campaña ~15 s después del reenvío.
      setTimeout(refreshCampaignQueries, 20_000);
    } catch (e: any) {
      dispatch({ type: 'SET_ERROR', payload: serverMessage(e, 'Error al reenviar') });
    } finally {
      sendingRef.current = false;
    }
  };

  const handleClose = () => {
    if (step === 'sending') return;
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
          Reenviar mensajes fallidos
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
            {resendableCount === 0 ? (
              <Alert severity="success" icon={<CheckCircleIcon />}>
                {permanentCount > 0
                  ? `Los ${permanentCount.toLocaleString()} errores son permanentes (STOP, números inválidos, etc.) — no hay nada que reenviar.`
                  : 'No hay mensajes con error para reenviar.'}
              </Alert>
            ) : (
              <>
                <Alert severity="warning" icon={<WarningAmberIcon />}>
                  Se reenviarán <strong>{uniqueResendPhones.toLocaleString()}</strong> números únicos
                  ({resendableCount.toLocaleString()} logs con errores temporales, de{' '}
                  {(Number(preview.totalErrors) || 0).toLocaleString()} errores en total).
                  {permanentCount > 0 && (
                    <> <strong>{permanentCount.toLocaleString()} errores permanentes</strong> serán omitidos (STOP, inválidos, etc.).</>
                  )}
                </Alert>

                {/* El texto tenía placeholders por cliente: el reenvío usa valores genéricos */}
                {preview.personalizedNotice && <Alert severity="warning">{preview.personalizedNotice}</Alert>}

                {alreadyResentCount > 0 && (
                  <Alert severity="info" sx={{ fontSize: 13 }}>
                    Esta campaña ya tuvo reenvíos: <strong>{alreadyResentCount.toLocaleString()}</strong> mensajes
                    ya se reenviaron antes.
                  </Alert>
                )}

                {/* Chips de info */}
                <Stack direction="row" flexWrap="wrap" gap={1}>
                  <Chip label={`Campaign: ${preview.campaign?.title ?? campaignId}`} size="small" variant="outlined" />
                  <Chip label={`Tipo: ${preview.campaign?.type?.toUpperCase() ?? '-'}`} size="small" color="primary" variant="outlined" />
                  <Chip label={`Platform: ${preview.campaign?.platform ?? 'infobip'}`} size="small" color="secondary" variant="outlined" />
                </Stack>

                {/* Errores RESENDABLES */}
                {resendBreakdown.length > 0 && (
                  <Box>
                    <Typography variant="caption" color="success.main" fontWeight={700} mb={0.5} display="block">
                      <CheckCircleRounded fontSize="small" sx={{ mr: 1, verticalAlign: 'middle' }} />Se reenviarán ({resendableCount.toLocaleString()} mensajes)
                    </Typography>
                    <Stack spacing={0.6}>
                      {resendBreakdown.map(({ code, count }) => (
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
                          <Chip label={(Number(count) || 0).toLocaleString()} size="small" color="warning" variant="outlined" />
                        </Stack>
                      ))}
                    </Stack>
                  </Box>
                )}

                {/* Errores PERMANENTES — solo info, no se reenvían */}
                {permanentBreakdown.length > 0 && (
                  <Box>
                    <Typography variant="caption" color="error.main" fontWeight={700} mb={0.5} display="block">
                      <CancelRounded fontSize="small" sx={{ mr: 1, verticalAlign: 'middle' }} />Se omitirán (permanentes: {permanentCount.toLocaleString()} mensajes)
                    </Typography>
                    <Stack spacing={0.6}>
                      {permanentBreakdown.map(({ code, count }) => (
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
                          <Chip label={(Number(count) || 0).toLocaleString()} size="small" color="error" variant="outlined" />
                        </Stack>
                      ))}
                    </Stack>
                  </Box>
                )}

                <Alert severity="info" sx={{ fontSize: 13 }}>
                  <strong>Sin duplicados:</strong> cada número único se envía una sola vez.
                  Los STOP y números muertos jamás se reenvían.
                </Alert>

                {/* Paso de confirmación explícita: son SMS reales con costo */}
                <FormControlLabel
                  sx={{ alignItems: 'flex-start', m: 0 }}
                  control={
                    <Checkbox
                      checked={ack}
                      onChange={(e) => setAck(e.target.checked)}
                      color="warning"
                      sx={{ pt: 0.25 }}
                    />
                  }
                  label={
                    <Typography variant="body2">
                      Entiendo que se enviarán <strong>{uniqueResendPhones.toLocaleString()}</strong> mensajes
                      reales y que tienen costo.
                    </Typography>
                  }
                />
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
            {nothingSent ? (
              <WarningAmberIcon sx={{ fontSize: 56, color: 'warning.main' }} />
            ) : (
              <CheckCircleIcon sx={{ fontSize: 56, color: 'success.main' }} />
            )}
            <Typography variant="h6" fontWeight={800}>
              {nothingSent ? 'No se reenvió ningún mensaje' : 'Reenvío completado'}
            </Typography>
            <Stack direction="row" spacing={1.5} flexWrap="wrap" justifyContent="center" useFlexGap>
              <Chip label={`${resent.toLocaleString()} enviados`} color={nothingSent ? 'default' : 'success'} size="medium" />
              {resultPhones > 0 && (
                <Chip label={`${resultPhones.toLocaleString()} números únicos`} color="primary" variant="outlined" size="medium" />
              )}
              {permanentSkipped > 0 && (
                <Chip label={`${permanentSkipped.toLocaleString()} permanentes omitidos`} color="error" variant="outlined" size="medium" />
              )}
            </Stack>
            {/* Tandas rechazadas por el sms-worker: esos números quedaron sin reenviar */}
            {(failedChunks > 0 || notResent > 0) && (
              <Alert severity="warning" sx={{ width: '100%' }}>
                {failedChunks > 0 ? `${failedChunks.toLocaleString()} tanda${failedChunks !== 1 ? 's' : ''} no se pudo enviar. ` : ''}
                {notResent > 0 ? `${notResent.toLocaleString()} números quedaron sin reenviar. ` : ''}
                Revisá los logs de la campaña antes de intentar de nuevo.
              </Alert>
            )}
            {nothingSent ? (
              <Alert severity="info" sx={{ width: '100%' }}>
                {result.message || 'No había mensajes para reenviar.'}
              </Alert>
            ) : (
              <Alert severity="success" sx={{ width: '100%' }}>
                Los mensajes fueron encolados. Las métricas subirán conforme el proveedor confirme las entregas.
              </Alert>
            )}
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

        {/* Deshabilitado mientras carga/envía, sin nada que reenviar o sin la confirmación marcada */}
        {(step === 'loading-preview' || step === 'confirm' || step === 'sending') && (
          <Button
            onClick={handleResend}
            variant="contained"
            color="warning"
            startIcon={
              step === 'confirm' ? (
                <ReplayIcon />
              ) : (
                <CircularProgress
                  size={16}
                  color="inherit"
                />
              )
            }
            disabled={step !== 'confirm' || resendableCount <= 0 || !ack}
            sx={{ fontWeight: 700 }}
          >
            {step === 'sending'
              ? 'Enviando…'
              : step === 'confirm' && resendableCount > 0
                ? `Reenviar ${uniqueResendPhones.toLocaleString()} mensajes`
                : 'Reenviar'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default CampaignResendModal;
