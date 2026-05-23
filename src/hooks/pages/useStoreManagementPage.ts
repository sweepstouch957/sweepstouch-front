'use client';

import { useStoreById } from '@/hooks/fetching/stores/useStoreById';
import {
  closeSidebar,
  openSidebar,
  runStoreManagementThunk,
  setTags,
  useStoreManagementStore,
} from '@/slices/store_managment';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

const STORE_MANAGEMENT_TAGS = [
  { id: 'campaigns', label: 'Campaigns' },
  { id: 'general-info', label: 'General Info' },
  { id: 'sweepstakes', label: 'Sweepstakes' },
  { id: 'welcome-coupons', label: 'Welcome Coupons' },
  { id: 'opt-in', label: 'Opt-in MMS' },
  { id: 'ads', label: 'Ads' },
  { id: 'qr', label: 'QR' },
];

export function useStoreManagementPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = useParams();
  const storeId = params?.id as string;
  const tag = (searchParams.get('tag') as string) || 'campaigns';
  const action = searchParams.get('action');

  const { data: store, isLoading, error } = useStoreById(storeId);
  const sidebarOpen = useStoreManagementStore((s) => s.sidebarOpen);

  const [openInactiveModal, setOpenInactiveModal] = useState(false);
  const [quickOpen, setQuickOpen] = useState(false);

  useEffect(() => {
    runStoreManagementThunk(setTags(STORE_MANAGEMENT_TAGS));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    useStoreManagementStore.setState({ activeSection: tag });
  }, [tag]);

  const handleDrawerToggle = useCallback(() => {
    runStoreManagementThunk(sidebarOpen ? closeSidebar() : openSidebar());
  }, [sidebarOpen]);

  const handleBack = useCallback(() => {
    router.push(`/admin/management/stores/edit/${storeId}?tag=campaigns`);
  }, [router, storeId]);

  const handleGoToCreateCampaign = useCallback(() => {
    if (store?.active) {
      window.open(`/admin/management/stores/edit/${storeId}?tag=campaigns&action=create`, '_blank');
    } else {
      setOpenInactiveModal(true);
    }
  }, [store?.active, storeId]);

  const handleMMSNavigate = useCallback(() => {
    router.push(`/admin/management/mms?storeId=${storeId}`);
  }, [router, storeId]);

  const handleQuickOpen = useCallback(() => {
    if (store?.active) setQuickOpen(true);
    else setOpenInactiveModal(true);
  }, [store?.active]);

  return {
    storeId,
    tag,
    action,
    store,
    isLoading,
    error,
    sidebarOpen,
    openInactiveModal,
    setOpenInactiveModal,
    quickOpen,
    setQuickOpen,
    handleDrawerToggle,
    handleBack,
    handleGoToCreateCampaign,
    handleMMSNavigate,
    handleQuickOpen,
  };
}
