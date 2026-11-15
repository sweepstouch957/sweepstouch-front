'use client';

import { useAuth } from '@/hooks/use-auth';
import { useCustomization } from '@/hooks/use-customization';
import SendRoundedIcon from '@mui/icons-material/SendRounded';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import {
  Alert,
  Box,
  Container,
  Divider,
  Paper,
  Snackbar,
  Stack,
  Typography,
  useTheme,
} from '@mui/material';
import { CampaignImageSection } from './CampaignImageSection';
import { ConfirmSendDialog } from './ConfirmSendDialog';
import { CustomerSearchSection } from './CustomerSearchSection';
import { KioskCtaCard } from './KioskCtaCard';
import { LivePreviewCard } from './LivePreviewCard';
import { MessageCopySection } from './MessageCopySection';
import { MessageDetailsCard } from './MessageDetailsCard';
import { SendButton } from './SendButton';
import { SendTestHeader } from './SendTestHeader';
import { SentPreviewCard } from './SentPreviewCard';
import { StoreSelectSection } from './StoreSelectSection';
import { useSendTestMessage } from './use-send-test-message';

/* ══════════════════════════════════════════════════════════════════════ */
/*                              PAGE                                    */
/* ══════════════════════════════════════════════════════════════════════ */
export interface SendTestMessageProps {
  /** Tienda que se preselecciona (por nombre) al cargar, p. ej. desde optin-cashiers. */
  defaultStoreName?: string;
}

