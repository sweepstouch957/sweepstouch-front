// components/PromoterTable.tsx
'use client';

import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import {
  alpha,
  Avatar,
  Box,
  Chip,
  InputAdornment,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { useState } from 'react';

const allPromoters = [
  {
    name: 'Valentina Ramírez',
    location: 'Brooklyn, NY',
    email: 'maria.gonzalez@email.com',
    phone: '+1 (555) 123-4567',
    status: 'Activa',
    shifts: 45,
    registrations: 2850,
    rating: 4.9,
    earnings: '$3,375',
  },
  {
    name: 'Maria Camila Leon',
    location: 'Brooklyn, NY',
    email: 'maria.gonzalez@email.com',
    phone: '+1 (555) 123-4567',
    status: 'Activa',
    shifts: 38,
    registrations: 2420,
    rating: 4.8,
    earnings: '$2,850',
  },
  {
    name: 'Maria Manga',
    location: 'Brooklyn, NY',
    email: 'maria.gonzalez@email.com',
    phone: '+1 (555) 123-4567',
    status: 'Activa',
    shifts: 31,
    registrations: 1540,
    rating: 4.7,
    earnings: '$1,650',
  },
  {
    name: 'Wendy Toala',
    location: 'Brooklyn, NY',
    email: 'maria.gonzalez@email.com',
    phone: '+1 (555) 123-4567',
    status: 'Inactiva',
    shifts: 22,
    registrations: 1980,
    rating: 4.6,
    earnings: '$1,350',
  },
];

const PromoterTable = () => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(2);
  const [search, setSearch] = useState('');

  const filteredPromoters = allPromoters.filter((p) =>
    `${p.name} ${p.email}`.toLowerCase().includes(search.toLowerCase())
  );

  const handleChangePage = (_: unknown, newPage: number) => setPage(newPage);
  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
    <Box>
      <TextField
        placeholder="Buscar por nombre o email"
        size="small"
        variant="outlined"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchOutlinedIcon color="disabled" />
            </InputAdornment>
          ),
        }}
        sx={{
          mb: 2,
          backgroundColor: (theme) => alpha(theme.palette.grey[100], 0.7),
          borderRadius: 10,
          '& fieldset': {
            border: 'none',
          },
          input: {
            px: 0.5,
          },
        }}
      />

      <Typography
        variant="h6"
        fontWeight={700}
        gutterBottom
      >
        Lista de Impulsadoras ({filteredPromoters.length})
      </Typography>

      <TableContainer
        component={Paper}
        elevation={1}
        sx={{ borderRadius: 4 }}
      >
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Impulsadoras</TableCell>
              <TableCell>Contacto</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell>Turnos</TableCell>
              <TableCell>Registros</TableCell>
              <TableCell>Rating</TableCell>
              <TableCell>Ganancias</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredPromoters
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((p, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <Stack
                      direction="row"
                      spacing={2}
                      alignItems="center"
                    >
                      <Avatar
                        src="/placeholder-profile.png"
                        alt={p.name}
                      />
                      <Box>
                        <Typography fontWeight={600}>{p.name}</Typography>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                        >
                          {p.location}
                        </Typography>
                      </Box>
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Stack spacing={0.5}>
                      <Stack
                        direction="row"
                        spacing={1}
                        alignItems="center"
                      >
                        <EmailIcon
                          fontSize="small"
                          color="disabled"
                        />
                        <Typography variant="body2">{p.email}</Typography>
                      </Stack>
                      <Stack
                        direction="row"
                        spacing={1}
                        alignItems="center"
                      >
                        <PhoneIcon
                          fontSize="small"
                          color="disabled"
                        />
                        <Typography variant="body2">{p.phone}</Typography>
                      </Stack>
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={p.status}
                      color={p.status === 'Activa' ? 'primary' : 'default'}
                      variant="filled"
                      sx={{ fontWeight: 600 }}
                    />
                  </TableCell>
                  <TableCell>{p.shifts}</TableCell>
                  <TableCell>{p.registrations.toLocaleString()}</TableCell>
                  <TableCell>{p.rating}</TableCell>
                  <TableCell>{p.earnings}</TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          count={filteredPromoters.length}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[2, 4, 6]}
        />
      </TableContainer>
    </Box>
  );
};

export default PromoterTable;
