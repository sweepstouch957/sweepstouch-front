import { GroupTwoTone, SearchTwoTone } from '@mui/icons-material';
import {
  Box,
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
  audienceLt, // string
  handleSearchChange,
  onStatusChange,
  onAudienceLtChange, // (v: string) => void
}: {
  t: (k: string) => string;
  search: string;
  status: 'all' | 'active' | 'inactive';
  audienceLt: string;
  handleSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onStatusChange: (s: 'all' | 'active' | 'inactive') => void;
  onAudienceLtChange: (v: string) => void;
}) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Solo dígitos, pero mantén string
  const handleAudienceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digitsOnly = e.target.value.replace(/\D/g, '');
    onAudienceLtChange(digitsOnly);
  };
  const handleAudienceKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const controlKeys = new Set([
      'Backspace',
      'Delete',
      'Tab',
      'ArrowLeft',
      'ArrowRight',
      'Home',
      'End',
      'Enter',
    ]);
    if (controlKeys.has(e.key)) return;
    if ((e.ctrlKey || e.metaKey) && ['a', 'c', 'v', 'x', 'z', 'y'].includes(e.key.toLowerCase()))
      return;
    if (!/^\d$/.test(e.key)) e.preventDefault();
  };
  const handleAudiencePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text') || '';
    const el = e.currentTarget;
    const start = el.selectionStart ?? audienceLt.length;
    const end = el.selectionEnd ?? start;
    const next = (audienceLt.slice(0, start) + pasted + audienceLt.slice(end)).replace(/\D/g, '');
    onAudienceLtChange(next);
  };

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
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        alignItems={{ xs: 'stretch', sm: 'center' }}
        justifyContent="space-between"
        flexWrap="wrap"
        useFlexGap
      >
        {/* Búsqueda */}
        <TextField
          size="small"
          placeholder={t('Filter by store name or zip')}
          value={search}
          onChange={handleSearchChange}
          fullWidth={isMobile}
          sx={{ flex: 1, minWidth: 220 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchTwoTone
                  fontSize="small"
                  sx={{ color: 'text.secondary' }}
                />
              </InputAdornment>
            ),
          }}
        />

        {/* Audience < N (string solo dígitos) */}
        <TextField
          size="small"
          type="text"
          value={audienceLt}
          onChange={handleAudienceChange}
          onKeyDown={handleAudienceKeyDown}
          onPaste={handleAudiencePaste}
          fullWidth={isMobile}
          sx={{ minWidth: 160, flexShrink: 0 }}
          inputProps={{ inputMode: 'numeric', pattern: '[0-9]*', autoComplete: 'off' }}
          placeholder={t('Audience < e.g. 1000')}
          label={t('Audience <')}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <GroupTwoTone
                  fontSize="small"
                  sx={{ color: 'text.secondary' }}
                />
              </InputAdornment>
            ),
          }}
        />

        {/* Estado */}
        <FormControl
          size="small"
          sx={{ minWidth: 160, flexShrink: 0 }}
        >
          <InputLabel id="status-label">{t('Status')}</InputLabel>
          <Select
            labelId="status-label"
            value={status}
            onChange={(e) => onStatusChange(e.target.value as 'all' | 'active' | 'inactive')}
            input={<OutlinedInput label={t('Status')} />}
          >
            <MenuItem value="all">{t('All')}</MenuItem>
            <MenuItem value="active">{t('Active')}</MenuItem>
            <MenuItem value="inactive">{t('Inactive')}</MenuItem>
          </Select>
        </FormControl>
      </Stack>
    </Box>
  );
}
