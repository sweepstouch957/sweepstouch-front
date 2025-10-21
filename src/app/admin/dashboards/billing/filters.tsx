// components/billing/BillingFilters.tsx
'use client';

import type { WeekStart } from '@/services/billing.service';
import ExpandMoreTwoToneIcon from '@mui/icons-material/ExpandMoreTwoTone';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import {
  alpha,
  Button,
  Card,
  CardContent,
  CardHeader,
  Divider,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  Menu,
  MenuItem,
  Select,
  SelectChangeEvent,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import React from 'react';

export type MembershipType = 'mensual' | 'semanal' | 'especial';
export type PaymentMethod = 'central_billing' | 'card' | 'quickbooks' | 'ach' | 'wire' | 'cash';

type Props = {
  weekStart: WeekStart;
  onWeekStartChange: (w: WeekStart) => void;

  startDate: Date | null;
  endDate: Date | null;
  onChangeDates: (start: Date | null, end: Date | null) => void;

  membershipType: MembershipType;
  onMembershipChange: (t: MembershipType) => void;

  paymentMethod: PaymentMethod | '';
  onPaymentMethodChange: (m: PaymentMethod | '') => void;
};

const MEMBERSHIP_OPTIONS: { value: MembershipType; label: string; hint?: string }[] = [
  { value: 'mensual', label: 'Mensual', hint: '107/sem por tienda' },
  { value: 'semanal', label: 'Semanal', hint: '99/mes por tienda' },
  { value: 'especial', label: 'Especial', hint: 'Cobra semana solo si hubo campañas' },
];

const PAYMENT_OPTIONS: { value: PaymentMethod; label: string }[] = [
  { value: 'central_billing', label: 'Central billing' },
  { value: 'card', label: 'Tarjeta' },
  { value: 'quickbooks', label: 'QuickBooks' },
];

export default function BillingFilters({
  weekStart,
  onWeekStartChange,
  startDate,
  endDate,
  onChangeDates,
  membershipType,
  onMembershipChange,
  paymentMethod,
  onPaymentMethodChange,
}: Props) {
  const theme = useTheme();
  const actionRef = React.useRef<any>(null);
  const [openPeriod, setOpenPeriod] = React.useState(false);

  const periods = [
    { value: '7d', text: 'Últimos 7 días' },
    { value: '14d', text: 'Últimos 14 días' },
    { value: 'm', text: 'Este mes' },
  ];

  const bgSoft =
    theme.palette.mode === 'dark'
      ? alpha(theme.palette.neutral?.[25] ?? '#fff', 0.04)
      : 'neutral.25';

  return (
    <Card
      variant="outlined"
      sx={{ mb: 3, borderRadius: 3 }}
    >
      <CardHeader
        title="Filtros"
        subheader="Selecciona rango. El inicio de semana afecta todos los cálculos. El mes se asume como el actual."
        action={
          <>
            <Button
              variant="outlined"
              size="small"
              endIcon={<ExpandMoreTwoToneIcon fontSize="small" />}
              ref={actionRef}
              onClick={() => setOpenPeriod(true)}
            >
              Atajos de periodo
            </Button>
            <Menu
              disableScrollLock
              anchorEl={actionRef.current}
              onClose={() => setOpenPeriod(false)}
              open={openPeriod}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
              transformOrigin={{ vertical: 'top', horizontal: 'left' }}
            >
              {periods.map((p) => (
                <MenuItem
                  key={p.value}
                  onClick={() => {
                    const now = new Date();
                    if (p.value === '7d') {
                      const s = new Date();
                      s.setDate(now.getDate() - 6);
                      onChangeDates(s, now);
                    } else if (p.value === '14d') {
                      const s = new Date();
                      s.setDate(now.getDate() - 13);
                      onChangeDates(s, now);
                    } else {
                      const s = new Date(now.getFullYear(), now.getMonth(), 1);
                      const e = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                      onChangeDates(s, e);
                    }
                    setOpenPeriod(false);
                  }}
                >
                  {p.text}
                </MenuItem>
              ))}
            </Menu>
          </>
        }
      />
      <CardContent>
        <Grid
          container
          spacing={2}
        >
          {/* Fechas */}
          <Grid
            item
            xs={12}
            md={7}
          >
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={2}
            >
              <DatePicker
                label="Inicio (YYYY-MM-DD)"
                value={startDate}
                onChange={(v) => onChangeDates(v, endDate)}
                slotProps={{ textField: { fullWidth: true, size: 'small' } }}
              />
              <DatePicker
                label="Fin (YYYY-MM-DD)"
                value={endDate}
                onChange={(v) => onChangeDates(startDate, v)}
                slotProps={{ textField: { fullWidth: true, size: 'small' } }}
              />
            </Stack>
          </Grid>

          {/* Selects: Membresía + Método de pago */}
          <Grid
            item
            xs={12}
            md={5}
          >
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={2}
            >
              <FormControl
                fullWidth
                size="small"
              >
                <InputLabel id="membership-type-label">Tipo de membresía</InputLabel>
                <Select
                  labelId="membership-type-label"
                  label="Tipo de membresía"
                  value={membershipType}
                  onChange={(e: SelectChangeEvent<MembershipType>) =>
                    onMembershipChange(e.target.value as MembershipType)
                  }
                >
                  {MEMBERSHIP_OPTIONS.map((opt) => (
                    <MenuItem
                      key={opt.value}
                      value={opt.value}
                    >
                      <Stack
                        direction="row"
                        spacing={1}
                        alignItems="center"
                      >
                        <Typography>{opt.label}</Typography>
                        {opt.hint && (
                          <Tooltip title={opt.hint}>
                            <InfoOutlinedIcon fontSize="small" />
                          </Tooltip>
                        )}
                      </Stack>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl
                fullWidth
                size="small"
              >
                <InputLabel id="payment-method-label">Método de pago</InputLabel>
                <Select
                  labelId="payment-method-label"
                  label="Método de pago"
                  value={paymentMethod}
                  onChange={(e: SelectChangeEvent<PaymentMethod | ''>) =>
                    onPaymentMethodChange(e.target.value as PaymentMethod | '')
                  }
                >
                  <MenuItem value="">
                    <em>Todos</em>
                  </MenuItem>
                  {PAYMENT_OPTIONS.map((opt) => (
                    <MenuItem
                      key={opt.value}
                      value={opt.value}
                    >
                      {opt.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>
          </Grid>
        </Grid>

        <Divider sx={{ my: 2 }} />

        {/* Inicio de semana */}
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          gap={2}
        >
          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
          >
            <ToggleButtonGroup
              size="small"
              color="primary"
              exclusive
              value={weekStart}
              onChange={(_, val) => val && onWeekStartChange(val)}
            >
              <ToggleButton value="mon">Semana Lunes</ToggleButton>
              <ToggleButton value="sun">Semana Domingo</ToggleButton>
            </ToggleButtonGroup>
            <Tooltip title="Fee por tienda según membresía + costos de campañas (SMS/MMS) traslapadas por periodo.">
              <IconButton>
                <InfoOutlinedIcon />
              </IconButton>
            </Tooltip>
          </Stack>

          {/* espacio para futuro: badges/resumen compactos si los vuelves a querer */}
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={1}
            alignItems={{ xs: 'flex-start', sm: 'center' }}
            sx={{ bgcolor: bgSoft, p: 1, borderRadius: 2, display: 'none' }}
          />
        </Stack>
      </CardContent>
    </Card>
  );
}
