'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import axios from 'axios';
import { customerClient, type Customer } from '@/services/customerService';
import { campaignClient } from '@/services/campaing.service';
import { uploadCampaignImage } from '@/services/upload.service';

const API_URL = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/+$/, '');
const TRACKING_URL = (process.env.NEXT_PUBLIC_TRACKING_URL || API_URL).replace(/\/+$/, '');
const LINKTREE_URL = (process.env.NEXT_PUBLIC_LINKTREE_URL || 'https://links.sweepstouch.com').replace(/\/+$/, '');

function getAuthHeaders() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('uifort-authentication') : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// ─── Customer search hook ────────────────────────────────
export function useCustomerSearch(storeId: string, open: boolean) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Customer | null>(null);
  const [search, setSearch] = useState('');
  const loadedForRef = useRef<string | null>(null);

  useEffect(() => {
    if (!open || !storeId || loadedForRef.current === storeId) return;
    loadedForRef.current = storeId;

    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await customerClient.getCustomersByStore(storeId, 1, 200);
        if (!cancelled) setCustomers(res.data || []);
      } catch (err) {
        console.error('Failed to load customers', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [open, storeId]);

  const filtered = useMemo(() => {
    if (!search) return customers;
    const q = search.replace(/\D/g, '');
    return customers.filter((c) =>
      c.phoneNumber.includes(q) || c.firstName?.toLowerCase().includes(search.toLowerCase())
    );
  }, [customers, search]);

  const reset = useCallback(() => {
    setSelected(null);
    setSearch('');
    loadedForRef.current = null;
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
  senderId?: string;
}

export function resolveProvider(opts: {
  storeProvider?: string;
  storeBandwidthPhone?: string;
  storeBandwidthId?: string;
  storeInfobipSenderId?: string;
  storeTwilioPhone?: string;
  storeName: string;
}): ProviderConfig {
  const provider = opts.storeProvider || 'bandwidth';
  let senderPhone = opts.storeBandwidthPhone || '';
  let senderId: string | undefined = opts.storeBandwidthId;

  if (provider === 'infobip') {
    senderPhone = opts.storeInfobipSenderId || '';
    senderId = undefined;
  } else if (provider === 'twilio') {
    senderPhone = opts.storeTwilioPhone || '';
    senderId = undefined;
  }

  if (!senderPhone) {
    throw new Error(`Store "${opts.storeName}" has no sender for "${provider}". Check store settings.`);
  }

  return { provider, senderPhone, senderId };
}

// ─── Shopping list + send hook ───────────────────────────
export interface ListResult {
  qrCode: string;
  link: string;
  shortLink?: string;
  totalItems: number;
}

export function useMmsSend(opts: {
  storeSlug: string;
  storeName: string;
  circularId?: string;
  storeProvider?: string;
  storeBandwidthPhone?: string;
  storeBandwidthId?: string;
  storeInfobipSenderId?: string;
  storeTwilioPhone?: string;
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

  const createShoppingList = useCallback(async (
    customer: Customer,
    products: Array<{ name: string; price: string; unit?: string; category?: string; imageUrl?: string }>,
  ) => {
    setCreatingList(true);
    setError('');

    try {
      const items = products.slice(0, 10).map((p) => ({
        name: p.name, price: p.price, quantity: 1,
        unit: p.unit || 'each', category: p.category || 'other',
        imageUrl: p.imageUrl || '',
      }));

      const res = await axios.post(
        `${TRACKING_URL}/tracking/shopping-list`,
        {
          customerId: customer.phoneNumber,
          storeSlug: opts.storeSlug,
          circularId: opts.circularId || undefined,
          items,
        },
        { headers: getAuthHeaders() }
      );

      const { qrCode, totalItems } = res.data;
      const longLink = `${LINKTREE_URL}?slug=${opts.storeSlug}&sl=${qrCode}`;

      const shortLink = await shorten(longLink);

      setListResult({ qrCode, link: longLink, shortLink, totalItems });

      // Generate SMS text
      setGeneratingText(true);
      const linkForSms = shortLink || longLink;
      setSmsText(
        `🔥 VIP DEAL ALERT! This week only: Pork Chops $1.99, Chicken Legs $0.99, Plantains 3/$2, King Fish $8.99, Eggo Waffles 2/$5 & OJ 2/$6! Hurry, limited time! 🛒\n\n${linkForSms}\n\nReply STOP to unsubscribe.`
      );
      setGeneratingText(false);

      return true; // success
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to create shopping list');
      return false;
    } finally {
      setCreatingList(false);
    }
  }, [opts.storeSlug, opts.circularId, shorten]);

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
        setUploadingImage(false);
      }

      const { provider, senderPhone, senderId } = resolveProvider({
        storeProvider: opts.storeProvider,
        storeBandwidthPhone: opts.storeBandwidthPhone,
        storeBandwidthId: opts.storeBandwidthId,
        storeInfobipSenderId: opts.storeInfobipSenderId,
        storeTwilioPhone: opts.storeTwilioPhone,
        storeName: opts.storeName,
      });

      await campaignClient.sendTestMessage({
        phone: customer.phoneNumber.replace(/\D/g, ''),
        message: smsText,
        image: imgToSend,
        provider,
        phoneNumber: senderPhone,
        id: senderId,
      });
      setSentSuccess(true);
      return true;
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to send message');
      return false;
    } finally {
      setSending(false);
    }
  }, [smsText, opts]);

  const reset = useCallback(() => {
    setListResult(null);
    setSmsText('');
    setError('');
    setSentSuccess(false);
  }, []);

  return {
    creatingList, sending, sentSuccess, generatingText, uploadingImage,
    listResult, smsText, setSmsText, error, setError,
    createShoppingList, sendMessage, reset,
  };
}
