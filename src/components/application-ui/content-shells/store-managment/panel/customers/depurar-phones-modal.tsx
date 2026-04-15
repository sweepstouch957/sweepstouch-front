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
  TextField,
  Typography,
  useTheme,
} from '@mui/material';
import {
  CloseRounded,
  CleaningServicesRounded,
  PreviewRounded,
  DeleteSweepRounded,
  CheckCircleOutlineRounded,
} from '@mui/icons-material';
import { api } from '@/libs/axios';

interface DepurarPhonesModalProps {
  open: boolean;
  onClose: () => void;
  storeId: string;
  storeName?: string;
  onSuccess?: () => void;
}

interface DepurarResult {
  dryRun: boolean;
  totalLogs: number;
  uniquePhones: number;
  samplePhones?: string[];
  preview?: Array<{
    phone: string;
    code: string;
    reason: string;
    class: string;
    comment: string;
  }>;
  updated?: number;
  failed?: number;
  errors?: Array<any>;
  usedCodes?: string[];
  filter?: any;
}

export default function DepurarPhonesModal({
  open,
  onClose,
  storeId,
  storeName,
  onSuccess,
}: DepurarPhonesModalProps) {
  const theme = useTheme();

  // Date range state
  const today = new Date().toISOString().slice(0, 10);
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
  const [from, setFrom] = useState(thirtyDaysAgo);
  const [to, setTo] = useState(today);

  // States
  const [loading, setLoading] = useState(false);
  const [previewResult, setPreviewResult] = useState<DepurarResult | null>(null);
  const [execResult, setExecResult] = useState<DepurarResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'form' | 'preview' | 'done'>('form');

  const reset = () => {
    setPreviewResult(null);
    setExecResult(null);
    setError(null);
    setStep('form');
    setFrom(thirtyDaysAgo);
    setTo(today);
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
      const res = await api.post('/tracking/phones/depurar', {
        storeId,
        from,
        to,
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
      const res = await api.post('/tracking/phones/depurar', {
        storeId,
        from,
        to,
        dryRun: false,
      });
      setExecResult(res.data);
      setStep('done');
      onSuccess?.();
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Error al ejecutar la depuración.');
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
          backgroundImage: `linear-gradient(135deg, ${alpha(theme.palette.error.main, 0.04)} 0%, transparent 60%)`,
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
            <CleaningServicesRounded sx={{ color: 'white', fontSize: 20 }} />
          </Box>
          <Box flex={1}>
            <Typography variant="h6" fontWeight={700}>
              Depurar Números
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {storeName || storeId} — Identificar y desactivar números inválidos
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
              Selecciona un rango de fechas para buscar logs de error en las campañas de esta tienda.
              Se hará primero una <strong>vista previa</strong> (dry run) antes de ejecutar.
            </Alert>

            <Stack direction="row" spacing={2}>
              <TextField
                label="Desde"
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                fullWidth
                size="small"
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                label="Hasta"
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                fullWidth
                size="small"
                InputLabelProps={{ shrink: true }}
              />
            </Stack>

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
                onClick={handlePreview}
                disabled={loading || !from || !to}
                startIcon={
                  loading ? <CircularProgress size={16} color="inherit" /> : <PreviewRounded />
                }
                sx={{
                  borderRadius: 2,
                  textTransform: 'none',
                  px: 3,
                }}
              >
                {loading ? 'Buscando...' : 'Vista previa'}
              </Button>
            </Stack>
          </Stack>
        )}

        {/* ─── Step 2: Preview ─── */}
        {step === 'preview' && previewResult && (
          <Stack spacing={2.5}>
            <Alert severity="warning" sx={{ borderRadius: 2 }}>
              <strong>Vista previa (Dry Run).</strong> Aún no se ha modificado nada. Revisa los datos y confirma para ejecutar.
            </Alert>

            {/* Stats */}
            <Stack direction="row" spacing={2} flexWrap="wrap">
              <Chip
                label={`${previewResult.totalLogs} logs encontrados`}
                color="default"
                variant="outlined"
                size="small"
              />
              <Chip
                label={`${previewResult.uniquePhones} teléfonos únicos`}
                color="primary"
                variant="outlined"
                size="small"
              />
              <Chip
                label={`${previewResult.usedCodes?.length || 0} códigos de error`}
                color="warning"
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
                      <Box component="th" sx={{ p: 1, textAlign: 'left', fontWeight: 600 }}>Código</Box>
                      <Box component="th" sx={{ p: 1, textAlign: 'left', fontWeight: 600 }}>Razón</Box>
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
                        <Box component="td" sx={{ p: 1 }}>
                          <Chip label={p.code} size="small" color="error" variant="outlined" sx={{ fontSize: 11 }} />
                        </Box>
                        <Box component="td" sx={{ p: 1 }}>{p.reason}</Box>
                      </Box>
                    ))}
                  </Box>
                </Box>
              </Box>
            )}

            {previewResult.uniquePhones === 0 && (
              <Alert severity="success" sx={{ borderRadius: 2 }}>
                ✅ No se encontraron números inválidos en el rango seleccionado.
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
              {previewResult.uniquePhones > 0 && (
                <Button
                  variant="contained"
                  color="error"
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
                    ? 'Depurando...'
                    : `Depurar ${previewResult.uniquePhones} número${previewResult.uniquePhones !== 1 ? 's' : ''}`
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
              <strong>¡Depuración completada!</strong>
            </Alert>

            <Stack direction="row" spacing={2} flexWrap="wrap">
              <Chip
                label={`${execResult.uniquePhones} analizados`}
                color="default"
                variant="outlined"
                size="small"
              />
              <Chip
                label={`${execResult.updated || 0} desactivados`}
                color="success"
                variant="filled"
                size="small"
              />
              {(execResult.failed || 0) > 0 && (
                <Chip
                  label={`${execResult.failed} fallidos`}
                  color="error"
                  variant="filled"
                  size="small"
                />
              )}
            </Stack>

            {execResult.errors && execResult.errors.length > 0 && (
              <Alert severity="warning" sx={{ borderRadius: 2 }}>
                {execResult.errors.length} error(es) durante la depuración. Revisa los logs del servidor para más detalles.
              </Alert>
            )}

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
