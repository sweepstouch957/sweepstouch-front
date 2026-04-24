'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField,
  Typography, CircularProgress, Stack, Box, Divider, Chip, Alert,
  Autocomplete, InputAdornment, Avatar, IconButton,
} from '@mui/material';
import SendRoundedIcon from '@mui/icons-material/SendRounded';
import QrCodeIcon from '@mui/icons-material/QrCode';
import PhoneIphoneRoundedIcon from '@mui/icons-material/PhoneIphoneRounded';
import LinkIcon from '@mui/icons-material/Link';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import SearchIcon from '@mui/icons-material/Search';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import EditIcon from '@mui/icons-material/Edit';
import axios from 'axios';
import { customerClient, type Customer } from '@/services/customerService';
import { generateMmsText } from '@/services/ai.service';
import { campaignClient } from '@/services/campaing.service';

const API_URL = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/+$/, '');
const TRACKING_URL = (process.env.NEXT_PUBLIC_TRACKING_URL || API_URL).replace(/\/+$/, '');
const LINKTREE_URL = (process.env.NEXT_PUBLIC_LINKTREE_URL || 'http://localhost:3001').replace(/\/+$/, '');
const TEST_BW_PHONE = process.env.NEXT_PUBLIC_TEST_BW_PHONE || '18332197926';
const TEST_BW_ID = process.env.NEXT_PUBLIC_TEST_BW_ID || 'c3799660-ff17-4e29-a41a-e53f2d8b3859';

interface Product {
  name: string;
  price: string;
  unit?: string;
  category?: string;
  emoji?: string;
  imageUrl?: string;
  isHero?: boolean;
  savings?: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  storeId: string;
  storeSlug: string;
  storeName: string;
  products: Product[];
  headline: string;
  circularId?: string;
  circularFileUrl?: string;
  // Store provider info for sending
  storeProvider?: string;
  storeBandwidthPhone?: string;
  storeBandwidthId?: string;
}

type Step = 'select' | 'compose' | 'sent';

