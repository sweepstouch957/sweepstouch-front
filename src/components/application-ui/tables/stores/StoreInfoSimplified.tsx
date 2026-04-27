'use client';

import type { ContactInfoItem, EquipmentItem } from '@/services/store.service';
import AssignmentIndRoundedIcon from '@mui/icons-material/AssignmentIndRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import ContentCopyRoundedIcon from '@mui/icons-material/ContentCopyRounded';
import DevicesRoundedIcon from '@mui/icons-material/DevicesRounded';
import EmailRoundedIcon from '@mui/icons-material/EmailRounded';
import GroupsRoundedIcon from '@mui/icons-material/GroupsRounded';
import InfoRoundedIcon from '@mui/icons-material/InfoRounded';
import LinkRoundedIcon from '@mui/icons-material/LinkRounded';
import OpenInNewRoundedIcon from '@mui/icons-material/OpenInNewRounded';
import PeopleAltRoundedIcon from '@mui/icons-material/PeopleAltRounded';
import PhoneRoundedIcon from '@mui/icons-material/PhoneRounded';
import PlaceRoundedIcon from '@mui/icons-material/PlaceRounded';
import PrintRoundedIcon from '@mui/icons-material/PrintRounded';
import StorefrontRoundedIcon from '@mui/icons-material/StorefrontRounded';
import TodayRoundedIcon from '@mui/icons-material/TodayRounded';
import {
  Alert,
  alpha,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Snackbar,
  Stack,
  Tab,
  Tabs,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material';
import { format } from 'date-fns';
import React, { useMemo, useState } from 'react';

/* ─── Types ─────────────────────────────────────────────────────────────── */
type StoreTechModalProps = {
  open: boolean;
  onClose: () => void;
  storeId: string;
  storeName?: string;
  storeSlug: string;
  storeImage?: string;
  address?: string | null;
  email?: string | null;
  phone?: string | null;
  lng?: number | null;
  lat?: number | null;
  startContractDate?: string | null;
  audience?: number | null;
  equipment?: EquipmentItem[] | null;
  contactInfo?: ContactInfoItem[] | null;
};

const KIOSKO_BASE = 'https://kiosko.sweepstouch.com/';
const LINKS_BASE = 'https://links.sweepstouch.com/';

const CONTACT_LABELS: Record<string, string> = {
  manager: 'Manager',
  owner: 'Owner',
  secretary: 'Secretario/a',
  assistant: 'Asistente',
  other: 'Otro',
};

const CONTACT_COLORS: Record<string, string> = {
  manager: '#6366f1',
  owner: '#f59e0b',
  secretary: '#10b981',
  assistant: '#3b82f6',
  other: '#94a3b8',
};

function a11yProps(index: number) {
  return {
    id: `stm-tab-${index}`,
    'aria-controls': `stm-tabpanel-${index}`,
  };
}

function TabPanel({ value, index, children }: { value: number; index: number; children: React.ReactNode }) {
  if (value !== index) return null;
  return (
    <Box role="tabpanel" id={`stm-tabpanel-${index}`} sx={{ pt: 2 }}>
      {children}
    </Box>
  );
}

function safeDateLabel(iso?: string | null) {
  const d = iso ? new Date(iso) : null;
  if (!d || Number.isNaN(d.getTime())) return '—';
  return format(d, 'MMM dd, yyyy');
}

/* ─── KPI mini card ──────────────────────────────────────────────────────── */
function KpiCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: React.ReactNode; color: string }) {
  const theme = useTheme();
  return (
    <Card variant="outlined" sx={{ borderRadius: 2.5, flex: 1, minWidth: 0, overflow: 'hidden' }}>
      <Box sx={{ height: 3, bgcolor: color }} />
      <CardContent sx={{ p: 1.75, '&:last-child': { pb: 1.75 } }}>
        <Stack direction="row" spacing={1} alignItems="center" mb={0.5}>
          <Box sx={{ color, display: 'flex', alignItems: 'center' }}>{icon}</Box>
          <Typography variant="caption" color="text.secondary" fontWeight={600} noWrap>{label}</Typography>
        </Stack>
        <Typography fontWeight={800} fontSize={17} lineHeight={1.1} sx={{ fontVariantNumeric: 'tabular-nums' }}>
          {value}
        </Typography>
      </CardContent>
    </Card>
  );
}

