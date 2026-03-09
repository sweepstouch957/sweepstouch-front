'use client';
import React from 'react';
import PromoterScheduleConfig from '@/components/application-ui/scheduling/promoter-schedule-config';
import AppointmentsList from '@/components/application-ui/scheduling/appointments-list';
import { Box, Typography, Container } from '@mui/material';

export default function AppointmentsPage() {
    return (
        <Container maxWidth="xl" sx={{ py: 4 }}>
            <Box mb={4}>
                <Typography variant="h4" fontWeight="bold" gutterBottom>
                    Agenda y Citas
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    Configura tu horario disponible y gestiona las solicitudes de demostración o citas confirmadas de las tiendas.
                </Typography>
            </Box>

            <Box mb={5}>
                <PromoterScheduleConfig />
            </Box>

            <Box>
                <AppointmentsList />
            </Box>
        </Container>
    );
}
