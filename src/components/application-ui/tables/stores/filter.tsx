import { GroupTwoTone, SearchTwoTone, WarningAmberTwoTone } from '@mui/icons-material';
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

  return (
    <Box
      component={Paper}
      elevation={0}
      sx={{
        p: { xs: 2, sm: 3 },
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: 2,
        mb: 2,
      }}
    >
      <Stack spacing={2}>
        {/* 🔍 Primera fila */}
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2}
          alignItems="center"
        >
          <TextField
            size="small"
            placeholder={t('Search by store name or zip')}
            value={search}
            onChange={handleSearchChange}
            fullWidth={isMobile}
            sx={{ flex: 1, minWidth: 220 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchTwoTone fontSize="small" />
                </InputAdornment>
              ),
            }}
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
          alignItems="center"
        >
          <FormControl
            size="small"
            sx={{ minWidth: 180 }}
          >
            <InputLabel>{t('Debt status')}</InputLabel>
            <Select
              value={debtStatus}
              onChange={(e) => onDebtStatusChange(e.target.value as any)}
              input={<OutlinedInput label={t('Debt status')} />}
              startAdornment={
                <InputAdornment position="start">
                  <WarningAmberTwoTone fontSize="small" />
                </InputAdornment>
              }
            >
              <MenuItem value="all">{t('All')}</MenuItem>
              <MenuItem value="ok">{t('OK')}</MenuItem>
              <MenuItem value="high">{t('High debt')}</MenuItem>
              <MenuItem value="low">{t('Low debt')}</MenuItem>
            </Select>
          </FormControl>

          <TextField
            size="small"
            label={t('Debt >')}
            value={minDebt}
            onChange={(e) => onMinDebtChange(onlyDigits(e.target.value))}
            sx={{ minWidth: 120 }}
          />

          <TextField
            size="small"
            label={t('Debt <')}
            value={maxDebt}
            onChange={(e) => onMaxDebtChange(onlyDigits(e.target.value))}
            sx={{ minWidth: 120 }}
          />

          <Box flexGrow={1} />

          {filtersActive && (
            <Chip
              label={`${t('Results')}: ${total}`}
              color="primary"
              variant="outlined"
            />
          )}
        </Stack>
      </Stack>
    </Box>
  );
}
