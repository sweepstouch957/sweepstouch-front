'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import axios from 'axios';
import { customerClient, type Customer } from '@/services/customerService';
import { campaignClient } from '@/services/campaing.service';
import { uploadCampaignImage } from '@/services/upload.service';
import { getAuthToken } from 'src/utils/auth/custom/storage';
import { LINKTREE_ORIGIN } from 'src/utils/sweepstouch-urls';

const API_URL = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/+$/, '');
const TRACKING_URL = (process.env.NEXT_PUBLIC_TRACKING_URL || API_URL).replace(/\/+$/, '');
const LINKTREE_URL = LINKTREE_ORIGIN;

function getAuthHeaders() {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// ─── Customer search hook ────────────────────────────────
// Búsqueda SERVER-SIDE. Antes cargaba solo los primeros 200 clientes y filtraba
// en memoria: en una tienda con más, un teléfono real daba "No options" aunque
// el cliente existiera y estuviera activo. El endpoint /customers/store/:id ya
// acepta `search` — se usa eso, con debounce.
export function useCustomerSearch(storeId: string, open: boolean) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Customer | null>(null);
  const [search, setSearch] = useState('');
  // Descarta respuestas viejas: la request de "201" no debe pisar la de "2018894875".
  const seqRef = useRef(0);

  useEffect(() => {
    if (!open || !storeId) return;
    const seq = ++seqRef.current;
    // Si lo tipeado es un teléfono (con +, guiones o espacios), van solo los
    // dígitos: el backend lo usa como $regex y un "+" literal lo rompería.
    const digits = search.replace(/\D/g, '');
    const term = digits.length >= 4 ? digits : search.trim();

    const run = async () => {
      setLoading(true);
      try {
        const res = await customerClient.getCustomersByStore(storeId, 1, 200, term || undefined);
        if (seqRef.current === seq) setCustomers(res.data || []);
      } catch (err) {
        console.error('Failed to load customers', err);
      } finally {
        if (seqRef.current === seq) setLoading(false);
      }
    };

    const t = setTimeout(run, term ? 300 : 0);
    return () => clearTimeout(t);
  }, [open, storeId, search]);

  // Respaldo local por si el backend busca solo por nombre: los dígitos
  // tipeados igual casan contra el teléfono de lo ya cargado.
  const filtered = useMemo(() => {
    if (!search.trim()) return customers;
    const q = search.replace(/\D/g, '');
    const lower = search.toLowerCase();
    const local = customers.filter(
      (c) => (q && c.phoneNumber?.includes(q)) || c.firstName?.toLowerCase().includes(lower)
    );
    // Si el server ya filtró bien, `customers` ES el resultado; el filtro local
    // solo recorta cuando devolvió de más.
    return local.length ? local : customers;
  }, [customers, search]);

  const reset = useCallback(() => {
    setSelected(null);
    setSearch('');
  }, []);

  return { customers: filtered, loading, selected, setSelected, search, setSearch, reset };
}

// ─── Short link hook ─────────────────────────────────────
export function useShortLink() {
  const cache = useRef<Map<string, string>>(new Map());

  const shorten = useCallback(async (longUrl: string): Promise<string> => {
    if (cache.current.has(longUrl)) return cache.current.get(longUrl)!;

    try {
      const res = await axios.post(
        `${TRACKING_URL}/tracking/short-link`,
        { url: longUrl },
        { headers: getAuthHeaders() }
      );
      const short = res.data?.shortUrl || longUrl;
      cache.current.set(longUrl, short);
      return short;
    } catch (err) {
      console.warn('[useShortLink] Failed, using long URL:', err);
      return longUrl;
    }
  }, []);

  return { shorten };
}

// ─── Provider resolver ───────────────────────────────────
export interface ProviderConfig {
  provider: string;
  senderPhone: string;
}

export function resolveProvider(opts: {
  storeInfobipSenderId?: string;
  storeName: string;
}): ProviderConfig {
  const senderPhone = opts.storeInfobipSenderId || '';

  if (!senderPhone) {
    throw new Error(`Store "${opts.storeName}" has no Infobip sender ID. Check store settings.`);
  }

  return { provider: 'infobip', senderPhone };
}

// ─── Shopping list + send hook ───────────────────────────
export interface ListResult {
  qrCode: string;
  link: string;
  shortLink?: string;
  totalItems: number;
  /** A quién pertenece esta lista/link (id o teléfono). */
  customerId?: string;
  /** "View more deals": el linktree de la tienda CON la sesión de este cliente. */
  treeLink?: string;
}

/** Días que vive la sesión del link de prueba. Igual que la de las campañas (#linklogin). */
const SESSION_TTL_DAYS = 30;

