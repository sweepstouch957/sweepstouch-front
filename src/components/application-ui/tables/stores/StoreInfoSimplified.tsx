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
import PictureAsPdfRoundedIcon from '@mui/icons-material/PictureAsPdfRounded';
import StorefrontRoundedIcon from '@mui/icons-material/StorefrontRounded';
import TodayRoundedIcon from '@mui/icons-material/TodayRounded';
import CampaignRoundedIcon from '@mui/icons-material/CampaignRounded';
import CalendarTodayRoundedIcon from '@mui/icons-material/CalendarTodayRounded';
import GroupRoundedIcon from '@mui/icons-material/GroupRounded';
import AttachMoneyRoundedIcon from '@mui/icons-material/AttachMoneyRounded';
import SpeedRoundedIcon from '@mui/icons-material/SpeedRounded';
import PauseCircleOutlineIcon from '@mui/icons-material/PauseCircleOutline';
import DescriptionIcon from '@mui/icons-material/Description';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
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
  CircularProgress,
} from '@mui/material';
import { format } from 'date-fns';
import React, { useMemo, useState } from 'react';
import { useLastCampaign } from '@/hooks/fetching/campaigns/useLastCampaign';
import { useStoreById } from '@/hooks/fetching/stores/useStoreById';

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

const SPANISH_DATE_FORMATTER = new Intl.DateTimeFormat('es-HN', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
});

function a11yProps(index: number) {
  return {
    id: `stm-tab-${index}`,
    'aria-controls': `stm-tabpanel-${index}`,
  };
}

function TabPanel({ value, index, children }: { value: number; index: number; children: React.ReactNode }) {
  if (value !== index) return null;
  return (
    <Box role="tabpanel"
id={`stm-tabpanel-${index}`}
sx={{ pt: 2 }}>
      {children}
    </Box>
  );
}

function safeDateLabel(iso?: string | null) {
  const d = iso ? new Date(iso) : null;
  if (!d || Number.isNaN(d.getTime())) return '—';
  return format(d, 'MMM dd, yyyy');
}

function spanishDateLabel(value?: string | Date | null) {
  if (!value) return 'Sin registro';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Sin registro';
  return SPANISH_DATE_FORMATTER.format(date);
}

async function imageToDataUrl(src?: string | null) {
  if (!src) return null;
  try {
    const response = await fetch(src);
    if (!response.ok) return null;
    const blob = await response.blob();
    const bitmap = await createImageBitmap(blob);
    const canvas = document.createElement('canvas');
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const context = canvas.getContext('2d');
    if (!context) return null;
    context.drawImage(bitmap, 0, 0);
    bitmap.close();
    return canvas.toDataURL('image/png');
  } catch {
    return null;
  }
}

async function storeImageToDataUrl(src?: string | null) {
  if (!src) return null;

  if (/^https?:\/\//i.test(src)) {
    const proxied = await imageToDataUrl(`/api/store-logo?url=${encodeURIComponent(src)}`);
    if (proxied) return proxied;

    const optimizedUrl = `/_next/image?url=${encodeURIComponent(src)}&w=256&q=90`;
    const optimized = await imageToDataUrl(optimizedUrl);
    if (optimized) return optimized;
  }

  return imageToDataUrl(src);
}

function imageFormat(dataUrl: string) {
  return dataUrl.startsWith('data:image/png') ? 'PNG' : 'JPEG';
}

