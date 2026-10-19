'use client';

/**
 * La oficina de los robots, estilo juego: escena isométrica en SVG (sin librerías) con un
 * escritorio por agente, monitores, plantas, café y pizarra. Cada agente es un personaje SVG
 * propio que camina, se sienta a teclear cuando trabaja, va a avisarle al siguiente cuando
 * termina y pasea cuando no hay nada que hacer. Los globos salen de la bitácora real del
 * circular (`/circulars/:id/pipeline`). Abajo, una caja para darles instrucciones: se guardan
 * como "lección" de la tienda y los agentes las leen en la próxima lectura.
 *
 * Presentacional: la bitácora y las acciones (guardar instrucción, arrancar la revisión)
 * llegan del contenedor; acá sólo vive el estado de la escena.
 */
import type { Pipeline } from '@/services/circular.service';
import { Box, Chip, CircularProgress, Stack, Typography, useTheme } from '@mui/material';
import { memo, useCallback, useMemo, useState } from 'react';
import { ORDER, TEAM } from '../constants';
import { accuracyTone, emptyPipeline, statusOfStep } from '../utils';
import AgentDetail from './AgentDetail';
import AgentRoster from './AgentRoster';
import OfficeInstructions from './OfficeInstructions';
import OfficeScene from './OfficeScene';
import { OFFICE_CSS } from './officeStyles';
import { officePalette } from './palette';
import { agentLine, instructionReply, pick, SAY } from './script';
import { useOfficeWalkers, useReplyBubbles } from './use-office';

type Props = {
  data?: Pipeline | null;
  loading?: boolean;
  /** Guarda la instrucción como lección (a nombre del agente elegido, si hay). Rechaza si falla. */
  onSendInstruction: (text: string, agent?: string) => Promise<unknown>;
  sending: boolean;
  /** "Sí, dale": arranca la revisión diaria. Rechaza si falla. */
  onStartReview: () => Promise<unknown>;
  starting: boolean;
};

function AgentOffice({
  data,
  loading,
  onSendInstruction,
  sending,
  onStartReview,
  starting,
}: Props) {
  const theme = useTheme();
  const pal = useMemo(() => officePalette(theme), [theme]);

  const agents = data?.agents && Object.keys(data.agents).length ? data.agents : TEAM;
  const byAgent = useMemo(() => new Map((data?.steps || []).map((s) => [s.agent, s])), [data]);
  const keys = useMemo(() => ORDER.filter((k) => agents[k]), [agents]);
  const statuses = useMemo(
    () => Object.fromEntries(keys.map((k) => [k, statusOfStep(byAgent.get(k))])),
    [keys, byAgent]
  );
  const pipe = data || emptyPipeline(agents);

  const { pos, tick } = useOfficeWalkers(keys, statuses, data);
  const { reply, say } = useReplyBubbles();

  // Click en un personaje: queda elegido, habla siempre y abajo cuenta qué está haciendo.
  const [selected, setSelected] = useState<string | null>(null);
  const toggle = useCallback((k: string) => setSelected((cur) => (cur === k ? null : k)), []);

  // Quién habla: los que trabajan o fallaron siempre; uno más por turno; y el elegido.
  const talking = new Set<string>(
    keys.filter((k) => statuses[k] === 'running' || statuses[k] === 'error')
  );
  if (talking.size < 2 && keys.length) talking.add(keys[tick % keys.length]);
  if (selected) talking.add(selected);
  const lines = Object.fromEntries(
    keys.map((k, i) => [k, agentLine(k, byAgent.get(k), pipe, i + tick)])
  );

  // Instrucciones desde la oficina → lección de la tienda (le contesta el elegido, o Temis).
  const send = async (text: string) => {
    await onSendInstruction(text, selected || undefined);
    say({ [selected || 'temis']: instructionReply(text, !!selected) });
  };
  // Respuestas rápidas del patrón: "Sí, dale" arranca la revisión diaria (Atenea coteja todo
  // contra el flyer); "Descansen" sólo les contesta.
  const answer = (kind: 'go' | 'rest') => {
    const all = Object.fromEntries(
      keys.map((k, i) => [k, pick(kind === 'go' ? SAY.go : SAY.thanks, i + tick)])
    );
    if (kind === 'rest') return say(all);
    onStartReview().then(
      () => say(all),
      () => undefined // el toast de error lo pone la mutación
    );
  };
  const asking = !data?.running && keys.some((k) => statuses[k] === 'done' || !byAgent.get(k));

  return (
    <Box
      sx={{
        position: 'relative',
        borderRadius: 3,
        overflow: 'hidden',
        border: 1,
        borderColor: 'divider',
        bgcolor: pal.bg,
      }}
    >
      <style>{OFFICE_CSS}</style>

      <Stack
        direction="row"
        alignItems="center"
        gap={1}
        flexWrap="wrap"
        sx={{ position: 'absolute', top: 12, left: 14, right: 14, zIndex: 2 }}
      >
        <Typography
          variant="subtitle2"
          fontWeight={800}
        >
          La oficina
        </Typography>
        {loading && <CircularProgress size={14} />}
        {data?.running && (
          <Chip
            size="small"
            color="primary"
            label="Trabajando ahora"
          />
        )}
        {data && !data.running && data.accuracy != null && (
          <Chip
            size="small"
            color={accuracyTone(data.accuracy)}
            label={`Efectividad ${data.accuracy}%`}
          />
        )}
        {!data && !loading && (
          <Chip
            size="small"
            variant="outlined"
            label="Sin circular todavía"
          />
        )}
      </Stack>

      <OfficeScene
        keys={keys}
        agents={agents}
        statuses={statuses}
        pos={pos}
        lines={lines}
        talking={talking}
        reply={reply}
        selected={selected}
        pal={pal}
        onToggle={toggle}
      />

      {selected && agents[selected] && (
        <AgentDetail
          k={selected}
          agent={agents[selected]}
          status={statuses[selected]}
          step={byAgent.get(selected)}
          running={!!data?.running}
          pal={pal}
          onClose={() => setSelected(null)}
        />
      )}

      <OfficeInstructions
        asking={asking}
        answering={starting}
        onAnswer={answer}
        target={selected && agents[selected] ? agents[selected].name : undefined}
        sending={sending}
        onSend={send}
      />

      <AgentRoster
        keys={keys}
        agents={agents}
        statuses={statuses}
        selected={selected}
        pal={pal}
        onToggle={toggle}
      />
    </Box>
  );
}

export default memo(AgentOffice);
