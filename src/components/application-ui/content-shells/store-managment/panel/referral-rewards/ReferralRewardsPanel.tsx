'use client';

import { referralRewardClient, type ReferralRewardConfig } from '@/services/sweepstakes.service';
import { uploadCampaignImage } from '@/services/upload.service';
import AvatarUploadLogo from '@/components/application-ui/upload/avatar/avatar-upload-logo';
import CardGiftcardRounded from '@mui/icons-material/CardGiftcardRounded';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  FormControlLabel,
  Grid,
  Paper,
  Snackbar,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
  useTheme,
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

interface Props {
  storeId: string;
}

const EMPTY: ReferralRewardConfig = {
  active: false,
  title: '$10 OFF',
  amount: 10,
  minPurchase: 100,
  imageUrl: '',
  bannerUrl: '',
  message: '',
  terms: '',
  referredBonusCoupon: true,
};

const fieldSx = { '& .MuiOutlinedInput-root': { borderRadius: 2 } };
const Label = ({ children }: { children: React.ReactNode }) => (
  <Typography
    variant="caption"
    fontWeight={700}
    color="text.secondary"
    sx={{ textTransform: 'uppercase', mb: 0.5, display: 'block' }}
  >
    {children}
  </Typography>
);

/**
 * Recompensa por referidos, por tienda. El que comparte gana UN cupón la
 * primera vez que alguien se registra con su código; le llega por MMS.
 */