/* ─── KPI mini card ──────────────────────────────────────────────────────── */
function KpiCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: React.ReactNode; color: string }) {
  const theme = useTheme();
  return (
    <Card variant="outlined"
sx={{ borderRadius: 2.5, flex: 1, minWidth: 0, overflow: 'hidden' }}>
      <Box sx={{ height: 3, bgcolor: color }} />
      <CardContent sx={{ p: 1.75, '&:last-child': { pb: 1.75 } }}>
        <Stack direction="row"
spacing={1}
alignItems="center"
mb={0.5}>
          <Box sx={{ color, display: 'flex', alignItems: 'center' }}>{icon}</Box>
          <Typography variant="caption"
color="text.secondary"
fontWeight={600}
noWrap>{label}</Typography>
        </Stack>
        <Typography fontWeight={800}
fontSize={17}
lineHeight={1.1}
sx={{ fontVariantNumeric: 'tabular-nums' }}>
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
    <Stack direction="row"
spacing={1}
alignItems="center"
sx={{ py: 0.75 }}>
      <Box sx={{ color: 'text.secondary', display: 'flex', flexShrink: 0 }}>{icon}</Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="caption"
color="text.secondary"
display="block">{label}</Typography>
        <Typography fontWeight={700}
fontSize={13}
noWrap>{value}</Typography>
      </Box>
      <Tooltip title={`Copiar ${label.toLowerCase()}`}>
        <IconButton size="small"
onClick={() => onCopy(value)}
sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1.5 }}>
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
  const [exportingPdf, setExportingPdf] = useState(false);

  const { data: lastCampaign, isLoading: loadingCampaign } = useLastCampaign(storeId);
  const { data: storeDetails } = useStoreById(storeId);

  const effectiveName = storeDetails?.name || storeName || 'Tienda';
  const effectiveAddress = storeDetails?.address || address || 'Sin dirección registrada';
  const effectiveEmail = storeDetails?.email || email || '';
  const effectiveImage = storeDetails?.image || storeImage || '';
  const effectiveStartDate = storeDetails?.startContractDate || startContractDate || storeDetails?.createdAt;
  const effectiveAudience = Number(storeDetails?.customerCount ?? audience ?? 0);
  const effectiveContacts = storeDetails?.contactInfo?.length
    ? storeDetails.contactInfo
    : contactInfo ?? [];
  const effectiveStatus = storeDetails?.status || (storeDetails?.active === false ? 'cancelled' : 'active');
  const statusLabel =
    effectiveStatus === 'suspended'
      ? 'Cuenta Suspendida'
      : effectiveStatus === 'cancelled'
        ? 'Cuenta Cancelada'
        : effectiveStatus === 'inactive'
          ? 'Cuenta Inactiva'
          : 'Cuenta Activa';
  const withdrawalReason =
    effectiveStatus === 'suspended'
      ? storeDetails?.suspendedReason
      : effectiveStatus === 'cancelled'
        ? storeDetails?.cancelContractReason
        : storeDetails?.inactiveReason;
  const lastCampaignDate = lastCampaign?.startDate || lastCampaign?.createdAt;

  const slug = (storeSlug || '').trim();

  const kioskoUrl = useMemo(() => `${KIOSKO_BASE}?slug=${encodeURIComponent(slug)}`, [slug]);
  const linkTreeUrl = useMemo(() => `${LINKS_BASE}?slug=${encodeURIComponent(slug)}`, [slug]);
  const mapsUrl = useMemo(() => address ? `https://maps.google.com/?q=${encodeURIComponent(address)}` : null, [address]);

  const tablets = useMemo(() => (equipment ?? []).filter((e) => e.type === 'tablet'), [equipment]);
  const printers = useMemo(() => (equipment ?? []).filter((e) => e.type === 'printer'), [equipment]);
  const totalTablets = tablets.reduce((s, e) => s + (e.qty ?? 0), 0);
  const totalPrinters = printers.reduce((s, e) => s + (e.qty ?? 0), 0);
  const hasEquipment = totalTablets > 0 || totalPrinters > 0 || (equipment ?? []).length > 0;

  const hasContacts = effectiveContacts.length > 0;

  async function exportTechnicalSheet() {
    setExportingPdf(true);
    try {
      const [{ jsPDF }, brandLogo, storeLogo, cornerRibbon] = await Promise.all([
        import('jspdf'),
        imageToDataUrl('/st-logo.png'),
        storeImageToDataUrl(effectiveImage),
        imageToDataUrl('/technical-sheet-corner.png'),
      ]);

      const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'letter' });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const pink = '#ff0080';
      const dark = '#111827';
      const gray = '#6b7280';
      const margin = 68;

      doc.setFillColor(255, 255, 255);
      doc.rect(0, 0, pageWidth, pageHeight, 'F');

      if (cornerRibbon) {
        doc.addImage(cornerRibbon, imageFormat(cornerRibbon), pageWidth - 300, 0, 300, 100);
      }

      if (brandLogo) {
        doc.addImage(brandLogo, imageFormat(brandLogo), 24, 10, 172, 58);
      } else {
        doc.setTextColor(pink);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(26);
        doc.text('sweepsTOUCH', 30, 48);
      }

      doc.setTextColor(dark);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(13);
      doc.text('FICHA TÉCNICA', pageWidth / 2, 92, { align: 'center' });

      doc.setFont('helvetica', 'bold');
      const titleMaxWidth = pageWidth - margin * 2 - 105;
      const titleFontSize = effectiveName.length > 48 ? 15 : effectiveName.length > 34 ? 17 : 20;
      doc.setFontSize(titleFontSize);
      doc.text(effectiveName, margin + 25, 175, { maxWidth: titleMaxWidth });
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(gray);
      doc.setFontSize(11);
      doc.text(effectiveAddress, margin + 25, 193, { maxWidth: 480 });

      if (storeLogo) {
        const frameX = pageWidth - margin - 52;
        const frameY = 148;
        const frameSize = 52;
        const imageProperties = doc.getImageProperties(storeLogo);
        const imageRatio = imageProperties.width / imageProperties.height;
        const imageWidth = imageRatio >= 1 ? frameSize - 8 : (frameSize - 8) * imageRatio;
        const imageHeight = imageRatio >= 1 ? (frameSize - 8) / imageRatio : frameSize - 8;

        doc.setFillColor(255, 255, 255);
        doc.setDrawColor(220, 220, 220);
        doc.roundedRect(frameX, frameY, frameSize, frameSize, 3, 3, 'FD');
        doc.addImage(
          storeLogo,
          imageFormat(storeLogo),
          frameX + (frameSize - imageWidth) / 2,
          frameY + (frameSize - imageHeight) / 2,
          imageWidth,
          imageHeight
        );
      }

      doc.setDrawColor(205, 205, 205);
      doc.setLineWidth(0.8);
      doc.line(margin, 210, pageWidth - margin, 210);

      const metrics = [
        ['FECHA DE INICIO', spanishDateLabel(effectiveStartDate)],
        ['AUDIENCIA TOTAL', `${effectiveAudience.toLocaleString('en-US')} clientes`],
        ['ÚLTIMA CAMPAÑA', spanishDateLabel(lastCampaignDate)],
        ['ESTADO', statusLabel],
      ];
      const metricWidth = (pageWidth - margin * 2) / metrics.length;

      metrics.forEach(([label, value], index) => {
        const x = margin + 16 + metricWidth * index;
        doc.setTextColor(dark);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.text(label, x, 245);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(11);
        doc.text(value, x, 265, { maxWidth: metricWidth - 22 });
      });

      let contentY = 315;
      doc.setTextColor('#303030');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text('RAZÓN DE RETIRO', margin, contentY);
      doc.setDrawColor(190, 190, 190);
      doc.line(margin + 16, contentY + 14, margin + 16, contentY + 58);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      doc.setTextColor(dark);
      const reasonLines = doc.splitTextToSize(withdrawalReason || 'Sin razón de retiro registrada.', pageWidth - margin * 2 - 45);
      doc.text(reasonLines, margin + 32, contentY + 33);

      contentY += 92;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text('CONTACTOS', margin, contentY);

      let contactY = contentY + 25;
      doc.setFontSize(10);
      doc.text('Correo:', margin + 16, contactY);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(gray);
      doc.text(effectiveEmail || 'Sin correo registrado', margin + 76, contactY);

      effectiveContacts.slice(0, 5).forEach((contact) => {
        contactY += 17;
        doc.setTextColor(dark);
        doc.setFont('helvetica', 'bold');
        doc.text(contact.name || 'Sin nombre', margin + 16, contactY);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(gray);
        doc.text(`(${CONTACT_LABELS[contact.type] || contact.type})`, margin + 120, contactY);
        doc.text(contact.phone || 'Sin teléfono', margin + 205, contactY);
      });

      doc.setDrawColor(220, 220, 220);
      doc.line(margin, pageHeight - 35, pageWidth - margin, pageHeight - 35);
      doc.save(`ficha-tecnica-${effectiveName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.pdf`);
      setToast({ open: true, msg: 'Ficha técnica exportada.' });
    } catch {
      setToast({ open: true, msg: 'No se pudo generar el PDF.' });
    } finally {
      setExportingPdf(false);
    }
  }

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
            <Stack direction="row"
