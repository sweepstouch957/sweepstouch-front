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
} from '@mui/material';
import {
  CloseRounded,
  SettingsBackupRestoreRounded,
  PreviewRounded,
  CheckCircleOutlineRounded,
} from '@mui/icons-material';
import { api } from '@/libs/axios';

interface ReactivarPhonesModalProps {
  open: boolean;
  onClose: () => void;
  storeId: string;
  storeName?: string;
  onSuccess?: () => void;
}

interface ReactivarResult {
  dryRun: boolean;
  totalInactives: number;
  recoverableCount?: number;
  recoveredCount?: number;
  sampleRecovered?: string[];
  preview?: Array<{
    phone: string;
    reason: string;
    comment: string;
  }>;
}

export default function ReactivarPhonesModal({
  open,
  onClose,
  storeId,
  storeName,
  onSuccess,
}: ReactivarPhonesModalProps) {
  const theme = useTheme();

  // States
  const [loading, setLoading] = useState(false);
  const [previewResult, setPreviewResult] = useState<ReactivarResult | null>(null);
  const [execResult, setExecResult] = useState<ReactivarResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'form' | 'preview' | 'done'>('form');

  const reset = () => {
    setPreviewResult(null);
    setExecResult(null);
    setError(null);
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
      const res = await api.post('/tracking/phones/reactivar', {
        storeId,
        dryRun: true,
      });
      setPreviewResult(res.data);
      setStep('preview');
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Error al obtener vista previa.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Execute (dryRun: false)
  const handleExecute = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.post('/tracking/phones/reactivar', {
        storeId,
        dryRun: false,
      });
      setExecResult(res.data);
      setStep('done');
      onSuccess?.();
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Error al ejecutar reactivación.');
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
          backgroundImage: `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.04)} 0%, transparent 60%)`,
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
              background: `linear-gradient(135deg, ${theme.palette.success.dark} 0%, ${theme.palette.success.main} 100%)`,
              boxShadow: `0 4px 12px ${alpha(theme.palette.success.main, 0.4)}`,
            }}
          >
            <SettingsBackupRestoreRounded sx={{ color: 'white', fontSize: 20 }} />
          </Box>
          <Box flex={1}>
            <Typography variant="h6" fontWeight={700}>
              Reactivar Números
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {storeName || storeId} — Recuperar números inactivos válidos
            </Typography>
          </Box>
          <IconButton size="small" onClick={handleClose} disabled={loading}>
            <CloseRounded />
          </IconButton>
        </Stack>
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ pt: 2.5 }}>
        {/* ─── Step 1: Form ─── */}
        {step === 'form' && (
          <Stack spacing={2.5}>
            <Alert severity="info" sx={{ borderRadius: 2 }}>
              Al reactivar, buscaremos teléfonos que están desactivados por errores recuperables (como apagados sin cobertura) o que habían sido Opt-out previamente.
              Se ignorarán los números de teléfonos identificados falsos o imposibles de rutear. Se hará primero una <strong>vista previa</strong>.
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
                color="success"
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
                {loading ? 'Buscando...' : 'Obtener vista previa'}
              </Button>
            </Stack>
          </Stack>
        )}

        {/* ─── Step 2: Preview ─── */}
        {step === 'preview' && previewResult && (
          <Stack spacing={2.5}>
            <Alert severity="warning" sx={{ borderRadius: 2 }}>
              <strong>Vista previa.</strong> Aún no se ha reactivado nada. Revisa los datos y confirma para ejecutar.
            </Alert>

            {/* Stats */}
            <Stack direction="row" spacing={2} flexWrap="wrap">
              <Chip
                label={`${previewResult.totalInactives} inactivos en la tienda`}
                color="default"
                variant="outlined"
                size="small"
              />
              <Chip
                label={`${previewResult.recoverableCount} números recuperables`}
                color="success"
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
                      <Box component="th" sx={{ p: 1, textAlign: 'left', fontWeight: 600 }}>Teléfono</Box>
                      <Box component="th" sx={{ p: 1, textAlign: 'left', fontWeight: 600 }}>Razón recuperable</Box>
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
                        <Box component="td" sx={{ p: 1, fontFamily: 'monospace' }}>{p.phone}</Box>
                        <Box component="td" sx={{ p: 1, color: 'text.secondary', fontSize: 11 }}>{p.reason}</Box>
                      </Box>
                    ))}
                  </Box>
                </Box>
              </Box>
            )}

            {previewResult.recoverableCount === 0 && (
              <Alert severity="success" sx={{ borderRadius: 2 }}>
                ✅ Requerimiento no necesario. No se encontraron números recuperables entre los inactivos.
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
              {(previewResult.recoverableCount || 0) > 0 && (
                <Button
                  variant="contained"
                  color="success"
                  onClick={handleExecute}
                  disabled={loading}
                  startIcon={
                    loading ? <CircularProgress size={16} color="inherit" /> : <SettingsBackupRestoreRounded />
                  }
                  sx={{
                    borderRadius: 2,
                    textTransform: 'none',
                    px: 3,
                  }}
                >
                  {loading
                    ? 'Reactivando...'
                    : `Reactivar ${previewResult.recoverableCount} número${previewResult.recoverableCount !== 1 ? 's' : ''}`
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
              <strong>¡Reactivación completada!</strong>
            </Alert>

            <Stack direction="row" spacing={2} flexWrap="wrap">
              <Chip
                label={`${execResult.totalInactives} analizados`}
                color="default"
                variant="outlined"
                size="small"
              />
              <Chip
                label={`${execResult.recoveredCount || 0} reactivados`}
                color="success"
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