/** Códigos del backend traducidos: "active_list_exists" en pantalla no le dice nada a nadie. */
const ERROR_TEXTS: Record<string, string> = {
  active_list_exists: 'Ese cliente ya tiene una lista activa; la prueba usa esa misma.',
  'items array is required and must not be empty': 'La circular no tiene ofertas para armar la lista.',
};

function humanError(err: any, fallback: string): string {
  const code = err?.response?.data?.error || err?.message || '';
  return ERROR_TEXTS[code] || code || fallback;
}

type TestProduct = { name: string; price: string; unit?: string; category?: string; imageUrl?: string };

/** "https://swtrcs.com/s/X" → "swtrcs.com/s/X" — así va en el SMS (menos chars). */
const bare = (u?: string | null) => String(u || '').replace(/^https?:\/\//i, '');

const JUNK_NAMES = new Set(['demo', 'customer', 'cliente', 'vip', 'test', 'n/a', 'na', 'unknown']);

/** Primer nombre presentable, o '' si no hay nada usable (no se inventa). */
function prettyFirstName(firstName?: string): string {
  const raw = String(firstName || '').trim().split(/\s+/)[0] || '';
  const usable = raw.length >= 2 && /^[a-záéíóúüñ'-]+$/i.test(raw) && !JUNK_NAMES.has(raw.toLowerCase());
  return usable ? raw[0].toUpperCase() + raw.slice(1).toLowerCase() : '';
}

export function useMmsSend(opts: {
  storeSlug: string;
  storeName: string;
  /** Necesario para el link de sesión: el token se firma con {customerId, storeId}. */
  storeId?: string;
  circularId?: string;
  storeProvider?: string;
  storeInfobipSenderId?: string;
  /** Dirección de la tienda: va al pie del SMS de prueba. */
  storeAddress?: string;
}) {
  const [creatingList, setCreatingList] = useState(false);
  const [sending, setSending] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);
  const [generatingText, setGeneratingText] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [listResult, setListResult] = useState<ListResult | null>(null);
  const [smsText, setSmsText] = useState('');
  const [error, setError] = useState('');
  const { shorten } = useShortLink();

  /**
   * "View more deals" de ESTE cliente: la portada de la tienda con su sesión adentro,
   * igual que el `#linklogin` de las campañas. Así el mensaje de prueba se comporta como
   * el real: quien lo abre entra a su lista, al circular y a sus puntos sin pedirle código.
   * Si el minteo falla (sin permisos, sin storeId), devuelve '' y el texto cae al linktree
   * permanente de la tienda: el test sigue saliendo.
   */
  const buildTreeLinkFor = useCallback(async (customer: Customer): Promise<string> => {
    const customerId = String(customer._id || '');
    if (!customerId || !opts.storeId) return '';
    try {
      const { data } = await axios.post(
        `${API_URL}/customers/capability-token`,
        { customerId, storeId: opts.storeId, ttlDays: SESSION_TTL_DAYS },
        { headers: getAuthHeaders() }
      );
      if (!data?.token) return '';
      const url = `${LINKTREE_URL}/?slug=${encodeURIComponent(opts.storeSlug)}&token=${encodeURIComponent(data.token)}`;
      return bare((await shorten(url)) || url);
    } catch (err) {
      console.error('[useMmsTest] link de sesión no disponible:', err);
      return '';
    }
  }, [opts.storeId, opts.storeSlug, shorten]);

  // Lista + link de UN cliente. Compartido entre el preview y el envío múltiple:
  // cada cliente del lote necesita SU lista y SU link, no el del primero.
  // `flow` decide la página que abre el cliente: "prercs" (lista de ofertas +
  // QR, el default del test) o "rcs" (experiencia completa).
  const buildListFor = useCallback(async (customer: Customer, products: TestProduct[], flow: 'prercs' | 'rcs' = 'prercs') => {
    const items = products.slice(0, 10).map((p) => ({
      name: p.name, price: p.price, quantity: 1,
      unit: p.unit || 'each', category: p.category || 'other',
      imageUrl: p.imageUrl || '',
    }));

    // La lista se guarda con el MISMO id con el que el cliente abre su página (`_id`).
    // Antes iba el teléfono: la lista de la prueba quedaba en otra gaveta y el cliente
    // nunca la veía al abrir el link, mientras el aviso de "ya tenés una activa" miraba
    // sólo las de pruebas anteriores.
    const customerId = String(customer._id || customer.phoneNumber);

    // Sin ofertas no hay lista que crear: el backend rechaza `items` vacío y eso
    // trababa el test. El link al Pre-RCS/RCS no depende de la lista, así que se
    // manda igual y el cliente arma la suya desde la página.
    //
    // 409 `active_list_exists`: el cliente YA tiene una lista viva (regla de una por
    // tienda). Para una prueba eso no es un error — se reusa la suya. Reemplazarla sería
    // borrarle al cliente una lista real que quizá va a mostrar en la caja.
    const res = items.length
      ? await axios
          .post(
            `${TRACKING_URL}/tracking/shopping-list`,
            {
              customerId,
              storeSlug: opts.storeSlug,
              circularId: opts.circularId || undefined,
              items,
            },
            { headers: getAuthHeaders() }
          )
          .catch((err) => {
            const ex = err?.response?.status === 409 ? err.response.data?.existing : null;
            if (!ex) throw err;
            return { data: { qrCode: ex.qrCode || '', totalItems: ex.totalItems || 0 } };
          })
      : { data: { qrCode: '', totalItems: 0 } };

    const rcsLink = flow === 'rcs'
      ? `${LINKTREE_URL}/rcs/${customerId}?store=${opts.storeSlug}${opts.circularId ? '&circular=' + opts.circularId : ''}`
      : `${LINKTREE_URL}/prercs/${customerId}?store=${opts.storeSlug}`;
    const shortRcsLink = await shorten(rcsLink);

    return {
      qrCode: res.data.qrCode as string,
      totalItems: res.data.totalItems as number,
      link: rcsLink,
      shortLink: shortRcsLink,
      customerId,
      treeLink: await buildTreeLinkFor(customer),
    };
  }, [opts.storeSlug, opts.circularId, shorten, buildTreeLinkFor]);

  const createShoppingList = useCallback(async (
    customer: Customer,
    products: TestProduct[],
    flow: 'prercs' | 'rcs' = 'prercs',
  ) => {
    setCreatingList(true);
    setError('');

    try {
      const built = await buildListFor(customer, products, flow);
      setListResult(built);

      // Plantilla oficial del test (formato exacto pedido por producto):
      //   Carolina, save $119.44 and earn points this week!
      //   Select your offers before checking out:
      //   swtrcs.com/s/XXXXX          ← link de la LISTA del cliente
      //   View more deals:
      //   swtrcs.com/s/YYYYY          ← linktree permanente de la tienda
      //   Adress + Reply STOP abajo.
      setGeneratingText(true);

      // Ahorro semanal y linktree de la tienda, en paralelo y best-effort:
      // sin alguno, su bloque simplemente no sale.
      const [savings, storeTree] = await Promise.all([
        axios
          .get(`${API_URL}/circulars/store/${opts.storeSlug}/savings`)
          .then((r) => (Number(r.data?.weeklySavings) > 0 ? `$${Number(r.data.weeklySavings).toFixed(2)}` : ''))
          .catch(() => ''),
        axios
          .get(`${TRACKING_URL}/tracking/short-link/linktree/${opts.storeSlug}`, { headers: getAuthHeaders() })
          .then((r) => bare(r.data?.data?.shortUrl))
          .catch(() => ''),
      ]);

      const name = prettyFirstName(customer.firstName);
      const listLink = bare(built.shortLink || built.link);
      // Con sesión (lo normal); sin ella, el linktree permanente de la tienda.
      const treeShort = built.treeLink || storeTree;
      const address = String(opts.storeAddress || '').trim().replace(/\.+$/, '');

      let text =
        `${name ? `${name}, ` : ''}${savings ? `save ${savings} and ` : ''}earn points this week! \n` +
        `Select your offers before checking out:\n${listLink}` +
        (treeShort ? `\n\nView more deals:\n${treeShort}` : '') +
        (address ? `\n\nAdress:\n${opts.storeName} \n${address}.` : '') +
        `\n\nReply STOP to opt out.`;
      // Sin nombre, la frase arranca con mayúscula: "Save $119.44 and earn..."
      if (!name) text = text.charAt(0).toUpperCase() + text.slice(1);

      setSmsText(text);
      setGeneratingText(false);

      return true; // success
    } catch (err: any) {
      setError(humanError(err, 'No se pudo crear la lista'));
      return false;
    } finally {
      setCreatingList(false);
    }
  }, [buildListFor, opts.storeSlug, opts.storeName, opts.storeAddress]);

  const sendMessage = useCallback(async (
    customer: Customer,
    imageUrl: string | null,
    mmsImageFile: File | null,
  ) => {
    if (!smsText.trim()) return false;
    setSending(true);
    setError('');

    try {
      let imgToSend = imageUrl;
      if (mmsImageFile) {
        setUploadingImage(true);
        const up = await uploadCampaignImage(mmsImageFile);
        imgToSend = up.url;
      }

      const { provider, senderPhone } = resolveProvider({
        storeInfobipSenderId: opts.storeInfobipSenderId,
        storeName: opts.storeName,
      });

      await campaignClient.sendTestMessage({
        phone: customer.phoneNumber.replace(/\D/g, ''),
        message: smsText,
        image: imgToSend,
        provider,
        phoneNumber: senderPhone,
      });
      setSentSuccess(true);
      return true;
    } catch (err: any) {
      setError(humanError(err, 'No se pudo enviar el mensaje'));
      return false;
    } finally {
      setUploadingImage(false);
      setSending(false);
    }
  }, [smsText, opts]);

  /**
   * Envío múltiple: mismo texto base pero cada cliente recibe SU lista y SU
   * link (se crea la lista de cada uno y se sustituyen los links del preview).
   * Devuelve cuántos salieron y a quiénes falló — el modal lo reporta.
   */
  const sendMessageToMany = useCallback(async (
    targets: Customer[],
    products: TestProduct[],
    imageUrl: string | null,
    mmsImageFile: File | null,
    flow: 'prercs' | 'rcs' = 'prercs',
  ): Promise<{ sent: number; failed: string[] }> => {
    if (!smsText.trim() || !targets.length) return { sent: 0, failed: [] };
    setSending(true);
    setError('');

    const failed: string[] = [];
    let sent = 0;
    try {
      let imgToSend = imageUrl;
      if (mmsImageFile) {
        setUploadingImage(true);
        const up = await uploadCampaignImage(mmsImageFile);
        imgToSend = up.url;
      }

      const { provider, senderPhone } = resolveProvider({
        storeInfobipSenderId: opts.storeInfobipSenderId,
        storeName: opts.storeName,
      });

      // El cliente del preview: su nombre y su link son los que hay que
      // sustituir por los de cada destinatario.
      const previewCustomer = targets.find(
        (c) => listResult && String(c._id || c.phoneNumber) === listResult.customerId
      );
      const previewName = prettyFirstName(previewCustomer?.firstName);

      for (const customer of targets) {
        try {
          let text = smsText;
          const cid = String(customer._id || customer.phoneNumber);
          // El preview ya tiene lista y link propios; para el resto se crea la
          // suya y se reemplazan links (versión con y sin https) y nombre.
          if (!listResult || listResult.customerId !== cid) {
            const built = await buildListFor(customer, products, flow);
            const swaps: Array<[string, string]> = [];
            if (listResult?.shortLink) {
              const mine = built.shortLink || built.link;
              swaps.push([listResult.shortLink, mine], [bare(listResult.shortLink), bare(mine)]);
            }
            if (listResult?.link) swaps.push([listResult.link, built.link], [bare(listResult.link), bare(built.link)]);
            // El "View more deals" también es personal: lleva la sesión del cliente.
            if (listResult?.treeLink && built.treeLink) swaps.push([listResult.treeLink, built.treeLink]);
            for (const [from, to] of swaps) {
              if (from && to && from !== to) text = text.split(from).join(to);
            }

            // Nombre al inicio: "Carolina, save…" → "Pedro, save…" (o sin nombre).
            if (previewName && text.startsWith(`${previewName}, `)) {
              const myName = prettyFirstName(customer.firstName);
              text = (myName ? `${myName}, ` : '') + text.slice(previewName.length + 2);
              if (!myName) text = text.charAt(0).toUpperCase() + text.slice(1);
            }
          }

          await campaignClient.sendTestMessage({
            phone: customer.phoneNumber.replace(/\D/g, ''),
            message: text,
            image: imgToSend,
            provider,
            phoneNumber: senderPhone,
          });
          sent++;
        } catch (err) {
          console.error(`[sendMessageToMany] ${customer.phoneNumber}:`, err);
          failed.push(customer.phoneNumber);
        }
      }

      setSentSuccess(sent > 0);
      if (failed.length) setError(`No se pudo enviar a: ${failed.join(', ')}`);
      return { sent, failed };
    } catch (err: any) {
      setError(humanError(err, 'No se pudieron enviar los mensajes'));
      return { sent, failed };
    } finally {
      setUploadingImage(false);
      setSending(false);
    }
  }, [smsText, listResult, buildListFor, opts.storeInfobipSenderId, opts.storeName]);

  const reset = useCallback(() => {
    setListResult(null);
    setSmsText('');
    setError('');
    setSentSuccess(false);
  }, []);

  return {
    creatingList, sending, sentSuccess, generatingText, uploadingImage,
    listResult, smsText, setSmsText, error, setError,
    createShoppingList, sendMessage, sendMessageToMany, reset,
  };
}
