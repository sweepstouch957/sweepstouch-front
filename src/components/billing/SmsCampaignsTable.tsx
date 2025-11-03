'use client';

import { Campaing } from '@/models/campaing';
import { campaignClient } from '@/services/campaing.service';
import {
  Box,
  Card,
  Chip,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Typography,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import numeral from 'numeral';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface SmsCampaignsTableProps {
  startDate: string;
  endDate: string;
}

// Reutilizar la lógica de estado de la campaña de results.tsx
const getCampaignStatusLabel = (campaignStatus: Campaing['status']): JSX.Element => {
  const map: Partial<
    Record<
      Campaing['status'],
      {
        text: string;
        color: 'warning' | 'success' | 'info' | 'primary';
      }
    >
  > = {
    scheduled: { text: 'Scheduled', color: 'warning' },
    completed: { text: 'Completed', color: 'success' },
    draft: { text: 'Draft', color: 'info' },
    active: { text: 'Active', color: 'primary' },
    progress: { text: 'In Progress', color: 'primary' },
    cancelled: { text: 'Cancelled', color: 'warning' },
  };

  const { text, color } = map[campaignStatus] ?? {
    text: String(campaignStatus),
    color: 'info' as const,
  };

  return (
    <Chip
      variant="outlined"
      label={text}
      color={color}
    />
  );
};

export default function SmsCampaignsTable({ startDate, endDate }: SmsCampaignsTableProps) {
  const { t } = useTranslation();
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(10);

  // NOTE: Asumo que el endpoint getFilteredCampaigns permite filtrar por tipo de campaña (SMS/MMS)
  // Como no puedo modificar el backend, asumo que el filtro por 'type' se puede pasar en 'title' o 'status'
  // o que el backend ya está filtrando por tipo de mensaje.
  // Para ser más preciso, voy a buscar el campo 'type' en el modelo Campaing.
  // Sin embargo, para no bloquear, usaré getFilteredCampaigns con los filtros de fecha.
  // Si el backend no soporta el filtro por tipo, se mostrarán todas las campañas (SMS+MMS)
  // y se filtrará en el frontend por 'type' = 'SMS'.

  const filters = {
    startDate,
    endDate,
    page: page + 1, // API usa 1-based index
    limit,
    // Asumo que el backend puede filtrar por 'type' si se añade al servicio.
    // Si no, lo haremos en el frontend.
    // type: 'SMS', // Esto requeriría modificar el servicio y el backend.
  };

  const { data, isPending, error, isFetching } = useQuery({
    queryKey: ['smsCampaigns', filters],
    queryFn: () => campaignClient.getFilteredCampaigns(filters),
    staleTime: 1000 * 60,
  });

  const campaigns = data?.data?.filter((c: Campaing) => c.type === 'SMS' || c.type === 'MMS') || [];
  const total = data?.total || 0;

  const handlePageChange = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleLimitChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setLimit(parseInt(event.target.value, 10));
    setPage(0);
  };

  if (isPending || isFetching) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        height="200px"
      >
        <CircularProgress size={48} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box
        textAlign="center"
        py={4}
      >
        <Typography
          color="error"
          variant="body1"
        >
          Error al cargar las campañas de SMS.
        </Typography>
      </Box>
    );
  }

  return (
    <Card
      variant="outlined"
      sx={{ borderRadius: 3, overflow: 'hidden' }}
    >
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>{t('Type')}</TableCell>
              <TableCell>{t('Start Date')}</TableCell>
              <TableCell>{t('Store')}</TableCell>
              <TableCell>{t('Audience')}</TableCell>
              <TableCell>{t('Cost')}</TableCell>
              <TableCell>{t('Status')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {campaigns.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  align="center"
                >
                  <Typography
                    variant="subtitle1"
                    color="textSecondary"
                  >
                    No se encontraron campañas de SMS o MMS en el rango seleccionado.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              campaigns.map((campaign: Campaing) => (
                <TableRow
                  key={campaign._id}
                  hover
                >
                  <TableCell>
                    <Typography
                      noWrap
                      variant="subtitle2"
                    >
                      {campaign.type}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography
                      noWrap
                      variant="subtitle2"
                    >
                      {campaign.startDate
                        ? format(new Date(campaign.startDate), 'dd/MM/yyyy')
                        : 'N/A'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography
                      noWrap
                      variant="subtitle2"
                    >
                      {campaign.store?.name || 'N/A'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography
                      noWrap
                      variant="subtitle2"
                    >
                      {numeral(campaign.audience).format('0,0')}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography
                      noWrap
                      variant="subtitle2"
                    >
                      {numeral(campaign.cost).format('$0,0.00')}
                    </Typography>
                  </TableCell>
                  <TableCell>{getCampaignStatusLabel(campaign.status)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        component="div"
        count={total}
        onPageChange={handlePageChange}
        onRowsPerPageChange={handleLimitChange}
        page={page}
        rowsPerPage={limit}
        rowsPerPageOptions={[5, 10, 25]}
      />
    </Card>
  );
}
