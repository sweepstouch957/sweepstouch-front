'use client';

import React, { useEffect, useState } from 'react';
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
  FormControlLabel,
  Grid,
  IconButton,
  Snackbar,
  Stack,
  Switch,
  TextField,
  Typography,
  useTheme,
} from '@mui/material';
import {
  CloseRounded,
  EditRounded,
} from '@mui/icons-material';
import { merchantService, MerchantUser, UpdateUserPayload } from '@/services/merchant.service';

interface EditUserDialogProps {
  open: boolean;
  user: MerchantUser;
  onClose: () => void;
  onUpdated: () => void;
}

const getAvatarColor = (id: string) => {
  const colors = [
    '#6C63FF', '#FF6584', '#43A8D0', '#F7B731', '#26de81',
    '#FC5C65', '#45AAF2', '#FD9644', '#2BCB9B', '#A55EEA',
  ];
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) & 0xffff;
  return colors[h % colors.length];
};

export default function EditUserDialog({ open, user, onClose, onUpdated }: EditUserDialogProps) {
  const theme = useTheme();
  const [form, setForm] = useState<UpdateUserPayload>({});
  const [saving, setSaving] = useState(false);
  const [snack, setSnack] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  useEffect(() => {
    if (user) {
      setForm({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phoneNumber: user.phoneNumber || '',
        accessCode: user.accessCode || '',
        active: user.active !== false,
      });
    }
  }, [user]);

  const handleChange = (field: keyof UpdateUserPayload) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = async () => {
    setSaving(true);
    const idToUpdate = user._id || (user as any).id;
    try {
      await merchantService.updateUser(idToUpdate, form);
      setSnack({ open: true, message: `User "${form.firstName || user.firstName}" updated`, severity: 'success' });
      setTimeout(() => onUpdated(), 900);
    } catch (err: any) {
      setSnack({
        open: true,
        message: err?.response?.data?.message || 'Error updating user',
        severity: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  const userIdForAvatar = user._id || (user as any).id || '';
  const accentColor = getAvatarColor(userIdForAvatar);

  return (
    <>
      <Dialog
        open={open}
        onClose={!saving ? onClose : undefined}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            background: theme.palette.background.paper,
            backgroundImage: `linear-gradient(135deg, ${alpha(accentColor, 0.06)} 0%, transparent 60%)`,
            border: `1px solid ${alpha(accentColor, 0.3)}`,
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
                background: `linear-gradient(135deg, ${accentColor}cc 0%, ${accentColor} 100%)`,
                boxShadow: `0 4px 12px ${alpha(accentColor, 0.4)}`,
              }}
            >
              <EditRounded sx={{ color: 'white', fontSize: 20 }} />
            </Box>
            <Box flex={1}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <Typography variant="h6" fontWeight={700}>
                  Edit User
                </Typography>
                <Chip
                  label={user.role?.replace(/_/g, ' ')}
                  size="small"
                  sx={{ fontSize: 10, height: 20, textTransform: 'capitalize' }}
                />
              </Stack>
              <Typography variant="caption" color="text.secondary">
                {user.email || user.phoneNumber || user._id}
              </Typography>
            </Box>
            <IconButton size="small" onClick={onClose} disabled={saving}>
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
                value={form.firstName || ''}
                onChange={handleChange('firstName')}
                autoFocus
              />
            </Grid>

            {/* Last Name */}
            <Grid item xs={12} sm={6}>
              <TextField
                label="Last Name"
                fullWidth
                size="small"
                value={form.lastName || ''}
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
                value={form.email || ''}
                onChange={handleChange('email')}
              />
            </Grid>

            {/* Phone */}
            <Grid item xs={12}>
              <TextField
                label="Phone Number"
                fullWidth
                size="small"
                value={form.phoneNumber || ''}
                onChange={handleChange('phoneNumber')}
              />
            </Grid>

            {/* Access Code */}
            <Grid item xs={12}>
              <TextField
                label="Access Code"
                fullWidth
                size="small"
                value={form.accessCode || ''}
                onChange={handleChange('accessCode')}
                helperText="Quick-login code for cashiers/merchants"
              />
            </Grid>

            {/* Active toggle */}
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={form.active !== false}
                    onChange={(e) => setForm((p) => ({ ...p, active: e.target.checked }))}
                    color="success"
                  />
                }
                label={
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography variant="body2">Account Status</Typography>
                    <Chip
                      label={form.active !== false ? 'Active' : 'Inactive'}
                      size="small"
                      color={form.active !== false ? 'success' : 'default'}
                      sx={{ fontSize: 10, height: 20 }}
                    />
                  </Stack>
                }
              />
            </Grid>
          </Grid>

          {/* Actions */}
          <Stack direction="row" spacing={1.5} justifyContent="flex-end" mt={3}>
            <Button
              variant="outlined"
              onClick={onClose}
              disabled={saving}
              sx={{ borderRadius: 2 }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={saving}
              startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <EditRounded />}
              sx={{
                borderRadius: 2,
                background: `linear-gradient(135deg, ${accentColor}cc 0%, ${accentColor} 100%)`,
                boxShadow: `0 4px 12px ${alpha(accentColor, 0.4)}`,
                px: 3,
              }}
            >
              {saving ? 'Saving…' : 'Save Changes'}
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
