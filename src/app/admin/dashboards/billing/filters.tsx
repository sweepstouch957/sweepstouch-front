// components/billing/BillingFilters.tsx
'use client';

import CalendarTodayOutlinedIcon from '@mui/icons-material/CalendarTodayOutlined';
import DownloadOutlinedIcon from '@mui/icons-material/DownloadOutlined';
import ExpandMoreTwoToneIcon from '@mui/icons-material/ExpandMoreTwoTone';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import {
  alpha,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  CircularProgress,
  FormControl,
  InputAdornment,
  InputLabel,
  Menu,
  MenuItem,
  Popover,
  Select,
  SelectChangeEvent,
  Stack,
  TextField,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material';
import React from 'react';
import { DateRange, RangeKeyDict } from 'react-date-range';
import * as XLSX from 'xlsx';
import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';
import { useStoresRangeReport } from '@hooks/fetching/billing/useBilling';
import { MembershipType } from '@/services/billing.service';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import StoresReportModal from '@/components/billing/StoresReportModal';

export type PaymentMethod = 'central_billing' | 'card' | 'quickbooks' | 'ach' | 'wire' | 'cash';

type Props = {
  /** Rango de fechas */
  startDate: Date | null;
  endDate: Date | null;
  onChangeDates: (start: Date | null, end: Date | null) => void;

  /** Filtro de membresía (opcional) */
  membershipType: MembershipType;
  onMembershipChange: (t: MembershipType) => void;

  /** Filtro de método de pago (opcional) */
  paymentMethod: PaymentMethod | '';
  onPaymentMethodChange: (m: PaymentMethod | '') => void;

  /** Periodos para multiplicar la membresía (0–5) */
  periods: number;
  onPeriodsChange: (n: number) => void;
};

const MEMBERSHIP_OPTIONS: { value: MembershipType; label: string; hint?: string }[] = [
  { value: 'all', label: 'Todas', hint: 'Todas' },
  { value: 'semanal', label: 'Semanal', hint: '99 por periodo por tienda' },
  { value: 'mensual', label: 'Mensual', hint: '107 por mes por tienda' },
  { value: 'especial', label: 'Especial', hint: '99 por periodo (según tu regla actual)' },
  { value: 'none', label: 'Sin Membresia', hint: 'Tiendas que no pagan membresia' },
];

const PAYMENT_OPTIONS: { value: PaymentMethod; label: string }[] = [
  { value: 'central_billing', label: 'Central billing' },
  { value: 'card', label: 'Tarjeta' },
  { value: 'quickbooks', label: 'QuickBooks' },
];

const toYYYYMMDD = (d: Date | null) =>
  d
    ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
      d.getDate()
    ).padStart(2, '0')}`
    : '';

export default function BillingFilters({
  startDate,
  endDate,
  onChangeDates,
  membershipType,
  onMembershipChange,
  paymentMethod,
  onPaymentMethodChange,
  periods,
  onPeriodsChange,
}: Props) {
  const theme = useTheme();
  const actionRef = React.useRef<any>(null);
  const [openQuick, setOpenQuick] = React.useState(false);

  const [rangeAnchor, setRangeAnchor] = React.useState<HTMLElement | null>(null);
  const openRange = Boolean(rangeAnchor);

  const [rangeState, setRangeState] = React.useState([
    {
      startDate: startDate ?? new Date(),
      endDate: endDate ?? new Date(),
      key: 'selection',
    },
  ]);

  React.useEffect(() => {
    setRangeState([
      { startDate: startDate ?? new Date(), endDate: endDate ?? new Date(), key: 'selection' },
    ]);
  }, [startDate, endDate]);

  const startStr = toYYYYMMDD(startDate);
  const endStr = toYYYYMMDD(endDate);

  // ⬇️ NUEVO: no auto-fetch; solo al exportar
  const storesReport = useStoresRangeReport(
    startDate && endDate
      ? {
        start: startStr!,
        end: endStr!,
        periods,
        paymentMethod: (paymentMethod || undefined) as any,
        membershipType,
      }
      : undefined,
    { enabled: false } // <- clave
  );

  const [exporting, setExporting] = React.useState(false);


  const [openStores, setOpenStores] = React.useState(false);
  const bgSoft =
    theme.palette.mode === 'dark'
      ? alpha(theme.palette.neutral?.[25] ?? '#fff', 0.04)
      : 'neutral.25';

  /* ====== Quick ranges ====== */
  const quickRanges = [
    { value: '7d', text: 'Últimos 7 días' },
    { value: '14d', text: 'Últimos 14 días' },
    { value: 'm', text: 'Este mes' },
  ];

  const applyQuick = (code: string) => {
    const now = new Date();
    if (code === '7d') {
      const s = new Date();
      s.setDate(now.getDate() - 6);
      onChangeDates(s, now);
    } else if (code === '14d') {
      const s = new Date();
      s.setDate(now.getDate() - 13);
      onChangeDates(s, now);
    } else {
      const s = new Date(now.getFullYear(), now.getMonth(), 1);
      const e = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      onChangeDates(s, e);
    }
    setOpenQuick(false);
  };

  /* ====== Range popover ====== */
  const handleOpenRange = (e: React.MouseEvent<HTMLElement>) => setRangeAnchor(e.currentTarget);
  const handleCloseRange = () => setRangeAnchor(null);

  const onRangeChange = (item: RangeKeyDict) => {
    const sel = item.selection;
    setRangeState([sel]);
  };

  const onRangeApply = () => {
    const sel = rangeState[0];
    onChangeDates(sel.startDate ?? null, sel.endDate ?? null);
    handleCloseRange();
  };

  /* ====== Periods: input type text con regex ^[0-5]$ (o vacío) ====== */
  const [periodsText, setPeriodsText] = React.useState<string>(
    String(Number.isFinite(periods) ? periods : 0)
  );
  React.useEffect(() => {
    setPeriodsText(String(Number.isFinite(periods) ? periods : 0));
  }, [periods]);

  const handlePeriodsChange = (val: string) => {
    if (/^[0-5]?$/.test(val)) {
      setPeriodsText(val);
      if (val === '') return;
      onPeriodsChange(parseInt(val, 10));
    }
  };
  const handlePeriodsBlur = () => {
    if (periodsText === '') {
      setPeriodsText('0');
      onPeriodsChange(0);
    }
  };

  /* ====== Export ====== */
  const handleExport = async () => {
    if (!startDate || !endDate) return;

    try {
      setExporting(true);

      // Dispara el fetch con los últimos filtros/rango (enabled:false en el hook)
      const { data } = await storesReport.refetch();
      if (!data) {
        setExporting(false);
        return;
      }

      const { stores, totals, range } = data;
      const includeMembership = (periods ?? 0) > 0;

      const title = `Facturación por tiendas — en base a ${periods} periodo${periods === 1 ? '' : 's'
        } de membresía`;
      const subtitle = `Rango: ${range.start.slice(0, 10)} → ${range.end.slice(0, 10)}`;

      // ----- Construcción de filas -----
      const rows = (stores ?? []).map((s: any) => {
        const base: Record<string, any> = {
          Tienda: s.name ?? '',
          Membresía: s.membershipType ?? '',
          'Método de pago': s.paymentMethod ?? '',
          'SMS (USD)': +(s?.campaigns?.sms ?? 0).toFixed(2),
          'MMS (USD)': +(s?.campaigns?.mms ?? 0).toFixed(2),
          'Total campañas (USD)': +(s?.campaigns?.total ?? 0).toFixed(2),
          'Opt-in (count)': +(s?.optin?.count ?? 0),
          'Opt-in (USD)': +(s?.optin?.cost ?? 0).toFixed(2),
        };

        if (includeMembership) {
          base['Membresía (USD)'] = +(s?.membership?.subtotal ?? 0).toFixed(2);
        }

        base['Gran total (USD)'] = +(s?.total ?? 0).toFixed(2);
        return base;
      });

      // ----- Crear hoja vacía y escribir en orden -----
      const ws = XLSX.utils.aoa_to_sheet([]); // <— hoja VACÍA (no duplica nada)

      // Título y subtítulo
      XLSX.utils.sheet_add_aoa(ws, [[title]], { origin: 'A1' });
      XLSX.utils.sheet_add_aoa(ws, [[subtitle]], { origin: 'A2' });

      // Headers (A4) — si no hay filas, generar estructura base
      const header = Object.keys(
        rows[0] ??
        (includeMembership
          ? {
            Tienda: '',
            Membresía: '',
            'Método de pago': '',
            'SMS (USD)': 0,
            'MMS (USD)': 0,
            'Total campañas (USD)': 0,
            'Opt-in (count)': 0,
            'Opt-in (USD)': 0,
            'Membresía (USD)': 0,
            'Gran total (USD)': 0,
          }
          : {
            Tienda: '',
            Membresía: '',
            'Método de pago': '',
            'SMS (USD)': 0,
            'MMS (USD)': 0,
            'Total campañas (USD)': 0,
            'Opt-in (count)': 0,
            'Opt-in (USD)': 0,
            'Gran total (USD)': 0,
          })
      );
      XLSX.utils.sheet_add_aoa(ws, [header], { origin: 'A4' });

      // Filas (A5…)
      if (rows.length) {
        XLSX.utils.sheet_add_json(ws, rows, { origin: 'A5', skipHeader: true });
      }

      // ----- Fila de totales -----
      if (totals) {
        const totalsRow: Record<string, any> = {
          Tienda: '— Totales —',
          Membresía: '',
          'Método de pago': '',
          'SMS (USD)': +(totals?.campaigns?.sms ?? 0).toFixed(2),
          'MMS (USD)': +(totals?.campaigns?.mms ?? 0).toFixed(2),
          'Total campañas (USD)': +(totals?.campaigns?.total ?? 0).toFixed(2),
          'Opt-in (count)': +(totals?.optin?.count ?? 0),
          'Opt-in (USD)': +(totals?.optin?.cost ?? 0).toFixed(2),
        };
        if (includeMembership) totalsRow['Membresía (USD)'] = +(totals?.membership ?? 0).toFixed(2);
        totalsRow['Gran total (USD)'] = +(totals?.grandTotal ?? 0).toFixed(2);

        const startRow = (rows.length || 0) + 6; // A5 + rows + línea en blanco
        XLSX.utils.sheet_add_aoa(ws, [[]], { origin: { r: startRow - 1, c: 0 } });
        XLSX.utils.sheet_add_json(ws, [totalsRow], {
          origin: { r: startRow, c: 0 },
          skipHeader: true,
        });
      }

      // ----- Libro y descarga -----
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Facturación');
      const filename = `billing_stores_${range.start.slice(0, 10)}_${range.end.slice(0, 10)}_p${periods || 0
        }.xlsx`;
      XLSX.writeFile(wb, filename);
    } finally {
      setExporting(false);
    }
  };

  // estilos/layout: UNA sola fila con wrap bonito
  const itemSx = { flex: '1 1 240px', minWidth: 240, maxWidth: 360 };

  return (
    <Card
      variant="outlined"
      sx={{ mb: 3, borderRadius: 3 }}
    >
      <CardHeader
        title="Filtros"
        subheader="Selecciona el rango y, si quieres, el multiplicador de membresía (periods)."
        action={
          <>
            <Button
              variant="outlined"
              size="small"
              endIcon={<ExpandMoreTwoToneIcon fontSize="small" />}
              ref={actionRef}
              onClick={() => setOpenQuick(true)}
            >
              Atajos de periodo
            </Button>
            <Menu
              disableScrollLock
              anchorEl={actionRef.current}
              onClose={() => setOpenQuick(false)}
              open={openQuick}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
              transformOrigin={{ vertical: 'top', horizontal: 'left' }}
            >
              {quickRanges.map((p) => (
                <MenuItem
                  key={p.value}
                  onClick={() => applyQuick(p.value)}
                >
                  {p.text}
                </MenuItem>
              ))}
            </Menu>
          </>
        }
      />
      <CardContent>
        {/* Fila única con wrap */}
        <Stack
          direction="row"
          spacing={2}
          useFlexGap
          flexWrap="wrap"
          alignItems="center"
        >
          {/* Range Picker (trigger) */}
          <Box sx={itemSx}>
            <TextField
              label="Rango (YYYY-MM-DD → YYYY-MM-DD)"
              value={startStr && endStr ? `${startStr} → ${endStr}` : ''}
              placeholder="Selecciona un rango"
              onClick={handleOpenRange}
              size="small"
              fullWidth
              InputProps={{
                readOnly: true,
                endAdornment: (
                  <InputAdornment position="end">
                    <CalendarTodayOutlinedIcon fontSize="small" />
                  </InputAdornment>
                ),
              }}
            />
            <Popover
              open={openRange}
              anchorEl={rangeAnchor}
              onClose={handleCloseRange}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
              transformOrigin={{ vertical: 'top', horizontal: 'left' }}
              slotProps={{ paper: { sx: { borderRadius: 2 } } }}
            >
              <Box sx={{ p: 1 }}>
                <DateRange
                  ranges={rangeState as any}
                  onChange={onRangeChange}
                  moveRangeOnFirstSelection={false}
                  rangeColors={[theme.palette.primary.light]}
                  direction="horizontal"
                  showPreview={false}
                />
                <Stack
                  direction="row"
                  justifyContent="flex-end"
                  gap={1}
                  sx={{ px: 1, pb: 1 }}
                >
                  <Button onClick={handleCloseRange}>Cancelar</Button>
                  <Button
                    variant="contained"
                    onClick={onRangeApply}
                  >
                    Aplicar
                  </Button>
                </Stack>
              </Box>
            </Popover>
          </Box>

          {/* Membresía */}
          <Box sx={itemSx}>
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
          </Box>

          {/* Método de pago */}
          <Box sx={itemSx}>
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
          </Box>

          {/* Periods (texto con regex 0–5) */}
          <Box sx={{ ...itemSx, maxWidth: 220 }}>
            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
            >
              <TextField
                label="Periods (multiplicador)"
                size="small"
                type="text"
                value={periodsText}
                onChange={(e) => handlePeriodsChange(e.target.value)}
                onBlur={handlePeriodsBlur}
                inputProps={{ inputMode: 'numeric', pattern: '[0-5]?' }}
                helperText="0–5 (ej. 4 = cobrar 4 periodos)"
                fullWidth
              />
              <Tooltip title="Multiplicador para el fee de membresía. No afecta el cálculo de campañas.">
                <InfoOutlinedIcon fontSize="small" />
              </Tooltip>
            </Stack>
          </Box>

          {/* Exportar */}
          <Box sx={{ flex: '0 0 auto' }}>
            <Button
              variant="contained"
              onClick={handleExport}
              disabled={exporting || !startDate || !endDate}
              startIcon={
                exporting ? (
                  <CircularProgress
                    size={16}
                    color="inherit"
                  />
                ) : (
                  <DownloadOutlinedIcon />
                )
              }
            >
              {exporting ? 'Exportando…' : 'Exportar Excel'}
            </Button>
            <Button
              variant="outlined"
              color="primary"
              startIcon={<VisibilityOutlinedIcon />}
              onClick={() => setOpenStores(true)}
              sx={{ ml: 1 }}
            >
              Ver tiendas
            </Button>
          </Box>
        </Stack>

        {/* espacio reservado por si quieres badges/resumen compactos */}
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1}
          alignItems={{ xs: 'flex-start', sm: 'center' }}
          sx={{
            bgcolor:
              theme.palette.mode === 'dark'
                ? alpha(theme.palette.neutral?.[25] ?? '#fff', 0.04)
                : 'neutral.25',
            p: 1,
            borderRadius: 2,
            display: 'none',
            mt: 2,
          }}
        />
      </CardContent>

      <StoresReportModal
        open={openStores}
        onClose={() => setOpenStores(false)}
        start={toYYYYMMDD(startDate)!}
        end={toYYYYMMDD(endDate)!}
        periods={periods ?? 0}
        paymentMethod={(paymentMethod || undefined) as any}
        membershipType={membershipType}
      />
    </Card>
  );
}
