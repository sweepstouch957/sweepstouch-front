/**
 * Dominio del editor RCS — tipos, límites del spec (Google RBM) y la lógica PURA
 * que arma el `content` v2 de Infobip con placeholders {{RCSLINK}}/{{SEP}}
 * (el backend los reemplaza por el short link de cada cliente).
 *
 * Sin React ni MUI acá: todo es testeable y sin efectos.
 */

// ─── Límites RCS (Google RBM) ────────────────────────────────────────────────
export const BTN_TEXT_MAX = 25;
export const TITLE_MAX = 200;
export const DESC_MAX = 2000;
export const TEXT_MAX = 2048;

export const clip = (s: string, n: number) => (s.length > n ? s.slice(0, n) : s);

// ─── Tipos ───────────────────────────────────────────────────────────────────

export type MsgType = 'TEXT' | 'FILE' | 'CARD' | 'CAROUSEL';

export const MSG_TYPE_INFO: Record<MsgType, { label: string; hint: string }> = {
  CAROUSEL: { label: 'Carrusel', hint: 'Varias tarjetas deslizables — ideal para las ofertas de la semana.' },
  CARD: { label: 'Card única', hint: 'Una sola tarjeta grande con imagen, texto y botones.' },
  TEXT: { label: 'Texto', hint: 'Sólo texto con botones — como un SMS pero interactivo.' },
  FILE: { label: 'Archivo', hint: 'Una imagen, video o PDF con botones debajo.' },
};

export type BtnKind =
  | 'offers'
  | 'list'
  | 'add'
  | 'url'
  | 'reply'
  | 'call'
  | 'location'
  | 'requestLocation'
  | 'calendar';

export interface Btn {
  text: string;
  kind: BtnKind;
  url?: string;
  application?: 'BROWSER' | 'WEBVIEW';
  viewMode?: 'FULL' | 'HALF' | 'TALL';
  phoneNumber?: string;
  lat?: string;
  lng?: string;
  label?: string;
  postback?: string;
  calTitle?: string;
  calDesc?: string;
  calStart?: string; // datetime-local
  calEnd?: string;
}

export const BTN_KIND_LABEL: Record<BtnKind, string> = {
  offers: 'Abrir página del cliente',
  list: 'Mi lista (pantalla Lista)',
  add: 'Agregar producto a la lista',
  url: 'URL personalizada',
  reply: 'Respuesta rápida (REPLY)',
  call: 'Llamar',
  location: 'Mostrar ubicación',
  requestLocation: 'Pedir ubicación',
  calendar: 'Evento de calendario',
};

export interface CardData {
  uid: string;
  productId?: string;
  title: string;
  description: string;
  mediaUrl: string;
  mediaHeight: 'SHORT' | 'MEDIUM' | 'TALL';
  buttons: Btn[];
}

export interface CatalogProduct {
  _id: string;
  name: string;
  price?: string;
  originalPrice?: string;
  savings?: string;
  brand?: string;
  size?: string;
  imageUrl?: string;
}

// ─── Fábricas de cards ──────────────────────────────────────────────────────

const uidGen = () => Math.random().toString(36).slice(2, 9);

export const productDescription = (p: CatalogProduct) =>
  [
    p.brand,
    p.size,
    /\d/.test(p.savings || '')
      ? `Ahorra ${p.savings}`
      : p.originalPrice
        ? `Antes ${p.originalPrice}`
        : '',
  ]
    .filter(Boolean)
    .join(' · ') || 'Oferta de esta semana';

export const cardFromProduct = (p: CatalogProduct): CardData => ({
  uid: uidGen(),
  productId: p._id,
  title: clip(`${p.name}${p.price ? ` — ${p.price}` : ''}`, TITLE_MAX),
  description: clip(productDescription(p), DESC_MAX),
  mediaUrl: p.imageUrl || '',
  mediaHeight: 'MEDIUM',
  buttons: [{ text: '🛒 Agregar a mi lista', kind: 'add', viewMode: 'FULL' }],
});

export const blankCard = (): CardData => ({
  uid: uidGen(),
  title: '',
  description: '',
  mediaUrl: '',
  mediaHeight: 'MEDIUM',
  buttons: [{ text: 'Ver ofertas', kind: 'offers', viewMode: 'FULL' }],
});

// ─── Botones → suggestions v2 ───────────────────────────────────────────────

