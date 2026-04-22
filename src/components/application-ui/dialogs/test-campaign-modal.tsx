import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  CircularProgress,
  Stack,
  Box,
  Divider,
} from '@mui/material';
import SendRoundedIcon from '@mui/icons-material/SendRounded';
import BugReportRoundedIcon from '@mui/icons-material/BugReportRounded';
import PhoneIphoneRoundedIcon from '@mui/icons-material/PhoneIphoneRounded';
import { campaignClient } from '@/services/campaing.service';
import PreviewPhone from '@/components/application-ui/dialogs/preview/preview-phone';

interface TestCampaignModalProps {
  open: boolean;
  onClose: () => void;
  campaignId: string | null;
  campaignContent: string;
  campaignImage?: string;
  storeName?: string;
}

export default function TestCampaignModal({ open, onClose, campaignId, campaignContent, campaignImage, storeName }: TestCampaignModalProps) {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);
  const [errorStr, setErrorStr] = useState('');

  const TEST_BW_PHONE = process.env.NEXT_PUBLIC_TEST_BW_PHONE || '18332197926';

  const handleSend = async () => {
    if (!phone) return;
    setLoading(true);
    setErrorStr('');
    try {
      await campaignClient.sendTestMessage({
        phone: phone.replace(/\D/g, ''),
        message: campaignContent,
        image: campaignImage,
        provider: 'bandwidth',
        phoneNumber: TEST_BW_PHONE,
      });
      setSentSuccess(true);
    } catch (err: any) {
      setErrorStr(err.response?.data?.error || err.message || 'Error occurred');
    } finally {
      setLoading(false);
    }
  };

  const resetState = () => {
    setPhone('');
    setSentSuccess(false);
    setErrorStr('');
    onClose();
  };

  return (
    <Dialog open={open} onClose={resetState} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Stack direction="row" alignItems="center" spacing={1}>
          <BugReportRoundedIcon color="warning" />
          <Typography variant="h6" fontWeight={700}>Test Campaign Internal</Typography>
        </Stack>
      </DialogTitle>
      
      <DialogContent dividers>
        {!sentSuccess ? (
          <Box display="flex" flexDirection="column" gap={3}>
            <Typography variant="body2" color="text.secondary">
              This will send a simulated text message to a specific number using the Bandwidth API. 
              The SMS text and attached images will be exactly what was configured in this Campaign.
            </Typography>

            <Box>
              <Typography variant="caption" fontWeight={700} color="text.secondary">CAMPAIGN ID</Typography>
              <Typography variant="body2" fontWeight={700}>{campaignId}</Typography>
            </Box>
            
            <Box>
              <Typography variant="caption" fontWeight={700} color="text.secondary">STORE</Typography>
              <Typography variant="body2">{storeName || 'N/A'}</Typography>
            </Box>

            <TextField
              label="Test Phone Number"
              variant="outlined"
              fullWidth
              autoFocus
              placeholder="1234567890"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              helperText="Enter a valid phone number including country code."
            />

            {errorStr && <Typography color="error" variant="caption">{errorStr}</Typography>}
          </Box>
        ) : (
          <Box display="flex" flexDirection="column" alignItems="center" gap={2}>
            <Typography variant="h6" color="success.main" fontWeight={700}>
              ✅ Request Sent Successfully!
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Here is what was dispatched to the worker:
            </Typography>
            
            <Divider sx={{ w: '100%' }} />

            <Box display="flex" justifyContent="center" width="100%" maxWidth={280}>
              <PreviewPhone content={campaignContent} image={campaignImage} fontSize={10} />
            </Box>
            
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        {!sentSuccess ? (
          <>
            <Button onClick={resetState} color="inherit">Cancel</Button>
            <Button
              onClick={handleSend}
              variant="contained"
              disabled={!phone || loading}
              startIcon={loading ? <CircularProgress size={16} /> : <SendRoundedIcon />}
            >
              Confirm & Send Test
            </Button>
          </>
        ) : (
          <Button onClick={resetState} variant="contained">
            Close Preview
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
