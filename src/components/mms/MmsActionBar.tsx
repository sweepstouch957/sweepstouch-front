'use client';

import React, { useState, useCallback } from 'react';
import {
  Box,
  Button,
  CircularProgress,
  Stack,
  Typography,
  Alert,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import SaveIcon from '@mui/icons-material/Save';
import BugReportRoundedIcon from '@mui/icons-material/BugReportRounded';
import axios from 'axios';
import { campaignClient } from '@/services/campaing.service';
import TestCampaignModal from '@/components/application-ui/dialogs/test-campaign-modal';

interface Product {
  name: string;
  price: string;
  unit?: string;
  category?: string;
  emoji?: string;
  isHero?: boolean;
  savings?: string;
}

interface Props {
  circularId: string;
  storeSlug: string;
  campaignCode: string;
  products: Product[];
  headline: string;
  onGenerated: (result: { generated: number; skipped: number }) => void;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

export default function MmsActionBar({
  circularId,
  storeSlug,
  campaignCode,
  products,
  headline,
  onGenerated,
}: Props) {
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  const [testModalOpen, setTestModalOpen] = useState(false);
  const [testCampaign, setTestCampaign] = useState<any>(null);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('uifort-authentication');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  // Save products to circular
  const handleSaveProducts = useCallback(async () => {
    if (!circularId) return;
    setSaving(true);
    setError('');
    setSaved(false);

    try {
      await axios.put(
        `${API_URL}/circulars/${circularId}/products`,
        { products, headline },
        { headers: getAuthHeaders() }
      );
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error saving products');
    } finally {
      setSaving(false);
    }
  }, [circularId, products, headline]);

  // Generate MMS barcodes for all customers
  const handleGenerate = useCallback(async () => {
    if (!circularId || !storeSlug || !campaignCode) {
      setError('Please fill in the Campaign Code above');
      return;
    }
    setGenerating(true);
    setError('');

    try {
      // First save products
      await axios.put(
        `${API_URL}/circulars/${circularId}/products`,
        { products, headline },
        { headers: getAuthHeaders() }
      );

      // Then generate barcodes
      const res = await axios.post(
        `${API_URL}/mms-generator/generate`,
        { circularId, storeSlug, campaignCode },
        { headers: getAuthHeaders() }
      );

      onGenerated({
        generated: res.data.generated || 0,
        skipped: res.data.skipped || 0,
      });
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error generating MMS');
    } finally {
      setGenerating(false);
    }
  }, [circularId, storeSlug, campaignCode, products, headline, onGenerated]);

  const handleOpenTestModal = async () => {
    try {
      const res = await campaignClient.getFilteredCampaigns({ limit: 1 });
      if (res?.data && res.data.length > 0) {
        setTestCampaign(res.data[0]);
      }
    } catch (e) {
      console.warn('Could not fetch last campaign', e);
    }
    setTestModalOpen(true);
  };

  return (
    <Box>
      <Stack direction="row" spacing={2}>
        <Button
          variant="outlined"
          onClick={handleSaveProducts}
          disabled={!circularId || saving}
          startIcon={saving ? <CircularProgress size={18} /> : <SaveIcon />}
        >
          {saving ? 'Saving...' : saved ? '✅ Saved!' : 'Save Products'}
        </Button>

        <Button
          variant="contained"
          onClick={handleGenerate}
          disabled={!circularId || !campaignCode || generating}
          startIcon={generating ? <CircularProgress size={18} color="inherit" /> : <SendIcon />}
          sx={{
            background: 'linear-gradient(135deg, #DC1F26 0%, #ff6b6b 100%)',
            '&:hover': { background: 'linear-gradient(135deg, #b01820 0%, #e55 100%)' },
            fontWeight: 'bold',
          }}
        >
          {generating ? 'Generating...' : '🚀 Generate MMS for All Customers'}
        </Button>

        <Button
          variant="outlined"
          color="warning"
          onClick={handleOpenTestModal}
          startIcon={<BugReportRoundedIcon />}
        >
          Test MMS
        </Button>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}

      {generating && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Generating unique barcodes for each customer...
          </Typography>
          <Box
            sx={{
              height: 4,
              borderRadius: 2,
              background: 'linear-gradient(90deg, #DC1F26, #FFD700, #DC1F26)',
              backgroundSize: '200% 100%',
              animation: 'shimmer 1.5s infinite',
              '@keyframes shimmer': {
                '0%': { backgroundPosition: '200% 0' },
                '100%': { backgroundPosition: '-200% 0' },
              },
            }}
          />
        </Box>
      )}

      <TestCampaignModal
        open={testModalOpen}
        onClose={() => setTestModalOpen(false)}
        campaignId={testCampaign?._id || null}
        campaignContent={testCampaign?.content || ''}
        campaignImage={testCampaign?.image}
        storeName={testCampaign?.store?.name}
      />
    </Box>
  );
}
