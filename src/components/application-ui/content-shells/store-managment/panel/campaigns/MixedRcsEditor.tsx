'use client';

/**
 * Personalización del RCS del piloto mixto (el que recibe el 10% con nombre, o los ≤50).
 * SÓLO cambia ese RCS: el SMS/MMS del resto y el failover salen con el texto de la campaña.
 * Se guarda en `rcsOptions.contentTemplate` con type "MIXED"; el scheduler
 * (utils/mixed.js → normalizeMixedCustom / buildMixedRcsContent) valida cada campo y, ante
 * cualquier cosa rara, manda el RCS por defecto.
 *
 * Estructura por defecto: imagen de la campaña (siempre) + texto con el link ÚNICO de la
 * lista del cliente y el de ofertas + 2 botones (armar lista / más ofertas) en webview.
 */
import {
  Alert,
  Box,
  Button,
  Chip,
  FormControlLabel,
  MenuItem,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import { useRef } from 'react';

export type MixedRcsCustom = {
  greeting: string;
  title: string;
  body: string;
  buttonText: string;
  buttonUrl: string;
  listButton: boolean;
  listButtonText: string;
  openIn: 'webview' | 'browser';
  productCards: number;
};

/** Las líneas con #ahorro, #listlink o #address se borran solas (con su rótulo) si no hay dato. */
export const MIXED_RCS_BODY = [
  'Save #ahorro and earn points this week!',
  'Select your offers before checking out:',
  '#listlink',
  '',
  'View more deals:',
  '#linktree',
  '',
  'Address:',
  '#address',
  '',
  'Reply STOP to opt out.',
].join('\n');

export const MIXED_RCS_DEFAULTS: MixedRcsCustom = {
  greeting: 'Hi #name!',
  title: '',
  body: MIXED_RCS_BODY,
  buttonText: 'More deals here!',
  buttonUrl: '',
  listButton: true,
  listButtonText: 'Make my list',
  openIn: 'webview',
  productCards: 0,
};

export const mixedCustomFromTemplate = (tpl: any): MixedRcsCustom =>
  tpl && tpl.type === 'MIXED'
    ? {
        greeting: typeof tpl.greeting === 'string' ? tpl.greeting : MIXED_RCS_DEFAULTS.greeting,
        title: tpl.title || '',
        body: tpl.body || '',
        buttonText: tpl.buttonText || MIXED_RCS_DEFAULTS.buttonText,
        buttonUrl: tpl.buttonUrl || '',
        listButton: tpl.listButton !== false,
        listButtonText: tpl.listButtonText || MIXED_RCS_DEFAULTS.listButtonText,
        openIn: tpl.openIn === 'browser' ? 'browser' : 'webview',
        productCards: Math.min(9, Math.max(0, Number(tpl.productCards) || 0)),
      }
    : MIXED_RCS_DEFAULTS;

/** Lo que viaja al backend: sólo lo que difiere del default del scheduler. Nada → undefined. */
export function mixedTemplateFromCustom(c: MixedRcsCustom): Record<string, unknown> | undefined {
  const d = MIXED_RCS_DEFAULTS;
  const out: Record<string, unknown> = {
    // El saludo por defecto NO se manda: así el scheduler sigue omitiéndolo cuando el
    // texto de la campaña ya trae #name (no sale "Hi Maria! Hola Maria…").
    ...(c.greeting.trim() !== d.greeting ? { greeting: c.greeting.trim() } : {}),
    ...(c.title.trim() ? { title: c.title.trim() } : {}),
    // Texto vacío = el mismo texto del SMS/MMS de la campaña.
    ...(c.body.trim() ? { body: c.body.trim() } : {}),
    ...(c.buttonText.trim() && c.buttonText.trim() !== d.buttonText
      ? { buttonText: c.buttonText.trim() }
      : {}),
    ...(c.buttonUrl.trim() ? { buttonUrl: c.buttonUrl.trim() } : {}),
    ...(c.listButton ? {} : { listButton: false }),
    ...(c.listButtonText.trim() && c.listButtonText.trim() !== d.listButtonText
      ? { listButtonText: c.listButtonText.trim() }
      : {}),
    ...(c.openIn === 'browser' ? { openIn: 'browser' } : {}),
    ...(c.productCards > 0 ? { productCards: c.productCards } : {}),
  };
  return Object.keys(out).length ? { type: 'MIXED', ...out } : undefined;
}

const TOKENS = [
  { key: '#name', label: 'Nombre del cliente' },
  { key: '#listlink', label: 'Link único de su lista' },
  { key: '#linktree', label: 'Link de ofertas' },
  { key: '#ahorro', label: 'Ahorro de la semana' },
  { key: '#address', label: 'Dirección de la tienda' },
  { key: '#store', label: 'Nombre de la tienda' },
  { key: '#message', label: 'Texto del SMS/MMS' },
];

type TextKey = 'greeting' | 'title' | 'body';
export type MixedPreviewProduct = { name: string; price?: string; imageUrl?: string };

export default function MixedRcsEditor({
  value,
  onChange,
  smsText,
  imageSrc,
  storeName,
  storeAddress,
  products,
  productsLoaded,
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
}) {
  const refs = useRef<Partial<Record<TextKey, HTMLInputElement | HTMLTextAreaElement | null>>>({});
  const lastField = useRef<TextKey>('body');
  const set = (patch: Partial<MixedRcsCustom>) => onChange({ ...value, ...patch });

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

  const hasProducts = products.length > 0;
  const withPhoto = products.filter((p) => p.imageUrl);
  const listOn = value.listButton && hasProducts;

  // Vista previa con datos de ejemplo — mismas reglas que el scheduler: la línea de un
  // placeholder sin dato se borra junto con su rótulo.
  const sample = (tpl: string) => {
    const vals: Record<string, string> = {
      '#ahorro': hasProducts ? '$12.50' : '',
      '#listlink': listOn ? 'swtrcs.com/s/XXXXXX' : '',
      '#address': (storeAddress || '').trim(),
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
      .replace(/#ahorro/gi, vals['#ahorro'])
      .replace(/#listlink/gi, vals['#listlink'])
      .replace(/#address/gi, vals['#address'])
      .replace(/#linktree|#link/gi, value.buttonUrl.trim() || 'swtrcs.com/s/YYYYYY')
      .replace(/#message/gi, smsText || 'Texto de la campaña')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  };
  const greeting = sample(value.greeting.trim());
  const body = sample(value.body.trim()) || smsText || 'Texto de la campaña';
  const title = sample(value.title.trim()) || greeting;
  const cards = imageSrc && value.productCards > 0 ? withPhoto.slice(0, value.productCards) : [];

  const btn = (label: string) => (
    <Box sx={{ borderTop: '1px solid', borderColor: 'divider', py: 0.9, textAlign: 'center' }}>
      <Typography
        variant="body2"
        color="primary"
        fontWeight={700}
      >
        {label}
      </Typography>
    </Box>
  );
  const listLabel = value.listButtonText.trim() || MIXED_RCS_DEFAULTS.listButtonText;

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

      <Stack
        direction={{ xs: 'column', md: 'row' }}
        gap={4}
        alignItems="flex-start"
      >
        <Stack
          gap={2}
          sx={{ flex: 1, minWidth: 0 }}
        >
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
              Usar estructura recomendada
            </Button>
            <Button
              size="small"
              variant="outlined"
              onClick={() => set({ body: '' })}
            >
              Usar el texto de la campaña
            </Button>
          </Stack>

          <Typography
            variant="subtitle2"
            fontWeight={700}
            sx={{ mt: 1 }}
          >
            Botones
          </Typography>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            gap={1.5}
            alignItems={{ sm: 'flex-start' }}
          >
            <FormControlLabel
              sx={{ flexShrink: 0, mr: 0 }}
              control={
                <Switch
                  checked={value.listButton}
                  onChange={(e) => set({ listButton: e.target.checked })}
                />
              }
              label="Botón de lista"
            />
            <TextField
              size="small"
              fullWidth
              label="Texto del botón de lista"
              disabled={!value.listButton}
              value={value.listButtonText}
              onChange={(e) => set({ listButtonText: e.target.value })}
              inputProps={{ maxLength: 25 }}
              helperText="Abre la lista única del cliente para elegir ofertas"
            />
          </Stack>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            gap={1.5}
          >
            <TextField
              size="small"
              fullWidth
              label="Texto del botón de ofertas"
              value={value.buttonText}
              onChange={(e) => set({ buttonText: e.target.value })}
              inputProps={{ maxLength: 25 }}
              helperText={`${value.buttonText.length}/25`}
            />
            <TextField
              size="small"
              fullWidth
              label="Link del botón de ofertas"
              placeholder="Por defecto: el link del mensaje"
              value={value.buttonUrl}
              onChange={(e) => set({ buttonUrl: e.target.value })}
              helperText="Vacío = el link de ofertas del texto, o el linktree"
            />
          </Stack>
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
              <MenuItem value="webview">Webview (dentro de Mensajes, pantalla completa)</MenuItem>
              <MenuItem value="browser">Navegador del teléfono</MenuItem>
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
              En carrusel el teléfono recorta los textos largos de cada tarjeta. Mandate una campaña
              de prueba antes del envío masivo.
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

        {/* Vista previa: marco tipo teléfono para que se lea como lo que es, un mensaje. */}
        <Box
          sx={{
            width: { xs: '100%', md: 340 },
            flexShrink: 0,
            position: { md: 'sticky' },
            top: { md: 16 },
            // En el teléfono la vista previa va ARRIBA: primero ves el mensaje y después
            // editás. Abajo quedaría tras una pantalla entera de campos.
            order: { xs: -1, md: 0 },
          }}
        >
          <Typography
            variant="caption"
            color="text.secondary"
            fontWeight={700}
            display="block"
            sx={{ mb: 0.75 }}
          >
            Vista previa (cliente de ejemplo: Maria)
          </Typography>
          <Box sx={{ p: 1.5, borderRadius: 4, bgcolor: 'action.hover' }}>
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
                {listOn && btn(listLabel)}
                {btn(value.buttonText.trim() || MIXED_RCS_DEFAULTS.buttonText)}
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
                  {btn(
                    listOn ? listLabel : value.buttonText.trim() || MIXED_RCS_DEFAULTS.buttonText
                  )}
                </Box>
              ))}
            </Stack>
          </Box>
          <Typography
            variant="caption"
            color="text.secondary"
            display="block"
            sx={{ mt: 1 }}
          >
            Si el teléfono no tiene RCS, le llega el SMS/MMS normal de la campaña.
          </Typography>
        </Box>
      </Stack>
    </Box>
  );
}