alignItems="flex-start"
justifyContent="space-between"
spacing={2}
mb={1.5}>
              <Stack direction="row"
spacing={1.75}
alignItems="center"
sx={{ minWidth: 0 }}>
                {storeImage && (
                  <Avatar
                    src={storeImage}
                    variant="rounded"
                    sx={{ width: 52, height: 52, borderRadius: 2, border: '2px solid', borderColor: 'divider', flexShrink: 0 }}
                  />
                )}
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="h6"
fontWeight={900}
lineHeight={1.2}
noWrap>
                    {storeName ?? 'Ficha técnica'}
                  </Typography>
                  {address && (
                    <Typography variant="caption"
color="text.secondary"
display="block"
noWrap
sx={{ mt: 0.25 }}>
                      {address}
                    </Typography>
                  )}
                  <Stack direction="row"
spacing={0.75}
mt={0.75}
flexWrap="wrap">
                    <Chip
                      size="small"
                      label={`slug: ${slug}`}
                      sx={{ fontWeight: 800, fontSize: 11, height: 20, bgcolor: alpha(theme.palette.primary.main, 0.1) }}
                    />
                    {storeDetails && (
                      <Chip
                        size="small"
                        label={
                          storeDetails.status === 'active'
                            ? 'Activa'
                            : storeDetails.status === 'suspended'
                            ? 'Suspendida'
                            : storeDetails.status === 'inactive'
                            ? 'Inactiva'
                            : storeDetails.status === 'cancelled'
                            ? 'Cancelada'
                            : storeDetails.active
                            ? 'Activa'
                            : 'Inactiva'
                        }
                        color={
                          storeDetails.status === 'active'
                            ? 'success'
                            : storeDetails.status === 'suspended'
                            ? 'info'
                            : storeDetails.status === 'inactive'
                            ? 'warning'
                            : storeDetails.status === 'cancelled'
                            ? 'error'
                            : storeDetails.active
                            ? 'success'
                            : 'warning'
                        }
                        sx={{ fontWeight: 800, fontSize: 11, height: 20 }}
                      />
                    )}
                    <Tooltip title="Copiar slug">
                      <IconButton size="small"
onClick={() => copy(slug, 'Slug copiado')}
sx={{ width: 22, height: 22, border: '1px solid', borderColor: 'divider' }}>
                        <ContentCopyRoundedIcon sx={{ fontSize: 12 }} />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Abrir Kiosko">
                      <IconButton size="small"
