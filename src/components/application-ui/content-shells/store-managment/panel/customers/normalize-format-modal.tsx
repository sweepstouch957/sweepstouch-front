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
  IconButton,
  Stack,
  Typography,
  useTheme,
  LinearProgress,
} from '@mui/material';
import {
  CloseRounded,
  AutoFixHighRounded,
  PreviewRounded,
  CheckCircleOutlineRounded,
} from '@mui/icons-material';
import { customerClient } from '@/services/customerService';

interface NormalizeFormatModalProps {
  open: boolean;
  onClose: () => void;
  storeId: string;
  storeName?: string;
  onSuccess?: () => void;
}

interface NormalizeResult {
  dryRun: boolean;
  totalCustomers: number;
  toNormalizeCount?: number;
  wouldMergeCount?: number;
  normalizedCount?: number;
  mergedCount?: number;
  preview?: Array<{
    original: string;
    normalized: string;
    action: string;
  }>;
}

export default function NormalizeFormatModal({
  open,
  onClose,
  storeId,
  storeName,
  onSuccess,
}: NormalizeFormatModalProps) {
  const theme = useTheme();

  // States
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [previewResult, setPreviewResult] = useState<NormalizeResult | null>(null);
  const [execResult, setExecResult] = useState<NormalizeResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'form' | 'preview' | 'done'>('form');

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
    setPreviewResult(null);
    setExecResult(null);
    setError(null);
    setProgress(0);
    setStep('form');
  };

  const handleClose = () => {
    if (loading) return;
    reset();
    onClose();
  };

  // Step 1: Dry run (preview)
  const handlePreview = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await customerClient.normalizePhoneFormat({
        storeId,
        dryRun: true,
      });
      setPreviewResult(data);
      setStep('preview');
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Error al obtener vista previa de normalización.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Execute (dryRun: false)
  const handleExecute = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await customerClient.normalizePhoneFormat({
        storeId,
        dryRun: false,
      });
      setExecResult(data);
      setStep('done');
      onSuccess?.();
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Error al ejecutar la normalización.');
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
          backgroundImage: `linear-gradient(135deg, ${alpha(theme.palette.warning.main, 0.04)} 0%, transparent 60%)`,
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
              background: `linear-gradient(135deg, ${theme.palette.warning.dark} 0%, ${theme.palette.warning.main} 100%)`,
            }}
          >
            <AutoFixHighRounded sx={{ color: 'white', fontSize: 20 }} />
          </Box>
          <Box flex={1}>
            <Typography variant="h6" fontWeight={700}>
              Arreglar Formato de Números
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {storeName || storeId}: Normalizar teléfonos de EE.UU. a 10 dígitos
            </Typography>
          </Box>
          <IconButton size="small" onClick={handleClose} disabled={loading}>
            <CloseRounded />
          </IconButton>
        </Stack>
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ pt: 2.5 }}>
        {loading && (
          <Box sx={{ width: '100%', mb: 2.5 }}>
            <LinearProgress variant="determinate" value={progress} color="warning" sx={{ height: 6, borderRadius: 3 }} />
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block', textAlign: 'right', fontWeight: 600 }}>
              Procesando... {progress}%
            </Typography>
          </Box>
        )}
        {/* ─── Step 1: Form ─── */}
        {step === 'form' && (
          <Stack spacing={2.5}>
            <Alert severity="info" sx={{ borderRadius: 2 }}>
              Esta herramienta normalizará todos los teléfonos del directorio para esta tienda. 
              Removerá los prefijos internacionales de EE.UU. como <strong>+1</strong> o <strong>1</strong> al inicio de los números para unificarlos a 10 dígitos (ej: <code>+15512858347</code> a <code>5512858347</code>).
              Si se detectan duplicados al normalizar, se fusionarán sus registros de tiendas para no perder información.
            </Alert>

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
                color="warning"
                onClick={handlePreview}
                disabled={loading}
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
              <strong>Vista previa.</strong> Se detectaron números con formato incorrecto. Revisa los detalles y confirma para aplicar los cambios.
            </Alert>

            {/* Stats */}
            <Stack direction="row" spacing={2} flexWrap="wrap" gap={1}>
              <Chip
                label={`${previewResult.totalCustomers} clientes totales`}
                color="default"
                variant="outlined"
                size="small"
              />
              <Chip
                label={`${previewResult.toNormalizeCount} números por normalizar`}
                color="warning"
                variant="outlined"
                size="small"
              />
              <Chip
                label={`${previewResult.wouldMergeCount} duplicados por fusionar`}
                color="error"
                variant="outlined"
                size="small"
              />
            </Stack>

            {/* Preview table */}
            {previewResult.preview && previewResult.preview.length > 0 && (
              <Box
                sx={{
                  maxHeight: 240,
                  overflow: 'auto',
                  borderRadius: 2,
                  border: `1px solid ${alpha(theme.palette.divider, 0.3)}`,
                }}
              >
                <Box component="table" sx={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
                  <Box component="thead">
                    <Box component="tr" sx={{ bgcolor: alpha(theme.palette.primary.main, 0.06) }}>
                      <Box component="th" sx={{ p: 1, textAlign: 'left', fontWeight: 600 }}>Original</Box>
                      <Box component="th" sx={{ p: 1, textAlign: 'left', fontWeight: 600 }}>Normalizado</Box>
                      <Box component="th" sx={{ p: 1, textAlign: 'left', fontWeight: 600 }}>Acción</Box>
                    </Box>
                  </Box>
                  <Box component="tbody">
                    {previewResult.preview.map((p, i) => (
                      <Box
                        component="tr"
                        key={i}
                        sx={{
                          '&:nth-of-type(even)': {
                            bgcolor: alpha(theme.palette.action.hover, 0.04),
                          },
                        }}
                      >
                        <Box component="td" sx={{ p: 1, fontFamily: 'monospace', color: 'text.secondary' }}>{p.original}</Box>
                        <Box component="td" sx={{ p: 1, fontFamily: 'monospace', fontWeight: 700, color: 'warning.dark' }}>{p.normalized}</Box>
                        <Box component="td" sx={{ p: 1 }}>
                          <Chip 
                            label={p.action} 
                            size="small" 
                            color={p.action.includes('Fusionar') ? 'error' : 'warning'} 
                            variant="outlined" 
                            sx={{ fontSize: 10, height: 18 }} 
                          />
                        </Box>
                      </Box>
                    ))}
                  </Box>
                </Box>
              </Box>
            )}

            {previewResult.toNormalizeCount === 0 && (
              <Alert severity="success" sx={{ borderRadius: 2 }}>
                ✅ Todos los números de esta tienda ya se encuentran normalizados. No se requieren cambios.
              </Alert>
            )}

            {error && (
              <Alert severity="error" sx={{ borderRadius: 2 }}>
                {error}
              </Alert>
            )}

            <Stack direction="row" spacing={1.5} justifyContent="flex-end">
              <Button
                variant="outlined"
                onClick={() => { setStep('form'); setPreviewResult(null); }}
                disabled={loading}
                sx={{ borderRadius: 2, textTransform: 'none' }}
              >
                Volver
              </Button>
              {(previewResult.toNormalizeCount || 0) > 0 && (
                <Button
                  variant="contained"
                  color="warning"
                  onClick={handleExecute}
                  disabled={loading}
                  startIcon={
                    loading ? <CircularProgress size={16} color="inherit" /> : <AutoFixHighRounded />
                  }
                  sx={{
                    borderRadius: 2,
                    textTransform: 'none',
                    px: 3,
                  }}
                >
                  {loading
                    ? 'Normalizando...'
                    : `Corregir ${previewResult.toNormalizeCount} números`
                  }
                </Button>
              )}
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
              <strong>¡Normalización completada con éxito!</strong>
            </Alert>

            <Stack direction="row" spacing={2} flexWrap="wrap">
              <Chip
                label={`${execResult.normalizedCount || 0} normalizados`}
                color="success"
                variant="filled"
                size="small"
              />
              <Chip
                label={`${execResult.mergedCount || 0} duplicados fusionados`}
                color="info"
                variant="filled"
                size="small"
              />
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
