'use client';

/** Quién es quién: una ficha por agente con su estado; click = elegirlo en la oficina. */
import type { Pipeline } from '@/services/circular.service';
import { alpha, Box, ButtonBase, Typography } from '@mui/material';
import { memo } from 'react';
import { AGENT_STATUS, type AgentStatus } from '../constants';
import { CharacterThumb } from './Character';
import type { OfficePalette } from './palette';

const RosterItem = memo(function RosterItem({
  k,
  agent,
  status,
  selected,
  ring,
  onToggle,
}: {
  k: string;
  agent: Pipeline['agents'][string];
  status: AgentStatus;
  selected: boolean;
  ring: string;
  onToggle: (k: string) => void;
}) {
  const st = AGENT_STATUS[status];
  return (
    <ButtonBase
      onClick={() => onToggle(k)}
      aria-pressed={selected}
      sx={{
        display: 'flex',
        justifyContent: 'flex-start',
        alignItems: 'flex-start',
        gap: 1,
        p: 1,
        textAlign: 'left',
        borderRadius: 2,
        border: 1,
        borderColor: selected ? 'primary.main' : 'transparent',
        bgcolor: (t) =>
          status === 'running' ? alpha(t.palette.primary.main, 0.08) : 'transparent',
        '&:hover': { bgcolor: (t) => alpha(t.palette.primary.main, 0.05) },
      }}
    >
      <CharacterThumb
        k={k}
        status={status}
        ring={ring}
        width={30}
        height={46}
      />
      <Box sx={{ minWidth: 0 }}>
        <Typography
          variant="body2"
          fontWeight={700}
          lineHeight={1.2}
        >
          {agent.name}{' '}
          <Box
            component="span"
            sx={{ fontSize: 12, fontWeight: 600, color: st.text }}
          >
            · {st.short}
          </Box>
        </Typography>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ fontSize: 12, lineHeight: 1.3, mt: 0.25 }}
        >
          {agent.role}
        </Typography>
      </Box>
    </ButtonBase>
  );
});

export default function AgentRoster({
  keys,
  agents,
  statuses,
  selected,
  pal,
  onToggle,
}: {
  keys: string[];
  agents: Pipeline['agents'];
  statuses: Record<string, AgentStatus>;
  selected: string | null;
  pal: OfficePalette;
  onToggle: (k: string) => void;
}) {
  return (
    <Box
      sx={{
        px: 2,
        pb: 2,
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(4, 1fr)' },
        gap: 1,
      }}
    >
      {keys.map((k) => (
        <RosterItem
          key={k}
          k={k}
          agent={agents[k]}
          status={statuses[k]}
          selected={selected === k}
          ring={pal.ring[statuses[k]]}
          onToggle={onToggle}
        />
      ))}
    </Box>
  );
}
