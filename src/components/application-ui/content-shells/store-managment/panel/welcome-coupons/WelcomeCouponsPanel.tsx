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
import SmartphoneIcon from '@mui/icons-material/Smartphone';
import {
   Send as SendIcon,
   PersonAdd as PersonAddIcon,
   Replay as ReplayIcon,
   OpenInNew as OpenInNewIcon,
   InfoOutlined as InfoOutlinedIcon,
   AutoAwesome as AutoAwesomeIcon,
   Visibility as VisibilityIcon,
} from '@mui/icons-material';
import CountUp from 'react-countup';
import { ImageViewer, useImageViewer, ViewImageIcon } from '@/components/ImageViewer';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';

interface WelcomeCouponsPanelProps {
   storeId: string;
}

const compactCardSx = (theme: any) => ({
   borderRadius: 3,
   border: `1px solid ${theme.palette.divider}`,
   background: theme.palette.mode === 'dark' ? alpha(theme.palette.background.default, 0.5) : theme.palette.background.paper,
   transition: 'all 0.2s ease-in-out',
   boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
   '&:hover': {
      borderColor: alpha(theme.palette.primary.main, 0.3),
      boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
   },
});

// ────────────────────────────────────────────────────────────────────────────

const WelcomeCouponsPanel = ({ storeId }: WelcomeCouponsPanelProps) => {
   const theme = useTheme();
   const SP_PINK = theme.palette.primary.main;
   const SP_VIBRANT = theme.palette.primary.light;
   const SP_GRADIENT = `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${SP_VIBRANT} 100%)`;
   const queryClient = useQueryClient();
   const { isOpen, currentImage, openViewer, closeViewer } = useImageViewer();

   const [message, setMessage] = useState('');
   const [imageUrl, setImageUrl] = useState('');
   const [active, setActive] = useState(false);
   const [selectedFile, setSelectedFile] = useState<File | null>(null);

   // New Fields
   const [title, setTitle] = useState('');
   const [discountPercentage, setDiscountPercentage] = useState('');
   const [validFrom, setValidFrom] = useState('');
   const [validUntil, setValidUntil] = useState('');
   const [minPurchaseAmount, setMinPurchaseAmount] = useState('');
   const [terms, setTerms] = useState('');

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
         const c = configData.config;
         setMessage(c.welcomeMessage || '');
         setImageUrl(c.welcomeImageUrl || '');
         setActive(c.active || false);
         setTitle(c.title || '');
         setDiscountPercentage(c.discountPercentage || '');
         setValidFrom(c.validFrom ? new Date(c.validFrom).toISOString().split('T')[0] : '');
         setValidUntil(c.validUntil ? new Date(c.validUntil).toISOString().split('T')[0] : '');
         setMinPurchaseAmount(c.minPurchaseAmount || '');
         setTerms(c.terms || '');
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
            title,
            discountPercentage,
            validFrom,
            validUntil,
            minPurchaseAmount,
            terms
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
   const currentImageUrl = selectedFile ? URL.createObjectURL(selectedFile) : imageUrl;

   return (
      <LocalizationProvider dateAdapter={AdapterDayjs}>
         <Box p={{ xs: 2, md: 3 }}>
            <Fade in timeout={400}>
               <Box>
                  {/* 🏹 Compact Header */}
                  <Paper elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, p: 2, mb: 3, borderRadius: 2.5, bgcolor: 'background.paper' }}>
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
                              color={theme.palette.success.main}
                           />
                           <CompactMetric
                              title="Recurring"
                              value={metrics?.totalExisting || 0}
                              icon={<ReplayIcon sx={{ fontSize: 18 }} />}
                              color={theme.palette.info.main}
                           />
                        </Stack>
                     </Grid>

                     {/* 🛠️ Editor Suite (Rich) */}
                     <Grid item xs={12} lg={8}>
                        <Card elevation={0} sx={compactCardSx(theme)}>
                           <CardContent sx={{ p: '24px !important' }}>
                              <Stack direction="row" alignItems="center" spacing={1} mb={3}>
                                 <AutoAwesomeIcon sx={{ color: SP_PINK, fontSize: 20 }} />
                                 <Typography variant="subtitle1" fontWeight={800}>Configuración del Cupón</Typography>
                              </Stack>

                              <Grid container spacing={2}>
                                 <Grid item xs={12} sm={8}>
                                    <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: 'uppercase', mb: 0.5, display: 'block' }}>Título del Cupón</Typography>
                                    <TextField
                                       fullWidth
                                       value={title}
                                       onChange={(e) => setTitle(e.target.value)}
                                       placeholder="e.g. OFFICIAL STORE DISCOUNT"
                                       size="small"
                                       sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                                    />
                                 </Grid>
                                 <Grid item xs={12} sm={4}>
                                    <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: 'uppercase', mb: 0.5, display: 'block' }}>Descuento (%)</Typography>
                                    <TextField
                                       fullWidth
                                       value={discountPercentage}
                                       onChange={(e) => setDiscountPercentage(e.target.value)}
                                       placeholder="e.g. 10%"
                                       size="small"
                                       sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                                    />
                                 </Grid>

                                 <Grid item xs={12}>
                                    <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: 'uppercase', mb: 0.5, display: 'block' }}>Mensaje SMB (Texto)</Typography>
                                    <TextField
                                       fullWidth
                                       multiline
                                       rows={2}
                                       value={message}
                                       onChange={(e) => setMessage(e.target.value)}
                                       placeholder="¡Hola! 🎉 Gracias por registrarte..."
                                       size="small"
                                       sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                                    />
                                 </Grid>

                                 <Grid item xs={12} sm={6}>
                                    <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: 'uppercase', mb: 0.5, display: 'block' }}>Válido Desde</Typography>
                                    <DatePicker
                                       value={validFrom ? dayjs(validFrom) : null}
                                       onChange={(newValue) => setValidFrom(newValue ? newValue.toISOString() : '')}
                                       slotProps={{
                                          textField: {
                                             fullWidth: true,
                                             size: 'small',
                                             sx: { '& .MuiOutlinedInput-root': { borderRadius: 2 } }
                                          }
                                       }}
                                    />
                                 </Grid>
                                 <Grid item xs={12} sm={6}>
                                    <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: 'uppercase', mb: 0.5, display: 'block' }}>Válido Hasta</Typography>
                                    <DatePicker
                                       value={validUntil ? dayjs(validUntil) : null}
                                       onChange={(newValue) => setValidUntil(newValue ? newValue.toISOString() : '')}
                                       slotProps={{
                                          textField: {
                                             fullWidth: true,
                                             size: 'small',
                                             sx: { '& .MuiOutlinedInput-root': { borderRadius: 2 } }
                                          }
                                       }}
                                    />
                                 </Grid>

                                 <Grid item xs={12} sm={6}>
                                    <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: 'uppercase', mb: 0.5, display: 'block' }}>Compra Mínima</Typography>
                                    <TextField
                                       fullWidth
                                       value={minPurchaseAmount}
                                       onChange={(e) => setMinPurchaseAmount(e.target.value)}
                                       placeholder="e.g. $80 OR MORE"
                                       size="small"
                                       sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                                    />
                                 </Grid>
                                 <Grid item xs={12} sm={6}>
                                    <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: 'uppercase', mb: 0.5, display: 'block' }}>Términos (Corta)</Typography>
                                    <TextField
                                       fullWidth
                                       value={terms}
                                       onChange={(e) => setTerms(e.target.value)}
                                       placeholder="e.g. One-time use only."
                                       size="small"
                                       sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                                    />
                                 </Grid>

                                 <Grid item xs={12}>
                                    <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: 'uppercase', mb: 1, display: 'block' }}>Imagen Multimedia</Typography>
                                    <Box sx={{ border: `1px dashed ${theme.palette.divider}`, borderRadius: 2, p: 1 }}>
                                       <AvatarUploadLogo
                                          label="Upload file"
                                          initialUrl={imageUrl}
                                          onSelect={(file) => setSelectedFile(file)}
                                       />
                                    </Box>
                                 </Grid>

                                 <Grid item xs={12}>
                                    <Button
                                       variant="contained"
                                       fullWidth
                                       onClick={() => upsertMutation.mutate()}
                                       disabled={upsertMutation.isPending}
                                       sx={{
                                          textTransform: 'none',
                                          borderRadius: 1.5,
                                          fontWeight: 700,
                                          background: SP_GRADIENT,
                                          py: 1.5,
                                          mt: 1
                                       }}
                                    >
                                       {upsertMutation.isPending ? <CircularProgress size={20} color="inherit" /> : 'Guardar Estrategia'}
                                    </Button>
                                 </Grid>
                              </Grid>
                           </CardContent>
                        </Card>
                     </Grid>

                     {/* Preview & Stats Side */}
                     <Grid item xs={12} lg={4}>
                        <Stack spacing={2.5}>
                           <Card elevation={0} sx={compactCardSx(theme)}>
                              <CardContent sx={{ p: '20px !important', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                 <Typography variant="caption" fontWeight={800} color="text.secondary" sx={{ alignSelf: 'flex-start', mb: 2 }}>PREESTRENO</Typography>
                                 <MiniPhone
                                    title={title}
                                    discount={discountPercentage}
                                    message={message}
                                    imageUrl={currentImageUrl}
                                    onViewImage={() => openViewer(currentImageUrl)}
                                 />
                                 {currentImageUrl && (
                                    <Button
                                       variant="text"
                                       size="small"
                                       onClick={() => openViewer(currentImageUrl)}
                                       startIcon={<VisibilityIcon sx={{ fontSize: 14 }} />}
                                       sx={{ mt: 1, textTransform: 'none', color: SP_PINK, fontWeight: 700 }}
                                    >
                                       Ver Imagen Full
                                    </Button>
                                 )}
                              </CardContent>
                           </Card>

                           <Card elevation={0} sx={compactCardSx(theme)}>
                              <CardContent sx={{ p: '20px !important' }}>
                                 <Typography variant="caption" fontWeight={800} color="text.secondary">TENDENCIA ADQUISICIÓN</Typography>
                                 <Box height={140} mt={1}>
                                    {metrics?.dailyTrend && metrics.dailyTrend.length > 0 ? (
                                       <LineChart
                                          xAxis={[{ scaleType: 'point', data: metrics.dailyTrend.map(d => d.date.split('-')[2]) }]}
                                          series={[{ data: metrics.dailyTrend.map(d => d.count), area: true, color: SP_PINK, showMark: false }]}
                                          height={140}
                                          margin={{ left: 20, right: 10, top: 10, bottom: 20 }}
                                       />
                                    ) : <Box display="flex" height="100%" alignItems="center" justifyContent="center"><Typography variant="caption">No data</Typography></Box>}
                                 </Box>
                              </CardContent>
                           </Card>
                        </Stack>
                     </Grid>
                  </Grid>
               </Box>
            </Fade>

            <Snackbar open={toast.open} autoHideDuration={3000} onClose={() => setToast({ ...toast, open: false })}>
               <Alert severity={toast.severity} sx={{ borderRadius: 2, fontWeight: 700 }}>{toast.message}</Alert>
            </Snackbar>

            <ImageViewer
               open={isOpen}
               imageUrl={currentImage}
               onClose={closeViewer}
            />
         </Box>
      </LocalizationProvider>
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

const MiniPhone = ({ title, discount, message, imageUrl, onViewImage }: any) => {
   const theme = useTheme();
   return (
      <Box sx={{ width: 190, height: 380, bgcolor: theme.palette.grey[900], borderRadius: '32px', border: `5px solid ${theme.palette.grey[800]}`, position: 'relative', overflow: 'hidden' }}>
         <Box sx={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: 70, height: 18, bgcolor: theme.palette.grey[800], borderBottomLeftRadius: 10, borderBottomRightRadius: 10, zIndex: 1 }} />
         <Box sx={{ height: '100%', bgcolor: theme.palette.common.white, mt: 3, pt: 2, px: 1.5, overflowY: 'auto' }}>
            <Box sx={{ alignSelf: 'flex-start', maxWidth: '100%', p: 1, bgcolor: theme.palette.grey[100], borderRadius: '12px 12px 12px 3px', border: `1px solid ${theme.palette.divider}` }}>
               {title && <Typography sx={{ fontSize: '0.6rem', fontWeight: 900, color: theme.palette.primary.main, textTransform: 'uppercase', mb: 0.5 }}>{title}</Typography>}
               {discount && <Typography sx={{ fontSize: '1rem', fontWeight: 900, color: theme.palette.text.primary, mb: 0.5 }}>{discount} OFF</Typography>}
               {imageUrl && (
                  <Box sx={{ position: 'relative', width: '100%', mb: 0.5 }}>
                     <Box
                        component="img"
                        src={imageUrl}
                        sx={{ width: '100%', borderRadius: '8px', display: 'block', cursor: 'pointer' }}
                        onClick={onViewImage}
                     />
                     <ViewImageIcon
                        onClick={(e: React.MouseEvent) => {
                           e.stopPropagation();
                           onViewImage();
                        }}
                        sx={{
                           position: 'absolute',
                           bottom: 4,
                           right: 4,
                           transform: 'scale(0.6)',
                        }}
                     />
                  </Box>
               )}
               <Typography sx={{ fontSize: '0.65rem', color: theme.palette.text.secondary, wordBreak: 'break-word', whiteSpace: 'pre-wrap', lineHeight: 1.2 }}>{message || 'Preview...'}</Typography>
            </Box>
         </Box>
      </Box>
   );
};

export default WelcomeCouponsPanel;
