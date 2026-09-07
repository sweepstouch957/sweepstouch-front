'use client';

/**
 * Estado completo del editor RCS: wizard, contenido, audiencia, validación por
 * paso y resúmenes. Los componentes de paso reciben este objeto y no manejan
 * estado propio — una sola fuente de verdad.
 */

import { circularService } from '@/services/circular.service';
import { customerClient } from '@/services/customerService';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import {
  blankCard,
  btnProblems,
  Btn,
  buildRcsContentTemplate,
  cardFromProduct,
  CardData,
  CatalogProduct,
  globalMaxFor,
  MSG_TYPE_INFO,
  MsgType,
} from './rcs-domain';

export type AudMode = 'all' | 'limit' | 'numbers';

export function useRcsBuilder({
  storeId,
  storeSlug,
  storeName,
  totalAudience,
}: {
  storeId: string;
  storeSlug: string;
  storeName: string;
  totalAudience: number;
}) {
  // ── Wizard ──
  const [activeStep, setActiveStep] = useState(0);
  const [attempted, setAttempted] = useState<Record<number, boolean>>({});

  // ── Datos de campaña ──
  const [title, setTitle] = useState('');
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [failover, setFailover] = useState(
    `Hola! Mira las ofertas de la semana de ${storeName} 👉 #linkrcs Reply STOP to unsubscribe`
  );
  const [validityAmount, setValidityAmount] = useState<number>(0);
  const [validityUnit, setValidityUnit] = useState<'MINUTES' | 'HOURS'>('HOURS');

  // ── Contenido ──
  const [msgType, setMsgTypeRaw] = useState<MsgType>('CAROUSEL');
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
  const [audMode, setAudMode] = useState<AudMode>('numbers');
  const [audLimit, setAudLimit] = useState<number>(10);
  const [audSelected, setAudSelected] = useState<Array<any>>([]);
  const [audInput, setAudInput] = useState('');
  const [audSearch, setAudSearch] = useState('');
  useEffect(() => {
    const t = setTimeout(() => setAudSearch(audInput.trim()), 300);
    return () => clearTimeout(t);
  }, [audInput]);

  // ── Data ──
  const { data: catalog, isLoading: loadingCatalog } = useQuery({
    queryKey: ['store-catalog', storeSlug],
    queryFn: () => circularService.getStoreCatalog(storeSlug),
    enabled: !!storeSlug,
    staleTime: 60_000,
  });

  const { data: custOptions = [], isFetching: searchingCustomers } = useQuery({
    queryKey: ['rcs-cust-search', storeId, audSearch],
    queryFn: () => customerClient.searchCustomersByStore(storeId, { search: audSearch, limit: 10 }),
    enabled: audMode === 'numbers' && audSearch.length >= 2,
    staleTime: 30_000,
  });

  const products: CatalogProduct[] = catalog?.items || [];
  const filtered = useMemo(
    () =>
      search
        ? products.filter((p) => p.name?.toLowerCase().includes(search.toLowerCase()))
        : products,
    [products, search]
  );

  const singleCard = cards[0];

  // ── Acciones ──
  const setMsgType = (v: MsgType) => {
    setMsgTypeRaw(v);
    if (v === 'CARD' && cards.length > 1) setCards((prev) => prev.slice(0, 1));
  };

  const toggleProduct = (p: CatalogProduct): string | null => {
    let err: string | null = null;
    setCards((prev) => {
      const existing = prev.findIndex((c) => c.productId === p._id);
      if (existing >= 0) return prev.filter((_, i) => i !== existing);
      const cap = msgType === 'CARD' ? 1 : 10;
      if (prev.length >= cap) {
        err = `Máximo ${cap} card${cap > 1 ? 's' : ''}`;
        return prev;
      }
      return [...prev, cardFromProduct(p)];
    });
    return err;
  };

  const addBlankCard = () => setCards((prev) => [...prev, blankCard()]);

  const patchCard = (uid: string, patch: Partial<CardData>) =>
    setCards((prev) => prev.map((c) => (c.uid === uid ? { ...c, ...patch } : c)));

  const removeCard = (uid: string) => setCards((prev) => prev.filter((c) => c.uid !== uid));

  const moveCard = (uid: string, dir: -1 | 1) =>
    setCards((prev) => {
      const i = prev.findIndex((c) => c.uid === uid);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });

  // ── Derivados ──
  const globalMax = globalMaxFor(msgType);

  const parsedNumbers = useMemo(() => {
    const nums = audSelected
      .map((v) => String(typeof v === 'string' ? v : v?.phoneNumber || '').replace(/\D/g, ''))
      .map((n) => n.slice(-10))
      .filter((n) => n.length === 10);
    return [...new Set(nums)];
  }, [audSelected]);

  const isTest = audMode !== 'all';
  const audienceCount =
    audMode === 'numbers'
      ? parsedNumbers.length
      : audMode === 'limit'
        ? Math.min(Math.max(audLimit || 0, 1), totalAudience || audLimit || 1)
        : totalAudience;

  // ── Validación por paso (causa + solución) ──
  const msgProblems = useMemo(() => {
    const out: string[] = [];
    if (msgType === 'TEXT' && !text.trim()) out.push('Escribí el texto del mensaje.');
    if (msgType === 'FILE' && !fileUrl.trim()) out.push('Pegá la URL del archivo a enviar.');
    if (msgType === 'CARD') {
      if (!singleCard) out.push('Elegí un producto del catálogo o agregá una card en blanco.');
      else {
        if (!singleCard.title.trim() && !singleCard.mediaUrl) out.push('La card necesita al menos un título o una imagen.');
        out.push(...btnProblems(singleCard.buttons, 'Card'));
      }
    }
    if (msgType === 'CAROUSEL') {
      if (cards.length < 2) out.push(`El carrusel necesita mínimo 2 cards (tenés ${cards.length}). Elegí productos del catálogo.`);
      cards.forEach((c, i) => out.push(...btnProblems(c.buttons, `Card ${i + 1}`)));
    }
    return out;
  }, [msgType, text, fileUrl, singleCard, cards]);

  const btnStepProblems = useMemo(() => btnProblems(globalButtons, 'Botones'), [globalButtons]);

  const audProblems = useMemo(() => {
    const out: string[] = [];
    if (audMode === 'numbers' && parsedNumbers.length === 0)
      out.push('Buscá y elegí al menos un cliente de la base (o pegá un número y Enter).');
    if (audMode === 'all' && !title.trim()) out.push('La campaña necesita un título para identificarla.');
    return out;
  }, [audMode, parsedNumbers, title]);

  const reviewProblems = useMemo(() => {
    const out: string[] = [];
    if (!failover.trim()) out.push('Escribí el SMS de respaldo — es lo que reciben los teléfonos sin RCS.');
    return out;
  }, [failover]);

  const stepProblems = [msgProblems, btnStepProblems, audProblems, reviewProblems];
  const allProblems = stepProblems.flat();
  const canSubmit = allProblems.length === 0;

  const tryAdvance = (from: number) => {
    setAttempted((a) => ({ ...a, [from]: true }));
    if (stepProblems[from].length === 0) setActiveStep(from + 1);
  };

  const markAllAttempted = () => setAttempted({ 0: true, 1: true, 2: true, 3: true });

  const stepSummaries = [
    `${MSG_TYPE_INFO[msgType].label}${msgType === 'CAROUSEL' ? ` · ${cards.length} cards` : ''}`,
    `${globalButtons.filter((b) => b.text.trim()).length} botón(es)`,
    audMode === 'numbers'
      ? `${parsedNumbers.length} número(s) — prueba inmediata`
      : audMode === 'limit'
        ? `Primeros ${audLimit} — prueba inmediata`
        : `Toda la base (${totalAudience.toLocaleString()}) — programada`,
    validityAmount > 0 ? `Validez ${validityAmount} ${validityUnit === 'HOURS' ? 'h' : 'min'}` : 'Listo para enviar',
  ];

  const contentTemplate = () =>
    buildRcsContentTemplate({ msgType, text, fileUrl, thumbUrl, cardWidth, orientation, alignment, cards, globalButtons });

  return {
    // wizard
    activeStep, setActiveStep, attempted, tryAdvance, markAllAttempted,
    stepProblems, allProblems, canSubmit, stepSummaries,
    // campaña
    title, setTitle, startDate, setStartDate, failover, setFailover,
    validityAmount, setValidityAmount, validityUnit, setValidityUnit,
    // contenido
    msgType, setMsgType, text, setText, fileUrl, setFileUrl, thumbUrl, setThumbUrl,
    cardWidth, setCardWidth, orientation, setOrientation, alignment, setAlignment,
    cards, singleCard, toggleProduct, addBlankCard, patchCard, removeCard, moveCard,
    globalButtons, setGlobalButtons, globalMax,
    search, setSearch, products, filtered, loadingCatalog,
    // audiencia
    audMode, setAudMode, audLimit, setAudLimit,
    audSelected, setAudSelected, audInput, setAudInput,
    custOptions, searchingCustomers, parsedNumbers, isTest, audienceCount,
    totalAudience, storeName,
    // salida
    contentTemplate,
  };
}

export type RcsBuilderApi = ReturnType<typeof useRcsBuilder>;
