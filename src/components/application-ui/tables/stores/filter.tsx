import {
  GroupTwoTone,
  SearchTwoTone,
  SwapVertTwoTone,
  WarningAmberTwoTone,
} from '@mui/icons-material';
import {
  Box,
  Chip,
  FormControl,
  InputAdornment,
  InputLabel,
  MenuItem,
  OutlinedInput,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';

export default function StoreFilters({
  t,
  search,
  status,
  audienceLt,
  total,

  debtStatus,
  minDebt,
  maxDebt,

  // 🆕 sort
  sortBy,
  order,
  onSortChange,
  onOrderChange,

  handleSearchChange,
  onStatusChange,
  onAudienceLtChange,
  onDebtStatusChange,
  onMinDebtChange,
  onMaxDebtChange,
}: {
  t: (k: string) => string;
  search: string;
  status: 'all' | 'active' | 'inactive';
  audienceLt: string;
  total: number;

  debtStatus: 'all' | 'ok' | 'high' | 'low';
  minDebt: string;
  maxDebt: string;

  sortBy: 'customerCount' | 'name' | 'active' | 'maxDaysOverdue' | string;
  order: 'asc' | 'desc';
  onSortChange: (v: 'customerCount' | 'name' | 'active' | 'maxDaysOverdue' | string) => void;
  onOrderChange: (v: 'asc' | 'desc') => void;

  handleSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onStatusChange: (s: 'all' | 'active' | 'inactive') => void;
  onAudienceLtChange: (v: string) => void;
  onDebtStatusChange: (v: 'all' | 'ok' | 'low' | 'high') => void;
  onMinDebtChange: (v: string) => void;
  onMaxDebtChange: (v: string) => void;
}) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const onlyDigits = (v: string) => v.replace(/\D/g, '');

  const filtersActive =
    search.trim() || status !== 'all' || audienceLt || debtStatus !== 'all' || minDebt || maxDebt;

  const handleOrderToggle = () => onOrderChange(order === 'asc' ? 'desc' : 'asc');

  return (
    <Box
      component={Paper}
      elevation={0}
      sx={{
        p: { xs: 2, sm: 3 },
        borderRadius: 3,
        mb: 2,
        border: `1px solid ${theme.palette.divider}`,
        background:
          theme.palette.mode === 'light'
            ? 'linear-gradient(135deg, #fdfbff 0%, #f4f7ff 60%, #fdfdfd 100%)'
            : 'linear-gradient(135deg, #101322 0%, #151827 60%, #111318 100%)',
      }}
    >
      <Stack spacing={2.5}>
        {/* Header pequeño */}
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          spacing={2}
        >
          <Typography
            variant="subtitle1"
            fontWeight={600}
          >
            {t('Store filters')}
          </Typography>

          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
          >
            {/* 🆕 Sort by + order */}
            <FormControl
              size="small"
              sx={{ minWidth: 180 }}
            >
              <InputLabel>{t('Sort by')}</InputLabel>
              <Select
                value={sortBy}
                onChange={(e) => onSortChange(e.target.value as any)}
                input={<OutlinedInput label={t('Sort by')} />}
              >
                <MenuItem value="customerCount">{t('Customers')}</MenuItem>
                <MenuItem value="maxDaysOverdue">{t('Days overdue')}</MenuItem>
                <MenuItem value="name">{t('Store name')}</MenuItem>
                <MenuItem value="active">{t('Status')}</MenuItem>
              </Select>
            </FormControl>

            <Chip
              size="small"
              icon={<SwapVertTwoTone fontSize="small" />}
              label={order === 'asc' ? t('Asc') : t('Desc')}
              variant="outlined"
              onClick={handleOrderToggle}
            />

            {filtersActive && (
              <Chip
                size="small"
                label={`${t('Results')}: ${total}`}
                color="primary"
                variant="outlined"
              />
            )}
          </Stack>
        </Stack>

        {/* 🔍 Primera fila */}
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2}
          alignItems={{ xs: 'stretch', sm: 'center' }}
        >
          <TextField
            size="small"
            placeholder={t('Search by store name or zip')}
            value={search}
            onChange={handleSearchChange}
            fullWidth
            InputProps={
              {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchTwoTone fontSize="small" />
                  </InputAdornment>
                ),
              } as any
            }
          />

          <TextField
            size="small"
            value={audienceLt}
            onChange={(e) => onAudienceLtChange(onlyDigits(e.target.value))}
            label={t('Audience <')}
            sx={{ minWidth: 150 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <GroupTwoTone fontSize="small" />
                </InputAdornment>
              ),
            }}
          />

          <FormControl
            size="small"
            sx={{ minWidth: 150 }}
          >
            <InputLabel>{t('Status')}</InputLabel>
            <Select
              value={status}
              onChange={(e) => onStatusChange(e.target.value as any)}
              input={<OutlinedInput label={t('Status')} />}
            >
              <MenuItem value="all">{t('All')}</MenuItem>
              <MenuItem value="active">{t('Active')}</MenuItem>
              <MenuItem value="inactive">{t('Inactive')}</MenuItem>
            </Select>
          </FormControl>
        </Stack>

        {/* 💸 Segunda fila – Morosidad */}
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2}
          alignItems={{ xs: 'flex-start', sm: 'center' }}
        >
          {/* Chip group de estado de deuda */}
          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
            flexWrap="wrap"
          >
            <WarningAmberTwoTone
              fontSize="small"
              color="warning"
              style={{ marginRight: 4 }}
            />
            <Typography
              variant="body2"
              sx={{ mr: 1 }}
            >
              {t('Debt status')}:
            </Typography>

            <Chip
              size="small"
              label={t('All')}
              variant={debtStatus === 'all' ? 'filled' : 'outlined'}
              color={debtStatus === 'all' ? 'default' : 'default'}
              onClick={() => onDebtStatusChange('all')}
            />
            <Chip
              size="small"
              label={t('OK')}
              variant={debtStatus === 'ok' ? 'filled' : 'outlined'}
              color="success"
              onClick={() => onDebtStatusChange('ok')}
            />
            <Chip
              size="small"
              label={t('Low debt')}
              variant={debtStatus === 'low' ? 'filled' : 'outlined'}
              color="warning"
              onClick={() => onDebtStatusChange('low')}
            />
            <Chip
              size="small"
              label={t('High debt')}
              variant={debtStatus === 'high' ? 'filled' : 'outlined'}
              color="error"
              onClick={() => onDebtStatusChange('high')}
            />
          </Stack>

          {/* Rango de deuda */}
          <Stack
            direction="row"
            spacing={2}
            sx={{ width: isMobile ? '100%' : 'auto' }}
          >
            <TextField
              size="small"
              label={t('Debt >')}
              value={minDebt}
              onChange={(e) => onMinDebtChange(onlyDigits(e.target.value))}
              sx={{ minWidth: 120 }}
              InputProps={{
                startAdornment: <InputAdornment position="start">$</InputAdornment>,
              }}
            />

            <TextField
              size="small"
              label={t('Debt <')}
              value={maxDebt}
              onChange={(e) => onMaxDebtChange(onlyDigits(e.target.value))}
              sx={{ minWidth: 120 }}
              InputProps={{
                startAdornment: <InputAdornment position="start">$</InputAdornment>,
              }}
            />
          </Stack>
        </Stack>
      </Stack>
    </Box>
  );
}
