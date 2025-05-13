import { Campaing, CampaingStatus } from '@/models/campaing';
import { DeleteRounded } from '@mui/icons-material';
import ClearRoundedIcon from '@mui/icons-material/ClearRounded';
import DeleteTwoToneIcon from '@mui/icons-material/DeleteTwoTone';
import LaunchTwoToneIcon from '@mui/icons-material/LaunchTwoTone';
import SearchTwoToneIcon from '@mui/icons-material/SearchTwoTone';
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
import { format } from 'date-fns';
import numeral from 'numeral';
import type { ChangeEvent, FC } from 'react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ButtonSoft } from 'src/components/base/styles/button-soft';

interface ResultsProps {
  campaigns: Campaing[];
  filters: any;
  setFilters: (filters: any) => void;
  total: number;
  refetch: () => void;
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
      sx={{ borderRadius: (theme) => theme.shape.borderRadius }}
    />
  );
};

const Results: FC<ResultsProps> = ({ campaigns, filters, setFilters, total }) => {
  const { t } = useTranslation();
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  const statusOptions = [
    { id: 'all', name: 'Show all' },
    { id: 'active', name: t('Active') },
    { id: 'completed', name: t('Completed') },
    { id: 'draft', name: t('Draft') },
    { id: 'scheduled', name: t('Scheduled') },
  ];

  const handleStatusChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value === 'all' ? '' : e.target.value;
    setFilters({ ...filters, status: value, page: 1 });
  };

  const handleQueryChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFilters({ ...filters, storeName: e.target.value, page: 1 });
  };

  const handlePageChange = (_: any, newPage: number) => {
    setFilters({ ...filters, page: newPage + 1 });
  };

  const handleLimitChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFilters({ ...filters, limit: parseInt(e.target.value), page: 1 });
  };

  const handleSelectAll = (e: ChangeEvent<HTMLInputElement>) => {
    setSelectedItems(e.target.checked ? campaigns.map((c) => c._id) : []);
  };

  const handleSelectOne = (_: any, id: string) => {
    setSelectedItems((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  const selectedAll = selectedItems.length === campaigns.length;
  const selectedSome = selectedItems.length > 0 && selectedItems.length < campaigns.length;

  return (
    <Card>
      <Box
        py={2}
        pl={1}
        pr={2}
        display="flex"
        alignItems="center"
        justifyContent="space-between"
      >
        <Stack
          direction="row"
          spacing={1}
          alignItems="center"
        >
          <Checkbox
            checked={selectedAll}
            indeterminate={selectedSome}
            onChange={handleSelectAll}
            disabled={campaigns.length === 0}
          />
          {selectedItems.length > 0 ? (
            <ButtonSoft
              color="error"
              variant="contained"
              size="small"
              startIcon={<DeleteRounded />}
            >
              Delete selected
            </ButtonSoft>
          ) : (
            <Box>
              <Typography
                component="span"
                variant="subtitle1"
              >
                {t('Showing')}:
              </Typography>{' '}
              <b>{campaigns.length}</b> <b>{t('Campaings')}</b>
            </Box>
          )}
        </Stack>
        <Stack
          direction="row"
          spacing={1}
        >
          <FormControl
            size="small"
            variant="outlined"
          >
            <Select
              value={filters.status || 'all'}
              onChange={handleStatusChange}
            >
              {statusOptions.map((opt) => (
                <MenuItem
                  key={opt.id}
                  value={opt.id}
                >
                  {opt.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            size="small"
            placeholder={t('Filter by Store name')}
            value={filters.storeName}
            onChange={handleQueryChange}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchTwoToneIcon />
                </InputAdornment>
              ),
              endAdornment: filters.storeName && (
                <InputAdornment
                  position="end"
                  sx={{ mr: -0.7 }}
                >
                  <IconButton
                    color="error"
                    onClick={() => setFilters({ ...filters, storeName: '', page: 1 })}
                    edge="end"
                    size="small"
                    sx={{ color: 'error.main' }}
                  >
                    <ClearRoundedIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ),
            }}
            variant="outlined"
          />
        </Stack>
      </Box>
      <Divider />

      {campaigns.length === 0 ? (
        <Typography
          sx={{ py: { xs: 2, sm: 3, md: 6, lg: 10 } }}
          variant="h3"
          color="text.secondary"
          fontWeight={500}
          align="center"
        >
          {t("We couldn't find any campaigns matching your search criteria")}
        </Typography>
      ) : (
        <>
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
                {campaigns.map((campaign) => {
                  const selected = selectedItems.includes(campaign._id);
                  return (
                    <TableRow
                      key={campaign._id}
                      selected={selected}
                      hover
                    >
                      <TableCell>
                        <Box
                          display="flex"
                          alignItems="center"
                        >
                          <Checkbox
                            checked={selected}
                            onChange={(e) => handleSelectOne(e, campaign._id)}
                          />
                          <Box pl={1}>
                            <Typography
                              noWrap
                              variant="subtitle2"
                            >
                              {campaign.type}
                            </Typography>
                          </Box>
                        </Box>
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
                            sx={{ mr: 1, width: 38, height: 38 }}
                            src={campaign.store?.image}
                          />
                          <Typography
                            variant="h6"
                            fontWeight={500}
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
                          title={t('View')}
                          arrow
                        >
                          <IconButton color="primary">
                            <LaunchTwoToneIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip
                          title={t('Delete')}
                          arrow
                        >
                          <IconButton color="error">
                            <DeleteTwoToneIcon fontSize="small" />
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
              onPageChange={handlePageChange}
              rowsPerPage={filters.limit}
              onRowsPerPageChange={handleLimitChange}
              rowsPerPageOptions={[5, 10, 15]}
              slotProps={{
                select: {
                  variant: 'outlined',
                  size: 'small',
                  sx: { p: 0 },
                },
              }}
            />
          </Box>
        </>
      )}
    </Card>
  );
};

export default Results;
