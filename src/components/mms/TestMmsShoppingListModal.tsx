'use client';

import React, { useState, useCallback, useRef, useMemo } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField,
  Typography, CircularProgress, Stack, Box, Chip, Alert,
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
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import ImageRoundedIcon from '@mui/icons-material/ImageRounded';
import { useCustomerSearch, useMmsSend } from '@/hooks/useMmsTest';

// ─── Types ──────────────────────────────────────────────
const isPdfUrl = (url?: string | null): boolean =>
  !!url && /\.pdf(\?.*)?$/i.test(url);

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
  storeProvider?: string;
  storeBandwidthPhone?: string;
  storeBandwidthId?: string;
  storeInfobipSenderId?: string;
  storeTwilioPhone?: string;
}

type Step = 'select' | 'compose' | 'sent';

// ─── Clipboard helper ───────────────────────────────────
function useCopy() {
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const copy = useCallback((text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setCopied(false), 2000);
  }, []);
  return { copied, copy };
}

// ─── Link Display ───────────────────────────────────────
const LinkDisplay = React.memo(({ link, shortLink, copy, copied }: {
  link: string; shortLink?: string; copy: (t: string) => void; copied: boolean;
}) => (
  <Stack spacing={1}>
    {shortLink && (
      <Box sx={{
        p: 1.5, borderRadius: 1.5,
        bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(76,175,80,0.08)' : 'rgba(76,175,80,0.05)',
        border: '1px solid rgba(76,175,80,0.3)',
        display: 'flex', alignItems: 'center', gap: 1,
      }}>
        <LinkIcon sx={{ color: '#4caf50', fontSize: 18 }} />
        <Box sx={{ flex: 1 }}>
          <Typography variant="caption" fontWeight={700} color="success.main"
            sx={{ display: 'block', fontSize: 9, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Short Link (used in SMS)
          </Typography>
          <Typography sx={{ fontSize: 13, fontFamily: 'monospace', fontWeight: 700 }}>
            {shortLink}
          </Typography>
        </Box>
        <IconButton size="small" onClick={() => copy(shortLink)}>
          {copied ? <CheckCircleIcon sx={{ fontSize: 16, color: '#4caf50' }} /> : <ContentCopyIcon sx={{ fontSize: 16 }} />}
        </IconButton>
      </Box>
    )}
    <Box sx={{
      p: 1, borderRadius: 1.5,
      bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(244,55,137,0.08)' : 'rgba(244,55,137,0.05)',
      border: '1px solid rgba(244,55,137,0.2)',
      display: 'flex', alignItems: 'center', gap: 1,
    }}>
      <LinkIcon sx={{ color: '#f43789', fontSize: 16 }} />
      <Box sx={{ flex: 1 }}>
        {shortLink && (
          <Typography variant="caption" color="text.disabled"
            sx={{ display: 'block', fontSize: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Original URL
          </Typography>
        )}
        <Typography sx={{ fontSize: 10, fontFamily: 'monospace', wordBreak: 'break-all', color: 'text.secondary' }}>
          {link}
        </Typography>
      </Box>
      <IconButton size="small" onClick={() => copy(link)}>
        <ContentCopyIcon sx={{ fontSize: 14 }} />
      </IconButton>
    </Box>
  </Stack>
));
LinkDisplay.displayName = 'LinkDisplay';

// ─── Main Modal ─────────────────────────────────────────
export default function TestMmsShoppingListModal({
  open, onClose, storeId, storeSlug, storeName, products, headline, circularId,
  circularFileUrl, storeProvider, storeBandwidthPhone, storeBandwidthId,
  storeInfobipSenderId, storeTwilioPhone,
}: Props) {
  const [step, setStep] = useState<Step>('select');
  const [editingText, setEditingText] = useState(false);
  const [mmsImageFile, setMmsImageFile] = useState<File | null>(null);
  const [uploadedMmsUrl, setUploadedMmsUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { copied, copy } = useCopy();

  const circularIsPdf = isPdfUrl(circularFileUrl);
  const effectiveImage = uploadedMmsUrl || (circularIsPdf ? null : circularFileUrl) || null;

  // ─── Hooks ───
  const customerSearch = useCustomerSearch(storeId, open);
  const mmsSend = useMmsSend({
    storeSlug, storeName, circularId,
    storeProvider, storeBandwidthPhone, storeBandwidthId,
    storeInfobipSenderId, storeTwilioPhone,
  });

  // ─── Handlers ───
  const handleCreateAndCompose = useCallback(async () => {
    if (!customerSearch.selected) return;
    const ok = await mmsSend.createShoppingList(customerSearch.selected, products);
    if (ok) setStep('compose');
  }, [customerSearch.selected, products, mmsSend]);

  const handleSend = useCallback(async () => {
    if (!customerSearch.selected) return;
    const ok = await mmsSend.sendMessage(customerSearch.selected, effectiveImage, mmsImageFile);
    if (ok) setStep('sent');
  }, [customerSearch.selected, effectiveImage, mmsImageFile, mmsSend]);

  const handleImageFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setMmsImageFile(file);
      setUploadedMmsUrl(null);
    }
  }, []);

  const resetState = useCallback(() => {
    customerSearch.reset();
    mmsSend.reset();
    setStep('select');
    setEditingText(false);
    setMmsImageFile(null);
    setUploadedMmsUrl(null);
    onClose();
  }, [customerSearch, mmsSend, onClose]);

  // Char count
  const charCount = mmsSend.smsText.length;
  const charColor = charCount > 320 ? '#f44336' : charCount > 160 ? '#ff9800' : '#4caf50';

  // Product summary
  const productSummary = useMemo(() =>
    products.slice(0, 3).map(p => p.name).join(', ') + (products.length > 3 ? ` +${products.length - 3} more` : ''),
    [products]
  );

  if (!open) return null;

  return (
    <Dialog open={open} onClose={resetState} maxWidth="sm" fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          border: '1px solid rgba(255,255,255,0.08)',
          background: (t) => t.palette.mode === 'dark'
            ? 'linear-gradient(145deg, rgba(28,28,45,0.98) 0%, rgba(18,18,32,0.99) 100%)'
            : 'linear-gradient(145deg, rgba(255,255,255,0.99) 0%, rgba(248,249,252,0.99) 100%)',
        },
      }}
    >
      <DialogTitle sx={{
        display: 'flex', alignItems: 'center', gap: 1, py: 2,
        borderBottom: '1px solid', borderColor: 'divider',
      }}>
        <QrCodeIcon sx={{ color: '#f43789' }} />
        <Typography variant="h6" fontWeight={700} sx={{ flex: 1 }}>
          {step === 'select' ? '📱 Test MMS — Select Customer' :
           step === 'compose' ? '✨ AI Message Ready — Review & Send' :
           '✅ Message Sent!'}
        </Typography>
        {step === 'compose' && (
          <Chip label={products.length + ' items'} size="small"
            sx={{ bgcolor: 'rgba(76,175,80,0.15)', color: '#4caf50', fontWeight: 700 }} />
        )}
      </DialogTitle>

      <DialogContent sx={{ pt: 2, pb: 1 }}>
        {/* ─── STEP 1: Select Customer ─── */}
        {step === 'select' && (
          <Box display="flex" flexDirection="column" gap={2}>
            <Alert severity="info" variant="outlined" sx={{ fontSize: 13 }}>
              Select a customer to send a personalized MMS with {products.length} deal{products.length !== 1 ? 's' : ''}
              from <strong>{storeName}</strong>
            </Alert>

            <Autocomplete
              value={customerSearch.selected}
              onChange={(_, v) => customerSearch.setSelected(v)}
              options={customerSearch.customers}
              loading={customerSearch.loading}
              getOptionLabel={(o) => `${o.phoneNumber} — ${o.firstName || 'Unknown'}`}
              isOptionEqualToValue={(a, b) => a.phoneNumber === b.phoneNumber}
              inputValue={customerSearch.search}
              onInputChange={(_, v) => customerSearch.setSearch(v)}
              renderOption={(props, option) => {
                const { key, ...rest } = props as any;
                return (
                <Box component="li" key={key || option.phoneNumber} {...rest}
                  sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1.5 }}>
                  <Avatar sx={{ width: 32, height: 32, bgcolor: '#DC1F26', fontSize: 13, fontWeight: 'bold' }}>
                    {(option.firstName?.[0] || '?').toUpperCase()}
                  </Avatar>
                  <Box>
                    <Typography sx={{ fontWeight: 600, fontSize: 14 }}>{option.phoneNumber}</Typography>
                    <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>
                      {option.firstName || 'Unknown'}
                    </Typography>
                  </Box>
                </Box>
                );
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  placeholder="Search by phone number or name..."
                  variant="outlined"
                  InputProps={{
                    ...params.InputProps,
                    startAdornment: (
                      <InputAdornment position="start"><SearchIcon sx={{ color: 'text.secondary' }} /></InputAdornment>
                    ),
                    endAdornment: (
                      <>
                        {customerSearch.loading ? <CircularProgress size={18} /> : null}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  }}
                />
              )}
            />

            {customerSearch.selected && (
              <Alert severity="success" variant="outlined" icon={<PhoneIphoneRoundedIcon />} sx={{ fontSize: 13 }}>
                📦 Will create a shopping list with {products.length} products: {productSummary}
              </Alert>
            )}

            {mmsSend.error && <Alert severity="error">{mmsSend.error}</Alert>}
          </Box>
        )}

        {/* ─── STEP 2: Compose / Review AI Text ─── */}
        {step === 'compose' && mmsSend.listResult && (
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
                      {mmsSend.listResult.qrCode}
                    </Typography>
                  </Box>
                  <Chip label={`${mmsSend.listResult.totalItems} items`} size="small" color="success" />
                </Stack>
                <LinkDisplay
                  link={mmsSend.listResult.link}
                  shortLink={mmsSend.listResult.shortLink}
                  copy={copy}
                  copied={copied}
                />
              </Stack>
            </Box>

            {/* SMS Text */}
            <Box>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                <Typography variant="subtitle2" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <AutoAwesomeIcon fontSize="small" sx={{ color: '#f43789' }} />
                  {mmsSend.generatingText ? 'Generating...' : 'AI-Generated Message'}
                </Typography>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Chip label={`${charCount} chars`} size="small"
                    sx={{ height: 22, fontSize: 11, bgcolor: `${charColor}22`, color: charColor, fontWeight: 700 }} />
                  <IconButton size="small" onClick={() => setEditingText(!editingText)}>
                    <EditIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                </Stack>
              </Stack>

              {mmsSend.generatingText ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                  <CircularProgress size={28} />
                </Box>
              ) : editingText ? (
                <TextField
                  multiline rows={6} fullWidth value={mmsSend.smsText}
                  onChange={(e) => mmsSend.setSmsText(e.target.value)}
                  sx={{ '& .MuiInputBase-root': { fontSize: 13, fontFamily: 'monospace' } }}
                />
              ) : (
                <Box sx={{
                  p: 2, borderRadius: 2, fontSize: 13, lineHeight: 1.7, whiteSpace: 'pre-wrap',
                  bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)',
                  border: '1px solid', borderColor: 'divider',
                }}>
                  {mmsSend.smsText}
                </Box>
              )}
            </Box>

            {/* MMS Image Upload for PDFs */}
            {circularIsPdf && (
              <Box>
                <input type="file" ref={fileInputRef} accept="image/*"
                  style={{ display: 'none' }} onChange={handleImageFile} />
                <Alert severity="warning" variant="outlined" sx={{ mb: 1 }}>
                  <strong>PDF Detected</strong> — Upload an image for MMS attachment.
                </Alert>
                <Stack direction="row" spacing={1} alignItems="center">
                  {mmsImageFile && (
                    <Chip icon={<ImageRoundedIcon />} label={mmsImageFile.name}
                      size="small" onDelete={() => { setMmsImageFile(null); setUploadedMmsUrl(null); }} />
                  )}
                  <Button size="small" variant="outlined" startIcon={<CloudUploadIcon />}
                    onClick={() => fileInputRef.current?.click()}>
                    {mmsImageFile ? 'Change Image' : 'Upload Campaign Image'}
                  </Button>
                </Stack>
              </Box>
            )}

            {/* Recipient */}
            <Alert severity="success" variant="outlined" icon={<PhoneIphoneRoundedIcon />} sx={{ fontSize: 13 }}>
              Will send to: <strong>{customerSearch.selected?.phoneNumber}</strong> ({customerSearch.selected?.firstName || 'Unknown'})
              {effectiveImage && <><br />📎 MMS with image attached</>}
              {circularIsPdf && !mmsImageFile && <><br />⚠️ No image uploaded — will send as SMS only</>}
            </Alert>

            {mmsSend.error && <Alert severity="error">{mmsSend.error}</Alert>}
          </Box>
        )}

        {/* ─── STEP 3: Sent Success ─── */}
        {step === 'sent' && mmsSend.listResult && (
          <Box display="flex" flexDirection="column" alignItems="center" gap={2} py={2}>
            <CheckCircleIcon sx={{ fontSize: 64, color: '#4caf50' }} />
            <Typography variant="h6" fontWeight={700} color="success.main">
              Message Sent Successfully!
            </Typography>
            <Typography variant="body2" color="text.secondary" textAlign="center">
              SMS sent to <strong>{customerSearch.selected?.phoneNumber}</strong> with the shopping list link.
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
                    {mmsSend.listResult.qrCode}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" fontWeight={700} color="text.secondary">
                    {mmsSend.listResult.shortLink ? 'SHORT LINK' : 'LINK'}
                  </Typography>
                  <LinkDisplay
                    link={mmsSend.listResult.link}
                    shortLink={mmsSend.listResult.shortLink}
                    copy={copy}
                    copied={copied}
                  />
                </Box>
              </Stack>
            </Box>

            <Button
              variant="outlined" size="small" startIcon={<OpenInNewIcon />}
              onClick={() => window.open(mmsSend.listResult?.shortLink || mmsSend.listResult?.link, '_blank')}
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
              disabled={!customerSearch.selected || mmsSend.creatingList}
              startIcon={mmsSend.creatingList ? <CircularProgress size={16} /> : <AutoAwesomeIcon />}
              sx={{
                borderRadius: 2, textTransform: 'none', fontWeight: 700,
                background: 'linear-gradient(135deg, #f43789 0%, #DC1F26 100%)',
                '&:hover': { background: 'linear-gradient(135deg, #DC1F26 0%, #b71c1c 100%)' },
              }}
            >
              {mmsSend.creatingList ? 'Creating...' : 'Create List & Generate AI Text'}
            </Button>
          </>
        )}
        {step === 'compose' && (
          <>
            <Button onClick={() => setStep('select')} color="inherit">← Back</Button>
            <Button
              onClick={handleSend}
              variant="contained"
              disabled={mmsSend.sending || !mmsSend.smsText.trim()}
              startIcon={mmsSend.sending
                ? <CircularProgress size={16} sx={{ color: 'white' }} />
                : <SendRoundedIcon />
              }
              sx={{
                borderRadius: 2, textTransform: 'none', fontWeight: 700,
                background: 'linear-gradient(135deg, #DC1F26 0%, #8B0000 100%)',
                '&:hover': { background: 'linear-gradient(135deg, #b71c1c 0%, #6d0000 100%)' },
              }}
            >
              {mmsSend.sending ? 'Sending...' : `Send SMS to ${customerSearch.selected?.phoneNumber}`}
            </Button>
          </>
        )}
        {step === 'sent' && (
          <Button onClick={resetState} variant="contained" sx={{ borderRadius: 2, textTransform: 'none' }}>
            Close
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
