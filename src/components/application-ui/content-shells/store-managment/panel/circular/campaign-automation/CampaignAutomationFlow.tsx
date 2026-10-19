'use client';

import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import {
  alpha,
  Box,
  CircularProgress,
  Stack,
  Typography,
  useTheme,
  type Theme,
} from '@mui/material';
import { memo } from 'react';
import type { Step, StepState } from './steps';

const stateColor = (theme: Theme, s: StepState) =>
  s === 'done'
    ? theme.palette.success.main
    : s === 'active'
      ? theme.palette.info.main
      : s === 'error'
        ? theme.palette.error.main
        : theme.palette.text.disabled;

/** Un paso: círculo de estado + conector al siguiente + título y detalle. */
const FlowStep = memo(function FlowStep({ step: s, last }: { step: Step; last: boolean }) {
  const theme = useTheme();
  const c = stateColor(theme, s.state);
  const idle = s.state === 'idle';
  const dashed = alpha(theme.palette.text.disabled, 0.4);
  return (
    <Stack
      component="li"
      direction={{ xs: 'row', md: 'column' }}
      sx={{ flex: 1, minWidth: 0 }}
    >
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        alignItems="center"
        sx={{ flexShrink: 0 }}
      >
        <Box
          sx={{
            position: 'relative',
            width: 40,
            height: 40,
            borderRadius: '50%',
            display: 'grid',
            placeItems: 'center',
            color: idle ? c : theme.palette.common.white,
            bgcolor: idle ? alpha(c, 0.1) : c,
            border: idle ? `1.5px dashed ${alpha(c, 0.5)}` : 'none',
            '& svg': { fontSize: 20 },
          }}
        >
          {s.state === 'done' ? (
            <CheckRoundedIcon />
          ) : s.state === 'error' ? (
            <CloseRoundedIcon />
          ) : (
            s.icon
          )}
          {s.state === 'active' && (
            <CircularProgress
              size={48}
              thickness={2}
              sx={{ position: 'absolute', color: c }}
            />
          )}
        </Box>
        {/* Conector: lleno si este paso ya pasó el testigo al siguiente */}
        {!last && (
          <Box
            aria-hidden
            sx={{
              flex: 1,
              minWidth: { md: 16 },
              minHeight: { xs: 16, md: 0 },
              width: { xs: 2, md: 'auto' },
              height: { xs: 'auto', md: 2 },
              mx: { md: 1 },
              my: { xs: 0.5, md: 0 },
              bgcolor: s.state === 'done' ? stateColor(theme, 'done') : 'transparent',
              backgroundImage:
                s.state === 'done'
                  ? 'none'
                  : {
                      xs: `repeating-linear-gradient(180deg, ${dashed} 0 6px, transparent 6px 12px)`,
                      md: `repeating-linear-gradient(90deg, ${dashed} 0 6px, transparent 6px 12px)`,
                    },
            }}
          />
        )}
      </Stack>
      <Box
        sx={{
          pl: { xs: 1.5, md: 0 },
          pr: { md: 2 },
          pt: { md: 1 },
          pb: { xs: last ? 0 : 2, md: 0 },
          minWidth: 0,
        }}
      >
        <Typography
          variant="body2"
          fontWeight={700}
        >
          {s.title}
        </Typography>
        <Typography
          variant="body2"
          sx={{
            fontSize: 12.5,
            lineHeight: 1.4,
            color: s.state === 'error' ? 'error.main' : 'text.secondary',
          }}
        >
          {s.detail}
        </Typography>
      </Box>
    </Stack>
  );
});

/** Los pasos de la automatización conectados: en fila en escritorio, en columna en el teléfono. */
function CampaignAutomationFlow({ steps }: { steps: Step[] }) {
  return (
    <Stack
      direction={{ xs: 'column', md: 'row' }}
      alignItems="stretch"
      component="ol"
      aria-label="Automatización de la campaña"
      sx={{ listStyle: 'none', m: 0, p: 0 }}
    >
      {steps.map((s, i) => (
        <FlowStep
          key={s.title}
          step={s}
          last={i === steps.length - 1}
        />
      ))}
    </Stack>
  );
}

export default memo(CampaignAutomationFlow);
