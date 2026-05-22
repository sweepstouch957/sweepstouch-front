'use client';

import {
  earningsTiersService,
  type EarningsTier,
  type EarningsTierConfig,
} from '@/services/earningsTiers.service';
import AttachMoneyRoundedIcon from '@mui/icons-material/AttachMoneyRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import SaveRoundedIcon from '@mui/icons-material/SaveRounded';
import HistoryRoundedIcon from '@mui/icons-material/HistoryRounded';
import SecurityRoundedIcon from '@mui/icons-material/SecurityRounded';
import TrendingUpRoundedIcon from '@mui/icons-material/TrendingUpRounded';
import {
  Alert,
  alpha,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Divider,
  FormControlLabel,
  IconButton,
  InputAdornment,
  Skeleton,
  Snackbar,
  Stack,
  Switch,
  TextField,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useState } from 'react';
import PageHeading from 'src/components/base/page-heading';
import { useCustomization } from 'src/hooks/use-customization';

function EarningsTiersPage() {
  const customization = useCustomization();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const primary = theme.palette.primary.main;
  const queryClient = useQueryClient();

  // ── State ─────────────────────────────────────────────────────────
  const [tiers, setTiers] = useState<EarningsTier[]>([]);
  const [flatRateNew, setFlatRateNew] = useState(0.25);
  const [flatRateExisting, setFlatRateExisting] = useState(0);
  const [requireSmsValidation, setRequireSmsValidation] = useState(true);
  const [name, setName] = useState('');
  const [snack, setSnack] = useState<{ open: boolean; msg: string; severity: 'success' | 'error' }>({
    open: false,
    msg: '',
    severity: 'success',
  });
  const [dirty, setDirty] = useState(false);

  // ── Fetch current config ──────────────────────────────────────────
  const { data: config, isLoading } = useQuery<EarningsTierConfig>({
    queryKey: ['earnings-tiers-config'],
    queryFn: () => earningsTiersService.getConfig(),
    staleTime: 30_000,
  });

  // Sync state when config loads
  useEffect(() => {
    if (config) {
      setTiers(config.tiers ?? []);
      setFlatRateNew(config.flatRateNew ?? 0.25);
      setFlatRateExisting(config.flatRateExisting ?? 0);
      setRequireSmsValidation(config.requireSmsValidation ?? true);
      setName(config.name ?? '');
      setDirty(false);
    }
  }, [config]);

  // ── Save mutation ─────────────────────────────────────────────────
  const saveMutation = useMutation({
    mutationFn: () =>
      earningsTiersService.updateConfig({
        name,
        tiers,
        flatRateNew,
        flatRateExisting,
        requireSmsValidation,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['earnings-tiers-config'] });
      setSnack({ open: true, msg: 'Configuración guardada ✅', severity: 'success' });
      setDirty(false);
    },
    onError: () => {
      setSnack({ open: true, msg: 'Error al guardar', severity: 'error' });
    },
  });

  // ── Tier handlers ─────────────────────────────────────────────────
  const updateTier = useCallback(
    (idx: number, field: keyof EarningsTier, value: string | number) => {
      setTiers((prev) => {
        const next = [...prev];
        next[idx] = { ...next[idx], [field]: value };
        return next;
      });
      setDirty(true);
    },
    []
  );

  const addTier = useCallback(() => {
    const lastMax = tiers.length > 0 ? tiers[tiers.length - 1].maxCount : 0;
    setTiers((prev) => [
      ...prev,
      { maxCount: lastMax + 100, ratePerNew: 0.5, label: `Tramo ${prev.length + 1}` },
    ]);
    setDirty(true);
  }, [tiers]);

  const removeTier = useCallback((idx: number) => {
    setTiers((prev) => prev.filter((_, i) => i !== idx));
    setDirty(true);
  }, []);

  // ── Calculate preview ─────────────────────────────────────────────
  const calculatePreview = useCallback(
    (count: number) => {
      let total = 0;
      let remaining = count;
      let prevMax = 0;
      for (const tier of tiers) {
        const inTier = Math.min(remaining, tier.maxCount - prevMax);
        if (inTier <= 0) break;
        total += inTier * tier.ratePerNew;
        remaining -= inTier;
        prevMax = tier.maxCount;
      }
      if (remaining > 0 && tiers.length > 0) {
        total += remaining * tiers[tiers.length - 1].ratePerNew;
      }
      return total;
    },
    [tiers]
  );

  if (isLoading) {
    return (
      <Container sx={{ py: 4 }} maxWidth={customization.stretch ? false : 'xl'}>
        <Skeleton variant="rounded" height={60} sx={{ mb: 3 }} />
        <Skeleton variant="rounded" height={400} />
      </Container>
    );
  }

  return (
    <>
      <Container sx={{ py: { xs: 2, sm: 3 } }} maxWidth={customization.stretch ? false : 'xl'}>
        <PageHeading
          sx={{ px: 0 }}
          title="Plan de Ganancias"
          description="Configura los tramos de earnings para promotoras en su primer turno"
          actions={
            <Stack direction="row" spacing={1.5}>
              <Button
                variant="contained"
                startIcon={<SaveRoundedIcon />}
                disabled={!dirty || saveMutation.isPending}
                onClick={() => saveMutation.mutate()}
                disableElevation
                sx={{ borderRadius: 999, fontWeight: 700, textTransform: 'none' }}
              >
                {saveMutation.isPending ? 'Guardando…' : 'Guardar Cambios'}
              </Button>
            </Stack>
          }
        />
      </Container>

      <Container maxWidth={customization.stretch ? false : 'xl'} sx={{ pb: { xs: 3, sm: 4 } }}>
        <Stack spacing={3}>
          {/* ── Status bar ──────────────────────────────────────────── */}
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            spacing={2}
          >
            {/* Preview cards */}
            {[
              { label: '200 contactos', icon: <TrendingUpRoundedIcon />, value: `$${calculatePreview(200).toFixed(2)}` },
              { label: '500 contactos', icon: <TrendingUpRoundedIcon />, value: `$${calculatePreview(500).toFixed(2)}` },
              { label: '1,000 contactos', icon: <TrendingUpRoundedIcon />, value: `$${calculatePreview(1000).toFixed(2)}` },
            ].map((item, i) => (
              <Card
                key={i}
                sx={{
                  flex: 1,
                  borderRadius: 3,
                  border: `1px solid ${alpha(primary, isDark ? 0.15 : 0.1)}`,
                  bgcolor: alpha(primary, isDark ? 0.04 : 0.02),
                }}
              >
                <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
                  <Stack direction="row" alignItems="center" spacing={1.5}>
                    <Box
                      sx={{
                        width: 42,
                        height: 42,
                        borderRadius: 2.5,
                        display: 'grid',
                        placeItems: 'center',
                        bgcolor: alpha(primary, 0.1),
                        color: primary,
                      }}
                    >
                      {item.icon}
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary" fontWeight={600}>
                        {item.label}
                      </Typography>
                      <Typography variant="h5" fontWeight={800}>
                        {item.value}
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            ))}
          </Stack>

          {/* ── Tiers card ─────────────────────────────────────────── */}
          <Card
            sx={{
              borderRadius: 3,
              border: `1px solid ${theme.palette.divider}`,
              overflow: 'visible',
            }}
          >
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2.5 }}>
                <Stack direction="row" alignItems="center" spacing={1.5}>
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: 2,
                      display: 'grid',
                      placeItems: 'center',
                      background: `linear-gradient(135deg, ${primary}, ${alpha(primary, 0.6)})`,
                      color: '#fff',
                    }}
                  >
                    <AttachMoneyRoundedIcon sx={{ fontSize: 22 }} />
                  </Box>
                  <Box>
                    <Typography fontWeight={700} fontSize={15}>
                      Tramos de Ganancias
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Solo aplica al primer turno por tienda · Solo números nuevos
                    </Typography>
                  </Box>
                </Stack>
                <Chip
                  icon={<CheckCircleRoundedIcon sx={{ fontSize: 14 }} />}
                  label="Primer turno"
                  size="small"
                  color="success"
                  variant="outlined"
                  sx={{ fontWeight: 700, fontSize: 11 }}
                />
              </Stack>

              <Divider sx={{ mb: 2.5 }} />

              {/* Tiers list */}
              <Stack spacing={2}>
                {tiers.map((tier, idx) => (
                  <Stack
                    key={idx}
                    direction={{ xs: 'column', sm: 'row' }}
                    spacing={1.5}
                    alignItems={{ xs: 'stretch', sm: 'center' }}
                    sx={{
                      p: 2,
                      borderRadius: 2.5,
                      border: `1px solid ${alpha(primary, isDark ? 0.12 : 0.08)}`,
                      bgcolor: alpha(primary, isDark ? 0.03 : 0.015),
                      transition: 'all 0.2s',
                      '&:hover': {
                        borderColor: alpha(primary, 0.3),
                        bgcolor: alpha(primary, isDark ? 0.06 : 0.03),
                      },
                    }}
                  >
                    <Chip
                      label={`#${idx + 1}`}
                      size="small"
                      sx={{
                        fontWeight: 800,
                        fontSize: 11,
                        bgcolor: alpha(primary, 0.12),
                        color: primary,
                        width: 40,
                      }}
                    />
                    <TextField
                      label="Etiqueta"
                      size="small"
                      value={tier.label}
                      onChange={(e) => updateTier(idx, 'label', e.target.value)}
                      sx={{ flex: 1, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                    />
                    <TextField
                      label="Hasta (contactos)"
                      size="small"
                      type="number"
                      value={tier.maxCount}
                      onChange={(e) => updateTier(idx, 'maxCount', Number(e.target.value))}
                      sx={{ width: { xs: '100%', sm: 150 }, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                    />
                    <TextField
                      label="$/nuevo"
                      size="small"
                      type="number"
                      value={tier.ratePerNew}
                      onChange={(e) => updateTier(idx, 'ratePerNew', Number(e.target.value))}
                      InputProps={{
                        startAdornment: <InputAdornment position="start">$</InputAdornment>,
                      }}
                      inputProps={{ step: 0.05, min: 0 }}
                      sx={{ width: { xs: '100%', sm: 130 }, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                    />
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      fontWeight={600}
                      sx={{ minWidth: 90, textAlign: 'center' }}
                    >
                      = ${(Math.min(tier.maxCount, tier.maxCount) * tier.ratePerNew).toFixed(0)} max
                    </Typography>
                    <Tooltip title="Eliminar tramo">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => removeTier(idx)}
                        sx={{ opacity: 0.6, '&:hover': { opacity: 1 } }}
                      >
                        <DeleteRoundedIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                ))}
              </Stack>

              <Button
                startIcon={<AddRoundedIcon />}
                onClick={addTier}
                size="small"
                sx={{
                  mt: 2,
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 700,
                  color: primary,
                }}
              >
                Agregar Tramo
              </Button>
            </CardContent>
          </Card>

          {/* ── Flat rate + Anti-fraud card ────────────────────────── */}
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
            {/* Flat rate */}
            <Card
              sx={{
                flex: 1,
                borderRadius: 3,
                border: `1px solid ${theme.palette.divider}`,
              }}
            >
              <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 2.5 }}>
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: 2,
                      display: 'grid',
                      placeItems: 'center',
                      bgcolor: alpha(theme.palette.warning.main, 0.1),
                      color: theme.palette.warning.main,
                    }}
                  >
                    <AttachMoneyRoundedIcon sx={{ fontSize: 22 }} />
                  </Box>
                  <Box>
                    <Typography fontWeight={700} fontSize={15}>
                      Tarifa Plana
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Para promotoras con turnos previos en esa tienda
                    </Typography>
                  </Box>
                </Stack>

                <Divider sx={{ mb: 2.5 }} />

                <Stack spacing={2}>
                  <TextField
                    label="Por nuevo contacto"
                    type="number"
                    size="small"
                    value={flatRateNew}
                    onChange={(e) => {
                      setFlatRateNew(Number(e.target.value));
                      setDirty(true);
                    }}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">$</InputAdornment>,
                    }}
                    inputProps={{ step: 0.05, min: 0 }}
                    fullWidth
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                  />
                  <TextField
                    label="Por contacto existente"
                    type="number"
                    size="small"
                    value={flatRateExisting}
                    onChange={(e) => {
                      setFlatRateExisting(Number(e.target.value));
                      setDirty(true);
                    }}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">$</InputAdornment>,
                    }}
                    inputProps={{ step: 0.05, min: 0 }}
                    fullWidth
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                  />
                </Stack>
              </CardContent>
            </Card>

            {/* Anti-fraud */}
            <Card
              sx={{
                flex: 1,
                borderRadius: 3,
                border: `1px solid ${theme.palette.divider}`,
              }}
            >
              <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 2.5 }}>
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: 2,
                      display: 'grid',
                      placeItems: 'center',
                      bgcolor: alpha(theme.palette.error.main, 0.1),
                      color: theme.palette.error.main,
                    }}
                  >
                    <SecurityRoundedIcon sx={{ fontSize: 22 }} />
                  </Box>
                  <Box>
                    <Typography fontWeight={700} fontSize={15}>
                      Anti-Fraude
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Validación SMS antes de acreditar earnings
                    </Typography>
                  </Box>
                </Stack>

                <Divider sx={{ mb: 2.5 }} />

                <FormControlLabel
                  control={
                    <Switch
                      checked={requireSmsValidation}
                      onChange={(e) => {
                        setRequireSmsValidation(e.target.checked);
                        setDirty(true);
                      }}
                      color="error"
                    />
                  }
                  label={
                    <Box>
                      <Typography fontWeight={600} fontSize={13}>
                        Bloquear earnings hasta validación SMS
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Si está activo, los earnings se mantienen en $0 hasta que Infobip confirme la entrega del mensaje.
                        Si el SMS falla, el contacto no genera earnings.
                      </Typography>
                    </Box>
                  }
                  sx={{ alignItems: 'flex-start', mx: 0, gap: 1.5 }}
                />

                {requireSmsValidation && (
                  <Alert
                    severity="info"
                    variant="outlined"
                    sx={{ mt: 2, borderRadius: 2, fontSize: 12 }}
                  >
                    Los earnings se acreditarán automáticamente cuando Infobip confirme el delivery del SMS.
                    Números que no reciban el SMS quedarán con $0.
                  </Alert>
                )}
              </CardContent>
            </Card>
          </Stack>

          {/* ── Last updated info ──────────────────────────────────── */}
          {config && (
            <Stack
              direction="row"
              alignItems="center"
              spacing={1}
              sx={{
                py: 1.5,
                px: 2,
                borderRadius: 2,
                bgcolor: alpha(primary, isDark ? 0.03 : 0.02),
                border: `1px solid ${alpha(primary, isDark ? 0.1 : 0.06)}`,
              }}
            >
              <HistoryRoundedIcon sx={{ fontSize: 16, color: 'text.disabled' }} />
              <Typography variant="caption" color="text.secondary">
                Última actualización:{' '}
                {new Date(config.updatedAt).toLocaleString('es', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Typography>
            </Stack>
          )}
        </Stack>
      </Container>

      {/* Snackbar */}
      <Snackbar
        open={snack.open}
        autoHideDuration={3000}
        onClose={() => setSnack((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity={snack.severity}
          variant="filled"
          onClose={() => setSnack((s) => ({ ...s, open: false }))}
          sx={{ borderRadius: 2 }}
        >
          {snack.msg}
        </Alert>
      </Snackbar>
    </>
  );
}

export default EarningsTiersPage;
