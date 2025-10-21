'use client';

import { useStoresRangeReport } from '@/hooks/fetching/billing/useBilling';
import type { MembershipType, PaymentMethod, WeekStart } from '@/services/billing.service';
import AssessmentTwoToneIcon from '@mui/icons-material/AssessmentTwoTone';
import { Button, Chip, CircularProgress, Divider, Skeleton, Stack, Typography } from '@mui/material';
import { alpha, styled } from '@mui/material/styles';
import { PieChart, useDrawingArea } from '@mui/x-charts';
import * as XLSX from 'xlsx';

const CenterText = styled('text')(({ theme }) => ({
  fill: theme.palette.text.primary,
  textAnchor: 'middle',
  dominantBaseline: 'central',
  fontSize: 14,
  fontWeight: 700,
}));
/* =================== Botón Descargar (Excel) =================== */
function PieCenterLabel({ children }: { children: React.ReactNode }) {
  const { width, height, left, top } = useDrawingArea();
  return (
    <CenterText
      x={left + width / 2}
      y={top + height / 2}
    >
      {children}
    </CenterText>
  );
}
export function DownloadButton({
  start,
  end,
  weekStart,
  paymentMethod,
  membershipType,
}: {
  start: string; // YYYY-MM-DD
  end: string; // YYYY-MM-DD
  weekStart: WeekStart;
  paymentMethod?: PaymentMethod | '';
  membershipType?: MembershipType;
}) {
  const params = {
    start,
    end,
    weekStart,
    paymentMethod: paymentMethod || undefined,
    membershipType,
  };

  const storesReport = useStoresRangeReport(params, { enabled: false });

  const isLoading = storesReport.isLoading || storesReport.isFetching;
  async function handleDownload() {
    const { data } = await storesReport.refetch();
    if (!data) return;

    // tipamos filas con string en Membership/PaymentMethod para permitir '' en TOTAL
    type Row = {
      Store: string;
      Membership: string;
      PaymentMethod: string;
      SMS: number;
      MMS: number;
      CampaignsTotal: number;
      MembershipFee: number;
      GrandTotal: number;
    };

    const rows: Row[] =
      data.stores?.map((s) => ({
        Store: s.storeName,
        Membership: String(s.membershipType ?? ''),
        PaymentMethod: String(s.paymentMethod ?? ''),
        SMS: s.sms,
        MMS: s.mms,
        CampaignsTotal: s.campaignsTotal,
        MembershipFee: s.storesFee,
        GrandTotal: s.grandTotal,
      })) ?? [];

    if (data.totals) {
      rows.push({
        Store: 'TOTAL',
        Membership: '',
        PaymentMethod: '',
        SMS: data.totals.sms,
        MMS: data.totals.mms,
        CampaignsTotal: data.totals.campaignsTotal,
        MembershipFee: data.totals.storesFee,
        GrandTotal: data.totals.grandTotal,
      });
    }

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'StoresReport');

    const fname = `stores-report_${start}_to_${end}_${weekStart}${
      paymentMethod ? `_pm-${paymentMethod}` : ''
    }${membershipType ? `_mem-${membershipType}` : ''}.xlsx`;

    XLSX.writeFile(wb, fname);
  }

  return (
    <Button
      size="small"
      variant="contained"
      startIcon={
        isLoading ? <CircularProgress size={"small"} /> : <AssessmentTwoToneIcon fontSize="small" />
      }
      onClick={handleDownload}
      disabled={isLoading}
      sx={{
        px: 2,
        boxShadow: (theme) =>
          `0px 1px 4px ${alpha(theme.palette.primary.main, 0.25)}, 0px 3px 12px 2px ${alpha(
            theme.palette.primary.main,
            0.35
          )}`,
        '&:hover': {
          boxShadow: (theme) =>
            `0px 1px 4px ${alpha(theme.palette.primary.main, 0.25)}, 0px 3px 12px 2px ${alpha(
              theme.palette.primary.main,
              0.35
            )}`,
          transform: 'translateY(-1px)',
        },
      }}
    >
      Descargar reporte
    </Button>
  );
}

