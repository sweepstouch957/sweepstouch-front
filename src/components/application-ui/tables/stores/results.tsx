import { Store } from '@/services/store.service';
import {
  DeleteTwoTone as DeleteIcon,
  DeleteRounded,
  LaunchTwoTone as LaunchIcon,
  MoreVertRounded,
  SearchTwoTone as SearchIcon,
} from '@mui/icons-material';
import {
  Box,
  Card,
  Checkbox,
  IconButton,
  InputAdornment,
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
  useMediaQuery,
  useTheme,
} from '@mui/material';
import debounce from 'lodash.debounce';
import Link from 'next/link';
import { ChangeEvent, FC, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ButtonIcon } from 'src/components/base/styles/button-icon';
import { ButtonSoft } from 'src/components/base/styles/button-soft';

const LogoImg = ({ src }: { src: string }) => (
  <Box
    component="img"
    src={src}
    alt="store logo"
    sx={{ width: 48, height: 48, borderRadius: 1 }}
  />
);

interface ResultsProps {
  stores: Store[];
  page: number;
  limit: number;
  total: number;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
  onSearchChange: (query: string) => void;
  loading?: boolean;
  error?: string | null;
}

const Results: FC<ResultsProps> = ({
  stores,
  page,
  limit,
  total,
  onPageChange,
  onLimitChange,
  onSearchChange,
  loading,
  error,
}) => {
  const [selectedItems, setSelected] = useState<string[]>([]);
  const [query, setQuery] = useState('');
  const { t } = useTranslation();
  const theme = useTheme();

  const handleQueryChange = (event: ChangeEvent<HTMLInputElement>): void => {
    setQuery(event.target.value);
    debouncedSearch(event.target.value);
  };

  const debouncedSearch = useMemo(
    () => debounce((value: string) => onSearchChange(value), 500),
    [onSearchChange]
  );

  useEffect(() => {
    return () => debouncedSearch.cancel();
  }, [debouncedSearch]);

  const handleSelectAll = (event: ChangeEvent<HTMLInputElement>): void => {
    setSelected(event.target.checked ? stores.map((s) => s.id) : []);
  };

  const handleSelectOne = (event: ChangeEvent<HTMLInputElement>, id: string): void => {
    if (!selectedItems.includes(id)) {
      setSelected((prev) => [...prev, id]);
    } else {
      setSelected((prev) => prev.filter((item) => item !== id));
    }
  };

  const handlePageChange = (_: any, newPage: number): void => {
    onPageChange(newPage);
  };

  const handleLimitChange = (event: ChangeEvent<HTMLInputElement>): void => {
    onLimitChange(parseInt(event.target.value));
    onPageChange(0);
  };

  const selectedAll = selectedItems.length === stores.length;
  const selectedSome = selectedItems.length > 0 && selectedItems.length < stores.length;
  const hasSelection = selectedItems.length > 0;

  return (
    <>
      <Box
        display="flex"
        pb={2}
        alignItems="center"
        justifyContent="space-between"
      >
        {hasSelection ? (
          <>
            <ButtonSoft
              color="error"
              variant="contained"
              startIcon={<DeleteRounded />}
            >
              Delete selected
            </ButtonSoft>
            <ButtonIcon
              color="secondary"
              startIcon={<MoreVertRounded />}
            />
          </>
        ) : (
          <Box
            flex={1}
            display={{ xs: 'block', md: 'flex' }}
            alignItems="center"
            justifyContent="space-between"
          >
            <TextField
              size="small"
              fullWidth={useMediaQuery(theme.breakpoints.down('md'))}
              onChange={handleQueryChange}
              value={query}
              placeholder={t('Filter by store name or zip')}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
              sx={{ my: '2px' }}
            />
          </Box>
        )}
      </Box>

      {loading ? (
        <Typography
          align="center"
          sx={{ py: 5 }}
        >
          {t('Loading stores...')}
        </Typography>
      ) : error ? (
        <Typography
          align="center"
          color="error"
          sx={{ py: 5 }}
        >
          {t('Error fetching stores')}: {error}
        </Typography>
      ) : stores.length === 0 ? (
        <Typography
          py={6}
          variant="h3"
          color="text.secondary"
          align="center"
        >
          {t('No stores found')}
        </Typography>
      ) : (
        <>
          <Card>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={selectedAll}
                        indeterminate={selectedSome}
                        onChange={handleSelectAll}
                      />
                    </TableCell>
                    <TableCell>{t('Brand')}</TableCell>
                    <TableCell>{t('Store name')}</TableCell>
                    <TableCell>{t('Address')}</TableCell>
                    <TableCell>{t('Zip code')}</TableCell>
                    <TableCell align="center">{t('Status')}</TableCell>
                    <TableCell align="center">{t('Actions')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {stores.map((store) => {
                    const isSelected = selectedItems.includes(store.id);
                    return (
                      <TableRow
                        hover
                        key={store.id}
                        selected={isSelected}
                      >
                        <TableCell padding="checkbox">
                          <Checkbox
                            checked={isSelected}
                            onChange={(e) => handleSelectOne(e, store.id)}
                          />
                        </TableCell>
                        <TableCell>
                          <LogoImg src={store.image} />
                        </TableCell>
                        <TableCell>
                          <Typography variant="h5">{store.name}</Typography>
                        </TableCell>
                        <TableCell>{store.address}</TableCell>
                        <TableCell>{store.zipCode}</TableCell>
                        <TableCell align="center">
                          <Typography color={store.active ? 'success.main' : 'error.main'}>
                            {store.active ? t('Active') : t('Inactive')}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Tooltip
                            title={t('View')}
                            arrow
                          >
                            <Link
                              href={`/blueprints/generic-admin-dashboard/management/stores/edit/${store.id}`}
                              passHref
                            >
                              <IconButton color="primary">
                                <LaunchIcon fontSize="small" />
                              </IconButton>
                            </Link>
                          </Tooltip>
                          <Tooltip
                            title={t('Delete')}
                            arrow
                          >
                            <IconButton color="secondary">
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>

          <Box p={2}>
            <TablePagination
              component="div"
              count={total}
              page={page}
              rowsPerPage={limit}
              onPageChange={handlePageChange}
              onRowsPerPageChange={handleLimitChange}
              rowsPerPageOptions={[5, 10, 25, 50]}
            />
          </Box>
        </>
      )}
    </>
  );
};

export default Results;
