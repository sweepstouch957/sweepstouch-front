import React from 'react';
import { Campaing, CampaingStatus } from '@/models/campaing';
import { campaignClient } from '@/services/campaing.service';
import {
  ClearRounded as ClearIcon,
  DeleteRounded,
  Edit,
  OpenInNewRounded,
  SearchTwoTone,
} from '@mui/icons-material';
import {
  Avatar,
  Box,
  Button,
  Card,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  IconButton,
  InputAdornment,
  MenuItem,
  Select,
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
import { DatePicker } from '@mui/x-date-pickers';
import { format } from 'date-fns';
import numeral from 'numeral';
import type { FC } from 'react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SkeletonTableRow } from '../../skeleton/table/table';

interface ResultsProps {
  campaigns: Campaing[];
  filters: any;
  setFilters: (filters: any) => void;
  total: number;
  refetch: () => void;
  isLoading: boolean;
  storeId?: string;
}

const getInvoiceStatusLabel = (campaignStatus: CampaingStatus): JSX.Element => {
  const map: Partial<Record<CampaingStatus, {
    text: string;
    color: 'warning' | 'success' | 'info' | 'primary';
  }>> = {
    scheduled: { text: 'Scheduled', color: 'warning' },
    completed: { text: 'Completed', color: 'success' },
    draft: { text: 'Draft', color: 'info' },
    active: { text: 'Active', color: 'primary' },
    // opcionalmente agrega los extras si existen:
    progress: { text: 'In Progress', color: 'primary' },
    cancelled: { text: 'Cancelled', color: 'warning' },
  };

  // Fallback seguro si llega un estado no mapeado:
  const { text, color } = map[campaignStatus] ?? { text: String(campaignStatus), color: 'info' as const };


  return (
    <Chip
      variant="outlined"
      label={text}
      color={color}
    />
  );
};

const Results: FC<ResultsProps> = ({
  campaigns,
  filters,
  setFilters,
  total,
  isLoading,
  refetch,
  storeId,
}) => {
  // Mantener filtros vigentes accesibles a handlers (export)
  const filtersRef = React.useRef<any>(filters);
  React.useEffect(() => {
    filtersRef.current = filters;
  }, [filters]);

  // Exportar TODAS las campañas con los filtros actuales
  // Exportar TODAS las campañas con los filtros actuales
  async function exportAllCampaigns(): Promise<void> {
    try {
      const limit = 500;
      let page = 1;
      let all: any[] = [];

      const { campaignClient: svc } = await import('@/services/campaing.service');

      // Usar EXACTAMENTE los filtros vigentes de la tabla.
      // No cambiamos valores (no convertimos '' a undefined, etc.)
      // Solo ponemos page y limit encima.
      const baseFilters: any = { ...(filtersRef.current || {}) };
      delete baseFilters.page;
      delete baseFilters.limit;

      // eslint-disable-next-line no-constant-condition
      while (true) {
        const params: any = { ...baseFilters, page, limit };
        const res: any = await svc.getFilteredCampaigns(params);

        const data = res?.data ?? res?.items ?? [];
        all = all.concat(data);

        // Condición de salida robusta basada en tamaño de página:
        if (data.length < limit) break;

        page += 1;
        if (page > 5000) break; // safety
      }

      // Mapea a columnas llanas (ajusta si quieres más)
      const rows = all.map((c: any) => ({
        store: c?.store?.name ?? '',
        type: c?.type ?? '',
        startDate: c?.startDate ? new Date(c.startDate).toISOString().slice(0, 10) : '',
        audience: c?.audience ?? 0,
        cost: c?.cost ?? 0,
        status: c?.status ?? '',
      }));

      const xlsx = await import('xlsx');
      const ws = xlsx.utils.json_to_sheet(rows);
      const wb = xlsx.utils.book_new();
      xlsx.utils.book_append_sheet(wb, ws, 'Campaigns');
      xlsx.writeFile(wb, 'campaigns_listing.xlsx');
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Export campaigns failed', err);
      // eslint-disable-next-line no-alert
      alert('No se pudo exportar campañas. Revisa la consola para detalles.');
    }
  }


  // Escucha el botón Export del header (ExportButton emite `campaigns:export`)
  React.useEffect(() => {
    const handler = () => {
      void exportAllCampaigns();
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('campaigns:export', handler);
      return () => window.removeEventListener('campaigns:export', handler);
    }
    return () => { };
  }, []); // no dependas de filters aquí, ya usamos filtersRef

  const { t } = useTranslation();
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [selectedToDelete, setSelectedToDelete] = useState<string | null>(null);

  const handleDelete = () => {
    if (!selectedToDelete) return;
    campaignClient
      .deleteCampaign(selectedToDelete)
      .then(() => {
        setSelectedToDelete(null);
        refetch();
      })
      .catch((error) => {
        // eslint-disable-next-line no-console
        console.error('Error deleting campaign:', error);
      });
  };

  const handleStoreRedirect = (id: string) => {
    window.open(`/admin/management/stores/edit/${id}`, '_blank');
  };

  const handleCampaingRedirect = (id: string) => {
    window.open(`/admin/management/campaings/stats/${id}`, '_blank');
  };

  const handleCampaingEditRedirect = (id: string) => {
    window.open(`/admin/management/campaings/edit/${id}`);
  };

  return (
    <Card sx={{ borderRadius: 3, overflow: 'hidden' }}>
      <Box
        py={2}
        px={3}
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        flexWrap="wrap"
      >
        {!storeId && (
          <Stack
            direction="row"
            spacing={2}
            mt={{ xs: 2, sm: 0 }}
          >
            <DatePicker
              label={t('Start Date')}
              value={filters.startDate ? new Date(filters.startDate) : null}
              onChange={(newValue) => {
                setFilters({
                  ...filters,
                  startDate: newValue ? newValue.toISOString() : '',
                  page: 1,
                });
              }}
              slotProps={{ textField: { size: 'small' } }}
            />

            <DatePicker
              label={t('End Date')}
              value={filters.endDate ? new Date(filters.endDate) : null}
              onChange={(newValue) => {
                setFilters({
                  ...filters,
                  endDate: newValue ? newValue.toISOString() : '',
                  page: 1,
                });
              }}
              slotProps={{ textField: { size: 'small' } }}
            />
            <FormControl
              size="small"
              variant="outlined"
            >
              <Select
                value={filters.status || 'all'}
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    status: e.target.value === 'all' ? '' : e.target.value,
                    page: 1,
                  })
                }
              >
                {['all', 'active', 'completed', 'draft', 'scheduled'].map((opt) => (
                  <MenuItem
                    key={opt}
                    value={opt}
                  >
                    {t(opt.charAt(0).toUpperCase() + opt.slice(1))}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              size="small"
              placeholder={t('Filter by Store name')}
              value={filters.storeName || ''}
              onChange={(e) => setFilters({ ...filters, storeName: e.target.value, page: 1 })}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchTwoTone />
                  </InputAdornment>
                ),
                endAdornment: filters.storeName ? (
                  <InputAdornment position="end">
                    <IconButton
                      color="error"
                      onClick={() => setFilters({ ...filters, storeName: '', page: 1 })}
                      edge="end"
                      size="small"
                    >
                      <ClearIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                ) : null,
              }}
              variant="outlined"
            />
          </Stack>
        )}
      </Box>
      <Divider />
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
              <TableCell align="center">{t('Actions')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => <SkeletonTableRow key={i} />)
              : campaigns.map((campaign) => {
                const selected = selectedItems.includes(campaign._id);
                return (
                  <TableRow
                    key={campaign._id}
                    selected={selected}
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
                        {format(new Date(campaign.startDate), 'dd/MM/yyyy')}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box
                        display="flex"
                        alignItems="center"
                      >
                        <Avatar
                          sx={{ mr: 1, width: 38, height: 38, cursor: 'pointer' }}
                          src={campaign.store?.image}
                          onClick={() => handleStoreRedirect(campaign.store?._id || '')}
                        />
                        <Typography
                          variant="h6"
                          fontWeight={500}
                          sx={{ cursor: 'pointer' }}
                          onClick={() => handleStoreRedirect(campaign.store?._id || '')}
                        >
                          {campaign.store?.name}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography
                        noWrap
                        variant="body2"
                      >
                        {campaign.audience}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography
                        variant="h6"
                        fontWeight={600}
                      >
                        {numeral(campaign.cost).format(`$0,0.00`)}
                      </Typography>
                    </TableCell>
                    <TableCell>{getInvoiceStatusLabel(campaign.status)}</TableCell>
                    <TableCell align="center">
                      <Stack
                        direction="row"
                        spacing={1}
                        justifyContent="center"
                      >
                        <Tooltip
                          title={t('Go to Stats')}
                          arrow
                        >
                          <IconButton
                            onClick={() => handleCampaingRedirect(campaign._id || '')}
                            color="info"
                          >
                            <OpenInNewRounded fontSize="small" />
                          </IconButton>
                        </Tooltip>

                        {campaign.status !== 'completed' && (
                          <Tooltip
                            title={t('Edit Campaign')}
                            arrow
                          >
                            <IconButton
                              onClick={() => handleCampaingEditRedirect(campaign._id || '')}
                              color="primary"
                            >
                              <Edit fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}

                        {campaign.status === 'scheduled' && (
                          <Tooltip
                            title="Eliminar campaña"
                            arrow
                          >
                            <IconButton
                              onClick={() => setSelectedToDelete(campaign._id)}
                              color="error"
                            >
                              <DeleteRounded fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Stack>
                    </TableCell>
                  </TableRow>
                );
              })}
          </TableBody>
        </Table>
      </TableContainer>
      <Box p={2}>
        <TablePagination
          component="div"
          count={total}
          page={filters.page - 1}
          onPageChange={(e, newPage) => setFilters({ ...filters, page: newPage + 1 })}
          rowsPerPage={filters.limit}
          onRowsPerPageChange={(e) =>
            setFilters({ ...filters, limit: parseInt(e.target.value, 10), page: 1 })
          }
          rowsPerPageOptions={[5, 10, 15]}
          slotProps={{ select: { variant: 'outlined', size: 'small', sx: { p: 0 } } }}
        />
      </Box>

      <Dialog
        open={Boolean(selectedToDelete)}
        onClose={() => setSelectedToDelete(null)}
      >
        <DialogTitle>¿Estás seguro?</DialogTitle>
        <DialogContent>
          <Typography>¿Deseas eliminar esta campaña programada?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedToDelete(null)}>Cancelar</Button>
          <Button
            onClick={handleDelete}
            color="error"
            startIcon={<DeleteRounded />}
            variant="contained"
          >
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
};

export default Results;
