'use client';

import React, { useState, useCallback } from 'react';
import {
  Box, Button, CircularProgress, Stack, Typography, Alert,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import SaveIcon from '@mui/icons-material/Save';
import BugReportRoundedIcon from '@mui/icons-material/BugReportRounded';
import { circularService } from '@/services/circular.service';
import TestMmsShoppingListModal from '@/components/mms/TestMmsShoppingListModal';

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
  circularId: string;
  storeId: string;
  storeSlug: string;
  storeName: string;
  campaignCode: string;
  products: Product[];
  recipes?: any[];
  headline: string;
  circularFileUrl?: string;
  onGenerated: (result: { generated: number; skipped: number }) => void;
  // Store provider info for sending
  storeProvider?: string;
  storeBandwidthPhone?: string;
  storeBandwidthId?: string;
  storeInfobipSenderId?: string;
  storeTwilioPhone?: string;
}

export default function MmsActionBar({
  circularId, storeId, storeSlug, storeName, campaignCode, products, recipes, headline,
  circularFileUrl, onGenerated, storeProvider, storeBandwidthPhone, storeBandwidthId,
  storeInfobipSenderId, storeTwilioPhone,
}: Props) {
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [testModalOpen, setTestModalOpen] = useState(false);

  // Save products to circular
  const handleSaveProducts = useCallback(async () => {
    if (!circularId) return;
    setSaving(true); setError(''); setSaved(false);
    try {
      await circularService.saveProducts(circularId, products, headline, recipes);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error saving products');
    } finally { setSaving(false); }
  }, [circularId, products, headline, recipes]);

  // Generate MMS barcodes for all customers
  const handleGenerate = useCallback(async () => {
    if (!circularId || !storeSlug || !campaignCode) {
      setError('Please fill in the Campaign Code above');
      return;
    }
    setGenerating(true); setError('');
    try {
      // Save first, then generate
      await circularService.saveProducts(circularId, products, headline, recipes);
      const result = await circularService.generateMms(circularId, storeSlug, campaignCode);
      onGenerated({ generated: result.generated || 0, skipped: result.skipped || 0 });
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error generating MMS');
    } finally { setGenerating(false); }
  }, [circularId, storeSlug, campaignCode, products, headline, recipes, onGenerated]);

  return (
    <Box>
      {/* Secondary actions */}
      <Stack direction="row" spacing={1} mb={1} flexWrap="wrap">
        <Button variant="outlined" size="small" onClick={handleSaveProducts}
          disabled={!circularId || saving}
          startIcon={saving ? <CircularProgress size={14} /> : <SaveIcon />}>
          {saving ? 'Saving...' : saved ? '✅ Saved' : 'Save Products'}
        </Button>

        <Button variant="outlined" size="small" color="secondary"
          onClick={() => setTestModalOpen(true)}
          startIcon={<BugReportRoundedIcon />}
          disabled={products.length === 0}
          sx={{
            borderColor: 'rgba(244,55,137,0.4)', color: '#f43789',
            '&:hover': { borderColor: '#f43789', bgcolor: 'rgba(244,55,137,0.04)' },
          }}>
          🧪 Send Test SMS
        </Button>
      </Stack>

      {/* Primary action — full width */}
      <Button variant="contained" onClick={handleGenerate} fullWidth
        disabled={!circularId || !campaignCode || generating}
        startIcon={generating ? <CircularProgress size={18} color="inherit" /> : <SendIcon />}
        sx={{
          background: 'linear-gradient(135deg, #DC1F26 0%, #ff6b6b 100%)',
          '&:hover': { background: 'linear-gradient(135deg, #b01820 0%, #e55 100%)' },
          fontWeight: 'bold', py: 1.2,
        }}>
        {generating ? 'Generating...' : '🚀 Generate MMS for All Customers'}
      </Button>

      {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}

      {generating && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Generating unique barcodes for each customer...
          </Typography>
          <Box sx={{
            height: 4, borderRadius: 2,
            background: 'linear-gradient(90deg, #DC1F26, #FFD700, #DC1F26)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 1.5s infinite',
            '@keyframes shimmer': { '0%': { backgroundPosition: '200% 0' }, '100%': { backgroundPosition: '-200% 0' } },
          }} />
        </Box>
      )}

      <TestMmsShoppingListModal
        open={testModalOpen}
        onClose={() => setTestModalOpen(false)}
        storeId={storeId}
        storeSlug={storeSlug}
        storeName={storeName}
        products={products}
        headline={headline}
        circularId={circularId}
        circularFileUrl={circularFileUrl}
        storeProvider={storeProvider}
        storeBandwidthPhone={storeBandwidthPhone}
        storeBandwidthId={storeBandwidthId}
        storeInfobipSenderId={storeInfobipSenderId}
        storeTwilioPhone={storeTwilioPhone}
      />
    </Box>
  );
}
