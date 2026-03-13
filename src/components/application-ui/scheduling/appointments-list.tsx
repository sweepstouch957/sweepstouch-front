'use client';
import React, { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Box,
    Card,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    TableContainer,
    Typography,
    Chip,
    CircularProgress,
    Button,
    Tabs,
    Tab,
    Paper,
    Divider,
    Stack,
    SwipeableDrawer,
    useTheme,
    alpha,
    darken,
    IconButton,
    Grid,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    DialogContentText,
    ToggleButtonGroup,
    ToggleButton,
    MenuItem,
    Select,
    FormControl,
    InputLabel
} from '@mui/material';
import { format, isPast, isToday, addMinutes } from 'date-fns';
import { es } from 'date-fns/locale';
import schedulingService, { CreateSlotPayload } from 'src/services/scheduling.service';
import storesService from 'src/services/store.service';
import { useAuth } from 'src/hooks/use-auth';
import FullCalendar from '@fullcalendar/react';
import interactionPlugin from '@fullcalendar/interaction';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import { FullCalendarWrapper } from 'src/components/base/styles/calendar';
import EventDrawer from './event-drawer';
import Actions from '../content-shells/calendar/actions';
import { View } from 'src/models/calendar';
import toast from 'react-hot-toast';

import CheckCircleTwoToneIcon from '@mui/icons-material/CheckCircleTwoTone';
import PendingActionsTwoToneIcon from '@mui/icons-material/PendingActionsTwoTone';
import DeleteTwoToneIcon from '@mui/icons-material/DeleteTwoTone';
import EventAvailableTwoToneIcon from '@mui/icons-material/EventAvailableTwoTone';
import AccessTimeTwoToneIcon from '@mui/icons-material/AccessTimeTwoTone';

type StatusFilter = 'all' | 'confirmed' | 'pending';

interface SlotDialogState {
    open: boolean;
    date: string;
    time: string;
    durationMinutes: number;
}

interface DeleteDialogState {
    open: boolean;
    slotId: string | null;
}

const DURATION_OPTIONS = [
    { value: 30, label: '30 min' },
    { value: 60, label: '1 hora' },
    { value: 90, label: '1h 30min' },
    { value: 120, label: '2 horas' },
];

