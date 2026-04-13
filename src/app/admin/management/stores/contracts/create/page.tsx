'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createContractApi, type CreateContractBody } from '@/services/store.service';
import { routes } from '@/router/routes';
import { useAuth } from '@/hooks/use-auth';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import PrintRoundedIcon from '@mui/icons-material/PrintRounded';
import {
  Alert,
  alpha,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  FormControlLabel,
  InputAdornment,
  Snackbar,
  Stack,
  Switch,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  useTheme,
} from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';

/* ── US Phone mask ── */
const fmtPhone = (raw: string) => {
  const d = raw.replace(/\D/g, '').slice(0, 10);
  if (!d) return '';
  if (d.length <= 3) return `(${d}`;
  if (d.length <= 6) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
};
const stripPhone = (v: string) => v.replace(/\D/g, '');
const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

/* ── Quick pick chips ── */
const Picks = ({ opts, value, onChange, prefix = '' }: { opts: number[]; value: string; onChange: (v: string) => void; prefix?: string }) => (
  <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap sx={{ mt: 0.75 }}>
    {opts.map((n) => (
      <Chip
        key={n}
        label={`${prefix}${n}`}
        size="small"
        variant={value === String(n) ? 'filled' : 'outlined'}
        color={value === String(n) ? 'primary' : 'default'}
        onClick={() => onChange(String(n))}
        sx={{ fontWeight: 600, fontSize: 12, cursor: 'pointer' }}
      />
    ))}
  </Stack>
);

/* ── Label ── */
const Label = ({ children }: { children: React.ReactNode }) => (
  <Typography variant="body2" fontWeight={700} mb={0.5}>
    {children}
  </Typography>
);

