// components/ShiftPreviewModal.tsx
'use client';

import { Shift, shiftService } from '@/services/shift.service';
import {
  Avatar,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Stack,
  Typography,
} from '@mui/material';
import { useEffect, useState } from 'react';

interface ShiftPreviewModalProps {
  open: boolean;
  onClose: () => void;
  shiftId: string | null;
}

export default function ShiftPreviewModal({ open, onClose, shiftId }: ShiftPreviewModalProps) {
  const [shift, setShift] = useState<Shift | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!shiftId) return;
    setLoading(true);
    shiftService
      .getShiftById(shiftId)
      .then((res) => {
        console.log(res);
        setShift(res.shift);
      })
      .finally(() => setLoading(false));
  }, [shiftId]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle
        fontWeight={700}
        color="primary.main"
      >
        Vista previa del turno
      </DialogTitle>

      <DialogContent>
        {loading ? (
          <Typography>Cargando...</Typography>
        ) : shift ? (
          <Box>
            {/* Supermercado */}
            <Stack
              direction="row"
              alignItems="center"
              spacing={2}
              mb={2}
            >
              <Avatar src={shift.storeInfo?.image || '/placeholder.png'} />
              <Box>
                <Typography fontWeight="bold">{shift.storeInfo?.name}</Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                >
                  {shift.storeInfo?.address}
                </Typography>
              </Box>
            </Stack>

            {/* Fecha y Horario */}
            <Typography
              fontWeight={600}
              mb={1}
            >
              Horario
            </Typography>
            <Typography>
              {new Date(shift.date).toLocaleDateString()} de{' '}
              {new Date(shift.startTime).toLocaleTimeString()} a{' '}
              {new Date(shift.endTime).toLocaleTimeString()}
            </Typography>

            <Divider sx={{ my: 2 }} />

            {/* Participaciones */}
            <Typography
              fontWeight={600}
              mb={1}
            >
              Participaciones captadas
            </Typography>
            <Stack
              direction="row"
              spacing={2}
            >
              <Box>
                <Typography
                  variant="body2"
                  color="text.secondary"
                >
                  Nuevos
                </Typography>
                <Typography fontWeight={700}>{shift.newParticipations ?? 0}</Typography>
              </Box>
              <Box>
                <Typography
                  variant="body2"
                  color="text.secondary"
                >
                  Existentes
                </Typography>
                <Typography fontWeight={700}>{shift.existingParticipations ?? 0}</Typography>
              </Box>
              <Box>
                <Typography
                  variant="body2"
                  color="text.secondary"
                >
                  Total
                </Typography>
                <Typography fontWeight={700}>{shift.totalParticipations ?? 0}</Typography>
              </Box>
            </Stack>

            <Divider sx={{ my: 2 }} />

            {/* Ganancias */}
            <Typography
              fontWeight={600}
              mb={1}
            >
              Ganancias
            </Typography>
            <Typography
              fontSize={24}
              fontWeight={800}
              color="green"
            >
              ${shift.totalEarnings?.toFixed(2) || '0.00'}
            </Typography>
          </Box>
        ) : (
          <Typography>No se encontró información del turno.</Typography>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cerrar</Button>
      </DialogActions>
    </Dialog>
  );
}
