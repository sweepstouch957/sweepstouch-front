'use client';

import { Chip, Divider, Skeleton, Stack, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import { PieChart, useDrawingArea } from '@mui/x-charts';

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
        minWidth={165}
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


      </Stack>
    </Stack>
  );
}
