'use client';

// Bitácora de los robots del circular: quién va, qué hizo y dónde se trabó. Se consulta cada
// 3 s mientras alguno esté en marcha; después queda como resumen del último proceso.
import type { AgentStep, Pipeline } from '@/services/circular.service';
import { alpha, Box, Chip, CircularProgress, Stack, Typography } from '@mui/material';
import { memo } from 'react';
import { AGENT_STATUS } from './constants';
import { accuracyTone, fmtTime, statusOfStep } from './utils';

const FeedRow = memo(function FeedRow({
  agent,
  step,
}: {
  agent: Pipeline['agents'][string];
  step?: AgentStep;
}) {
  const status = statusOfStep(step);
  const st = AGENT_STATUS[status];
  const running = status === 'running';
  return (
    <Stack
      direction="row"
      alignItems="flex-start"
      gap={1.25}
      sx={{ opacity: step ? 1 : 0.45 }}
    >
      <Box
        aria-hidden
        sx={{
          width: 34,
          height: 34,
          borderRadius: '50%',
          flexShrink: 0,
          display: 'grid',
          placeItems: 'center',
          fontSize: 18,
          bgcolor: running ? 'primary.main' : 'action.hover',
          color: running ? 'primary.contrastText' : 'inherit',
          boxShadow: running ? (t) => `0 0 0 4px ${alpha(t.palette.primary.main, 0.18)}` : 'none',
        }}
      >
        {agent.emoji}
      </Box>
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Stack
          direction="row"
          alignItems="center"
          gap={1}
          flexWrap="wrap"
        >
          <Typography
            variant="body2"
            fontWeight={700}
          >
            {agent.name}
          </Typography>
          <Chip
            size="small"
            variant={step ? 'filled' : 'outlined'}
            color={st.chip}
            label={st.label}
            sx={{ height: 20 }}
          />
          {step?.at && (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ fontSize: 12, fontVariantNumeric: 'tabular-nums' }}
            >
              {fmtTime(step.at)}
            </Typography>
          )}
        </Stack>
        <Typography
          variant="body2"
          color={status === 'error' ? 'error.main' : 'text.secondary'}
          sx={{ fontSize: 12.5 }}
        >
          {step?.message || agent.role}
        </Typography>
      </Box>
    </Stack>
  );
});

export default function AgentFeed({ data }: { data: Pipeline | null }) {
  if (!data || !data.steps.length) return null;
  const byAgent = new Map(data.steps.map((s) => [s.agent, s]));

  return (
    <Box
      sx={{
        p: 1.5,
        borderRadius: 2,
        bgcolor: 'background.default',
        border: 1,
        borderColor: 'divider',
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        gap={1}
        sx={{ mb: 1 }}
      >
        <Typography
          variant="subtitle2"
          fontWeight={700}
        >
          Proceso del circular
        </Typography>
        {data.running && <CircularProgress size={14} />}
        {!data.running && data.accuracy != null && (
          <Chip
            size="small"
            color={accuracyTone(data.accuracy)}
            label={`Efectividad ${data.accuracy}%`}
          />
        )}
      </Stack>
      <Stack spacing={1}>
        {Object.keys(data.agents).map((key) => (
          <FeedRow
            key={key}
            agent={data.agents[key]}
            step={byAgent.get(key)}
          />
        ))}
      </Stack>
    </Box>
  );
}
