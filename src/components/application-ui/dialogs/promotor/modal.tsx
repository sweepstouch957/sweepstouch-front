'use client';

import { promoterService } from '@/services/promotor.service';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import ContentCopyRoundedIcon from '@mui/icons-material/ContentCopyRounded';
import PersonAddAlt1RoundedIcon from '@mui/icons-material/PersonAddAlt1Rounded';
import {
  alpha,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  Divider,
  IconButton,
  MenuItem,
  Snackbar,
  Stack,
  TextField,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material';
import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';

interface NewPromoterModalProps {
  open: boolean;
  onClose: () => void;
  onCreated?: () => void;
}

const EMPTY_FORM = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  address: '',
  status: 'Activa',
};

export default function NewPromoterModal({ open, onClose, onCreated }: NewPromoterModalProps) {
  const theme  = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const primary = theme.palette.primary.main;

  const [form,             setForm]             = useState(EMPTY_FORM);
  const [createdPromoter,  setCreatedPromoter]  = useState<any | null>(null);
  const [copied,           setCopied]           = useState(false);
  const [snackOpen,        setSnackOpen]        = useState(false);
  const [snackMsg,         setSnackMsg]         = useState('');

  const mutation = useMutation({
    mutationFn: (payload: any) => promoterService.createPromoter(payload),
    onSuccess: (data) => {
      setCreatedPromoter(data);
      setForm(EMPTY_FORM);
      onCreated?.();
    },
    onError: () => {
      setSnackMsg('Error al crear la impulsadora. Verifica los datos.');
      setSnackOpen(true);
    },
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = () => {
    if (!form.firstName.trim() || !form.lastName.trim()) {
      setSnackMsg('Nombre y apellido son requeridos.');
      setSnackOpen(true);
      return;
    }
    mutation.mutate({
      firstName:   form.firstName,
      lastName:    form.lastName,
      email:       form.email,
      phoneNumber: form.phone,
      status:      form.status,
      address:     form.address,
    });
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCloseCreated = () => {
    setCreatedPromoter(null);
    onClose();
  };

  const fieldSx = { '& .MuiOutlinedInput-root': { borderRadius: 2 } };

  return (
    <>
      {/* ── Creation form ──────────────────────────────────────────────────── */}
      <Dialog
        open={open && !createdPromoter}
        onClose={onClose}
        fullWidth
        maxWidth="sm"
        PaperProps={{ sx: { borderRadius: 3, overflow: 'hidden' } }}
      >
        {/* Header */}
        <Box
          sx={{
            px: 3, pt: 2.5, pb: 2,
            borderBottom: `1px solid ${theme.palette.divider}`,
            bgcolor: isDark ? alpha(theme.palette.common.white, 0.02) : alpha(primary, 0.02),
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
          }}
        >
          <Box
            sx={{
              width: 36, height: 36, borderRadius: 2,
              display: 'grid', placeItems: 'center',
              bgcolor: alpha(primary, 0.1),
              border: `1px solid ${alpha(primary, 0.2)}`,
              flexShrink: 0,
            }}
          >
            <PersonAddAlt1RoundedIcon sx={{ fontSize: 18, color: primary }} />
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography fontWeight={800} fontSize={15} sx={{ lineHeight: 1.2 }}>
              Nueva Impulsadora
            </Typography>
            <Typography variant="caption" color="text.disabled">
              Se generará una contraseña automáticamente
            </Typography>
          </Box>
          <IconButton size="small" onClick={onClose} sx={{ color: 'text.secondary', '&:hover': { color: 'error.main', bgcolor: alpha(theme.palette.error.main, 0.08) } }}>
            <CloseRoundedIcon fontSize="small" />
          </IconButton>
        </Box>

        <DialogContent sx={{ pt: 3, px: 3 }}>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
              gap: 2,
            }}
          >
            <TextField fullWidth name="firstName" label="Nombre" placeholder="Ana" size="small"
              value={form.firstName} onChange={handleChange} sx={fieldSx} />
            <TextField fullWidth name="lastName" label="Apellido" placeholder="Lopez" size="small"
              value={form.lastName} onChange={handleChange} sx={fieldSx} />
            <TextField fullWidth name="email" label="Email" placeholder="ana@ejemplo.com" size="small"
              value={form.email} onChange={handleChange} sx={fieldSx} />
            <TextField fullWidth name="phone" label="Telefono" placeholder="+1 555 123 4567" size="small"
              value={form.phone} onChange={handleChange} sx={fieldSx} />
            <TextField fullWidth name="address" label="Direccion" placeholder="Ciudad, Estado" size="small"
              value={form.address} onChange={handleChange} sx={fieldSx} />
            <TextField fullWidth name="status" label="Estado" select size="small"
              value={form.status} onChange={handleChange} sx={fieldSx}>
              <MenuItem value="Activa">Activa</MenuItem>
              <MenuItem value="Inactiva">Inactiva</MenuItem>
            </TextField>
          </Box>
        </DialogContent>

        <DialogActions
          sx={{
            px: 3, py: 2, gap: 1,
            borderTop: `1px solid ${theme.palette.divider}`,
            bgcolor: isDark
              ? alpha(theme.palette.common.white, 0.02)
              : alpha(theme.palette.common.black, 0.015),
          }}
        >
          <Button
            onClick={onClose} variant="outlined" color="inherit" size="small"
            sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 999, borderColor: 'divider' }}
          >
            Cancelar
          </Button>
          <Box sx={{ flex: 1 }} />
          <Button
            onClick={handleSubmit}
            variant="contained"
            disableElevation
            disabled={mutation.isPending}
            sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 999, px: 3, minWidth: 100 }}
          >
            {mutation.isPending ? 'Creando…' : 'Crear'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Success: generated credentials ─────────────────────────────────── */}
      <Dialog
        open={Boolean(createdPromoter)}
        onClose={handleCloseCreated}
        fullWidth
        maxWidth="xs"
        PaperProps={{ sx: { borderRadius: 3, overflow: 'hidden' } }}
      >
        <Box
          sx={{
            px: 3, pt: 2.5, pb: 2,
            borderBottom: `1px solid ${theme.palette.divider}`,
            bgcolor: isDark ? alpha(theme.palette.success.main, 0.06) : alpha(theme.palette.success.main, 0.04),
          }}
        >
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Stack direction="row" alignItems="center" spacing={1.25}>
              <Chip
                label="Creada"
                size="small"
                color="success"
                sx={{ fontWeight: 700, fontSize: 11 }}
              />
              <Typography fontWeight={800} fontSize={15}>
                {createdPromoter?.firstName} {createdPromoter?.lastName}
              </Typography>
            </Stack>
            <IconButton size="small" onClick={handleCloseCreated} sx={{ color: 'text.secondary' }}>
              <CloseRoundedIcon fontSize="small" />
            </IconButton>
          </Stack>
        </Box>

        <DialogContent sx={{ px: 3, pt: 2.5, pb: 2 }}>
          <Typography sx={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: 'text.disabled', mb: 1.5 }}>
            Credenciales generadas
          </Typography>

          <Stack spacing={1.25}>
            {[
              { label: 'Email',    value: createdPromoter?.email },
              { label: 'Telefono', value: `${createdPromoter?.countryCode ?? ''} ${createdPromoter?.phoneNumber ?? ''}`.trim() },
            ].map(({ label, value }) => value ? (
              <Box key={label}>
                <Typography sx={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', color: 'text.disabled', letterSpacing: 0.8 }}>{label}</Typography>
                <Typography sx={{ fontSize: 13, fontWeight: 500 }}>{value}</Typography>
              </Box>
            ) : null)}

            <Divider />

            {/* Password row with copy */}
            <Box
              sx={{
                p: 1.5, borderRadius: 2,
                border: `1px solid ${alpha(primary, 0.2)}`,
                bgcolor: alpha(primary, isDark ? 0.06 : 0.03),
                display: 'flex', alignItems: 'center', gap: 1.5,
              }}
            >
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography sx={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'text.disabled', letterSpacing: 0.8 }}>
                  Contrasena temporal
                </Typography>
                <Typography
                  sx={{ fontSize: 15, fontWeight: 800, fontFamily: 'monospace', color: primary, letterSpacing: 1.5, mt: 0.25 }}
                >
                  {createdPromoter?.generatedPassword ?? '—'}
                </Typography>
              </Box>
              <Tooltip title={copied ? 'Copiado' : 'Copiar contrasena'}>
                <IconButton
                  size="small"
                  onClick={() => handleCopy(createdPromoter?.generatedPassword ?? '')}
                  sx={{
                    color: copied ? theme.palette.success.main : primary,
                    bgcolor: alpha(copied ? theme.palette.success.main : primary, 0.08),
                    borderRadius: 1.5,
                    flexShrink: 0,
                    '&:hover': { bgcolor: alpha(primary, 0.15) },
                  }}
                >
                  <ContentCopyRoundedIcon sx={{ fontSize: 16 }} />
                </IconButton>
              </Tooltip>
            </Box>

            <Typography sx={{ fontSize: 11, color: 'text.disabled', lineHeight: 1.5 }}>
              Comparte esta contrasena con la impulsadora. Podra cambiarla desde la app.
            </Typography>
          </Stack>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
          <Button
            variant="contained" disableElevation fullWidth
            onClick={handleCloseCreated}
            sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 999 }}
          >
            Listo
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackOpen}
        autoHideDuration={4000}
        onClose={() => setSnackOpen(false)}
        message={snackMsg}
      />
    </>
  );
}
