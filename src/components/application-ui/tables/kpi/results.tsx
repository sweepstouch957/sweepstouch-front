'use client';

import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import {
  Avatar,
  Box,
  Chip,
  CircularProgress,
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
import { useMemo } from 'react';

const PromoterTable = ({
  promoters,
  isLoading,
  isError,
  refetch,
  search,
  setSearch,
  page,
  setPage,
  rowsPerPage,
  setRowsPerPage,
}: {
  promoters: any[];
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
  search: string;
  setSearch: (value: string) => void;
  page: number;
  setPage: (value: number) => void;
  rowsPerPage: number;
  setRowsPerPage: (value: number) => void;
}) => {
  const filteredPromoters = useMemo(() => {
    return promoters.filter((p) =>
      `${p.firstName} ${p.lastName} ${p.email}`.toLowerCase().includes(search.toLowerCase())
    );
  }, [search, promoters]);

  const handleChangePage = (_: unknown, newPage: number) => setPage(newPage);
  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  if (isLoading) {
    return (
      <Stack
        alignItems="center"
        py={4}
      >
        <CircularProgress />
      </Stack>
    );
  }

  if (isError) {
    return (
      <Typography
        color="error"
        textAlign="center"
        py={4}
      >
        Error al cargar las impulsadoras.
      </Typography>
    );
  }

  return (
    <Box>
      <Stack
        spacing={2}
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        alignItems="center"
        sx={{ mb: 2 }}
      >
        <Typography
          variant="h6"
          fontWeight={700}
        >
          Lista de Impulsadoras ({filteredPromoters.length})
        </Typography>

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
            backgroundColor: (theme) => theme.palette.grey[100],
            borderRadius: 10,
            '& fieldset': { border: 'none' },
            input: { px: 0.5 },
          }}
        />
      </Stack>

      <TableContainer
        component={Paper}
        elevation={1}
        sx={{ borderRadius: 4 }}
      >
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Impulsadora</TableCell>
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
              .map((p) => (
                <TableRow key={p._id}>
                  <TableCell>
                    <Stack
                      direction="row"
                      spacing={2}
                      alignItems="center"
                    >
                      <Avatar src={p?.profileImage || '/placeholder-profile.png'} />
                      <Box>
                        <Typography fontWeight={600}>
                          {p.firstName} {p.lastName}
                        </Typography>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                        >
                          {p.store?.zipCode || 'N/A'}
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
                        <Typography variant="body2">
                          {p.countryCode} {p.phoneNumber}
                        </Typography>
                      </Stack>
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={p.active ? 'Activa' : 'Inactiva'}
                      color={p.active ? 'primary' : 'default'}
                      sx={{ fontWeight: 600 }}
                    />
                  </TableCell>
                  <TableCell>{p.totalShifts || 0}</TableCell>
                  <TableCell>{p.totalRegistrations?.toLocaleString() || 0}</TableCell>
                  <TableCell>{p.rating?.toFixed(1) || '-'}</TableCell>
                  <TableCell>${p.totalAccumulatedMoney?.toFixed(2) || '0.00'}</TableCell>
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
