'use client';

import { welcomeCouponClient } from '@/services/sweepstakes.service';
import { uploadCampaignImage } from '@/services/upload.service';
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  Grid,
  Stack,
  Switch,
  TextField,
  Typography,
  useTheme,
  alpha,
  Alert,
  Snackbar,
  IconButton,
  Tooltip,
  Fade,
  Grow,
  Paper,
  Chip,
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import AvatarUploadLogo from '@/components/application-ui/upload/avatar/avatar-upload-logo';
import { LineChart } from '@mui/x-charts/LineChart';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import SmartphoneIcon from '@mui/icons-material/Smartphone';
import SendIcon from '@mui/icons-material/Send';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import ReplayIcon from '@mui/icons-material/Replay';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import CountUp from 'react-countup';

interface WelcomeCouponsPanelProps {
  storeId: string;
}

// ─── Compact Tokens ────────────────────────────────────────────────────────
const SP_PINK = '#d7006e';
const SP_VIBRANT = '#ff4b9b';
const SP_GRADIENT = `linear-gradient(135deg, ${SP_PINK} 0%, ${SP_VIBRANT} 100%)`;

const compactCardSx = (theme: any) => ({
  borderRadius: 3,
  border: `1px solid ${theme.palette.divider}`,
  background: theme.palette.mode === 'dark' ? alpha(theme.palette.neutral[900], 0.5) : '#fff',
  transition: 'all 0.2s ease-in-out',
  boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
  '&:hover': {
    borderColor: alpha(SP_PINK, 0.3),
    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
  },
});

// ────────────────────────────────────────────────────────────────────────────