/** Btn del editor → suggestion RCS v2 (con placeholders de link por cliente). */
export function toSuggestion(b: Btn, i: number, productId?: string): any {
  const text = clip(b.text || 'Botón', BTN_TEXT_MAX);
  const pb = `btn_${i}_${b.kind}`;
  const webview = { application: 'WEBVIEW', webviewViewMode: b.viewMode || 'FULL' };

  switch (b.kind) {
    case 'offers':
      return { type: 'OPEN_URL', text, postbackData: 'open_offers', url: '{{RCSLINK}}', ...webview };
    case 'list':
      return { type: 'OPEN_URL', text, postbackData: 'open_list', url: '{{RCSLINK}}{{SEP}}screen=2', ...webview };
    case 'add':
      if (!productId) {
        return { type: 'OPEN_URL', text, postbackData: 'open_offers', url: '{{RCSLINK}}', ...webview };
      }
      return {
        type: 'OPEN_URL',
        text,
        postbackData: `add:${productId}`,
        url: `{{RCSLINK}}{{SEP}}add=${productId}`,
        ...webview,
      };
    case 'url':
      return {
        type: 'OPEN_URL',
        text,
        postbackData: pb,
        url: b.url || 'https://www.sweepstouch.com',
        application: b.application || 'BROWSER',
        ...(b.application === 'WEBVIEW' ? { webviewViewMode: b.viewMode || 'FULL' } : {}),
      };
    case 'reply':
      return { type: 'REPLY', text, postbackData: clip(b.postback || text, 2048) };
    case 'call':
      return { type: 'DIAL_PHONE', text, postbackData: pb, phoneNumber: b.phoneNumber || '' };
    case 'location':
      return {
        type: 'SHOW_LOCATION',
        text,
        postbackData: pb,
        latitude: Number(b.lat) || 0,
        longitude: Number(b.lng) || 0,
        label: b.label || text,
      };
    case 'requestLocation':
      return { type: 'REQUEST_LOCATION', text, postbackData: pb };
    case 'calendar':
      return {
        type: 'CREATE_CALENDAR_EVENT',
        text,
        postbackData: pb,
        title: b.calTitle || text,
        description: b.calDesc || '',
        startTime: b.calStart ? new Date(b.calStart).toISOString() : new Date().toISOString(),
        endTime: b.calEnd
          ? new Date(b.calEnd).toISOString()
          : new Date(Date.now() + 3600_000).toISOString(),
      };
  }
}

export function btnValid(b: Btn): boolean {
  if (!b.text.trim()) return false;
  if (b.kind === 'url') return !!b.url?.trim();
  if (b.kind === 'call') return !!b.phoneNumber?.trim();
  if (b.kind === 'location') return !!b.lat && !!b.lng;
  return true;
}

/** Problemas de una lista de botones, en lenguaje claro (causa + qué hacer). */
export function btnProblems(btns: Btn[], scope: string): string[] {
  const out: string[] = [];
  btns.forEach((b, i) => {
    const name = b.text.trim() ? `«${b.text.trim()}»` : `el botón ${i + 1}`;
    if (!b.text.trim()) out.push(`${scope}: escribí el texto de ${name}.`);
    else if (b.kind === 'url' && !b.url?.trim()) out.push(`${scope}: ${name} necesita la URL a abrir.`);
    else if (b.kind === 'call' && !b.phoneNumber?.trim()) out.push(`${scope}: ${name} necesita el teléfono a marcar.`);
    else if (b.kind === 'location' && (!b.lat || !b.lng)) out.push(`${scope}: ${name} necesita latitud y longitud.`);
  });
  return out;
}

// ─── Armado del content v2 ──────────────────────────────────────────────────

export const globalMaxFor = (msgType: MsgType) => (msgType === 'TEXT' ? 11 : 4);

export interface RcsContentState {
  msgType: MsgType;
  text: string;
  fileUrl: string;
  thumbUrl: string;
  cardWidth: 'SMALL' | 'MEDIUM';
  orientation: 'VERTICAL' | 'HORIZONTAL';
  alignment: 'LEFT' | 'RIGHT';
  cards: CardData[];
  globalButtons: Btn[];
}

/** Content RCS v2 completo (TEXT/FILE/CARD/CAROUSEL) listo para el backend. */
export function buildRcsContentTemplate(s: RcsContentState): any {
  const globalMax = globalMaxFor(s.msgType);
  const globals = s.globalButtons.filter(btnValid).slice(0, globalMax).map((b, i) => toSuggestion(b, i));

  const buildCard = (c: CardData) => ({
    title: clip(c.title || 'Oferta', TITLE_MAX),
    description: clip(c.description || '', DESC_MAX) || undefined,
    ...(c.mediaUrl
      ? { media: { file: { url: c.mediaUrl }, height: c.mediaHeight || 'MEDIUM' } }
      : {}),
    suggestions: c.buttons.filter(btnValid).slice(0, 4).map((b, i) => toSuggestion(b, i, c.productId)),
  });

  if (s.msgType === 'TEXT') {
    return { type: 'TEXT', text: clip(s.text, TEXT_MAX), ...(globals.length ? { suggestions: globals } : {}) };
  }
  if (s.msgType === 'FILE') {
    return {
      type: 'FILE',
      file: { url: s.fileUrl },
      ...(s.thumbUrl ? { thumbnail: { url: s.thumbUrl } } : {}),
      ...(globals.length ? { suggestions: globals } : {}),
    };
  }
  if (s.msgType === 'CARD') {
    return {
      type: 'CARD',
      orientation: s.orientation,
      ...(s.orientation === 'HORIZONTAL' ? { alignment: s.alignment } : {}),
      content: buildCard(s.cards[0]),
      ...(globals.length ? { suggestions: globals } : {}),
    };
  }
  return {
    type: 'CAROUSEL',
    cardWidth: s.cardWidth,
    contents: s.cards.slice(0, 10).map(buildCard),
    ...(globals.length ? { suggestions: globals } : {}),
  };
}
