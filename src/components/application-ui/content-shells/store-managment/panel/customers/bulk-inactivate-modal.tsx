'use client';

import React, { useState } from 'react';
import {
  Alert,
  alpha,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  FormControlLabel,
  IconButton,
  Radio,
  RadioGroup,
  Stack,
  Typography,
  useTheme,
  LinearProgress,
} from '@mui/material';
import {
  CloseRounded,
  DeleteSweepRounded,
  PreviewRounded,
  CheckCircleOutlineRounded,
  UploadFileRounded,
} from '@mui/icons-material';
import { api } from '@/libs/axios';
import { ExcelCustomerDropzone, ParsedCustomer } from '@/components/shared/ExcelCustomerDropzone';

interface BulkInactivateModalProps {
  open: boolean;
  onClose: () => void;
  storeId: string;
  storeName?: string;
  onSuccess?: () => void;
}

interface BulkInactivateResult {
  dryRun: boolean;
  mode: string;
  inputCount: number;
  matchedCount?: number;
  toActivateCount?: number;
  toDeactivateCount?: number;
  activatedCount?: number;
  deactivatedCount?: number;
  preview?: Array<{ phone: string; action: string }>;
  previewActivate?: string[];
  previewDeactivate?: string[];
}

export default function BulkInactivateModal({
  open,
  onClose,
  storeId,
  storeName,
  onSuccess,
}: BulkInactivateModalProps) {
  const theme = useTheme();

  // States
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [parsedData, setParsedData] = useState<ParsedCustomer[] | null>(null);
  const [mode, setMode] = useState<'inactivate_uploaded' | 'keep_uploaded_active'>('inactivate_uploaded');
  const [previewResult, setPreviewResult] = useState<BulkInactivateResult | null>(null);
  const [execResult, setExecResult] = useState<BulkInactivateResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'upload' | 'preview' | 'done'>('upload');

  React.useEffect(() => {
    let interval: NodeJS.Timeout;
    if (loading) {
      setProgress(0);
      interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 95) {
            clearInterval(interval);
            return 95;
          }
          const stepVal = Math.max(1, Math.floor((100 - prev) / 8));
          return prev + stepVal;
        });
      }, 150);
    } else {
      setProgress(100);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [loading]);

  const reset = () => {
    setParsedData(null);
    setPreviewResult(null);
    setExecResult(null);
    setError(null);
    setProgress(0);
    setStep('upload');
    setMode('inactivate_uploaded');
  };

  const handleClose = () => {
    if (loading) return;
    reset();
    onClose();
  };

  // Step 1: Dry run (preview)
  const handlePreview = async () => {
    if (!parsedData || parsedData.length === 0) return;
    setLoading(true);
    setError(null);
    try {
      const phones = parsedData.map(c => c.phone);
      const res = await api.post('/tracking/phones/bulk-inactivate', {
        storeId,
        phones,
        mode,
        dryRun: true,
      });
      setPreviewResult(res.data);
      setStep('preview');
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Error al obtener vista previa en lote.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Execute (dryRun: false)
  const handleExecute = async () => {
    if (!parsedData || parsedData.length === 0) return;
    setLoading(true);
    setError(null);
    try {
      const phones = parsedData.map(c => c.phone);
      const res = await api.post('/tracking/phones/bulk-inactivate', {
        storeId,
        phones,
        mode,
        dryRun: false,
      });
      setExecResult(res.data);
      setStep('done');
      onSuccess?.();
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Error al ejecutar el lote.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          background: theme.palette.background.paper,
          backgroundImage: `linear-gradient(135deg, ${alpha(theme.palette.error.main, 0.02)} 0%, transparent 60%)`,
          border: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
        },
      }}
    >
      {/* ─── Header ─── */}
      <DialogTitle sx={{ pb: 1 }}>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: `linear-gradient(135deg, ${theme.palette.error.dark} 0%, ${theme.palette.error.main} 100%)`,
              boxShadow: `0 4px 12px ${alpha(theme.palette.error.main, 0.4)}`,
            }}
          >
            <DeleteSweepRounded sx={{ color: 'white', fontSize: 20 }} />
          </Box>
          <Box flex={1}>
            <Typography variant="h6" fontWeight={700}>
              Inactivación / Activación Masiva
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {storeName || storeId}: Modificación de estado de clientes en lotes
            </Typography>
          </Box>
          <IconButton size="small" onClick={handleClose} disabled={loading}>
            <CloseRounded />
          </IconButton>
        </Stack>
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ pt: 2.5, minHeight: 280 }}>
        {loading && (
          <Box sx={{ width: '100%', mb: 2.5 }}>
            <LinearProgress variant="determinate" value={progress} color={mode === 'keep_uploaded_active' ? 'primary' : 'error'} sx={{ height: 6, borderRadius: 3 }} />
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block', textAlign: 'right', fontWeight: 600 }}>
              Procesando... {progress}%
            </Typography>
          </Box>
        )}
        {/* ─── Step 1: Upload & Mode ─── */}
        {step === 'upload' && (
          <Stack spacing={3}>
            <ExcelCustomerDropzone
              onExtracted={(data) => setParsedData(data.length > 0 ? data : null)}
              isLoading={loading}
            />

            {parsedData && (
              <Box 
                sx={{ 
                  p: 2, 
                  borderRadius: 2, 
                  border: `1px solid ${theme.palette.divider}`,
                  bgcolor: alpha(theme.palette.action.hover, 0.02)
                }}
              >
                <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                  Selecciona la regla de lote a aplicar:
                </Typography>
                <FormControl component="fieldset" fullWidth>
                  <RadioGroup
                    value={mode}
                    onChange={(e) => setMode(e.target.value as any)}
                  >
                    <FormControlLabel
                      value="inactivate_uploaded"
                      control={<Radio color="error" />}
                      label={
                        <Box sx={{ my: 0.5 }}>
                          <Typography variant="body2" fontWeight={600} color="error.dark">
                            Opción A: Inactivar números del archivo
                          </Typography>
                          <Typography variant="caption" color="text.secondary" display="block">
                            Desactiva los teléfonos cargados. El resto de los clientes permanece sin cambios.
                          </Typography>
                        </Box>
                      }
                      sx={{ alignItems: 'flex-start', mb: 1.5 }}
                    />
                    <FormControlLabel
                      value="keep_uploaded_active"
                      control={<Radio color="primary" />}
                      label={
                        <Box sx={{ my: 0.5 }}>
                          <Typography variant="body2" fontWeight={600} color="primary.dark">
                            Opción B: Mantener activos los cargados e inactivar los demás
                          </Typography>
                          <Typography variant="caption" color="text.secondary" display="block">
                            Activa los teléfonos del archivo y <strong>INACTIVA TODOS LOS DEMÁS</strong> clientes en esta tienda.
                          </Typography>
                        </Box>
                      }
                      sx={{ alignItems: 'flex-start' }}
                    />
                  </RadioGroup>
                </FormControl>
              </Box>
            )}

            {error && (
              <Alert severity="error" sx={{ borderRadius: 2 }}>
                {error}
              </Alert>
            )}

            <Stack direction="row" spacing={1.5} justifyContent="flex-end">
              <Button
                variant="outlined"
                onClick={handleClose}
                disabled={loading}
                sx={{ borderRadius: 2, textTransform: 'none' }}
              >
                Cancelar
              </Button>
              <Button
                variant="contained"
                color={mode === 'keep_uploaded_active' ? 'primary' : 'error'}
                onClick={handlePreview}
                disabled={loading || !parsedData}
                startIcon={
                  loading ? <CircularProgress size={16} color="inherit" /> : <PreviewRounded />
                }
                sx={{
                  borderRadius: 2,
                  textTransform: 'none',
                  px: 3,
                }}
              >
                {loading ? 'Analizando...' : 'Obtener vista previa'}
              </Button>
            </Stack>
          </Stack>
        )}

        {/* ─── Step 2: Preview ─── */}
        {step === 'preview' && previewResult && (
          <Stack spacing={2.5}>
            <Alert severity="warning" sx={{ borderRadius: 2 }}>
              <strong>Confirmación del Lote (Dry Run).</strong> Revisa las estadísticas y confirma para aplicar los cambios a la base de datos.
            </Alert>

            {/* Stats */}
            <Stack direction="row" spacing={1.5} flexWrap="wrap" gap={1}>
              <Chip
                label={`${previewResult.inputCount} números cargados`}
                color="default"
                variant="outlined"
                size="small"
              />
              {mode === 'inactivate_uploaded' ? (
                <Chip
                  label={`${previewResult.matchedCount} encontrados que se inactivarán`}
                  color="error"
                  variant="outlined"
                  size="small"
                />
              ) : (
                <>
                  <Chip
                    label={`${previewResult.toActivateCount} se mantendrán activos`}
                    color="primary"
                    variant="outlined"
                    size="small"
                  />
                  <Chip
                    label={`${previewResult.toDeactivateCount} se inactivarán`}
                    color="error"
                    variant="filled"
                    size="small"
                  />
                </>
              )}
            </Stack>

            {/* Preview tables */}
            {mode === 'inactivate_uploaded' && previewResult.preview && previewResult.preview.length > 0 && (
              <Box sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 2, p: 1.5, maxHeight: 150, overflow: 'auto' }}>
                <Typography variant="caption" fontWeight={700} color="text.secondary" display="block" mb={1}>
                  Muestra de números a inactivar:
                </Typography>
                <Stack spacing={0.5}>
                  {previewResult.preview.map((p, i) => (
                    <Typography key={i} variant="body2" fontFamily="monospace">
                      • {p.phone}
                    </Typography>
                  ))}
                </Stack>
              </Box>
            )}

            {mode === 'keep_uploaded_active' && (
              <Stack spacing={1.5}>
                {previewResult.previewActivate && previewResult.previewActivate.length > 0 && (
                  <Box sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 2, p: 1.5, maxHeight: 100, overflow: 'auto' }}>
                    <Typography variant="caption" fontWeight={700} color="primary.dark" display="block" mb={0.5}>
                      Muestra de números que quedarán activos:
                    </Typography>
                    <Stack spacing={0.5}>
                      {previewResult.previewActivate.map((ph, i) => (
                        <Typography key={i} variant="body2" fontFamily="monospace">• {ph}</Typography>
                      ))}
                    </Stack>
                  </Box>
                )}
                {previewResult.previewDeactivate && previewResult.previewDeactivate.length > 0 && (
                  <Box sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 2, p: 1.5, maxHeight: 100, overflow: 'auto' }}>
                    <Typography variant="caption" fontWeight={700} color="error.dark" display="block" mb={0.5}>
                      Muestra de números que se inactivarán:
                    </Typography>
                    <Stack spacing={0.5}>
                      {previewResult.previewDeactivate.map((ph, i) => (
                        <Typography key={i} variant="body2" fontFamily="monospace" color="error.main">• {ph}</Typography>
                      ))}
                    </Stack>
                  </Box>
                )}
              </Stack>
            )}

            {error && (
              <Alert severity="error" sx={{ borderRadius: 2 }}>
                {error}
              </Alert>
            )}

            <Stack direction="row" spacing={1.5} justifyContent="flex-end">
              <Button
                variant="outlined"
                onClick={() => { setStep('upload'); setPreviewResult(null); }}
                disabled={loading}
                sx={{ borderRadius: 2, textTransform: 'none' }}
              >
                Volver
              </Button>
              <Button
                variant="contained"
                color={mode === 'keep_uploaded_active' ? 'primary' : 'error'}
                onClick={handleExecute}
                disabled={loading}
                startIcon={
                  loading ? <CircularProgress size={16} color="inherit" /> : <DeleteSweepRounded />
                }
                sx={{
                  borderRadius: 2,
                  textTransform: 'none',
                  px: 3,
                }}
              >
                {loading
                  ? 'Procesando...'
                  : mode === 'inactivate_uploaded'
                  ? `Inactivar ${previewResult.matchedCount} números`
                  : `Ejecutar reemplazo de estado`
                }
              </Button>
            </Stack>
          </Stack>
        )}

        {/* ─── Step 3: Done ─── */}
        {step === 'done' && execResult && (
          <Stack spacing={2.5}>
            <Alert
              severity="success"
              icon={<CheckCircleOutlineRounded />}
              sx={{ borderRadius: 2 }}
            >
              <strong>¡Lote procesado exitosamente!</strong>
            </Alert>

            <Stack direction="row" spacing={2} flexWrap="wrap">
              {mode === 'inactivate_uploaded' ? (
                <Chip
                  label={`${execResult.deactivatedCount || 0} desactivados`}
                  color="error"
                  variant="filled"
                  size="small"
                />
              ) : (
                <>
                  <Chip
                    label={`${execResult.activatedCount || 0} activados`}
                    color="primary"
                    variant="filled"
                    size="small"
                  />
                  <Chip
                    label={`${execResult.deactivatedCount || 0} desactivados`}
                    color="error"
                    variant="filled"
                    size="small"
                  />
                </>
              )}
            </Stack>

            <Stack direction="row" spacing={1.5} justifyContent="flex-end">
              <Button
                variant="contained"
                onClick={handleClose}
                sx={{ borderRadius: 2, textTransform: 'none', px: 3 }}
              >
                Cerrar
              </Button>
            </Stack>
          </Stack>
        )}
      </DialogContent>
    </Dialog>
  );
}