/** Envío de mensaje de prueba (SMS/MMS) a un cliente real de una tienda. Sólo admins. */
export default function SendTestMessage({ defaultStoreName }: SendTestMessageProps = {}) {
  const theme = useTheme();
  const customization = useCustomization();
  const { user } = useAuth();

  const {
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
  } = useSendTestMessage({ defaultStoreName });

  /* ── Access control ────────────────────────────── */
  if (user?.role !== 'admin') {
    return (
      <Container
        maxWidth="sm"
        sx={{ py: 8, textAlign: 'center' }}
      >
        <WarningAmberRoundedIcon sx={{ fontSize: 64, color: 'error.main', mb: 2 }} />
        <Typography
          variant="h5"
          fontWeight={700}
          gutterBottom
        >
          Access Denied
        </Typography>
        <Typography color="text.secondary">
          This feature is only available for admin users.
        </Typography>
      </Container>
    );
  }

  /* ── Tokens ────────────────────────────────────── */
  const bg = theme.palette.background.default;
  const surface = theme.palette.background.paper;
  const border = theme.palette.divider;
  const accent = theme.palette.primary.main;

  /* ════════════════════════ RENDER ════════════════════════ */
  return (
    <Container
      maxWidth={customization.stretch ? false : 'xl'}
      sx={{ py: { xs: 2, sm: 3 } }}
    >
      {/* ─── Header ─── */}
      <SendTestHeader selectedCustomer={selectedCustomer} />

      {/* ─── 2-col layout ─── */}
      <Box
        sx={{
          display: 'flex',
          gap: 3,
          flexDirection: { xs: 'column', lg: 'row' },
          alignItems: { lg: 'flex-start' },
        }}
      >
        {/* ════════ LEFT: Compose ════════ */}
        <Paper
          elevation={0}
          sx={{
            flex: { lg: '0 0 55%' },
            borderRadius: 3,
            border: `1px solid ${border}`,
            bgcolor: surface,
            overflow: 'hidden',
          }}
        >
          <Box sx={{ px: 3, py: 2, borderBottom: `1px solid ${border}`, bgcolor: bg }}>
            <Stack
              direction="row"
              alignItems="center"
              spacing={1.5}
            >
              <SendRoundedIcon sx={{ fontSize: 18, color: accent }} />
              <Typography
                variant="subtitle1"
                fontWeight={700}
              >
                Compose Message
              </Typography>
            </Stack>
          </Box>

          <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            {/* ── 1. Store selector ── */}
            <StoreSelectSection
              stores={stores}
              selectedStore={selectedStore}
              setSelectedStore={setSelectedStore}
              setSelectedCustomer={setSelectedCustomer}
              setCustomerSearch={setCustomerSearch}
              setCopyText={setCopyText}
              setNewImage={setNewImage}
              setUploadedImageUrl={setUploadedImageUrl}
              setImageRemoved={setImageRemoved}
              setSentPreview={setSentPreview}
              storesLoading={storesLoading}
            />

            <Divider sx={{ borderStyle: 'dashed' }} />

            {/* ── 2. Customer phone search ── */}
            <CustomerSearchSection
              customerResults={customerResults}
              customersLoading={customersLoading}
              selectedStore={selectedStore}
              selectedCustomer={selectedCustomer}
              setSelectedCustomer={setSelectedCustomer}
              customerSearch={customerSearch}
              setCustomerSearch={setCustomerSearch}
              setSnack={setSnack}
              setSentPreview={setSentPreview}
              debouncedSearch={debouncedSearch}
              kioskUrl={kioskUrl}
            />

            <Divider sx={{ borderStyle: 'dashed' }} />

            {/* ── 3. Copy text ── */}
            <MessageCopySection
              selectedStore={selectedStore}
              copyText={copyText}
              setCopyText={setCopyText}
              lastCampaign={lastCampaign}
              lastLoading={lastLoading}
              charCount={charCount}
            />

            <Divider sx={{ borderStyle: 'dashed' }} />

            {/* ── 4. Image upload ── */}
            <CampaignImageSection
              newImage={newImage}
              setNewImage={setNewImage}
              setUploadedImageUrl={setUploadedImageUrl}
              imageRemoved={imageRemoved}
              setImageRemoved={setImageRemoved}
              setSnack={setSnack}
              lastImageIsPdf={lastImageIsPdf}
              safeCampaignImage={safeCampaignImage}
              previewImage={previewImage}
            />

            <Divider sx={{ borderStyle: 'dashed' }} />

            {/* ── Send button ── */}
            <SendButton
              selectedCustomer={selectedCustomer}
              setConfirmOpen={setConfirmOpen}
              canSend={canSend}
              sendMutation={sendMutation}
            />
          </Box>
        </Paper>

        {/* ════════ RIGHT: Sticky Preview + Summary ════════ */}
        <Box
          sx={{
            flex: { lg: '1 1 45%' },
            position: { lg: 'sticky' },
            top: { lg: 88 },
            alignSelf: { lg: 'flex-start' },
            display: 'flex',
            flexDirection: 'column',
            gap: 2.5,
          }}
        >
          {/* ── Sent Test Message Preview ── */}
          <SentPreviewCard sentPreview={sentPreview} />

          {/* ── Phone Preview ── */}
          <LivePreviewCard
            copyText={copyText}
            previewImage={previewImage}
            messageType={messageType}
            charCount={charCount}
          />

          {/* ── Summary Details ── */}
          <MessageDetailsCard
            selectedStore={selectedStore}
            selectedCustomer={selectedCustomer}
            messageType={messageType}
            charCount={charCount}
          />

          {/* ── Kiosk CTA (when no customers and search active) ── */}
          <KioskCtaCard
            customerResults={customerResults}
            customersLoading={customersLoading}
            selectedStore={selectedStore}
            selectedCustomer={selectedCustomer}
            debouncedSearch={debouncedSearch}
            kioskUrl={kioskUrl}
          />
        </Box>
      </Box>

      {/* ─── Confirm Dialog ─── */}
      <ConfirmSendDialog
        selectedStore={selectedStore}
        selectedCustomer={selectedCustomer}
        copyText={copyText}
        confirmOpen={confirmOpen}
        setConfirmOpen={setConfirmOpen}
        messageType={messageType}
        sendMutation={sendMutation}
      />

      {/* ─── Snackbar ─── */}
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
          sx={{ borderRadius: 2 }}
        >
          {snack.msg}
        </Alert>
      </Snackbar>
    </Container>
  );
}
