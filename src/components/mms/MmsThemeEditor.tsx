'use client';

import React, { useState, useCallback, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Switch,
  FormControlLabel,
  Grid,
  Button,
  Alert,
  Divider,
  Stack,
  Chip,
} from '@mui/material';
import PaletteIcon from '@mui/icons-material/Palette';
import SaveIcon from '@mui/icons-material/Save';
import RestoreIcon from '@mui/icons-material/Restore';
import axios from 'axios';

export interface MmsTheme {
  primaryColor: string;
  primaryDark: string;
  accentColor: string;
  textOnPrimary: string;
  footerBg: string;
  logoUrl: string;
  headerStyle: string;
  showQr: boolean;
  showBarcode: boolean;
  customCss: string;
  ctaText: string;
  footerText: string;
}

const DEFAULT_THEME: MmsTheme = {
  primaryColor: '#DC1F26',
  primaryDark: '#B01820',
  accentColor: '#FFD700',
  textOnPrimary: '#FFFFFF',
  footerBg: '#333333',
  logoUrl: '',
  headerStyle: 'classic',
  showQr: true,
  showBarcode: true,
  customCss: '',
  ctaText: 'SHOW THIS AT CHECKOUT:',
  footerText: 'Powered by Sweepstouch | Unsubscribe: Reply STOP',
};

// Popular color presets for quick selection
const PRESETS = [
  { name: 'Classic Red', primary: '#DC1F26', accent: '#FFD700', footer: '#333333' },
  { name: 'Ocean Blue', primary: '#1565C0', accent: '#FFD54F', footer: '#0D47A1' },
  { name: 'Forest Green', primary: '#2E7D32', accent: '#FFAB00', footer: '#1B5E20' },
  { name: 'Royal Purple', primary: '#6A1B9A', accent: '#FFD600', footer: '#4A148C' },
  { name: 'Sunset Orange', primary: '#E65100', accent: '#FFF176', footer: '#BF360C' },
  { name: 'Midnight', primary: '#263238', accent: '#00E5FF', footer: '#1a1a1a' },
  { name: 'Hot Pink', primary: '#C2185B', accent: '#F8BBD0', footer: '#880E4F' },
  { name: 'Teal', primary: '#00796B', accent: '#FFD740', footer: '#004D40' },
];

