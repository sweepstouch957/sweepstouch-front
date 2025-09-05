// ===== Deadline helpers (7 días desde createdAt) =====
import { Box, Chip, LinearProgress, Stack, Typography } from '@mui/material';
import React from 'react';

const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const TOTAL_MS = 7 * ONE_DAY_MS;

function humanLeft(msLeft: number) {
  const sign = msLeft < 0 ? -1 : 1;
  const abs = Math.abs(msLeft);
  const d = Math.floor(abs / ONE_DAY_MS);
  const h = Math.floor((abs % ONE_DAY_MS) / (60 * 60 * 1000));
  const m = Math.floor((abs % (60 * 60 * 1000)) / (60 * 1000));
  const txt = `${d}d ${h}h ${m}m`;
  return sign < 0 ? `+${txt}` : txt;
}

export function getDeadlineInfo(createdAtISO: string) {
  const createdMs = new Date(createdAtISO).getTime();
  const deadline = createdMs + TOTAL_MS;
  const now = Date.now();
  const msLeft = deadline - now;
  const elapsed = Math.min(Math.max(now - createdMs, 0), TOTAL_MS);
  const pctElapsed = Math.round((elapsed / TOTAL_MS) * 100);

  let status: 'success' | 'warning' | 'error' = 'success';
  let statusLabel = 'En tiempo';
  if (msLeft <= 0) {
    status = 'error';
    statusLabel = 'Vencido';
  } else if (msLeft <= 3 * ONE_DAY_MS) {
    status = 'warning';
    statusLabel = 'Por vencer';
  }

  return {
    msLeft,
    pctElapsed,
    status,
    statusLabel,
    deadlineDate: new Date(deadline),
  };
}

export function DeadlineHeader({ createdAt, value = 0 }: { createdAt: string; value: number }) {
  // tick para re-render cada minuto y refrescar el tiempo restante
  const [, setTick] = React.useState(0);
  React.useEffect(() => {
    const t = setInterval(() => setTick((x) => x + 1), 60 * 1000);
    return () => clearInterval(t);
  }, []);

  const { msLeft, pctElapsed, status, statusLabel, deadlineDate } = getDeadlineInfo(createdAt);

  return (
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      gap={1.5}
      alignItems={{ sm: 'center' }}
      sx={{ minWidth: 300, width: '100%' }}
    >
      <Box sx={{ flex: 1, minWidth: 220 }}>
        <LinearProgress
          variant="determinate"
          value={value}
          sx={{
            height: 10,
            borderRadius: 6,
            [`& .MuiLinearProgress-bar`]: { transition: 'width .3s ease' },
          }}
          color={status === 'success' ? 'success' : status === 'warning' ? 'warning' : 'error'}
        />
        <Stack
          direction="row"
          justifyContent="space-between"
        >
          <Typography
            variant="caption"
            color="text.secondary"
          >
            Progreso {value}%
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
          >
            Vence: {deadlineDate.toLocaleDateString()}
          </Typography>
        </Stack>
      </Box>
      <Chip
        size="small"
        color={status}
        label={
          msLeft <= 0
            ? `${statusLabel} • vencido hace ${humanLeft(msLeft)}`
            : `${statusLabel} • restan ${humanLeft(msLeft)}`
        }
      />
    </Stack>
  );
}
