'use client';

import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { Box, Chip, Divider, Skeleton, Stack, Typography } from '@mui/material';
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

export function KpiBlock({
  title,
  value,
  hint,
  onClick,
}: {
  title: string;
  value?: string;
  hint?: string;
  onClick?: () => void;
}) {
  return (
    <div
      style={{ padding: 8, textAlign: 'center', flex: 1, cursor: onClick ? 'pointer' : 'default' }}
      onClick={onClick}
    >
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ fontSize: { xs: 12, md: 11 } }}
        gutterBottom
      >
        <Box
          component="span"
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          {title}
          {onClick && <InfoOutlinedIcon sx={{ fontSize: 14, ml: 0.5, color: 'text.secondary' }} />}
        </Box>
      </Typography>
      <Typography variant="h3">{value ?? <Skeleton width={140} />}</Typography>
      {hint && (
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ fontSize: { xs: 12, md: 11 } }}
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
  optinValue = 0,
  colorSMS,
  colorMMS,
  colorStores,
  colorOptin,
  grandTotal,
  onClickSMS,
}: {
  smsValue: number;
  mmsValue: number;
  storesValue: number;
  optinValue?: number;
  colorSMS: string;
  colorMMS: string;
  colorStores: string;
  colorOptin: string;
  grandTotal: number;
  onClickSMS?: () => void;
}) {
  const campaignsValue = (smsValue ?? 0) + (mmsValue ?? 0);

  return (
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      spacing={2}
      alignItems="center"
    >
      <PieChart
        width={110}
        height={110}
        slotProps={{ legend: { hidden: true } }}
        series={[
          {
            data: [
              { id: 0, value: smsValue ?? 0, label: 'SMS', color: colorSMS },
              { id: 1, value: mmsValue ?? 0, label: 'MMS', color: colorMMS },
              { id: 2, value: storesValue ?? 0, label: 'Membresías', color: colorStores },
              { id: 3, value: optinValue ?? 0, label: 'Opt-in', color: colorOptin },
            ],
            innerRadius: 40,
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
        minWidth={180}
        flex={1}
      >
        <LegendRow>
          <Dot color={colorSMS} />
          <Box
            onClick={onClickSMS}
            sx={{
              display: 'flex',
              alignItems: 'center',
              cursor: onClickSMS ? 'pointer' : 'default',
              '&:hover': {
                textDecoration: onClickSMS ? 'underline' : 'none',
              },
            }}
          >
            <Typography sx={{ color: colorSMS, px: 0.5 }}>
              {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(
                smsValue ?? 0
              )}
            </Typography>
            SMS
          </Box>
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

        {/* 🚀 NUEVO: Opt-in */}
        <LegendRow>
          <Dot color={colorOptin} />
          <Typography sx={{ color: colorOptin, px: 0.5 }}>
            {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(
              optinValue ?? 0
            )}
          </Typography>
          Opt-in
        </LegendRow>

        <Divider flexItem />
      </Stack>
    </Stack>
  );
}