const ReferralRewardsPanel = ({ storeId }: Props) => {
  const theme = useTheme();
  const qc = useQueryClient();

  const [form, setForm] = useState<ReferralRewardConfig>(EMPTY);
  const [file, setFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [toast, setToast] = useState<{ msg: string; sev: 'success' | 'error' } | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['referral-reward-config', storeId],
    queryFn: () => referralRewardClient.getConfig(storeId),
  });
  const { data: rewards } = useQuery({
    queryKey: ['referral-reward-list', storeId],
    queryFn: () => referralRewardClient.listRewards(storeId),
  });

  useEffect(() => {
    if (data?.config) setForm({ ...EMPTY, ...data.config });
  }, [data]);

  const set = <K extends keyof ReferralRewardConfig>(k: K, v: ReferralRewardConfig[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const save = useMutation({
    mutationFn: async () => {
      let imageUrl = form.imageUrl || '';
      if (file) imageUrl = (await uploadCampaignImage(file)).url;
      let bannerUrl = form.bannerUrl || '';
      if (bannerFile) bannerUrl = (await uploadCampaignImage(bannerFile)).url;
      return referralRewardClient.upsertConfig({ ...form, imageUrl, bannerUrl, storeId });
    },
    onSuccess: () => {
      setToast({ msg: 'Recompensa guardada.', sev: 'success' });
      setFile(null);
      setBannerFile(null);
      qc.invalidateQueries({ queryKey: ['referral-reward-config', storeId] });
    },
    onError: () => setToast({ msg: 'No se pudo guardar.', sev: 'error' }),
  });

  const toggle = useMutation({
    mutationFn: () => referralRewardClient.toggleActive(storeId),
    onSuccess: (r) => {
      set('active', r.active);
      setToast({ msg: r.active ? 'Recompensa activada' : 'Recompensa pausada', sev: 'success' });
      qc.invalidateQueries({ queryKey: ['referral-reward-config', storeId] });
    },
  });

  if (isLoading && !data) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="40vh">
        <CircularProgress size={32} thickness={5} />
      </Box>
    );
  }

  const metrics = data?.metrics;

  return (
    <Box p={{ xs: 2, md: 3 }}>
      <Paper
        elevation={0}
        sx={{ border: `1px solid ${theme.palette.divider}`, p: 2, mb: 3, borderRadius: 2.5 }}
      >
        <Stack direction="row" justifyContent="space-between" alignItems="center" gap={2}>
          <Box>
            <Stack direction="row" alignItems="center" spacing={1}>
              <CardGiftcardRounded color="primary" />
              <Typography variant="h6" fontWeight={800}>
                Recompensa por referidos
              </Typography>
              {form.active && (
                <Chip label="LIVE" size="small" variant="outlined" color="success" sx={{ height: 18, fontSize: 10, fontWeight: 900 }} />
              )}
            </Stack>
            <Typography variant="caption" color="text.secondary">
              El que comparte su link gana UN cupón la primera vez que alguien se registra con su código. Aunque traiga 3
              personas, el cupón es uno solo. Le llega por MMS con la imagen.
            </Typography>
          </Box>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Typography variant="caption" fontWeight={700} color={form.active ? 'success.main' : 'text.secondary'}>
              {form.active ? 'ON' : 'OFF'}
            </Typography>
            <Switch size="small" checked={form.active} onChange={() => toggle.mutate()} disabled={toggle.isPending} />
          </Stack>
        </Stack>
      </Paper>

      <Grid container spacing={2.5}>
        <Grid item xs={12} lg={8}>
          <Card elevation={0} sx={{ borderRadius: 3, border: `1px solid ${theme.palette.divider}` }}>
            <CardContent sx={{ p: '24px !important' }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Label>Nombre del cupón</Label>
                  <TextField fullWidth size="small" sx={fieldSx} value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="$10 OFF" />
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Label>Descuento ($)</Label>
                  <TextField
                    fullWidth
                    size="small"
                    type="number"
                    inputProps={{ min: 0 }}
                    sx={fieldSx}
                    value={form.amount}
                    onChange={(e) => set('amount', Math.max(0, Number(e.target.value) || 0))}
                  />
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Label>Compra mínima ($)</Label>
                  <TextField
                    fullWidth
                    size="small"
                    type="number"
                    inputProps={{ min: 0 }}
                    sx={fieldSx}
                    value={form.minPurchase}
                    onChange={(e) => set('minPurchase', Math.max(0, Number(e.target.value) || 0))}
                    helperText="0 = sin mínimo"
                  />
                </Grid>

                <Grid item xs={12}>
                  <Label>Mensaje del MMS al ganar</Label>
                  <TextField
                    fullWidth
                    multiline
                    minRows={3}
                    size="small"
                    sx={fieldSx}
                    value={form.message || ''}
                    onChange={(e) => set('message', e.target.value)}
                    placeholder="¡{name}, lo lograste! Tu primer referido ya se registró en {store} y ganaste {title}. Muestra este código en caja: {code}. Válido en compras de ${minPurchase} o más."
                    helperText="Vacío = mensaje por defecto. Admite {name} {store} {title} {code} {amount} {minPurchase} {terms}."
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Label>Letra chica</Label>
                  <TextField
                    fullWidth
                    multiline
                    minRows={2}
                    size="small"
                    sx={fieldSx}
                    value={form.terms || ''}
                    onChange={(e) => set('terms', e.target.value)}
                    placeholder="Un solo uso. No acumulable con otras promociones."
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Label>Referido</Label>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={form.referredBonusCoupon !== false}
                        onChange={(e) => set('referredBonusCoupon', e.target.checked)}
                      />
                    }
                    label="El referido también entra con una participación extra"
                  />
                </Grid>

                <Grid item xs={12}>
                  <Label>Imagen del cupón (va en el MMS)</Label>
                  <Box sx={{ border: `1px dashed ${theme.palette.divider}`, borderRadius: 2, p: 1 }}>
                    <AvatarUploadLogo label="Subir imagen" initialUrl={form.imageUrl || ''} onSelect={(f) => setFile(f)} />
                  </Box>
                </Grid>

                <Grid item xs={12}>
                  <Label>Banner de las páginas (registro, gracias y mis referidos)</Label>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                    Horizontal, tipo "Share the Savings". Si no hay, las páginas salen sin banner.
                  </Typography>
                  <Box sx={{ border: `1px dashed ${theme.palette.divider}`, borderRadius: 2, p: 1 }}>
                    <AvatarUploadLogo label="Subir banner" initialUrl={form.bannerUrl || ''} onSelect={(f) => setBannerFile(f)} />
                  </Box>
                </Grid>

                <Grid item xs={12}>
                  <Button
                    variant="contained"
                    fullWidth
                    onClick={() => save.mutate()}
                    disabled={save.isPending}
                    sx={{ textTransform: 'none', borderRadius: 1.5, fontWeight: 700, py: 1.5 }}
                  >
                    {save.isPending ? <CircularProgress size={20} color="inherit" /> : 'Guardar recompensa'}
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} lg={4}>
          <Stack spacing={2}>
            <Card elevation={0} sx={{ borderRadius: 3, border: `1px solid ${theme.palette.divider}` }}>
              <CardContent>
                <Typography variant="subtitle2" fontWeight={800} mb={1}>
                  Cupones
                </Typography>
                <Stack direction="row" spacing={3}>
                  <Box>
                    <Typography variant="h5" fontWeight={900}>
                      {metrics?.awarded ?? 0}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Ganados
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="h5" fontWeight={900}>
                      {metrics?.redeemed ?? 0}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Canjeados
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>

            <Card elevation={0} sx={{ borderRadius: 3, border: `1px solid ${theme.palette.divider}` }}>
              <CardContent sx={{ p: '12px !important' }}>
                <Typography variant="subtitle2" fontWeight={800} sx={{ px: 1, pt: 0.5 }}>
                  Últimos ganadores
                </Typography>
                {!rewards?.data?.length ? (
                  <Typography variant="caption" color="text.secondary" sx={{ px: 1, display: 'block', py: 1 }}>
                    Todavía nadie ganó el cupón en esta tienda.
                  </Typography>
                ) : (
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Código</TableCell>
                        <TableCell>Referido</TableCell>
                        <TableCell>Estado</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {rewards.data.slice(0, 15).map((r) => (
                        <TableRow key={r._id}>
                          <TableCell sx={{ fontFamily: 'monospace', fontWeight: 700 }}>{r.code}</TableCell>
                          <TableCell>{r.referredPhone || '—'}</TableCell>
                          <TableCell>
                            <Chip
                              size="small"
                              label={r.status === 'redeemed' ? 'Canjeado' : r.status === 'cancelled' ? 'Cancelado' : 'Pendiente'}
                              color={r.status === 'redeemed' ? 'success' : 'default'}
                              sx={{ height: 20, fontSize: 11 }}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </Stack>
        </Grid>
      </Grid>

      <Snackbar open={!!toast} autoHideDuration={3500} onClose={() => setToast(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity={toast?.sev || 'success'} onClose={() => setToast(null)}>
          {toast?.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ReferralRewardsPanel;
