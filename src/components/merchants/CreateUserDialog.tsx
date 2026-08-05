'use client';

import React, { useState } from 'react';
import {
  Controller,
  useForm,
  useWatch,
  type RegisterOptions,
  type UseFormRegister,
} from 'react-hook-form';
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
  ListSubheader,
  MenuItem,
  Select,
  Snackbar,
  Stack,
  TextField,
  Typography,
  useTheme } from '@mui/material';
import {
  BusinessRounded,
  CloseRounded,
  PersonAddRounded,
  StorefrontRounded,
  VisibilityOffRounded,
  VisibilityRounded,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { merchantService, CreateUserPayload } from '@/services/merchant.service';
import { departmentService } from '@/services/department.service';

interface CreateUserDialogProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

/* ── Role definitions grouped by type ── */
const STAFF_ROLES = [
  { value: 'admin', label: 'Administrator', desc: 'Full platform access' },
  { value: 'general_manager', label: 'General Manager', desc: 'Oversees all operations' },
  { value: 'design', label: 'Designer', desc: 'Design & creative team' },
  { value: 'campaign_manager', label: 'Campaign Manager', desc: 'Manages marketing campaigns' },
  { value: 'promotor_manager', label: 'Promotor Manager', desc: 'Manages field promotors' },
  { value: 'merchant_manager', label: 'Merchant Manager', desc: 'Manages merchant accounts' },
  { value: 'marketing', label: 'Marketing', desc: 'Marketing team' },
];

const EXTERNAL_ROLES = [
  { value: 'merchant', label: 'Merchant', desc: 'Store owner' },
  { value: 'cashier', label: 'Cashier', desc: 'POS operator' },
  { value: 'promotor', label: 'Promotor', desc: 'Field staff' },
];

const ALL_ROLES = [...STAFF_ROLES, ...EXTERNAL_ROLES];
const STAFF_ROLE_VALUES = STAFF_ROLES.map((r) => r.value);

const COUNTRY_CODES = [
  { value: '+1', label: '🇺🇸 +1' },
  { value: '+504', label: '🇭🇳 +504' },
  { value: '+52', label: '🇲🇽 +52' },
  { value: '+503', label: '🇸🇻 +503' },
];

const INITIAL: CreateUserPayload & { departmentId?: string } = {
  firstName: '',
  lastName: '',
  email: '',
  phoneNumber: '',
  countryCode: '+1',
  role: 'merchant_manager',
  password: '',
  accessCode: '',
  departmentId: '',
};

type CreateUserFormValues = typeof INITIAL;

/** MUI espera el ref del input en `inputRef`, no en `ref`. */
function rhf(
  register: UseFormRegister<CreateUserFormValues>,
  name: keyof CreateUserFormValues,
  options?: RegisterOptions<CreateUserFormValues, any>
) {
  const { ref, ...rest } = register(name, options as any);
  return { inputRef: ref, ...rest };
}

export default function CreateUserDialog({ open, onClose, onCreated }: CreateUserDialogProps) {
  const theme = useTheme();
  const {
    register,
    control,
    handleSubmit: rhfHandleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<CreateUserFormValues>({ defaultValues: INITIAL });
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [snack, setSnack] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false, message: '', severity: 'success',
  });

  const { data: departments = [] } = useQuery({
    queryKey: ['departments'],
    queryFn: departmentService.list,
    staleTime: 120_000,
  });

  // El rol decide si se muestra el departamento: se observa solo ese campo.
  const role = useWatch({ control, name: 'role' });
  const isStaffRole = STAFF_ROLE_VALUES.includes(role);

  const handleSubmit = rhfHandleSubmit(async (values) => {
    setSaving(true);
    try {
      await merchantService.createUser({
        ...values,
        password: values.password || undefined,
        accessCode: values.accessCode || undefined,
        departmentId: values.departmentId || undefined,
      } as any);
      setSnack({ open: true, message: `User "${values.firstName}" created successfully`, severity: 'success' });
      reset(INITIAL);
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
  });

  const handleClose = () => {
    if (saving) return;
    reset(INITIAL);
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
                width: 40, height: 40, borderRadius: 2,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
              }}
            >
              <PersonAddRounded sx={{ color: 'white', fontSize: 20 }} />
            </Box>
            <Box flex={1}>
              <Typography variant="h6" fontWeight={700}>Create New User</Typography>
              <Typography variant="caption" color="text.secondary">
                {isStaffRole ? <><BusinessRounded fontSize="small" sx={{ mr: 1, verticalAlign: 'middle' }} />Staff — Sweepstouch Team</> : <><StorefrontRounded fontSize="small" sx={{ mr: 1, verticalAlign: 'middle' }} />External — Store Operations</>}
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
              <TextField label="First Name *" fullWidth size="small"
                {...rhf(register, 'firstName', { required: 'First name is required' })}
                error={!!errors.firstName} helperText={errors.firstName?.message} autoFocus
              />
            </Grid>
            {/* Last Name */}
            <Grid item xs={12} sm={6}>
              <TextField label="Last Name" fullWidth size="small"
                {...rhf(register, 'lastName')}
              />
            </Grid>
            {/* Email */}
            <Grid item xs={12}>
              <TextField label="Email" type="email" fullWidth size="small"
                {...rhf(register, 'email', {
                  pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Invalid email format' },
                })}
                error={!!errors.email} helperText={errors.email?.message}
              />
            </Grid>
            {/* Phone */}
            <Grid item xs={4}>
              <Controller
                control={control}
                name="countryCode"
                render={({ field }) => (
                  <FormControl fullWidth size="small">
                    <InputLabel>Code</InputLabel>
                    <Select {...field} label="Code">
                      {COUNTRY_CODES.map((c) => (
                        <MenuItem key={c.value} value={c.value}>{c.label}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
              />
            </Grid>
            <Grid item xs={8}>
              <TextField label="Phone Number" fullWidth size="small"
                {...rhf(register, 'phoneNumber')}
              />
            </Grid>

            {/* ── Role (grouped) ── */}
            <Grid item xs={12}>
              <FormControl fullWidth size="small" error={!!errors.role}>
                <InputLabel>Role *</InputLabel>
                <Select
                  value={role}
                  label="Role *"
                  onChange={(e) => {
                    const newRole = e.target.value;
                    setValue('role', newRole);
                    // Clear department if switching to external
                    if (!STAFF_ROLE_VALUES.includes(newRole)) setValue('departmentId', '');
                  }}
                >
                  <ListSubheader sx={{ fontWeight: 700, fontSize: 11, letterSpacing: 1, color: 'primary.main', bgcolor: alpha(theme.palette.primary.main, 0.04) }}>
                    <BusinessRounded fontSize="small" sx={{ mr: 1, verticalAlign: 'middle' }} />STAFF: SWEEPSTOUCH TEAM
                  </ListSubheader>
                  {STAFF_ROLES.map((r) => (
                    <MenuItem key={r.value} value={r.value}>
                      <Stack>
                        <Typography variant="body2" fontWeight={600}>{r.label}</Typography>
                        <Typography variant="caption" color="text.secondary" fontSize={10}>{r.desc}</Typography>
                      </Stack>
                    </MenuItem>
                  ))}
                  <ListSubheader sx={{ fontWeight: 700, fontSize: 11, letterSpacing: 1, color: 'warning.main', bgcolor: alpha(theme.palette.warning.main, 0.04) }}>
                    <StorefrontRounded fontSize="small" sx={{ mr: 1, verticalAlign: 'middle' }} />EXTERNAL: STORE OPERATIONS
                  </ListSubheader>
                  {EXTERNAL_ROLES.map((r) => (
                    <MenuItem key={r.value} value={r.value}>
                      <Stack>
                        <Typography variant="body2" fontWeight={600}>{r.label}</Typography>
                        <Typography variant="caption" color="text.secondary" fontSize={10}>{r.desc}</Typography>
                      </Stack>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* ── Department (only for staff roles) ── */}
            {isStaffRole && (
              <Grid item xs={12}>
                <FormControl fullWidth size="small">
                  <InputLabel>Department</InputLabel>
                  <Select
                    {...register('departmentId')}
                    defaultValue=""
                    label="Department"
                  >
                    <MenuItem value="">
                      <Typography variant="body2" color="text.secondary">No department</Typography>
                    </MenuItem>
                    {departments.map((d) => (
                      <MenuItem key={d._id} value={d._id}>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: d.color }} />
                          <Typography variant="body2" fontWeight={600}>{d.name}</Typography>
                        </Stack>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            )}

            {/* Password */}
            <Grid item xs={12}>
              <TextField label="Password" fullWidth size="small"
                type={showPassword ? 'text' : 'password'}
                {...rhf(register, 'password')}
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
              <TextField label="Access Code" fullWidth size="small"
                {...rhf(register, 'accessCode')}
                helperText="Optional code for cashier/merchant quick login"
              />
            </Grid>
          </Grid>

          {/* Actions */}
          <Stack direction="row" spacing={1.5} justifyContent="flex-end" mt={3}>
            <Button variant="outlined" onClick={handleClose} disabled={saving} sx={{ borderRadius: 2 }}>
              Cancel
            </Button>
            <Button variant="contained" onClick={handleSubmit} disabled={saving}
              startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <PersonAddRounded />}
              sx={{
                borderRadius: 2, px: 3,
                background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
              }}
            >
              {saving ? 'Creating…' : 'Create User'}
            </Button>
          </Stack>
        </DialogContent>
      </Dialog>

      <Snackbar open={snack.open} autoHideDuration={3500}
        onClose={() => setSnack((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setSnack((s) => ({ ...s, open: false }))}
          severity={snack.severity} variant="filled" sx={{ borderRadius: 2 }}
        >
          {snack.message}
        </Alert>
      </Snackbar>
    </>
  );
}
