// hooks/useActivationRequestsPage.ts
'use client';

import { activationService } from '@/services/activation.service';
import type { ActivationFilters, ActivationRequest } from '@/services/activation.service';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';

type SnackSeverity = 'error' | 'success' | 'info';

interface SnackbarState {
  open: boolean;
  message: string;
  severity: SnackSeverity;
}

interface ApprovedModalState {
  open: boolean;
  tempPassword: string;
  item: ActivationRequest | null;
}

export const PAGE_SIZE_OPTIONS = [12, 24, 36] as const;
type PageSize = (typeof PAGE_SIZE_OPTIONS)[number];

export function useActivationRequestsPage(initialPageSize: PageSize = 12) {
  const queryClient = useQueryClient();

  // 🔢 Paginación
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState<PageSize>(initialPageSize);
  const [filters, setFilters] = useState<
    Pick<ActivationFilters, 'status' | 'email' | 'prioritizeDanger'>
  >({});

  // UI: snackbar + modal aprobado
  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: '',
    severity: 'error',
  });

  const [approvedModal, setApprovedModal] = useState<ApprovedModalState>({
    open: false,
    tempPassword: '',
    item: null,
  });

  // Snapshot para modal aprobado
  const [lastApprovedId, setLastApprovedId] = useState<string | null>(null);
  const [lastApprovedItem, setLastApprovedItem] = useState<ActivationRequest | null>(null);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['activationRequests', { page, limit: rowsPerPage, ...filters }],
    queryFn: () =>
      activationService.getActivationRequests({
        page,
        limit: rowsPerPage,
        ...filters, // 👈 integra status/email al servicio
      }),
  });

  const requests: ActivationRequest[] = data?.data ?? [];
  const pagination = data?.pagination;
  const totalItems = pagination?.totalItems ?? 0;
  const totalPages = pagination?.totalPages ?? 1;
  const dangerCount = data?.dangerCountTotal ?? 1;

  const { showingFrom, showingTo } = useMemo(() => {
    const from = totalItems === 0 ? 0 : (page - 1) * rowsPerPage + 1;
    const to = totalItems === 0 ? 0 : Math.min(page * rowsPerPage, totalItems);
    return { showingFrom: from, showingTo: to };
  }, [totalItems, page, rowsPerPage]);

  // Helpers
  const closeSnackbar = () => setSnackbar((s) => ({ ...s, open: false }));
  const closeApprovedModal = () => setApprovedModal((s) => ({ ...s, open: false }));

  // 🔁 Mutations
  const approveMutation = useMutation({
    mutationFn: (id: string) => activationService.approveActivationRequest(id),
    onSuccess: (res: any, id) => {
      setSnackbar({ open: true, message: 'Solicitud aprobada con éxito.', severity: 'success' });

      // Password con fallbacks defensivos
      const temp =
        res?.data?.previewTempPassword ??
        res?.data?.tempPassword ??
        res?.previewTempPassword ??
        res?.tempPassword ??
        res?.data?.previewSetPasswordLink ??
        '';

      const targetId = id || lastApprovedId;
      const item = lastApprovedItem || requests.find((r) => r._id === targetId) || null;

      setApprovedModal({ open: true, tempPassword: temp, item });

      queryClient.invalidateQueries({ queryKey: ['activationRequests'] });
    },
    onError: (err: any) => {
      setSnackbar({
        open: true,
        message: err?.response?.data?.error || 'Error al aprobar la solicitud.',
        severity: 'error',
      });
    },
  });

  const copyText = async (text?: string, label = 'Texto') => {
    try {
      if (!text) return;
      await navigator.clipboard.writeText(text);
      setSnackbar({ open: true, message: `${label} copiado al portapapeles.`, severity: 'info' });
    } catch {
      setSnackbar({
        open: true,
        message: `No se pudo copiar el ${label.toLowerCase()}.`,
        severity: 'error',
      });
    }
  };

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      activationService.rejectActivationRequest(id, { rejectionReason: reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activationRequests'] });
      setSnackbar({ open: true, message: 'Solicitud rechazada con éxito.', severity: 'success' });
    },
    onError: (err: any) => {
      setSnackbar({
        open: true,
        message: err?.response?.data?.error || 'Error al rechazar la solicitud.',
        severity: 'error',
      });
    },
  });

  const resendLinkMutation = useMutation({
    mutationFn: (userId: string) => activationService.resendSetPasswordLink(userId),
    onSuccess: () => {
      setSnackbar({
        open: true,
        message: 'Credenciales reenviadas correctamente.',
        severity: 'success',
      });
    },
    onError: (err: any) => {
      setSnackbar({
        open: true,
        message: err?.response?.data?.error || 'No se pudo reenviar.',
        severity: 'error',
      });
    },
  });

  // 🚀 Handlers públicos (para que la UI sea ultra simple)
  const handleApprove = (id: string) => {
    setLastApprovedId(id);
    const item = requests.find((r) => r._id === id) || null;
    setLastApprovedItem(item);
    approveMutation.mutate(id);
  };

  const handleReject = (id: string, reason: string) => rejectMutation.mutate({ id, reason });

  const handleResendLink = (userId: string) => resendLinkMutation.mutate(userId);

  const setPageAndResetIfNeeded = (newRowsPerPage: number) => {
    setRowsPerPage(newRowsPerPage as PageSize);
    setPage(1);
  };

  return {
    // datos
    requests,
    pagination,
    totalItems,
    totalPages,
    showingFrom,
    showingTo,

    // estados de carga
    isLoading,
    isFetching,

    // paginación
    page,
    rowsPerPage,
    setPage,
    setRowsPerPage: setPageAndResetIfNeeded,

    // UI states manejados por el hook
    snackbar,
    closeSnackbar,
    approvedModal,
    closeApprovedModal,
    dangerCount,
    // actions
    filters,
    setFilters,
    handleApprove,
    handleReject,
    handleResendLink,
    copyText,
    // mutation states (por si quieres deshabilitar botones en UI)
    approving: approveMutation.isPending,
    rejecting: rejectMutation.isPending,
    resending: resendLinkMutation.isPending,
  };
}
