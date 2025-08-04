'use client';

import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import EditIcon from '@mui/icons-material/Edit';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import VisibilityIcon from '@mui/icons-material/Visibility';
import {
  Avatar,
  Box,
  Button,
  Card,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
  useTheme,
} from '@mui/material';
import { format } from 'date-fns';
import es from 'date-fns/locale/es';
import { useState } from 'react';

interface RequestCardProps {
  request: any;
  onAssign?: () => void;
  onReject?: (reason: string) => void;
}

const statusStyles: Record<string, { label: string; color: string }> = {
  pendiente: { label: 'Pendiente', color: '#ffb703' },
  aprobada: { label: 'Aprobada', color: '#00c49a' },
  rechazada: { label: 'Rechazada', color: '#fc0680' },
};

const RequestCard = ({ request, onAssign, onReject }: RequestCardProps) => {
  const shift = request.shiftId;
  const promoter = request.promoterId;
  const store = shift.storeInfo;
  const startDate = format(new Date(shift.startTime || new Date()), 'EEE, d MMM yyyy', {
    locale: es,
  });
  const startTime = format(new Date(shift.startTime || new Date()), 'HH:mm');
  const endTime = format(new Date(shift.endTime || new Date()), 'HH:mm');
  const status = statusStyles[request.status] || { label: request.status, color: '#ccc' };

  const [openRejectModal, setOpenRejectModal] = useState(false);
  const [reason, setReason] = useState('');

  const handleReject = () => {
    if (reason.trim() && onReject) {
      onReject(reason);
      setOpenRejectModal(false);
      setReason('');
    }
  };

  return (
    <Card
      sx={{
        borderRadius: 4,
        p: 2,
        backgroundColor: '#fefeff',
        border: '1px solid #eee',
        boxShadow: '0px 4px 10px rgba(0,0,0,0.05)',
      }}
    >
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
      >
        <Box>
          <Typography
            fontWeight={600}
            fontSize={14}
            color="#999"
          >
            Solicitud de Turno
          </Typography>
          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
            mt={1}
          >
            <Avatar sx={{ bgcolor: '#fc0680' }} />
            <Typography fontWeight={700}>
              {promoter?.firstName} {promoter?.lastName}
            </Typography>
          </Stack>
        </Box>
        <Typography
          sx={{
            backgroundColor: status.color,
            color: '#fff',
            fontWeight: 600,
            fontSize: 13,
            px: 2,
            py: 0.5,
            borderRadius: 2,
          }}
        >
          {status.label}
        </Typography>
      </Stack>

      <Box mt={2}>
        <Stack
          direction="row"
          spacing={1}
          alignItems="center"
        >
          <LocationOnIcon
            fontSize="small"
            color="primary"
          />
          <Box>
            <Typography
              fontWeight={700}
              color="primary"
            >
              {store?.name || 'Supermercado'}
            </Typography>
            <Typography
              fontSize={13}
              color="text.secondary"
            >
              {store?.address}
            </Typography>
            <Typography
              fontSize={13}
              color="text.secondary"
            >
              {store?.customerCount} clientes
            </Typography>
          </Box>
        </Stack>

        <Stack
          direction="row"
          spacing={4}
          mt={2}
        >
          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
          >
            <CalendarMonthIcon
              fontSize="small"
              color="primary"
            />
            <Typography fontSize={13}>{startDate}</Typography>
          </Stack>
          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
          >
            <AccessTimeIcon
              fontSize="small"
              color="primary"
            />
            <Typography fontSize={13}>
              {startTime} - {endTime}
            </Typography>
          </Stack>
        </Stack>
      </Box>

      {request?.shiftSnapshot?.description && (
        <Box
          mt={2}
          sx={{
            backgroundColor: '#f1f1f1',
            borderRadius: 2,
            px: 2,
            py: 1.5,
            fontStyle: 'italic',
            color: '#333',
          }}
        >
          “{request.shiftSnapshot.description}”
        </Box>
      )}

      <Stack
        direction="row"
        spacing={2}
        justifyContent="flex-start"
        mt={2}
      >
        <Button
          variant="contained"
          color="secondary"
          startIcon={<VisibilityIcon />}
          size="small"
          sx={{ textTransform: 'none', borderRadius: 2, bgcolor: '#ffb6d2' }}
        >
          Ver detalles
        </Button>
        <Button
          variant="contained"
          startIcon={<EditIcon />}
          size="small"
          sx={{ textTransform: 'none', borderRadius: 2, bgcolor: '#fc0680' }}
        />
        {request.status === 'pendiente' && (
          <>
            <Button
              variant="contained"
              size="small"
              onClick={onAssign}
              sx={{ textTransform: 'none', borderRadius: 2, bgcolor: '#00c49a' }}
            >
              Aceptar
            </Button>
            <Button
              variant="contained"
              size="small"
              onClick={() => setOpenRejectModal(true)}
              sx={{ textTransform: 'none', borderRadius: 2, bgcolor: '#fc0680' }}
            >
              Rechazar
            </Button>
          </>
        )}
      </Stack>

      <Dialog
        open={openRejectModal}
        onClose={() => setOpenRejectModal(false)}
      >
        <DialogTitle>Motivo de Rechazo</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Motivo"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            required
            multiline
            minRows={3}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenRejectModal(false)}>Cancelar</Button>
          <Button
            onClick={handleReject}
            variant="contained"
            color="error"
            disabled={!reason.trim()}
          >
            Confirmar Rechazo
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
};

export default RequestCard;
