'use client';

// Bitácora de los robots del circular: quién va, qué hizo y dónde se trabó. Se consulta cada
// 3 s mientras alguno esté en marcha; después queda como resumen del último proceso.
import { circularService } from '@/services/circular.service';
import { Box, Chip, CircularProgress, Stack, Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';

const STATUS: Record<string, { label: string; color: 'default' | 'info' | 'success' | 'error' }> = {
  waiting: { label: 'Esperando', color: 'default' },
  running: { label: 'En marcha', color: 'info' },
  done: { label: 'Listo', color: 'success' },
  error: { label: 'Falló', color: 'error' },
};

const fmtTime = (iso?: string) =>
  iso ? new Date(iso).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit', timeZone: 'America/New_York' }) : '';

export default function AgentFeed({ circularId, compact = false }: { circularId?: string | null; compact?: boolean }) {
  const q = useQuery({
    queryKey: ['circular-pipeline', circularId],
    queryFn: () => circularService.getPipeline(circularId!),
    enabled: !!circularId,
    refetchInterval: (query) => (query.state.data?.running ? 3000 : false),
  });
  const data = q.data;
  if (!circularId || !data || !data.steps.length) return null;
  const byAgent = new Map(data.steps.map((s) => [s.agent, s]));
  const order = Object.keys(data.agents);

  return (
    <Box sx={{ mt: 1.5, p: 1.5, borderRadius: 2, bgcolor: 'background.default', border: '1px solid', borderColor: 'divider' }}>
      <Stack direction="row" alignItems="center" gap={1} sx={{ mb: 1 }}>
        <Typography variant="subtitle2" fontWeight={700}>
          Proceso del circular
        </Typography>
        {data.running && <CircularProgress size={14} />}
        {!data.running && data.accuracy != null && (
          <Chip size="small" color={data.accuracy >= 95 ? 'success' : data.accuracy >= 85 ? 'warning' : 'error'} label={`Efectividad ${data.accuracy}%`} />
        )}
      </Stack>
      <Stack spacing={compact ? 0.5 : 1}>
        {order.map((key) => {
          const a = data.agents[key];
          const s = byAgent.get(key);
          const st = STATUS[s?.status || 'waiting'] || STATUS.waiting;
          return (
            <Stack key={key} direction="row" alignItems="flex-start" gap={1.25} sx={{ opacity: s ? 1 : 0.45 }}>
              <Box
                aria-hidden
                sx={{ width: 34, height: 34, borderRadius: '50%', flexShrink: 0, display: 'grid', placeItems: 'center', fontSize: 18, bgcolor: s?.status === 'running' ? 'primary.main' : 'action.hover', color: s?.status === 'running' ? '#fff' : 'inherit', boxShadow: s?.status === 'running' ? '0 0 0 4px rgba(232,18,127,.18)' : 'none' }}
              >
                {a.emoji}
              </Box>
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Stack direction="row" alignItems="center" gap={1} flexWrap="wrap">
                  <Typography variant="body2" fontWeight={700}>{a.name}</Typography>
                  <Chip size="small" variant={s ? 'filled' : 'outlined'} color={st.color} label={st.label} sx={{ height: 20 }} />
                  {s?.at && <Typography variant="caption" color="text.secondary">{fmtTime(s.at)}</Typography>}
                </Stack>
                <Typography variant="caption" color={s?.status === 'error' ? 'error.main' : 'text.secondary'} sx={{ display: 'block' }}>
                  {s?.message || a.role}
                </Typography>
              </Box>
            </Stack>
          );
        })}
      </Stack>
    </Box>
  );
}
