'use client';

import React, { useState } from 'react';
import {
  Alert,
  alpha,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  Grid,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  Snackbar,
  Stack,
  TextField,
  Typography,
  useTheme,
} from '@mui/material';
import {
  CloseRounded,
  PersonAddRounded,
  VisibilityOffRounded,
  VisibilityRounded,
} from '@mui/icons-material';
import { merchantService, CreateUserPayload } from '@/services/merchant.service';

interface CreateUserDialogProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

const ROLES = [
  { value: 'merchant_manager', label: 'Merchant Manager' },
  { value: 'merchant', label: 'Merchant' },
  { value: 'cashier', label: 'Cashier' },
  { value: 'promotor', label: 'Promotor' },
  { value: 'promotor_owner', label: 'Promotor Owner' },
  { value: 'admin', label: 'Administrator' },
  { value: 'general_manager', label: 'General Manager' },
];

const COUNTRY_CODES = [
  { value: '+1', label: '🇺🇸 +1' },
  { value: '+504', label: '🇭🇳 +504' },
  { value: '+52', label: '🇲🇽 +52' },
  { value: '+503', label: '🇸🇻 +503' },
];

const INITIAL: CreateUserPayload = {
  firstName: '',
  lastName: '',
  email: '',
  phoneNumber: '',
  countryCode: '+1',
  role: 'merchant_manager',
  password: '',
  accessCode: '',
};

export default function CreateUserDialog({ open, onClose, onCreated }: CreateUserDialogProps) {
  const theme = useTheme();
  const [form, setForm] = useState<CreateUserPayload>(INITIAL);
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof CreateUserPayload, string>>>({});
  const [snack, setSnack] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const handleChange = (field: keyof CreateUserPayload) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const validate = (): boolean => {
    const newErrors: typeof errors = {};
    if (!form.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!form.role) newErrors.role = 'Role is required';
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = 'Invalid email format';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      await merchantService.createUser({
        ...form,
        password: form.password || undefined,
        accessCode: form.accessCode || undefined,
      });
      setSnack({ open: true, message: `User "${form.firstName}" created successfully`, severity: 'success' });
      setForm(INITIAL);
      setErrors({});
      setTimeout(() => onCreated(), 800);
    } catch (err: any) {
      setSnack({
        open: true,
        message: err?.response?.data?.error || 'Error creating user',
        severity: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    if (saving) return;
    setForm(INITIAL);
    setErrors({});
    onClose();
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            background: theme.palette.background.paper,
            backgroundImage: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.04)} 0%, transparent 60%)`,
            border: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
          },
        }}
      >
        {/* Title */}
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
                background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
                boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.4)}`,
              }}
            >
              <PersonAddRounded sx={{ color: 'white', fontSize: 20 }} />
            </Box>
            <Box flex={1}>
              <Typography variant="h6" fontWeight={700}>
                Create New User
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Fill in the details to create a new platform user
              </Typography>
            </Box>
            <IconButton size="small" onClick={handleClose} disabled={saving}>
              <CloseRounded />
            </IconButton>
          </Stack>
        </DialogTitle>

        <Divider />

        <DialogContent sx={{ pt: 2.5 }}>
          <Grid container spacing={2}>
            {/* First Name */}
            <Grid item xs={12} sm={6}>
              <TextField
                label="First Name *"
                fullWidth
                size="small"
                value={form.firstName}
                onChange={handleChange('firstName')}
                error={!!errors.firstName}
                helperText={errors.firstName}
                autoFocus
              />
            </Grid>

            {/* Last Name */}
            <Grid item xs={12} sm={6}>
              <TextField
                label="Last Name"
                fullWidth
                size="small"
                value={form.lastName}
                onChange={handleChange('lastName')}
              />
            </Grid>

            {/* Email */}
            <Grid item xs={12}>
              <TextField
                label="Email"
                type="email"
                fullWidth
                size="small"
                value={form.email}
                onChange={handleChange('email')}
                error={!!errors.email}
                helperText={errors.email}
              />
            </Grid>

            {/* Phone */}
            <Grid item xs={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Code</InputLabel>
                <Select
                  value={form.countryCode}
                  label="Code"
                  onChange={(e) => setForm((p) => ({ ...p, countryCode: e.target.value }))}
                >
                  {COUNTRY_CODES.map((c) => (
                    <MenuItem key={c.value} value={c.value}>{c.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={8}>
              <TextField
                label="Phone Number"
                fullWidth
                size="small"
                value={form.phoneNumber}
                onChange={handleChange('phoneNumber')}
              />
            </Grid>

            {/* Role */}
            <Grid item xs={12}>
              <FormControl fullWidth size="small" error={!!errors.role}>
                <InputLabel>Role *</InputLabel>
                <Select
                  value={form.role}
                  label="Role *"
                  onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))}
                >
                  {ROLES.map((r) => (
                    <MenuItem key={r.value} value={r.value}>{r.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Password */}
            <Grid item xs={12}>
              <TextField
                label="Password"
                fullWidth
                size="small"
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={handleChange('password')}
                helperText="Leave blank to auto-generate: firstname2024!"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton edge="end" size="small" onClick={() => setShowPassword(!showPassword)}>
                        {showPassword ? <VisibilityOffRounded fontSize="small" /> : <VisibilityRounded fontSize="small" />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>

            {/* Access Code */}
            <Grid item xs={12}>
              <TextField
                label="Access Code"
                fullWidth
                size="small"
                value={form.accessCode}
                onChange={handleChange('accessCode')}
                helperText="Optional code for cashier/merchant quick login"
              />
            </Grid>
          </Grid>

          {/* Actions */}
          <Stack direction="row" spacing={1.5} justifyContent="flex-end" mt={3}>
            <Button
              variant="outlined"
              onClick={handleClose}
              disabled={saving}
              sx={{ borderRadius: 2 }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={saving}
              startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <PersonAddRounded />}
              sx={{
                borderRadius: 2,
                background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
                px: 3,
              }}
            >
              {saving ? 'Creating…' : 'Create User'}
            </Button>
          </Stack>
        </DialogContent>
      </Dialog>

      <Snackbar
        open={snack.open}
        autoHideDuration={3500}
        onClose={() => setSnack((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnack((s) => ({ ...s, open: false }))}
          severity={snack.severity}
          variant="filled"
          sx={{ borderRadius: 2 }}
        >
          {snack.message}
        </Alert>
      </Snackbar>
    </>
  );
}
