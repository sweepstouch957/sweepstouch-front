'use client';

/** Hablando con el elegido: qué hace, qué está haciendo ahora y desde cuándo. */
import type { AgentStep, Pipeline } from '@/services/circular.service';
import { alpha, Box, Chip, Stack, Typography } from '@mui/material';
import { AGENT_STATUS, DETAIL, type AgentStatus } from '../constants';
import { fmtStamp } from '../utils';
import { CharacterThumb } from './Character';
import type { OfficePalette } from './palette';

export default function AgentDetail({
  k,
  agent,
  status,
  step,
  running,
  pal,
  onClose,
}: {
  k: string;
  agent: Pipeline['agents'][string];
  status: AgentStatus;
  step?: AgentStep;
  /** La cadena está en marcha (para decir "esperando su turno"). */
  running: boolean;
  pal: OfficePalette;
  onClose: () => void;
}) {
  const st = AGENT_STATUS[status];
  return (
    <Stack
      direction="row"
      gap={1.5}
      alignItems="flex-start"
      sx={{
        mx: 2,
        mt: 1.5,
        p: 1.5,
        borderRadius: 2,
        border: 1,
        borderColor: 'primary.main',
        bgcolor: (t) => alpha(t.palette.primary.main, 0.05),
      }}
    >
      <CharacterThumb
        k={k}
        status={status}
        ring={pal.ring[status]}
        typing={status === 'running'}
        width={40}
        height={62}
      />
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Stack
          direction="row"
          alignItems="center"
          gap={1}
          flexWrap="wrap"
        >
          <Typography
            variant="subtitle2"
            fontWeight={800}
          >
            {agent.name}
          </Typography>
          <Chip
            size="small"
            color={st.chip}
            label={st.short}
          />
          {step?.at && (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ fontSize: 12 }}
            >
              {fmtStamp(step.at)}
            </Typography>
          )}
          <Chip
            size="small"
            variant="outlined"
            label="Cerrar"
            onClick={onClose}
            sx={{ ml: 'auto' }}
          />
        </Stack>
        <Typography
          variant="body2"
          sx={{ mt: 0.5 }}
        >
          <b>Ahora:</b>{' '}
          {step?.message || (running ? 'esperando su turno.' : 'sin trabajo pendiente.')}
        </Typography>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mt: 0.5 }}
        >
          <b>Su trabajo:</b> {DETAIL[k] || agent.role}
        </Typography>
      </Box>
    </Stack>
  );
}
