import type { DigestResponse, OtterConversation } from '@/services/otter.service';
import { formatWhen, meetingDate, meetingTitle } from './constants';

/**
 * Markdown del resumen para pegar en Slack/Notion/la tarea de Cowork.
 * Es el formato que se comparte, así que no lleva emojis ni tablas: texto plano
 * que se ve igual en cualquier lado.
 */
export function digestToMarkdown(meeting: OtterConversation, res: DigestResponse): string {
  const d = res.digest;
  const lines: string[] = [
    `# ${meetingTitle(meeting)}`,
    formatWhen(meetingDate(meeting)),
    '',
    d.resumen,
    '',
  ];

  if (d.porPersona?.length) {
    lines.push('## Por persona');
    for (const p of d.porPersona) {
      lines.push(`- **${p.persona}**`);
      if (p.hizo) lines.push(`  - Hizo: ${p.hizo}`);
      if (p.hara) lines.push(`  - Hará: ${p.hara}`);
      if (p.bloqueos) lines.push(`  - Bloqueo: ${p.bloqueos}`);
    }
    lines.push('');
  }

  if (d.decisiones?.length) {
    lines.push('## Decisiones', ...d.decisiones.map((x) => `- ${x}`), '');
  }

  if (d.bloqueos?.length) {
    lines.push(
      '## Bloqueos',
      ...d.bloqueos.map((b) => `- [${b.impacto || 'medio'}] ${b.que}${b.quien ? ` — ${b.quien}` : ''}`),
      ''
    );
  }

  if (d.actionItems?.length) {
    lines.push(
      '## Action items',
      ...d.actionItems.map((a) => {
        const who = a.responsable ? ` (@${a.responsable})` : '';
        const when = a.fecha ? ` — ${a.fecha}` : '';
        return `- [ ] ${a.tarea}${who}${when}`;
      }),
      ''
    );
  }

  if (d.riesgos?.length) {
    lines.push('## Riesgos', ...d.riesgos.map((x) => `- ${x}`), '');
  }

  if (res.truncated) {
    lines.push('_Transcript truncado: se analizó sólo la primera parte._');
  }

  return lines.join('\n').trim();
}