export default function TestMmsShoppingListModal({
  open, onClose, storeId, storeSlug, storeName, products, headline, circularId,
  circularFileUrl, storeProvider, storeBandwidthPhone, storeBandwidthId,
}: Props) {
  // Customer search
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [phoneSearch, setPhoneSearch] = useState('');

  // Step management
  const [step, setStep] = useState<Step>('select');

  // Shopping list result
  const [creatingList, setCreatingList] = useState(false);
  const [listResult, setListResult] = useState<{ qrCode: string; link: string; totalItems: number } | null>(null);

  // AI text generation
  const [generatingText, setGeneratingText] = useState(false);
  const [smsText, setSmsText] = useState('');
  const [editingText, setEditingText] = useState(false);

  // Sending
  const [sending, setSending] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);

  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  // Load customers when modal opens
  useEffect(() => {
    if (!open || !storeId) return;
    (async () => {
      setLoadingCustomers(true);
      try {
        const res = await customerClient.getCustomersByStore(storeId, 1, 200);
        setCustomers(res.data || []);
      } catch (err) {
        console.error('Failed to load customers', err);
      } finally {
        setLoadingCustomers(false);
      }
    })();
  }, [open, storeId]);

  // Filtered customers by phone search
  const filteredCustomers = useMemo(() => {
    if (!phoneSearch) return customers;
    const q = phoneSearch.replace(/\D/g, '');
    return customers.filter((c) =>
      c.phoneNumber.includes(q) || c.firstName?.toLowerCase().includes(phoneSearch.toLowerCase())
    );
  }, [customers, phoneSearch]);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('uifort-authentication');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  // Step 1: Create shopping list + AI text
  const handleCreateAndCompose = useCallback(async () => {
    if (!selectedCustomer) return;
    setCreatingList(true);
    setError('');

    try {
      // Build items from products (max 6)
      const items = products.slice(0, 6).map((p) => ({
        name: p.name,
        price: p.price,
        quantity: 1,
        unit: p.unit || 'each',
        category: p.category || 'other',
        imageUrl: p.imageUrl || '',
      }));

      // Create shopping list via tracking-service
      const res = await axios.post(
        `${TRACKING_URL}/tracking/shopping-list`,
        {
          customerId: selectedCustomer.phoneNumber,
          storeSlug,
          circularId: circularId || undefined,
          items,
        },
        { headers: getAuthHeaders() }
      );

      const { qrCode, totalItems } = res.data;
      const link = `${LINKTREE_URL}?slug=${storeSlug}&sl=${qrCode}`;
      setListResult({ qrCode, link, totalItems });

      // Now generate AI text
      setGeneratingText(true);
      try {
        const aiText = await generateMmsText({
          storeName,
          products: products.slice(0, 6).map(p => ({ name: p.name, price: p.price })),
          headline: headline || undefined,
          link,
        });
        setSmsText(aiText || `🛒 ${storeName} — Your personalized deals are ready!\n\n${link}\n\nReply STOP to unsubscribe.`);
      } catch (aiErr) {
        console.warn('AI text generation failed, using fallback', aiErr);
        // Fallback text
        const productList = products.slice(0, 3).map(p => `• ${p.name} ${p.price}`).join('\n');
        setSmsText(`🛒 ${storeName}\n${headline || 'Your VIP Deals Are Ready!'}\n\n${productList}\n\n👉 ${link}\n\nReply STOP to opt out.`);
      } finally {
        setGeneratingText(false);
      }

      setStep('compose');
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to create shopping list');
    } finally {
      setCreatingList(false);
    }
  }, [selectedCustomer, products, storeSlug, circularId, storeName, headline]);

  // Step 2: Send the SMS
  const handleSend = useCallback(async () => {
    if (!selectedCustomer || !smsText.trim()) return;
    setSending(true);
    setError('');

    try {
      await campaignClient.sendTestMessage({
        phone: selectedCustomer.phoneNumber.replace(/\D/g, ''),
        message: smsText,
        image: circularFileUrl || null,
        provider: storeProvider || 'bandwidth',
        phoneNumber: storeBandwidthPhone || TEST_BW_PHONE,
        id: storeBandwidthId || TEST_BW_ID,
      });
      setSentSuccess(true);
      setStep('sent');
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  }, [selectedCustomer, smsText, circularFileUrl, storeProvider, storeBandwidthPhone, storeBandwidthId]);

  const handleCopy = () => {
    if (listResult?.link) {
      navigator.clipboard.writeText(listResult.link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const resetState = () => {
    setSelectedCustomer(null);
    setPhoneSearch('');
    setListResult(null);
    setSmsText('');
    setEditingText(false);
    setError('');
    setCopied(false);
    setStep('select');
    setSentSuccess(false);
    onClose();
  };

  const charCount = smsText.length;

  return (
    <Dialog open={open} onClose={resetState} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Stack direction="row" alignItems="center" spacing={1}>
          <QrCodeIcon sx={{ color: '#f43789' }} />
          <Typography variant="h6" fontWeight={700}>
            {step === 'select' && 'Test MMS — Send to Customer'}
            {step === 'compose' && '✨ AI Message Ready — Review & Send'}
            {step === 'sent' && '✅ Message Sent!'}
          </Typography>
        </Stack>
      </DialogTitle>

      <DialogContent dividers>
        {/* ─── STEP 1: Select Customer ─── */}
        {step === 'select' && (
          <Box display="flex" flexDirection="column" gap={2.5}>
            <Typography variant="body2" color="text.secondary">
              Select a customer from <strong>{storeName}</strong>. We'll create a shopping list,
              generate an AI message, and send it directly to their phone.
            </Typography>

            {/* Store + Products info */}
            <Stack direction="row" spacing={1} flexWrap="wrap">
              <Chip label={storeName} size="small" color="primary" variant="outlined" />
              <Chip label={`${Math.min(products.length, 6)} products`} size="small" color="success" variant="outlined" />
              {headline && <Chip label={headline} size="small" variant="outlined" />}
            </Stack>

            {/* Customer search */}
            <Autocomplete
              value={selectedCustomer}
              onChange={(_e, v) => setSelectedCustomer(v)}
              inputValue={phoneSearch}
              onInputChange={(_e, v) => setPhoneSearch(v)}
              options={filteredCustomers}
              loading={loadingCustomers}
              getOptionLabel={(opt) => `${opt.phoneNumber} — ${opt.firstName || 'No name'}`}
              isOptionEqualToValue={(o, v) => o._id === v._id}
              renderOption={(props, option) => {
                const { key, ...rest } = props as any;
                return (
                  <Box component="li" key={key || option._id} {...rest}
                    sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1 }}>
                    <Avatar sx={{ width: 32, height: 32, bgcolor: '#f43789', fontSize: 13, fontWeight: 'bold' }}>
                      {option.firstName?.charAt(0)?.toUpperCase() || '?'}
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Typography sx={{ fontWeight: 600, fontSize: 14 }}>
                        {option.phoneNumber}
                      </Typography>
                      <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
                        {option.firstName || 'Unknown'} · {option.countryCode || 'US'}
                      </Typography>
                    </Box>
                  </Box>
                );
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Search customer by phone or name"
                  placeholder="Enter phone number..."
                  InputProps={{
                    ...params.InputProps,
                    startAdornment: (
                      <>
                        <InputAdornment position="start">
                          <SearchIcon sx={{ color: 'text.secondary' }} />
                        </InputAdornment>
                        {params.InputProps.startAdornment}
                      </>
                    ),
                    endAdornment: (
                      <>
                        {loadingCustomers ? <CircularProgress size={18} /> : null}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  }}
                />
              )}
              noOptionsText="No customers found for this store"
            />

            {selectedCustomer && (
              <Alert severity="info" variant="outlined" sx={{ fontSize: 13 }}>
                📱 Will create shopping list & send SMS to <strong>{selectedCustomer.phoneNumber}</strong> ({selectedCustomer.firstName || 'Unknown'})
                with <strong>{Math.min(products.length, 6)}</strong> products.
              </Alert>
            )}

            {error && <Alert severity="error">{error}</Alert>}
          </Box>
        )}

        {/* ─── STEP 2: Compose / Review AI Text ─── */}
        {step === 'compose' && listResult && (
          <Box display="flex" flexDirection="column" gap={2}>
            {/* Link info */}
            <Box sx={{
              p: 2, borderRadius: 2,
              bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)',
              border: '1px solid', borderColor: 'divider',
            }}>
              <Stack spacing={1}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography variant="caption" fontWeight={700} color="text.secondary">QR CODE</Typography>
                    <Typography fontWeight="bold" fontFamily="monospace" color="primary">
                      {listResult.qrCode}
                    </Typography>
                  </Box>
                  <Chip label={`${listResult.totalItems} items`} size="small" color="success" />
                </Stack>
                <Box sx={{
                  p: 1, borderRadius: 1.5,
                  bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(244,55,137,0.08)' : 'rgba(244,55,137,0.05)',
                  border: '1px solid rgba(244,55,137,0.2)',
                  display: 'flex', alignItems: 'center', gap: 1,
                }}>
                  <LinkIcon sx={{ color: '#f43789', fontSize: 16 }} />
                  <Typography sx={{ flex: 1, fontSize: 11, fontFamily: 'monospace', wordBreak: 'break-all' }}>
                    {listResult.link}
                  </Typography>
                  <IconButton size="small" onClick={handleCopy}>
                    {copied ? <CheckCircleIcon sx={{ fontSize: 16, color: '#4caf50' }} /> : <ContentCopyIcon sx={{ fontSize: 16 }} />}
                  </IconButton>
                </Box>
              </Stack>
            </Box>

            <Divider />

            {/* AI-generated text */}
            <Box>
              <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <AutoAwesomeIcon sx={{ fontSize: 18, color: '#f43789' }} />
                  <Typography variant="subtitle2" fontWeight={700}>
                    {generatingText ? 'AI is writing your message...' : 'AI-Generated Message'}
                  </Typography>
                </Stack>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Chip label={`${charCount} chars`} size="small" variant="outlined"
                    color={charCount > 160 ? 'warning' : 'default'} sx={{ fontSize: 10, height: 22 }} />
                  {!generatingText && (
                    <IconButton size="small" onClick={() => setEditingText(!editingText)}>
                      <EditIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  )}
                </Stack>
              </Stack>

              {generatingText ? (
                <Box display="flex" alignItems="center" gap={1.5} py={3} justifyContent="center">
                  <CircularProgress size={24} sx={{ color: '#f43789' }} />
                  <Typography variant="body2" color="text.secondary">
                    Generating personalized message with AI...
                  </Typography>
                </Box>
              ) : editingText ? (
                <TextField
                  multiline
                  minRows={4}
                  maxRows={8}
                  fullWidth
                  value={smsText}
                  onChange={(e) => setSmsText(e.target.value)}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      fontFamily: 'monospace',
                      fontSize: 13,
                      lineHeight: 1.7,
                    },
                  }}
                />
              ) : (
                <Box sx={{
                  p: 2, borderRadius: 2,
                  bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : '#f9fafb',
                  border: '1px solid', borderColor: 'divider',
                  fontFamily: 'monospace', fontSize: 13, lineHeight: 1.7, whiteSpace: 'pre-wrap',
                }}>
                  {smsText}
                </Box>
              )}
            </Box>

            {/* Recipient */}
            <Alert severity="success" variant="outlined" icon={<PhoneIphoneRoundedIcon />} sx={{ fontSize: 13 }}>
              Will send to: <strong>{selectedCustomer?.phoneNumber}</strong> ({selectedCustomer?.firstName || 'Unknown'})
              {circularFileUrl && <><br />📎 MMS with flyer image attached</>}
            </Alert>

            {error && <Alert severity="error">{error}</Alert>}
          </Box>
        )}

        {/* ─── STEP 3: Sent Success ─── */}
        {step === 'sent' && listResult && (
          <Box display="flex" flexDirection="column" alignItems="center" gap={2} py={2}>
            <CheckCircleIcon sx={{ fontSize: 64, color: '#4caf50' }} />
            <Typography variant="h6" fontWeight={700} color="success.main">
              Message Sent Successfully!
            </Typography>
            <Typography variant="body2" color="text.secondary" textAlign="center">
              SMS sent to <strong>{selectedCustomer?.phoneNumber}</strong> with the shopping list link.
            </Typography>

            <Box sx={{
              width: '100%', p: 2, borderRadius: 2,
              bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)',
              border: '1px solid', borderColor: 'divider',
            }}>
              <Stack spacing={1.5}>
                <Box>
                  <Typography variant="caption" fontWeight={700} color="text.secondary">QR CODE</Typography>
                  <Typography variant="h5" fontWeight="bold" fontFamily="monospace" color="primary">
                    {listResult.qrCode}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" fontWeight={700} color="text.secondary">LINK</Typography>
                  <Box sx={{
                    mt: 0.5, p: 1.5, borderRadius: 1.5,
                    bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(244,55,137,0.08)' : 'rgba(244,55,137,0.05)',
                    border: '1px solid rgba(244,55,137,0.2)',
                    display: 'flex', alignItems: 'center', gap: 1,
                  }}>
                    <LinkIcon sx={{ color: '#f43789', fontSize: 18 }} />
                    <Typography sx={{ flex: 1, fontSize: 12, fontFamily: 'monospace', wordBreak: 'break-all' }}>
                      {listResult.link}
                    </Typography>
                    <Button size="small" onClick={handleCopy}
                      startIcon={copied ? <CheckCircleIcon /> : <ContentCopyIcon />}
                      sx={{ minWidth: 'auto', textTransform: 'none', fontSize: 12 }}>
                      {copied ? 'Copied!' : 'Copy'}
                    </Button>
                  </Box>
                </Box>
              </Stack>
            </Box>

            <Button
              variant="outlined" size="small"
              startIcon={<OpenInNewIcon />}
              onClick={() => window.open(listResult.link, '_blank')}
              sx={{ textTransform: 'none' }}
            >
              Open in new tab
            </Button>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        {step === 'select' && (
          <>
            <Button onClick={resetState} color="inherit">Cancel</Button>
            <Button
              onClick={handleCreateAndCompose}
              variant="contained"
              disabled={!selectedCustomer || creatingList}
              startIcon={creatingList ? <CircularProgress size={16} /> : <AutoAwesomeIcon />}
              sx={{
                background: 'linear-gradient(135deg, #f43789 0%, #ff6b9d 100%)',
                fontWeight: 'bold',
                '&:hover': { background: 'linear-gradient(135deg, #d42f78 0%, #f43789 100%)' },
              }}
            >
              {creatingList ? 'Creating...' : '✨ Generate AI Message'}
            </Button>
          </>
        )}
        {step === 'compose' && (
          <>
            <Button onClick={() => setStep('select')} color="inherit">← Back</Button>
            <Button
              onClick={handleSend}
              variant="contained"
              disabled={sending || !smsText.trim()}
              startIcon={sending ? <CircularProgress size={16} color="inherit" /> : <SendRoundedIcon />}
              sx={{
                background: 'linear-gradient(135deg, #DC1F26 0%, #ff6b6b 100%)',
                fontWeight: 'bold',
                '&:hover': { background: 'linear-gradient(135deg, #b01820 0%, #e55 100%)' },
              }}
            >
              {sending ? 'Sending...' : `📤 Send SMS to ${selectedCustomer?.phoneNumber || 'Customer'}`}
            </Button>
          </>
        )}
        {step === 'sent' && (
          <Button onClick={resetState} variant="contained">Done</Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
