import TestCampaignModal from '@/components/application-ui/dialogs/test-campaign-modal';
import { Campaing, CampaingStatus } from '@/models/campaing';
import { campaignClient } from '@/services/campaing.service';
import { DeleteRounded, Edit, OpenInNewRounded } from '@mui/icons-material';
import BugReportRoundedIcon from '@mui/icons-material/BugReportRounded';
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
  IconButton,
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

const getInvoiceStatusLabel = (campaignStatus: CampaingStatus): React.JSX.Element => {
  const map: Partial<
    Record<
      CampaingStatus,
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
      size="small"
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
  const { t } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Mantener filtros vigentes accesibles a handlers (export)
  const filtersRef = React.useRef<any>(filters);
  React.useEffect(() => {
    filtersRef.current = filters;
  }, [filters]);

  async function exportAllCampaigns(): Promise<void> {
    try {
      const limit = 500;
      let page = 1;
      let all: any[] = [];

      const { campaignClient: svc } = await import('@/services/campaing.service');

      const baseFilters: any = { ...(filtersRef.current || {}) };
      delete baseFilters.page;
      delete baseFilters.limit;

      // eslint-disable-next-line no-constant-condition
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

  React.useEffect(() => {
    const handler = () => void exportAllCampaigns();
    if (typeof window !== 'undefined') {
      window.addEventListener('campaigns:export', handler);
      return () => window.removeEventListener('campaigns:export', handler);
    }
    return () => {};
  }, []);

  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [selectedToDelete, setSelectedToDelete] = useState<string | null>(null);

  const [testModalOpen, setTestModalOpen] = useState(false);
  const [selectedCampaignForTest, setSelectedCampaignForTest] = useState<Campaing | null>(null);

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
    if (!id) return;
    window.open(`/admin/management/stores/edit/${id}`, '_blank');
  };

  const handleCampaingRedirect = (id: string) => {
    if (!id) return;
    window.open(`/admin/management/campaings/stats/${id}`, '_blank');
  };

  const handleCampaingEditRedirect = (id: string) => {
    if (!id) return;
    window.open(`/admin/management/campaings/edit/${id}`);
  };

  const MobileList = () => (
    <Stack
      spacing={1.25}
      sx={{ p: 1.25 }}
    >
      {isLoading
        ? Array.from({ length: 4 }).map((_, i) => (
            <Card
              key={i}
              variant="outlined"
              sx={{ borderRadius: 2.5, p: 1.5 }}
            >
              <Stack spacing={1}>
                <Box sx={{ height: 18, width: '72%', bgcolor: 'action.hover', borderRadius: 1 }} />
                <Box sx={{ height: 14, width: '48%', bgcolor: 'action.hover', borderRadius: 1 }} />
                <Box sx={{ height: 42, bgcolor: 'action.hover', borderRadius: 1.5 }} />
              </Stack>
            </Card>
          ))
        : campaigns.map((campaign) => {
            const sent = campaign?.sent ?? 0;
            const audience = campaign?.audience ?? 0;
            const rate = audience > 0 ? Math.round((sent / audience) * 100) : 0;
            const rateColor = rate >= 90 ? '#04b410ff' : rate >= 85 ? '#FB8C00' : '#FF4F4F';

            return (
              <Card
                key={campaign._id}
                variant="outlined"
                sx={{ borderRadius: 2.5, overflow: 'hidden' }}
              >
                <Box sx={{ p: 1.5 }}>
                  <Stack
                    direction="row"
                    spacing={1.25}
                    alignItems="center"
                  >
                    <Avatar
                      src={campaign.store?.image}
                      sx={{
                        width: 42,
                        height: 42,
                        cursor: 'pointer',
                        border: `1px solid ${theme.palette.divider}`,
                        flex: '0 0 auto',
                      }}
                      onClick={() => handleStoreRedirect(campaign.store?._id || '')}
                    />

                    <Box sx={{ minWidth: 0, flex: 1 }}>
                      <Typography
                        fontWeight={900}
                        title={campaign.store?.name || ''}
                        onClick={() => handleStoreRedirect(campaign.store?._id || '')}
                        sx={{
                          cursor: 'pointer',
                          fontSize: 14,
                          lineHeight: 1.15,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {campaign.store?.name || '-'}
                      </Typography>

                      <Stack
                        direction="row"
                        spacing={0.75}
                        alignItems="center"
                        sx={{ mt: 0.5 }}
                      >
                        <Chip
                          size="small"
                          label={campaign.type || '-'}
                          variant="outlined"
                          sx={{ height: 22, fontSize: 11, fontWeight: 900 }}
                        />
                        {getInvoiceStatusLabel(campaign.status)}
                      </Stack>
                    </Box>
                  </Stack>

                  <Divider sx={{ my: 1.25 }} />

                  <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
                    <Box>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                      >
                        {t('Start Date')}
                      </Typography>
                      <Typography
                        fontWeight={900}
                        sx={{ fontSize: 13 }}
                      >
                        {campaign.startDate
                          ? format(new Date(campaign.startDate), 'dd/MM/yyyy')
                          : '-'}
                      </Typography>
                    </Box>

                    <Box>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                      >
                        {t('Audience')}
                      </Typography>
                      <Typography
                        fontWeight={900}
                        sx={{ fontSize: 13 }}
                      >
                        {numeral(campaign.audience ?? 0).format('0,0')}
                      </Typography>
                    </Box>

                    <Box>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                      >
                        {t('Cost')}
                      </Typography>
                      <Typography
                        fontWeight={900}
                        sx={{ fontSize: 13 }}
                      >
                        {numeral(campaign.cost || 0).format(`$0,0.00`)}
                      </Typography>
                    </Box>

                    <Box>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                      >
                        ENTREGA
                      </Typography>
                      <Typography
                        fontWeight={900}
                        sx={{ fontSize: 13, color: rateColor }}
                      >
                        {`${rate}%`}
                      </Typography>
                    </Box>
                  </Box>

                  <Stack
                    direction="row"
                    spacing={1}
                    justifyContent="flex-end"
                    sx={{ mt: 1.25 }}
                  >
                    <Tooltip
                      title={t('Go to Stats')}
                      arrow
                    >
                      <IconButton
                        size="small"
                        onClick={() => handleCampaingRedirect(campaign._id || '')}
                        color="info"
                      >
                        <OpenInNewRounded fontSize="small" />
                      </IconButton>
                    </Tooltip>

                    {campaign.status !== 'completed' && (
                      <Tooltip
                        title={t('Test Internal')}
                        arrow
                      >
                        <IconButton
                          size="small"
                          onClick={() => {
                            setSelectedCampaignForTest(campaign);
                            setTestModalOpen(true);
                          }}
                          color="warning"
                        >
                          <BugReportRoundedIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}

                    {campaign.status !== 'completed' && (
                      <Tooltip
                        title={t('Edit Campaign')}
                        arrow
                      >
                        <IconButton
                          size="small"
                          onClick={() => handleCampaingEditRedirect(campaign._id || '')}
                          color="primary"
                        >
                          <Edit fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}

                    {campaign.status === 'scheduled' && (
                      <Tooltip
                        title={t('Delete Campaign')}
                        arrow
                      >
                        <IconButton
                          size="small"
                          onClick={() => setSelectedToDelete(campaign._id)}
                          color="error"
                        >
                          <DeleteRounded fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Stack>
                </Box>
              </Card>
            );
          })}
    </Stack>
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
      <CampaignsFilters
        filters={filters}
        setFilters={setFilters}
        storeId={storeId}
      />

      {isMobile ? (
        <MobileList />
      ) : (
        <TableContainer sx={{ maxHeight: 720 }}>
          <Table
            stickyHeader
            size="small"
            sx={{
              '& .MuiTableCell-root': { py: 1.05 }, // ✅ compact rows
              '& .MuiTableCell-head': { py: 1 }, // ✅ compact header
            }}
          >
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 900, color: 'text.secondary', width: 90 }}>
                  {t('Type')}
                </TableCell>

                <TableCell sx={{ fontWeight: 900, color: 'text.secondary', width: 120 }}>
                  {t('Start Date')}
                </TableCell>

                <TableCell
                  sx={{
                    fontWeight: 900,
                    color: 'text.secondary',
                    width: { xs: 260, sm: 420, md: 560 },
                    maxWidth: { xs: 260, sm: 420, md: 560 },
                  }}
                >
                  {t('Store')}
                </TableCell>

                {!isMobile && (
                  <TableCell sx={{ fontWeight: 900, color: 'text.secondary', width: 110 }}>
                    {t('Audience')}
                  </TableCell>
                )}

                <TableCell sx={{ fontWeight: 900, color: 'text.secondary', width: 110 }}>
                  {t('Cost')}
                </TableCell>

                {!isMobile && (
                  <TableCell sx={{ fontWeight: 900, color: 'text.secondary', width: 110 }}>
                    ENTREGA
                  </TableCell>
                )}

                <TableCell sx={{ fontWeight: 900, color: 'text.secondary', width: 130 }}>
                  {t('Status')}
                </TableCell>

                <TableCell
                  align="center"
                  sx={{ fontWeight: 900, color: 'text.secondary', width: 120 }}
                >
                  {t('Actions')}
                </TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {isLoading
                ? Array.from({ length: 6 }).map((_, i) => <SkeletonTableRow key={i} />)
                : campaigns.map((campaign) => {
                    const selected = selectedItems.includes(campaign._id);

                    const sent = campaign?.sent ?? 0;
                    const audience = campaign?.audience ?? 0;
                    const rate = audience > 0 ? Math.round((sent / audience) * 100) : 0;
                    const rateColor = rate >= 90 ? '#04b410ff' : rate >= 85 ? '#FB8C00' : '#FF4F4F';

                    return (
                      <TableRow
                        key={campaign._id}
                        selected={selected}
                        hover
                        sx={{
                          '&:hover': { backgroundColor: theme.palette.action.hover },
                        }}
                      >
                        <TableCell>
                          <Chip
                            size="small"
                            label={campaign.type}
                            variant="outlined"
                            sx={{ fontWeight: 900 }}
                          />
                        </TableCell>

                        <TableCell>
                          <Typography
                            noWrap
                            variant="body2"
                            fontWeight={600}
                          >
                            {campaign.startDate
                              ? format(new Date(campaign.startDate), 'dd/MM/yyyy')
                              : '-'}
                          </Typography>
                        </TableCell>

                        {/* ✅ Store cell: 2 lines clamp (NO SLUG, NO H-scroll) */}
                        <TableCell sx={{ maxWidth: { xs: 260, sm: 420, md: 560 } }}>
                          <Box
                            display="flex"
                            alignItems="center"
                            gap={1.25}
                            sx={{ minWidth: 0 }}
                          >
                            <Avatar
                              sx={{
                                width: 34,
                                height: 34,
                                cursor: 'pointer',
                                border: `1px solid ${theme.palette.divider}`,
                                flex: '0 0 auto',
                              }}
                              src={campaign.store?.image}
                              onClick={() => handleStoreRedirect(campaign.store?._id || '')}
                            />

                            <Typography
                              variant="subtitle2"
                              fontWeight={800}
                              onClick={() => handleStoreRedirect(campaign.store?._id || '')}
                              title={campaign.store?.name || ''}
                              sx={{
                                cursor: 'pointer',
                                lineHeight: 1.2,
                                minWidth: 0,

                                // ✅ clamp 2 lines
                                display: '-webkit-box',
                                WebkitBoxOrient: 'vertical',
                                WebkitLineClamp: 2,

                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                wordBreak: 'break-word',
                              }}
                            >
                              {campaign.store?.name || '-'}
                            </Typography>
                          </Box>
                        </TableCell>

                        {!isMobile && (
                          <TableCell>
                            <Typography
                              noWrap
                              variant="body2"
                            >
                              {campaign.audience ?? 0}
                            </Typography>
                          </TableCell>
                        )}

                        <TableCell>
                          <Typography
                            variant="body2"
                            fontWeight={900}
                          >
                            {numeral(campaign.cost || 0).format(`$0,0.00`)}
                          </Typography>
                        </TableCell>

                        {!isMobile && (
                          <TableCell>
                            <Typography
                              variant="body2"
                              fontWeight={900}
                              sx={{ color: rateColor }}
                            >
                              {`${rate}%`}
                            </Typography>
                          </TableCell>
                        )}

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
                                title={t('Test Internal')}
                                arrow
                              >
                                <IconButton
                                  onClick={() => {
                                    setSelectedCampaignForTest(campaign);
                                    setTestModalOpen(true);
                                  }}
                                  color="warning"
                                >
                                  <BugReportRoundedIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}

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
                                title={t('Delete Campaign')}
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
      )}

      <Box
        sx={{
          p: { xs: 1.25, sm: 2 },
          display: 'flex',
          justifyContent: { xs: 'center', sm: 'flex-end' },
        }}
      >
        <TablePagination
          component="div"
          count={total}
          page={filters.page - 1}
          onPageChange={(e, newPage) => setFilters({ ...filters, page: newPage + 1 })}
          rowsPerPage={filters.limit}
          onRowsPerPageChange={(e) =>
            setFilters({ ...filters, limit: parseInt(e.target.value, 10), page: 1 })
          }
          rowsPerPageOptions={[5, 10, 15, 50]}
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

      <TestCampaignModal
        open={testModalOpen}
        onClose={() => setTestModalOpen(false)}
        campaignId={selectedCampaignForTest?._id || null}
        campaignContent={selectedCampaignForTest?.content || ''}
        campaignImage={selectedCampaignForTest?.image}
        storeName={selectedCampaignForTest?.store?.name}
      />
    </Card>
  );
};

export default Results;