interface Props {
  storeSlug: string;
  theme: Partial<MmsTheme>;
  onThemeChange: (theme: Partial<MmsTheme>) => void;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

export default function MmsThemeEditor({ storeSlug, theme, onThemeChange }: Props) {
  const [localTheme, setLocalTheme] = useState<MmsTheme>({ ...DEFAULT_THEME, ...theme });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  // Sync parent changes
  useEffect(() => {
    setLocalTheme((prev) => ({ ...prev, ...theme }));
  }, [theme]);

  const updateField = useCallback(
    (field: keyof MmsTheme, value: any) => {
      const updated = { ...localTheme, [field]: value };
      setLocalTheme(updated);
      onThemeChange(updated);
    },
    [localTheme, onThemeChange]
  );

  const applyPreset = useCallback(
    (preset: (typeof PRESETS)[0]) => {
      const updated = {
        ...localTheme,
        primaryColor: preset.primary,
        primaryDark: preset.primary + 'CC', // slightly transparent for gradient
        accentColor: preset.accent,
        footerBg: preset.footer,
      };
      setLocalTheme(updated);
      onThemeChange(updated);
    },
    [localTheme, onThemeChange]
  );

  const resetToDefaults = useCallback(() => {
    setLocalTheme({ ...DEFAULT_THEME });
    onThemeChange(DEFAULT_THEME);
  }, [onThemeChange]);

  const handleSave = useCallback(async () => {
    if (!storeSlug) return;
    setSaving(true);
    setError('');
    setSaved(false);

    try {
      const token = localStorage.getItem('uifort-authentication');
      await axios.patch(
        `${API_URL}/store/by-slug/${storeSlug}`,
        { mmsTheme: localTheme },
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error saving theme');
    } finally {
      setSaving(false);
    }
  }, [storeSlug, localTheme]);

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
        <PaletteIcon fontSize="small" />
        Store MMS Theme
      </Typography>

      {/* Quick Presets */}
      <Typography variant="subtitle2" sx={{ mb: 1 }}>
        Quick Presets:
      </Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
        {PRESETS.map((preset) => (
          <Chip
            key={preset.name}
            label={preset.name}
            size="small"
            onClick={() => applyPreset(preset)}
            sx={{
              cursor: 'pointer',
              borderLeft: `4px solid ${preset.primary}`,
              '&:hover': { transform: 'scale(1.05)' },
              transition: 'transform 0.15s',
            }}
          />
        ))}
      </Box>

      <Divider sx={{ mb: 2 }} />

      {/* Color Inputs */}
      <Grid container spacing={2}>
        <Grid item xs={6}>
          <Typography variant="caption" color="text.secondary">
            Primary Color
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <input
              type="color"
              value={localTheme.primaryColor}
              onChange={(e) => updateField('primaryColor', e.target.value)}
              style={{ width: 36, height: 36, border: 'none', cursor: 'pointer', borderRadius: 4 }}
            />
            <TextField
              value={localTheme.primaryColor}
              onChange={(e) => updateField('primaryColor', e.target.value)}
              size="small"
              variant="standard"
              sx={{ flex: 1 }}
              inputProps={{ style: { fontSize: 13, fontFamily: 'monospace' } }}
            />
          </Box>
        </Grid>
        <Grid item xs={6}>
          <Typography variant="caption" color="text.secondary">
            Gradient Dark
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <input
              type="color"
              value={localTheme.primaryDark}
              onChange={(e) => updateField('primaryDark', e.target.value)}
              style={{ width: 36, height: 36, border: 'none', cursor: 'pointer', borderRadius: 4 }}
            />
            <TextField
              value={localTheme.primaryDark}
              onChange={(e) => updateField('primaryDark', e.target.value)}
              size="small"
              variant="standard"
              sx={{ flex: 1 }}
              inputProps={{ style: { fontSize: 13, fontFamily: 'monospace' } }}
            />
          </Box>
        </Grid>
        <Grid item xs={6}>
          <Typography variant="caption" color="text.secondary">
            Accent (badges, dates)
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <input
              type="color"
              value={localTheme.accentColor}
              onChange={(e) => updateField('accentColor', e.target.value)}
              style={{ width: 36, height: 36, border: 'none', cursor: 'pointer', borderRadius: 4 }}
            />
            <TextField
              value={localTheme.accentColor}
              onChange={(e) => updateField('accentColor', e.target.value)}
              size="small"
              variant="standard"
              sx={{ flex: 1 }}
              inputProps={{ style: { fontSize: 13, fontFamily: 'monospace' } }}
            />
          </Box>
        </Grid>
        <Grid item xs={6}>
          <Typography variant="caption" color="text.secondary">
            Footer Background
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <input
              type="color"
              value={localTheme.footerBg}
              onChange={(e) => updateField('footerBg', e.target.value)}
              style={{ width: 36, height: 36, border: 'none', cursor: 'pointer', borderRadius: 4 }}
            />
            <TextField
              value={localTheme.footerBg}
              onChange={(e) => updateField('footerBg', e.target.value)}
              size="small"
              variant="standard"
              sx={{ flex: 1 }}
              inputProps={{ style: { fontSize: 13, fontFamily: 'monospace' } }}
            />
          </Box>
        </Grid>
      </Grid>

      <Divider sx={{ my: 2 }} />

      {/* Text & Logo */}
      <TextField
        fullWidth
        label="Store Logo URL"
        value={localTheme.logoUrl}
        onChange={(e) => updateField('logoUrl', e.target.value)}
        size="small"
        sx={{ mb: 2 }}
        placeholder="https://example.com/logo.png"
      />
      <TextField
        fullWidth
        label="CTA Text"
        value={localTheme.ctaText}
        onChange={(e) => updateField('ctaText', e.target.value)}
        size="small"
        sx={{ mb: 2 }}
      />
      <TextField
        fullWidth
        label="Footer Text"
        value={localTheme.footerText}
        onChange={(e) => updateField('footerText', e.target.value)}
        size="small"
        sx={{ mb: 2 }}
      />

      {/* Toggles */}
      <Stack direction="row" spacing={3} sx={{ mb: 2 }}>
        <FormControlLabel
          control={
            <Switch
              checked={localTheme.showBarcode}
              onChange={(e) => updateField('showBarcode', e.target.checked)}
              size="small"
            />
          }
          label="Show Barcode"
        />
        <FormControlLabel
          control={
            <Switch
              checked={localTheme.showQr}
              onChange={(e) => updateField('showQr', e.target.checked)}
              size="small"
            />
          }
          label="Show QR Code"
        />
      </Stack>

      {/* Color Preview Strip */}
      <Box sx={{ display: 'flex', height: 24, borderRadius: 1, overflow: 'hidden', mb: 2 }}>
        <Box sx={{ flex: 1, background: localTheme.primaryColor }} />
        <Box sx={{ flex: 1, background: localTheme.primaryDark }} />
        <Box sx={{ flex: 1, background: localTheme.accentColor }} />
        <Box sx={{ flex: 1, background: localTheme.footerBg }} />
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* Actions */}
      <Stack direction="row" spacing={2}>
        <Button
          variant="outlined"
          onClick={resetToDefaults}
          startIcon={<RestoreIcon />}
          size="small"
        >
          Reset
        </Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={!storeSlug || saving}
          startIcon={<SaveIcon />}
          size="small"
          sx={{
            background: `linear-gradient(135deg, ${localTheme.primaryColor} 0%, ${localTheme.primaryDark} 100%)`,
            '&:hover': { opacity: 0.9 },
          }}
        >
          {saving ? 'Saving...' : saved ? '✅ Saved!' : 'Save Theme to Store'}
        </Button>
      </Stack>
    </Box>
  );
}