onClick={() => copy(kioskoUrl, 'Link Kiosko copiado')}
sx={{ width: 22, height: 22, border: '1px solid', borderColor: 'divider' }}>
                        <StorefrontRoundedIcon sx={{ fontSize: 12 }} />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Copiar Link Tree">
                      <IconButton size="small"
onClick={() => copy(linkTreeUrl, 'Link Tree copiado')}
sx={{ width: 22, height: 22, border: '1px solid', borderColor: 'divider' }}>
                        <LinkRoundedIcon sx={{ fontSize: 12 }} />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </Box>
              </Stack>

              <Stack direction="row"
spacing={1}
flexShrink={0}>
                <Button
                  variant="contained"
                  size="small"
                  startIcon={
                    exportingPdf
                      ? <CircularProgress size={14}
color="inherit" />
                      : <PictureAsPdfRoundedIcon fontSize="small" />
                  }
                  onClick={exportTechnicalSheet}
                  disabled={exportingPdf || !storeDetails}
                  sx={{ textTransform: 'none', fontWeight: 800, borderRadius: 2 }}
                >
                  {exportingPdf ? 'Generando...' : 'Exportar PDF'}
                </Button>
                <IconButton onClick={onClose}
sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                  <CloseRoundedIcon fontSize="small" />
                </IconButton>
              </Stack>
            </Stack>

            <Tabs
              value={tab}
              onChange={(_, v) => setTab(v)}
              variant="scrollable"
              scrollButtons="auto"
              sx={{ '& .MuiTab-root': { fontWeight: 800, textTransform: 'none', minHeight: 40, fontSize: 13 } }}
            >
              <Tab icon={<InfoRoundedIcon sx={{ fontSize: 16 }} />}
iconPosition="start"
label="Info"
{...a11yProps(0)} />
              <Tab
                icon={<DevicesRoundedIcon sx={{ fontSize: 16 }} />}
                iconPosition="start"
                label={`Equipo${totalTablets + totalPrinters > 0 ? ` (${totalTablets + totalPrinters})` : ''}`}
                {...a11yProps(1)}
              />
              <Tab
                icon={<GroupsRoundedIcon sx={{ fontSize: 16 }} />}
                iconPosition="start"
                label={`Contactos${hasContacts ? ` (${effectiveContacts.length})` : ''}`}
                {...a11yProps(2)}
              />
            </Tabs>
          </Box>
          <Divider />
        </DialogTitle>

        {/* ── Content ──────────────────────────────────────────────────────── */}
        <DialogContent sx={{ p: 2.5 }}>
          {/* TAB 0 — Info */}
          <TabPanel value={tab}
index={0}>
            <Stack spacing={2}>
              {/* KPI row */}
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 1.5 }}>
                <KpiCard
                  icon={<TodayRoundedIcon sx={{ fontSize: 18 }} />}
                  label="Fecha de inicio"
                  value={spanishDateLabel(effectiveStartDate)}
                  color="#10b981"
                />
                <KpiCard
                  icon={<PeopleAltRoundedIcon sx={{ fontSize: 18 }} />}
                  label="Audiencia total"
                  value={`${effectiveAudience.toLocaleString('en-US')} clientes`}
                  color={theme.palette.primary.main}
                />
                <KpiCard
                  icon={<CampaignRoundedIcon sx={{ fontSize: 18 }} />}
                  label="Última campaña"
                  value={spanishDateLabel(lastCampaignDate)}
                  color="#6366f1"
                />
                <KpiCard
                  icon={<WarningAmberRoundedIcon sx={{ fontSize: 18 }} />}
                  label="Estado"
                  value={statusLabel}
                  color={
                    effectiveStatus === 'active'
                      ? '#10b981'
                      : effectiveStatus === 'suspended'
                        ? '#0288d1'
                        : '#ef4444'
                  }
                />
              </Box>

              <Card variant="outlined"
sx={{ borderRadius: 2.5 }}>
                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                  <Typography fontWeight={800}
fontSize={13}
mb={1}>
                    Razón de retiro
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ pl: 1.5, borderLeft: '3px solid', borderColor: 'divider' }}
                  >
                    {withdrawalReason || 'Sin razón de retiro registrada.'}
                  </Typography>
                </CardContent>
              </Card>

              {/* Contact details */}
              <Card variant="outlined"
sx={{ borderRadius: 2.5 }}>
                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                  <Typography fontWeight={800}
fontSize={13}
mb={1}>Datos de contacto</Typography>
                  <CopyRow icon={<EmailRoundedIcon sx={{ fontSize: 16 }} />}
label="Email"
value={effectiveEmail}
onCopy={(v) => copy(v, 'Email copiado')} />
                  <CopyRow icon={<PhoneRoundedIcon sx={{ fontSize: 16 }} />}
label="Teléfono"
value={storeDetails?.phoneNumber || phone}
onCopy={(v) => copy(v, 'Teléfono copiado')} />
                  <CopyRow icon={<PlaceRoundedIcon sx={{ fontSize: 16 }} />}
