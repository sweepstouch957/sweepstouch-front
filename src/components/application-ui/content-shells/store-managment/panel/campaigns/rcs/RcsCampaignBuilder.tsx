'use client';

/**
 * Editor completo de mensajes RCS (Infobip /rcs/2/messages, sender "sweepstouch").
 *
 * Cubre TODO lo que permite la API v2:
 *  - Tipos de mensaje: TEXT, FILE, CARD (horizontal/vertical), CAROUSEL (2–10 cards)
 *  - Botones (suggestions): abrir link del cliente (webview FULL/HALF/TALL),
 *    URL propia (browser/webview), respuesta rápida (REPLY), llamar (DIAL_PHONE),
 *    mostrar ubicación (SHOW_LOCATION), pedir ubicación (REQUEST_LOCATION) y
 *    evento de calendario (CREATE_CALENDAR_EVENT) — todos los textos editables.
 *  - SMS de respaldo (failover) y validez del mensaje (validityPeriod).
 *
 * El editor arma el `content` v2 con placeholders {{RCSLINK}}/{{SEP}}; el backend
 * sólo reemplaza el link por cliente (short link con tracking, webview full-width).
 * Prueba (números / primeros N) = envío inmediato; "toda la base" = campaña agendada.
 */

import { campaignClient } from '@/services/campaing.service';
import { circularService } from '@/services/circular.service';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded';
import VerifiedRoundedIcon from '@mui/icons-material/VerifiedRounded';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  IconButton,
  MenuItem,
  Radio,
  RadioGroup,
  Snackbar,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';

// ─── Límites RCS (Google RBM) ────────────────────────────────────────────────
const BTN_TEXT_MAX = 25;
const TITLE_MAX = 200;
const DESC_MAX = 2000;
const TEXT_MAX = 2048;

const clip = (s: string, n: number) => (s.length > n ? s.slice(0, n) : s);

// ─── Tipos ───────────────────────────────────────────────────────────────────

type MsgType = 'TEXT' | 'FILE' | 'CARD' | 'CAROUSEL';

type BtnKind =
  | 'offers' // link del cliente (página RCS)
  | 'list' // link del cliente → pantalla Lista
  | 'add' // agrega el producto de la card y abre la página
  | 'url' // URL propia
  | 'reply' // respuesta rápida
  | 'call' // marcar teléfono
  | 'location' // mostrar ubicación en el mapa
  | 'requestLocation' // pedir la ubicación del cliente
  | 'calendar'; // crear evento de calendario

