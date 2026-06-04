'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Autocomplete,
  Avatar,
  Box,
  Button,
  CircularProgress,
  Divider,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Tooltip,
  Typography,
  alpha,
  useTheme,
} from '@mui/material';
import PaletteOutlinedIcon from '@mui/icons-material/PaletteOutlined';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import BrandingWatermarkOutlinedIcon from '@mui/icons-material/BrandingWatermarkOutlined';
import TextFieldsOutlinedIcon from '@mui/icons-material/TextFieldsOutlined';
import SmartphoneOutlinedIcon from '@mui/icons-material/SmartphoneOutlined';
import { useBrands } from '@/hooks/fetching/brands/useBrands';
import { updateStorePatch, Store } from '@/services/store.service';
import { uploadCampaignImage } from '@/services/upload.service';
import AvatarUploadLogo from '@/components/application-ui/upload/avatar/avatar-upload-logo';
import toast from 'react-hot-toast';
import { useQueryClient } from '@tanstack/react-query';

// ─── Types ────────────────────────────────────────────────────────────────────

interface MmsTheme {
  primaryColor: string;
  primaryDark: string;
  accentColor: string;
  textOnPrimary: string;
  footerBg: string;
  logoUrl: string;
  ctaText: string;
  footerText: string;
  headerStyle: 'classic' | 'modern' | 'minimal' | 'bold';
}

interface StoreBrandPanelProps {
  storeId: string;
  store: Store;
}

const DEFAULTS: MmsTheme = {
  primaryColor: '#DC1F26',
  primaryDark: '#B01820',
  accentColor: '#FFD700',
  textOnPrimary: '#FFFFFF',
  footerBg: '#333333',
  logoUrl: '',
  ctaText: 'SHOW THIS AT CHECKOUT:',
  footerText: 'Powered by Sweepstouch | Unsubscribe: Reply STOP',
  headerStyle: 'classic',
};

// ─── Color field ─────────────────────────────────────────────────────────────

