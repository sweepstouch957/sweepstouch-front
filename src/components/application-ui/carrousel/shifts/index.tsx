'use client';

import {
  Avatar,
  Box,
  Card,
  CardContent,
  LinearProgress,
  Pagination,
  Stack,
  Typography,
} from '@mui/material';
import { useState } from 'react';

const fakeShifts = [
  {
    id: '1',
    supermarketName: 'Key Food Fresh Prospect Heights',
    address: '492 St Marks Ave, Brooklyn, NY 11238, USA',
    date: 'mié, 2 jul 2025',
    time: '08:00 - 12:00',
    promoterName: 'Valentina Ramírez',
    promoterAvatar: '/avatars/valentina.png',
    progress: 750,
    goal: 1000,
    payment: '$75',
    status: 'En Progreso',
  },
  {
    id: '2',
    supermarketName: 'Key Food Fresh Prospect Heights',
    address: '492 St Marks Ave, Brooklyn, NY 11238, USA',
    date: 'mié, 2 jul 2025',
    time: '08:00 - 12:00',
    promoterName: 'María Camila León',
    promoterAvatar: '/avatars/camila.png',
    progress: 500,
    goal: 1000,
    payment: '$50',
    status: 'Activo',
  },
  {
    id: '3',
    supermarketName: 'Key Food Fresh Prospect Heights',
    address: '492 St Marks Ave, Brooklyn, NY 11238, USA',
    date: 'mié, 2 jul 2025',
    time: '08:00 - 12:00',
    promoterName: 'María Manga',
    promoterAvatar: '/avatars/maria.png',
    progress: 350,
    goal: 1000,
    payment: '$50',
    status: 'Activo',
  },
  {
    id: '4',
    supermarketName: 'Key Food Fresh Prospect Heights',
    address: '492 St Marks Ave, Brooklyn, NY 11238, USA',
    date: 'mié, 2 jul 2025',
    time: '08:00 - 12:00',
    promoterName: 'Wendy Toala',
    promoterAvatar: '/avatars/wendy.png',
    progress: 250,
    goal: 1000,
    payment: '$50',
    status: 'Inactivo',
  },
];

const MobileShiftCarousel = () => {
  const [page, setPage] = useState(1);
  const perPage = 1;
  const totalPages = Math.ceil(fakeShifts.length / perPage);

  const shift = fakeShifts[page - 1];

  return (
    <Box>
      <Typography
        fontWeight="bold"
        mb={1}
      >
        Lista de Turnos ({fakeShifts.length})
      </Typography>

      <Card sx={{ borderRadius: 4 }}>
        <CardContent>
          <Box
            textAlign="center"
            mb={2}
          >
            <img
              src="/logo/keyfood.png"
              alt={shift.supermarketName}
              style={{ width: 120 }}
            />
            <Typography
              fontWeight={700}
              mt={1}
            >
              {shift.supermarketName}
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
            >
              {shift.address}
            </Typography>
          </Box>

          <Box>
            <Typography
              variant="caption"
              fontWeight="bold"
            >
              HORARIO
            </Typography>
            <Typography
              variant="body2"
              mb={1}
            >
              {shift.date} / {shift.time}
            </Typography>

            <Typography
              variant="caption"
              fontWeight="bold"
            >
              IMPULSADORA
            </Typography>
            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
              mb={1}
            >
              <Avatar src={shift.promoterAvatar} />
              <Typography variant="body2">{shift.promoterName}</Typography>
            </Stack>

            <Typography
              variant="caption"
              fontWeight="bold"
            >
              PROGRESO
            </Typography>
            <Box>
              <LinearProgress
                variant="determinate"
                value={(shift.progress / shift.goal) * 100}
                sx={{
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: '#ffe4f0',
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: '#ff0080',
                  },
                }}
              />
              <Typography variant="caption">
                {shift.progress}/{shift.goal}
              </Typography>
            </Box>

            <Typography
              variant="caption"
              fontWeight="bold"
              mt={1}
            >
              PAGO
            </Typography>
            <Typography
              variant="body2"
              fontWeight="bold"
            >
              {shift.payment}
            </Typography>
          </Box>
        </CardContent>
      </Card>

      <Stack
        direction="row"
        justifyContent="center"
        mt={2}
      >
        <Pagination
          count={totalPages}
          page={page}
          onChange={(e, value) => setPage(value)}
          shape="rounded"
          size="small"
        />
      </Stack>
    </Box>
  );
};

export default MobileShiftCarousel;
