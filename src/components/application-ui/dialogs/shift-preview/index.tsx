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
  Skeleton,
  Stack,
  Typography,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';

interface ShiftPreviewModalProps {
  open: boolean;
  onClose: () => void;
  shiftId: string | null;
}

export default function ShiftPreviewModal({ open, onClose, shiftId }: ShiftPreviewModalProps) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['shift-by-id', shiftId],
    queryFn: () => shiftService.getShiftById(shiftId!),
    enabled: !!shiftId,
    staleTime: 1000 * 60 * 2,
  });

  const shift: Shift | undefined = data?.shift;

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
        {isLoading ? (
          <Box>
            <Stack
              direction="row"
              spacing={2}
              mb={2}
            >
              <Skeleton
                variant="circular"
                width={40}
                height={40}
              />
              <Box flex={1}>
                <Skeleton
                  width="60%"
                  height={20}
                />
                <Skeleton
                  width="40%"
                  height={16}
                />
              </Box>
            </Stack>
            <Skeleton height={20} sx={{ mb: 1 }} />
            <Skeleton width="70%" height={20} />
          </Box>
        ) : isError || !shift ? (
          <Typography color="text.secondary">
            No se encontró información del turno.
          </Typography>
        ) : (
          <Box>
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
              {[
                { label: 'Nuevos', value: shift.newParticipations ?? 0 },
                { label: 'Existentes', value: shift.existingParticipations ?? 0 },
                { label: 'Total', value: shift.totalParticipations ?? 0 },
              ].map(({ label, value }) => (
                <Box key={label}>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                  >
                    {label}
                  </Typography>
                  <Typography fontWeight={700}>{value}</Typography>
                </Box>
              ))}
            </Stack>

            <Divider sx={{ my: 2 }} />

            <Typography
              fontWeight={600}
              mb={1}
            >
              Ganancias
            </Typography>
            <Typography
              fontSize={24}
              fontWeight={800}
              color="success.main"
            >
              ${shift.totalEarnings?.toFixed(2) || '0.00'}
            </Typography>
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cerrar</Button>
      </DialogActions>
    </Dialog>
  );
}