function ColorField({
  label,
  description,
  value,
  onChange,
}: {
  label: string;
  description: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <Box>
      <Typography sx={{ fontSize: 13, fontWeight: 600, color: 'text.primary', mb: 0.5 }}>
        {label}
      </Typography>
      <Typography sx={{ fontSize: 11.5, color: 'text.secondary', mb: 1, lineHeight: 1.45 }}>
        {description}
      </Typography>
      <Stack direction="row" spacing={1} alignItems="center">
        <Tooltip title="Click to pick color" placement="top">
          <Box
            component="label"
            sx={{
              width: 46,
              height: 46,
              borderRadius: '12px',
              bgcolor: value,
              cursor: 'pointer',
              border: '2px solid',
              borderColor: 'divider',
              flexShrink: 0,
              position: 'relative',
              overflow: 'hidden',
              transition: 'transform 0.15s ease, box-shadow 0.15s ease',
              boxShadow: `0 2px 8px ${value}40`,
              '&:hover': { transform: 'scale(1.08)', boxShadow: `0 4px 14px ${value}60` },
            }}
          >
            <input
              type="color"
              value={value.length === 7 ? value : DEFAULTS.primaryColor}
              onChange={(e) => onChange(e.target.value)}
              style={{
                position: 'absolute',
                width: '200%',
                height: '200%',
                top: '-50%',
                left: '-50%',
                opacity: 0,
                cursor: 'pointer',
              }}
            />
          </Box>
        </Tooltip>
        <TextField
          size="small"
          value={value}
          onChange={(e) => {
            const v = e.target.value;
            if (/^#[0-9a-fA-F]{0,6}$/.test(v)) onChange(v);
          }}
          sx={{
            flex: 1,
            '& .MuiOutlinedInput-root': {
              borderRadius: '10px',
              fontFamily: 'monospace',
              fontSize: 13,
            },
            '& .MuiInputBase-input': {
              textTransform: 'uppercase',
              fontFamily: 'monospace',
              fontSize: 13,
              letterSpacing: '0.05em',
            },
          }}
          inputProps={{ maxLength: 7 }}
        />
      </Stack>
    </Box>
  );
}

// ─── Section card ─────────────────────────────────────────────────────────────

function SectionCard({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Paper
      variant="outlined"
      sx={{ borderRadius: 3, overflow: 'hidden' }}
    >
      <Stack direction="row" spacing={1.25} alignItems="center" sx={{ px: 2.5, py: 2, bgcolor: (t) => alpha(t.palette.background.default, 0.6) }}>
        <Box sx={{ color: 'primary.main', display: 'flex' }}>{icon}</Box>
        <Typography variant="subtitle2" fontWeight={700}>
          {title}
        </Typography>
      </Stack>
      <Divider />
      <Box sx={{ p: 2.5 }}>{children}</Box>
    </Paper>
  );
}

// ─── Phone preview ────────────────────────────────────────────────────────────

function PhonePreview({ theme }: { theme: MmsTheme }) {
  return (
    <Box
      sx={{
        width: 200,
        borderRadius: '28px',
        border: '5px solid',
        borderColor: (t) => t.palette.mode === 'dark' ? '#1e293b' : '#0f172a',
        overflow: 'hidden',
        boxShadow: '0 20px 60px rgba(0,0,0,0.22)',
        bgcolor: '#f1f5f9',
        userSelect: 'none',
      }}
    >
      {/* Notch */}
      <Box sx={{ height: 20, bgcolor: (t) => t.palette.mode === 'dark' ? '#1e293b' : '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Box sx={{ width: 48, height: 5, bgcolor: (t) => t.palette.mode === 'dark' ? '#0f172a' : '#1e293b', borderRadius: '3px' }} />
      </Box>

      {/* Header */}
      <Box
        sx={{
          background: `linear-gradient(135deg, ${theme.primaryColor} 0%, ${theme.primaryDark} 100%)`,
          py: 1.5,
          px: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 52,
        }}
      >
        {theme.logoUrl ? (
          <Box
            component="img"
            src={theme.logoUrl}
            alt="logo"
            sx={{ height: 32, maxWidth: 140, objectFit: 'contain' }}
            onError={(e: any) => { e.target.style.display = 'none'; }}
          />
        ) : (
          <Typography sx={{ color: theme.textOnPrimary, fontWeight: 800, fontSize: 11, letterSpacing: '0.05em', textAlign: 'center' }}>
            STORE LOGO
          </Typography>
        )}
      </Box>

      {/* Body */}
      <Box sx={{ bgcolor: '#ffffff', p: 1.5 }}>
        {/* Name field mock */}
        <Box sx={{ mb: 1.25 }}>
          <Box sx={{ height: 7, width: '45%', bgcolor: '#e2e8f0', borderRadius: 1, mb: 0.75 }} />
          <Box sx={{ height: 30, bgcolor: '#f8fafc', borderRadius: '8px', border: '1.5px solid #e2e8f0' }} />
        </Box>
        {/* Email mock */}
        <Box sx={{ mb: 1.25 }}>
          <Box sx={{ height: 7, width: '60%', bgcolor: '#e2e8f0', borderRadius: 1, mb: 0.75 }} />
          <Box sx={{ height: 30, bgcolor: '#f8fafc', borderRadius: '8px', border: '1.5px solid #e2e8f0' }} />
        </Box>
        {/* Accent badge */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 1.25 }}>
          <Box sx={{ height: 14, width: 44, bgcolor: theme.accentColor, borderRadius: '4px', opacity: 0.9 }} />
          <Box sx={{ height: 7, flex: 1, bgcolor: '#f1f5f9', borderRadius: 1 }} />
        </Box>
        {/* CTA button */}
        <Box
          sx={{
            height: 32,
            bgcolor: theme.primaryColor,
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Typography sx={{ color: theme.textOnPrimary, fontSize: 9, fontWeight: 800, letterSpacing: '0.03em' }}>
            GUARDAR CAMBIOS
          </Typography>
        </Box>
      </Box>

      {/* Footer */}
      <Box sx={{ bgcolor: theme.footerBg, py: 1.25, px: 1, textAlign: 'center' }}>
        <Typography sx={{ color: '#9ca3af', fontSize: 7.5, lineHeight: 1.45 }}>
          {theme.footerText || 'Powered by Sweepstouch'}
        </Typography>
      </Box>
    </Box>
  );
}

// ─── Main panel ───────────────────────────────────────────────────────────────

export default function StoreBrandPanel({ storeId, store }: StoreBrandPanelProps) {
  const theme = useTheme();
  const queryClient = useQueryClient();
  const { data: brands = [], isLoading: brandsLoading } = useBrands();

  const existing: MmsTheme = {
    ...DEFAULTS,
    ...(store.mmsTheme || {}),
  };

  const [mms, setMms] = useState<MmsTheme>(existing);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [selectedBrand, setSelectedBrand] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Resolve current brand from store
  useEffect(() => {
    const storeBrandId = (store as any).brand;
    if (storeBrandId && brands.length > 0) {
      const found = brands.find(
        (b: any) => b._id === storeBrandId || b.id === storeBrandId
      );
      if (found) setSelectedBrand(found);
    }
  }, [brands, store]);

  const set = useCallback((key: keyof MmsTheme, value: string) => {
    setMms((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      let finalLogoUrl = mms.logoUrl;

      if (logoFile) {
        const res = await uploadCampaignImage(logoFile, 'store-logos');
        finalLogoUrl = res.url;
      }

      const body: any = {
        mmsTheme: { ...mms, logoUrl: finalLogoUrl },
      };

      if (selectedBrand) {
        body.brand = selectedBrand._id || selectedBrand.id;
      }

      await updateStorePatch(storeId, body);
      await queryClient.invalidateQueries({ queryKey: ['store', storeId] });

      setMms((prev) => ({ ...prev, logoUrl: finalLogoUrl }));
      setLogoFile(null);
      setSaved(true);
      toast.success('Branding guardado');
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      {/* Header */}
      <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ sm: 'center' }} justifyContent="space-between" spacing={2} sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h6" fontWeight={700}>
            Branding de la Tienda
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
            Logo, colores y apariencia en mensajes MMS y formularios
          </Typography>
        </Box>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={saving}
          startIcon={
            saving ? (
              <CircularProgress size={16} color="inherit" />
            ) : saved ? (
              <CheckRoundedIcon sx={{ fontSize: 18 }} />
            ) : (
              <SaveOutlinedIcon sx={{ fontSize: 18 }} />
            )
          }
          sx={{
            borderRadius: 2,
            fontWeight: 700,
            px: 2.5,
            bgcolor: saved ? 'success.main' : undefined,
            '&:hover': { bgcolor: saved ? 'success.dark' : undefined },
            transition: 'background-color 0.25s ease',
            flexShrink: 0,
          }}
        >
          {saving ? 'Guardando…' : saved ? 'Guardado' : 'Guardar Cambios'}
        </Button>
      </Stack>

      {/* Two-column layout */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: '1fr 240px' },
          gap: 3,
          alignItems: 'start',
        }}
      >
        {/* ── Left: form ───────────────────────────────────────────────── */}
        <Stack spacing={3}>

          {/* Brand & Logo */}
          <SectionCard
            icon={<BrandingWatermarkOutlinedIcon fontSize="small" />}
            title="Identidad"
          >
            <Stack spacing={3}>
              {/* Brand autocomplete */}
              <Box>
                <Typography sx={{ fontSize: 13, fontWeight: 600, color: 'text.primary', mb: 0.5 }}>
                  Marca
                </Typography>
                <Typography sx={{ fontSize: 11.5, color: 'text.secondary', mb: 1, lineHeight: 1.45 }}>
                  Asocia esta tienda a una marca del catálogo
                </Typography>
                <Autocomplete
                  options={brands}
                  loading={brandsLoading}
                  value={selectedBrand}
                  onChange={(_, val) => {
                    setSelectedBrand(val);
                    if (val?.image && !mms.logoUrl) {
                      setMms((prev) => ({ ...prev, logoUrl: val.image }));
                    }
                    setSaved(false);
                  }}
                  getOptionLabel={(o: any) => o.name || ''}
                  isOptionEqualToValue={(a: any, b: any) =>
                    (a._id || a.id) === (b._id || b.id)
                  }
                  renderOption={(props, opt: any) => (
                    <Box component="li" {...props} sx={{ gap: 1.5 }}>
                      <Avatar
                        src={opt.image}
                        variant="rounded"
                        sx={{ width: 28, height: 28, bgcolor: 'action.hover', flexShrink: 0 }}
                      />
                      <Typography variant="body2" fontWeight={500}>
                        {opt.name}
                      </Typography>
                    </Box>
                  )}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      placeholder="Buscar marca…"
                      size="small"
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                      InputProps={{
                        ...params.InputProps,
                        startAdornment: selectedBrand?.image ? (
                          <Avatar
                            src={selectedBrand.image}
                            variant="rounded"
                            sx={{ width: 22, height: 22, mr: 0.5, flexShrink: 0 }}
                          />
                        ) : undefined,
                        endAdornment: (
                          <>
                            {brandsLoading && <CircularProgress size={14} />}
                            {params.InputProps.endAdornment}
                          </>
                        ),
                      }}
                    />
                  )}
                />
              </Box>

              <Divider />

              {/* Logo upload */}
              <Box>
                <Typography sx={{ fontSize: 13, fontWeight: 600, color: 'text.primary', mb: 0.5 }}>
                  Logo para MMS
                </Typography>
                <Typography sx={{ fontSize: 11.5, color: 'text.secondary', mb: 1.5, lineHeight: 1.45 }}>
                  Aparece en el header del formulario del cliente y en mensajes SMS/MMS
                </Typography>
                <AvatarUploadLogo
                  label="Logo de la tienda"
                  initialUrl={mms.logoUrl}
                  onSelect={(file, url) => {
                    setLogoFile(file);
                    if (url) setMms((prev) => ({ ...prev, logoUrl: url }));
                    setSaved(false);
                  }}
                />
              </Box>
            </Stack>
          </SectionCard>

          {/* Colors */}
          <SectionCard
            icon={<PaletteOutlinedIcon fontSize="small" />}
            title="Colores"
          >
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                gap: 3,
              }}
            >
              <ColorField
                label="Color Primario"
                description="Header, botones principales y stepper"
                value={mms.primaryColor}
                onChange={(v) => set('primaryColor', v)}
              />
              <ColorField
                label="Color Primario Oscuro"
                description="Gradiente del hero y sombras de botón"
                value={mms.primaryDark}
                onChange={(v) => set('primaryDark', v)}
              />
              <ColorField
                label="Color de Acento"
                description="Badges, fechas y elementos destacados"
                value={mms.accentColor}
                onChange={(v) => set('accentColor', v)}
              />
              <ColorField
                label="Texto sobre Primario"
                description="Color del texto encima de botones y header"
                value={mms.textOnPrimary}
                onChange={(v) => set('textOnPrimary', v)}
              />
              <ColorField
                label="Fondo del Footer"
                description="Fondo de la sección inferior en formularios"
                value={mms.footerBg}
                onChange={(v) => set('footerBg', v)}
              />
            </Box>
          </SectionCard>

          {/* Texts */}
          <SectionCard
            icon={<TextFieldsOutlinedIcon fontSize="small" />}
            title="Textos y Estilo"
          >
            <Stack spacing={2.5}>
              <Box>
                <Typography sx={{ fontSize: 13, fontWeight: 600, color: 'text.primary', mb: 0.5 }}>
                  Texto CTA
                </Typography>
                <Typography sx={{ fontSize: 11.5, color: 'text.secondary', mb: 1 }}>
                  Instrucción que aparece en el cupón impreso
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  value={mms.ctaText}
                  onChange={(e) => { set('ctaText', e.target.value); }}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                />
              </Box>

              <Box>
                <Typography sx={{ fontSize: 13, fontWeight: 600, color: 'text.primary', mb: 0.5 }}>
                  Texto del Footer
                </Typography>
                <Typography sx={{ fontSize: 11.5, color: 'text.secondary', mb: 1 }}>
                  Se muestra al pie del formulario y mensajes
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  value={mms.footerText}
                  onChange={(e) => { set('footerText', e.target.value); }}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                />
              </Box>

              <Box>
                <Typography sx={{ fontSize: 13, fontWeight: 600, color: 'text.primary', mb: 0.5 }}>
                  Estilo de Header
                </Typography>
                <Typography sx={{ fontSize: 11.5, color: 'text.secondary', mb: 1 }}>
                  Variante visual del encabezado en el formulario
                </Typography>
                <Select
                  size="small"
                  value={mms.headerStyle}
                  onChange={(e) => set('headerStyle', e.target.value as MmsTheme['headerStyle'])}
                  sx={{ borderRadius: '10px', minWidth: 180 }}
                >
                  <MenuItem value="classic">Classic</MenuItem>
                  <MenuItem value="modern">Modern</MenuItem>
                  <MenuItem value="minimal">Minimal</MenuItem>
                  <MenuItem value="bold">Bold</MenuItem>
                </Select>
              </Box>
            </Stack>
          </SectionCard>
        </Stack>

        {/* ── Right: live preview ───────────────────────────────────────── */}
        <Box
          sx={{
            position: { lg: 'sticky' },
            top: { lg: 88 },
          }}
        >
          <Paper
            variant="outlined"
            sx={{ borderRadius: 3, p: 2.5, textAlign: 'center' }}
          >
            <Stack direction="row" spacing={1} alignItems="center" justifyContent="center" sx={{ mb: 2 }}>
              <SmartphoneOutlinedIcon fontSize="small" sx={{ color: 'text.secondary' }} />
              <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Vista previa
              </Typography>
            </Stack>
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <PhonePreview theme={mms} />
            </Box>
            <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mt: 2, lineHeight: 1.5 }}>
              Actualiza en tiempo real al cambiar los colores
            </Typography>
          </Paper>
        </Box>
      </Box>
    </Box>
  );
}
