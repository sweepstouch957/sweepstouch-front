/** Lo que dicen los robots en sus globos, armado desde la bitácora real. */
import type { AgentStep, Pipeline } from '@/services/circular.service';
import { ORDER } from '../constants';

// Repertorio de cada estado: el mensaje real de la bitácora va primero y el remate le da voz
// de empleado que le habla al patrón. Se rota con el turno para que no repitan siempre lo mismo.
export const SAY = {
  idle: [
    '☕ Un cafecito mientras llega el próximo circular, patrón.',
    'Todo al día por acá, patrón. ¿Hay algo más?',
    '¿Alguien vio el flyer de la semana que viene?',
    'Sin pendientes. Estiro las piernas un rato.',
    'Hoy no se me trabó nada 😎',
    '¿Mandamos el circular nuevo cuando quiera, patrón?',
  ],
  waiting: [
    'Esperando a que {prev} termine…',
    'En cuanto {prev} me pase lo suyo, arranco.',
    'Listo en mi puesto, patrón.',
  ],
  first: ['Listo para arrancar, patrón.', 'Apenas llegue el archivo, lo traigo.'],
  running: ['{msg}', '{msg} Ya casi, patrón.', '{msg} Dame un minuto.'],
  done: [
    '{msg} ¿Vuelvo a trabajar, patrón?',
    '{msg} Ya terminé lo mío. ¿Algo más?',
    '{msg} Listo por mi parte, patrón 👍',
  ],
  handoff: [
    '{msg} ¡{next}, te toca!',
    '{msg} Te lo dejo en tu escritorio, {next}.',
    'Terminé, {next}. Es todo tuyo.',
  ],
  error: ['Me trabé, patrón: {msg}', 'Necesito ayuda: {msg}', 'Esto no me salió: {msg}'],
  thanks: ['¡Gracias, patrón! ☕', 'Me lo gané, ¿no? 😄', 'Descanso cinco y vuelvo.'],
  go: ['¡A trabajar! 💪', 'Sí, patrón. Voy.', 'Ahora mismo, patrón.'],
};

export const pick = (arr: string[], i: number) => arr[((i % arr.length) + arr.length) % arr.length];

const fill = (tpl: string, v: Record<string, string>) =>
  tpl
    .replace(/\{(\w+)\}/g, (_, k) => v[k] ?? '')
    .replace(/\s+/g, ' ')
    .trim();

/** El globo de un agente según su paso en la bitácora y el turno `i`. */
export function agentLine(k: string, s: AgentStep | undefined, data: Pipeline, i: number) {
  const name = (x: string) => data.agents[x]?.name || x;
  const next = ORDER[ORDER.indexOf(k) + 1];
  const prev = ORDER[ORDER.indexOf(k) - 1];
  const msg = (s?.message || '').trim().replace(/[.…]+$/, '');
  const v = {
    msg: msg ? `${msg}.` : '',
    prev: prev ? name(prev) : '',
    next: next ? name(next) : '',
  };
  if (!s) return fill(pick(data.running ? (prev ? SAY.waiting : SAY.first) : SAY.idle, i), v);
  if (s.status === 'running')
    return fill(pick(SAY.running, i), { ...v, msg: msg ? `${msg}…` : 'Trabajando…' });
  if (s.status === 'error') return fill(pick(SAY.error, i), { ...v, msg: msg || 'error' });
  const nxt = next ? data.steps.find((x) => x.agent === next) : null;
  return fill(pick(nxt?.status === 'running' ? SAY.handoff : SAY.done, i), v);
}

/** Lo que contesta el agente cuando el patrón le deja una instrucción. */
export function instructionReply(text: string, toAgent: boolean) {
  return `Anotado, patrón: "${text.slice(0, 60)}${text.length > 60 ? '…' : ''}". ${
    toAgent ? 'Lo tengo en cuenta la próxima vez.' : 'Lo aplicamos en la próxima lectura.'
  }`;
}
