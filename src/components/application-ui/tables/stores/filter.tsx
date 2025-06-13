import {
  Box,
  FormControl,
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
import { SearchTwoTone } from '@mui/icons-material';

export default function StoreFilters({
  t,
  search,
  type,
  sortBy,
  order,
  handleSearchChange,
  onTypeChange,
  onSortChange,
  onOrderChange,
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
      >
        <TextField
          size="small"
          placeholder={t('Filter by store name or zip')}
          value={search}
          onChange={handleSearchChange}
          fullWidth={isMobile}
          sx={{ flex: 1, minWidth: 200 }}
          InputProps={{
            startAdornment: (
              <SearchTwoTone
                sx={{ mr: 1, color: 'text.secondary' }}
                fontSize="small"
              />
            ),
          }}
        />

        <FormControl
          size="small"
          sx={{ minWidth: 140, flexShrink: 0 }}
        >
          <InputLabel>{t('Plan')}</InputLabel>
          <Select
            value={type}
            onChange={(e) => onTypeChange(e.target.value)}
            input={<OutlinedInput label={t('Plan')} />}
          >
            <MenuItem value="">{t('All types')}</MenuItem>
            <MenuItem value="elite">Elite</MenuItem>
            <MenuItem value="basic">Basic</MenuItem>
            <MenuItem value="free">Free</MenuItem>
          </Select>
        </FormControl>

        <FormControl
          size="small"
          sx={{ minWidth: 160, flexShrink: 0 }}
        >
          <InputLabel>{t('Sort by')}</InputLabel>
          <Select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value)}
            input={<OutlinedInput label={t('Sort by')} />}
          >
            <MenuItem value="customerCount">{t('Customers')}</MenuItem>
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

