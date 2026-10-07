/**
 * "Enhance pedido" — el solicitante escribe el pedido con sus palabras y la IA
 * lo devuelve estructurado.
 *
 * FASE 1: reescritura simulada, sin red. Está acá y no dentro del componente
 * para que en fase 2 se reemplace el cuerpo de esta función por la llamada real
 * (`aiComplete` de ai.service, o el endpoint que definamos con Allan) sin tocar
 * la UI: la firma ya es asíncrona.
 */

const SECTIONS = ['Objetivo', 'Piezas y medidas', 'Contenido', 'Estilo', 'Referencias'];

/** Latencia simulada: sin ella el botón parece que no hizo nada. */
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function enhanceBrief(raw: string): Promise<string> {
  await delay(900);

  const text = raw.trim();
  if (!text) return text;

  // Ya estructurado por una corrida anterior: no se vuelve a envolver.
  if (SECTIONS.some((s) => text.startsWith(`${s}:`))) return text;

  const sentences = text
    .split(/(?<=[.!?])\s+|\n+/)
    .map((s) => s.trim())
    .filter(Boolean);

  const objetivo = sentences[0] ?? text;
  const resto = sentences.slice(1);

  const lines = [
    `Objetivo: ${objetivo}`,
    '',
    'Piezas y medidas: a definir con el diseñador.',
    '',
    'Contenido:',
    ...(resto.length ? resto.map((s) => `· ${s}`) : ['· (sin detalle adicional en el pedido original)']),
    '',
    'Estilo: según manual de marca de la tienda.',
    '',
    'Referencias: adjuntar imágenes si las hay.',
    '',
    '— Pedido reestructurado automáticamente. Revisar antes de asignar.',
  ];

  return lines.join('\n');
}
