'use client';

import PreviewPhone from '@/components/application-ui/dialogs/preview/preview-phone';
import AvatarUploadLogo from '@/components/application-ui/upload/avatar/avatar-upload-logo';
import { campaignClient } from '@/services/campaing.service';
import { uploadCampaignImage } from '@/services/upload.service';
import CalendarTodayRoundedIcon from '@mui/icons-material/CalendarTodayRounded';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import FlashOnRoundedIcon from '@mui/icons-material/FlashOnRounded';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import RocketLaunchRoundedIcon from '@mui/icons-material/RocketLaunchRounded';
import {
  Alert,
  alpha,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Slide,
  Snackbar,
  Stack,
  Switch,
  TextField,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { DatePicker, DateTimePicker } from '@mui/x-date-pickers';
import { useMutation, useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { TransitionProps } from '@mui/material/transitions';
import React, { useEffect, useMemo, useState } from 'react';

const SlideUp = React.forwardRef(function T(
  props: TransitionProps & { children: React.ReactElement<unknown> },
  ref: React.Ref<unknown>
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const fmtMD = (d: Date | null) => (d ? format(d, 'M/d') : '');

function replaceDates(content: string, start: Date | null, end: Date | null, year: number | null): string {
  if (!content) return '';
  let r = content;
  if (start && end)
    r = r.replace(/\d{1,2}\/\d{1,2}[\u2013\u2014\-]\d{1,2}\/\d{1,2}/g, `${fmtMD(start)}\u2013${fmtMD(end)}`);
  if (year)
    r = r.replace(/(?<=\b)20\d{2}(?=\b)/g, String(year));
  return r;
}

// ── Steps config
const STEPS = [
  { label: 'Fechas', icon: <CalendarTodayRoundedIcon sx={{ fontSize: 14 }} /> },
  { label: 'Imagen', icon: <FlashOnRoundedIcon sx={{ fontSize: 14 }} /> },
  { label: 'Confirmar', icon: <CheckRoundedIcon sx={{ fontSize: 14 }} /> },
];

interface Props {
  open: boolean;
  onClose: () => void;
  storeId: string;
  provider: string;
  phoneNumber: string;
  totalAudience: number;
  onCreated?: () => void;
}

export default function QuickCampaignDialog({
  open, onClose, storeId, provider, phoneNumber, totalAudience, onCreated,
}: Props) {
  const theme = useTheme();
  const isMd = useMediaQuery(theme.breakpoints.up('md'));
  const isDark = theme.palette.mode === 'dark';

  const [step, setStep] = useState(0);
  const [startDate, setStart] = useState<Date | null>(null);
  const [endDate, setEnd] = useState<Date | null>(null);
  const [newImage, setNewImage] = useState<File | null>(null);
  const [yearOn, setYearOn] = useState(false);
  const [year, setYear] = useState(new Date().getFullYear());
  const [confirmOpen, setConfirm] = useState(false);
  const [snack, setSnack] = useState<{ open: boolean; msg: string; sev: 'success' | 'error' | 'warning' }>({ open: false, msg: '', sev: 'success' });

  const { data: last, isLoading } = useQuery({
    queryKey: ['lastCampaign', storeId],
    queryFn: () => campaignClient.getFilteredCampaigns({ storeId, limit: 1, page: 1 }),
    enabled: open && !!storeId,
    select: (d: any) => d?.data?.[0] ?? null,
  });

  useEffect(() => {
    if (!open) return;
    if (!startDate) { const d = new Date(); d.setHours(9, 0, 0, 0); setStart(d); }
    if (!endDate) { const d = new Date(); d.setDate(d.getDate() + 1); setEnd(d); }
  }, [open]);

  const baseContent: string = (last as any)?.content ?? '';
  const previewContent = useMemo(
    () => replaceDates(baseContent, startDate, endDate, yearOn ? year : null),
    [baseContent, startDate, endDate, yearOn, year]
  );
  const previewImage: File | string | null = newImage ?? (last as any)?.image ?? null;

  const mutation = useMutation({
    mutationFn: async () => {
      let imgUrl = (last as any)?.image ?? null;
      let imgPid = (last as any)?.imagePublicId ?? null;
      if (newImage) { const up = await uploadCampaignImage(newImage); imgUrl = up.url; imgPid = up.public_id; }
      return campaignClient.createCampaign({
        title: (last as any)?.title ? `${(last as any).title} (Quick)` : `Campaña ${fmtMD(startDate)}–${fmtMD(endDate)}`,
        description: (last as any)?.description ?? '',
        content: previewContent,
        type: imgUrl ? 'MMS' : 'SMS',
        startDate: startDate?.toISOString() as any,
        image: imgUrl, imagePublicId: imgPid,
        customAudience: totalAudience,
        platform: provider,
        sourceTn: phoneNumber ? `+${phoneNumber}` : '',
      } as any, storeId);
    },
    onSuccess: () => {
      setSnack({ open: true, msg: '¡Campaña creada! 🚀', sev: 'success' });
      setConfirm(false);
      setTimeout(() => { handleClose(); onCreated?.(); }, 1000);
    },
    onError: () => {
      setSnack({ open: true, msg: 'Error al crear. Intenta de nuevo.', sev: 'error' });
      setConfirm(false);
    },
  });

  const handleClose = () => {
    setStep(0); setStart(null); setEnd(null); setNewImage(null);
    setYearOn(false); setYear(new Date().getFullYear()); setConfirm(false);
    onClose();
  };

  // ── tokens
  const bg = isDark ? '#0d1117' : '#f8fafc';
  const surface = isDark ? '#161b22' : '#ffffff';
  const border = isDark ? alpha('#fff', 0.07) : alpha('#000', 0.07);
  const accent = theme.palette.primary.main;

  return (
    <>
      <Dialog
        open={open}
        onClose={handleClose}
        fullScreen={!isMd}
        TransitionComponent={SlideUp}
        maxWidth="md"
        fullWidth
        PaperProps={{
          elevation: 0,
          sx: {
            borderRadius: isMd ? 3 : 0,
            overflow: 'hidden',
            bgcolor: bg,
            border: `1px solid ${border}`,
            backgroundImage: 'none',
          },
        }}
      >
        {/* ── HEADER */}
        <DialogTitle sx={{ px: 3, py: 2, bgcolor: surface, borderBottom: `1px solid ${border}` }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            {/* Brand mark */}
            <Stack direction="row" alignItems="center" spacing={1.5}>
              <Box sx={{
                width: 36, height: 36, borderRadius: 1.5, flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                bgcolor: alpha(accent, 0.1),
              }}>
                <FlashOnRoundedIcon sx={{ fontSize: 18, color: accent }} />
              </Box>
              <Box>
                <Typography variant="subtitle1" fontWeight={700} lineHeight={1.1}>Quick Campaign</Typography>
                <Typography variant="caption" color="text.disabled">
                  Reutiliza el copy · solo cambia fechas e imagen
                </Typography>
              </Box>
            </Stack>

            {/* Compact step pills */}
            <Stack direction="row" spacing={0.5}>
              {STEPS.map((s, i) => {
                const done = step > i;
                const active = step === i;
                return (
                  <Box
                    key={s.label}
                    sx={{
                      display: 'flex', alignItems: 'center', gap: 0.5,
                      px: 1.5, py: 0.5, borderRadius: 5,
                      fontSize: 11, fontWeight: active ? 700 : 400,
                      color: done ? theme.palette.success.main : active ? accent : 'text.disabled',
                      bgcolor: done
                        ? alpha(theme.palette.success.main, 0.08)
                        : active
                          ? alpha(accent, 0.1)
                          : 'transparent',
                      border: `1px solid ${done
                        ? alpha(theme.palette.success.main, 0.2)
                        : active
                          ? alpha(accent, 0.25)
                          : border
                        }`,
                      transition: 'all 0.2s',
                      cursor: i < step ? 'pointer' : 'default',
                    }}
                    onClick={() => { if (i < step) setStep(i); }}
                  >
                    {done ? <CheckRoundedIcon sx={{ fontSize: 11 }} /> : s.icon}
                    <span style={{ display: isMd ? 'inline' : 'none' }}>{s.label}</span>
                  </Box>
                );
              })}
            </Stack>
          </Stack>
        </DialogTitle>

        {/* ── BODY */}
        <DialogContent sx={{ p: 0, display: 'flex', overflow: 'hidden', height: isMd ? 520 : 'auto' }}>
          {isLoading ? (
            <Box display="flex" alignItems="center" justifyContent="center" width="100%">
              <CircularProgress size={32} />
            </Box>
          ) : (
            <>
              {/* LEFT: form */}
              <Box
                sx={{
                  flex: '0 0 55%',
                  maxWidth: '55%',
                  p: 3,
                  overflowY: 'auto',
                  borderRight: `1px solid ${border}`,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 2.5,
                  ...((!isMd) && { flex: '1 1 100%', maxWidth: '100%', borderRight: 'none' }),
                }}
              >
                {/* STEP 0 */}
                {step === 0 && (
                  <>
                    {!(last as any) && (
                      <Alert severity="info" sx={{ borderRadius: 2, py: 0.5 }}>Sin campaña anterior — copy vacío.</Alert>
                    )}

                    {/* Start */}
                    <FieldBlock label="Inicio (fecha y hora)">
                      <DateTimePicker
                        value={startDate}
                        onChange={(v: any) => setStart(v ? (v instanceof Date ? v : v.toDate()) : null)}
                        sx={{ width: '100%' }}
                        slotProps={{ textField: { size: 'small', sx: fieldSx } }}
                      />
                      {startDate && (
                        <Alert
                          severity="info"
                          sx={{
                            mt: 1, py: 0, px: 1.5, borderRadius: 1.5,
                            fontSize: 12,
                            '& .MuiAlert-icon': { fontSize: 14, mr: 0.75 },
                          }}
                        >
                          Envío programado a las <strong>{format(startDate, 'h:mm a')}</strong>
                        </Alert>
                      )}
                    </FieldBlock>

                    {/* End */}
                    <FieldBlock label="Fin (validez)">
                      <DatePicker
                        value={endDate}
                        onChange={(v: any) => setEnd(v ? (v instanceof Date ? v : v.toDate()) : null)}
                        sx={{ width: '100%' }}
                        slotProps={{ textField: { size: 'small', sx: fieldSx } }}
                      />
                    </FieldBlock>

                    {/* Range badge */}
                    {startDate && endDate && (
                      <Box sx={{
                        px: 2, py: 1.5, borderRadius: 2,
                        bgcolor: alpha(theme.palette.success.main, isDark ? 0.1 : 0.06),
                        border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`,
                      }}>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <CheckRoundedIcon sx={{ color: 'success.main', fontSize: 15 }} />
                          <Typography variant="body2" fontWeight={500}>
                            Rango:&nbsp;
                            <Box component="span" sx={{ fontFamily: 'monospace', fontWeight: 800, color: 'success.main', fontSize: 14 }}>
                              {fmtMD(startDate)}–{fmtMD(endDate)}{yearOn ? `, ${year}` : ''}
                            </Box>
                          </Typography>
                        </Stack>
                      </Box>
                    )}

                    {/* Year toggle */}
                    <Box sx={{ px: 2, py: 1.5, borderRadius: 2, bgcolor: surface, border: `1px solid ${border}` }}>
                      <Stack direction="row" alignItems="center" justifyContent="space-between">
                        <Stack direction="row" alignItems="center" spacing={0.75}>
                          <Typography variant="body2">Incluir año en el copy</Typography>
                          <Tooltip title="Reemplaza el año de 4 dígitos automáticamente (ej. 2025 → 2026)">
                            <InfoOutlinedIcon sx={{ fontSize: 14, color: 'text.disabled' }} />
                          </Tooltip>
                        </Stack>
                        <Switch size="small" checked={yearOn} onChange={(e) => setYearOn(e.target.checked)} />
                      </Stack>
                      {yearOn && (
                        <Box mt={1.5}>
                          <TextField
                            type="number"
                            label="Año"
                            value={year}
                            onChange={(e) => {
                              const v = parseInt(e.target.value, 10);
                              if (!isNaN(v) && v >= 2020 && v <= 2099) setYear(v);
                            }}
                            inputProps={{ min: 2020, max: 2099 }}
                            size="small" fullWidth sx={fieldSx}
                          />
                        </Box>
                      )}
                    </Box>

                    {/* Copy snippet */}
                    {baseContent && (
                      <Box sx={{ px: 2, py: 1.5, borderRadius: 2, border: `1px dashed ${border}`, bgcolor: bg }}>
                        <Typography variant="caption" color="text.disabled" fontWeight={700} sx={{ textTransform: 'uppercase', letterSpacing: 0.7 }}>
                          Copy base
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.75, fontFamily: 'monospace', fontSize: 10.5, lineHeight: 1.6 }}>
                          {baseContent.length > 110 ? baseContent.slice(0, 110) + '…' : baseContent}
                        </Typography>
                      </Box>
                    )}
                  </>
                )}

                {/* STEP 1 */}
                {step === 1 && (
                  <>
                    <Box>
                      <Typography variant="subtitle2" fontWeight={700} mb={0.5}>Imagen de campaña</Typography>
                      <Typography variant="caption" color="text.disabled">Sube una imagen o reutiliza la anterior.</Typography>
                    </Box>
                    {(last as any)?.image && !newImage && (
                      <Alert severity="info" sx={{ borderRadius: 2, py: 0.5 }}>Se usará la imagen de la última campaña.</Alert>
                    )}
                    <Alert severity="warning" sx={{ borderRadius: 2, py: 0.5 }}>Máximo 500 KB para asegurar entrega MMS.</Alert>
                    <AvatarUploadLogo
                      label="Subir imagen"
                      initialUrl={(last as any)?.image}
                      onSelect={(file) => {
                        if (!file) { setNewImage(null); return; }
                        if (file.size > 500 * 1024) {
                          setSnack({ open: true, msg: 'Imagen supera 500 KB.', sev: 'error' });
                          return;
                        }
                        setNewImage(file);
                      }}
                    />
                    {newImage && (
                      <Chip
                        icon={<CheckRoundedIcon />}
                        label={`${newImage.name} · ${(newImage.size / 1024).toFixed(0)} KB`}
                        color="success" variant="outlined" size="small"
                      />
                    )}
                  </>
                )}

                {/* STEP 2 */}
                {step === 2 && (
                  <>
                    <Box>
                      <Typography variant="subtitle2" fontWeight={700} mb={0.5}>Resumen</Typography>
                      <Typography variant="caption" color="text.disabled">Revisa antes de crear.</Typography>
                    </Box>
                    <Box sx={{ borderRadius: 2, border: `1px solid ${border}`, overflow: 'hidden' }}>
                      {[
                        ['Inicio', startDate ? format(startDate, "MMM d, yyyy · h:mm a") : '--'],
                        ['Fin', endDate ? format(endDate, 'MMM d, yyyy') : '--'],
                        ['Rango SMS', `${fmtMD(startDate)}–${fmtMD(endDate)}${yearOn ? `, ${year}` : ''}`],
                        ['Tipo', previewImage ? 'MMS' : 'SMS'],
                        ['Audiencia', `${totalAudience.toLocaleString()} clientes`],
                        ['Número', `+${phoneNumber}`],
                      ].map(([label, value], i) => (
                        <Box key={label} sx={{
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                          px: 2, py: 1,
                          bgcolor: i % 2 ? (isDark ? alpha('#fff', 0.02) : alpha('#000', 0.016)) : 'transparent',
                        }}>
                          <Typography variant="caption" color="text.secondary">{label}</Typography>
                          <Typography variant="caption" fontWeight={700}>{value}</Typography>
                        </Box>
                      ))}
                    </Box>
                    <Box sx={{
                      p: 1.5, borderRadius: 2, border: `1px solid ${border}`,
                      fontFamily: 'monospace', fontSize: 11, lineHeight: 1.7,
                      color: 'text.secondary', whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                      maxHeight: 100, overflowY: 'auto', bgcolor: bg,
                    }}>
                      {previewContent || '(sin copy)'}
                    </Box>
                    <Chip
                      label={`${previewContent.length} caracteres`}
                      size="small" variant="outlined"
                      color={previewContent.length > 160 ? 'warning' : 'default'}
                    />
                  </>
                )}
              </Box>

              {/* RIGHT: phone preview */}
              {isMd && (
                <Box
                  sx={{
                    flex: '0 0 45%',
                    maxWidth: '45%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 2,
                    p: 4,
                    position: 'relative',
                    overflow: 'hidden',
                    bgcolor: bg,
                  }}
                >
                  {/* Subtle circular glow — nice but not garish */}
                  <Box sx={{
                    position: 'absolute',
                    width: 380, height: 380,
                    borderRadius: '50%',
                    background: `radial-gradient(circle, ${alpha(accent, isDark ? 0.07 : 0.04)} 0%, transparent 70%)`,
                    pointerEvents: 'none',
                  }} />

                  <Typography variant="overline" sx={{ fontSize: 9, letterSpacing: 2, color: 'text.disabled', position: 'relative' }}>
                    Vista Previa en Tiempo Real
                  </Typography>

                  {/* Phone — centered, generous size */}
                  <Box sx={{ width: '100%', maxWidth: 240, position: 'relative' }}>
                    <PreviewPhone content={previewContent} image={previewImage} fontSize={11} />
                  </Box>

                  <Chip
                    label={`${previewContent.length} chars · ${previewImage ? 'MMS' : 'SMS'}`}
                    size="small"
                    variant="outlined"
                    color={previewContent.length > 160 ? 'warning' : 'default'}
                    sx={{ fontSize: 10, position: 'relative' }}
                  />
                </Box>
              )}
            </>
          )}
        </DialogContent>

        {/* ── ACTIONS */}
        <Divider />
        <DialogActions sx={{ px: 2.5, py: 1.5, bgcolor: surface, justifyContent: 'space-between' }}>
          <Button
            size="small" color="inherit"
            onClick={step === 0 ? handleClose : () => setStep(s => s - 1)}
          >
            {step === 0 ? 'Cancelar' : '← Atrás'}
          </Button>

          {step < 2 ? (
            <Button
              size="small" variant="contained" disableElevation
              disabled={step === 0 && !(startDate && endDate)}
              onClick={() => setStep(s => s + 1)}
              sx={{ px: 2.5, borderRadius: 1.5 }}
            >
              Siguiente →
            </Button>
          ) : (
            <Button
              size="small" variant="contained" color="success" disableElevation
              startIcon={mutation.isPending ? <CircularProgress size={13} color="inherit" /> : <RocketLaunchRoundedIcon sx={{ fontSize: 15 }} />}
              onClick={() => setConfirm(true)}
              disabled={mutation.isPending}
              sx={{ px: 2.5, borderRadius: 1.5 }}
            >
              {mutation.isPending ? 'Creando…' : 'Crear campaña'}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* ── CONFIRM */}
      <Dialog open={confirmOpen} onClose={() => setConfirm(false)} maxWidth="xs" fullWidth>
        <DialogTitle>¿Crear campaña?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            Rango: <strong>{fmtMD(startDate)}–{fmtMD(endDate)}{yearOn ? `, ${year}` : ''}</strong>
            {' · '}<strong>{totalAudience.toLocaleString()} clientes</strong>
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button size="small" color="inherit" onClick={() => setConfirm(false)}>Cancelar</Button>
          <Button
            size="small" variant="contained" color="success" disableElevation
            disabled={mutation.isPending}
            onClick={() => mutation.mutate()}
            startIcon={mutation.isPending ? <CircularProgress size={13} color="inherit" /> : <CheckRoundedIcon sx={{ fontSize: 15 }} />}
          >
            {mutation.isPending ? 'Creando…' : 'Confirmar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── SNACK */}
      <Snackbar
        open={snack.open} autoHideDuration={4000}
        onClose={() => setSnack(s => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity={snack.sev} variant="filled" onClose={() => setSnack(s => ({ ...s, open: false }))} sx={{ borderRadius: 2 }}>
          {snack.msg}
        </Alert>
      </Snackbar>
    </>
  );
}

// ── micro
function FieldBlock({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Box>
      <Typography variant="caption" fontWeight={600} color="text.secondary"
        sx={{ display: 'block', mb: 0.75, textTransform: 'uppercase', letterSpacing: 0.7, fontSize: 10.5 }}>
        {label}
      </Typography>
      {children}
    </Box>
  );
}

const fieldSx = { '& .MuiOutlinedInput-root': { borderRadius: 1.5 } };
