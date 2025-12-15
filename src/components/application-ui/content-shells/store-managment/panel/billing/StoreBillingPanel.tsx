// src/components/billing/StoreBillingPanel.tsx
'use client';

import {
  billingQK,
  billingService,
  type CreateInvoicePayload,
  type RegisterPaymentPayload,
  type StoreInvoice,
} from '@/services/billing.service';
import AddIcon from '@mui/icons-material/Add';
import PaymentsIcon from '@mui/icons-material/Payments';
import RefreshIcon from '@mui/icons-material/Refresh';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  IconButton,
  LinearProgress,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { BillingSummaryCards } from './BillingSummaryCards';
import { InvoicesTable } from './InvoicesTable';
import { NewInvoiceDialog } from './NewInvoiceDialog';
import { RegisterPaymentDialog } from './RegisterPaymentDialog';

type Props = {
  storeId: string;
  storeName?: string;
};

type PaymentDialogState = {
  open: boolean;
  invoice?: StoreInvoice;
};

export function StoreBillingPanel({ storeId, storeName }: Props) {
  const qc = useQueryClient();

  const [openNew, setOpenNew] = useState(false);
  const [paymentDialog, setPaymentDialog] = useState<PaymentDialogState>({
    open: false,
  });

  // --------- Queries ---------
  const {
    data: balanceResp,
    isLoading: balanceLoading,
    isFetching: balanceFetching,
  } = useQuery({
    queryKey: billingQK.storeBalance(storeId),
    queryFn: () => billingService.getStoreBalance(storeId).then((r) => r.data),
  });

  const {
    data: invoicesResp,
    isLoading: invoicesLoading,
    isFetching: invoicesFetching,
  } = useQuery({
    queryKey: billingQK.storeInvoices(storeId),
    queryFn: () => billingService.listStoreInvoices(storeId).then((r) => r.data),
  });

  const balance = balanceResp?.balance;
  const invoices = invoicesResp?.invoices ?? [];

  const refreshing = balanceFetching || invoicesFetching;

  // --------- Mutations ---------

  const createInvoice = useMutation({
    mutationFn: ({ payload, file }: { payload: CreateInvoicePayload; file?: File }) =>
      billingService.createStoreInvoice(storeId, payload, file),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: billingQK.storeBalance(storeId) });
      qc.invalidateQueries({ queryKey: billingQK.storeInvoices(storeId) });
      setOpenNew(false);
    },
  });

  const registerPayment = useMutation({
    mutationFn: ({ payload, file }: { payload: RegisterPaymentPayload; file?: File }) =>
      billingService.registerStorePayment(storeId, payload, file),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: billingQK.storeBalance(storeId) });
      qc.invalidateQueries({ queryKey: billingQK.storeInvoices(storeId) });
      setPaymentDialog({ open: false });
    },
  });

  const handleRefresh = () => {
    qc.invalidateQueries({ queryKey: billingQK.storeBalance(storeId) });
    qc.invalidateQueries({ queryKey: billingQK.storeInvoices(storeId) });
  };

  const currency = 'USD'; // ajústalo si lo sacas del backend

  // ========= UI =========

  return (
    <Stack
      spacing={3}
      p={3}
    >
      {/* Card grande: título + botones + resumen */}
      <Card
        sx={{
          borderRadius: 3,
          boxShadow: '0 18px 45px rgba(15, 23, 42, 0.08)',
          overflow: 'hidden',
        }}
      >
        <CardHeader
          sx={{ pb: 1.5, px: 3, pt: 2.5 }}
          title={
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              gap={2}
            >
              <Box>
                <Typography
                  variant="subtitle1"
                  fontWeight={700}
                >
                  Facturación &amp; Morosidad
                </Typography>
                <Typography
                  variant="caption"
                  color="text.secondary"
                >
                  {storeName ? `Store: ${storeName} · ID: ${storeId}` : `Store ID: ${storeId}`}
                </Typography>
              </Box>

              <Stack
                direction="row"
                gap={1.5}
                alignItems="center"
              >
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<AddIcon />}
                  onClick={() => setOpenNew(true)}
                >
                  Nueva factura
                </Button>

                <Button
                  variant="contained"
                  size="small"
                  startIcon={<PaymentsIcon />}
                  onClick={() => setPaymentDialog({ open: true })}
                >
                  Registrar pago
                </Button>

                <Tooltip title="Refrescar">
                  <span>
                    <IconButton
                      onClick={handleRefresh}
                      disabled={refreshing}
                    >
                      <RefreshIcon fontSize="small" />
                    </IconButton>
                  </span>
                </Tooltip>
              </Stack>
            </Stack>
          }
        />

        <CardContent sx={{ pt: 0, pb: 3, px: 3 }}>
          {(balanceLoading || refreshing) && (
            <Box mb={2}>
              <LinearProgress />
            </Box>
          )}

          <BillingSummaryCards
            totalInvoiced={balance?.totalInvoiced ?? 0}
            totalPaid={balance?.totalPaid ?? 0}
            totalPending={balance?.totalPending ?? 0}
            currency={currency}
          />
        </CardContent>
      </Card>

      {/* Card de facturas */}
      <Card
        sx={{
          borderRadius: 3,
          boxShadow: '0 18px 45px rgba(15, 23, 42, 0.06)',
        }}
      >
        <CardHeader
          sx={{ px: 3, py: 2 }}
          title={
            <Typography
              variant="subtitle1"
              fontWeight={600}
            >
              Facturas de la tienda
            </Typography>
          }
        />
        <CardContent sx={{ p: 0 }}>
          {invoicesLoading ? (
            <Box p={3}>
              <LinearProgress />
            </Box>
          ) : invoices.length === 0 ? (
            <Box p={3}>
              <Typography
                variant="body2"
                color="text.secondary"
              >
                Esta tienda aún no tiene facturas registradas.
              </Typography>
            </Box>
          ) : (
            <InvoicesTable
              invoices={invoices}
              onPay={(inv: StoreInvoice) =>
                setPaymentDialog({
                  open: true,
                  invoice: inv,
                })
              }
            />
          )}
        </CardContent>
      </Card>

      {/* Dialog: Nueva factura manual */}
      <NewInvoiceDialog
        open={openNew}
        loading={createInvoice.isPending}
        onClose={() => setOpenNew(false)}
        onSubmit={(payload, file) => createInvoice.mutate({ payload, file })}
      />

      {/* Dialog: Registrar pago / abono (general o por factura) */}
      <RegisterPaymentDialog
        open={paymentDialog.open}
        onClose={() => setPaymentDialog({ open: false })}
        invoice={paymentDialog.invoice}
        currency={currency}
        loading={registerPayment.isPending}
        onSubmit={(payload, file) => registerPayment.mutate({ payload, file })}
      />
    </Stack>
  );
}
