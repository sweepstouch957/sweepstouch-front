'use client';

import { promoterService } from '@/services/promotor.service';
import CloseIcon from '@mui/icons-material/Close';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  MenuItem,
  Snackbar,
  TextField,
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

export default function NewPromoterModal({ open, onClose, onCreated }: NewPromoterModalProps) {
  const theme = useTheme();
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    status: 'Activa',
  });

  const [createdPromoter, setCreatedPromoter] = useState<any | null>(null);

  const mutation = useMutation({
    mutationFn: (payload: any) => promoterService.createPromoter(payload),
    onSuccess: (data) => {
      setCreatedPromoter(data);
      setSnackbar({ open: true, message: 'Impulsadora creada con éxito 🎉', severity: 'success' });
      onCreated?.(); // refetch
      setForm({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        address: '',
        status: 'Activa',
      });
    },
    onError: () => {
      setSnackbar({ open: true, message: 'Error al crear impulsadora 😓', severity: 'error' });
    },
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = () => {
    mutation.mutate({
      firstName: form.firstName,
      lastName: form.lastName,
      email: form.email,
      phoneNumber: form.phone,
      status: form.status,
      address: form.address,
    });
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setSnackbar({ open: true, message: 'Contraseña copiada 📋', severity: 'success' });
  };

  return (
    <>
      {/* FORMULARIO DE CREACIÓN */}
      <Dialog
        open={open}
        onClose={onClose}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle
          sx={{
            fontWeight: 700,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          Nueva Impulsadora
          <IconButton onClick={onClose}>
            <CloseIcon sx={{ color: theme.palette.primary.main }} />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Grid
            container
            spacing={2}
          >
            <Grid
              item
              xs={12}
              sm={6}
            >
              <TextField
                fullWidth
                name="firstName"
                label="Nombre"
                placeholder="Ej: Ana"
                value={form.firstName}
                onChange={handleChange}
              />
            </Grid>
            <Grid
              item
              xs={12}
              sm={6}
            >
              <TextField
                fullWidth
                name="lastName"
                label="Apellido"
                placeholder="Ej: López"
                value={form.lastName}
                onChange={handleChange}
              />
            </Grid>
            <Grid
              item
              xs={12}
              sm={6}
            >
              <TextField
                fullWidth
                name="email"
                label="Email"
                placeholder="email@ejemplo.com"
                value={form.email}
                onChange={handleChange}
              />
            </Grid>
            <Grid
              item
              xs={12}
              sm={6}
            >
              <TextField
                fullWidth
                name="phone"
                label="Teléfono"
                placeholder="+1 (555) 123-4567"
                value={form.phone}
                onChange={handleChange}
              />
            </Grid>
            <Grid
              item
              xs={12}
              sm={6}
            >
              <TextField
                fullWidth
                name="address"
                label="Dirección"
                placeholder="Ciudad, Estado"
                value={form.address}
                onChange={handleChange}
              />
            </Grid>
            <Grid
              item
              xs={12}
              sm={6}
            >
              <TextField
                fullWidth
                name="status"
                label="Estado"
                select
                value={form.status}
                onChange={handleChange}
              >
                <MenuItem value="Activa">Activa</MenuItem>
                <MenuItem value="Inactiva">Inactiva</MenuItem>
              </TextField>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, pt: 3 }}>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={mutation.isPending}
            sx={{
              backgroundColor: theme.palette.primary.main,
              borderRadius: 10,
              fontWeight: 600,
              textTransform: 'none',
            }}
          >
            {mutation.isPending ? 'Creando...' : 'Crear'}
          </Button>
          <Button
            onClick={onClose}
            variant="outlined"
            sx={{ borderRadius: 10, fontWeight: 600, textTransform: 'none' }}
          >
            Cancelar
          </Button>
        </DialogActions>
      </Dialog>

      {/* MODAL DE DATOS GENERADOS */}
      <Dialog
        open={!!createdPromoter}
        onClose={() => setCreatedPromoter(null)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>✅ Impulsadora Creada</DialogTitle>
        <DialogContent dividers>
          <Typography>
            <strong>Nombre:</strong> {createdPromoter?.firstName} {createdPromoter?.lastName}
          </Typography>
          <Typography>
            <strong>Email:</strong> {createdPromoter?.email}
          </Typography>
          <Typography>
            <strong>Teléfono:</strong> {createdPromoter?.countryCode} {createdPromoter?.phoneNumber}
          </Typography>
          <Typography sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
            <strong>Contraseña:</strong>
            <span style={{ marginLeft: 8, marginRight: 8 }}>
              {createdPromoter?.generatedPassword}
            </span>
            <IconButton
              size="small"
              onClick={() => handleCopy(createdPromoter?.generatedPassword)}
            >
              <ContentCopyIcon fontSize="small" />
            </IconButton>
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreatedPromoter(null)}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        message={snackbar.message}
      />
    </>
  );
}