const AppointmentsList = () => {
    const { user } = useAuth();
    const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState<any>(null);
    const theme = useTheme();

    const calendarRef = useRef<FullCalendar | null>(null);
    const [calendarDate, setCalendarDate] = useState<Date>(new Date());
    const [calendarView, setCalendarView] = useState<View>('timeGridWeek');

    // --- Dialog state ---
    const [slotDialog, setSlotDialog] = useState<SlotDialogState>({
        open: false,
        date: '',
        time: '',
        durationMinutes: 60,
    });
    const [deleteDialog, setDeleteDialog] = useState<DeleteDialogState>({
        open: false,
        slotId: null,
    });

    const queryClient = useQueryClient();

    const createSlotMutation = useMutation({
        mutationFn: (data: CreateSlotPayload) => schedulingService.createSlot(data),
        onSuccess: () => {
            toast.success('Horario disponible añadido');
            queryClient.invalidateQueries({ queryKey: ['slots'] });
        },
        onError: (err: any) => {
            toast.error(err?.response?.data?.error || 'Error al crear horario');
        }
    });

    const deleteSlotMutation = useMutation({
        mutationFn: (id: string) => schedulingService.deleteSlot(id),
        onSuccess: () => {
            toast.success('Horario eliminado');
            queryClient.invalidateQueries({ queryKey: ['slots'] });
        },
        onError: (err: any) => {
            toast.error(err?.response?.data?.error || 'Error al eliminar horario');
        }
    });

    const handleEventClick = (eventData: any) => {
        if (eventData.id?.startsWith('slot-')) {
            const slotId = eventData.id.replace('slot-', '');
            const slot = slots.find((s: any) => s._id === slotId);
            if (slot && slot.available) {
                setDeleteDialog({ open: true, slotId });
            } else if (slot && !slot.available) {
                toast.error('No se puede eliminar un horario ya reservado');
            }
            return;
        }

        setSelectedEvent(eventData);
        setDrawerOpen(true);
    };

    const handleSelect = (selectionInfo: any) => {
        const { start } = selectionInfo;

        if (isPast(start) && !isToday(start)) {
            toast.error('No puedes crear horarios en el pasado');
            return;
        }

        setSlotDialog({
            open: true,
            date: format(start, 'yyyy-MM-dd'),
            time: format(start, 'HH:mm'),
            durationMinutes: 60,
        });
    };

    const handleConfirmCreateSlot = () => {
        const payload: CreateSlotPayload = {
            date: slotDialog.date,
            time: slotDialog.time,
            agentId: user?._id || '',
            agentEmail: user?.email || '',
            agentName: `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || user?.name || ''
        };
        createSlotMutation.mutate(payload);
        setSlotDialog(prev => ({ ...prev, open: false }));
    };

    const handleConfirmDeleteSlot = () => {
        if (deleteDialog.slotId) {
            deleteSlotMutation.mutate(deleteDialog.slotId);
        }
        setDeleteDialog({ open: false, slotId: null });
    };

    const { data: slots = [], isLoading: loadingSlots } = useQuery({
        queryKey: ['slots', user?._id],
        queryFn: () => schedulingService.getSlots({ agentId: user?._id }),
        enabled: !!user?._id
    });

    const { data: appointments = [], isLoading: loadingAppointments } = useQuery({
        queryKey: ['appointments', user?._id],
        queryFn: () => schedulingService.getAppointments({ promoterId: user?._id }),
        enabled: !!user?._id
    });

    const { data: storeRequests = [], isLoading: loadingRequests } = useQuery({
        queryKey: ['storeRequests'],
        queryFn: () => storesService.getStoreRequests()
    });

    const isLoading = loadingAppointments || loadingRequests || loadingSlots;

    const combinedList = [
        ...appointments.map((app) => ({
            id: app._id,
            type: 'Cita Confirmada',
            name: app.storeName,
            contact: app.contactName,
            date: app.scheduledAt || (app.slotId as any)?.date || app.createdAt,
            time: (app.slotId as any)?.time || 'N/A',
            status: app.status,
            link: app.meetingLink,
            color: '#10b981',
            scheduledAt: app.scheduledAt,
            phone: app.phoneNumber,
            email: app.contactEmail,
            city: (app as any).city,
            zipCode: (app as any).zipCode,
            estimatedVolume: (app as any).estimatedMonthlyMessages
        })),
        ...storeRequests
            .filter((req) => !appointments.some((app) => app.leadId === req._id))
            .map((req) => ({
                id: req._id,
                type: 'Store Request (Lead)',
                name: req.storeName,
                contact: req.contactName,
                date: req.demoDate || req.createdAt,
                time: req.demoTimeSlot || 'N/A',
                status: req.status,
                link: req.meetingLink,
                color: '#f59e0b',
                scheduledAt: undefined,
                phone: req.phoneNumber,
                email: req.contactEmail,
                city: req.city,
                zipCode: req.zipCode,
                estimatedVolume: req.estimatedMonthlyMessages
            }))
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const filteredList = combinedList.filter((item) => {
        if (statusFilter === 'all') return true;
        if (statusFilter === 'confirmed') return item.status === 'scheduled' || item.status === 'converted' || item.status === 'confirmed';
        if (statusFilter === 'pending') return item.status === 'pending' || item.status === 'contacted';
        return true;
    });

    const safeSlots = Array.isArray(slots) ? slots : [];
    const calendarEvents = [
        ...safeSlots.map(slot => {
            const rawDate = slot.date?.split('T')[0];
            const endTime = format(addMinutes(new Date(`${rawDate}T${slot.time}:00`), 60), 'HH:mm');
            return {
                id: `slot-${slot._id}`,
                title: !slot.available ? '🔒 Tú: Ocupado' : '✅ Tú: Disponible',
                start: `${rawDate}T${slot.time}:00`,
                end: `${rawDate}T${endTime}:00`,
                allDay: false,
                color: !slot.available ? '#9ca3af' : '#4f46e5',
                textColor: '#ffffff',
                display: 'block'
            };
        }),
        ...filteredList
            .filter(item => item.date && item.link && (item.status === 'confirmed' || item.status === 'scheduled' || item.status === 'converted'))
            .map(item => {
                const isAllDay = item.time === 'N/A' && !item.scheduledAt;
                let startStr = '';
                if (item.scheduledAt) {
                    startStr = new Date(item.scheduledAt).toISOString();
                } else {
                    startStr = isAllDay ? item.date.split('T')[0] : `${item.date.split('T')[0]}T${item.time}:00`;
                }
                return {
                    id: item.id,
                    title: `${item.name} (${item.contact})`,
                    start: startStr,
                    allDay: isAllDay,
                    color: item.color,
                    extendedProps: { ...item }
                };
            })
    ];

    if (isLoading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" p={8}>
                <CircularProgress size={48} thickness={4} />
            </Box>
        );
    }

    const isLinkDisabled = (dateStr: string, timeStr: string) => {
        if (!dateStr) return true;
        try {
            const rawDate = dateStr.split('T')[0];
            const datetimeStr = timeStr === 'N/A' ? rawDate : `${rawDate}T${timeStr}`;
            const targetDate = new Date(datetimeStr);
            if (isToday(targetDate)) return false;
            return isPast(targetDate);
        } catch {
            return false;
        }
    };

    const handleDateToday = (): void => {
        const calItem = calendarRef.current;
        if (!calItem) return;
        const calendar = calItem.getApi();
        calendar.today();
        setCalendarDate(calendar.getDate());
    };

    const changeView = (changedView: View): void => {
        const calItem = calendarRef.current;
        if (!calItem) return;
        const calendar = calItem.getApi();
        calendar.changeView(changedView);
        setCalendarView(changedView);
    };

    const handleDatePrev = (): void => {
        const calItem = calendarRef.current;
        if (!calItem) return;
        const calendar = calItem.getApi();
        calendar.prev();
        setCalendarDate(calendar.getDate());
    };

    const handleDateNext = (): void => {
        const calItem = calendarRef.current;
        if (!calItem) return;
        const calendar = calItem.getApi();
        calendar.next();
        setCalendarDate(calendar.getDate());
    };

    // Compute end time for dialog display
    const slotEndTime = slotDialog.time
        ? format(addMinutes(new Date(`${slotDialog.date}T${slotDialog.time}:00`), slotDialog.durationMinutes), 'HH:mm')
        : '';

    return (
        <>
            {/* ─── Dialog: Crear Slot ─── */}
            <Dialog open={slotDialog.open} onClose={() => setSlotDialog(prev => ({ ...prev, open: false }))} maxWidth="xs" fullWidth>
                <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, pb: 1 }}>
                    <EventAvailableTwoToneIcon color="primary" />
                    Agregar Disponibilidad
                </DialogTitle>
                <DialogContent>
                    <Stack spacing={3} mt={1}>
                        <Box sx={{ p: 2, bgcolor: 'action.selected', borderRadius: 2 }}>
                            <Typography variant="subtitle2" color="primary.main" fontWeight={700}>
                                {slotDialog.date
                                    ? format(new Date(`${slotDialog.date}T00:00:00`), 'EEEE, dd MMMM yyyy', { locale: es })
                                    : ''}
                            </Typography>
                            <Stack direction="row" alignItems="center" gap={0.5} mt={0.5}>
                                <AccessTimeTwoToneIcon fontSize="small" color="action" />
                                <Typography variant="body2" color="text.secondary">
                                    {slotDialog.time} – {slotEndTime} hs
                                </Typography>
                            </Stack>
                        </Box>

                        <Box>
                            <Typography variant="body2" fontWeight={600} mb={1.5}>
                                Duración del turno
                            </Typography>
                            <ToggleButtonGroup
                                value={slotDialog.durationMinutes}
                                exclusive
                                onChange={(_, val) => val && setSlotDialog(prev => ({ ...prev, durationMinutes: val }))}
                                fullWidth
                                size="small"
                                color="primary"
                            >
                                {DURATION_OPTIONS.map(opt => (
                                    <ToggleButton key={opt.value} value={opt.value} sx={{ fontWeight: 600 }}>
                                        {opt.label}
                                    </ToggleButton>
                                ))}
                            </ToggleButtonGroup>
                        </Box>
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => setSlotDialog(prev => ({ ...prev, open: false }))} color="inherit">
                        Cancelar
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleConfirmCreateSlot}
                        disabled={createSlotMutation.isPending}
                        startIcon={<EventAvailableTwoToneIcon />}
                    >
                        Confirmar
                    </Button>
                </DialogActions>
            </Dialog>

            {/* ─── Dialog: Eliminar Slot ─── */}
            <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, slotId: null })} maxWidth="xs" fullWidth>
                <DialogTitle>Eliminar Horario</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        ¿Estás seguro de que deseas eliminar este horario disponible? Esta acción no se puede deshacer.
                    </DialogContentText>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => setDeleteDialog({ open: false, slotId: null })} color="inherit">
                        Cancelar
                    </Button>
                    <Button
                        variant="contained"
                        color="error"
                        onClick={handleConfirmDeleteSlot}
                        disabled={deleteSlotMutation.isPending}
                        startIcon={<DeleteTwoToneIcon />}
                    >
                        Eliminar
                    </Button>
                </DialogActions>
            </Dialog>

            {/* ─── Main Card ─── */}
            <Card>
                <Box sx={{ borderBottom: 1, borderColor: 'divider', display: 'flex', flexWrap: 'wrap', p: 1, px: 2, justifyContent: 'space-between', alignItems: 'center' }}>
                    <Tabs value={viewMode} onChange={(_, val) => setViewMode(val)} indicatorColor="primary" textColor="primary">
                        <Tab label="Lista de Solicitudes" value="list" />
                        <Tab label="Calendario Interactivo" value="calendar" />
                    </Tabs>

                    {viewMode === 'list' && (
                        <Box mt={{ xs: 2, sm: 0 }}>
                            <Tabs
                                value={statusFilter}
                                onChange={(_, val) => setStatusFilter(val)}
                                variant="scrollable"
                                scrollButtons="auto"
                                sx={{ minHeight: 36, '.MuiTab-root': { minHeight: 36, py: 0, px: 2, textTransform: 'none', fontWeight: 500 } }}
                            >
                                <Tab label="Todas" value="all" />
                                <Tab
                                    label={
                                        <Stack direction="row" alignItems="center" gap={1}>
                                            <CheckCircleTwoToneIcon fontSize="small" sx={{ color: 'success.main' }} />
                                            Confirmadas
                                        </Stack>
                                    }
                                    value="confirmed"
                                />
                                <Tab
                                    label={
                                        <Stack direction="row" alignItems="center" gap={1}>
                                            <PendingActionsTwoToneIcon fontSize="small" sx={{ color: 'warning.main' }} />
                                            Pendientes
                                        </Stack>
                                    }
                                    value="pending"
                                />
                            </Tabs>
                        </Box>
                    )}
                </Box>

                {viewMode === 'list' && (
                    <TableContainer component={Paper} elevation={0}>
                        <Table>
                            <TableHead sx={{ bgcolor: 'background.default' }}>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 600 }}>Tipo</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>Tienda / Lead</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>Contacto</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>Programado Para</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>Estatus</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 600 }}>Videoconferencia</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {filteredList.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} align="center">
                                            <Box py={6}>
                                                <Typography variant="h6" color="text.secondary" gutterBottom>
                                                    No se encontraron resultados
                                                </Typography>
                                                <Typography variant="body2" color="text.disabled">
                                                    No hay solicitudes o citas para los filtros seleccionados.
                                                </Typography>
                                            </Box>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredList.map((item) => {
                                        const past = isLinkDisabled(item.date, item.time);

                                        return (
                                            <TableRow
                                                key={item.id}
                                                hover
                                                sx={{ '&:last-child td': { border: 0 }, cursor: 'pointer' }}
                                                onClick={() => handleEventClick(item)}
                                            >
                                                <TableCell>
                                                    <Chip
                                                        label={item.type}
                                                        size="small"
                                                        sx={{ bgcolor: item.color, color: 'white', fontWeight: 500 }}
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <Typography variant="subtitle2" fontWeight="600" color="text.primary">
                                                        {item.name}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell>
                                                    <Typography variant="body2">{item.contact}</Typography>
                                                </TableCell>
                                                <TableCell>
                                                    <Stack>
                                                        <Typography variant="body2" fontWeight="500">
                                                            {item.date ? format(new Date(item.date), 'dd MMM yyyy', { locale: es }) : 'N/A'}
                                                        </Typography>
                                                        <Typography variant="caption" color="text.secondary">
                                                            {item.time !== 'N/A' ? `A las ${item.time}` : 'Hora no definida'}
                                                        </Typography>
                                                    </Stack>
                                                </TableCell>
                                                <TableCell>
                                                    <Chip
                                                        label={item.status}
                                                        size="small"
                                                        variant="outlined"
                                                        color={
                                                            item.status === 'scheduled' || item.status === 'converted' || item.status === 'confirmed' ? 'success' :
                                                                item.status === 'pending' || item.status === 'contacted' ? 'warning' : 'default'
                                                        }
                                                        sx={{ textTransform: 'uppercase', fontSize: '0.7rem' }}
                                                    />
                                                </TableCell>
                                                <TableCell align="right">
                                                    <Button size="small" variant="outlined" onClick={(e) => { e.stopPropagation(); handleEventClick(item); }}>
                                                        Ver Detalles
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}

                {viewMode === 'calendar' && (
                    <Box p={3}>
                        <Box mb={2}>
                            <Actions
                                date={calendarDate}
                                onNext={handleDateNext}
                                onPrevious={handleDatePrev}
                                onToday={handleDateToday}
                                changeView={changeView}
                                view={calendarView}
                            />
                        </Box>
                        <FullCalendarWrapper>
                            <FullCalendar
                                ref={calendarRef}
                                height={700}
                                plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
                                initialView={calendarView}
                                headerToolbar={false}
                                eventDisplay="block"
                                initialDate={calendarDate}
                                events={calendarEvents}
                                selectable={true}
                                selectMirror={true}
                                select={handleSelect}
                                eventClick={(info) => {
                                    const props = info.event.extendedProps;
                                    const eventId = info.event.id || props.id;
                                    handleEventClick({ ...props, id: eventId });
                                }}
                                slotMinTime="07:00:00"
                                slotMaxTime="22:00:00"
                                allDaySlot={true}
                                allDayText="Día Completo"
                            />
                        </FullCalendarWrapper>

                        <Box mt={5}>
                            <Divider sx={{ mb: 3 }} />
                            <Typography variant="h5" fontWeight="600" gutterBottom>
                                Resumen de Horarios Disponibles
                            </Typography>
                            <Typography variant="body2" color="text.secondary" mb={3}>
                                Horarios marcados como disponibles. Haz clic en el ícono de eliminar para quitarlos.
                            </Typography>

                            {safeSlots.filter(s => s.available).length === 0 ? (
                                <Paper sx={{ p: 3, textAlign: 'center', bgcolor: 'background.default' }}>
                                    <Typography color="text.secondary">No tienes horarios disponibles configurados.</Typography>
                                </Paper>
                            ) : (
                                <Grid container spacing={2}>
                                    {safeSlots
                                        .filter(s => s.available)
                                        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime() || a.time.localeCompare(b.time))
                                        .map((slot) => (
                                            <Grid item xs={12} sm={6} md={4} lg={3} key={slot._id}>
                                                <Card variant="outlined" sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <Box>
                                                        <Typography variant="subtitle2" fontWeight="700">
                                                            {format(new Date(slot.date.split('T')[0] + 'T00:00:00'), 'dd MMM, yyyy', { locale: es })}
                                                        </Typography>
                                                        <Typography variant="body2" color="primary.main" fontWeight="500">
                                                            {slot.time} hs
                                                        </Typography>
                                                    </Box>
                                                    <IconButton
                                                        size="small"
                                                        color="error"
                                                        onClick={() => setDeleteDialog({ open: true, slotId: slot._id })}
                                                    >
                                                        <DeleteTwoToneIcon fontSize="small" />
                                                    </IconButton>
                                                </Card>
                                            </Grid>
                                        ))}
                                </Grid>
                            )}
                        </Box>
                    </Box>
                )}

                <SwipeableDrawer
                    variant="temporary"
                    anchor="right"
                    onClose={() => setDrawerOpen(false)}
                    onOpen={() => setDrawerOpen(true)}
                    open={drawerOpen}
                    elevation={9}
                    PaperProps={{
                        sx: {
                            width: '100%',
                            maxWidth: { xs: 340, md: 540, lg: 680 },
                            overflow: 'visible',
                            flexDirection: 'row',
                        },
                    }}
                    ModalProps={{
                        BackdropProps: {
                            sx: {
                                backdropFilter: 'blur(3px) !important',
                                background:
                                    theme.palette.mode === 'dark'
                                        ? `linear-gradient(90deg, ${alpha(
                                            darken(theme.palette.neutral[900] || '#000', 0.2),
                                            0.9
                                        )} 10%, ${alpha(theme.palette.neutral[300] || '#ccc', 0.16)} 100%) !important`
                                        : `linear-gradient(90deg, ${alpha(theme.palette.neutral[900] || '#000', 0.7)} 10%, ${alpha(
                                            theme.palette.neutral[700] || '#333',
                                            0.7
                                        )} 100%) !important`,
                            },
                        },
                    }}
                >
                    {drawerOpen && (
                        <Box overflow="hidden" display="flex" flexDirection="column" width="100%">
                            <EventDrawer event={selectedEvent} onClose={() => setDrawerOpen(false)} />
                        </Box>
                    )}
                </SwipeableDrawer>
            </Card>
        </>
    );
};

export default AppointmentsList;
