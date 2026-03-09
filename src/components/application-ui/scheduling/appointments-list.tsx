'use client';
import React, { useState, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
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
    darken
} from '@mui/material';
import { format, isPast, isToday } from 'date-fns';
import { es } from 'date-fns/locale';
import schedulingService from 'src/services/scheduling.service';
import storesService from 'src/services/store.service';
import { useAuth } from 'src/hooks/use-auth';
// Import FullCalendar plugins for a quick read-only view
import FullCalendar from '@fullcalendar/react';
import interactionPlugin from '@fullcalendar/interaction';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import { FullCalendarWrapper } from 'src/components/base/styles/calendar';
import EventDrawer from './event-drawer';
import Actions from '../content-shells/calendar/actions';
import { View } from 'src/models/calendar';

import VideocamTwoToneIcon from '@mui/icons-material/VideocamTwoTone';
import CheckCircleTwoToneIcon from '@mui/icons-material/CheckCircleTwoTone';
import PendingActionsTwoToneIcon from '@mui/icons-material/PendingActionsTwoTone';

type StatusFilter = 'all' | 'confirmed' | 'pending';

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

    const handleEventClick = (eventData: any) => {
        if (!eventData.id?.startsWith('slot-')) {
            setSelectedEvent(eventData);
            setDrawerOpen(true);
        }
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
            date: (app.slotId as any)?.date || app.createdAt,
            time: (app.slotId as any)?.startTime || 'N/A',
            status: app.status,
            link: app.meetingLink,
            color: '#10b981' // Theme emerald/success
        })),
        ...storeRequests.map((req) => ({
            id: req._id,
            type: 'Store Request (Lead)',
            name: req.storeName,
            contact: req.contactName,
            date: req.demoDate || req.createdAt,
            time: req.demoTimeSlot || 'N/A',
            status: req.status,
            link: req.meetingLink,
            color: '#f59e0b' // Theme amber/warning
        }))
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Apply Filters
    const filteredList = combinedList.filter((item) => {
        if (statusFilter === 'all') return true;
        if (statusFilter === 'confirmed') return item.status === 'scheduled' || item.status === 'converted' || item.status === 'confirmed';
        if (statusFilter === 'pending') return item.status === 'pending' || item.status === 'contacted';
        return true;
    });

    // Generate Calendar Events
    const safeSlots = Array.isArray(slots) ? slots : [];
    const calendarEvents = [
        // 1. Mostrar los slots (disponibles o no)
        ...safeSlots.map(slot => {
            const rawDate = slot.date?.split('T')[0];
            return {
                id: `slot-${slot._id}`,
                title: !slot.available ? 'Tú: Ocupado' : 'Tú: Disponible',
                start: `${rawDate}T${slot.time}:00`,
                allDay: false,
                color: !slot.available ? '#9ca3af' : '#4f46e5', // Theme gray for busy, indigo for available
                textColor: '#ffffff',
                display: 'block'
            };
        }),
        // 2. Mostrar Citas y Requests
        ...filteredList
            .filter(item => item.date)
            .map(item => {
                const isAllDay = item.time === 'N/A';
                return {
                    id: item.id,
                    title: `${item.name} (${item.contact})`,
                    start: isAllDay ? item.date.split('T')[0] : `${item.date.split('T')[0]}T${item.time}:00`,
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

    // Helper for disabling past links
    const isLinkDisabled = (dateStr: string, timeStr: string) => {
        if (!dateStr) return true;
        try {
            const rawDate = dateStr.split('T')[0];
            const datetimeStr = timeStr === 'N/A' ? rawDate : `${rawDate}T${timeStr}`;
            const targetDate = new Date(datetimeStr);

            // Allow joining if today
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

    return (
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
                            eventClick={(info) => {
                                const props = info.event.extendedProps;
                                handleEventClick(props);
                            }}
                            slotMinTime="07:00:00"
                            slotMaxTime="22:00:00"
                            allDaySlot={true}
                            allDayText="Día Completo"
                        />
                    </FullCalendarWrapper>
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
    );
};

export default AppointmentsList;
