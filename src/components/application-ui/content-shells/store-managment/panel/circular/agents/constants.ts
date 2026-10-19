/**
 * Pestaña Agentes IA: claves de React Query propias, el equipo de robots y los mapas de
 * etiquetas. Un solo lugar para lo que antes estaba repetido entre la oficina, la bitácora
 * y las tarjetas.
 */
import type { Pipeline, ProductReviewItem } from '@/services/circular.service';

/** Claves de esta pestaña (las compartidas con otras secciones viven en `../hooks` → `qk`). */
export const agentKeys = {
  pipeline: (circularId?: string | null) => ['circular-pipeline', circularId] as const,
  audit: (circularId?: string) => ['circular-audit', circularId] as const,
  profile: (storeSlug: string) => ['store-profile', storeSlug] as const,
  review: (storeSlug: string) => ['product-review', storeSlug] as const,
};

export type AgentStatus = 'waiting' | 'running' | 'done' | 'error';
export type Tone = 'success' | 'warning' | 'error';

/** Orden de la cadena: cada uno le pasa el trabajo al siguiente. */
export const ORDER = ['hermes', 'argos', 'mnemosine', 'hefesto', 'atenea', 'iris', 'temis'];

/** El equipo por defecto, para pintar la oficina aunque la tienda no tenga circular todavía. */
export const TEAM: Pipeline['agents'] = {
  hermes: { name: 'Hermes', emoji: '📨', role: 'Trae el archivo y arma las páginas' },
  argos: { name: 'Argos', emoji: '👁️', role: 'Lee los productos de cada página' },
  mnemosine: {
    name: 'Mnemósine',
    emoji: '🧠',
    role: 'Busca cada producto en la base: si ya estaba lo reutiliza, si no lo agrega',
  },
  hefesto: { name: 'Hefesto', emoji: '🔧', role: 'Guarda y actualiza el catálogo de la tienda' },
  atenea: {
    name: 'Atenea',
    emoji: '🦉',
    role: 'Audita página por página: precios, cantidades, letra chica y fotos',
  },
  iris: { name: 'Iris', emoji: '🌈', role: 'Limpia y genera las fotos de producto' },
  temis: { name: 'Temis', emoji: '⚖️', role: 'Decide qué se ve en la lista y quita duplicados' },
};

// Qué hace cada uno, contado para quien no sabe de IA (se ve al hacerle click).
export const DETAIL: Record<string, string> = {
  hermes:
    'Recibe el PDF o la imagen del circular, lo parte en páginas y las deja listas para leer. Si el archivo viene roto o pesado, acá se nota primero.',
  argos:
    'Mira cada página con visión por IA y saca producto por producto: nombre, precio, tamaño, marca y letra chica. Las reglas y lecciones de la tienda las lee antes de empezar.',
  mnemosine:
    'Compara cada producto con la base de la tienda: si ya existía reutiliza su ficha y su foto, si es nuevo lo crea. Aprende los departamentos de la tienda.',
  hefesto:
    'Guarda todo en el catálogo con la fecha del flyer: los precios entran el día que corresponde y queda registro del precio anterior.',
  atenea:
    'Vuelve a leer el flyer página por página y coteja contra lo guardado: precios, cantidades, letra chica y fotos. Lo seguro lo corrige sola; lo dudoso te lo deja para decidir.',
  iris: 'Recorta y limpia las fotos de producto (sin fondo, livianas). Si una foto no era del producto, la busca de nuevo en su página.',
  temis:
    'Decide qué se ve en la lista del cliente: sólo lo del flyer vigente, sin duplicados, en el orden del circular.',
};

/** Nombre del autor de una lección ("all" = para todos). */
export const AGENT_NAME: Record<string, string> = {
  hermes: 'Hermes',
  argos: 'Argos',
  mnemosine: 'Mnemósine',
  hefesto: 'Hefesto',
  atenea: 'Atenea',
  iris: 'Iris',
  temis: 'Temis',
  all: 'Todos',
};

/** Estado de un agente: rótulo de la bitácora, rótulo corto de la oficina y color del tema. */
export const AGENT_STATUS: Record<
  AgentStatus,
  {
    label: string;
    short: string;
    chip: 'default' | 'info' | 'success' | 'error' | 'primary';
    text: string;
  }
> = {
  waiting: { label: 'Esperando', short: 'esperando', chip: 'default', text: 'text.secondary' },
  running: { label: 'En marcha', short: 'trabajando', chip: 'primary', text: 'primary.main' },
  done: { label: 'Listo', short: 'listo', chip: 'success', text: 'success.main' },
  error: { label: 'Falló', short: 'falló', chip: 'error', text: 'error.main' },
};

/** Qué tipo de diferencia encontró la revisión diaria. */
export const REVIEW_KIND: Record<ProductReviewItem['kind'], string> = {
  price: 'Precio',
  name: 'Nombre',
  fineprint: 'Letra chica',
  duplicate: 'Duplicado',
};

export const RULES_MAX = 2000;
export const LESSON_MAX = 300;
