'use client';

import { shiftService } from '@/services/shift.service';
import { Delete, Edit, Search, Visibility } from '@mui/icons-material';
import {
  Avatar,
  Box,
  Chip,
  CircularProgress,
  IconButton,
  InputAdornment,
  LinearProgress,
  Pagination,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  useTheme,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import Image from 'next/image';
import { useState } from 'react';
import ShiftPreviewModal from '../../dialogs/shift-preview';

const ShiftTableWithActions = () => {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const theme = useTheme();

  const { data, isLoading } = useQuery({
    queryKey: ['shifts', page, search],
    queryFn: () =>
      shiftService.getAllShifts({
        page,
        limit: 4,
      }),
  });
  const [selectedShiftId, setSelectedShiftId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const shifts = data?.shifts || [];
  const pagination = data?.pagination || { page: 1, pages: 1, total: 0 };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'assigned':
        return theme.palette.primary.main;
      case 'Inactivo':
        return theme.palette.grey[400];
      case 'En Progreso':
        return theme.palette.secondary.main;
      case 'available':
        return theme.palette.secondary.main;
      default:
        return theme.palette.grey[300];
    }
  };

  return (
    <Box>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        mb={2}
      >
        <Typography
          fontWeight="bold"
          fontSize={18}
        >
          Lista de Turnos ({pagination.total})
        </Typography>
        <TextField
          size="small"
          placeholder="Buscar impulsadora..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
            sx: {
              background: '#fff',
              borderRadius: 10,
              boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
            },
          }}
        />
      </Stack>

      {isLoading ? (
        <CircularProgress />
      ) : (
        <>
          <TableContainer sx={{ borderRadius: 4, background: '#f9f9f9' }}>
            <Table>
              <TableHead sx={{ backgroundColor: theme.palette.grey[200] }}>
                <TableRow>
                  <TableCell>Supermercados</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell>Horario</TableCell>
                  <TableCell>Impulsadora</TableCell>
                  <TableCell>Progreso</TableCell>
                  <TableCell>Pago</TableCell>
                  <TableCell align="center">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {shifts.map((shift) => (
                  <TableRow key={shift._id}>
                    <TableCell>
                      <Stack
                        direction="row"
                        alignItems="center"
                        gap={1}
                      >
                        <Image
                          src={shift.storeInfo?.image || '/placeholder-profile.png'}
                          alt={shift.supermarketName}
                          width={40}
                          height={40}
                          style={{ borderRadius: '50%' }}
                        />
                        <Box>
                          <Typography fontWeight="bold">{shift.storeInfo?.name}</Typography>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                          >
                            {shift.storeAddress}
                          </Typography>
                        </Box>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={shift.status || 'Sin estado'}
                        size="small"
                        sx={{
                          backgroundColor: getStatusColor(shift.status),
                          fontWeight: 600,
                          color: '#ffffff',
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography>{new Date(shift.date).toLocaleDateString()}</Typography>
                      <Typography variant="caption">
                        {new Date(shift.startTime).toLocaleTimeString()} -{' '}
                        {new Date(shift.endTime).toLocaleTimeString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {shift.promoterId ? (
                        <Stack
                          direction="row"
                          alignItems="center"
                          spacing={1}
                        >
                          <Avatar
                            src={shift.requestedBy.profileImage || '/placeholder-profile.png'}
                            alt={shift.promoterName}
                          />
                          <Typography>{shift.requestedBy.firstName || 'Sin asignar'}</Typography>
                        </Stack>
                      ) : (
                        <Chip
                          label="Sin asignar"
                          color="warning"
                          size="small"
                        />
                      )}
                    </TableCell>
                    <TableCell>
                      <Box>
                        <LinearProgress
                          variant="determinate"
                          value={(shift.totalParticipations / 1000) * 100}
                          sx={{
                            height: 8,
                            borderRadius: 4,
                            backgroundColor: '#ffe4f0',
                            '& .MuiLinearProgress-bar': {
                              backgroundColor: theme.palette.primary.main,
                            },
                          }}
                        />
                        <Typography variant="caption">{shift.totalParticipations}/200</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography fontWeight="bold">
                        ${shift.totalEarnings?.toFixed(2) || '0.00'}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Stack
                        direction="row"
                        spacing={1}
                        justifyContent="center"
                      >
                        <IconButton
                          color="primary"
                          onClick={() => {
                            console.log('log');

                            setSelectedShiftId(shift._id);
                            setModalOpen(true);
                          }}
                        >
                          <Visibility fontSize="small" />
                        </IconButton>
                        <IconButton color="secondary">
                          <Edit fontSize="small" />
                        </IconButton>
                        <IconButton color="error">
                          <Delete fontSize="small" />
                        </IconButton>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <Stack
            alignItems="center"
            mt={3}
          >
            <Pagination
              count={pagination.pages}
              page={page}
              onChange={(_, value) => setPage(value)}
              color="primary"
              shape="rounded"
            />
          </Stack>
        </>
      )}
      <ShiftPreviewModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        shiftId={selectedShiftId}
      />
    </Box>
  );
};

export default ShiftTableWithActions;
