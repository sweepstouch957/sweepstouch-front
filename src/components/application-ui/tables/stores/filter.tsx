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
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  OutlinedInput,
  Paper,
  Select,
  Stack,
  TextField,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';

type DebtStatus = 'all' | 'ok' | 'min_low' | 'low' | 'mid' | 'high' | 'critical';

export default function StoreFilters({
  t,
  search,
  status,
  audienceLt,
  total,

  debtStatus,
  minDebt,
  maxDebt,

  paymentMethod,
  onPaymentMethodChange,

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

  debtStatus: DebtStatus;
  minDebt: string;
  maxDebt: string;

  paymentMethod: string;
  onPaymentMethodChange: (v: string) => void;

  sortBy: 'customerCount' | 'name' | 'active' | 'maxDaysOverdue' | string;
  order: 'asc' | 'desc';
  onSortChange: (v: 'customerCount' | 'name' | 'active' | 'maxDaysOverdue' | string) => void;
  onOrderChange: (v: 'asc' | 'desc') => void;

  handleSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onStatusChange: (s: 'all' | 'active' | 'inactive') => void;
  onAudienceLtChange: (v: string) => void;

  onDebtStatusChange: (v: DebtStatus) => void;

  onMinDebtChange: (v: string) => void;
  onMaxDebtChange: (v: string) => void;
}) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const onlyDigits = (v: string) => v.replace(/\D/g, '');

  const filtersActive =
    search.trim() ||
    status !== 'all' ||
    audienceLt ||
    debtStatus !== 'all' ||
    minDebt ||
    maxDebt ||
    paymentMethod !== 'all';

  const handleOrderToggle = () => onOrderChange(order === 'asc' ? 'desc' : 'asc');

  const chipSx = {
    height: 28,
    fontSize: 12,
    fontWeight: 800,
    borderRadius: 999,
  } as const;

  return (
    <Box
      component={Paper}
      elevation={0}
      sx={{
        p: { xs: 1.5, sm: 2 },
        borderRadius: 2.5,
        mb: 1.5,
        border: `1px solid ${theme.palette.divider}`,
        background:
          theme.palette.mode === 'light'
            ? 'linear-gradient(135deg, #fbfbff 0%, #f4f7ff 55%, #fdfdfd 100%)'
            : 'linear-gradient(135deg, #101322 0%, #151827 60%, #111318 100%)',
      }}
    >
      <Stack spacing={1.75}>
        {/* Header */}
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          justifyContent="space-between"
          alignItems={{ xs: 'stretch', sm: 'center' }}
          spacing={{ xs: 1.25, sm: 2 }}
        >
          <Box sx={{ minWidth: 0 }}>
            <Typography
              variant="subtitle1"
              fontWeight={700}
              noWrap={!isMobile}
            >
              {t('Store filters')}
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
            >
              Refina la vista por audiencia, deuda y estado.
            </Typography>
          </Box>

          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
            justifyContent={{ xs: 'space-between', sm: 'flex-end' }}
            sx={{ flexWrap: 'wrap', rowGap: 1 }}
          >
            <FormControl
              size="small"
              sx={{ minWidth: isMobile ? '100%' : 180 }}
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

            <Tooltip title={order === 'asc' ? t('Ascending') : t('Descending')}>
              <IconButton
                size="small"
                onClick={handleOrderToggle}
                sx={{
                  border: `1px solid ${theme.palette.divider}`,
                  borderRadius: 2,
                  height: 40,
                  width: 40,
                }}
              >
                <SwapVertTwoTone fontSize="small" />
              </IconButton>
            </Tooltip>

            {filtersActive && (
              <Chip
                size="small"
                label={`${t('Results')}: ${total}`}
                color="primary"
                variant="outlined"
                sx={{ fontSize: '0.72rem', height: 32 }}
              />
            )}
          </Stack>
        </Stack>

        {/* Fila 1 */}
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1.5}
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
            fullWidth={isMobile}
            sx={{ width: { xs: '100%', sm: 160 } }}
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
            fullWidth={isMobile}
            sx={{ width: { xs: '100%', sm: 160 } }}
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

          <FormControl
            size="small"
            fullWidth={isMobile}
            sx={{ width: { xs: '100%', sm: 190 } }}
          >
            <InputLabel>{t('Payment method')}</InputLabel>
            <Select
              value={paymentMethod}
              onChange={(e) => onPaymentMethodChange(e.target.value)}
              input={<OutlinedInput label={t('Payment method')} />}
            >
              <MenuItem value="all">{t('All')}</MenuItem>
              <MenuItem value="central_billing">Central billing</MenuItem>
              <MenuItem value="check">Check</MenuItem>
              <MenuItem value="card">Card</MenuItem>
              <MenuItem value="quickbooks">QuickBooks</MenuItem>
              <MenuItem value="ach">ACH</MenuItem>
              <MenuItem value="wire">Wire</MenuItem>
              <MenuItem value="cash">Cash</MenuItem>
            </Select>
          </FormControl>
        </Stack>

        {/* Fila 2: debtStatus + rango */}
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1.5}
          alignItems={{ xs: 'stretch', sm: 'center' }}
        >
          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
            flexWrap="wrap"
            sx={{ rowGap: 1, flex: 1, minWidth: 0 }}
          >
            <WarningAmberTwoTone
              fontSize="small"
              color="warning"
              sx={{ mr: 0.25 }}
            />
            <Typography
              variant="body2"
              sx={{ mr: 0.5 }}
            >
              {t('Debt status')}:
            </Typography>

            <Chip
              size="small"
              label={t('All')}
              variant={debtStatus === 'all' ? 'filled' : 'outlined'}
              onClick={() => onDebtStatusChange('all')}
              sx={chipSx}
            />

            {/* ok (al día) - verde esmeralda */}
            <Chip
              size="small"
              label={t('OK')}
              variant={debtStatus === 'ok' ? 'filled' : 'outlined'}
              onClick={() => onDebtStatusChange('ok')}
              sx={{
                ...chipSx,
                bgcolor: debtStatus === 'ok' ? '#10B981' : undefined,
                borderColor: '#10B981',
                color: debtStatus === 'ok' ? '#fff' : '#10B981',
              }}
            />

            {/* min_low = 1 semana (amarillo suave) */}
            <Chip
              size="small"
              label={t('Min low')}
              variant={debtStatus === 'min_low' ? 'filled' : 'outlined'}
              onClick={() => onDebtStatusChange('min_low')}
              sx={{
                ...chipSx,
                bgcolor: debtStatus === 'min_low' ? '#FDE68A' : undefined,
                borderColor: '#FDE68A',
                color: debtStatus === 'min_low' ? '#111827' : '#B45309',
              }}
            />

            {/* low = 2 semanas (amarillo) */}
            <Chip
              size="small"
              label={t('Low debt')}
              variant={debtStatus === 'low' ? 'filled' : 'outlined'}
              onClick={() => onDebtStatusChange('low')}
              sx={{
                ...chipSx,
                bgcolor: debtStatus === 'low' ? '#FACC15' : undefined,
                borderColor: '#FACC15',
                color: debtStatus === 'low' ? '#111827' : '#A16207',
              }}
            />

            {/* mid = 3 semanas (naranja) */}
            <Chip
              size="small"
              label={t('Mid')}
              variant={debtStatus === 'mid' ? 'filled' : 'outlined'}
              onClick={() => onDebtStatusChange('mid')}
              sx={{
                ...chipSx,
                bgcolor: debtStatus === 'mid' ? '#FB923C' : undefined,
                borderColor: '#FB923C',
                color: debtStatus === 'mid' ? '#111827' : '#9A3412',
              }}
            />

            {/* high = 4 semanas (rojo coral) */}
            <Chip
              size="small"
              label={t('High debt')}
              variant={debtStatus === 'high' ? 'filled' : 'outlined'}
              onClick={() => onDebtStatusChange('high')}
              sx={{
                ...chipSx,
                bgcolor: debtStatus === 'high' ? '#F43F5E' : undefined,
                borderColor: '#F43F5E',
                color: debtStatus === 'high' ? '#fff' : '#BE123C',
              }}
            />

            {/* critical = 5+ semanas (tinto) */}
            <Chip
              size="small"
              label={t('Critical')}
              variant={debtStatus === 'critical' ? 'filled' : 'outlined'}
              onClick={() => onDebtStatusChange('critical')}
              sx={{
                ...chipSx,
                bgcolor: debtStatus === 'critical' ? '#7F1D1D' : undefined,
                borderColor: '#7F1D1D',
                color: debtStatus === 'critical' ? '#fff' : '#7F1D1D',
              }}
            />
          </Stack>

          <Stack
            direction="row"
            spacing={1.5}
            sx={{ width: { xs: '100%', sm: 'auto' } }}
          >
            <TextField
              size="small"
              label={t('Debt >')}
              value={minDebt}
              onChange={(e) => onMinDebtChange(onlyDigits(e.target.value))}
              fullWidth={isMobile}
              sx={{ flex: 1, minWidth: 0, width: { xs: '50%', sm: 140 } }}
              InputProps={{
                startAdornment: <InputAdornment position="start">$</InputAdornment>,
              }}
            />

            <TextField
              size="small"
              label={t('Debt <')}
              value={maxDebt}
              onChange={(e) => onMaxDebtChange(onlyDigits(e.target.value))}
              fullWidth={isMobile}
              sx={{ flex: 1, minWidth: 0, width: { xs: '50%', sm: 140 } }}
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