/* =================== Otros componentes UI =================== */

export function KpiBlock({ title, value, hint }: { title: string; value?: string; hint?: string }) {
  return (
    <div style={{ padding: 8, textAlign: 'center', flex: 1 }}>
      <Typography
        variant="caption"
        color="text.secondary"
        gutterBottom
      >
        {title}
      </Typography>
      <Typography variant="h3">{value ?? <Skeleton width={140} />}</Typography>
      {hint && (
        <Typography
          variant="caption"
          color="text.secondary"
        >
          {hint}
        </Typography>
      )}
    </div>
  );
}

export function StatusChip({ loading, error }: { loading: boolean; error: boolean }) {
  if (loading)
    return (
      <Chip
        color="default"
        variant="outlined"
        label="Cargando…"
      />
    );
  if (error)
    return (
      <Chip
        color="error"
        variant="filled"
        label="Error"
      />
    );
  return (
    <Chip
      color="success"
      variant="filled"
      label="$"
    />
  );
}

export function LegendRow({ children }: { children: React.ReactNode }) {
  return (
    <Stack
      direction="row"
      alignItems="center"
      spacing={1}
    >
      {children}
    </Stack>
  );
}

export function Dot({ color }: { color: string }) {
  return (
    <div
      style={{
        width: 12,
        height: 12,
        borderRadius: 4,
        background: color,
        display: 'inline-block',
      }}
    />
  );
}

export function PieWithLegend({
  smsValue,
  mmsValue,
  storesValue,
  colorSMS,
  colorMMS,
  colorStores,
  grandTotal,
}: {
  smsValue: number;
  mmsValue: number;
  storesValue: number;
  colorSMS: string;
  colorMMS: string;
  colorStores: string;
  grandTotal: number;
}) {
  const campaignsValue = (smsValue ?? 0) + (mmsValue ?? 0);

  return (
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      spacing={2}
      alignItems="center"
    >
      <PieChart
        width={240}
        height={240}
        slotProps={{ legend: { hidden: true } }}
        series={[
          {
            data: [
              { id: 0, value: smsValue ?? 0, label: 'SMS', color: colorSMS },
              { id: 1, value: mmsValue ?? 0, label: 'MMS', color: colorMMS },
              { id: 2, value: storesValue ?? 0, label: 'Membresías', color: colorStores },
            ],
            innerRadius: 70,
            paddingAngle: 2,
          },
        ]}
        margin={{ right: 0 }}
      >
        <PieCenterLabel>
          {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(
            grandTotal ?? 0
          )}
        </PieCenterLabel>
      </PieChart>

      <Stack
        spacing={1}
        minWidth={220}
        flex={1}
      >
        <LegendRow>
          <Dot color={colorSMS} />
          <Typography sx={{ color: colorSMS, px: 0.5 }}>
            {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(
              smsValue ?? 0
            )}
          </Typography>
          SMS
        </LegendRow>
        <LegendRow>
          <Dot color={colorMMS} />
          <Typography sx={{ color: colorMMS, px: 0.5 }}>
            {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(
              mmsValue ?? 0
            )}
          </Typography>
          MMS
        </LegendRow>
        <LegendRow>
          <Dot color={colorStores} />
          <Typography sx={{ color: colorStores, px: 0.5 }}>
            {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(
              storesValue ?? 0
            )}
          </Typography>
          Membresías
        </LegendRow>
        <Divider flexItem />
        <LegendRow>
          <Typography
            variant="caption"
            color="text.secondary"
          >
            Campañas (SMS+MMS):
          </Typography>
          <Typography fontWeight={700}>
            {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(
              campaignsValue
            )}
          </Typography>
        </LegendRow>
        <LegendRow>
          <Typography
            variant="caption"
            color="text.secondary"
          >
            Total:
          </Typography>
          <Typography fontWeight={700}>
            {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(
              grandTotal ?? 0
            )}
          </Typography>
        </LegendRow>
      </Stack>
    </Stack>
  );
}
