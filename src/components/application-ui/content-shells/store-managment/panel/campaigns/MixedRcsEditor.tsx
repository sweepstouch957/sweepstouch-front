'use client';

/**
 * Personalización del RCS del piloto mixto (lo reciben TODOS los clientes con nombre, oct 2026).
 * SÓLO cambia ese RCS: el SMS/MMS del resto y el failover salen con el texto de la campaña.
 * Se guarda en `rcsOptions.contentTemplate` con type "MIXED"; el scheduler
 * (utils/mixed.js → normalizeMixedCustom / buildMixedRcsContent) valida cada campo y, ante
 * cualquier cosa rara, manda el RCS por defecto.
 *
 * Oct 2026: la plantilla queda SIEMPRE cargada (texto recomendado + botón al dashboard /me).
 * Los botones son una lista editable (texto + destino + URL propia), hasta 4 (tope RBM por
 * tarjeta). Lo que se toca seguido (texto, botones, prueba al celular) va arriba y el resto
 * en "Opciones avanzadas".
 */
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import SendIcon from '@mui/icons-material/Send';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  FormControlLabel,
  IconButton,
  MenuItem,
  Stack,
  Switch,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { useRef, useState } from 'react';
import { storeBrandOf, storeStreetOf } from './messaging/placeholders';

/** Destinos de un botón. Espejo de BUTTON_LINKS en scheduler utils/mixed.js. */
export const BUTTON_LINKS = [
  {
    value: 'home',
    label: 'Dashboard del cliente (/me)',
    hint: 'Su inicio con sesión: ofertas, lista, puntos. Entra sin código.',
  },
  {
    value: 'portada',
    label: 'Linktree con su sesión',
    hint: 'La portada pública de la tienda, ya logueado (#linklogin).',
  },
  {
    value: 'list',
    label: 'Hacer su lista',
    hint: 'Su lista única para elegir ofertas. Sin productos en el catálogo el botón no sale.',
  },
  {
    value: 'circular',
    label: 'Circular semanal',
    hint: 'El dashboard con el modal del circular abierto y "Ver mi lista".',
  },
  {
    value: 'pdf',
    label: 'Circular en el linktree',
    hint: 'La portada del linktree de la tienda con el circular abierto (el link de circularss primero; si no, el PDF cargado). Con sesión si el cliente la tiene.',
  },
  {
    value: 'custom',
    label: 'Link personalizado…',
    hint: 'Una URL propia (promo, web de la tienda, etc.).',
  },
] as const;
export type ButtonLink = (typeof BUTTON_LINKS)[number]['value'];
const isButtonLink = (v: unknown): v is ButtonLink => BUTTON_LINKS.some((b) => b.value === v);
/** Tope RBM: una tarjeta admite hasta 4 botones. */
export const MAX_BUTTONS = 4;
const URL_RX = /^(https?:\/\/)?[a-z0-9.-]+\.[a-z]{2,}(\/\S*)?$/i;

export type MixedButton = { text: string; link: ButtonLink; url: string };

/** Botón precargado al dashboard /me (default; se puede quitar para RCS sin botón). */
export const DEFAULT_BUTTON: MixedButton = { text: 'More deals here!', link: 'home', url: '' };
const BUTTON_TEXT_BY_LINK: Record<ButtonLink, string> = {
  home: 'More deals here!',
  portada: 'See all deals',
  list: 'Make my list',
  circular: 'Weekly circular',
  pdf: 'See the circular',
  custom: 'Learn more',
};

export type MixedRcsCustom = {
  /** 'named' = RCS sólo a clientes con nombre (piloto); 'all' = TODA la base por RCS. */
  audience: 'named' | 'all';
  greeting: string;
  title: string;
  body: string;
  /** Botones de la tarjeta, en orden. Vacío = RCS sin botón (sólo texto + imagen). */
  buttons: MixedButton[];
  openIn: 'webview' | 'browser';
  productCards: number;
};

