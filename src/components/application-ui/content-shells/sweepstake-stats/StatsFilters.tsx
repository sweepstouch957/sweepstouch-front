'use client';

import RangePickerField from '@/components/base/range-picker-field';
import FilterAltRoundedIcon from '@mui/icons-material/FilterAltRounded';
import {
  alpha,
  Card,
  Divider,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Typography,
  useTheme,
} from '@mui/material';
import { Method } from './types';
import type { useSweepstakeStats } from './use-sweepstake-stats';

type Props = Pick<
  ReturnType<typeof useSweepstakeStats>,
  'dateRange' | 'setDateRange' | 'method' | 'setMethod'
>;

/** Filtros de período y método de registro. */
export function StatsFilters({ dateRange, setDateRange, method, setMethod }: Props) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  return (
    <Card
      variant="outlined"
      sx={{
        borderRadius: 3,
        p: { xs: 1.5, sm: 2 },
        mb: 3,
        bgcolor: isDark
          ? alpha(theme.palette.background.paper, 0.6)
          : alpha(theme.palette.background.default, 0.7),
        backdropFilter: 'blur(8px)',
      }}
    >
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={1.5}
        alignItems={{ sm: 'center' }}
        flexWrap="wrap"
      >
        <Stack
          direction="row"
          alignItems="center"
          spacing={0.75}
        >
          <FilterAltRoundedIcon sx={{ color: 'text.secondary', fontSize: 18 }} />
          <Typography
            variant="caption"
            fontWeight={700}
            color="text.secondary"
            sx={{
              textTransform: 'uppercase',
              letterSpacing: 1,
              fontSize: 10,
            }}
          >
            Filtros
          </Typography>
        </Stack>
        <Divider
          orientation="vertical"
          flexItem
          sx={{ display: { xs: 'none', sm: 'block' } }}
        />
        <RangePickerField
          label="Período"
          value={dateRange}
          onChange={setDateRange}
          sx={{
            flex: { xs: '1 1 auto', sm: 2 },
            minWidth: { sm: 220 },
            '& .MuiOutlinedInput-root': { borderRadius: 2 },
          }}
        />
        <FormControl
          size="small"
          sx={{ flex: { xs: '1 1 auto', sm: 1 }, minWidth: { sm: 130 } }}
        >
          <InputLabel sx={{ fontWeight: 600 }}>Método</InputLabel>
          <Select
            value={method}
            label="Método"
            onChange={(e) => setMethod(e.target.value as Method)}
            sx={{ borderRadius: 2 }}
          >
            <MenuItem value="all">Todos los métodos</MenuItem>
            <MenuItem value="qr">QR</MenuItem>
            <MenuItem value="web">Web</MenuItem>
            <MenuItem value="tablet">Tablet</MenuItem>
            <MenuItem value="promotor">Promotoras</MenuItem>
            <MenuItem value="referral">Referidos</MenuItem>
            <MenuItem value="pinpad">Pinpad</MenuItem>
          </Select>
        </FormControl>
      </Stack>
    </Card>
  );
}