/* ─── Copy row ───────────────────────────────────────────────────────────── */
function CopyRow({ icon, label, value, onCopy }: { icon: React.ReactNode; label: string; value?: string | null; onCopy: (v: string) => void }) {
  if (!value) return null;
  return (
    <Stack direction="row" spacing={1} alignItems="center" sx={{ py: 0.75 }}>
      <Box sx={{ color: 'text.secondary', display: 'flex', flexShrink: 0 }}>{icon}</Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="caption" color="text.secondary" display="block">{label}</Typography>
        <Typography fontWeight={700} fontSize={13} noWrap>{value}</Typography>
      </Box>
      <Tooltip title={`Copiar ${label.toLowerCase()}`}>
        <IconButton size="small" onClick={() => onCopy(value)} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1.5 }}>
          <ContentCopyRoundedIcon sx={{ fontSize: 15 }} />
        </IconButton>
      </Tooltip>
    </Stack>
  );
}

/* ─── Main component ─────────────────────────────────────────────────────── */
export default function StoreTechModal({
  open, onClose,
  storeId, storeName, storeSlug, storeImage,
  address, email, phone, lng, lat,
  startContractDate, audience,
  equipment, contactInfo,
}: StoreTechModalProps) {
  const theme = useTheme();
  const [tab, setTab] = useState(0);
  const [toast, setToast] = useState({ open: false, msg: '' });

  const slug = (storeSlug || '').trim();

  const kioskoUrl = useMemo(() => `${KIOSKO_BASE}?slug=${encodeURIComponent(slug)}`, [slug]);
  const linkTreeUrl = useMemo(() => `${LINKS_BASE}?slug=${encodeURIComponent(slug)}`, [slug]);
  const mapsUrl = useMemo(() => address ? `https://maps.google.com/?q=${encodeURIComponent(address)}` : null, [address]);

  const tablets = useMemo(() => (equipment ?? []).filter((e) => e.type === 'tablet'), [equipment]);
  const printers = useMemo(() => (equipment ?? []).filter((e) => e.type === 'printer'), [equipment]);
  const totalTablets = tablets.reduce((s, e) => s + (e.qty ?? 0), 0);
  const totalPrinters = printers.reduce((s, e) => s + (e.qty ?? 0), 0);
  const hasEquipment = totalTablets > 0 || totalPrinters > 0 || (equipment ?? []).length > 0;

  const hasContacts = (contactInfo ?? []).length > 0;

  async function copy(text: string, msg: string) {
    try { await navigator.clipboard.writeText(text); } catch {
      const el = document.createElement('textarea');
      el.value = text; document.body.appendChild(el); el.select();
      document.execCommand('copy'); document.body.removeChild(el);
    }
    setToast({ open: true, msg });
  }

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 4, overflow: 'hidden',
            border: '1px solid', borderColor: 'divider',
            boxShadow: '0 24px 64px rgba(0,0,0,.22)',
          },
        }}
      >
        {/* ── Header ───────────────────────────────────────────────────────── */}
        <DialogTitle sx={{ p: 0 }}>
          <Box
            sx={{
              px: 2.5, pt: 2, pb: 0,
              background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.secondary.main, 0.07)} 100%)`,
            }}
          >
            <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={2} mb={1.5}>
              <Stack direction="row" spacing={1.75} alignItems="center" sx={{ minWidth: 0 }}>
                {storeImage && (
                  <Avatar
                    src={storeImage}
                    variant="rounded"
                    sx={{ width: 52, height: 52, borderRadius: 2, border: '2px solid', borderColor: 'divider', flexShrink: 0 }}
                  />
                )}
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="h6" fontWeight={900} lineHeight={1.2} noWrap>
                    {storeName ?? 'Ficha técnica'}
                  </Typography>
                  {address && (
                    <Typography variant="caption" color="text.secondary" display="block" noWrap sx={{ mt: 0.25 }}>
                      {address}
                    </Typography>
                  )}
                  <Stack direction="row" spacing={0.75} mt={0.75} flexWrap="wrap">
                    <Chip
                      size="small"
                      label={`slug: ${slug}`}
                      sx={{ fontWeight: 800, fontSize: 11, height: 20, bgcolor: alpha(theme.palette.primary.main, 0.1) }}
                    />
                    <Tooltip title="Copiar slug">
                      <IconButton size="small" onClick={() => copy(slug, 'Slug copiado')} sx={{ width: 22, height: 22, border: '1px solid', borderColor: 'divider' }}>
                        <ContentCopyRoundedIcon sx={{ fontSize: 12 }} />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Abrir Kiosko">
                      <IconButton size="small" onClick={() => copy(kioskoUrl, 'Link Kiosko copiado')} sx={{ width: 22, height: 22, border: '1px solid', borderColor: 'divider' }}>
                        <StorefrontRoundedIcon sx={{ fontSize: 12 }} />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Copiar Link Tree">
                      <IconButton size="small" onClick={() => copy(linkTreeUrl, 'Link Tree copiado')} sx={{ width: 22, height: 22, border: '1px solid', borderColor: 'divider' }}>
                        <LinkRoundedIcon sx={{ fontSize: 12 }} />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </Box>
              </Stack>

              <IconButton onClick={onClose} sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', flexShrink: 0 }}>
                <CloseRoundedIcon fontSize="small" />
              </IconButton>
            </Stack>

            <Tabs
              value={tab}
              onChange={(_, v) => setTab(v)}
              variant="scrollable"
              scrollButtons="auto"
              sx={{ '& .MuiTab-root': { fontWeight: 800, textTransform: 'none', minHeight: 40, fontSize: 13 } }}
            >
              <Tab icon={<InfoRoundedIcon sx={{ fontSize: 16 }} />} iconPosition="start" label="Info" {...a11yProps(0)} />
              <Tab
                icon={<DevicesRoundedIcon sx={{ fontSize: 16 }} />}
                iconPosition="start"
                label={`Equipo${totalTablets + totalPrinters > 0 ? ` (${totalTablets + totalPrinters})` : ''}`}
                {...a11yProps(1)}
              />
              <Tab
                icon={<GroupsRoundedIcon sx={{ fontSize: 16 }} />}
                iconPosition="start"
                label={`Contactos${hasContacts ? ` (${(contactInfo ?? []).length})` : ''}`}
                {...a11yProps(2)}
              />
            </Tabs>
          </Box>
          <Divider />
        </DialogTitle>

        {/* ── Content ──────────────────────────────────────────────────────── */}
        <DialogContent sx={{ p: 2.5 }}>
          {/* TAB 0 — Info */}
          <TabPanel value={tab} index={0}>
            <Stack spacing={2}>
              {/* KPI row */}
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                <KpiCard
                  icon={<PeopleAltRoundedIcon sx={{ fontSize: 18 }} />}
                  label="Clientes"
                  value={Number.isFinite(Number(audience)) ? Number(audience).toLocaleString('en-US') : '—'}
                  color={theme.palette.primary.main}
                />
                <KpiCard
                  icon={<TodayRoundedIcon sx={{ fontSize: 18 }} />}
                  label="Contrato desde"
                  value={safeDateLabel(startContractDate)}
                  color="#10b981"
                />
                <KpiCard
                  icon={<DevicesRoundedIcon sx={{ fontSize: 18 }} />}
                  label="Tablets instaladas"
                  value={totalTablets > 0 ? `${totalTablets} unid.` : '—'}
                  color="#6366f1"
                />
              </Stack>

              {/* Contact details */}
              <Card variant="outlined" sx={{ borderRadius: 2.5 }}>
                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                  <Typography fontWeight={800} fontSize={13} mb={1}>Datos de contacto</Typography>
                  <CopyRow icon={<EmailRoundedIcon sx={{ fontSize: 16 }} />} label="Email" value={email} onCopy={(v) => copy(v, 'Email copiado')} />
                  <CopyRow icon={<PhoneRoundedIcon sx={{ fontSize: 16 }} />} label="Teléfono" value={phone} onCopy={(v) => copy(v, 'Teléfono copiado')} />
                  <CopyRow icon={<PlaceRoundedIcon sx={{ fontSize: 16 }} />} label="Dirección" value={address} onCopy={(v) => copy(v, 'Dirección copiada')} />
                  {!email && !phone && !address && (
                    <Typography variant="caption" color="text.disabled">Sin datos de contacto registrados</Typography>
                  )}
                </CardContent>
              </Card>

              {/* Links */}
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.5 }}>
                {[
                  { label: 'Kiosko', url: kioskoUrl, color: '#00A9BC' },
                  { label: 'Link Tree', url: linkTreeUrl, color: '#ff0080' },
                ].map((item) => (
                  <Card key={item.label} variant="outlined" sx={{ borderRadius: 2.5, overflow: 'hidden' }}>
                    <Box sx={{ height: 3, bgcolor: item.color }} />
                    <CardContent sx={{ p: 1.75, '&:last-child': { pb: 1.75 } }}>
                      <Typography fontWeight={800} fontSize={13}>{item.label}</Typography>
                      <Typography variant="caption" color="text.secondary" display="block" noWrap sx={{ mt: 0.25, mb: 1 }}>
                        {item.url}
                      </Typography>
                      <Stack direction="row" spacing={1}>
                        <Button
                          size="small"
                          variant="contained"
                          href={item.url}
                          target="_blank"
                          rel="noreferrer"
                          startIcon={<OpenInNewRoundedIcon sx={{ fontSize: 14 }} />}
                          sx={{ borderRadius: 1.5, textTransform: 'none', fontWeight: 800, bgcolor: item.color, '&:hover': { filter: 'brightness(0.9)', bgcolor: item.color } }}
                        >
                          Abrir
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<ContentCopyRoundedIcon sx={{ fontSize: 14 }} />}
                          onClick={() => copy(item.url, `${item.label} copiado`)}
                          sx={{ borderRadius: 1.5, textTransform: 'none', fontWeight: 700 }}
                        >
                          Copiar
                        </Button>
                      </Stack>
                    </CardContent>
                  </Card>
                ))}
              </Box>

              {/* Maps link */}
              {mapsUrl && (
                <Button
                  size="small"
                  variant="outlined"
                  href={mapsUrl}
                  target="_blank"
                  rel="noreferrer"
                  startIcon={<PlaceRoundedIcon sx={{ fontSize: 16 }} />}
                  sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700, alignSelf: 'flex-start' }}
                >
                  Ver en Google Maps
                </Button>
              )}
            </Stack>
          </TabPanel>

          {/* TAB 1 — Equipo */}
          <TabPanel value={tab} index={1}>
            {!hasEquipment ? (
              <Box sx={{ py: 4, textAlign: 'center' }}>
                <DevicesRoundedIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
                <Typography color="text.secondary" fontWeight={700}>Sin equipamiento registrado</Typography>
                <Typography variant="caption" color="text.disabled">Agrega tablets e impresoras desde la pestaña Equipment en el perfil de la tienda.</Typography>
              </Box>
            ) : (
              <Stack spacing={1.5}>
                {totalTablets > 0 && (
                  <Card variant="outlined" sx={{ borderRadius: 2.5 }}>
                    <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                      <Stack direction="row" spacing={1.5} alignItems="center" mb={1.25}>
                        <Box sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: alpha('#6366f1', 0.12), display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6366f1' }}>
                          <DevicesRoundedIcon fontSize="small" />
                        </Box>
                        <Box>
                          <Typography fontWeight={800} fontSize={14}>Tablets</Typography>
                          <Typography variant="caption" color="text.secondary">{totalTablets} unidades instaladas</Typography>
                        </Box>
                      </Stack>
                      <Stack spacing={0.5}>
                        {tablets.map((t, i) => (
                          <Stack key={i} direction="row" justifyContent="space-between" alignItems="center" sx={{ px: 1.25, py: 0.75, borderRadius: 1.5, bgcolor: 'action.hover' }}>
                            <Typography fontSize={13} fontWeight={600}>{t.label ?? t.id ?? `Tablet ${i + 1}`}</Typography>
                            <Stack direction="row" spacing={1} alignItems="center">
                              <Chip label={`x${t.qty}`} size="small" sx={{ height: 22, fontSize: 11, fontWeight: 700 }} />
                              {t.price > 0 && (
                                <Typography variant="caption" color="text.secondary">${(t.qty * t.price).toLocaleString()}</Typography>
                              )}
                            </Stack>
                          </Stack>
                        ))}
                      </Stack>
                    </CardContent>
                  </Card>
                )}

                {totalPrinters > 0 && (
                  <Card variant="outlined" sx={{ borderRadius: 2.5 }}>
                    <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                      <Stack direction="row" spacing={1.5} alignItems="center" mb={1.25}>
                        <Box sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: alpha('#10b981', 0.12), display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>
                          <PrintRoundedIcon fontSize="small" />
                        </Box>
                        <Box>
                          <Typography fontWeight={800} fontSize={14}>Impresoras</Typography>
                          <Typography variant="caption" color="text.secondary">{totalPrinters} unidades</Typography>
                        </Box>
                      </Stack>
                      <Stack spacing={0.5}>
                        {printers.map((p, i) => (
                          <Stack key={i} direction="row" justifyContent="space-between" alignItems="center" sx={{ px: 1.25, py: 0.75, borderRadius: 1.5, bgcolor: 'action.hover' }}>
                            <Typography fontSize={13} fontWeight={600}>{p.label ?? p.id ?? `Impresora ${i + 1}`}</Typography>
                            <Chip label={`x${p.qty}`} size="small" sx={{ height: 22, fontSize: 11, fontWeight: 700 }} />
                          </Stack>
                        ))}
                      </Stack>
                    </CardContent>
                  </Card>
                )}
              </Stack>
            )}
          </TabPanel>

          {/* TAB 2 — Contactos */}
          <TabPanel value={tab} index={2}>
            {!hasContacts ? (
              <Box sx={{ py: 4, textAlign: 'center' }}>
                <GroupsRoundedIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
                <Typography color="text.secondary" fontWeight={700}>Sin contactos registrados</Typography>
                <Typography variant="caption" color="text.disabled">Agrega manager, owner u otros contactos desde la edición de la tienda.</Typography>
              </Box>
            ) : (
              <Stack spacing={1}>
                {(contactInfo ?? []).map((c, i) => {
                  const color = CONTACT_COLORS[c.type] ?? '#94a3b8';
                  return (
                    <Card key={i} variant="outlined" sx={{ borderRadius: 2.5, overflow: 'hidden' }}>
                      <Stack direction="row" alignItems="center" spacing={1.5} sx={{ p: 1.75 }}>
                        <Avatar
                          sx={{ width: 40, height: 40, bgcolor: alpha(color, 0.15), color, border: '1px solid', borderColor: alpha(color, 0.3) }}
                        >
                          <AssignmentIndRoundedIcon fontSize="small" />
                        </Avatar>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography fontWeight={800} fontSize={14} noWrap>{c.name || '—'}</Typography>
                          <Chip
                            size="small"
                            label={CONTACT_LABELS[c.type] ?? c.type}
                            sx={{ height: 20, fontSize: 10, fontWeight: 700, bgcolor: alpha(color, 0.12), color, border: '1px solid', borderColor: alpha(color, 0.3) }}
                          />
                        </Box>
                        {c.phone && (
                          <Stack direction="row" spacing={0.5} alignItems="center">
                            <Typography fontSize={13} fontWeight={700} sx={{ fontVariantNumeric: 'tabular-nums' }}>{c.phone}</Typography>
                            <Tooltip title="Copiar teléfono">
                              <IconButton size="small" onClick={() => copy(c.phone, 'Teléfono copiado')} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1.5 }}>
                                <ContentCopyRoundedIcon sx={{ fontSize: 13 }} />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Llamar">
                              <IconButton size="small" href={`tel:${c.phone}`} component="a" sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1.5 }}>
                                <PhoneRoundedIcon sx={{ fontSize: 13 }} />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        )}
                      </Stack>
                    </Card>
                  );
                })}
              </Stack>
            )}
          </TabPanel>
        </DialogContent>
      </Dialog>

      <Snackbar
        open={toast.open}
        autoHideDuration={2200}
        onClose={() => setToast({ open: false, msg: '' })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setToast({ open: false, msg: '' })} severity="success" variant="filled" sx={{ borderRadius: 3, fontWeight: 900 }}>
          {toast.msg}
        </Alert>
      </Snackbar>
    </>
  );
}
