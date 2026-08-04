/**
 * Avatares: dos problemas que Lighthouse encontró en el panel.
 *
 * 1. La base de datos guarda `"default-profile.png"` como valor por defecto de
 *    `profileImage`. Al ponerlo tal cual en un <img>, el navegador lo resuelve
 *    RELATIVO a la ruta actual — de ahí el 404 de
 *    `/admin/applications/default-profile.png`. Un archivo que no existe se pide
 *    una vez por avatar en pantalla.
 *
 * 2. Las fotos de Cloudinary se bajaban a tamaño completo para pintarlas en
 *    22–28 px. Eran 1.094 KiB de más en la carga del tablero.
 */

/** Valores que la API manda cuando en realidad no hay foto. */
const PLACEHOLDERS = new Set(['', 'default-profile.png', 'default.png', 'null', 'undefined']);

const CLOUDINARY = '/image/upload/';

/**
 * URL lista para un <Avatar>. Devuelve `undefined` cuando no hay foto — MUI
 * pinta la inicial, que es justo lo que se quiere.
 *
 * @param size lado en px del avatar en pantalla. Se pide al doble para pantallas
 *             retina, que es lo máximo que se nota.
 */
export function avatarSrc(url?: string | null, size = 32): string | undefined {
  const raw = (url || '').trim();
  if (!raw || PLACEHOLDERS.has(raw)) return undefined;

  // Rutas relativas de la API: sólo sirven las absolutas o las de /public
  if (!/^(https?:|\/|data:|blob:)/.test(raw)) return undefined;

  const at = raw.indexOf(CLOUDINARY);
  if (at === -1) return raw;

  // Cloudinary transforma por URL: recorte cuadrado a la cara, formato y calidad
  // automáticos. Si ya trae transformaciones se deja como está para no pisarlas.
  const head = raw.slice(0, at + CLOUDINARY.length);
  const tail = raw.slice(at + CLOUDINARY.length);
  if (/^[a-z]{1,3}_[^/]+\//.test(tail)) return raw;

  const px = Math.round(size * 2);
  return `${head}c_fill,g_face,w_${px},h_${px},f_auto,q_auto/${tail}`;
}

/** Texto alternativo de una foto de persona. Vacío si no hay nombre que decir. */
export function avatarAlt(name?: string | null): string {
  const n = (name || '').trim();
  return n ? `Foto de ${n}` : '';
}

/** Iniciales para cuando no hay foto. */
export function initials(name?: string | null): string {
  return (name || '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

// ── Self-check: npx tsx src/utils/avatar.ts ─────────────────────────────────
if (typeof process !== 'undefined' && process.argv?.[1]?.includes('avatar')) {
  const assert = (cond: boolean, msg: string) => {
    if (!cond) throw new Error(msg);
  };

  assert(avatarSrc('default-profile.png') === undefined, 'el placeholder de la BD debe ser undefined');
  assert(avatarSrc('') === undefined, 'vacío debe ser undefined');
  assert(avatarSrc(null) === undefined, 'null debe ser undefined');
  // Una ruta relativa es la que producía el 404
  assert(avatarSrc('fotos/juan.png') === undefined, 'las rutas relativas se descartan');
  assert(avatarSrc('/avatars/1.png') === '/avatars/1.png', '/public se respeta');

  const cl = 'https://res.cloudinary.com/dg9gzic4s/image/upload/v177/profile-images/juan.jpg';
  const out = avatarSrc(cl, 24)!;
  assert(out.includes('c_fill,g_face,w_48,h_48,f_auto,q_auto'), 'debe pedir miniatura: ' + out);
  assert(out.endsWith('v177/profile-images/juan.jpg'), 'debe conservar el path: ' + out);

  // Si ya venía transformada, no se pisa
  const already = 'https://res.cloudinary.com/x/image/upload/w_100/v1/a.jpg';
  assert(avatarSrc(already) === already, 'no se pisan transformaciones existentes');

  assert(avatarAlt('Ana Paz') === 'Foto de Ana Paz', 'alt con nombre');
  assert(avatarAlt('') === '', 'sin nombre, alt vacío');
  assert(initials('jose fernando lopez') === 'JF', 'iniciales');

  console.log('✅ avatar self-check OK');
}