label="Dirección"
value={effectiveAddress}
onCopy={(v) => copy(v, 'Dirección copiada')} />
                  {effectiveContacts.length > 0 && (
                    <Stack spacing={0.75}
mt={1.25}
pt={1.25}
sx={{ borderTop: '1px solid', borderColor: 'divider' }}>
                      {effectiveContacts.map((contact) => (
                        <Stack
                          key={`${contact.type}-${contact.name}-${contact.phone}`}
                          direction={{ xs: 'column', sm: 'row' }}
                          spacing={{ xs: 0.25, sm: 1 }}
                          alignItems={{ xs: 'flex-start', sm: 'center' }}
                        >
                          <Typography fontSize={13}
fontWeight={800}
sx={{ minWidth: 140 }}>
                            {contact.name || 'Sin nombre'}
                          </Typography>
                          <Typography variant="caption"
color="text.secondary"
sx={{ minWidth: 80 }}>
                            {CONTACT_LABELS[contact.type] || contact.type}
                          </Typography>
                          <Typography fontSize={13}
color="text.secondary">
                            {contact.phone || 'Sin teléfono'}
                          </Typography>
                        </Stack>
                      ))}
                    </Stack>
                  )}
                  {!effectiveEmail && !phone && !effectiveAddress && (
                    <Typography variant="caption"
color="text.disabled">Sin datos de contacto registrados</Typography>
                  )}
                </CardContent>
              </Card>

              {/* Última campaña enviada */}
              <Card variant="outlined"
sx={{ borderRadius: 2.5 }}>
                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                  <Stack direction="row"
spacing={1}
alignItems="center"
mb={1.5}>
                    <CampaignRoundedIcon sx={{ fontSize: 18, color: theme.palette.primary.main }} />
                    <Typography fontWeight={800}
fontSize={13}>Última campaña enviada</Typography>
                  </Stack>

                  {loadingCampaign ? (
                    <Stack direction="row"
spacing={1}
alignItems="center"
sx={{ py: 1, justifyContent: 'center' }}>
                      <CircularProgress size={16}
thickness={5}
sx={{ color: theme.palette.primary.main }} />
                      <Typography variant="caption"
color="text.secondary">Cargando campaña...</Typography>
                    </Stack>
                  ) : !lastCampaign ? (
                    <Typography variant="caption"
color="text.secondary"
sx={{ display: 'block', py: 0.5 }}>
                      No se han encontrado campañas enviadas para esta tienda
                    </Typography>
                  ) : (
                    <Stack spacing={1.5}>
                      <Stack direction="row"
justifyContent="space-between"
alignItems="flex-start"
spacing={2}>
                        <Box sx={{ minWidth: 0 }}>
                          <Typography fontWeight={700}
fontSize={14}
sx={{ mb: 0.5 }}
noWrap
title={lastCampaign.title}>
                            {lastCampaign.title}
                          </Typography>
                          <Typography variant="caption"
color="text.secondary"
display="block">
                            ID: {lastCampaign._id}
                          </Typography>
                        </Box>
                        <Stack direction="row"
spacing={0.75}
flexShrink={0}>
                          {lastCampaign.type && (
                            <Chip
                              label={lastCampaign.type}
                              size="small"
                              sx={{
                                fontWeight: 800,
                                fontSize: 10,
                                height: 20,
                                bgcolor: lastCampaign.type === 'MMS' ? alpha(theme.palette.secondary.main, 0.1) : alpha(theme.palette.primary.main, 0.1),
                                color: lastCampaign.type === 'MMS' ? theme.palette.secondary.main : theme.palette.primary.main,
                              }}
                            />
                          )}
                          {lastCampaign.status && (
                            <Chip
                              label={
                                lastCampaign.status === 'completed'
                                  ? 'Completado'
                                  : lastCampaign.status === 'scheduled'
                                  ? 'Programado'
                                  : lastCampaign.status === 'draft'
                                  ? 'Borrador'
                                  : lastCampaign.status === 'progress'
                                  ? 'En progreso'
                                  : lastCampaign.status === 'cancelled'
                                  ? 'Cancelado'
                                  : lastCampaign.status
                              }
                              size="small"
                              sx={{
                                fontWeight: 800,
                                fontSize: 10,
                                height: 20,
                                bgcolor: lastCampaign.status === 'completed' ? alpha('#10b981', 0.1) : alpha(theme.palette.text.secondary, 0.1),
                                color: lastCampaign.status === 'completed' ? '#10b981' : theme.palette.text.secondary,
                              }}
                            />
                          )}
                        </Stack>
                      </Stack>

                      <Divider />

                      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: 1.5 }}>
                        <Box>
                          <Stack direction="row"
spacing={0.5}
alignItems="center"
mb={0.25}>
                            <CalendarTodayRoundedIcon sx={{ fontSize: 13, color: 'text.secondary' }} />
                            <Typography variant="caption"
color="text.secondary">Fecha</Typography>
                          </Stack>
                          <Typography fontWeight={700}