/* ══════════ PAGE ══════════ */
export default function CreateContractPage() {
  const theme = useTheme();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const [f, setF] = useState({
    storeName: '', address: '', phone: '', email: '',
    cashRegisters: '',
    tabletType: 'none' as 'large' | 'small' | 'none',
    tabletCount: '',
    hasPrinters: false, printerCount: '',
    installationCost: '1000',
    notes: '',
  });
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [snack, setSnack] = useState({ open: false, msg: '', ok: true });

  const s = (k: string, v: any) => setF((p) => ({ ...p, [k]: v }));
  const t = (k: string) => setTouched((p) => ({ ...p, [k]: true }));

  // Validation
  const e: Record<string, string> = {};
  if (!f.storeName.trim()) e.storeName = 'Required';
  if (!f.address.trim()) e.address = 'Required';
  if (!f.phone) e.phone = 'Required';
  else if (stripPhone(f.phone).length !== 10) e.phone = '10 digits required';
  if (!f.email.trim()) e.email = 'Required';
  else if (!isEmail(f.email)) e.email = 'Invalid email';
  if (!f.cashRegisters) e.cashRegisters = 'Required';
  if (f.tabletType !== 'none' && !f.tabletCount) e.tabletCount = 'Required';
  if (f.hasPrinters && !f.printerCount) e.printerCount = 'Required';

  const err = (k: string) => (touched[k] ? e[k] || '' : '');
  const hasErr = Object.keys(e).length > 0;

  const tabletCost = f.tabletType === 'large' ? 500 : 0;
  const total = (Number(f.installationCost) || 0) + tabletCost * (Number(f.tabletCount) || 0);

  const mut = useMutation({
    mutationFn: (body: CreateContractBody) => createContractApi(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      setSnack({ open: true, msg: '✅ Contract created!', ok: true });
      setTimeout(() => router.push(routes.admin.management.stores.contracts), 1000);
    },
    onError: (err: any) => {
      setSnack({ open: true, msg: err?.response?.data?.error || err.message, ok: false });
    },
  });

  const submit = () => {
    setTouched(Object.keys(f).reduce((a, k) => ({ ...a, [k]: true }), {}));
    if (hasErr) return;
    mut.mutate({
      storeName: f.storeName.trim(),
      address: f.address.trim(),
      phone: `+1${stripPhone(f.phone)}`,
      email: f.email.trim().toLowerCase(),
      cashRegisters: Number(f.cashRegisters),
      tabletType: f.tabletType,
      tabletCount: f.tabletType !== 'none' ? Number(f.tabletCount) : 0,
      tabletCostEach: tabletCost,
      hasPrinters: f.hasPrinters,
      printerCount: f.hasPrinters ? Number(f.printerCount) : 0,
      installationCost: Number(f.installationCost) || 0,
      notes: f.notes.trim(),
      createdBy: { name: user?.name || '', email: user?.email || '' },
      source: 'admin_panel' as const,
    });
  };

  const accent = theme.palette.primary.main;
  const isDark = theme.palette.mode === 'dark';
  const border = isDark ? alpha('#fff', 0.08) : alpha('#000', 0.08);

  return (
    <Container maxWidth="sm" sx={{ py: { xs: 2, sm: 3 }, px: { xs: 2, sm: 3 } }}>
      {/* Header */}
      <Stack direction="row" alignItems="center" spacing={1} mb={3}>
        <Button
          size="small"
          color="inherit"
          startIcon={<ArrowBackRoundedIcon />}
          onClick={() => router.push(routes.admin.management.stores.contracts)}
          sx={{ borderRadius: 2, textTransform: 'none', minWidth: 'auto' }}
        >
          Back
        </Button>
        <Typography variant="h6" fontWeight={800} flex={1}>
          New Contract
        </Typography>
      </Stack>

      <Stack spacing={3}>
        {/* ── Store Info ── */}
        <Box>
          <Typography variant="overline" color="text.disabled" fontWeight={700} letterSpacing={1.5} mb={1.5} display="block">
            Store Info
          </Typography>
          <Stack spacing={2}>
            <Box>
              <Label>Store Name *</Label>
              <TextField
                fullWidth size="small"
                placeholder="Super Supermarket"
                value={f.storeName}
                onChange={(ev) => s('storeName', ev.target.value)}
                onBlur={() => t('storeName')}
                error={!!err('storeName')} helperText={err('storeName')}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            </Box>
            <Box>
              <Label>Address *</Label>
              <TextField
                fullWidth size="small"
                placeholder="123 Main St, Paterson, NJ 07505"
                value={f.address}
                onChange={(ev) => s('address', ev.target.value)}
                onBlur={() => t('address')}
                error={!!err('address')} helperText={err('address')}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            </Box>
            <Box>
              <Label>Phone *</Label>
              <TextField
                fullWidth size="small"
                placeholder="(555) 123-4567"
                value={f.phone}
                onChange={(ev) => s('phone', fmtPhone(ev.target.value))}
                onBlur={() => t('phone')}
                error={!!err('phone')} helperText={err('phone')}
                inputProps={{ maxLength: 14, inputMode: 'tel' }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Typography variant="body2" fontWeight={700} color="text.secondary">+1</Typography>
                    </InputAdornment>
                  ),
                }}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            </Box>
            <Box>
              <Label>Email *</Label>
              <TextField
                fullWidth size="small" type="email"
                placeholder="contact@store.com"
                value={f.email}
                onChange={(ev) => s('email', ev.target.value)}
                onBlur={() => t('email')}
                error={!!err('email')} helperText={err('email')}
                inputProps={{ inputMode: 'email' }}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            </Box>
          </Stack>
        </Box>

        {/* ── Equipment ── */}
        <Box>
          <Typography variant="overline" color="text.disabled" fontWeight={700} letterSpacing={1.5} mb={1.5} display="block">
            Equipment
          </Typography>
          <Stack spacing={2.5}>
            {/* Cash registers */}
            <Box>
              <Label>Cash Registers *</Label>
              <TextField
                size="small" type="number"
                inputProps={{ min: 0, inputMode: 'numeric' }}
                value={f.cashRegisters}
                onChange={(ev) => s('cashRegisters', ev.target.value)}
                onBlur={() => t('cashRegisters')}
                error={!!err('cashRegisters')} helperText={err('cashRegisters')}
                sx={{ width: 100, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
              <Picks opts={[1, 2, 3, 4, 5, 6, 8, 10]} value={f.cashRegisters} onChange={(v) => s('cashRegisters', v)} />
            </Box>

            {/* Tablets */}
            <Box>
              <Label>Tablet Type</Label>
              <ToggleButtonGroup
                value={f.tabletType}
                exclusive
                onChange={(_, v) => { if (!v) return; s('tabletType', v); if (v === 'none') s('tabletCount', ''); }}
                size="small"
                fullWidth
                sx={{
                  '& .MuiToggleButton-root': {
                    borderRadius: '10px !important',
                    textTransform: 'none',
                    fontWeight: 600,
                    py: 1.25,
                    fontSize: 13,
                    flex: 1,
                    '&.Mui-selected': {
                      bgcolor: alpha(accent, isDark ? 0.15 : 0.08),
                      borderColor: `${alpha(accent, 0.4)} !important`,
                      color: accent,
                    },
                  },
                }}
              >
                <ToggleButton value="none">None</ToggleButton>
                <ToggleButton value="large">Large · $500</ToggleButton>
                <ToggleButton value="small">Small · Free</ToggleButton>
              </ToggleButtonGroup>

              {f.tabletType !== 'none' && (
                <Box sx={{ mt: 1.5 }}>
                  <Label>How many tablets? *</Label>
                  <TextField
                    size="small" type="number"
                    inputProps={{ min: 1, inputMode: 'numeric' }}
                    value={f.tabletCount}
                    onChange={(ev) => s('tabletCount', ev.target.value)}
                    onBlur={() => t('tabletCount')}
                    error={!!err('tabletCount')} helperText={err('tabletCount')}
                    sx={{ width: 100, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                  />
                  <Picks opts={[1, 2, 3, 4, 5, 6]} value={f.tabletCount} onChange={(v) => s('tabletCount', v)} />
                </Box>
              )}
            </Box>

            {/* Printers */}
            <Box
              sx={{
                p: 2,
                borderRadius: 2.5,
                border: `1px solid ${border}`,
                bgcolor: isDark ? alpha('#fff', 0.02) : alpha('#000', 0.015),
              }}
            >
              <Stack direction="row" alignItems="center" spacing={1.5}>
                <PrintRoundedIcon sx={{ fontSize: 20, color: f.hasPrinters ? 'success.main' : 'text.disabled' }} />
                <Typography variant="body2" fontWeight={700} flex={1}>
                  Printers
                </Typography>
                <FormControlLabel
                  control={
                    <Switch
                      checked={f.hasPrinters}
                      onChange={(ev) => { s('hasPrinters', ev.target.checked); if (!ev.target.checked) s('printerCount', ''); }}
                      color="success"
                    />
                  }
                  label={f.hasPrinters ? 'Yes' : 'No'}
                  labelPlacement="start"
                  sx={{ m: 0, '& .MuiTypography-root': { fontSize: 13, fontWeight: 600 } }}
                />
              </Stack>
              {f.hasPrinters && (
                <Box sx={{ mt: 1.5 }}>
                  <Label>How many? *</Label>
                  <TextField
                    size="small" type="number"
                    inputProps={{ min: 1, inputMode: 'numeric' }}
                    value={f.printerCount}
                    onChange={(ev) => s('printerCount', ev.target.value)}
                    onBlur={() => t('printerCount')}
                    error={!!err('printerCount')} helperText={err('printerCount')}
                    sx={{ width: 100, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                  />
                  <Picks opts={[1, 2, 3, 4, 5]} value={f.printerCount} onChange={(v) => s('printerCount', v)} />
                </Box>
              )}
            </Box>
          </Stack>
        </Box>

        {/* ── Cost ── */}
        <Box>
          <Typography variant="overline" color="text.disabled" fontWeight={700} letterSpacing={1.5} mb={1.5} display="block">
            Installation Cost
          </Typography>
          <TextField
            size="small" type="number"
            inputProps={{ min: 0, step: 50, inputMode: 'numeric' }}
            value={f.installationCost}
            onChange={(ev) => s('installationCost', ev.target.value)}
            InputProps={{ startAdornment: <InputAdornment position="start"><Typography fontWeight={700}>$</Typography></InputAdornment> }}
            sx={{ width: 140, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
          />
          <Picks opts={[500, 750, 1000, 1500, 2000]} value={f.installationCost} onChange={(v) => s('installationCost', v)} prefix="$" />
        </Box>

        {/* ── Notes ── */}
        <Box>
          <Label>Notes (optional)</Label>
          <TextField
            fullWidth multiline minRows={2} maxRows={4}
            placeholder="Discount reasons, special instructions…"
            value={f.notes}
            onChange={(ev) => s('notes', ev.target.value)}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, fontSize: 13 } }}
          />
        </Box>

        {/* ── Total ── */}
        <Box
          sx={{
            p: 2,
            borderRadius: 2.5,
            bgcolor: alpha(accent, isDark ? 0.08 : 0.04),
            border: `1px solid ${alpha(accent, 0.15)}`,
            textAlign: 'center',
          }}
        >
          <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: 'uppercase', letterSpacing: 1 }}>
            Estimated Total
          </Typography>
          <Typography variant="h4" fontWeight={800} sx={{ fontFamily: 'monospace', color: accent }}>
            ${total.toLocaleString()}
          </Typography>
        </Box>

        {/* ── Submit ── */}
        <Button
          variant="contained"
          size="large"
          fullWidth
          disabled={mut.isPending}
          startIcon={mut.isPending ? <CircularProgress size={18} color="inherit" /> : <CheckCircleRoundedIcon />}
          onClick={submit}
          sx={{
            py: 1.75,
            borderRadius: 2.5,
            fontWeight: 700,
            fontSize: 16,
            textTransform: 'none',
            background: `linear-gradient(135deg, ${accent} 0%, ${theme.palette.primary.dark} 100%)`,
            boxShadow: `0 4px 20px ${alpha(accent, 0.35)}`,
            mb: 2,
          }}
        >
          {mut.isPending ? 'Creating…' : 'Create Contract'}
        </Button>
      </Stack>

      <Snackbar
        open={snack.open}
        autoHideDuration={4000}
        onClose={() => setSnack((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity={snack.ok ? 'success' : 'error'}
          variant="filled"
          onClose={() => setSnack((s) => ({ ...s, open: false }))}
          sx={{ borderRadius: 2, width: '100%' }}
        >
          {snack.msg}
        </Alert>
      </Snackbar>
    </Container>
  );
}
