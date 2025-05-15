'use client';

import { Customer } from '@/models/customer';
import { getStoreById, getStoreCustomers, Store } from '@/services/store.service';
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';

export default function EditStorePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [store, setStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCustomers, setTotalCustomers] = useState(0);

  const {
    register,
    reset,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<Store>();

  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      try {
        const storeData = await getStoreById(id as string);
        setStore(storeData);
        reset(storeData); // set default values
        const customerData = await getStoreCustomers(id as string, 1, rowsPerPage);
        setCustomers(customerData.data);
        setTotalCustomers(customerData.total);
      } catch (err) {
        console.error('Error cargando datos de la tienda:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, rowsPerPage, reset]);

  useEffect(() => {
    if (!id) return;

    getStoreCustomers(id as string, page + 1, rowsPerPage).then((res) => {
      setCustomers(res.data);
      setTotalCustomers(res.total);
    });
  }, [page, id, rowsPerPage]);

  const onSubmit = async (data: Store) => {
    // Aquí podés llamar a tu servicio de actualización cuando lo tengas listo
  };

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="60vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!store) {
    return <Typography variant="h6">Tienda no encontrada</Typography>;
  }

  return (
    <Box
      p={2}
      maxWidth="1000px"
      mx="auto"
    >
      {/* Encabezado */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
        flexWrap="wrap"
        gap={2}
      >
        <Box
          display="flex"
          alignItems="center"
          gap={2}
        >
          <Avatar
            src={store.image !== 'no-image.jpg' ? store.image : undefined}
            alt={store.name}
            sx={{
              width: 80,
              height: 80,
              borderRadius: 2,
              border: '1px solid #e0e0e0',
              backgroundColor: '#fafafa',
              objectFit: 'cover',
            }}
            variant="rounded"
          />
          <Box>
            <Typography
              variant="h5"
              fontWeight={600}
            >
              {store.name}
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
            >
              {store.address}
            </Typography>
          </Box>
        </Box>
        <Box
          display="flex"
          gap={1}
        >
          <Button
            variant="outlined"
            onClick={() => router.back()}
          >
            Volver
          </Button>
          <Button
            variant="contained"
            type="submit"
            form="edit-store-form"
            disabled={isSubmitting}
          >
            Guardar Cambios
          </Button>
        </Box>
      </Box>

      {/* Formulario editable */}
      <form
        id="edit-store-form"
        onSubmit={handleSubmit(onSubmit)}
      >
        <Card sx={{ mb: 4 }}>
          <CardContent>
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
                  label="Nombre"
                  fullWidth
                  {...register('name')}
                />
              </Grid>
              <Grid
                item
                xs={12}
                sm={6}
              >
                <TextField
                  label="Dirección"
                  fullWidth
                  {...register('address')}
                />
              </Grid>
              <Grid
                item
                xs={12}
                sm={6}
              >
                <TextField
                  label="Código Postal"
                  fullWidth
                  {...register('zipCode')}
                />
              </Grid>
              <Grid
                item
                xs={12}
              >
                <TextField
                  label="Descripción"
                  fullWidth
                  multiline
                  minRows={2}
                  {...register('description')}
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </form>

      {/* Tabla de clientes */}
      <Typography
        variant="h6"
        fontWeight={600}
        mb={2}
      >
        Clientes de la Tienda
      </Typography>

      <Paper elevation={2}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Nombre</TableCell>
              <TableCell>Teléfono</TableCell>
              <TableCell>Activo</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {customers.map((customer) => (
              <TableRow key={customer._id}>
                <TableCell>
                  {customer.firstName} {customer.lastName}
                </TableCell>
                <TableCell>{customer.phoneNumber}</TableCell>
                <TableCell>{customer.active ? 'Sí' : 'No'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <TablePagination
          component="div"
          count={totalCustomers}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          rowsPerPageOptions={[10, 25, 50, 100]}
        />
      </Paper>
    </Box>
  );
}