const WelcomeCouponsPanel = ({ storeId }: WelcomeCouponsPanelProps) => {
  const theme = useTheme();
  const queryClient = useQueryClient();

  const [message, setMessage] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [active, setActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [toast, setToast] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const { data: configData, isLoading: isLoadingConfig } = useQuery({
    queryKey: ['welcome-coupon-config', storeId],
    queryFn: () => welcomeCouponClient.getConfig(storeId),
    retry: 2,
  });

  const { data: metricsData } = useQuery({
    queryKey: ['welcome-coupon-metrics', storeId],
    queryFn: () => welcomeCouponClient.getMetrics(storeId),
    retry: 2,
  });

  useEffect(() => {
    if (configData?.config) {
      setMessage(configData.config.welcomeMessage || '');
      setImageUrl(configData.config.welcomeImageUrl || '');
      setActive(configData.config.active || false);
    }
  }, [configData]);

  const upsertMutation = useMutation({
    mutationFn: async () => {
      let finalImageUrl = imageUrl;
      if (selectedFile) {
        const uploaded = await uploadCampaignImage(selectedFile);
        finalImageUrl = uploaded.url;
      }
      return welcomeCouponClient.upsertConfig({
        storeId,
        active,
        welcomeMessage: message,
        welcomeImageUrl: finalImageUrl,
      });
    },
    onSuccess: () => {
      setToast({ open: true, message: 'Settings saved.', severity: 'success' });
      queryClient.invalidateQueries({ queryKey: ['welcome-coupon-config', storeId] });
      setSelectedFile(null);
    },
    onError: () => {
      setToast({ open: true, message: 'Request failed.', severity: 'error' });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: () => welcomeCouponClient.toggleActive(storeId),
    onSuccess: (data) => {
      setActive(data.active);
      setToast({ open: true, message: data.active ? 'Activated' : 'Paused', severity: 'success' });
      queryClient.invalidateQueries({ queryKey: ['welcome-coupon-config', storeId] });
    },
  });

  if (isLoadingConfig && !configData) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="40vh">
        <CircularProgress size={32} thickness={5} sx={{ color: SP_PINK }} />
      </Box>
    );
  }

  const metrics = metricsData?.metrics;

  return (
    <Box p={{ xs: 2, md: 3 }}>
      <Fade in timeout={400}>
        <Box>
          {/* 🏹 Compact Header */}
          <Paper elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, p: 2, mb: 3, borderRadius: 2.5, bgcolor: '#fff' }}>
             <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Box>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Typography variant="h6" fontWeight={800} sx={{ background: SP_GRADIENT, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                      Welcome Coupons
                    </Typography>
                    {active && <Chip label="LIVE" size="small" variant="outlined" color="success" sx={{ height: 18, fontSize: 10, fontWeight: 900 }} />}
                  </Stack>
                  <Typography variant="caption" color="text.secondary">Entrega beneficios automáticos por suscripción.</Typography>
                </Box>
                <Stack direction="row" alignItems="center" spacing={1}>
                   <Typography variant="caption" fontWeight={700} color={active ? 'success.main' : 'text.secondary'}>{active ? 'ON' : 'OFF'}</Typography>
                   <Switch size="small" checked={active} onChange={() => toggleMutation.mutate()} disabled={toggleMutation.isPending} />
                </Stack>
             </Stack>
          </Paper>

          <Grid container spacing={2.5}>
            {/* 📊 Compact Metrics */}
            <Grid item xs={12}>
               <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                  <CompactMetric 
                     title="Sent MMS" 
                     value={metrics?.totalWelcomeSent || 0} 
                     icon={<SendIcon sx={{ fontSize: 18 }} />} 
                     color={SP_PINK} 
                  />
                  <CompactMetric 
                     title="New Leads" 
                     value={metrics?.totalNewCustomers || 0} 
                     icon={<PersonAddIcon sx={{ fontSize: 18 }} />} 
                     color="#10b981" 
                  />
                  <CompactMetric 
                     title="Recurring" 
                     value={metrics?.totalExisting || 0} 
                     icon={<ReplayIcon sx={{ fontSize: 18 }} />} 
                     color="#3b82f6" 
                  />
               </Stack>
            </Grid>

            {/* 🛠️ Editor Suite (Compact) */}
            <Grid item xs={12} lg={8}>
               <Card elevation={0} sx={compactCardSx(theme)}>
                  <CardContent sx={{ p: '20px !important' }}>
                     <Stack direction="row" alignItems="center" spacing={1} mb={2.5}>
                        <AutoAwesomeIcon sx={{ color: SP_PINK, fontSize: 20 }} />
                        <Typography variant="subtitle1" fontWeight={800}>Editor</Typography>
                     </Stack>

                     <Stack spacing={3}>
                        <Box>
                           <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: 'uppercase', mb: 0.5, display: 'block' }}>Mensaje</Typography>
                           <TextField
                              fullWidth
                              multiline
                              rows={3}
                              value={message}
                              onChange={(e) => setMessage(e.target.value)}
                              placeholder="Hola #storeName! 🎉..."
                              size="small"
                              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: alpha(theme.palette.neutral[50], 0.5) } }}
                           />
                           <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', mt: 0.5, gap: 0.5 }}>
                              <InfoOutlinedIcon sx={{ fontSize: 12 }} /> 
                              Tip: Usa <b>{'{couponCode}'}</b>
                           </Typography>
                        </Box>

                        <Box>
                           <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: 'uppercase', mb: 1, display: 'block' }}>Imagen Multimedia</Typography>
                           <Box sx={{ border: `1px dashed ${theme.palette.divider}`, borderRadius: 2, p: 1, bgcolor: alpha(theme.palette.neutral[50], 0.3) }}>
                             <AvatarUploadLogo
                                label="Upload file"
                                initialUrl={imageUrl}
                                onSelect={(file) => setSelectedFile(file)}
                             />
                           </Box>
                        </Box>

                        <Button
                           variant="contained"
                           onClick={() => upsertMutation.mutate()}
                           disabled={upsertMutation.isPending}
                           sx={{ 
                              textTransform: 'none', 
                              borderRadius: 1.5, 
                              fontWeight: 700, 
                              background: SP_GRADIENT,
                              py: 1.2
                           }}
                        >
                           {upsertMutation.isPending ? <CircularProgress size={20} color="inherit" /> : 'Save Strategy'}
                        </Button>
                     </Stack>
                  </CardContent>
               </Card>
            </Grid>

            {/* 📊 Trend (Compact) */}
            <Grid item xs={12} lg={4}>
               <Card elevation={0} sx={{ ...compactCardSx(theme), height: '100%' }}>
                  <CardContent sx={{ p: '20px !important' }}>
                     <Typography variant="subtitle1" fontWeight={800} mb={2}>Performance</Typography>
                     <Box height={180}>
                        {metrics?.dailyTrend && metrics.dailyTrend.length > 0 ? (
                          <LineChart
                            xAxis={[{ scaleType: 'point', data: metrics.dailyTrend.map(d => d.date.split('-')[2]) }]}
                            series={[{ data: metrics.dailyTrend.map(d => d.count), area: true, color: SP_PINK }]}
                            height={160}
                            margin={{ left: 20, right: 10, top: 10, bottom: 20 }}
                          />
                        ) : <Box display="flex" height="100%" alignItems="center" justifyContent="center"><Typography variant="caption">No data</Typography></Box>}
                     </Box>
                  </CardContent>
               </Card>
            </Grid>

            {/* 📱 Mobile Preview (More Compact) */}
            <Grid item xs={12} md={5}>
               <Card elevation={0} sx={compactCardSx(theme)}>
                  <CardContent sx={{ p: '20px !important', display: 'flex', justifyContent: 'center' }}>
                     <MiniPhone message={message} imageUrl={selectedFile ? URL.createObjectURL(selectedFile) : imageUrl} />
                  </CardContent>
               </Card>
            </Grid>

            {/* 💡 Tips Row */}
            <Grid item xs={12} md={7}>
               <Stack spacing={2}>
                  <Alert severity="info" variant="outlined" sx={{ borderRadius: 2, border: `1px solid ${alpha(theme.palette.info.main, 0.2)}` }}>
                     <Typography variant="caption" fontWeight={700}>Efectividad MMS:</Typography>
                     <Typography variant="caption" display="block">Las campañas con imagen tienen un 300% más de CTR que solo texto.</Typography>
                  </Alert>
                  <Alert severity="success" variant="outlined" sx={{ borderRadius: 2, border: `1px solid ${alpha(theme.palette.success.main, 0.2)}` }}>
                     <Typography variant="caption" fontWeight={700}>Adquisición:</Typography>
                     <Typography variant="caption" display="block">Automatizar el cupón te ahorra 2 horas semanales de gestión manual.</Typography>
                  </Alert>
               </Stack>
            </Grid>
          </Grid>
        </Box>
      </Fade>

      <Snackbar open={toast.open} autoHideDuration={3000} onClose={() => setToast({ ...toast, open: false })}>
         <Alert severity={toast.severity} sx={{ borderRadius: 2, fontWeight: 700 }}>{toast.message}</Alert>
      </Snackbar>
    </Box>
  );
};

