'use client';

import { campaignClient } from '@/services/campaing.service';
import { customerClient } from '@/services/customerService';
import { getAllStores, type Store } from '@/services/store.service';
import { uploadCampaignImage } from '@/services/upload.service';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { kioskUrl as kioskUrlFor } from 'src/utils/sweepstouch-urls';
import type { CustomerHit } from './types';
import { isPdfUrl } from './utils';

export function useSendTestMessage({ defaultStoreName }: { defaultStoreName?: string }) {
  /* ── State ─────────────────────────────────────── */
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerHit | null>(null);
  const [customerSearch, setCustomerSearch] = useState('');
  const [copyText, setCopyText] = useState('');
  const [newImage, setNewImage] = useState<File | null>(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  // When true, ignore the inherited last-campaign image → send as plain SMS.
  const [imageRemoved, setImageRemoved] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [snack, setSnack] = useState<{
    open: boolean;
    msg: string;
    sev: 'success' | 'error' | 'info';
  }>({
    open: false,
    msg: '',
    sev: 'success',
  });
  const [sentPreview, setSentPreview] = useState<{
    message: string;
    phone: string;
    type: 'SMS' | 'MMS';
    image?: string | null;
    timestamp: Date;
  } | null>(null);

  /* ── Stores query ──────────────────────────────── */
  const { data: stores = [], isLoading: storesLoading } = useQuery({
    queryKey: ['stores'],
    queryFn: () => getAllStores(),
    staleTime: 5 * 60_000,
  });

  useEffect(() => {
    if (!defaultStoreName || selectedStore || stores.length === 0) return;

    const normalizedDefault = defaultStoreName.trim().toLowerCase();
    const defaultStore = stores.find(
      (store) => store.active && store.name.trim().toLowerCase() === normalizedDefault
    );

    if (defaultStore) {
      setSelectedStore(defaultStore);
    }
  }, [defaultStoreName, selectedStore, stores]);

  /* ── Customer search query (debounced via queryKey) ── */
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(customerSearch.trim()), 350);
    return () => clearTimeout(t);
  }, [customerSearch]);

  const { data: customerResults = [], isFetching: customersLoading } = useQuery({
    queryKey: ['customer-search', selectedStore?._id, debouncedSearch],
    queryFn: async () => {
      const data = await customerClient.searchCustomersByStore(selectedStore!._id, {
        search: debouncedSearch,
        page: 1,
        limit: 15,
      });
      return data as CustomerHit[];
    },
    enabled: !!selectedStore?._id && debouncedSearch.length >= 2,
    staleTime: 30_000,
  });

  /* ── Last campaign copy ────────────────────────── */
  const { data: lastCampaign, isLoading: lastLoading } = useQuery({
    queryKey: ['lastCampaign', selectedStore?._id],
    queryFn: () =>
      campaignClient.getFilteredCampaigns({
        storeId: selectedStore!._id,
        limit: 1,
        page: 1,
      }),
    enabled: !!selectedStore?._id,
    select: (d: any) => d?.data?.[0] ?? null,
  });

  useEffect(() => {
    if (lastCampaign?.content && !copyText) setCopyText(lastCampaign.content);
  }, [lastCampaign]);

  /* ── Derived ───────────────────────────────────── */
  const lastCampaignImage: string | null = (lastCampaign as any)?.image ?? null;
  const lastImageIsPdf = isPdfUrl(lastCampaignImage);
  // Never use a PDF as the MMS image — it won't deliver
  const safeCampaignImage = lastImageIsPdf ? null : lastCampaignImage;
  // The inherited last-campaign image, unless the user explicitly removed it.
  const effectiveCampaignImage = imageRemoved ? null : safeCampaignImage;
  const previewImage: File | string | null =
    newImage ?? uploadedImageUrl ?? effectiveCampaignImage ?? null;
  const messageType = previewImage ? 'MMS' : 'SMS';
  const charCount = copyText.length;
  const destinationPhone = selectedCustomer?.phoneNumber || '';
  const canSend = !!selectedStore && !!copyText.trim() && !!selectedCustomer;
  const kioskUrl = kioskUrlFor(selectedStore?.slug) || null;

  /* ── Send mutation ─────────────────────────────── */
  const sendMutation = useMutation({
    mutationFn: async () => {
      if (!selectedStore) throw new Error('No store selected');

      // Never send a PDF as the MMS image; respect an explicit removal.
      let imgUrl = uploadedImageUrl ?? effectiveCampaignImage ?? null;
      if (newImage) {
        const up = await uploadCampaignImage(newImage);
        imgUrl = up.url;
        setUploadedImageUrl(up.url);
      }

      const senderPhone = selectedStore.infobipSenderId || '';

      if (!senderPhone) {
        throw new Error(
          `Store "${selectedStore.name}" has no sender configured. ` +
            `Please set the Infobip Sender ID in store settings.`
        );
      }

      return campaignClient.sendTestMessage({
        phone: destinationPhone.replace(/\D/g, ''),
        message: copyText,
        image: imgUrl,
        provider: 'infobip',
        phoneNumber: senderPhone,
        customerId: selectedCustomer?._id,
        storeId: selectedStore._id,
      });
    },
    onSuccess: (data: any) => {
      setSnack({ open: true, msg: '✅ Test message sent successfully!', sev: 'success' });
      setConfirmOpen(false);

      let imgUrl = uploadedImageUrl ?? effectiveCampaignImage ?? null;
      setSentPreview({
        message: data?.finalMessage || copyText,
        phone: destinationPhone,
        type: messageType,
        image: imgUrl,
        timestamp: new Date(),
      });
    },
    onError: (err: any) => {
      setSnack({
        open: true,
        msg: `❌ Failed: ${err?.response?.data?.error || err.message}`,
        sev: 'error',
      });
      setConfirmOpen(false);
    },
  });

  return {
    stores,
    customerResults,
    customersLoading,
    selectedStore,
    setSelectedStore,
    selectedCustomer,
    setSelectedCustomer,
    customerSearch,
    setCustomerSearch,
    copyText,
    setCopyText,
    newImage,
    setNewImage,
    setUploadedImageUrl,
    imageRemoved,
    setImageRemoved,
    confirmOpen,
    setConfirmOpen,
    snack,
    setSnack,
    sentPreview,
    setSentPreview,
    storesLoading,
    debouncedSearch,
    lastCampaign,
    lastLoading,
    lastImageIsPdf,
    safeCampaignImage,
    previewImage,
    messageType,
    charCount,
    canSend,
    kioskUrl,
    sendMutation,
  };
}
