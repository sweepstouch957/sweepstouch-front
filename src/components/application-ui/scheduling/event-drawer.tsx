'use client';
import React, { useState } from 'react';
import {
    Box,
    Typography,
    Divider,
    Button,
    IconButton,
    Chip,
    Stack,
    TextField,
    Avatar,
    Collapse,
    useTheme,
    alpha,
    MenuItem
} from '@mui/material';
import CloseTwoToneIcon from '@mui/icons-material/CloseTwoTone';
import VideocamTwoToneIcon from '@mui/icons-material/VideocamTwoTone';
import EventAvailableTwoToneIcon from '@mui/icons-material/EventAvailableTwoTone';
import StorefrontTwoToneIcon from '@mui/icons-material/StorefrontTwoTone';
import PersonTwoToneIcon from '@mui/icons-material/PersonTwoTone';
import EditCalendarTwoToneIcon from '@mui/icons-material/EditCalendarTwoTone';
import ExpandMoreTwoToneIcon from '@mui/icons-material/ExpandMoreTwoTone';
import ExpandLessTwoToneIcon from '@mui/icons-material/ExpandLessTwoTone';
import PhoneTwoToneIcon from '@mui/icons-material/PhoneTwoTone';
import EmailTwoToneIcon from '@mui/icons-material/EmailTwoTone';
import LocationCityTwoToneIcon from '@mui/icons-material/LocationCityTwoTone';
import MessageTwoToneIcon from '@mui/icons-material/MessageTwoTone';
import { format, isPast, isToday } from 'date-fns';
import { es } from 'date-fns/locale';

interface EventDrawerProps {
    event: any;
    onClose: () => void;
    onReschedule?: (id: string, data: { date: string; time: string; scheduledAt: string; timezone?: string }) => Promise<unknown>;
    rescheduling?: boolean;
}

const MERIDIEM_OPTIONS = ['AM', 'PM'] as const;
type Meridiem = (typeof MERIDIEM_OPTIONS)[number];

function parseLocalDate(value?: string) {
    if (!value) return null;
    const dateOnlyMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    if (dateOnlyMatch) {
        const [, year, month, day] = dateOnlyMatch;
        return new Date(Number(year), Number(month) - 1, Number(day));
    }
    return new Date(value);
}

function getEventDateValue(event: any) {
    const source = event?.scheduledAt || event?.date;
    if (!source) return '';
    try {
        return format(parseLocalDate(source) || new Date(source), 'yyyy-MM-dd');
    } catch {
        return source.split('T')[0] || '';
    }
}

function getEventTimeValue(event: any) {
    if (event?.scheduledAt) {
        try {
            return format(new Date(event.scheduledAt), 'HH:mm');
        } catch {
            return '';
        }
    }
    return event?.time && event.time !== 'N/A' ? event.time.slice(0, 5) : '';
}

function getMeridiem(timeValue: string): Meridiem {
    const hour = Number(timeValue.split(':')[0] || 0);
    return hour >= 12 ? 'PM' : 'AM';
}

