'use client';

import { Campaing, CampaingStatus } from '@/models/campaing';
import { campaignClient } from '@/services/campaing.service';
import { DeleteRounded, Edit, OpenInNewRounded } from '@mui/icons-material';
import {
  alpha,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { format } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import numeral from 'numeral';
import React, { useState } from 'react';
import type { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { SkeletonTableRow } from '../../skeleton/table/table';
import CampaignsFilters from './CampaignsFilters';

interface ResultsProps {
  campaigns: Campaing[];
  filters: any;
  setFilters: (filters: any) => void;
  total: number;
  refetch: () => void;
  isLoading: boolean;
  storeId?: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: 'warning' | 'success' | 'info' | 'primary' | 'error' | 'default' }> = {
  scheduled: { label: 'Scheduled', color: 'warning' },
  completed: { label: 'Completed', color: 'success' },
  draft: { label: 'Draft', color: 'info' },
  active: { label: 'Active', color: 'primary' },
  progress: { label: 'In Progress', color: 'primary' },
  cancelled: { label: 'Cancelled', color: 'error' },
};

const PLATFORM_COLORS: Record<string, string> = {
  bandwidth: '#2196f3',
  infobip: '#e91e63',
  twilio: '#f44336',
};

const getStatusChip = (status: CampaingStatus) => {
  const cfg = STATUS_CONFIG[status] ?? { label: String(status), color: 'default' as const };
  return <Chip size="small" variant="outlined" label={cfg.label} color={cfg.color} />;
};

const getRateColor = (rate: number) =>
  rate >= 90 ? '#10b981' : rate >= 75 ? '#f59e0b' : '#ef4444';

// ─── Mobile Campaign Card ────────────────────────────────────────────────────

interface CampaignCardProps {
  campaign: Campaing;
  onStats: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

const CampaignCard: FC<CampaignCardProps> = ({ campaign, onStats, onEdit, onDelete }) => {
  const theme = useTheme();
  const sent = campaign?.sent ?? 0;
  const audience = campaign?.audience ?? 0;
  const rate = audience > 0 ? Math.round((sent / audience) * 100) : 0;
  const rateColor = getRateColor(rate);

  const localDate = campaign.startDate ? format(new Date(campaign.startDate), 'dd/MM/yy') : '-';
  const nyTime = campaign.startDate
    ? formatInTimeZone(new Date(campaign.startDate), 'America/New_York', 'hh:mm a')
    : null;

  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: 3,
        border: '1px solid',
        borderColor: 'divider',
        overflow: 'hidden',
        transition: 'box-shadow 0.2s',
        '&:hover': { boxShadow: theme.shadows[4] },
      }}
    >
      {/* Rate accent bar */}
      <Box sx={{ height: 3, bgcolor: rateColor }} />

      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        {/* Header: store + chips */}
        <Stack direction="row" spacing={1.5} alignItems="flex-start" mb={1.25}>
          <Avatar
            src={campaign.store?.image}
            sx={{ width: 38, height: 38, borderRadius: 1.5, flexShrink: 0, cursor: 'pointer', border: '1px solid', borderColor: 'divider' }}
            onClick={() => campaign.store?._id && window.open(`/admin/management/stores/edit/${campaign.store._id}`, '_blank')}
          />
          <Box flex={1} minWidth={0}>
            <Typography
              variant="subtitle2"
              fontWeight={800}
              noWrap
              sx={{ cursor: 'pointer', fontSize: 13 }}
              onClick={() => campaign.store?._id && window.open(`/admin/management/stores/edit/${campaign.store._id}`, '_blank')}
            >
              {campaign.store?.name || '-'}
            </Typography>
            <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap mt={0.4}>
              <Chip size="small" label={campaign.type} variant="outlined" sx={{ fontWeight: 700, height: 20, fontSize: 10 }} />
              {getStatusChip(campaign.status)}
              {campaign.platform && (
                <Chip
                  size="small"
                  label={campaign.platform}
                  sx={{
                    height: 20,
                    fontSize: 10,
                    fontWeight: 700,
                    textTransform: 'capitalize',
                    bgcolor: alpha(PLATFORM_COLORS[campaign.platform] ?? '#9e9e9e', 0.12),
                    color: PLATFORM_COLORS[campaign.platform] ?? 'text.secondary',
                  }}
                />
              )}
            </Stack>
          </Box>
        </Stack>

        {/* Metrics row */}
        <Stack
          direction="row"
          spacing={0}
          sx={{ bgcolor: (t) => alpha(t.palette.text.primary, 0.04), borderRadius: 2, p: 1, mb: 1.25 }}
          divider={<Box sx={{ width: '1px', bgcolor: 'divider', mx: 1 }} />}
        >
          <Box flex={1} textAlign="center">
            <Typography variant="caption" color="text.disabled" display="block">Audiencia</Typography>
            <Typography variant="body2" fontWeight={700} fontSize={12}>{audience.toLocaleString()}</Typography>
          </Box>
          <Box flex={1} textAlign="center">
            <Typography variant="caption" color="text.disabled" display="block">Costo</Typography>
            <Typography variant="body2" fontWeight={700} fontSize={12}>{numeral(campaign.cost || 0).format('$0,0.00')}</Typography>
          </Box>
          <Box flex={1} textAlign="center">
            <Typography variant="caption" color="text.disabled" display="block">Entrega</Typography>
            <Typography variant="body2" fontWeight={800} fontSize={13} sx={{ color: rateColor }}>{rate}%</Typography>
          </Box>
        </Stack>

        {/* Date row */}
        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1.25}>
          <Stack direction="row" spacing={0.75} alignItems="center">
            <Typography variant="caption" color="text.secondary" fontWeight={600}>{localDate}</Typography>
            {nyTime && (
              <Chip
                size="small"
                label={`${nyTime} NY`}
                sx={{ height: 18, fontSize: 10, fontWeight: 600, bgcolor: (t) => alpha(t.palette.info.main, 0.1), color: 'info.main' }}
              />
            )}
          </Stack>
        </Stack>

        {/* Actions */}
        <Stack direction="row" spacing={0.5} justifyContent="flex-end">
          <Tooltip title="Ver estadísticas">
            <IconButton size="small" color="info" onClick={() => onStats(campaign._id)}>
              <OpenInNewRounded sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>
          {campaign.status !== 'completed' && (
            <Tooltip title="Editar">
              <IconButton size="small" color="primary" onClick={() => onEdit(campaign._id)}>
                <Edit sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>
          )}
          {campaign.status === 'scheduled' && (
            <Tooltip title="Eliminar">
              <IconButton size="small" color="error" onClick={() => onDelete(campaign._id)}>
                <DeleteRounded sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
};

// ─── Skeleton Card ──────────────────────────────────────────────────────────

const SkeletonCampaignCard = () => (
  <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
    <Box sx={{ height: 3, bgcolor: 'action.selected' }} />
    <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
      <Stack direction="row" spacing={1.5} alignItems="flex-start" mb={1.25}>
        <Skeleton variant="rounded" width={38} height={38} sx={{ borderRadius: 1.5, flexShrink: 0 }} />
        <Box flex={1}>
          <Skeleton width="70%" height={18} />
          <Stack direction="row" spacing={0.5} mt={0.5}>
            <Skeleton variant="rounded" width={44} height={20} sx={{ borderRadius: 1 }} />
            <Skeleton variant="rounded" width={68} height={20} sx={{ borderRadius: 1 }} />
          </Stack>
        </Box>
      </Stack>
      <Skeleton variant="rounded" height={52} sx={{ borderRadius: 2, mb: 1.25 }} />
      <Skeleton width="40%" height={16} sx={{ mb: 1.25 }} />
      <Stack direction="row" justifyContent="flex-end" spacing={0.5}>
        <Skeleton variant="circular" width={30} height={30} />
        <Skeleton variant="circular" width={30} height={30} />
      </Stack>
    </CardContent>
  </Card>
);

// ─── Main Component ──────────────────────────────────────────────────────────

const Results: FC<ResultsProps> = ({
  campaigns,
  filters,
  setFilters,
  total,
  isLoading,
  refetch,
  storeId,
}) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const filtersRef = React.useRef<any>(filters);
  React.useEffect(() => { filtersRef.current = filters; }, [filters]);

  async function exportAllCampaigns(): Promise<void> {
    try {
      const limit = 500;
      let page = 1;
      let all: any[] = [];
      const { campaignClient: svc } = await import('@/services/campaing.service');
      const baseFilters: any = { ...(filtersRef.current || {}) };
      delete baseFilters.page;
      delete baseFilters.limit;
      while (true) {
        const params: any = { ...baseFilters, page, limit };
        const res: any = await svc.getFilteredCampaigns(params);
        const data = res?.data ?? res?.items ?? [];
        all = all.concat(data);
        if (data.length < limit) break;
        page += 1;
        if (page > 5000) break;
      }
      const rows = all.map((c: any) => ({
        store: c?.store?.name ?? '',
        type: c?.type ?? '',
        platform: c?.platform ?? '',
        startDate: c?.startDate ? new Date(c.startDate).toISOString().slice(0, 10) : '',
        nyTime: c?.startDate ? formatInTimeZone(new Date(c.startDate), 'America/New_York', 'hh:mm a') : '',
        audience: c?.audience ?? 0,
        cost: c?.cost ?? 0,
        status: c?.status ?? '',
        deliveryRate: c?.sent && c?.audience ? Math.round((c.sent / c.audience) * 100) : 0,
      }));
      const xlsx = await import('xlsx');
      const ws = xlsx.utils.json_to_sheet(rows);
      const wb = xlsx.utils.book_new();
      xlsx.utils.book_append_sheet(wb, ws, 'Campaigns');
      xlsx.writeFile(wb, 'campaigns_listing.xlsx');
    } catch (err) {
      console.error('Export campaigns failed', err);
      alert('No se pudo exportar campañas. Revisa la consola para detalles.');
    }
  }

  React.useEffect(() => {
    const handler = () => void exportAllCampaigns();
    if (typeof window !== 'undefined') {
      window.addEventListener('campaigns:export', handler);
      return () => window.removeEventListener('campaigns:export', handler);
    }
    return () => { };
  }, []);

  const [selectedToDelete, setSelectedToDelete] = useState<string | null>(null);

  const handleDelete = () => {
    if (!selectedToDelete) return;
    campaignClient.deleteCampaign(selectedToDelete).then(() => {
      setSelectedToDelete(null);
      refetch();
    }).catch((err) => console.error('Error deleting campaign:', err));
  };

  const handleStats = (id: string) => window.open(`/admin/management/campaings/stats/${id}`, '_blank');
  const handleEdit = (id: string) => window.open(`/admin/management/campaings/edit/${id}`);

  const pagination = (
    <Box p={2} display="flex" justifyContent="flex-end">
      <TablePagination
        component="div"
        count={total}
        page={filters.page - 1}
        onPageChange={(_, newPage) => setFilters({ ...filters, page: newPage + 1 })}
        rowsPerPage={filters.limit}
        onRowsPerPageChange={(e) => setFilters({ ...filters, limit: parseInt(e.target.value, 10), page: 1 })}
        rowsPerPageOptions={[5, 10, 15, 25, 50]}
        slotProps={{ select: { variant: 'outlined', size: 'small', sx: { p: 0 } } }}
      />
    </Box>
  );

  return (
    <Card
      sx={{
        borderRadius: 3,
        overflow: 'hidden',
        border: `1px solid ${theme.palette.divider}`,
        boxShadow: `0 12px 32px rgba(0,0,0,0.10)`,
      }}
    >
      <CampaignsFilters filters={filters} setFilters={setFilters} storeId={storeId} />

      {/* Mobile: card grid */}
      {isMobile ? (
        <Box sx={{ p: 2 }}>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' },
              gap: 2,
            }}
          >
            {isLoading
              ? Array.from({ length: 6 }).map((_, i) => <SkeletonCampaignCard key={i} />)
              : campaigns.map((campaign) => (
                <CampaignCard
                  key={campaign._id}
                  campaign={campaign}
                  onStats={handleStats}
                  onEdit={handleEdit}
                  onDelete={(id) => setSelectedToDelete(id)}
                />
              ))}
          </Box>
          {!isLoading && campaigns.length === 0 && (
            <Box textAlign="center" py={6}>
              <Typography color="text.secondary" fontWeight={600}>No hay campañas para los filtros seleccionados</Typography>
            </Box>
          )}
          {pagination}
        </Box>
      ) : (
        /* Desktop: table */
        <>
          <TableContainer sx={{ maxHeight: 720 }}>
            <Table
              stickyHeader
              size="small"
              sx={{
                '& .MuiTableCell-root': { py: 1.05 },
                '& .MuiTableCell-head': { py: 1 },
              }}
            >
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 900, color: 'text.secondary', width: 90 }}>{t('Type')}</TableCell>
                  <TableCell sx={{ fontWeight: 900, color: 'text.secondary', width: 150 }}>{t('Start Date')} (NY)</TableCell>
                  <TableCell sx={{ fontWeight: 900, color: 'text.secondary' }}>{t('Store')}</TableCell>
                  <TableCell sx={{ fontWeight: 900, color: 'text.secondary', width: 90 }}>Provider</TableCell>
                  <TableCell sx={{ fontWeight: 900, color: 'text.secondary', width: 110 }}>{t('Audience')}</TableCell>
                  <TableCell sx={{ fontWeight: 900, color: 'text.secondary', width: 110 }}>{t('Cost')}</TableCell>
                  <TableCell sx={{ fontWeight: 900, color: 'text.secondary', width: 90 }}>ENTREGA</TableCell>
                  <TableCell sx={{ fontWeight: 900, color: 'text.secondary', width: 130 }}>{t('Status')}</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 900, color: 'text.secondary', width: 100 }}>{t('Actions')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {isLoading
                  ? Array.from({ length: 6 }).map((_, i) => <SkeletonTableRow key={i} />)
                  : campaigns.map((campaign) => {
                    const sent = campaign?.sent ?? 0;
                    const audience = campaign?.audience ?? 0;
                    const rate = audience > 0 ? Math.round((sent / audience) * 100) : 0;
                    const rateColor = getRateColor(rate);
                    const localDate = campaign.startDate ? format(new Date(campaign.startDate), 'dd/MM/yy') : '-';
                    const nyTime = campaign.startDate
                      ? formatInTimeZone(new Date(campaign.startDate), 'America/New_York', 'hh:mm a')
                      : null;
                    const platformColor = campaign.platform ? (PLATFORM_COLORS[campaign.platform] ?? '#9e9e9e') : null;

                    return (
                      <TableRow key={campaign._id} hover sx={{ '&:hover': { bgcolor: theme.palette.action.hover } }}>
                        <TableCell>
                          <Chip size="small" label={campaign.type} variant="outlined" sx={{ fontWeight: 900 }} />
                        </TableCell>

                        <TableCell>
                          <Typography variant="body2" fontWeight={600} noWrap>{localDate}</Typography>
                          {nyTime && (
                            <Typography variant="caption" color="info.main" fontWeight={600} noWrap display="block">
                              {nyTime} NY
                            </Typography>
                          )}
                        </TableCell>

                        <TableCell sx={{ maxWidth: 360 }}>
                          <Box display="flex" alignItems="center" gap={1.25} sx={{ minWidth: 0 }}>
                            <Avatar
                              sx={{ width: 34, height: 34, cursor: 'pointer', border: `1px solid ${theme.palette.divider}`, flexShrink: 0 }}
                              src={campaign.store?.image}
                              onClick={() => campaign.store?._id && window.open(`/admin/management/stores/edit/${campaign.store._id}`, '_blank')}
                            />
                            <Typography
                              variant="subtitle2"
                              fontWeight={800}
                              onClick={() => campaign.store?._id && window.open(`/admin/management/stores/edit/${campaign.store._id}`, '_blank')}
                              title={campaign.store?.name || ''}
                              sx={{
                                cursor: 'pointer', lineHeight: 1.2, minWidth: 0,
                                display: '-webkit-box', WebkitBoxOrient: 'vertical', WebkitLineClamp: 2,
                                overflow: 'hidden', textOverflow: 'ellipsis', wordBreak: 'break-word',
                              }}
                            >
                              {campaign.store?.name || '-'}
                            </Typography>
                          </Box>
                        </TableCell>

                        <TableCell>
                          {campaign.platform ? (
                            <Stack direction="row" spacing={0.75} alignItems="center">
                              <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: platformColor ?? '#9e9e9e', flexShrink: 0 }} />
                              <Typography variant="caption" fontWeight={700} textTransform="capitalize" noWrap>
                                {campaign.platform}
                              </Typography>
                            </Stack>
                          ) : (
                            <Typography variant="caption" color="text.disabled">—</Typography>
                          )}
                        </TableCell>

                        <TableCell>
                          <Typography variant="body2" noWrap>{(campaign.audience ?? 0).toLocaleString()}</Typography>
                        </TableCell>

                        <TableCell>
                          <Typography variant="body2" fontWeight={900}>{numeral(campaign.cost || 0).format('$0,0.00')}</Typography>
                        </TableCell>

                        <TableCell>
                          <Typography variant="body2" fontWeight={900} sx={{ color: rateColor }}>{`${rate}%`}</Typography>
                        </TableCell>

                        <TableCell>{getStatusChip(campaign.status)}</TableCell>

                        <TableCell align="center">
                          <Stack direction="row" spacing={0.5} justifyContent="center">
                            <Tooltip title={t('Go to Stats')} arrow>
                              <IconButton onClick={() => handleStats(campaign._id)} color="info" size="small">
                                <OpenInNewRounded fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            {campaign.status !== 'completed' && (
                              <Tooltip title={t('Edit Campaign')} arrow>
                                <IconButton onClick={() => handleEdit(campaign._id)} color="primary" size="small">
                                  <Edit fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}
                            {campaign.status === 'scheduled' && (
                              <Tooltip title={t('Delete Campaign')} arrow>
                                <IconButton onClick={() => setSelectedToDelete(campaign._id)} color="error" size="small">
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
          {pagination}
        </>
      )}

      {/* Delete confirmation */}
      <Dialog open={Boolean(selectedToDelete)} onClose={() => setSelectedToDelete(null)}>
        <DialogTitle>¿Estás seguro?</DialogTitle>
        <DialogContent>
          <Typography>¿Deseas eliminar esta campaña programada?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedToDelete(null)}>Cancelar</Button>
          <Button onClick={handleDelete} color="error" startIcon={<DeleteRounded />} variant="contained">
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
};

export default Results;
