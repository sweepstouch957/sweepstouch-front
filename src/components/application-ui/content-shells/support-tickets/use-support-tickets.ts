'use client';

import { useAuth } from '@/hooks/use-auth';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { getStores } from 'src/services/store.service';
import supportService, { SupportTicket, TicketStatus } from 'src/services/support.service';
import { buildBody, FormState, StoreOption } from './types';

export function useSupportTickets() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const currentUserName = (user as any)?.name ?? (user as any)?.firstName ?? '';

  const [page, setPage] = useState(1);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterArea, setFilterArea] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTicket, setEditTicket] = useState<SupportTicket | null>(null);

  // Store autocomplete debounced search
  const [storeRaw, setStoreRaw] = useState('');
  const [storeSearch, setStoreSearch] = useState('');
  useEffect(() => {
    const t = setTimeout(() => setStoreSearch(storeRaw), 350);
    return () => clearTimeout(t);
  }, [storeRaw]);

  const LIMIT = 15;

  /* ── Queries ── */
  const { data: technicians = [] } = useQuery({
    queryKey: ['support-technicians'],
    queryFn: supportService.getTechnicians,
    staleTime: 5 * 60_000,
  });

  const { data: storesRes, isFetching: loadingStores } = useQuery({
    queryKey: ['stores-support-search', storeSearch],
    queryFn: () => getStores({ limit: 50, status: 'active', search: storeSearch }),
    staleTime: 60_000,
    placeholderData: (prev) => prev,
  });
  const stores: StoreOption[] = (storesRes?.data ?? []).map((s) => ({
    _id: s._id,
    name: s.name,
    address: s.address ?? '',
    type: s.type,
    customerCount: (s as any).customerCount ?? 0,
  }));

  const { data, isLoading } = useQuery({
    queryKey: ['support-tickets', page, filterStatus, filterPriority, filterArea, search],
    queryFn: () =>
      supportService.getTickets({
        page,
        limit: LIMIT,
        status: filterStatus as any,
        priority: filterPriority as any,
        area: filterArea as any,
        search: search || undefined,
      }),
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
    queryClient.invalidateQueries({ queryKey: ['support-metrics'] });
  };

  /* ── Mutations ── */
  const createMutation = useMutation({
    mutationFn: (f: FormState) => supportService.createTicket(buildBody(f)),
    onSuccess: () => {
      invalidate();
      closeDialog();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, f }: { id: string; f: FormState }) =>
      supportService.updateTicket(id, buildBody(f)),
    onSuccess: () => {
      invalidate();
      closeDialog();
    },
  });

  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  const deleteMutation = useMutation({
    mutationFn: (id: string) => supportService.deleteTicket(id),
    onSuccess: invalidate,
  });

  /* ── Dialog helpers ── */
  const openCreate = () => {
    setEditTicket(null);
    setStoreRaw('');
    setDialogOpen(true);
  };

  const openEdit = (ticket: SupportTicket) => {
    setEditTicket(ticket);
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditTicket(null);
    setStoreRaw('');
  };

  const handleSubmit = (values: FormState) => {
    if (editTicket) updateMutation.mutate({ id: editTicket._id, f: values });
    else createMutation.mutate(values);
  };

  /* ── Quick status popover ── */
  const [statusPopover, setStatusPopover] = useState<{
    el: HTMLElement;
    ticketId: string;
    current: TicketStatus;
  } | null>(null);

  const quickStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: TicketStatus }) =>
      supportService.updateTicket(id, { status }),
    onSuccess: () => {
      invalidate();
      setStatusPopover(null);
    },
  });

  const totalPages = data ? Math.ceil(data.total / LIMIT) : 1;
  const isSaving = createMutation.isPending || updateMutation.isPending;

  return {
    currentUserName,
    technicians,
    page,
    setPage,
    filterStatus,
    setFilterStatus,
    filterPriority,
    setFilterPriority,
    filterArea,
    setFilterArea,
    search,
    setSearch,
    dialogOpen,
    editTicket,
    setStoreRaw,
    storeSearch,
    loadingStores,
    stores,
    data,
    isLoading,
    pendingDelete,
    setPendingDelete,
    deleteMutation,
    openCreate,
    openEdit,
    closeDialog,
    handleSubmit,
    statusPopover,
    setStatusPopover,
    quickStatusMutation,
    totalPages,
    isSaving,
  };
}
