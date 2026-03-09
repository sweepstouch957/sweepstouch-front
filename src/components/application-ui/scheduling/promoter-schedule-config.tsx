'use client';
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import {
    Box,
    Card,
    Grid,
    Button,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    IconButton,
    Chip,
    Divider,
    Stack,
    Paper
} from '@mui/material';
import DeleteTwoToneIcon from '@mui/icons-material/DeleteTwoTone';
import AddTwoToneIcon from '@mui/icons-material/AddTwoTone';
import EditTwoToneIcon from '@mui/icons-material/EditTwoTone';
import SaveTwoToneIcon from '@mui/icons-material/SaveTwoTone';
import CloseTwoToneIcon from '@mui/icons-material/CloseTwoTone';
import EventAvailableTwoToneIcon from '@mui/icons-material/EventAvailableTwoTone';
import toast from 'react-hot-toast';
import schedulingService, { CreateSlotPayload } from 'src/services/scheduling.service';
import { useAuth } from 'src/hooks/use-auth';
import dayjs, { Dayjs } from 'dayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';

interface FormValues {
    date: Dayjs | null;
    time: Dayjs | null;
}

const PromoterScheduleConfig = () => {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [editingSlotId, setEditingSlotId] = useState<string | null>(null);

    const { control, handleSubmit, reset } = useForm<FormValues>({
        defaultValues: {
            date: dayjs(),
            time: dayjs().set('hour', 9).set('minute', 0),
        }
    });

    const { data: slots = [], isLoading } = useQuery({
        queryKey: ['slots', user?._id],
        queryFn: () => schedulingService.getSlots({ agentId: user?._id }),
        enabled: !!user?._id
    });

    const createSlotMutation = useMutation({
        mutationFn: (data: CreateSlotPayload) => schedulingService.createSlot({ ...data }),
        onSuccess: () => {
            toast.success('Horario disponible añadido exitosamente');
            queryClient.invalidateQueries({ queryKey: ['slots'] });
            reset({
                date: dayjs(),
                time: dayjs().set('hour', 9).set('minute', 0),
            });
        },
        onError: (err: any) => {
            toast.error(err?.response?.data?.error || 'Error al crear horario');
        }
    });

    const updateSlotMutation = useMutation({
        mutationFn: (data: { id: string, payload: Partial<CreateSlotPayload> }) => schedulingService.updateSlot(data.id, data.payload),
        onSuccess: () => {
            toast.success('Horario actualizado exitosamente');
            queryClient.invalidateQueries({ queryKey: ['slots'] });
            setEditingSlotId(null);
            reset({
                date: dayjs(),
                time: dayjs().set('hour', 9).set('minute', 0),
            });
        },
        onError: (err: any) => {
            toast.error(err?.response?.data?.error || 'Error al actualizar horario');
        }
    });

    const deleteSlotMutation = useMutation({
        mutationFn: (id: string) => schedulingService.deleteSlot(id),
        onSuccess: () => {
            toast.success('Horario eliminado de la disponibilidad');
            queryClient.invalidateQueries({ queryKey: ['slots'] });
            if (editingSlotId) {
                handleCancelEdit();
            }
        }
    });

    const handleEdit = (slot: any) => {
        const rawDate = slot.date.split('T')[0];
        setEditingSlotId(slot._id);
        reset({
            date: dayjs(rawDate),
            time: dayjs(`${rawDate}T${slot.time}`)
        });
    };

    const handleCancelEdit = () => {
        setEditingSlotId(null);
        reset({
            date: dayjs(),
            time: dayjs().set('hour', 9).set('minute', 0),
        });
    };

    const onSubmit = (data: FormValues) => {
        if (!data.date || !data.time) return;

        const payload: CreateSlotPayload = {
            date: data.date.format('YYYY-MM-DD'),
            time: data.time.format('HH:mm'),
            agentId: user?._id || '',
            agentEmail: user?.email || '',
            agentName: `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || user?.name || ''
        };

        if (editingSlotId) {
            updateSlotMutation.mutate({ id: editingSlotId, payload });
        } else {
            createSlotMutation.mutate(payload);
        }
    };

    const slotsArray = Array.isArray(slots) ? slots : [];

    return (
        <LocalizationProvider dateAdapter={AdapterDayjs}>
            <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                        <Box p={3} sx={{ bgcolor: 'primary.main', color: 'primary.contrastText' }}>
                            <Typography variant="h5" fontWeight="600" display="flex" alignItems="center" gap={1}>
                                <EventAvailableTwoToneIcon />
                                {editingSlotId ? 'Editar Disponibilidad' : 'Configurar Disponibilidad'}
                            </Typography>
                            <Typography variant="body2" sx={{ opacity: 0.8, mt: 1 }}>
                                {editingSlotId ? 'Modifica los datos del slot seleccionado y guarda los cambios.' : 'Define qué días y horas estás disponible para recibir citas de interesados.'}
                            </Typography>
                        </Box>
                        <Divider />
                        <Box p={3} flex={1}>
                            <form onSubmit={handleSubmit(onSubmit)}>
                                <Stack spacing={3}>
                                    <Controller
                                        name="date"
                                        control={control}
                                        rules={{ required: 'La fecha es obligatoria' }}
                                        render={({ field, fieldState }) => (
                                            <DatePicker
                                                label="Fecha Disponible"
                                                value={field.value}
                                                onChange={(newValue) => field.onChange(newValue)}
                                                format="DD/MM/YYYY"
                                                disablePast
                                                slotProps={{
                                                    textField: {
                                                        fullWidth: true,
                                                        error: !!fieldState.error,
                                                        helperText: fieldState.error?.message,
                                                    }
                                                }}
                                            />
                                        )}
                                    />

                                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                                        <Controller
                                            name="time"
                                            control={control}
                                            rules={{ required: 'Hora obligatoria' }}
                                            render={({ field, fieldState }) => (
                                                <TimePicker
                                                    label="Hora del Turno"
                                                    value={field.value}
                                                    onChange={(newValue) => field.onChange(newValue)}
                                                    slotProps={{
                                                        textField: {
                                                            fullWidth: true,
                                                            error: !!fieldState.error,
                                                            helperText: fieldState.error?.message,
                                                        }
                                                    }}
                                                />
                                            )}
                                        />
                                    </Stack>

                                    <Stack direction="row" spacing={2} mt={2}>
                                        <Button
                                            type="submit"
                                            variant="contained"
                                            size="large"
                                            startIcon={editingSlotId ? <SaveTwoToneIcon /> : <AddTwoToneIcon />}
                                            disabled={createSlotMutation.isPending || updateSlotMutation.isPending}
                                            fullWidth
                                            sx={{
                                                py: 1.5,
                                                boxShadow: 'none',
                                                '&:hover': { boxShadow: 'none' }
                                            }}
                                        >
                                            {editingSlotId ? 'Guardar' : 'Añadir'}
                                        </Button>

                                        {editingSlotId && (
                                            <Button
                                                variant="outlined"
                                                color="inherit"
                                                size="large"
                                                onClick={handleCancelEdit}
                                                startIcon={<CloseTwoToneIcon />}
                                                sx={{ py: 1.5 }}
                                            >
                                                Cancelar
                                            </Button>
                                        )}
                                    </Stack>
                                </Stack>
                            </form>
                        </Box>
                    </Card>
                </Grid>

                <Grid item xs={12} md={8}>
                    <Card sx={{ height: '100%' }}>
                        <Box p={3} display="flex" alignItems="center" justifyContent="space-between">
                            <Box>
                                <Typography variant="h5" fontWeight="600" gutterBottom>
                                    Mis Horarios
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Tabla con todos tus turnos disponibles y las reservas activas.
                                </Typography>
                            </Box>
                            <Chip
                                label={`${slotsArray.length} Registrados`}
                                color="primary"
                                variant="outlined"
                            />
                        </Box>
                        <Divider />

                        {slotsArray.length === 0 && !isLoading ? (
                            <Box p={5} textAlign="center">
                                <Typography variant="h6" color="text.secondary" gutterBottom>
                                    Aún no has configurado disponibilidad
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Utiliza el panel de la izquierda para agregar tus horarios de atención.
                                </Typography>
                            </Box>
                        ) : (
                            <Paper elevation={0} sx={{ overflow: 'hidden' }}>
                                <Table>
                                    <TableHead sx={{ bgcolor: 'background.default' }}>
                                        <TableRow>
                                            <TableCell sx={{ fontWeight: 600 }}>Fecha</TableCell>
                                            <TableCell sx={{ fontWeight: 600 }}>Horario</TableCell>
                                            <TableCell sx={{ fontWeight: 600 }}>Estado</TableCell>
                                            <TableCell align="right" sx={{ fontWeight: 600 }}>Acciones</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {slotsArray.map((slot) => (
                                            <TableRow key={slot._id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                                <TableCell>{dayjs(slot.date.split('T')[0]).format('DD MMM, YYYY')}</TableCell>
                                                <TableCell>
                                                    <Typography variant="body2" fontWeight="500">
                                                        {slot.time}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell>
                                                    {!slot.available ? (
                                                        <Chip
                                                            label="Reservado"
                                                            color="error"
                                                            size="small"
                                                            sx={{ fontWeight: 'bold' }}
                                                        />
                                                    ) : (
                                                        <Chip
                                                            label="Libre"
                                                            color="success"
                                                            size="small"
                                                            sx={{ fontWeight: 'bold' }}
                                                        />
                                                    )}
                                                </TableCell>
                                                <TableCell align="right">
                                                    <IconButton
                                                        color="primary"
                                                        disabled={!slot.available}
                                                        onClick={() => handleEdit(slot)}
                                                        size="small"
                                                        title={!slot.available ? 'No se puede editar un horario reservado' : 'Editar disponibilidad'}
                                                        sx={{ mr: 1 }}
                                                    >
                                                        <EditTwoToneIcon fontSize="small" />
                                                    </IconButton>
                                                    <IconButton
                                                        color="error"
                                                        disabled={!slot.available}
                                                        onClick={() => deleteSlotMutation.mutate(slot._id)}
                                                        size="small"
                                                        title={!slot.available ? 'No se puede eliminar un horario reservado' : 'Eliminar disponibilidad'}
                                                    >
                                                        <DeleteTwoToneIcon fontSize="small" />
                                                    </IconButton>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </Paper>
                        )}
                    </Card>
                </Grid>
            </Grid>
        </LocalizationProvider>
    );
};

export default PromoterScheduleConfig;
