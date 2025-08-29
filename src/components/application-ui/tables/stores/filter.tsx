import { SearchTwoTone } from '@mui/icons-material';
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
  Tab,
  Tabs,
  TextField,
  useMediaQuery,
  useTheme,
} from '@mui/material';

export default function StoreFilters({
  t,
  search,
  status, // 👈 nuevo
  sortBy,
  order,
  handleSearchChange,
  onStatusChange, // 👈 nuevo
  onSortChange,
  onOrderChange,
}: {
  t: (k: string) => string;
  search: string;
  status: 'all' | 'active' | 'inactive';
  sortBy: string;
  order: string;
  handleSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onStatusChange: (s: 'all' | 'active' | 'inactive') => void;
  onSortChange: (v: string) => void;
  onOrderChange: (v: string) => void;
}) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

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

        {/* 👇 Select de Estado (reemplaza Plan/Type) */}
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

        <FormControl
          size="small"
          sx={{ minWidth: 160, flexShrink: 0 }}
        >
          <InputLabel id="sort-by-label">{t('Sort by')}</InputLabel>
          <Select
            labelId="sort-by-label"
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value)}
            input={<OutlinedInput label={t('Sort by')} />}
          >
            <MenuItem value="customerCount">{t('Customers')}</MenuItem>
            {/* agrega más si quieres: name, createdAt, etc. */}
          </Select>
        </FormControl>

        <Tabs
          value={order}
          onChange={(_, value) => onOrderChange(value)}
          variant="standard"
          textColor="primary"
          indicatorColor="primary"
          sx={{
            minHeight: 40,
            height: 40,
            borderRadius: 1,
            border: `1px solid ${theme.palette.divider}`,
            '& .MuiTab-root': {
              minHeight: 40,
              px: 2,
              fontSize: '0.85rem',
              textTransform: 'capitalize',
            },
            flexShrink: 0,
          }}
        >
          <Tab
            label={t('Ascending')}
            value="asc"
          />
          <Tab
            label={t('Descending')}
            value="desc"
          />
        </Tabs>
      </Stack>
    </Box>
  );
}
