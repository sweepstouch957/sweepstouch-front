'use client';

import React, { useEffect, useState } from 'react';
import PreviewPhone from '@/components/application-ui/dialogs/preview/preview-phone';
import AvatarUploadLogo from '@/components/application-ui/upload/avatar/avatar-upload-logo';
import { campaignClient } from '@/services/campaing.service';
import { uploadCampaignImage } from '@/services/upload.service';
import { getAllStores, type Store } from '@/services/store.service';
import { useAuth } from '@/hooks/use-auth';
import { useCustomization } from '@/hooks/use-customization';
import { api } from '@/libs/axios';
import BugReportRoundedIcon from '@mui/icons-material/BugReportRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import ContentCopyRoundedIcon from '@mui/icons-material/ContentCopyRounded';
import ImageRoundedIcon from '@mui/icons-material/ImageRounded';
import OpenInNewRoundedIcon from '@mui/icons-material/OpenInNewRounded';
import PersonSearchRoundedIcon from '@mui/icons-material/PersonSearchRounded';
import PhoneIphoneRoundedIcon from '@mui/icons-material/PhoneIphoneRounded';
import RocketLaunchRoundedIcon from '@mui/icons-material/RocketLaunchRounded';
import SendRoundedIcon from '@mui/icons-material/SendRounded';
import StorefrontRoundedIcon from '@mui/icons-material/StorefrontRounded';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import {
  Alert,
  alpha,
  Autocomplete,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Fade,
  IconButton,
  Paper,
  Snackbar,
  Stack,
  TextField,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material';
import { useMutation, useQuery } from '@tanstack/react-query';

/* ────────────────────────────── constants ────────────────────────────── */
const TEST_BW_PHONE = process.env.NEXT_PUBLIC_TEST_BW_PHONE || '18332197926';
const TEST_BW_ID = process.env.NEXT_PUBLIC_TEST_BW_ID || 'c3799660-ff17-4e29-a41a-e53f2d8b3859';
const KIOSK_BASE = 'https://kiosko.sweepstouch.com';
const MAX_IMAGE_KB = 500;

/* ────────────────────────────── helpers ────────────────────────────── */
const formatPhone = (p: string) => {
  const d = p.replace(/\D/g, '');
  if (d.length === 11 && d.startsWith('1'))
    return `+1 (${d.slice(1, 4)}) ${d.slice(4, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `+1 (${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
  return `+${d}`;
};

/* ────────────── Customer type (minimal) ────────────── */
interface CustomerHit {
  _id: string;
  firstName: string;
  lastName?: string;
  phoneNumber: string;
  active?: boolean;
}

/* ────────────── SummaryRow ────────────── */
const SummaryRow = ({
  label,
  value,
  isDark,
  even,
}: {
  label: string;
  value: React.ReactNode;
  isDark: boolean;
  even: boolean;
}) => (
  <Box
    sx={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      px: 2,
      py: 0.75,
      bgcolor: even ? (isDark ? alpha('#fff', 0.02) : alpha('#000', 0.016)) : 'transparent',
    }}
  >
    <Typography
      variant="caption"
      color="text.secondary"
      sx={{ textTransform: 'uppercase', letterSpacing: 0.5, fontSize: 10 }}
    >
      {label}
    </Typography>
    <Typography variant="caption" fontWeight={700} sx={{ fontFamily: 'monospace', fontSize: 11 }}>
      {value}
    </Typography>
  </Box>
);

/* ══════════════════════════════════════════════════════════════════════ */
/*                              PAGE                                    */
/* ══════════════════════════════════════════════════════════════════════ */
export default function SendTestMessagePage() {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const customization = useCustomization();
  const { user } = useAuth();

  /* ── State ─────────────────────────────────────── */
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerHit | null>(null);
  const [customerSearch, setCustomerSearch] = useState('');
  const [copyText, setCopyText] = useState('');
  const [newImage, setNewImage] = useState<File | null>(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [snack, setSnack] = useState<{ open: boolean; msg: string; sev: 'success' | 'error' | 'info' }>({
    open: false,
    msg: '',
    sev: 'success',
  });

  /* ── Stores query ──────────────────────────────── */
  const { data: stores = [], isLoading: storesLoading } = useQuery({
    queryKey: ['stores-all-test'],
    queryFn: () => getAllStores(),
    staleTime: 5 * 60_000,
  });

  /* ── Customer search query (debounced via queryKey) ── */
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(customerSearch.trim()), 350);
    return () => clearTimeout(t);
  }, [customerSearch]);

  const {
    data: customerResults = [],
    isFetching: customersLoading,
  } = useQuery({
    queryKey: ['customer-search', selectedStore?.id, debouncedSearch],
    queryFn: async () => {
      const res = await api.get(`/customers/store/${selectedStore!.id}`, {
        params: { search: debouncedSearch, page: 1, limit: 15 },
      });
      return (res.data?.data || []) as CustomerHit[];
    },
    enabled: !!selectedStore?.id && debouncedSearch.length >= 2,
    staleTime: 30_000,
  });

  /* ── Last campaign copy ────────────────────────── */
  const { data: lastCampaign, isLoading: lastLoading } = useQuery({
    queryKey: ['lastCampaign', selectedStore?.id],
    queryFn: () =>
      campaignClient.getFilteredCampaigns({
        storeId: selectedStore!.id,
        limit: 1,
        page: 1,
      }),
    enabled: !!selectedStore?.id,
    select: (d: any) => d?.data?.[0] ?? null,
  });

  useEffect(() => {
    if (lastCampaign?.content && !copyText) setCopyText(lastCampaign.content);
  }, [lastCampaign]);

  /* ── Derived ───────────────────────────────────── */
  const previewImage: File | string | null =
    newImage ?? uploadedImageUrl ?? (lastCampaign as any)?.image ?? null;
  const messageType = previewImage ? 'MMS' : 'SMS';
  const charCount = copyText.length;
  const destinationPhone = selectedCustomer?.phoneNumber || '';
  const canSend = !!selectedStore && !!copyText.trim() && !!selectedCustomer;
  const kioskUrl = selectedStore?.slug ? `${KIOSK_BASE}/?slug=${selectedStore.slug}` : null;

  /* ── Send mutation ─────────────────────────────── */
  const sendMutation = useMutation({
    mutationFn: async () => {
      let imgUrl = uploadedImageUrl ?? (lastCampaign as any)?.image ?? null;
      if (newImage) {
        const up = await uploadCampaignImage(newImage);
        imgUrl = up.url;
        setUploadedImageUrl(up.url);
      }
      return campaignClient.sendTestMessage({
        phone: destinationPhone.replace(/\D/g, ''),
        message: copyText,
        image: imgUrl,
        provider: 'bandwidth',
        phoneNumber: TEST_BW_PHONE,
        id: TEST_BW_ID,
      });
    },
    onSuccess: () => {
      setSnack({ open: true, msg: '✅ Test message sent successfully!', sev: 'success' });
      setConfirmOpen(false);
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

  /* ── Access control ────────────────────────────── */
  if (user?.role !== 'admin') {
    return (
      <Container maxWidth="sm" sx={{ py: 8, textAlign: 'center' }}>
        <WarningAmberRoundedIcon sx={{ fontSize: 64, color: 'error.main', mb: 2 }} />
        <Typography variant="h5" fontWeight={700} gutterBottom>
          Access Denied
        </Typography>
        <Typography color="text.secondary">This feature is only available for admin users.</Typography>
      </Container>
    );
  }

  /* ── Tokens ────────────────────────────────────── */
  const bg = isDark ? '#0d1117' : '#f4f6f9';
  const surface = isDark ? '#161b22' : '#ffffff';
  const border = isDark ? alpha('#fff', 0.07) : alpha('#000', 0.07);
  const accent = theme.palette.primary.main;
  const accentGlow = alpha(accent, isDark ? 0.12 : 0.06);

  /* ════════════════════════ RENDER ════════════════════════ */
  return (
    <Container maxWidth={customization.stretch ? false : 'xl'} sx={{ py: { xs: 2, sm: 3 } }}>
      {/* ─── Header ─── */}
      <Stack direction="row" alignItems="center" spacing={2} mb={3}>
        <Box
          sx={{
            width: 48,
            height: 48,
            borderRadius: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: accentGlow,
            border: `1px solid ${alpha(accent, 0.2)}`,
          }}
        >
          <BugReportRoundedIcon sx={{ fontSize: 24, color: accent }} />
        </Box>
        <Box flex={1}>
          <Typography variant="h5" fontWeight={800} lineHeight={1.2}>
            Send Test Message
          </Typography>
          <Typography variant="body2" color="text.disabled">
            Pick a store, find a customer, compose & preview your campaign test
          </Typography>
        </Box>
        {selectedCustomer && (
          <Chip
            icon={<PhoneIphoneRoundedIcon sx={{ fontSize: 14 }} />}
            label={formatPhone(selectedCustomer.phoneNumber)}
            variant="outlined"
            size="small"
            sx={{
              fontFamily: 'monospace',
              fontWeight: 700,
              fontSize: 12,
              borderColor: alpha(accent, 0.3),
              color: accent,
              display: { xs: 'none', sm: 'flex' },
            }}
          />
        )}
      </Stack>

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
            <Stack direction="row" alignItems="center" spacing={1.5}>
              <SendRoundedIcon sx={{ fontSize: 18, color: accent }} />
              <Typography variant="subtitle1" fontWeight={700}>
                Compose Message
              </Typography>
            </Stack>
          </Box>

          <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            {/* ── 1. Store selector ── */}
            <Box>
              <Typography
                variant="caption"
                fontWeight={700}
                color="text.secondary"
                sx={{ display: 'block', mb: 1, textTransform: 'uppercase', letterSpacing: 0.7, fontSize: 10.5 }}
              >
                1 · Select Store
              </Typography>
              <Autocomplete
                options={stores.filter((s) => s.active)}
                getOptionLabel={(opt) => opt.name}
                loading={storesLoading}
                value={selectedStore}
                onChange={(_, v) => {
                  setSelectedStore(v);
                  setSelectedCustomer(null);
                  setCustomerSearch('');
                  setCopyText('');
                  setNewImage(null);
                  setUploadedImageUrl(null);
                }}
                renderOption={(props, option) => (
                  <Box component="li" {...props} key={option.id}>
                    <Stack direction="row" alignItems="center" spacing={1.5}>
                      <Avatar src={option.image} sx={{ width: 28, height: 28, bgcolor: alpha(accent, 0.12) }}>
                        <StorefrontRoundedIcon sx={{ fontSize: 14 }} />
                      </Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight={600}>
                          {option.name}
                        </Typography>
                        <Typography variant="caption" color="text.disabled">
                          {option.provider} · +{option.bandwidthPhoneNumber || option.twilioPhoneNumber || 'N/A'}
                        </Typography>
                      </Box>
                    </Stack>
                  </Box>
                )}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    placeholder="Search for a store..."
                    size="small"
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                  />
                )}
              />

              {selectedStore && (
                <Fade in>
                  <Box
                    sx={{
                      mt: 1.5,
                      px: 2,
                      py: 1.5,
                      borderRadius: 2,
                      bgcolor: accentGlow,
                      border: `1px solid ${alpha(accent, 0.15)}`,
                    }}
                  >
                    <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap">
                      <CheckCircleRoundedIcon sx={{ fontSize: 14, color: 'success.main' }} />
                      <Typography variant="caption" fontWeight={600}>
                        {selectedStore.name}
                      </Typography>
                      <Chip
                        label={selectedStore.provider}
                        size="small"
                        variant="outlined"
                        sx={{ fontSize: 10, height: 20, textTransform: 'uppercase' }}
                      />
                      <Typography variant="caption" color="text.disabled" sx={{ fontFamily: 'monospace' }}>
                        +{selectedStore.bandwidthPhoneNumber || selectedStore.twilioPhoneNumber}
                      </Typography>
                    </Stack>
                  </Box>
                </Fade>
              )}
            </Box>

            <Divider sx={{ borderStyle: 'dashed' }} />

            {/* ── 2. Customer phone search ── */}
            <Box>
              <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                <PersonSearchRoundedIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                <Typography
                  variant="caption"
                  fontWeight={700}
                  color="text.secondary"
                  sx={{ textTransform: 'uppercase', letterSpacing: 0.7, fontSize: 10.5 }}
                >
                  2 · Find Customer Phone
                </Typography>
              </Stack>

              {!selectedStore ? (
                <Box
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    border: `1px dashed ${border}`,
                    bgcolor: bg,
                    textAlign: 'center',
                  }}
                >
                  <Typography variant="caption" color="text.disabled">
                    Select a store first to search its customer database
                  </Typography>
                </Box>
              ) : (
                <>
                  <Autocomplete
                    freeSolo
                    options={customerResults}
                    getOptionLabel={(opt) =>
                      typeof opt === 'string' ? opt : `${opt.firstName || ''} ${opt.lastName || ''} · ${opt.phoneNumber}`
                    }
                    filterOptions={(x) => x}
                    inputValue={customerSearch}
                    onInputChange={(_, val) => setCustomerSearch(val)}
                    value={selectedCustomer}
                    onChange={(_, val) => {
                      if (val && typeof val !== 'string') {
                        setSelectedCustomer(val);
                      } else {
                        setSelectedCustomer(null);
                      }
                    }}
                    loading={customersLoading}
                    noOptionsText={
                      debouncedSearch.length < 2
                        ? 'Type at least 2 characters…'
                        : 'No customers found'
                    }
                    renderOption={(props, option) => (
                      <Box component="li" {...props} key={option._id}>
                        <Stack direction="row" alignItems="center" spacing={1.5} sx={{ width: '100%' }}>
                          <Avatar
                            sx={{
                              width: 32,
                              height: 32,
                              bgcolor: alpha(accent, 0.12),
                              fontSize: 13,
                              fontWeight: 700,
                            }}
                          >
                            {(option.firstName?.[0] || '?').toUpperCase()}
                          </Avatar>
                          <Box flex={1} minWidth={0}>
                            <Typography variant="body2" fontWeight={600} noWrap>
                              {option.firstName || 'Unknown'} {option.lastName || ''}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.disabled"
                              sx={{ fontFamily: 'monospace' }}
                            >
                              {option.phoneNumber}
                            </Typography>
                          </Box>
                          {option.active !== false && (
                            <Chip
                              label="Active"
                              size="small"
                              color="success"
                              variant="outlined"
                              sx={{ fontSize: 9, height: 18 }}
                            />
                          )}
                        </Stack>
                      </Box>
                    )}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        placeholder="Search by name or phone…"
                        size="small"
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                        InputProps={{
                          ...params.InputProps,
                          endAdornment: (
                            <>
                              {customersLoading ? <CircularProgress size={16} /> : null}
                              {params.InputProps.endAdornment}
                            </>
                          ),
                        }}
                      />
                    )}
                  />

                  {/* Selected customer badge */}
                  {selectedCustomer && (
                    <Fade in>
                      <Box
                        sx={{
                          mt: 1.5,
                          p: 2,
                          borderRadius: 2,
                          bgcolor: alpha(theme.palette.success.main, isDark ? 0.08 : 0.04),
                          border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`,
                        }}
                      >
                        <Stack direction="row" alignItems="center" spacing={1.5}>
                          <CheckCircleRoundedIcon sx={{ fontSize: 18, color: 'success.main' }} />
                          <Box flex={1}>
                            <Typography variant="body2" fontWeight={700} color="success.main">
                              {selectedCustomer.firstName} {selectedCustomer.lastName || ''}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{ fontFamily: 'monospace' }}
                            >
                              {formatPhone(selectedCustomer.phoneNumber)}
                            </Typography>
                          </Box>
                          <Chip
                            label="Selected"
                            size="small"
                            color="success"
                            variant="filled"
                            sx={{ fontSize: 9, height: 20, fontWeight: 800 }}
                          />
                          <IconButton
                            size="small"
                            onClick={() => {
                              setSelectedCustomer(null);
                              setCustomerSearch('');
                            }}
                          >
                            <CloseRoundedIcon sx={{ fontSize: 14 }} />
                          </IconButton>
                        </Stack>
                      </Box>
                    </Fade>
                  )}

                  {/* Kiosk fallback when no results */}
                  {!selectedCustomer &&
                    debouncedSearch.length >= 2 &&
                    !customersLoading &&
                    customerResults.length === 0 && (
                      <Fade in>
                        <Box
                          sx={{
                            mt: 1.5,
                            p: 2,
                            borderRadius: 2,
                            bgcolor: alpha(theme.palette.warning.main, isDark ? 0.06 : 0.03),
                            border: `1px solid ${alpha(theme.palette.warning.main, 0.2)}`,
                          }}
                        >
                          <Stack spacing={1.5}>
                            <Stack direction="row" alignItems="center" spacing={1}>
                              <WarningAmberRoundedIcon sx={{ fontSize: 16, color: 'warning.main' }} />
                              <Typography variant="body2" fontWeight={600} color="warning.main">
                                No customers found for "{debouncedSearch}"
                              </Typography>
                            </Stack>

                            {kioskUrl ? (
                              <>
                                <Typography variant="caption" color="text.secondary">
                                  Register a new customer via the kiosk, then search again.
                                </Typography>
                                <Button
                                  variant="outlined"
                                  size="small"
                                  color="warning"
                                  startIcon={<OpenInNewRoundedIcon sx={{ fontSize: 14 }} />}
                                  onClick={() => window.open(kioskUrl, '_blank')}
                                  sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600, fontSize: 12 }}
                                >
                                  Open Kiosk — {selectedStore.name}
                                </Button>
                                <Box
                                  sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1,
                                    px: 1.5,
                                    py: 0.75,
                                    borderRadius: 1.5,
                                    bgcolor: isDark ? alpha('#fff', 0.03) : alpha('#000', 0.02),
                                    border: `1px solid ${border}`,
                                  }}
                                >
                                  <Typography
                                    variant="caption"
                                    sx={{
                                      flex: 1,
                                      fontFamily: 'monospace',
                                      fontSize: 9.5,
                                      color: 'text.disabled',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      whiteSpace: 'nowrap',
                                    }}
                                  >
                                    {kioskUrl}
                                  </Typography>
                                  <Tooltip title="Copy URL">
                                    <IconButton
                                      size="small"
                                      onClick={() => {
                                        navigator.clipboard.writeText(kioskUrl);
                                        setSnack({ open: true, msg: '📋 Copied!', sev: 'info' });
                                      }}
                                    >
                                      <ContentCopyRoundedIcon sx={{ fontSize: 12 }} />
                                    </IconButton>
                                  </Tooltip>
                                </Box>
                              </>
                            ) : (
                              <Alert severity="info" sx={{ borderRadius: 2, py: 0, fontSize: 11 }}>
                                No slug configured for this store. Set one in store settings.
                              </Alert>
                            )}
                          </Stack>
                        </Box>
                      </Fade>
                    )}
                </>
              )}
            </Box>

            <Divider sx={{ borderStyle: 'dashed' }} />

            {/* ── 3. Copy text ── */}
            <Box>
              <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                <Typography
                  variant="caption"
                  fontWeight={700}
                  color="text.secondary"
                  sx={{ textTransform: 'uppercase', letterSpacing: 0.7, fontSize: 10.5 }}
                >
                  3 · Message Copy
                </Typography>
                <Chip
                  label={`${charCount} chars`}
                  size="small"
                  variant="outlined"
                  color={charCount > 160 ? 'warning' : 'default'}
                  sx={{ fontSize: 10, height: 20 }}
                />
              </Stack>

              {lastLoading && selectedStore ? (
                <Box display="flex" alignItems="center" gap={1} py={2}>
                  <CircularProgress size={16} />
                  <Typography variant="caption" color="text.disabled">
                    Loading last campaign copy…
                  </Typography>
                </Box>
              ) : (
                <TextField
                  multiline
                  minRows={4}
                  maxRows={10}
                  fullWidth
                  placeholder={
                    selectedStore
                      ? 'Type your test message…'
                      : 'Select a store first to auto-load last campaign copy'
                  }
                  disabled={!selectedStore}
                  value={copyText}
                  onChange={(e) => setCopyText(e.target.value)}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      fontFamily: 'monospace',
                      fontSize: 13,
                      lineHeight: 1.7,
                    },
                  }}
                />
              )}

              {lastCampaign?.content && (
                <Box
                  sx={{
                    mt: 1,
                    px: 2,
                    py: 0.75,
                    borderRadius: 1.5,
                    border: `1px dashed ${border}`,
                    bgcolor: bg,
                  }}
                >
                  <Typography
                    variant="caption"
                    color="text.disabled"
                    fontWeight={700}
                    sx={{ textTransform: 'uppercase', letterSpacing: 0.7, fontSize: 9 }}
                  >
                    Last campaign copy auto-loaded
                  </Typography>
                </Box>
              )}
            </Box>

            <Divider sx={{ borderStyle: 'dashed' }} />

            {/* ── 4. Image upload ── */}
            <Box>
              <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                <ImageRoundedIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                <Typography
                  variant="caption"
                  fontWeight={700}
                  color="text.secondary"
                  sx={{ textTransform: 'uppercase', letterSpacing: 0.7, fontSize: 10.5 }}
                >
                  4 · Campaign Image (optional)
                </Typography>
              </Stack>

              <Alert severity="warning" sx={{ borderRadius: 2, py: 0.25, mb: 2, fontSize: 12 }}>
                Max {MAX_IMAGE_KB} KB for MMS delivery. Leave empty for SMS only.
              </Alert>

              <AvatarUploadLogo
                label="Upload image"
                initialUrl={(lastCampaign as any)?.image}
                onSelect={(file) => {
                  if (!file) { setNewImage(null); return; }
                  if (file.size > MAX_IMAGE_KB * 1024) {
                    setSnack({ open: true, msg: `Image exceeds ${MAX_IMAGE_KB} KB.`, sev: 'error' });
                    return;
                  }
                  setNewImage(file);
                }}
              />

              {newImage && (
                <Chip
                  icon={<CheckCircleRoundedIcon />}
                  label={`${newImage.name} · ${(newImage.size / 1024).toFixed(0)} KB`}
                  color="success"
                  variant="outlined"
                  size="small"
                  sx={{ mt: 1.5 }}
                />
              )}
            </Box>

            <Divider sx={{ borderStyle: 'dashed' }} />

            {/* ── Send button ── */}
            <Button
              variant="contained"
              size="large"
              fullWidth
              disabled={!canSend || sendMutation.isPending}
              startIcon={
                sendMutation.isPending ? (
                  <CircularProgress size={18} color="inherit" />
                ) : (
                  <RocketLaunchRoundedIcon />
                )
              }
              onClick={() => setConfirmOpen(true)}
              sx={{
                py: 1.5,
                borderRadius: 2,
                fontWeight: 700,
                fontSize: 15,
                textTransform: 'none',
                background: canSend
                  ? `linear-gradient(135deg, ${accent} 0%, ${theme.palette.primary.dark} 100%)`
                  : undefined,
                boxShadow: canSend ? `0 4px 20px ${alpha(accent, 0.35)}` : 'none',
                '&:hover': { boxShadow: canSend ? `0 6px 28px ${alpha(accent, 0.45)}` : 'none' },
              }}
            >
              {sendMutation.isPending
                ? 'Sending…'
                : !selectedCustomer
                  ? 'Select a customer to send'
                  : `Send to ${selectedCustomer.firstName}`}
            </Button>
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
          {/* ── Phone Preview ── */}
          <Paper
            elevation={0}
            sx={{
              borderRadius: 3,
              border: `1px solid ${border}`,
              bgcolor: surface,
              overflow: 'hidden',
            }}
          >
            <Box sx={{ px: 3, py: 2, borderBottom: `1px solid ${border}`, bgcolor: bg }}>
              <Stack direction="row" alignItems="center" spacing={1.5}>
                <PhoneIphoneRoundedIcon sx={{ fontSize: 18, color: accent }} />
                <Typography variant="subtitle1" fontWeight={700}>
                  Live Preview
                </Typography>
                <Box flex={1} />
                <Chip
                  label={messageType}
                  size="small"
                  color={messageType === 'MMS' ? 'primary' : 'default'}
                  variant="outlined"
                  sx={{ fontSize: 10, height: 20 }}
                />
              </Stack>
            </Box>

            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 1.5,
                p: { xs: 3, lg: 3 },
                position: 'relative',
                overflow: 'hidden',
                bgcolor: bg,
              }}
            >
              {/* glow */}
              <Box
                sx={{
                  position: 'absolute',
                  width: 360,
                  height: 360,
                  borderRadius: '50%',
                  background: `radial-gradient(circle, ${alpha(accent, isDark ? 0.08 : 0.04)} 0%, transparent 70%)`,
                  pointerEvents: 'none',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                }}
              />

              <Typography
                variant="overline"
                sx={{ fontSize: 9, letterSpacing: 2, color: 'text.disabled', position: 'relative' }}
              >
                Real-time Preview
              </Typography>

              <Box sx={{ width: '100%', maxWidth: 240, position: 'relative' }}>
                <PreviewPhone content={copyText} image={previewImage} fontSize={10} />
              </Box>

              <Stack direction="row" spacing={1} sx={{ position: 'relative' }}>
                <Chip
                  label={`${charCount} chars`}
                  size="small"
                  variant="outlined"
                  color={charCount > 160 ? 'warning' : 'default'}
                  sx={{ fontSize: 10 }}
                />
                <Chip
                  label={messageType}
                  size="small"
                  variant="outlined"
                  color={messageType === 'MMS' ? 'primary' : 'default'}
                  sx={{ fontSize: 10 }}
                />
              </Stack>
            </Box>
          </Paper>

          {/* ── Summary Details ── */}
          <Paper
            elevation={0}
            sx={{
              borderRadius: 3,
              border: `1px solid ${border}`,
              bgcolor: surface,
              overflow: 'hidden',
            }}
          >
            <Box sx={{ px: 3, py: 1.5, borderBottom: `1px solid ${border}`, bgcolor: bg }}>
              <Typography
                variant="caption"
                fontWeight={700}
                color="text.secondary"
                sx={{ textTransform: 'uppercase', letterSpacing: 1, fontSize: 10 }}
              >
                Message Details
              </Typography>
            </Box>

            <SummaryRow
              label="To"
              value={selectedCustomer ? formatPhone(selectedCustomer.phoneNumber) : '— select customer —'}
              isDark={isDark}
              even={false}
            />
            <SummaryRow
              label="Customer"
              value={
                selectedCustomer ? (
                  <Stack direction="row" alignItems="center" spacing={0.5}>
                    <Typography variant="caption" fontWeight={700} sx={{ fontSize: 11 }}>
                      {selectedCustomer.firstName}
                    </Typography>
                    <Chip label="✓" size="small" color="success" sx={{ fontSize: 9, height: 16, minWidth: 16 }} />
                  </Stack>
                ) : (
                  '—'
                )
              }
              isDark={isDark}
              even={true}
            />
            <SummaryRow label="From" value={`+${TEST_BW_PHONE}`} isDark={isDark} even={false} />
            <SummaryRow label="Store" value={selectedStore?.name || '—'} isDark={isDark} even={true} />
            <SummaryRow label="Type" value={messageType} isDark={isDark} even={false} />
            <SummaryRow label="Provider" value="BANDWIDTH" isDark={isDark} even={true} />
            <SummaryRow label="BW ID" value={TEST_BW_ID.slice(0, 8) + '…'} isDark={isDark} even={false} />
            <SummaryRow label="Characters" value={`${charCount}`} isDark={isDark} even={true} />
          </Paper>

          {/* ── Kiosk CTA (when no customers and search active) ── */}
          {selectedStore && kioskUrl && !selectedCustomer && debouncedSearch.length >= 2 && !customersLoading && customerResults.length === 0 && (
            <Fade in>
              <Paper
                elevation={0}
                sx={{
                  borderRadius: 3,
                  border: `1px solid ${alpha(theme.palette.warning.main, 0.3)}`,
                  bgcolor: alpha(theme.palette.warning.main, isDark ? 0.05 : 0.03),
                  p: 2.5,
                }}
              >
                <Stack spacing={2}>
                  <Stack direction="row" alignItems="center" spacing={1.5}>
                    <WarningAmberRoundedIcon sx={{ fontSize: 20, color: 'warning.main' }} />
                    <Box>
                      <Typography variant="body2" fontWeight={700}>
                        Register New Customer
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Use the kiosk to register a customer, then search again
                      </Typography>
                    </Box>
                  </Stack>
                  <Button
                    variant="contained"
                    size="small"
                    color="warning"
                    fullWidth
                    startIcon={<OpenInNewRoundedIcon />}
                    onClick={() => window.open(kioskUrl, '_blank')}
                    sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700, py: 1 }}
                  >
                    Open Kiosk — {selectedStore.name}
                  </Button>
                </Stack>
              </Paper>
            </Fade>
          )}
        </Box>
      </Box>

      {/* ─── Confirm Dialog ─── */}
      <Dialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          elevation: 0,
          sx: { borderRadius: 3, border: `1px solid ${border}`, bgcolor: surface, backgroundImage: 'none' },
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: 1.5,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: alpha(theme.palette.warning.main, 0.12),
              }}
            >
              <SendRoundedIcon sx={{ fontSize: 18, color: theme.palette.warning.main }} />
            </Box>
            <Typography variant="subtitle1" fontWeight={700}>
              Send Test Message?
            </Typography>
            <Box flex={1} />
            <IconButton size="small" onClick={() => setConfirmOpen(false)}>
              <CloseRoundedIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Stack>
        </DialogTitle>

        <DialogContent>
          <Box sx={{ borderRadius: 2, border: `1px solid ${border}`, overflow: 'hidden', mb: 2 }}>
            {[
              ['To', selectedCustomer ? formatPhone(selectedCustomer.phoneNumber) : '—'],
              ['Customer', selectedCustomer ? `${selectedCustomer.firstName} ${selectedCustomer.lastName || ''}` : '—'],
              ['From', `+${TEST_BW_PHONE}`],
              ['Store', selectedStore?.name || '—'],
              ['Type', messageType],
              ['Provider', 'BANDWIDTH'],
            ].map(([label, value], i) => (
              <SummaryRow key={label as string} label={label as string} value={value as string} isDark={isDark} even={i % 2 === 1} />
            ))}
          </Box>
          <Box
            sx={{
              p: 1.5,
              borderRadius: 2,
              border: `1px solid ${border}`,
              fontFamily: 'monospace',
              fontSize: 11,
              lineHeight: 1.7,
              color: 'text.secondary',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              maxHeight: 120,
              overflowY: 'auto',
              bgcolor: bg,
            }}
          >
            {copyText || '(empty)'}
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 2.5, py: 1.5 }}>
          <Button size="small" color="inherit" onClick={() => setConfirmOpen(false)}>
            Cancel
          </Button>
          <Button
            size="small"
            variant="contained"
            color="success"
            disableElevation
            disabled={sendMutation.isPending}
            onClick={() => sendMutation.mutate()}
            startIcon={
              sendMutation.isPending ? (
                <CircularProgress size={13} color="inherit" />
              ) : (
                <CheckCircleRoundedIcon sx={{ fontSize: 15 }} />
              )
            }
            sx={{ px: 2.5, borderRadius: 1.5 }}
          >
            {sendMutation.isPending ? 'Sending…' : 'Confirm & Send'}
          </Button>
        </DialogActions>
      </Dialog>

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