/** Las líneas con #ahorro, #listlink o #address se borran solas (con su rótulo) si no hay dato. */
// OJO: la marca NO va en el cuerpo: ya es el título de la tarjeta (#brand en negrita; antes
// salía dos veces). El link tampoco: viaja en el botón, así que el cuerpo dice "tocá el botón".
export const MIXED_RCS_BODY = [
  '🍂 Specials of the week 🍁',
  '',
  'Hi #name 👋',
  'Start saving 💰 and earning points',
  '👇 Tap the button below 👇',
  '',
  '📍 Address: #address',
  '',
  '#disclaimer',
].join('\n');

const TAP_BELOW = '👇 Tap the button below 👇';

/**
 * Pasa el texto de una plantilla de SMS (#n = salto) al cuerpo del RCS: la primera línea con
 * la marca se va (es el título de la tarjeta) y la línea del link se cambia por "tocá el
 * botón" (en el RCS el link va en el botón, no en el texto).
 */
export const smsTemplateToRcsBody = (content: string) =>
  content
    .replace(/#n(?!ame(?![a-zA-Z]))/g, '\n')
    .split('\n')
    .filter((line, i) => !(i === 0 && /#brand|#store/i.test(line)))
    .map((line) => (/#(?:linklogin|linktree|link)(?![a-z])/i.test(line) ? TAP_BELOW : line))
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

export const MIXED_RCS_DEFAULTS: MixedRcsCustom = {
  // Toda la base por RCS (default desde 5 oct 2026). 'named' = sólo con nombre.
  audience: 'all',
  // El saludo ya va dentro del cuerpo ("Hi #name 👋"): sin saludo aparte no se duplica.
  greeting: '',
  title: '#brand',
  body: MIXED_RCS_BODY,
  buttons: [DEFAULT_BUTTON],
  // Navegador: el webview de Mensajes abría a media pantalla (pedido del dueño, 5 oct 2026).
  openIn: 'browser',
  productCards: 0,
};

/** Botones de un template guardado. Sin `buttons` (templates viejos) se arman del switch de lista + botón de ofertas. */
const buttonsFromTemplate = (tpl: any): MixedButton[] => {
  // Sin botones a propósito (sólo texto + imagen).
  if (tpl.noButtons === true) return [];
  if (Array.isArray(tpl.buttons) && tpl.buttons.length) {
    const list = tpl.buttons
      .map((b: any) => ({
        text: String(b?.text || '').slice(0, 25),
        link: isButtonLink(b?.link) ? b.link : 'home',
        url: String(b?.url || ''),
      }))
      .filter((b: MixedButton) => b.text)
      .slice(0, MAX_BUTTONS);
    if (list.length) return list;
  }
  const legacy: MixedButton[] = [];
  if (tpl.listButton !== false)
    legacy.push({ text: tpl.listButtonText || BUTTON_TEXT_BY_LINK.list, link: 'list', url: '' });
  legacy.push(
    tpl.buttonUrl
      ? { text: tpl.buttonText || DEFAULT_BUTTON.text, link: 'custom', url: tpl.buttonUrl }
      : { ...DEFAULT_BUTTON, text: tpl.buttonText || DEFAULT_BUTTON.text }
  );
  return legacy;
};

export const mixedCustomFromTemplate = (tpl: any): MixedRcsCustom =>
  tpl && tpl.type === 'MIXED'
    ? {
        audience: tpl.audience === 'named' ? 'named' : 'all',
        greeting: typeof tpl.greeting === 'string' ? tpl.greeting : MIXED_RCS_DEFAULTS.greeting,
        title: tpl.title || '',
        body: tpl.body || '',
        buttons: buttonsFromTemplate(tpl),
        openIn: tpl.openIn === 'webview' ? 'webview' : 'browser',
        productCards: Math.min(9, Math.max(0, Number(tpl.productCards) || 0)),
      }
    : MIXED_RCS_DEFAULTS;

/** Lo que viaja al backend. Lista vacía = `noButtons` (el scheduler manda el RCS sin botón). */
export function mixedTemplateFromCustom(c: MixedRcsCustom): Record<string, unknown> | undefined {
  const d = MIXED_RCS_DEFAULTS;
  const buttons = c.buttons
    .map((b) => ({
      text: b.text.trim().slice(0, 25),
      link: b.link,
      ...(b.link === 'custom' ? { url: b.url.trim() } : {}),
    }))
    .filter((b) => b.text && (b.link !== 'custom' || URL_RX.test(b.url || '')))
    .slice(0, MAX_BUTTONS);
  const out: Record<string, unknown> = {
    ...(c.audience === 'named' ? { audience: 'named' } : {}),
    // El saludo por defecto NO se manda: así el scheduler sigue omitiéndolo cuando el
    // texto de la campaña ya trae #name (no sale "Hi Maria! Hola Maria…").
    ...(c.greeting.trim() !== d.greeting ? { greeting: c.greeting.trim() } : {}),
    ...(c.title.trim() ? { title: c.title.trim() } : {}),
    // Texto vacío = el mismo texto del SMS/MMS de la campaña.
    ...(c.body.trim() ? { body: c.body.trim() } : {}),
    // Sin botones a propósito → noButtons (sin la bandera el scheduler pondría el de ofertas).
    ...(c.buttons.length === 0
      ? { noButtons: true }
      : { buttons: buttons.length ? buttons : [{ text: DEFAULT_BUTTON.text, link: 'home' }] }),
    ...(c.openIn === 'webview' ? { openIn: 'webview' } : {}),
    ...(c.productCards > 0 ? { productCards: c.productCards } : {}),
  };
  return { type: 'MIXED', ...out };
}

const TOKENS = [
  { key: '#name', label: 'Nombre del cliente' },
  { key: '#listlink', label: 'Link único de su lista' },
  { key: '#linklogin', label: 'Linktree con la sesión del cliente (sin código)' },
  { key: '#ahorro', label: 'Ahorro de la semana' },
  { key: '#address', label: 'Sólo la dirección' },
  { key: '#brand', label: 'Nombre sin dirección' },
  { key: '#store', label: 'Nombre de la tienda' },
  { key: '#message', label: 'Texto del SMS/MMS' },
];

type TextKey = 'greeting' | 'title' | 'body';
export type MixedPreviewProduct = { name: string; price?: string; imageUrl?: string };

export type MixedPreviewInput = {
  value: MixedRcsCustom;
  smsText: string;
  imageSrc?: string;
  storeName?: string;
  storeAddress?: string;
  products: MixedPreviewProduct[];
};

/**
 * Cómo se vería el RCS con un cliente de ejemplo. Aplica las mismas reglas que el scheduler:
 * la línea de un placeholder sin dato se borra junto con su rótulo; el botón de lista no sale
 * sin productos; un custom sin URL válida tampoco; si no queda ninguno, el de ofertas.
 * Lo usan el editor (para los estados de los campos) y la vista previa.
 */
export function buildMixedPreview({
  value,
  smsText,
  imageSrc,
  storeName,
  storeAddress,
  products,
}: MixedPreviewInput) {
  const hasProducts = products.length > 0;
  const withPhoto = products.filter((p) => p.imageUrl);
  const shown = value.buttons.filter(
    (b) =>
      b.text.trim() &&
      (b.link !== 'list' || hasProducts) &&
      (b.link !== 'custom' || URL_RX.test(b.url.trim()))
  );
  // Sin botones a propósito → ninguno. Con botones que no salen → el de ofertas (como el scheduler).
  const buttons = shown.length || value.buttons.length === 0 ? shown : [DEFAULT_BUTTON];
  const listOn = buttons.some((b) => b.link === 'list');

  const sample = (tpl: string) => {
    const vals: Record<string, string> = {
      '#ahorro': hasProducts ? '$12.50' : '',
      '#listlink': listOn ? 'swtrcs.com/s/XXXXXX' : '',
      '#address': storeStreetOf(storeAddress),
    };
    const kept: string[] = [];
    for (const line of tpl.split('\n')) {
      const empty = Object.keys(vals).some((t) => line.toLowerCase().includes(t) && !vals[t]);
      if (!empty) {
        kept.push(line);
        continue;
      }
      while (kept.length && !kept[kept.length - 1].trim()) kept.pop();
      if (kept.length && /:\s*$/.test(kept[kept.length - 1])) kept.pop();
    }
    return kept
      .join('\n')
      .replace(/#name/gi, 'Maria')
      .replace(/#store/gi, storeName || 'Tu tienda')
      .replace(/#brand(?![a-z])/gi, storeBrandOf(storeName) || 'Tu tienda')
      .replace(/#disclaimer/gi, 'Reply STOP to unsubscribe')
      .replace(/#ahorro/gi, vals['#ahorro'])
      .replace(/#listlink/gi, vals['#listlink'])
      .replace(/#address/gi, vals['#address'])
      .replace(/#(?:linklogin|linktree|link)(?![a-z])/gi, 'swtrcs.com/s/YYYYYY')
      .replace(/#message/gi, smsText || 'Texto de la campaña')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  };

  const greeting = sample(value.greeting.trim());
  const body = sample(value.body.trim()) || smsText || 'Texto de la campaña';
  return {
    hasProducts,
    withPhoto,
    listOn,
    greeting,
    body,
    title: sample(value.title.trim()) || greeting,
    cards: imageSrc && value.productCards > 0 ? withPhoto.slice(0, value.productCards) : [],
    buttons,
    /** Botón de las cards de productos: el de lista si existe, si no el primero (undefined sin botones). */
    cardButton: buttons.find((b) => b.link === 'list') ?? (buttons[0] as MixedButton | undefined),
  };
}

/** Sólo la tarjeta del RCS. Vive aparte para poder mostrarla junto a la del SMS/MMS en el
 *  mismo panel de vista previa, en vez de dos teléfonos sueltos en la pantalla. */
export function MixedRcsPreview(input: MixedPreviewInput) {
  const { imageSrc } = input;
  const { greeting, body, title, cards, buttons, cardButton } = buildMixedPreview(input);

  const btn = (label: string, key: string | number) => (
    <Box
      key={key}
      sx={{ borderTop: '1px solid', borderColor: 'divider', py: 0.9, textAlign: 'center' }}
    >
      <Typography
        variant="body2"
        color="primary"
        fontWeight={700}
      >
        {label}
      </Typography>
    </Box>
  );

  return (
    <Stack
      direction="row"
      gap={1}
      sx={{ overflowX: 'auto', pb: 0.5, alignItems: 'flex-start' }}
    >
      <Box
        sx={{
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 3,
          overflow: 'hidden',
          bgcolor: 'background.paper',
          width: cards.length ? 230 : '100%',
          flexShrink: 0,
        }}
      >
        {imageSrc && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageSrc}
            alt=""
            style={{
              display: 'block',
              width: '100%',
              maxHeight: cards.length ? 150 : 260,
              objectFit: 'cover',
            }}
          />
        )}
        <Box sx={{ p: 1.5 }}>
          {imageSrc ? (
            <>
              {title && (
                <Typography
                  variant="subtitle2"
                  fontWeight={700}
                >
                  {title}
                </Typography>
              )}
              <Typography
                variant="body2"
                sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', mt: 0.5 }}
              >
                {body}
              </Typography>
            </>
          ) : (
            <Typography
              variant="body2"
              sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
            >
              {greeting ? `${greeting} ${body}` : body}
            </Typography>
          )}
        </Box>
        {buttons.map((b, i) => btn(b.text.trim(), i))}
      </Box>
      {cards.map((p, i) => (
        <Box
          key={i}
          sx={{
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 3,
            overflow: 'hidden',
            bgcolor: 'background.paper',
            width: 170,
            flexShrink: 0,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={p.imageUrl}
            alt=""
            loading="lazy"
            style={{ display: 'block', width: '100%', height: 150, objectFit: 'contain' }}
          />
          <Box sx={{ p: 1.25 }}>
            <Typography
              variant="body2"
              fontWeight={700}
              sx={{ wordBreak: 'break-word' }}
            >
              {p.name}
              {p.price ? ` — ${p.price}` : ''}
            </Typography>
          </Box>
          {cardButton && btn(cardButton.text.trim(), 'card')}
        </Box>
      ))}
    </Stack>
  );
}

export default function MixedRcsEditor({
  value,
  onChange,
  smsText,
  imageSrc,
  storeName,
  storeAddress,
  products,
  productsLoaded,
  testPhone = '',
  onSendTest,
}: {
  value: MixedRcsCustom;
  onChange: (v: MixedRcsCustom) => void;
  /** Texto de la campaña: es lo que resuelve #message y el cuerpo si se deja vacío. */
  smsText: string;
  imageSrc?: string;
  storeName?: string;
  storeAddress?: string;
  /** Productos visibles del catálogo: definen si hay lista que armar y las cards. */
  products: MixedPreviewProduct[];
  productsLoaded: boolean;
  /** Teléfono del usuario logueado: destino por defecto de la prueba. */
  testPhone?: string;
  /** Manda el RCS real a ese teléfono. Lanza error con mensaje legible si falla. */
  onSendTest?: (phone: string) => Promise<void>;
}) {
  const refs = useRef<Partial<Record<TextKey, HTMLInputElement | HTMLTextAreaElement | null>>>({});
  const lastField = useRef<TextKey>('body');
  const set = (patch: Partial<MixedRcsCustom>) => onChange({ ...value, ...patch });

  // Botones: lista editable. Puede quedar vacía (campañas de sólo texto + imagen, 6 oct 2026).
  const buttons = value.buttons;
  const setButton = (i: number, patch: Partial<MixedButton>) =>
    set({ buttons: buttons.map((b, j) => (j === i ? { ...b, ...patch } : b)) });
  const changeLink = (i: number, link: ButtonLink) => {
    const b = buttons[i];
    // Si el texto era el sugerido del destino anterior, se cambia al del nuevo.
    const keepText = b.text.trim() && b.text.trim() !== BUTTON_TEXT_BY_LINK[b.link];
    setButton(i, { link, text: keepText ? b.text : BUTTON_TEXT_BY_LINK[link] });
  };
  const addButton = () => {
    if (buttons.length >= MAX_BUTTONS) return;
    // Sugerencia: el primer destino que todavía no esté usado.
    const used = new Set(buttons.map((b) => b.link));
    const next = (BUTTON_LINKS.find((l) => !used.has(l.value) && l.value !== 'custom')?.value ??
      'custom') as ButtonLink;
    set({ buttons: [...buttons, { text: BUTTON_TEXT_BY_LINK[next], link: next, url: '' }] });
  };
  const removeButton = (i: number) => set({ buttons: buttons.filter((_b, j) => j !== i) });

  // Prueba al celular: número editable (por defecto el del usuario logueado).
  const [phone, setPhone] = useState(testPhone);
  const [testState, setTestState] = useState<{ busy: boolean; msg: string; ok: boolean }>({
    busy: false,
    msg: '',
    ok: false,
  });
  const phoneDigits = phone.replace(/\D/g, '');
  const sendTest = async () => {
    if (!onSendTest || phoneDigits.length < 10) return;
    setTestState({ busy: true, msg: '', ok: false });
    try {
      await onSendTest(phoneDigits);
      setTestState({
        busy: false,
        ok: true,
        msg: `Prueba enviada a ${phone}. Llega en unos segundos.`,
      });
    } catch (e: any) {
      setTestState({
        busy: false,
        ok: false,
        msg: e?.response?.data?.error || e?.message || 'No se pudo enviar la prueba',
      });
    }
  };

  // El botón inserta el placeholder donde está el cursor del último campo tocado.
  const insert = (token: string) => {
    const key = lastField.current;
    const el = refs.current[key];
    const cur = value[key];
    const start = el?.selectionStart ?? cur.length;
    const end = el?.selectionEnd ?? cur.length;
    set({ [key]: cur.slice(0, start) + token + cur.slice(end) } as Partial<MixedRcsCustom>);
    requestAnimationFrame(() => {
      el?.focus();
      el?.setSelectionRange(start + token.length, start + token.length);
    });
  };

  const field = (key: TextKey) => ({
    inputRef: (el: HTMLInputElement | HTMLTextAreaElement | null) => {
      refs.current[key] = el;
    },
    onFocus: () => {
      lastField.current = key;
    },
    value: value[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      set({ [key]: e.target.value } as Partial<MixedRcsCustom>),
  });

  // La tarjeta de vista previa ya NO vive acá: se muestra en el panel único de vista previa
  // del formulario (antes había dos teléfonos en la misma pantalla).
  const { hasProducts, withPhoto } = buildMixedPreview({
    value,
    smsText,
    imageSrc,
    storeName,
    storeAddress,
    products,
  });

  return (
    <Box
      sx={{
        mt: 2,
        // Todos los campos son size="small" (14 px): en móvil iOS hace zoom al enfocarlos.
        // Se sube a 16 px en un solo lugar en vez de campo por campo.
        '& .MuiInputBase-input': { fontSize: { xs: 16, sm: 14 } },
      }}
    >
      {productsLoaded && !hasProducts && (
        <Alert
          severity="warning"
          sx={{ mb: 2 }}
        >
          Esta tienda no tiene productos visibles en su catálogo: el cliente no tendría con qué
          armar una lista. El RCS sale sin el botón de lista, sin el link único y sin la línea del
          ahorro. Cargá productos en Circular y Listas para activarlos.
        </Alert>
      )}
      {!imageSrc && (
        <Alert
          severity="info"
          sx={{ mb: 2 }}
        >
          La campaña no tiene imagen: el RCS sale como texto con botones. Con imagen sale como
          tarjeta (la imagen siempre va).
        </Alert>
      )}

      <Stack gap={2}>
        {/* ── Texto ─────────────────────────────────────────────────────────── */}
        <TextField
          size="small"
          fullWidth
          multiline
          minRows={6}
          maxRows={14}
          label="Texto del RCS"
          placeholder="Vacío = el mismo texto del SMS/MMS de la campaña"
          helperText={`${value.body.length}/1800. Si falta el dato de #ahorro, #listlink o #address, esa línea y su rótulo se quitan solos.`}
          inputProps={{ maxLength: 1800 }}
          {...field('body')}
        />
        <Box>
          <Typography
            variant="caption"
            color="text.secondary"
            display="block"
            sx={{ mb: 0.75 }}
          >
            Placeholders: tocá un campo y después el botón. Se reemplazan por cliente al enviar.
          </Typography>
          <Stack
            direction="row"
            flexWrap="wrap"
            gap={0.75}
          >
            {TOKENS.map((t) => (
              <Chip
                key={t.key}
                variant="outlined"
                color="primary"
                clickable
                // En el teléfono sólo el placeholder (el rótulo no entra) y con altura
                // táctil; en pantalla grande, placeholder + para qué sirve.
                label={
                  <Box component="span">
                    {t.key}
                    <Box
                      component="span"
                      sx={{ display: { xs: 'none', sm: 'inline' } }}
                    >
                      {` · ${t.label}`}
                    </Box>
                  </Box>
                }
                sx={{ height: { xs: 36, sm: 28 }, fontSize: { xs: 14, sm: 13 } }}
                onClick={() => insert(t.key)}
              />
            ))}
          </Stack>
        </Box>
        <Stack
          direction="row"
          gap={1}
          flexWrap="wrap"
        >
          <Button
            size="small"
            variant="outlined"
            onClick={() => set({ body: MIXED_RCS_BODY })}
          >
            Usar plantilla recomendada
          </Button>
          <Button
            size="small"
            variant="outlined"
            onClick={() => set({ body: '' })}
          >
            Usar el texto de la campaña
          </Button>
        </Stack>

        {/* ── Botones ───────────────────────────────────────────────────────── */}
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{ mt: 1 }}
        >
          <Box>
            <Typography
              variant="subtitle2"
              fontWeight={700}
            >
              Botones ({buttons.length}/{MAX_BUTTONS})
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
            >
              {buttons.length
                ? 'Cada botón elige a dónde lleva. Sin botones, el RCS sale sólo con texto e imagen.'
                : 'Sin botones: el RCS sale sólo con texto e imagen.'}
            </Typography>
          </Box>
          <Tooltip
            title={
              buttons.length >= MAX_BUTTONS
                ? `Máximo ${MAX_BUTTONS} botones por tarjeta`
                : 'Agregar botón'
            }
          >
            <span>
              <Button
                size="small"
                variant="outlined"
                startIcon={<AddIcon />}
                disabled={buttons.length >= MAX_BUTTONS}
                onClick={addButton}
                sx={{ minHeight: 36, flexShrink: 0 }}
              >
                Agregar
              </Button>
            </span>
          </Tooltip>
        </Stack>
        {buttons.map((b, i) => {
          const opt = BUTTON_LINKS.find((l) => l.value === b.link) ?? BUTTON_LINKS[0];
          const badUrl = b.link === 'custom' && !!b.url.trim() && !URL_RX.test(b.url.trim());
          const listOff = b.link === 'list' && productsLoaded && !hasProducts;
          return (
            <Box
              key={i}
              sx={{ p: 1.5, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}
            >
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                gap={1.5}
                alignItems={{ sm: 'flex-start' }}
              >
                <TextField
                  size="small"
                  fullWidth
                  label={`Texto del botón ${i + 1}`}
                  value={b.text}
                  onChange={(e) => setButton(i, { text: e.target.value })}
                  inputProps={{ maxLength: 25 }}
                  helperText={`${b.text.length}/25`}
                  error={!b.text.trim()}
                />
                <TextField
                  select
                  size="small"
                  fullWidth
                  label="A dónde lleva"
                  value={b.link}
                  onChange={(e) => changeLink(i, e.target.value as ButtonLink)}
                  helperText={
                    listOff ? 'La tienda no tiene productos: este botón no saldrá.' : opt.hint
                  }
                  FormHelperTextProps={{ sx: listOff ? { color: 'warning.main' } : undefined }}
                >
                  {BUTTON_LINKS.map((l) => (
                    <MenuItem
                      key={l.value}
                      value={l.value}
                    >
                      {l.label}
                    </MenuItem>
                  ))}
                </TextField>
                <Tooltip title="Quitar botón">
                  <span>
                    <IconButton
                      size="small"
                      color="inherit"
                      onClick={() => removeButton(i)}
                      sx={{ mt: { sm: 0.5 } }}
                      aria-label="Quitar botón"
                    >
                      <DeleteOutlineIcon fontSize="small" />
                    </IconButton>
                  </span>
                </Tooltip>
              </Stack>
              {b.link === 'custom' && (
                <TextField
                  size="small"
                  fullWidth
                  label="Link personalizado"
                  placeholder="https://…"
                  value={b.url}
                  onChange={(e) => setButton(i, { url: e.target.value })}
                  error={badUrl}
                  helperText={
                    badUrl
                      ? 'Link inválido: el botón no saldrá'
                      : 'Sin link válido el botón no sale'
                  }
                  sx={{ mt: 1.5 }}
                />
              )}
            </Box>
          );
        })}

        {/* ── Prueba al celular ─────────────────────────────────────────────── */}
        {onSendTest && (
          <Box
            sx={{
              p: 1.5,
              borderRadius: 2,
              border: '1px dashed',
              borderColor: 'divider',
              bgcolor: 'action.hover',
            }}
          >
            <Typography
              variant="subtitle2"
              fontWeight={700}
              gutterBottom
            >
              Enviarme una prueba
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              display="block"
              sx={{ mb: 1 }}
            >
              Sale el RCS real a ese número con la imagen, el texto y los botones de arriba. Si el
              número está en la base de la tienda, llega con su sesión (dashboard y lista).
            </Typography>
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              gap={1}
              alignItems={{ sm: 'center' }}
            >
              <TextField
                size="small"
                label="Teléfono"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                inputProps={{ inputMode: 'tel', maxLength: 20 }}
                sx={{ minWidth: 200 }}
              />
              <Button
                variant="contained"
                size="small"
                startIcon={
                  testState.busy ? (
                    <CircularProgress
                      size={14}
                      color="inherit"
                    />
                  ) : (
                    <SendIcon />
                  )
                }
                disabled={testState.busy || phoneDigits.length < 10 || !smsText.trim()}
                onClick={sendTest}
                sx={{ minHeight: 40 }}
              >
                {testState.busy ? 'Enviando…' : 'Enviar prueba'}
              </Button>
            </Stack>
            {!smsText.trim() && (
              <Typography
                variant="caption"
                color="warning.main"
                display="block"
                sx={{ mt: 0.5 }}
              >
                Escribí el texto de la campaña antes de probar.
              </Typography>
            )}
            {testState.msg && (
              <Alert
                severity={testState.ok ? 'success' : 'error'}
                sx={{ mt: 1, py: 0 }}
              >
                {testState.msg}
              </Alert>
            )}
          </Box>
        )}

        {/* ── Avanzado ──────────────────────────────────────────────────────── */}
        <Accordion
          disableGutters
          elevation={0}
          sx={{
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 2,
            '&:before': { display: 'none' },
          }}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography fontWeight={700}>Opciones avanzadas</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Stack gap={2}>
              {/* Toda la base por RCS: la imagen sale como tarjeta grande (rich card) a todos, no
                  sólo a los que tienen nombre. Sin nombre, "#name" se quita solo ("Hi 👋"). */}
              <Box>
                <FormControlLabel
                  sx={{ mr: 0 }}
                  control={
                    <Switch
                      checked={value.audience === 'all'}
                      onChange={(e) => set({ audience: e.target.checked ? 'all' : 'named' })}
                    />
                  }
                  label={
                    <Typography fontWeight={600}>
                      {value.audience === 'all'
                        ? 'Todo RCS: toda la base recibe la tarjeta'
                        : 'Sólo clientes con nombre reciben RCS'}
                    </Typography>
                  }
                />
                <Typography
                  variant="caption"
                  color="text.secondary"
                  display="block"
                >
                  {value.audience === 'all'
                    ? 'Toda la base va por RCS con la imagen grande y link con sesión (sin nombre → portada; nombre + correo → su dashboard). Sin RCS en el teléfono, Infobip manda el SMS/MMS de respaldo. Apagalo para RCS sólo a clientes con nombre.'
                    : 'Sólo los clientes con nombre reciben RCS; el resto, el SMS/MMS normal. Encendelo para mandar el RCS a toda la base.'}
                </Typography>
              </Box>
              <TextField
                size="small"
                fullWidth
                label="Saludo"
                helperText='Vacío = sin saludo. Por defecto "Hi #name!"'
                inputProps={{ maxLength: 120 }}
                {...field('greeting')}
              />
              <TextField
                size="small"
                fullWidth
                label="Título de la tarjeta"
                placeholder="Por defecto: el saludo"
                inputProps={{ maxLength: 200 }}
                {...field('title')}
              />
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                gap={1.5}
              >
                <TextField
                  select
                  size="small"
                  fullWidth
                  label="Los botones abren en"
                  value={value.openIn}
                  onChange={(e) => set({ openIn: e.target.value as MixedRcsCustom['openIn'] })}
                >
                  <MenuItem value="browser">Navegador del teléfono (recomendado)</MenuItem>
                  <MenuItem value="webview">
                    Webview dentro de Mensajes (puede verse a media pantalla)
                  </MenuItem>
                </TextField>
                <TextField
                  select
                  size="small"
                  fullWidth
                  label="Cards de productos"
                  value={value.productCards}
                  onChange={(e) => set({ productCards: Number(e.target.value) })}
                  disabled={!withPhoto.length || !imageSrc}
                  helperText={
                    !imageSrc
                      ? 'Necesita imagen de campaña'
                      : withPhoto.length
                        ? `Carrusel: la campaña + productos con foto (${withPhoto.length} disponibles)`
                        : 'La tienda no tiene productos con foto'
                  }
                >
                  <MenuItem value={0}>Ninguna (una sola tarjeta)</MenuItem>
                  {[2, 3, 4, 5, 7, 9].map((n) => (
                    <MenuItem
                      key={n}
                      value={n}
                    >
                      {n} productos
                    </MenuItem>
                  ))}
                </TextField>
              </Stack>
              {value.productCards > 0 && (
                <Alert
                  severity="info"
                  sx={{ py: 0 }}
                >
                  En carrusel el teléfono recorta los textos largos de cada tarjeta. Mandate una
                  campaña de prueba antes del envío masivo.
                </Alert>
              )}
              <Stack
                direction="row"
                justifyContent="flex-end"
              >
                <Button
                  size="small"
                  color="inherit"
                  onClick={() => onChange(MIXED_RCS_DEFAULTS)}
                >
                  Restaurar por defecto
                </Button>
              </Stack>
            </Stack>
          </AccordionDetails>
        </Accordion>
      </Stack>
    </Box>
  );
}
