'use client';

import { referralRewardClient, type ReferralRewardConfig } from '@/services/sweepstakes.service';
import { uploadCampaignImage } from '@/services/upload.service';
import AvatarUploadLogo from '@/components/application-ui/upload/avatar/avatar-upload-logo';
import CardGiftcardRounded from '@mui/icons-material/CardGiftcardRounded';
import GroupsRounded from '@mui/icons-material/GroupsRounded';
import PersonAddAlt1Rounded from '@mui/icons-material/PersonAddAlt1Rounded';
import LocalOfferRounded from '@mui/icons-material/LocalOfferRounded';
import CheckCircleRounded from '@mui/icons-material/CheckCircleRounded';
import { alpha } from '@mui/material/styles';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  FormControlLabel,
  Grid,
  Paper,
  Skeleton,
  Snackbar,
  Stack,
  Switch,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Tooltip,
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
  bannerDesktopUrl: '',
  bannerMobileUrl: '',
  message: '',
  shareMessage: '',
  terms: '',
  referredBonusCoupon: true,
  invitesRequired: 5,
  validDays: 30,
  allowRepeatPhones: true,
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
  const [bannerDesktopFile, setBannerDesktopFile] = useState<File | null>(null);
  const [bannerMobileFile, setBannerMobileFile] = useState<File | null>(null);
  const [toast, setToast] = useState<{ msg: string; sev: 'success' | 'error' } | null>(null);
  const [tab, setTab] = useState(0);

  const { data, isLoading } = useQuery({
    queryKey: ['referral-reward-config', storeId],
    queryFn: () => referralRewardClient.getConfig(storeId),
  });
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['referral-program-stats', storeId],
    queryFn: () => referralRewardClient.programStats(storeId),
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
      let bannerDesktopUrl = form.bannerDesktopUrl || '';
      if (bannerDesktopFile) bannerDesktopUrl = (await uploadCampaignImage(bannerDesktopFile)).url;
      let bannerMobileUrl = form.bannerMobileUrl || '';
      if (bannerMobileFile) bannerMobileUrl = (await uploadCampaignImage(bannerMobileFile)).url;
      return referralRewardClient.upsertConfig({ ...form, imageUrl, bannerDesktopUrl, bannerMobileUrl, storeId });
    },
    onSuccess: () => {
      setToast({ msg: 'Recompensa guardada.', sev: 'success' });
      setFile(null);
      setBannerDesktopFile(null);
      setBannerMobileFile(null);
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
              Desde su Mi cuenta el cliente mete los teléfonos de N amigos y gana el cupón al instante (QR para la caja +
              MMS con la imagen). El bot de WhatsApp escribe a cada amigo con su link y le pregunta si compra aquí.
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

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2, '& .MuiTab-root': { textTransform: 'none', fontWeight: 700 } }}>
        <Tab label="Configuración" />
        <Tab label={`Resultados${stats?.totals.invites ? ` (${stats.totals.invites})` : ''}`} />
      </Tabs>

      {tab === 0 && (
        <Box sx={{ maxWidth: 920 }}>
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

                <Grid item xs={12}>

                  <Label>Mensaje para compartir (WhatsApp / SMS)</Label>

                  <TextField

                    fullWidth

                    multiline

                    minRows={2}

                    value={form.shareMessage || ''}

                    onChange={(e) => set('shareMessage', e.target.value)}

                    placeholder="🎁 Sign up at {store} with my code and earn {title} on your first purchase: {link}"

                    sx={fieldSx}

                    helperText="Lo que manda el cliente al compartir su link. Vacío = texto por defecto. Admite {name} {store} {title} {minPurchase} {link}."

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

                <Grid item xs={4}>
                  <Label>Amigos por cupón</Label>
                  <TextField fullWidth size="small" type="number" inputProps={{ min: 1, max: 10 }} sx={fieldSx} value={form.invitesRequired ?? 5} onChange={(e) => set('invitesRequired', Math.min(10, Math.max(1, Number(e.target.value) || 5)))} />
                </Grid>
                <Grid item xs={4}>
                  <Label>Vigencia (días)</Label>
                  <TextField fullWidth size="small" type="number" inputProps={{ min: 1 }} sx={fieldSx} value={form.validDays ?? 30} onChange={(e) => set('validDays', Math.max(1, Number(e.target.value) || 30))} />
                </Grid>
                <Grid item xs={4}>
                  <Label>Números repetidos</Label>
                  <FormControlLabel
                    control={<Switch checked={form.allowRepeatPhones !== false} onChange={(e) => set('allowRepeatPhones', e.target.checked)} />}
                    label={<Typography variant="caption">{form.allowRepeatPhones !== false ? 'Puede repetir' : 'Nuevos cada ronda'}</Typography>}
                  />
                </Grid>

                <Grid item xs={12}>
                  <Label>Imagen del cupón (va en el MMS)</Label>
                  <Box sx={{ border: `1px dashed ${theme.palette.divider}`, borderRadius: 2, p: 1 }}>
                    <AvatarUploadLogo label="Subir imagen" initialUrl={form.imageUrl || ''} onSelect={(f) => setFile(f)} />
                  </Box>
                </Grid>

                <Grid item xs={12}>
                  <Label>Banner desktop (horizontal)</Label>
                  <Typography variant="body2" color="text.secondary" sx={{ display: 'block', mb: 0.75, fontSize: 12, textTransform: 'none' }}>
                    Va arriba en registro, gracias y mis referidos (pantalla ancha). Opcional.
                  </Typography>
                  <Box sx={{ border: `1px dashed ${theme.palette.divider}`, borderRadius: 2, p: 1 }}>
                    <AvatarUploadLogo label="Subir banner desktop" initialUrl={form.bannerDesktopUrl || ''} onSelect={(f) => setBannerDesktopFile(f)} />
                  </Box>
                </Grid>
                <Grid item xs={12}>
                  <Label>Banner mobile (vertical o cuadrado)</Label>
                  <Typography variant="body2" color="text.secondary" sx={{ display: 'block', mb: 0.75, fontSize: 12, textTransform: 'none' }}>
                    Para celular. Si falta, se usa el de desktop.
                  </Typography>
                  <Box sx={{ border: `1px dashed ${theme.palette.divider}`, borderRadius: 2, p: 1 }}>
                    <AvatarUploadLogo label="Subir banner mobile" initialUrl={form.bannerMobileUrl || ''} onSelect={(f) => setBannerMobileFile(f)} />
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
        </Box>
      )}

      {tab === 1 && (
        <Stack spacing={2.5}>
          {/* KPIs. Nada de `caption`: el tema lo pone en mayúsculas. */}
          <Grid container spacing={2}>
            {[
              { k: 'Invitados', v: stats?.totals.invites, sub: 'teléfonos que metieron los clientes', icon: <GroupsRounded fontSize="small" />, color: theme.palette.primary.main },
              { k: 'Nuevos en la base', v: stats?.totals.newCustomers, sub: 'no estaban en la tienda', icon: <PersonAddAlt1Rounded fontSize="small" />, color: '#2563eb' },
              { k: 'Cupones ganados', v: stats?.totals.coupons ?? metrics?.awarded, sub: 'códigos RF emitidos', icon: <LocalOfferRounded fontSize="small" />, color: '#d97706' },
              { k: 'Canjeados en caja', v: stats?.totals.redeemed ?? metrics?.redeemed, sub: 'quemados por una cajera', icon: <CheckCircleRounded fontSize="small" />, color: '#16a34a' },
            ].map((m) => (
              <Grid item xs={6} md={3} key={m.k}>
                <Card elevation={0} sx={{ borderRadius: 3, border: `1px solid ${theme.palette.divider}`, height: '100%' }}>
                  <CardContent sx={{ p: '18px !important', display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
                    <Avatar sx={{ width: 40, height: 40, bgcolor: alpha(m.color, 0.12), color: m.color }}>{m.icon}</Avatar>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="body2" sx={{ fontSize: 12.5, fontWeight: 600, color: 'text.secondary' }}>{m.k}</Typography>
                      {statsLoading ? (
                        <Skeleton width={56} height={38} />
                      ) : (
                        <Typography sx={{ fontSize: 30, fontWeight: 900, lineHeight: 1.15, letterSpacing: '-.5px' }}>{m.v ?? 0}</Typography>
                      )}
                      <Typography variant="body2" sx={{ fontSize: 11.5, color: 'text.disabled' }}>{m.sub}</Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          <Grid container spacing={2.5} alignItems="stretch">
            <Grid item xs={12} lg={7}>
              <Card elevation={0} sx={{ borderRadius: 3, border: `1px solid ${theme.palette.divider}`, height: '100%' }}>
                <CardContent sx={{ p: '18px !important' }}>
                  <Stack direction="row" alignItems="center" justifyContent="space-between" mb={0.5}>
                    <Typography sx={{ fontSize: 15, fontWeight: 800 }}>Quién trajo más gente</Typography>
                    <Chip size="small" label={`${stats?.referrers?.length ?? 0} referidores`} sx={{ height: 22, fontSize: 11, fontWeight: 700 }} />
                  </Stack>
                  <Typography variant="body2" sx={{ fontSize: 12.5, color: 'text.secondary', mb: 1.5 }}>
                    Un cliente por fila. Las respuestas salen de lo que cada invitado contesta al bot de WhatsApp.
                  </Typography>
                  {statsLoading ? (
                    <Skeleton height={120} />
                  ) : !stats?.referrers?.length ? (
                    <Typography variant="body2" color="text.secondary">Nadie ha metido números todavía.</Typography>
                  ) : (
                    <Table size="small" sx={{ '& th': { textTransform: 'none', fontSize: 12, fontWeight: 700, color: 'text.secondary', whiteSpace: 'nowrap', py: 1 }, '& td': { fontSize: 13.5, py: 1.25, whiteSpace: 'nowrap' } }}>
                      <TableHead>
                        <TableRow>
                          <TableCell>Referidor</TableCell>
                          <TableCell align="right">Números</TableCell>
                          <TableCell align="right">Rondas</TableCell>
                          <TableCell align="right">Compran aquí</TableCell>
                          <TableCell align="right">No compran</TableCell>
                          <TableCell align="right">Nuevos</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {stats.referrers.slice(0, 25).map((r, i) => (
                          <TableRow key={r.customerId} hover>
                            <TableCell sx={{ whiteSpace: 'normal' }}>
                              <Stack direction="row" spacing={1.25} alignItems="center">
                                <Avatar sx={{ width: 32, height: 32, fontSize: 13, fontWeight: 800, bgcolor: i === 0 ? theme.palette.primary.main : alpha(theme.palette.text.primary, 0.08), color: i === 0 ? '#fff' : 'text.primary' }}>
                                  {i + 1}
                                </Avatar>
                                <Box sx={{ minWidth: 0 }}>
                                  <Typography sx={{ fontSize: 13.5, fontWeight: 700, lineHeight: 1.2, textTransform: 'capitalize' }} noWrap>{r.name || 'Sin nombre'}</Typography>
                                  <Typography variant="body2" sx={{ fontSize: 12, color: 'text.secondary' }}>{r.phone}</Typography>
                                </Box>
                              </Stack>
                            </TableCell>
                            <TableCell align="right" sx={{ fontWeight: 900, fontSize: '15px !important' }}>{r.invites}</TableCell>
                            <TableCell align="right">{r.rounds}</TableCell>
                            <TableCell align="right">
                              <Chip size="small" label={r.shopsYes} sx={{ height: 22, minWidth: 34, fontWeight: 700, bgcolor: alpha('#16a34a', 0.12), color: '#15803d' }} />
                            </TableCell>
                            <TableCell align="right">
                              <Tooltip title={r.zips ? `${r.zips} dejaron su ZIP` : 'Sin ZIP todavía'}>
                                <Chip size="small" label={r.zips ? `${r.shopsNo} · ${r.zips} zip` : r.shopsNo} sx={{ height: 22, minWidth: 34, fontWeight: 700, bgcolor: alpha(theme.palette.text.primary, 0.06) }} />
                              </Tooltip>
                            </TableCell>
                            <TableCell align="right">{r.newCustomers}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} lg={5}>
              <Card elevation={0} sx={{ borderRadius: 3, border: `1px solid ${theme.palette.divider}`, height: '100%' }}>
                <CardContent sx={{ p: '18px !important' }}>
                  <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1.5}>
                    <Typography sx={{ fontSize: 15, fontWeight: 800 }}>Cupones emitidos</Typography>
                    <Chip size="small" label={`${rewards?.data?.length ?? 0}`} sx={{ height: 22, fontSize: 11, fontWeight: 700 }} />
                  </Stack>
                  {!rewards?.data?.length ? (
                    <Typography variant="body2" color="text.secondary">Todavía nadie ganó el cupón en esta tienda.</Typography>
                  ) : (
                    <Table size="small" sx={{ '& th': { textTransform: 'none', fontSize: 12, fontWeight: 700, color: 'text.secondary', py: 1 }, '& td': { fontSize: 13, py: 1.1 } }}>
                      <TableHead>
                        <TableRow>
                          <TableCell>Código</TableCell>
                          <TableCell>Emitido → vence</TableCell>
                          <TableCell align="right">Estado</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {rewards.data.slice(0, 25).map((r: any) => {
                          const d = (x?: string) => (x ? new Date(x).toLocaleDateString('es', { day: '2-digit', month: 'short' }) : '—');
                          const expired = r.status === 'pending' && r.expiresAt && new Date(r.expiresAt) < new Date();
                          const label = r.status === 'redeemed' ? 'Canjeado' : r.status === 'cancelled' ? 'Cancelado' : expired ? 'Vencido' : 'Pendiente';
                          const bg = r.status === 'redeemed' ? alpha('#16a34a', 0.12) : expired ? alpha('#d97706', 0.14) : alpha(theme.palette.primary.main, 0.1);
                          const fg = r.status === 'redeemed' ? '#15803d' : expired ? '#b45309' : theme.palette.primary.main;
                          return (
                            <TableRow key={r._id} hover>
                              <TableCell sx={{ fontFamily: 'ui-monospace, Menlo, monospace', fontWeight: 800, letterSpacing: '.04em' }}>{r.code}</TableCell>
                              <TableCell sx={{ color: 'text.secondary', whiteSpace: 'nowrap' }}>{d(r.createdAt)} → {d(r.expiresAt)}</TableCell>
                              <TableCell align="right">
                                <Chip size="small" label={label} sx={{ height: 22, fontSize: 11, fontWeight: 700, bgcolor: bg, color: fg }} />
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Stack>
      )}

      <Snackbar open={!!toast} autoHideDuration={3500} onClose={() => setToast(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity={toast?.sev || 'success'} onClose={() => setToast(null)}>
          {toast?.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ReferralRewardsPanel;
