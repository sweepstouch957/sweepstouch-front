'use client';

import CloseIcon from '@mui/icons-material/Close';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import PhotoIcon from '@mui/icons-material/Photo';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import VisibilityIcon from '@mui/icons-material/Visibility';
import {
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
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
  Tooltip,
  Typography,
} from '@mui/material';
import { useMemo, useState } from 'react';

type Promoter = {
  _id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string;
  countryCode?: string;
  status?: string; // active/pending
  role?: string; // promotor
  active?: boolean;
  rating?: number;
  profileImage?: string;
  totalShifts?: number;
  totalRegistrations?: number;
  totalParticipations?: number;
  newUsersRegistered?: number;
  existingUsersRegistered?: number;
  totalHoursWorked?: number;
  totalAccumulatedMoney?: number;
  participationEarnings?: number;
  shiftEarnings?: number;
  lastLogin?: string;
  createdAt?: string;
  store?: { zipCode?: string };
  generalInfo?: {
    lastLogin?: string;
    createdAt?: string;
    status?: string;
  };
};

const fmtMoney = (n?: number) => (typeof n === 'number' ? `$${n.toFixed(2)}` : '$0.00');

const fmtInt = (n?: number) => (typeof n === 'number' ? n.toLocaleString() : '0');

const fmtDate = (iso?: string) => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleString();
};

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
  promoters: Promoter[];
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
  const [selected, setSelected] = useState<Promoter | null>(null);
  const [openDetails, setOpenDetails] = useState(false);
  const [openPhoto, setOpenPhoto] = useState(false);

  const filteredPromoters = useMemo(() => {
    const q = search.toLowerCase();
    return promoters.filter((p) =>
      `${p.firstName ?? ''} ${p.lastName ?? ''} ${p.email ?? ''}`.toLowerCase().includes(q)
    );
  }, [search, promoters]);

  const handleChangePage = (_: unknown, newPage: number) => setPage(newPage);
  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleOpenDetails = (p: Promoter) => {
    setSelected(p);
    setOpenDetails(true);
  };

  const handleOpenPhoto = (p?: Promoter | null) => {
    if (p) setSelected(p);
    setOpenPhoto(true);
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
              <TableCell align="right">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredPromoters
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((p) => (
                <TableRow
                  key={p._id}
                  hover
                >
                  <TableCell>
                    <Stack
                      direction="row"
                      spacing={2}
                      alignItems="center"
                    >
                      <Tooltip title="Ver foto">
                        <Avatar
                          src={p?.profileImage || '/placeholder-profile.png'}
                          sx={{ cursor: 'pointer' }}
                          onClick={() => handleOpenPhoto(p)}
                        />
                      </Tooltip>
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
                        <Typography variant="body2">{p.email || '—'}</Typography>
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
                          {p.countryCode || ''} {p.phoneNumber || '—'}
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
                  <TableCell>{fmtInt(p.totalShifts)}</TableCell>
                  <TableCell>{fmtInt(p.totalRegistrations)}</TableCell>
                  <TableCell>{typeof p.rating === 'number' ? p.rating.toFixed(1) : '—'}</TableCell>
                  <TableCell>{fmtMoney(p.totalAccumulatedMoney)}</TableCell>
                  <TableCell align="right">
                    <Stack
                      direction="row"
                      spacing={1}
                      justifyContent="flex-end"
                    >
                      <Tooltip title="Ver foto">
                        <IconButton
                          size="small"
                          onClick={() => handleOpenPhoto(p)}
                        >
                          <PhotoIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <IconButton
                        size="small"
                        onClick={() => handleOpenDetails(p)}
                      >
                        <VisibilityIcon fontSize="small" />
                      </IconButton>
                    </Stack>
                  </TableCell>
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
          rowsPerPageOptions={[5, 10, 25]}
        />
      </TableContainer>

      {/* Modal Detalles */}
      <Dialog
        open={openDetails}
        onClose={() => setOpenDetails(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle>
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
          >
            <Typography fontWeight={700}>Detalles de la promotora</Typography>
            <IconButton onClick={() => setOpenDetails(false)}>
              <CloseIcon />
            </IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent dividers>
          {selected ? (
            <Stack spacing={3}>
              <Stack
                direction="row"
                spacing={2}
                alignItems="center"
              >
                <Avatar
                  src={selected.profileImage || '/placeholder-profile.png'}
                  sx={{ width: 72, height: 72, cursor: 'pointer' }}
                  onClick={() => handleOpenPhoto(selected)}
                />
                <Box>
                  <Stack
                    direction="row"
                    spacing={1}
                    alignItems="center"
                    flexWrap="wrap"
                  >
                    <Typography
                      variant="h6"
                      fontWeight={700}
                    >
                      {selected.firstName} {selected.lastName}
                    </Typography>
                    <Chip
                      size="small"
                      label={selected.active ? 'Activa' : 'Inactiva'}
                      color={selected.active ? 'primary' : 'default'}
                    />
                    {selected.status && (
                      <Chip
                        size="small"
                        label={`Status: ${selected.status}`}
                        variant="outlined"
                      />
                    )}
                    {typeof selected.rating === 'number' && (
                      <Chip
                        size="small"
                        label={`⭐ ${selected.rating.toFixed(1)}`}
                      />
                    )}
                  </Stack>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                  >
                    ID: {selected._id}
                  </Typography>
                </Box>
              </Stack>

              <Divider />

              <Grid
                container
                spacing={2}
              >
                {/* Contacto */}
                <Grid
                  item
                  xs={12}
                  md={6}
                >
                  <Typography
                    variant="subtitle2"
                    color="text.secondary"
                    gutterBottom
                  >
                    Contacto
                  </Typography>
                  <Stack spacing={1.2}>
                    <Stack
                      direction="row"
                      spacing={1}
                      alignItems="center"
                    >
                      <EmailIcon
                        fontSize="small"
                        color="disabled"
                      />
                      <Typography>{selected.email || '—'}</Typography>
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
                      <Typography>
                        {selected.countryCode || ''} {selected.phoneNumber || '—'}
                      </Typography>
                    </Stack>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                    >
                      Creada: {fmtDate(selected.createdAt || selected.generalInfo?.createdAt)}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                    >
                      Último login: {fmtDate(selected.lastLogin || selected.generalInfo?.lastLogin)}
                    </Typography>
                  </Stack>
                </Grid>

                {/* Métricas */}
                <Grid
                  item
                  xs={12}
                  md={6}
                >
                  <Typography
                    variant="subtitle2"
                    color="text.secondary"
                    gutterBottom
                  >
                    Métricas
                  </Typography>
                  <Grid
                    container
                    spacing={1.2}
                  >
                    <Grid
                      item
                      xs={6}
                    >
                      <Typography
                        variant="body2"
                        color="text.secondary"
                      >
                        Turnos
                      </Typography>
                      <Typography fontWeight={700}>{fmtInt(selected.totalShifts)}</Typography>
                    </Grid>
                    <Grid
                      item
                      xs={6}
                    >
                      <Typography
                        variant="body2"
                        color="text.secondary"
                      >
                        Horas trabajadas
                      </Typography>
                      <Typography fontWeight={700}>{fmtInt(selected.totalHoursWorked)}</Typography>
                    </Grid>
                    <Grid
                      item
                      xs={6}
                    >
                      <Typography
                        variant="body2"
                        color="text.secondary"
                      >
                        Participaciones totales
                      </Typography>
                      <Typography fontWeight={700}>
                        {fmtInt(selected.totalParticipations)}
                      </Typography>
                    </Grid>
                    <Grid
                      item
                      xs={6}
                    >
                      <Typography
                        variant="body2"
                        color="text.secondary"
                      >
                        Registros
                      </Typography>
                      <Typography fontWeight={700}>
                        {fmtInt(selected.totalRegistrations)}
                      </Typography>
                    </Grid>
                    <Grid
                      item
                      xs={6}
                    >
                      <Typography
                        variant="body2"
                        color="text.secondary"
                      >
                        Números nuevos
                      </Typography>
                      <Typography fontWeight={700}>
                        {fmtInt(selected.newUsersRegistered)}
                      </Typography>
                    </Grid>
                    <Grid
                      item
                      xs={6}
                    >
                      <Typography
                        variant="body2"
                        color="text.secondary"
                      >
                        Números existentes
                      </Typography>
                      <Typography fontWeight={700}>
                        {fmtInt(selected.existingUsersRegistered)}
                      </Typography>
                    </Grid>
                    <Grid
                      item
                      xs={6}
                    >
                      <Typography
                        variant="body2"
                        color="text.secondary"
                      >
                        Ganancias totales
                      </Typography>
                      <Typography fontWeight={700}>
                        {fmtMoney(selected.totalAccumulatedMoney)}
                      </Typography>
                    </Grid>
                    <Grid
                      item
                      xs={6}
                    >
                      <Typography
                        variant="body2"
                        color="text.secondary"
                      >
                        Ganancias por turno
                      </Typography>
                      <Typography fontWeight={700}>{fmtMoney(selected.shiftEarnings)}</Typography>
                    </Grid>
                    <Grid
                      item
                      xs={6}
                    >
                      <Typography
                        variant="body2"
                        color="text.secondary"
                      >
                        Ganancias por participación
                      </Typography>
                      <Typography fontWeight={700}>
                        {fmtMoney(selected.participationEarnings)}
                      </Typography>
                    </Grid>
                  </Grid>
                </Grid>
              </Grid>
            </Stack>
          ) : (
            <Typography>Sin datos.</Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button
            variant="outlined"
            onClick={() => refetch()}
          >
            Refrescar
          </Button>
          <Button
            variant="contained"
            onClick={() => setOpenDetails(false)}
          >
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal Foto */}
      <Dialog
        open={openPhoto}
        onClose={() => setOpenPhoto(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle>
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
          >
            <Typography fontWeight={700}>Foto de la promotora</Typography>
            <IconButton onClick={() => setOpenPhoto(false)}>
              <CloseIcon />
            </IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent dividers>
          <Stack alignItems="center">
            <Avatar
              src={selected?.profileImage || '/placeholder-profile.png'}
              sx={{ width: { xs: 280, sm: 360 }, height: { xs: 280, sm: 360 } }}
              variant="rounded"
            />
            <Typography
              mt={2}
              fontWeight={600}
              textAlign="center"
            >
              {selected?.firstName} {selected?.lastName}
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              textAlign="center"
            >
              {selected?.email || '—'}
            </Typography>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button
            variant="contained"
            onClick={() => setOpenPhoto(false)}
          >
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PromoterTable;