fontSize={12}>
                            {safeDateLabel(lastCampaign.startDate ? lastCampaign.startDate.toString() : lastCampaign.createdAt?.toString())}
                          </Typography>
                        </Box>

                        <Box>
                          <Stack direction="row"
spacing={0.5}
alignItems="center"
mb={0.25}>
                            <GroupRoundedIcon sx={{ fontSize: 13, color: 'text.secondary' }} />
                            <Typography variant="caption"
color="text.secondary">Audiencia</Typography>
                          </Stack>
                          <Typography fontWeight={700}
fontSize={12}
sx={{ fontVariantNumeric: 'tabular-nums' }}>
                            {Number.isFinite(lastCampaign.audience) ? lastCampaign.audience.toLocaleString('en-US') : '—'}
                          </Typography>
                        </Box>

                        {Number.isFinite(lastCampaign.cost) && lastCampaign.cost > 0 && (
                          <Box>
                            <Stack direction="row"
spacing={0.5}
alignItems="center"
mb={0.25}>
                              <AttachMoneyRoundedIcon sx={{ fontSize: 13, color: 'text.secondary' }} />
                              <Typography variant="caption"
color="text.secondary">Costo</Typography>
                            </Stack>
                            <Typography fontWeight={700}
fontSize={12}
sx={{ fontVariantNumeric: 'tabular-nums', color: '#ef4444' }}>
                              ${lastCampaign.cost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </Typography>
                          </Box>
                        )}

                        {Number.isFinite(lastCampaign.deliveryRate) && lastCampaign.deliveryRate > 0 && (
                          <Box>
                            <Stack direction="row"
spacing={0.5}
alignItems="center"
mb={0.25}>
                              <SpeedRoundedIcon sx={{ fontSize: 13, color: 'text.secondary' }} />
                              <Typography variant="caption"
color="text.secondary">Entrega</Typography>
                            </Stack>
                            <Typography fontWeight={700}
fontSize={12}
sx={{ fontVariantNumeric: 'tabular-nums', color: '#10b981' }}>
                              {Math.round(lastCampaign.deliveryRate)}%
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    </Stack>
                  )}
                </CardContent>
              </Card>

              {/* Contratos firmados */}
              <Card variant="outlined"
sx={{ borderRadius: 2.5 }}>
                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                  <Stack direction="row"
spacing={1}
alignItems="center"
mb={1.5}>
                    <DescriptionIcon sx={{ fontSize: 18, color: theme.palette.primary.main }} />
                    <Typography fontWeight={800}
fontSize={13}>Contratos firmados</Typography>
                  </Stack>

                  {(!storeDetails?.contracts || storeDetails.contracts.length === 0) ? (
                    <Typography variant="caption"
color="text.disabled">
                      No se han encontrado contratos para esta tienda
                    </Typography>
                  ) : (
                    <Stack spacing={1}>
                      {storeDetails.contracts.map((c: any, i: number) => (
                        <Stack key={i}
direction="row"
justifyContent="space-between"
alignItems="center"
sx={{ p: 1, borderRadius: 1.5, bgcolor: 'action.hover' }}>
                          <Box sx={{ minWidth: 0, mr: 2 }}>
                            <Typography fontWeight={700}
fontSize={12.5}
noWrap
title={c.fileName}>{c.fileName}</Typography>
                            <Typography variant="caption"
color="text.secondary"
display="block">
                              Firmado: {safeDateLabel(c.signedAt)} | Subido: {safeDateLabel(c.uploadedAt)}
                            </Typography>
                          </Box>
                          <Button
                            size="small"
                            variant="outlined"
                            href={c.fileUrl}
                            target="_blank"
                            rel="noreferrer"
                            sx={{ textTransform: 'none', borderRadius: 1.5, fontSize: 11, fontWeight: 700, flexShrink: 0 }}
                          >
                            Ver PDF
                          </Button>
                        </Stack>
                      ))}
                    </Stack>
                  )}
                </CardContent>
              </Card>

              {/* Historial de pausas */}
              <Card variant="outlined"
sx={{ borderRadius: 2.5 }}>
                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                  <Stack direction="row"
spacing={1}
alignItems="center"
mb={1.5}>
                    <PauseCircleOutlineIcon sx={{ fontSize: 18, color: theme.palette.warning.main }} />
                    <Typography fontWeight={800}
fontSize={13}>Historial de pausas del servicio</Typography>
                  </Stack>

                  {(!storeDetails?.pauseHistory || storeDetails.pauseHistory.length === 0) ? (
                    <Typography variant="caption"
color="text.disabled">
                      No se registran períodos de pausa
                    </Typography>
                  ) : (
                    <Stack spacing={1}>
                      {storeDetails.pauseHistory.map((p: any, i: number) => {
                        const isCurrent = !p.endDate || new Date(p.endDate) > new Date();
                        return (
                          <Box key={i}
sx={{ p: 1, borderRadius: 1.5, bgcolor: isCurrent ? alpha(theme.palette.error.main, 0.03) : 'action.hover', borderLeft: '3px solid', borderColor: isCurrent ? 'error.main' : 'text.disabled' }}>
                            <Stack direction="row"
spacing={1}
alignItems="center"
flexWrap="wrap">
                              {isCurrent ? (
                                <Chip label="Activo"
color="error"
size="small"
sx={{ height: 16, fontSize: 9, fontWeight: 800 }} />
                              ) : (
                                <Chip label="Pausado"
size="small"
sx={{ height: 16, fontSize: 9, fontWeight: 800 }} />
                              )}
                              <Typography fontWeight={700}
fontSize={12}>
                                {safeDateLabel(p.startDate)} — {p.endDate ? safeDateLabel(p.endDate) : 'Indefinido'}
                              </Typography>
                            </Stack>
                            {p.reason && (
                              <Typography variant="caption"
color="text.secondary"
display="block"
sx={{ mt: 0.5 }}>
                                {p.reason}
                              </Typography>
                            )}
                          </Box>
                        );
                      })}
                    </Stack>
                  )}
                </CardContent>
              </Card>

              {/* Detalles de Inactividad */}
              {(storeDetails?.status === 'inactive' || (!storeDetails?.status && storeDetails?.active === false && storeDetails?.inactiveReason)) && (
                <Card
                  variant="outlined"
                  sx={{
                    borderRadius: 2.5,
                    borderColor: 'warning.light',
                    bgcolor: (t) => alpha(t.palette.warning.main, 0.02),
                  }}
                >
                  <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                    <Stack direction="row"
spacing={1}
alignItems="center"
mb={1.5}>
                      <WarningAmberRoundedIcon sx={{ fontSize: 18, color: theme.palette.warning.main }} />
                      <Typography fontWeight={800}
fontSize={13}
color="warning.main">
                        Tienda Inactiva
                      </Typography>
                    </Stack>
                    <Stack spacing={1}>
                      {storeDetails?.inactiveReason && (
                        <Typography variant="body2"
color="text.secondary"
sx={{ pl: 1, borderLeft: '3px solid', borderColor: 'warning.main' }}>
                          Motivo de Inactividad: {storeDetails.inactiveReason}
                        </Typography>
                      )}
                    </Stack>
                  </CardContent>
                </Card>
              )}

              {/* Detalles de Cancelación */}
              {(storeDetails?.status === 'cancelled' || 
                (!storeDetails?.status && (storeDetails?.active === false || storeDetails?.cancelContractDate || storeDetails?.cancelContractReason) && !storeDetails?.inactiveReason)) && (
                <Card
                  variant="outlined"
                  sx={{
                    borderRadius: 2.5,
                    borderColor: 'error.light',
                    bgcolor: (t) => alpha(t.palette.error.main, 0.02),
                  }}
                >
                  <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                    <Stack direction="row"
spacing={1}
alignItems="center"
mb={1.5}>
                      <WarningAmberRoundedIcon sx={{ fontSize: 18, color: theme.palette.error.main }} />
                      <Typography fontWeight={800}
fontSize={13}
color="error.main">
                        Contrato Cancelado
                      </Typography>
                    </Stack>
                    <Stack spacing={1}>
                      {storeDetails?.cancelContractDate && (
                        <Typography variant="body2"
fontWeight={700}>
                          Fecha de Cancelación: {safeDateLabel(storeDetails.cancelContractDate)}
                        </Typography>
                      )}
                      {storeDetails?.cancelContractReason && (
                        <Typography variant="body2"
color="text.secondary"
sx={{ pl: 1, borderLeft: '3px solid', borderColor: 'error.main' }}>
                          Motivo: {storeDetails.cancelContractReason}
                        </Typography>
                      )}
                    </Stack>
                  </CardContent>
                </Card>
              )}

              {/* Links */}
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.5 }}>
                {[
                  { label: 'Kiosko', url: kioskoUrl, color: '#00A9BC' },
                  { label: 'Link Tree', url: linkTreeUrl, color: '#ff0080' },
                ].map((item) => (
                  <Card key={item.label}
variant="outlined"
sx={{ borderRadius: 2.5, overflow: 'hidden' }}>
                    <Box sx={{ height: 3, bgcolor: item.color }} />
                    <CardContent sx={{ p: 1.75, '&:last-child': { pb: 1.75 } }}>
                      <Typography fontWeight={800}
fontSize={13}>{item.label}</Typography>
                      <Typography variant="caption"
color="text.secondary"
display="block"
noWrap
sx={{ mt: 0.25, mb: 1 }}>
                        {item.url}
                      </Typography>
                      <Stack direction="row"
spacing={1}>
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
          <TabPanel value={tab}
index={1}>
            {!hasEquipment ? (
              <Box sx={{ py: 4, textAlign: 'center' }}>
                <DevicesRoundedIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
                <Typography color="text.secondary"
fontWeight={700}>Sin equipamiento registrado</Typography>
                <Typography variant="caption"
color="text.disabled">Agrega tablets e impresoras desde la pestaña Equipment en el perfil de la tienda.</Typography>
              </Box>
            ) : (
              <Stack spacing={1.5}>
                {totalTablets > 0 && (
                  <Card variant="outlined"
sx={{ borderRadius: 2.5 }}>
                    <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                      <Stack direction="row"
spacing={1.5}
alignItems="center"
mb={1.25}>
                        <Box sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: alpha('#6366f1', 0.12), display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6366f1' }}>
                          <DevicesRoundedIcon fontSize="small" />
                        </Box>
                        <Box>
                          <Typography fontWeight={800}
fontSize={14}>Tablets</Typography>
                          <Typography variant="caption"
color="text.secondary">{totalTablets} unidades instaladas</Typography>
                        </Box>
                      </Stack>
                      <Stack spacing={0.5}>
                        {tablets.map((t, i) => (
                          <Stack key={i}
direction="row"
justifyContent="space-between"
alignItems="center"
sx={{ px: 1.25, py: 0.75, borderRadius: 1.5, bgcolor: 'action.hover' }}>
                            <Typography fontSize={13}
fontWeight={600}>{t.label ?? t.id ?? `Tablet ${i + 1}`}</Typography>
                            <Stack direction="row"
spacing={1}
alignItems="center">
                              <Chip label={`x${t.qty}`}
size="small"
sx={{ height: 22, fontSize: 11, fontWeight: 700 }} />
                              {t.price > 0 && (
                                <Typography variant="caption"
color="text.secondary">${(t.qty * t.price).toLocaleString()}</Typography>
                              )}
                            </Stack>
                          </Stack>
                        ))}
                      </Stack>
                    </CardContent>
                  </Card>
                )}

                {totalPrinters > 0 && (
                  <Card variant="outlined"
sx={{ borderRadius: 2.5 }}>
                    <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                      <Stack direction="row"
spacing={1.5}
alignItems="center"
mb={1.25}>
                        <Box sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: alpha('#10b981', 0.12), display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>
                          <PrintRoundedIcon fontSize="small" />
                        </Box>
                        <Box>
                          <Typography fontWeight={800}
fontSize={14}>Impresoras</Typography>
                          <Typography variant="caption"
color="text.secondary">{totalPrinters} unidades</Typography>
                        </Box>
                      </Stack>
                      <Stack spacing={0.5}>
                        {printers.map((p, i) => (
                          <Stack key={i}
direction="row"
justifyContent="space-between"
alignItems="center"
sx={{ px: 1.25, py: 0.75, borderRadius: 1.5, bgcolor: 'action.hover' }}>
                            <Typography fontSize={13}
fontWeight={600}>{p.label ?? p.id ?? `Impresora ${i + 1}`}</Typography>
                            <Chip label={`x${p.qty}`}
size="small"
sx={{ height: 22, fontSize: 11, fontWeight: 700 }} />
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
          <TabPanel value={tab}
index={2}>
            {!hasContacts ? (
              <Box sx={{ py: 4, textAlign: 'center' }}>
                <GroupsRoundedIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
                <Typography color="text.secondary"
fontWeight={700}>Sin contactos registrados</Typography>
                <Typography variant="caption"
color="text.disabled">Agrega manager, owner u otros contactos desde la edición de la tienda.</Typography>
              </Box>
            ) : (
              <Stack spacing={1}>
                {effectiveContacts.map((c, i) => {
                  const color = CONTACT_COLORS[c.type] ?? '#94a3b8';
                  return (
                    <Card key={i}
variant="outlined"
sx={{ borderRadius: 2.5, overflow: 'hidden' }}>
                      <Stack direction="row"
alignItems="center"
spacing={1.5}
sx={{ p: 1.75 }}>
                        <Avatar
                          sx={{ width: 40, height: 40, bgcolor: alpha(color, 0.15), color, border: '1px solid', borderColor: alpha(color, 0.3) }}
                        >
                          <AssignmentIndRoundedIcon fontSize="small" />
                        </Avatar>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography fontWeight={800}
fontSize={14}
noWrap>{c.name || '—'}</Typography>
                          <Chip
                            size="small"
                            label={CONTACT_LABELS[c.type] ?? c.type}
                            sx={{ height: 20, fontSize: 10, fontWeight: 700, bgcolor: alpha(color, 0.12), color, border: '1px solid', borderColor: alpha(color, 0.3) }}
                          />
                        </Box>
                        {c.phone && (
                          <Stack direction="row"
spacing={0.5}
alignItems="center">
                            <Typography fontSize={13}
fontWeight={700}
sx={{ fontVariantNumeric: 'tabular-nums' }}>{c.phone}</Typography>
                            <Tooltip title="Copiar teléfono">
                              <IconButton size="small"
onClick={() => copy(c.phone, 'Teléfono copiado')}
sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1.5 }}>
                                <ContentCopyRoundedIcon sx={{ fontSize: 13 }} />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Llamar">
                              <IconButton size="small"
href={`tel:${c.phone}`}
component="a"
sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1.5 }}>
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
        <Alert onClose={() => setToast({ open: false, msg: '' })}
severity="success"
variant="filled"
sx={{ borderRadius: 3, fontWeight: 900 }}>
          {toast.msg}
        </Alert>
      </Snackbar>
    </>
  );
}