const CompactMetric = ({ title, value, icon, color }: any) => (
  <Paper elevation={0} sx={{ flex: 1, p: 2, border: `1px solid ${alpha(color, 0.2)}`, borderRadius: 2, bgcolor: alpha(color, 0.02) }}>
     <Stack direction="row" spacing={1.5} alignItems="center">
        <Box sx={{ p: 1, borderRadius: 1.5, bgcolor: alpha(color, 0.1), color: color, display: 'flex' }}>{icon}</Box>
        <Box>
           <Typography variant="caption" fontWeight={800} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>{title}</Typography>
           <Typography variant="h5" fontWeight={900} sx={{ lineHeight: 1 }}><CountUp end={value} /></Typography>
        </Box>
     </Stack>
  </Paper>
);

const MiniPhone = ({ message, imageUrl }: any) => (
  <Box sx={{ width: 200, height: 380, bgcolor: '#121212', borderRadius: '32px', border: '5px solid #2d2d30', position: 'relative', overflow: 'hidden' }}>
     <Box sx={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: 70, height: 18, bgcolor: '#2d2d30', borderBottomLeftRadius: 10, borderBottomRightRadius: 10, zIndex: 1 }} />
     <Box sx={{ height: '100%', bgcolor: '#fff', mt: 3, pt: 2, px: 1, overflowY: 'auto' }}>
        <Box sx={{ alignSelf: 'flex-start', maxWidth: '100%', p: 0.5, bgcolor: '#f0f0f0', borderRadius: '12px 12px 12px 3px' }}>
           {imageUrl && <Box component="img" src={imageUrl} sx={{ width: '100%', borderRadius: '10px', display: 'block' }} />}
           <Typography sx={{ fontSize: '0.7rem', p: 1, color: '#000', wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>{message || 'Preview...'}</Typography>
        </Box>
     </Box>
  </Box>
);

export default WelcomeCouponsPanel;