function toTwelveHourTime(timeValue: string) {
    if (!timeValue) return '';
    const [rawHour, minute = '00'] = timeValue.split(':');
    const hour = Number(rawHour);
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minute.padStart(2, '0')}`;
}

function applyMeridiem(timeValue: string, meridiem: Meridiem) {
    if (!timeValue) return '';
    const [rawHour, minute = '00'] = timeValue.split(':');
    const displayHour = Number(rawHour) % 12 || 12;
    let hour = displayHour;
    if (meridiem === 'PM' && displayHour !== 12) hour += 12;
    if (meridiem === 'AM' && displayHour === 12) hour = 0;
    return `${String(hour).padStart(2, '0')}:${minute.padStart(2, '0')}`;
}

function formatTimeWithMeridiem(timeValue?: string) {
    if (!timeValue || timeValue === 'N/A') return 'Hora pendiente';
    return `${toTwelveHourTime(timeValue)} ${getMeridiem(timeValue)}`;
}

const EventDrawer: React.FC<EventDrawerProps> = ({ event, onClose, onReschedule, rescheduling = false }) => {
    const theme = useTheme();
    const [isRescheduling, setIsRescheduling] = useState(false);
    const [showMoreInfo, setShowMoreInfo] = useState(false);
    const [rescheduleDate, setRescheduleDate] = useState(() => getEventDateValue(event));
    const [rescheduleTime, setRescheduleTime] = useState(() => getEventTimeValue(event));
    const [rescheduleMeridiem, setRescheduleMeridiem] = useState<Meridiem>(() => getMeridiem(getEventTimeValue(event)));
    const [rescheduleError, setRescheduleError] = useState('');

    const {
        id,
        type,
        name,
        contact,
        date,
        time,
        status,
        link,
        color,
        phone,
        email,
        city,
        zipCode,
        estimatedVolume,
        timezone
    } = event || {};

    // Fallback if event is null
    if (!event) return null;

    const handleToggleReschedule = () => {
        if (!isRescheduling) {
            setRescheduleDate(getEventDateValue(event));
            const currentTime = getEventTimeValue(event);
            setRescheduleTime(currentTime);
            setRescheduleMeridiem(getMeridiem(currentTime));
            setRescheduleError('');
        }
        setIsRescheduling((value) => !value);
    };

    const handleConfirmReschedule = async () => {
        if (!rescheduleDate || !rescheduleTime) {
            setRescheduleError('Selecciona una nueva fecha y hora.');
            return;
        }
        if (!id) {
            setRescheduleError('No se pudo identificar la cita a reagendar.');
            return;
        }
        if (!onReschedule) {
            setRescheduleError('No hay una acciÃ³n de reagendamiento configurada.');
            return;
        }

        const normalizedTime = applyMeridiem(rescheduleTime, rescheduleMeridiem);
        const scheduledAtValue = `${rescheduleDate}T${normalizedTime}:00`;
        await onReschedule(id, {
            date: rescheduleDate,
            time: normalizedTime,
            scheduledAt: scheduledAtValue,
            timezone,
        });
        setIsRescheduling(false);
        setRescheduleError('');
    };

    const isLinkDisabled = (dateStr: string, timeStr: string) => {
        if (!dateStr) return true;
        try {
            const rawDate = dateStr.split('T')[0];
            const datetimeStr = timeStr === 'N/A' ? rawDate : `${rawDate}T${timeStr}`;
            const targetDate = timeStr === 'N/A'
                ? parseLocalDate(rawDate) || new Date(rawDate)
                : new Date(datetimeStr);
            if (isToday(targetDate)) return false;
            return isPast(targetDate);
        } catch {
            return false;
        }
    };

    const past = isLinkDisabled(date, time);

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Header */}
            <Box
                sx={{
                    p: 3,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    bgcolor: alpha(color || theme.palette.primary.main, 0.1),
                    borderBottom: `1px solid ${theme.palette.divider}`
                }}
            >
                <Typography variant="h5" fontWeight="bold">
                    Detalles de la Cita
                </Typography>
                <IconButton onClick={onClose} size="small" sx={{ bgcolor: 'background.paper' }}>
                    <CloseTwoToneIcon />
                </IconButton>
            </Box>

            {/* Content */}
            <Box sx={{ p: 4, flexGrow: 1, overflowY: 'auto' }}>
                <Stack direction="row" spacing={2} alignItems="center" mb={4}>
                    <Avatar sx={{ bgcolor: color || theme.palette.primary.main, width: 56, height: 56 }}>
                        <EventAvailableTwoToneIcon fontSize="large" sx={{ color: 'white' }} />
                    </Avatar>
                    <Box>
                        <Chip
                            label={type}
                            size="small"
                            sx={{ bgcolor: color, color: 'white', fontWeight: 600, mb: 1 }}
                        />
                        <Typography variant="h4" fontWeight="800" gutterBottom>
                            {name}
                        </Typography>
                    </Box>
                </Stack>

                <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                    <Box sx={{ flex: 1, p: 2, bgcolor: 'background.default', borderRadius: 2 }}>
                        <Typography variant="caption" color="text.secondary" display="flex" alignItems="center" gap={0.5}>
                            <PersonTwoToneIcon fontSize="small" /> Contacto
                        </Typography>
                        <Typography variant="body1" fontWeight="600" mt={0.5}>
                            {contact}
                        </Typography>
                    </Box>
                    <Box sx={{ flex: 1, p: 2, bgcolor: 'background.default', borderRadius: 2 }}>
                        <Typography variant="caption" color="text.secondary" display="flex" alignItems="center" gap={0.5}>
                            <StorefrontTwoToneIcon fontSize="small" /> Estado
                        </Typography>
                        <Typography variant="body1" fontWeight="600" mt={0.5} sx={{ textTransform: 'capitalize' }}>
                            {status}
                        </Typography>
                    </Box>
                </Box>

                <Box sx={{ mb: 4, p: 2, border: `1px solid ${theme.palette.divider}`, borderRadius: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Fecha y Hora Programada
                    </Typography>
                    <Typography variant="h6">
                        {date ? format(parseLocalDate(date) || new Date(date), 'EEEE, dd MMMM yyyy', { locale: es }) : 'No definida'}
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        {time !== 'N/A' ? `A las ${formatTimeWithMeridiem(time)}` : 'Hora pendiente'}
                    </Typography>
                </Box>

                <Box sx={{ mb: 4 }}>
                    <Button
                        variant="text"
                        color="secondary"
                        onClick={() => setShowMoreInfo(!showMoreInfo)}
                        endIcon={showMoreInfo ? <ExpandLessTwoToneIcon /> : <ExpandMoreTwoToneIcon />}
                        sx={{ pl: 0, fontWeight: 600 }}
                    >
                        {showMoreInfo ? 'Ocultar Información' : 'Ver Más Información'}
                    </Button>

                    <Collapse in={showMoreInfo}>
                        <Box sx={{ p: 2, bgcolor: alpha(theme.palette.secondary.main, 0.04), borderRadius: 2, display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>

                            <Stack direction="row" spacing={1} alignItems="center">
                                <PhoneTwoToneIcon fontSize="small" color="secondary" />
                                <Typography variant="body2" fontWeight={500} minWidth={100}>Teléfono:</Typography>
                                <Typography variant="body2">{phone || 'N/A'}</Typography>
                            </Stack>

                            <Stack direction="row" spacing={1} alignItems="center">
                                <EmailTwoToneIcon fontSize="small" color="secondary" />
                                <Typography variant="body2" fontWeight={500} minWidth={100}>Email:</Typography>
                                <Typography variant="body2">{email || 'N/A'}</Typography>
                            </Stack>

                            {(city || zipCode) && (
                                <Stack direction="row" spacing={1} alignItems="center">
                                    <LocationCityTwoToneIcon fontSize="small" color="secondary" />
                                    <Typography variant="body2" fontWeight={500} minWidth={100}>Ubicación:</Typography>
                                    <Typography variant="body2">
                                        {[city, zipCode].filter(Boolean).join(', ')}
                                    </Typography>
                                </Stack>
                            )}

                            {estimatedVolume && (
                                <Stack direction="row" spacing={1} alignItems="center">
                                    <MessageTwoToneIcon fontSize="small" color="secondary" />
                                    <Typography variant="body2" fontWeight={500} minWidth={100}>Volumen Est.:</Typography>
                                    <Chip label={estimatedVolume} size="small" variant="outlined" color="primary" />
                                </Stack>
                            )}

                        </Box>
                    </Collapse>
                </Box>

                <Divider sx={{ mb: 3 }} />

                <Typography variant="h6" fontWeight="bold" gutterBottom>
                    Acciones
                </Typography>

                <Stack spacing={2} mt={2}>
                    {link ? (
                        <Button
                            variant="contained"
                            size="large"
                            href={link}
                            target="_blank"
                            startIcon={<VideocamTwoToneIcon />}
                            disabled={past}
                            color={past ? 'inherit' : 'primary'}
                            sx={{ py: 1.5, justifyContent: 'flex-start', px: 3 }}
                        >
                            {past ? 'El enlace ha expirado' : 'Unirse a la Videoconferencia'}
                        </Button>
                    ) : (
                        <Typography variant="body2" color="text.disabled" fontStyle="italic">
                            No hay un enlace de Google Meet generado aún.
                        </Typography>
                    )}

                    <Button
                        variant="outlined"
                        size="large"
                        startIcon={<EditCalendarTwoToneIcon />}
                        onClick={handleToggleReschedule}
                        sx={{ py: 1.5, justifyContent: 'flex-start', px: 3 }}
                    >
                        Reagendar Cita
                    </Button>
                </Stack>

                {isRescheduling && (
                    <Box mt={3} p={3} bgcolor="background.default" borderRadius={2}>
                        <Typography variant="subtitle2" gutterBottom>
                            Selecciona nueva fecha y hora
                        </Typography>
                        <Stack spacing={2} mt={2}>
                            <TextField
                                type="date"
                                fullWidth
                                InputLabelProps={{ shrink: true }}
                                label="Nueva Fecha"
                                value={rescheduleDate}
                                onChange={(e) => {
                                    setRescheduleDate(e.target.value);
                                    setRescheduleError('');
                                }}
                            />
                            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                                <TextField
                                    type="time"
                                    fullWidth
                                    InputLabelProps={{ shrink: true }}
                                    label="Nueva Hora"
                                    value={rescheduleTime}
                                    onChange={(e) => {
                                        setRescheduleTime(e.target.value);
                                        setRescheduleMeridiem(getMeridiem(e.target.value));
                                        setRescheduleError('');
                                    }}
                                    helperText={rescheduleTime ? `${toTwelveHourTime(rescheduleTime)} ${rescheduleMeridiem}` : ' '}
                                />
                                <TextField
                                    select
                                    label="AM/PM"
                                    value={rescheduleMeridiem}
                                    onChange={(e) => {
                                        const nextMeridiem = e.target.value as Meridiem;
                                        setRescheduleMeridiem(nextMeridiem);
                                        setRescheduleTime((current) => applyMeridiem(current, nextMeridiem));
                                        setRescheduleError('');
                                    }}
                                    sx={{ minWidth: { xs: '100%', sm: 120 } }}
                                >
                                    {MERIDIEM_OPTIONS.map((option) => (
                                        <MenuItem key={option} value={option}>
                                            {option}
                                        </MenuItem>
                                    ))}
                                </TextField>
                            </Stack>
                            {rescheduleError && (
                                <Typography variant="body2" color="error">
                                    {rescheduleError}
                                </Typography>
                            )}
                            <Button
                                variant="contained"
                                color="warning"
                                fullWidth
                                onClick={handleConfirmReschedule}
                                disabled={rescheduling}
                            >
                                {rescheduling ? 'Reagendando...' : 'Confirmar Reagendamiento'}
                            </Button>
                        </Stack>
                    </Box>
                )}

            </Box>
        </Box>
    );
};

export default EventDrawer;