interface Btn {
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

const BTN_KIND_LABEL: Record<BtnKind, string> = {
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

interface CardData {
  uid: string;
  productId?: string;
  title: string;
  description: string;
  mediaUrl: string;
  mediaHeight: 'SHORT' | 'MEDIUM' | 'TALL';
  buttons: Btn[];
}

interface CatalogProduct {
  _id: string;
  name: string;
  price?: string;
  originalPrice?: string;
  savings?: string;
  brand?: string;
  size?: string;
  imageUrl?: string;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

const uidGen = () => Math.random().toString(36).slice(2, 9);

const productDescription = (p: CatalogProduct) =>
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

const cardFromProduct = (p: CatalogProduct): CardData => ({
  uid: uidGen(),
  productId: p._id,
  title: clip(`${p.name}${p.price ? ` — ${p.price}` : ''}`, TITLE_MAX),
  description: clip(productDescription(p), DESC_MAX),
  mediaUrl: p.imageUrl || '',
  mediaHeight: 'MEDIUM',
  buttons: [{ text: '🛒 Agregar a mi lista', kind: 'add', viewMode: 'FULL' }],
});

const blankCard = (): CardData => ({
  uid: uidGen(),
  title: '',
  description: '',
  mediaUrl: '',
  mediaHeight: 'MEDIUM',
  buttons: [{ text: 'Ver ofertas', kind: 'offers', viewMode: 'FULL' }],
});

/** Btn del editor → suggestion RCS v2 (con placeholders de link por cliente). */
function toSuggestion(b: Btn, i: number, productId?: string): any {
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

/** ¿El botón está completo? (para validar antes de enviar) */
function btnValid(b: Btn): boolean {
  if (!b.text.trim()) return false;
  if (b.kind === 'url') return !!b.url?.trim();
  if (b.kind === 'call') return !!b.phoneNumber?.trim();
  if (b.kind === 'location') return b.lat !== undefined && b.lng !== undefined && b.lat !== '' && b.lng !== '';
  return true;
}

// ─── Editor de UN botón (todos los campos editables) ────────────────────────

function ButtonEditor({
  btn,
  onChange,
  onRemove,
  allowAdd,
}: {
  btn: Btn;
  onChange: (patch: Partial<Btn>) => void;
  onRemove: () => void;
  allowAdd: boolean; // "agregar producto" sólo tiene sentido dentro de una card con producto
}) {
  const kinds = (Object.keys(BTN_KIND_LABEL) as BtnKind[]).filter(
    (k) => allowAdd || k !== 'add'
  );

  return (
    <Card
      variant="outlined"
      sx={{ p: 1.5 }}
    >
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={1}
        alignItems={{ sm: 'center' }}
      >
        <TextField
          size="small"
          label={`Texto (${btn.text.length}/${BTN_TEXT_MAX})`}
          value={btn.text}
          onChange={(e) => onChange({ text: clip(e.target.value, BTN_TEXT_MAX) })}
          sx={{ flex: 1, minWidth: 160 }}
        />
        <TextField
          size="small"
          select
          label="Acción"
          value={btn.kind}
          onChange={(e) => onChange({ kind: e.target.value as BtnKind })}
          sx={{ minWidth: 210 }}
        >
          {kinds.map((k) => (
            <MenuItem
              key={k}
              value={k}
            >
              {BTN_KIND_LABEL[k]}
            </MenuItem>
          ))}
        </TextField>
        <IconButton
          size="small"
          color="error"
          onClick={onRemove}
          aria-label="Quitar botón"
          sx={{ alignSelf: { xs: 'flex-end', sm: 'center' } }}
        >
          <DeleteOutlineRoundedIcon fontSize="small" />
        </IconButton>
      </Stack>

      {/* Campos según la acción — todo editable */}
      {(btn.kind === 'offers' || btn.kind === 'list' || btn.kind === 'add') && (
        <TextField
          size="small"
          select
          label="Webview"
          value={btn.viewMode || 'FULL'}
          onChange={(e) => onChange({ viewMode: e.target.value as Btn['viewMode'] })}
          sx={{ mt: 1, minWidth: 180 }}
          helperText="FULL = todo el ancho del teléfono"
        >
          <MenuItem value="FULL">Pantalla completa</MenuItem>
          <MenuItem value="TALL">Alta (3/4)</MenuItem>
          <MenuItem value="HALF">Media pantalla</MenuItem>
        </TextField>
      )}

      {btn.kind === 'url' && (
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1}
          mt={1}
        >
          <TextField
            size="small"
            label="URL"
            value={btn.url || ''}
            onChange={(e) => onChange({ url: e.target.value })}
            sx={{ flex: 1, minWidth: 200 }}
          />
          <TextField
            size="small"
            select
            label="Abrir en"
            value={btn.application || 'BROWSER'}
            onChange={(e) => onChange({ application: e.target.value as Btn['application'] })}
            sx={{ minWidth: 140 }}
          >
            <MenuItem value="BROWSER">Navegador</MenuItem>
            <MenuItem value="WEBVIEW">Webview</MenuItem>
          </TextField>
          {btn.application === 'WEBVIEW' && (
            <TextField
              size="small"
              select
              label="Webview"
              value={btn.viewMode || 'FULL'}
              onChange={(e) => onChange({ viewMode: e.target.value as Btn['viewMode'] })}
              sx={{ minWidth: 150 }}
            >
              <MenuItem value="FULL">Completa</MenuItem>
              <MenuItem value="TALL">Alta</MenuItem>
              <MenuItem value="HALF">Media</MenuItem>
            </TextField>
          )}
        </Stack>
      )}

      {btn.kind === 'reply' && (
        <TextField
          size="small"
          label="Postback (lo que llega al webhook al tocarlo)"
          value={btn.postback ?? btn.text}
          onChange={(e) => onChange({ postback: e.target.value })}
          sx={{ mt: 1 }}
          fullWidth
        />
      )}

      {btn.kind === 'call' && (
        <TextField
          size="small"
          label="Teléfono (+1…)"
          value={btn.phoneNumber || ''}
          onChange={(e) => onChange({ phoneNumber: e.target.value })}
          sx={{ mt: 1, minWidth: 200 }}
        />
      )}

      {btn.kind === 'location' && (
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1}
          mt={1}
        >
          <TextField
            size="small"
            label="Latitud"
            value={btn.lat || ''}
            onChange={(e) => onChange({ lat: e.target.value })}
            sx={{ minWidth: 130 }}
          />
          <TextField
            size="small"
            label="Longitud"
            value={btn.lng || ''}
            onChange={(e) => onChange({ lng: e.target.value })}
            sx={{ minWidth: 130 }}
          />
          <TextField
            size="small"
            label="Etiqueta del pin"
            value={btn.label || ''}
            onChange={(e) => onChange({ label: e.target.value })}
            sx={{ flex: 1, minWidth: 160 }}
          />
        </Stack>
      )}

      {btn.kind === 'calendar' && (
        <Stack
          spacing={1}
          mt={1}
        >
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={1}
          >
            <TextField
              size="small"
              label="Título del evento"
              value={btn.calTitle || ''}
              onChange={(e) => onChange({ calTitle: e.target.value })}
              sx={{ flex: 1 }}
            />
            <TextField
              size="small"
              label="Descripción"
              value={btn.calDesc || ''}
              onChange={(e) => onChange({ calDesc: e.target.value })}
              sx={{ flex: 1.4 }}
            />
          </Stack>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={1}
          >
            <TextField
              size="small"
              type="datetime-local"
              label="Comienza"
              InputLabelProps={{ shrink: true }}
              value={btn.calStart || ''}
              onChange={(e) => onChange({ calStart: e.target.value })}
              sx={{ minWidth: 220 }}
            />
            <TextField
              size="small"
              type="datetime-local"
              label="Termina"
              InputLabelProps={{ shrink: true }}
              value={btn.calEnd || ''}
              onChange={(e) => onChange({ calEnd: e.target.value })}
              sx={{ minWidth: 220 }}
            />
          </Stack>
        </Stack>
      )}
    </Card>
  );
}

// ─── Lista de botones (agrega/edita/quita, con tope) ────────────────────────

function ButtonListEditor({
  buttons,
  onChange,
  max,
  allowAdd,
  emptyHint,
}: {
  buttons: Btn[];
  onChange: (next: Btn[]) => void;
  max: number;
  allowAdd: boolean;
  emptyHint?: string;
}) {
  return (
    <Stack spacing={1}>
      {buttons.length === 0 && emptyHint && (
        <Typography
          variant="caption"
          color="text.secondary"
        >
          {emptyHint}
        </Typography>
      )}
      {buttons.map((b, i) => (
        <ButtonEditor
          key={i}
          btn={b}
          allowAdd={allowAdd}
          onChange={(patch) => onChange(buttons.map((x, idx) => (idx === i ? { ...x, ...patch } : x)))}
          onRemove={() => onChange(buttons.filter((_, idx) => idx !== i))}
        />
      ))}
      <Button
        size="small"
        variant="outlined"
        disabled={buttons.length >= max}
        onClick={() => onChange([...buttons, { text: '', kind: 'url', application: 'BROWSER' }])}
        sx={{ alignSelf: 'flex-start' }}
      >
        Agregar botón ({buttons.length}/{max})
      </Button>
    </Stack>
  );
}

// ─── Preview: chips de botones ──────────────────────────────────────────────

function PreviewButtons({ buttons }: { buttons: Btn[] }) {
  const visible = buttons.filter((b) => b.text.trim());
  if (!visible.length) return null;
  return (
    <Box
      display="flex"
      gap={0.8}
      mt={1}
      overflow="auto"
      pb={0.5}
    >
      {visible.map((b, i) => (
        <Chip
          key={i}
          label={b.text}
          size="small"
          sx={{
            flexShrink: 0,
            bgcolor: '#fff',
            color: '#1a73e8',
            fontWeight: 700,
            border: '1px solid #dadce0',
          }}
        />
      ))}
    </Box>
  );
}

// ═════════════════════════════════════════════════════════════════════════════

export default function RcsCampaignBuilder({
  storeId,
  storeSlug,
  storeName,
  phoneNumber,
  totalAudience,
  onCreate,
}: {
  storeId: string;
  storeSlug: string;
  storeName: string;
  phoneNumber: string;
  totalAudience: number;
  onCreate: () => void;
}) {
  // ── Estado general ──
  const [title, setTitle] = useState('');
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [failover, setFailover] = useState(
    `Hola! Mira las ofertas de la semana de ${storeName} 👉 #linkrcs Reply STOP to unsubscribe`
  );
  const [validityAmount, setValidityAmount] = useState<number>(0); // 0 = sin límite
  const [validityUnit, setValidityUnit] = useState<'MINUTES' | 'HOURS'>('HOURS');

  // ── Contenido del mensaje ──
  const [msgType, setMsgType] = useState<MsgType>('CAROUSEL');
  const [text, setText] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [thumbUrl, setThumbUrl] = useState('');
  const [cardWidth, setCardWidth] = useState<'SMALL' | 'MEDIUM'>('MEDIUM');
  const [orientation, setOrientation] = useState<'VERTICAL' | 'HORIZONTAL'>('VERTICAL');
  const [alignment, setAlignment] = useState<'LEFT' | 'RIGHT'>('LEFT');
  const [cards, setCards] = useState<CardData[]>([]);
  const [globalButtons, setGlobalButtons] = useState<Btn[]>([
    { text: '🛍️ Ver todas las ofertas', kind: 'offers', viewMode: 'FULL' },
    { text: '📝 Mi lista', kind: 'list', viewMode: 'FULL' },
  ]);
  const [search, setSearch] = useState('');

  // ── Audiencia ──
  const [audMode, setAudMode] = useState<'all' | 'limit' | 'numbers'>('numbers');
  const [audLimit, setAudLimit] = useState<number>(10);
  const [audNumbers, setAudNumbers] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [snack, setSnack] = useState<{ open: boolean; msg: string; sev: 'success' | 'error' }>({
    open: false,
    msg: '',
    sev: 'success',
  });

  const { data: catalog, isLoading: loadingCatalog } = useQuery({
    queryKey: ['store-catalog', storeSlug],
    queryFn: () => circularService.getStoreCatalog(storeSlug),
    enabled: !!storeSlug,
    staleTime: 60_000,
  });

  const products: CatalogProduct[] = catalog?.items || [];
  const filtered = useMemo(
    () =>
      search
        ? products.filter((p) => p.name?.toLowerCase().includes(search.toLowerCase()))
        : products,
    [products, search]
  );

  // Card única (tipo CARD) — se edita como la primera del array.
  const singleCard = cards[0];

  const toggleProduct = (p: CatalogProduct) => {
    setCards((prev) => {
      const existing = prev.findIndex((c) => c.productId === p._id);
      if (existing >= 0) return prev.filter((_, i) => i !== existing);
      const cap = msgType === 'CARD' ? 1 : 10;
      if (prev.length >= cap) {
        setSnack({ open: true, msg: `Máximo ${cap} card${cap > 1 ? 's' : ''}`, sev: 'error' });
        return prev;
      }
      return [...prev, cardFromProduct(p)];
    });
  };

  const patchCard = (uid: string, patch: Partial<CardData>) =>
    setCards((prev) => prev.map((c) => (c.uid === uid ? { ...c, ...patch } : c)));

  const moveCard = (uid: string, dir: -1 | 1) =>
    setCards((prev) => {
      const i = prev.findIndex((c) => c.uid === uid);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });

  // ── Armado del content v2 ──
  const globalMax = msgType === 'TEXT' ? 11 : 4;

  const buildContentTemplate = (): any => {
    const globals = globalButtons.filter(btnValid).slice(0, globalMax).map((b, i) => toSuggestion(b, i));

    const buildCard = (c: CardData) => ({
      title: clip(c.title || 'Oferta', TITLE_MAX),
      description: clip(c.description || '', DESC_MAX) || undefined,
      ...(c.mediaUrl
        ? { media: { file: { url: c.mediaUrl }, height: c.mediaHeight || 'MEDIUM' } }
        : {}),
      suggestions: c.buttons.filter(btnValid).slice(0, 4).map((b, i) => toSuggestion(b, i, c.productId)),
    });

    if (msgType === 'TEXT') {
      return { type: 'TEXT', text: clip(text, TEXT_MAX), ...(globals.length ? { suggestions: globals } : {}) };
    }
    if (msgType === 'FILE') {
      return {
        type: 'FILE',
        file: { url: fileUrl },
        ...(thumbUrl ? { thumbnail: { url: thumbUrl } } : {}),
        ...(globals.length ? { suggestions: globals } : {}),
      };
    }
    if (msgType === 'CARD') {
      return {
        type: 'CARD',
        orientation,
        ...(orientation === 'HORIZONTAL' ? { alignment } : {}),
        content: buildCard(singleCard),
        ...(globals.length ? { suggestions: globals } : {}),
      };
    }
    return {
      type: 'CAROUSEL',
      cardWidth,
      contents: cards.slice(0, 10).map(buildCard),
      ...(globals.length ? { suggestions: globals } : {}),
    };
  };

  // ── Validación ──
  const parsedNumbers = useMemo(
    () =>
      audNumbers
        .split(/[\s,;]+/)
        .map((n) => n.replace(/\D/g, ''))
        .filter((n) => n.length >= 10),
    [audNumbers]
  );

  const contentReady =
    msgType === 'TEXT'
      ? !!text.trim()
      : msgType === 'FILE'
        ? !!fileUrl.trim()
        : msgType === 'CARD'
          ? !!singleCard && (!!singleCard.title.trim() || !!singleCard.mediaUrl)
          : cards.length >= 2;

  const isTest = audMode !== 'all';
  const audienceCount =
    audMode === 'numbers'
      ? parsedNumbers.length
      : audMode === 'limit'
        ? Math.min(Math.max(audLimit || 0, 1), totalAudience || audLimit || 1)
        : totalAudience;

  const canSubmit =
    contentReady &&
    !!failover.trim() &&
    (isTest ? audMode !== 'numbers' || parsedNumbers.length > 0 : !!title.trim());

  // ── Envío ──
  const mutation = useMutation({
    mutationFn: async () => {
      const contentTemplate = buildContentTemplate();
      const validityPeriod =
        validityAmount > 0 ? { amount: validityAmount, timeUnit: validityUnit } : undefined;

      if (isTest) {
        return campaignClient.sendRcsNow({
          storeId,
          storeSlug,
          ...(audMode === 'numbers' ? { phones: parsedNumbers } : { limit: audLimit }),
          contentTemplate,
          validityPeriod,
          failoverText: failover,
        });
      }
      return campaignClient.createCampaign(
        {
          title,
          description: `Campaña RCS (${msgType})`,
          content: failover,
          startDate,
          channel: 'rcs',
          customAudience: totalAudience,
          platform: 'infobip',
          sourceTn: phoneNumber,
          rcsOptions: { contentTemplate, validityPeriod },
        } as any,
        storeId
      );
    },
    onSuccess: (r: any) => {
      setConfirmOpen(false);
      if (isTest) {
        const skipped = r?.notInBase?.length ? ` (${r.notInBase.length} no están en la base)` : '';
        setSnack({
          open: true,
          msg: `Enviado ahora a ${r?.delivered ?? 0}/${r?.recipients ?? 0} 📲${skipped}`,
          sev: r?.success ? 'success' : 'error',
        });
      } else {
        setSnack({ open: true, msg: '¡Campaña RCS creada! 🎉', sev: 'success' });
        setTimeout(onCreate, 700);
      }
    },
    onError: (e: any) => {
      setConfirmOpen(false);
      setSnack({
        open: true,
        msg: e?.response?.data?.error || (isTest ? 'Error enviando la prueba RCS' : 'Error creando la campaña RCS'),
        sev: 'error',
      });
    },
  });

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <Box>
      {/* ── Header ── */}
      <Card
        variant="outlined"
        sx={{ p: 2.5, mb: 2.5 }}
      >
        <Stack
          direction="row"
          alignItems="center"
          spacing={2}
          flexWrap="wrap"
        >
          <Box
            flex={1}
            minWidth={220}
          >
            <Typography
              variant="h6"
              fontWeight={800}
            >
              Editor RCS
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
            >
              Sender «sweepstouch» (agente Google verificado) · {storeName}
            </Typography>
          </Box>
          <Chip
            variant="outlined"
            color="primary"
            label={`Base: ${totalAudience.toLocaleString()} clientes`}
            sx={{ fontWeight: 600 }}
          />
        </Stack>
      </Card>

      <Box
        display="grid"
        gridTemplateColumns={{ xs: '1fr', md: '1fr 340px' }}
        gap={2.5}
        alignItems="start"
      >
        {/* ══ Config ══ */}
        <Stack spacing={2.5}>
          {/* 1 · Datos */}
          <Card
            variant="outlined"
            sx={{ p: 2.5 }}
          >
            <Typography
              variant="subtitle1"
              fontWeight={700}
              mb={2}
            >
              1 · Datos
            </Typography>
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={2}
            >
              <TextField
                label={isTest ? 'Título (sólo para campaña)' : 'Título de la campaña'}
                fullWidth
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={isTest}
              />
              <DateTimePicker
                label="Fecha de envío"
                value={startDate}
                onChange={(d) => d && setStartDate(d)}
                sx={{ minWidth: 220 }}
                disabled={isTest}
              />
            </Stack>
          </Card>

          {/* 2 · Tipo de mensaje */}
          <Card
            variant="outlined"
            sx={{ p: 2.5 }}
          >
            <Typography
              variant="subtitle1"
              fontWeight={700}
              mb={1.5}
            >
              2 · Tipo de mensaje
            </Typography>
            <ToggleButtonGroup
              exclusive
              size="small"
              value={msgType}
              onChange={(_, v) => {
                if (!v) return;
                setMsgType(v);
                if (v === 'CARD' && cards.length > 1) setCards((prev) => prev.slice(0, 1));
              }}
              sx={{ flexWrap: 'wrap' }}
            >
              <ToggleButton value="CAROUSEL">Carrusel</ToggleButton>
              <ToggleButton value="CARD">Card única</ToggleButton>
              <ToggleButton value="TEXT">Texto</ToggleButton>
              <ToggleButton value="FILE">Archivo</ToggleButton>
            </ToggleButtonGroup>

            {/* Opciones del tipo */}
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={2}
              mt={2}
            >
              {msgType === 'CAROUSEL' && (
                <TextField
                  size="small"
                  select
                  label="Ancho de cards"
                  value={cardWidth}
                  onChange={(e) => setCardWidth(e.target.value as any)}
                  sx={{ minWidth: 180 }}
                >
                  <MenuItem value="MEDIUM">Mediano</MenuItem>
                  <MenuItem value="SMALL">Chico</MenuItem>
                </TextField>
              )}
              {msgType === 'CARD' && (
                <>
                  <TextField
                    size="small"
                    select
                    label="Orientación"
                    value={orientation}
                    onChange={(e) => setOrientation(e.target.value as any)}
                    sx={{ minWidth: 160 }}
                  >
                    <MenuItem value="VERTICAL">Vertical</MenuItem>
                    <MenuItem value="HORIZONTAL">Horizontal</MenuItem>
                  </TextField>
                  {orientation === 'HORIZONTAL' && (
                    <TextField
                      size="small"
                      select
                      label="Imagen a la"
                      value={alignment}
                      onChange={(e) => setAlignment(e.target.value as any)}
                      sx={{ minWidth: 150 }}
                    >
                      <MenuItem value="LEFT">Izquierda</MenuItem>
                      <MenuItem value="RIGHT">Derecha</MenuItem>
                    </TextField>
                  )}
                </>
              )}
            </Stack>

            {msgType === 'TEXT' && (
              <TextField
                fullWidth
                multiline
                rows={4}
                label={`Texto del mensaje (${text.length}/${TEXT_MAX})`}
                value={text}
                onChange={(e) => setText(clip(e.target.value, TEXT_MAX))}
                sx={{ mt: 2 }}
              />
            )}

            {msgType === 'FILE' && (
              <Stack
                spacing={1.5}
                mt={2}
              >
                <TextField
                  size="small"
                  label="URL del archivo (imagen, video, PDF…)"
                  value={fileUrl}
                  onChange={(e) => setFileUrl(e.target.value)}
                  fullWidth
                />
                <TextField
                  size="small"
                  label="URL de miniatura (opcional)"
                  value={thumbUrl}
                  onChange={(e) => setThumbUrl(e.target.value)}
                  fullWidth
                />
              </Stack>
            )}
          </Card>

          {/* 3 · Productos / Cards */}
          {(msgType === 'CAROUSEL' || msgType === 'CARD') && (
            <Card
              variant="outlined"
              sx={{ p: 2.5 }}
            >
              <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                flexWrap="wrap"
                gap={1}
                mb={1.5}
              >
                <Typography
                  variant="subtitle1"
                  fontWeight={700}
                >
                  3 · {msgType === 'CARD' ? 'La card' : 'Cards del carrusel'}
                </Typography>
                <Stack
                  direction="row"
                  spacing={1}
                >
                  <Chip
                    size="small"
                    color={contentReady ? 'success' : 'default'}
                    label={
                      msgType === 'CARD'
                        ? `${cards.length}/1`
                        : `${cards.length}/10 · mínimo 2`
                    }
                  />
                  <Button
                    size="small"
                    variant="outlined"
                    disabled={cards.length >= (msgType === 'CARD' ? 1 : 10)}
                    onClick={() => setCards((prev) => [...prev, blankCard()])}
                  >
                    Card en blanco
                  </Button>
                </Stack>
              </Stack>

              {/* Picker de productos del catálogo */}
              <TextField
                size="small"
                fullWidth
                placeholder="Buscar producto del catálogo…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                sx={{ mb: 1.5 }}
              />
              {loadingCatalog ? (
                <Box
                  py={3}
                  textAlign="center"
                >
                  <CircularProgress size={26} />
                </Box>
              ) : (
                <Box
                  display="grid"
                  gridTemplateColumns={{ xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)', lg: 'repeat(4, 1fr)' }}
                  gap={1.5}
                  maxHeight={300}
                  overflow="auto"
                  pr={0.5}
                >
                  {filtered.map((p) => {
                    const idx = cards.findIndex((c) => c.productId === p._id);
                    const isSel = idx >= 0;
                    return (
                      <Card
                        key={p._id}
                        variant="outlined"
                        onClick={() => toggleProduct(p)}
                        sx={{
                          cursor: 'pointer',
                          position: 'relative',
                          borderColor: isSel ? 'primary.main' : 'divider',
                          borderWidth: isSel ? 2 : 1,
                          '&:hover': { borderColor: 'primary.main' },
                        }}
                      >
                        {isSel && (
                          <Avatar
                            sx={{
                              position: 'absolute',
                              top: 6,
                              right: 6,
                              width: 22,
                              height: 22,
                              fontSize: 12,
                              fontWeight: 800,
                              bgcolor: 'primary.main',
                              zIndex: 1,
                            }}
                          >
                            {idx + 1}
                          </Avatar>
                        )}
                        <Box
                          sx={{
                            height: 76,
                            bgcolor: 'action.hover',
                            backgroundImage: p.imageUrl ? `url(${p.imageUrl})` : undefined,
                            backgroundSize: 'contain',
                            backgroundPosition: 'center',
                            backgroundRepeat: 'no-repeat',
                          }}
                        />
                        <Box p={1}>
                          <Typography
                            variant="caption"
                            fontWeight={600}
                            display="block"
                            noWrap
                          >
                            {p.name}
                          </Typography>
                          <Typography
                            variant="caption"
                            color={isSel ? 'primary.main' : 'text.secondary'}
                            fontWeight={700}
                          >
                            {p.price || '—'}
                          </Typography>
                        </Box>
                      </Card>
                    );
                  })}
                </Box>
              )}

              {/* Editor de cada card — absolutamente todo editable */}
              {cards.length > 0 && (
                <Stack
                  spacing={1}
                  mt={2}
                >
                  {cards.map((c, i) => (
                    <Accordion
                      key={c.uid}
                      disableGutters
                      variant="outlined"
                      sx={{ '&:before': { display: 'none' } }}
                    >
                      <AccordionSummary expandIcon={<ExpandMoreRoundedIcon />}>
                        <Stack
                          direction="row"
                          alignItems="center"
                          spacing={1.5}
                          minWidth={0}
                          flex={1}
                        >
                          <Avatar
                            variant="rounded"
                            src={c.mediaUrl || undefined}
                            sx={{ width: 34, height: 34, bgcolor: 'action.hover', color: 'text.secondary', fontSize: 14 }}
                          >
                            {(c.title || '?').charAt(0).toUpperCase()}
                          </Avatar>
                          <Typography
                            variant="body2"
                            fontWeight={600}
                            noWrap
                          >
                            {i + 1} · {c.title || 'Card sin título'}
                          </Typography>
                        </Stack>
                      </AccordionSummary>
                      <AccordionDetails>
                        <Stack spacing={1.5}>
                          <TextField
                            size="small"
                            label={`Título (${c.title.length}/${TITLE_MAX})`}
                            value={c.title}
                            onChange={(e) => patchCard(c.uid, { title: clip(e.target.value, TITLE_MAX) })}
                            fullWidth
                          />
                          <TextField
                            size="small"
                            label="Descripción"
                            value={c.description}
                            onChange={(e) => patchCard(c.uid, { description: clip(e.target.value, DESC_MAX) })}
                            fullWidth
                            multiline
                            rows={2}
                          />
                          <Stack
                            direction={{ xs: 'column', sm: 'row' }}
                            spacing={1}
                          >
                            <TextField
                              size="small"
                              label="URL de la imagen/video"
                              value={c.mediaUrl}
                              onChange={(e) => patchCard(c.uid, { mediaUrl: e.target.value })}
                              sx={{ flex: 1, minWidth: 200 }}
                            />
                            <TextField
                              size="small"
                              select
                              label="Alto de la imagen"
                              value={c.mediaHeight}
                              onChange={(e) => patchCard(c.uid, { mediaHeight: e.target.value as any })}
                              sx={{ minWidth: 150 }}
                            >
                              <MenuItem value="SHORT">Bajo</MenuItem>
                              <MenuItem value="MEDIUM">Medio</MenuItem>
                              <MenuItem value="TALL">Alto</MenuItem>
                            </TextField>
                          </Stack>

                          <Typography
                            variant="caption"
                            fontWeight={700}
                            color="text.secondary"
                          >
                            Botones de esta card (máx. 4)
                          </Typography>
                          <ButtonListEditor
                            buttons={c.buttons}
                            onChange={(next) => patchCard(c.uid, { buttons: next.slice(0, 4) })}
                            max={4}
                            allowAdd={!!c.productId}
                            emptyHint="Sin botones — la card es sólo informativa."
                          />

                          <Stack
                            direction="row"
                            spacing={1}
                            justifyContent="flex-end"
                          >
                            {msgType === 'CAROUSEL' && (
                              <>
                                <Button
                                  size="small"
                                  disabled={i === 0}
                                  onClick={() => moveCard(c.uid, -1)}
                                >
                                  ← Mover
                                </Button>
                                <Button
                                  size="small"
                                  disabled={i === cards.length - 1}
                                  onClick={() => moveCard(c.uid, 1)}
                                >
                                  Mover →
                                </Button>
                              </>
                            )}
                            <Button
                              size="small"
                              color="error"
                              onClick={() => setCards((prev) => prev.filter((x) => x.uid !== c.uid))}
                            >
                              Quitar card
                            </Button>
                          </Stack>
                        </Stack>
                      </AccordionDetails>
                    </Accordion>
                  ))}
                </Stack>
              )}
            </Card>
          )}

          {/* 4 · Botones del mensaje */}
          <Card
            variant="outlined"
            sx={{ p: 2.5 }}
          >
            <Typography
              variant="subtitle1"
              fontWeight={700}
              mb={0.5}
            >
              4 · Botones del mensaje
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              display="block"
              mb={1.5}
            >
              Van debajo del {msgType === 'CAROUSEL' ? 'carrusel' : 'mensaje'} (máx. {globalMax}).
              Los links del cliente usan su short link (clicks trackeados) y abren en webview.
            </Typography>
            <ButtonListEditor
              buttons={globalButtons}
              onChange={(next) => setGlobalButtons(next.slice(0, globalMax))}
              max={globalMax}
              allowAdd={false}
            />
          </Card>

          {/* 5 · Respaldo y validez */}
          <Card
            variant="outlined"
            sx={{ p: 2.5 }}
          >
            <Typography
              variant="subtitle1"
              fontWeight={700}
              mb={0.5}
            >
              5 · SMS de respaldo y validez
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              display="block"
              mb={1.5}
            >
              El SMS sale a los teléfonos sin RCS (#linkrcs = link del cliente). La validez
              descarta el mensaje si no se entregó en ese tiempo (0 = sin límite).
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={3}
              value={failover}
              onChange={(e) => setFailover(e.target.value.slice(0, 2047))}
              sx={{ '& .MuiInputBase-root': { fontFamily: 'monospace' }, mb: 1.5 }}
            />
            <Stack
              direction="row"
              spacing={1}
            >
              <TextField
                size="small"
                type="number"
                label="Validez"
                value={validityAmount}
                onChange={(e) => setValidityAmount(Math.max(0, Number(e.target.value) || 0))}
                inputProps={{ min: 0 }}
                sx={{ maxWidth: 130 }}
              />
              <TextField
                size="small"
                select
                label="Unidad"
                value={validityUnit}
                onChange={(e) => setValidityUnit(e.target.value as any)}
                sx={{ minWidth: 130 }}
                disabled={validityAmount <= 0}
              >
                <MenuItem value="MINUTES">Minutos</MenuItem>
                <MenuItem value="HOURS">Horas</MenuItem>
              </TextField>
            </Stack>
          </Card>

          {/* 6 · Audiencia */}
          <Card
            variant="outlined"
            sx={{ p: 2.5 }}
          >
            <Typography
              variant="subtitle1"
              fontWeight={700}
              mb={0.5}
            >
              6 · Audiencia
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              display="block"
              mb={1.5}
            >
              Las pruebas se envían AL MOMENTO con esta configuración; sólo «toda la base»
              crea una campaña programada.
            </Typography>
            <RadioGroup
              value={audMode}
              onChange={(e) => setAudMode(e.target.value as any)}
            >
              <FormControlLabel
                value="numbers"
                control={<Radio size="small" />}
                label="Números específicos — se envía ahora (prueba individual)"
              />
              {audMode === 'numbers' && (
                <Box ml={4}>
                  <TextField
                    size="small"
                    fullWidth
                    multiline
                    rows={2}
                    placeholder="2018894875, 3475551234…"
                    value={audNumbers}
                    onChange={(e) => setAudNumbers(e.target.value)}
                    helperText={`${parsedNumbers.length} número${parsedNumbers.length === 1 ? '' : 's'} válido${parsedNumbers.length === 1 ? '' : 's'} — deben existir en la base de la tienda.`}
                  />
                </Box>
              )}
              <FormControlLabel
                value="limit"
                control={<Radio size="small" />}
                label="Primeros N de la base — se envía ahora (prueba)"
              />
              {audMode === 'limit' && (
                <TextField
                  size="small"
                  type="number"
                  label="Cantidad de clientes"
                  value={audLimit}
                  onChange={(e) => setAudLimit(Math.max(1, Number(e.target.value) || 1))}
                  inputProps={{ min: 1, max: totalAudience || undefined }}
                  sx={{ maxWidth: 220, ml: 4, mb: 1 }}
                />
              )}
              <FormControlLabel
                value="all"
                control={<Radio size="small" />}
                label={`Toda la base — campaña programada (${totalAudience.toLocaleString()} clientes)`}
              />
            </RadioGroup>
          </Card>

          {/* Submit */}
          <Box
            display="flex"
            justifyContent="flex-end"
          >
            <Tooltip
              title={
                canSubmit
                  ? ''
                  : isTest
                    ? 'Falta contenido del mensaje, SMS de respaldo o números válidos'
                    : 'Falta título, contenido del mensaje o SMS de respaldo'
              }
            >
              <span>
                <Button
                  variant="contained"
                  color="primary"
                  size="large"
                  disabled={!canSubmit || mutation.isPending}
                  onClick={() => setConfirmOpen(true)}
                  sx={{ px: 3 }}
                >
                  {isTest ? 'Enviar prueba ahora' : 'Crear campaña RCS'}
                </Button>
              </span>
            </Tooltip>
          </Box>
        </Stack>

        {/* ══ Preview teléfono ══ */}
        <Box
          position={{ md: 'sticky' }}
          top={16}
        >
          <Card
            variant="outlined"
            sx={{
              borderRadius: 5,
              border: '10px solid #111',
              overflow: 'hidden',
              bgcolor: '#fff',
              boxShadow: 'none',
            }}
          >
            <Box
              px={2}
              py={1.2}
              display="flex"
              alignItems="center"
              gap={1.2}
              borderBottom="1px solid #eee"
            >
              <Avatar sx={{ width: 30, height: 30, bgcolor: 'primary.main', fontSize: 14, fontWeight: 800 }}>
                S
              </Avatar>
              <Box lineHeight={1.1}>
                <Stack
                  direction="row"
                  alignItems="center"
                  spacing={0.5}
                >
                  <Typography
                    variant="body2"
                    fontWeight={700}
                    color="#111"
                  >
                    Sweepstouch
                  </Typography>
                  <VerifiedRoundedIcon sx={{ fontSize: 14, color: '#1a73e8' }} />
                </Stack>
                <Typography
                  variant="caption"
                  color="#888"
                >
                  Mensaje RCS · {storeName}
                </Typography>
              </Box>
            </Box>

            <Box
              p={1.5}
              sx={{ bgcolor: '#f6f7f9', minHeight: 200 }}
            >
              {/* TEXT */}
              {msgType === 'TEXT' && (
                <Box
                  bgcolor="#fff"
                  borderRadius={2.5}
                  border="1px solid #e4e4e7"
                  p={1.5}
                  maxWidth="90%"
                >
                  <Typography
                    variant="body2"
                    color="#111"
                    whiteSpace="pre-wrap"
                  >
                    {text || 'Escribí el texto del mensaje…'}
                  </Typography>
                </Box>
              )}

              {/* FILE */}
              {msgType === 'FILE' && (
                <Box
                  bgcolor="#fff"
                  borderRadius={2.5}
                  border="1px solid #e4e4e7"
                  overflow="hidden"
                  maxWidth="90%"
                >
                  <Box
                    height={140}
                    sx={{
                      bgcolor: '#f1f1f1',
                      backgroundImage: (thumbUrl || fileUrl) ? `url(${thumbUrl || fileUrl})` : undefined,
                      backgroundSize: 'contain',
                      backgroundPosition: 'center',
                      backgroundRepeat: 'no-repeat',
                    }}
                  />
                  <Typography
                    variant="caption"
                    color="#777"
                    display="block"
                    p={1}
                    noWrap
                  >
                    {fileUrl || 'URL del archivo…'}
                  </Typography>
                </Box>
              )}

              {/* CARD única */}
              {msgType === 'CARD' && singleCard && (
                <Box
                  bgcolor="#fff"
                  borderRadius={2.5}
                  border="1px solid #e4e4e7"
                  overflow="hidden"
                  display={orientation === 'HORIZONTAL' ? 'flex' : 'block'}
                  flexDirection={alignment === 'RIGHT' ? 'row-reverse' : 'row'}
                >
                  <Box
                    sx={{
                      height: orientation === 'HORIZONTAL' ? 'auto' : 130,
                      width: orientation === 'HORIZONTAL' ? 110 : '100%',
                      flexShrink: 0,
                      bgcolor: '#f1f1f1',
                      backgroundImage: singleCard.mediaUrl ? `url(${singleCard.mediaUrl})` : undefined,
                      backgroundSize: 'contain',
                      backgroundPosition: 'center',
                      backgroundRepeat: 'no-repeat',
                    }}
                  />
                  <Box p={1.2}>
                    <Typography
                      variant="caption"
                      fontWeight={700}
                      color="#111"
                      display="block"
                    >
                      {singleCard.title || 'Título de la card'}
                    </Typography>
                    <Typography
                      variant="caption"
                      color="#777"
                    >
                      {singleCard.description}
                    </Typography>
                    <PreviewButtons buttons={singleCard.buttons} />
                  </Box>
                </Box>
              )}
              {msgType === 'CARD' && !singleCard && (
                <Typography
                  variant="caption"
                  color="text.secondary"
                >
                  Elegí un producto o agregá una card en blanco 👆
                </Typography>
              )}

              {/* CAROUSEL */}
              {msgType === 'CAROUSEL' &&
                (cards.length === 0 ? (
                  <Box
                    py={5}
                    textAlign="center"
                  >
                    <Typography
                      variant="caption"
                      color="text.secondary"
                    >
                      Elegí productos para ver el carrusel 👀
                    </Typography>
                  </Box>
                ) : (
                  <Box
                    display="flex"
                    gap={1.2}
                    overflow="auto"
                    pb={1}
                  >
                    {cards.map((c) => (
                      <Box
                        key={c.uid}
                        flexShrink={0}
                        width={cardWidth === 'SMALL' ? 132 : 168}
                        bgcolor="#fff"
                        borderRadius={2.5}
                        overflow="hidden"
                        border="1px solid #e4e4e7"
                      >
                        <Box
                          height={c.mediaHeight === 'TALL' ? 140 : c.mediaHeight === 'SHORT' ? 80 : 110}
                          sx={{
                            bgcolor: '#f1f1f1',
                            backgroundImage: c.mediaUrl ? `url(${c.mediaUrl})` : undefined,
                            backgroundSize: 'contain',
                            backgroundPosition: 'center',
                            backgroundRepeat: 'no-repeat',
                          }}
                        />
                        <Box p={1.2}>
                          <Typography
                            variant="caption"
                            fontWeight={700}
                            color="#111"
                            display="-webkit-box"
                            sx={{ WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
                          >
                            {c.title || 'Sin título'}
                          </Typography>
                          <Typography
                            variant="caption"
                            color="#777"
                            display="-webkit-box"
                            sx={{ WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', fontSize: 10.5 }}
                          >
                            {c.description}
                          </Typography>
                        </Box>
                        {c.buttons.filter((b) => b.text.trim()).length > 0 && (
                          <>
                            <Divider />
                            <Box
                              py={0.8}
                              px={1}
                              textAlign="center"
                            >
                              {c.buttons
                                .filter((b) => b.text.trim())
                                .map((b, i) => (
                                  <Typography
                                    key={i}
                                    variant="caption"
                                    fontWeight={700}
                                    color="#1a73e8"
                                    display="block"
                                    py={0.2}
                                  >
                                    {b.text}
                                  </Typography>
                                ))}
                            </Box>
                          </>
                        )}
                      </Box>
                    ))}
                  </Box>
                ))}

              {/* Botones globales */}
              <PreviewButtons buttons={globalButtons} />
            </Box>
          </Card>

          <Alert
            icon={false}
            severity="info"
            variant="outlined"
            sx={{ mt: 1.5 }}
          >
            Los botones de link abren la página RCS del cliente con su short link
            (clicks trackeados por campaña) en webview.
          </Alert>
        </Box>
      </Box>

      {/* Confirmación */}
      <Dialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
      >
        <DialogTitle>{isTest ? 'Enviar prueba RCS ahora' : 'Confirmar campaña RCS'}</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            {isTest ? 'Prueba' : `«${title}»`} — mensaje <b>{msgType}</b>
            {msgType === 'CAROUSEL' ? ` de ${cards.length} cards` : ''} para{' '}
            <b>
              {audMode === 'numbers'
                ? `${parsedNumbers.length} número${parsedNumbers.length === 1 ? '' : 's'} de prueba`
                : `${audienceCount.toLocaleString()} clientes`}
            </b>{' '}
            de {storeName}.
            <br />
            {isTest
              ? 'Se envía AHORA MISMO por el canal RCS.'
              : `Programada para: ${startDate.toLocaleString()}.`}{' '}
            Sender: sweepstouch.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            color="secondary"
            onClick={() => setConfirmOpen(false)}
          >
            Cancelar
          </Button>
          <Button
            variant="contained"
            disabled={mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            {mutation.isPending ? (isTest ? 'Enviando…' : 'Creando…') : 'Confirmar'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snack.open}
        autoHideDuration={5000}
        onClose={() => setSnack((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          severity={snack.sev}
          variant="filled"
          onClose={() => setSnack((s) => ({ ...s, open: false }))}
        >
          {snack.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
}
