import { Campaing, CampaingStatus } from '@/models/campaing';
import {
  ClearRounded as ClearIcon,
  DeleteRounded,
  OpenInNewRounded,
  SearchTwoTone,
} from '@mui/icons-material';
import {
  Avatar,
  Box,
  Card,
  Checkbox,
  Chip,
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
import { ButtonSoft } from 'src/components/base/styles/button-soft';
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
  const map = {
    scheduled: { text: 'Scheduled', color: 'warning' },
    completed: { text: 'Completed', color: 'success' },
    draft: { text: 'Draft', color: 'info' },
    active: { text: 'Active', color: 'primary' },
  };
  const { text, color }: any = map[campaignStatus];

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
  storeId,
}) => {
  const { t } = useTranslation();
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  const handleStoreRedirect = (storeId: string) => {
    window.open(`/admin/management/stores/edit/${storeId}`, '_blank');
  };

  const handleCampaingRedirect = (storeId: string) => {
    window.open(`/admin/management/campaings/stats/${storeId}`, '_blank');
  };

  const selectedAll = selectedItems.length === campaigns.length;
  const selectedSome = selectedItems.length > 0 && selectedItems.length < campaigns.length;

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
                            onClick={() => handleStoreRedirect(campaign.store?.id || '')}
                          />
                          <Typography
                            variant="h6"
                            fontWeight={500}
                            sx={{ cursor: 'pointer' }}
                            onClick={() => handleStoreRedirect(campaign.store?.id || '')}
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
                        <Tooltip
                          title={t('Go to store')}
                          arrow
                        >
                          <IconButton
                            onClick={() => handleCampaingRedirect(campaign._id || '')}
                            color="info"
                          >
                            <OpenInNewRounded fontSize="small" />
                          </IconButton>
                        </Tooltip>
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
            setFilters({ ...filters, limit: parseInt(e.target.value), page: 1 })
          }
          rowsPerPageOptions={[5, 10, 15]}
          slotProps={{ select: { variant: 'outlined', size: 'small', sx: { p: 0 } } }}
        />
      </Box>
    </Card>
  );
};

export default Results;
