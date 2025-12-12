'use client';

import StoreMap from '@/components/application-ui/map/store-map';
import { Store } from '@/services/store.service';
import {
  ContentCopyOutlined as CopyIcon,
  PeopleAlt as PeopleIcon,
  VisibilityOffOutlined as VisibilityOffIcon,
  VisibilityOutlined as VisibilityOnIcon,
  WhatsApp as WhatsAppIcon,
} from '@mui/icons-material';
import {
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  Grid,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

// Mock data for credentials and campaign status
const MOCK_PASSWORD = 'ABC123';
const MOCK_CAMPAIGN_STATUS = {
  sentInLastTwoWeeks: Math.random() > 0.5, // Mock status
};

// Placeholder for Mapbox Token (should be defined in .env)
const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || 'MOCK_MAPBOX_TOKEN';

interface StoreInfoSimplifiedProps {
  store: Store;
}

const StoreInfoSimplified: React.FC<StoreInfoSimplifiedProps> = ({ store }) => {
  const { t } = useTranslation();
  const [showPassword, setShowPassword] = useState(false);

  // --- WhatsApp Share Logic ---
  const handleShareWhatsApp = () => {
    const campaignStatusText = MOCK_CAMPAIGN_STATUS.sentInLastTwoWeeks
      ? 'Sí ha enviado campañas en las últimas 2 semanas.'
      : 'No ha enviado campañas en las últimas 2 semanas.';

    const message = `
*Reporte de Tienda*
*Nombre:* ${store.name || 'N/A'}
*Dirección:* ${store.address || 'N/A'}
*Audiencia Total:* ${store.customerCount?.toLocaleString() || 0} usuarios
*Estado de Campañas:* ${campaignStatusText}
    `.trim();

    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  // --- Map Coordinates ---
  const lng = store.lng || -74.006; // Default to NYC if no coords
  const lat = store.lat || 40.7128;
  const hasCoords = !!store.lng && !!store.lat;

  // --- Copy Logic (Mock) ---
  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    alert(`${label} copiado: ${text}`);
  };

  return (
    <Box>
      <Card
        variant="outlined"
        sx={{ mb: 3 }}
      >
        <CardContent>
          <Grid
            container
            spacing={3}
          >
            {/* Columna de Información Básica y Audiencia */}
            <Grid
              item
              xs={12}
              md={6}
            >
              <Typography
                variant="h6"
                gutterBottom
              >
                {t('General Information')}
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <Stack spacing={2}>
                {/* Nombre */}
                <TextField
                  label={t('Store Name')}
                  value={store.name || 'N/A'}
                  fullWidth
                  InputProps={{ readOnly: true }}
                  size="small"
                />
                {/* Dirección */}
                <TextField
                  label={t('Address')}
                  value={store.address || 'N/A'}
                  fullWidth
                  InputProps={{ readOnly: true }}
                  size="small"
                />
                {/* Zipcode */}
                <TextField
                  label={t('Zipcode')}
                  value={store.zipCode || 'N/A'}
                  fullWidth
                  InputProps={{ readOnly: true }}
                  size="small"
                />
                {/* Teléfono */}
                <TextField
                  label={t('Phone')}
                  value={store.phoneNumber || 'N/A'}
                  fullWidth
                  InputProps={{ readOnly: true }}
                  size="small"
                />
                {/* Email */}
                <TextField
                  label={t('Email')}
                  value={store.email || 'N/A'}
                  fullWidth
                  InputProps={{ readOnly: true }}
                  size="small"
                />
              </Stack>

              <Divider sx={{ my: 3 }} />

              {/* Audiencia y WhatsApp */}
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                spacing={2}
              >
                <Stack
                  direction="row"
                  alignItems="center"
                  spacing={1}
                >
                  <PeopleIcon color="primary" />
                  <Typography
                    variant="subtitle1"
                    fontWeight="bold"
                  >
                    {t('Audience')}: {store.customerCount?.toLocaleString() || 0}
                  </Typography>
                </Stack>
                <Button
                  variant="contained"
                  color="success"
                  startIcon={<WhatsAppIcon />}
                  onClick={handleShareWhatsApp}
                >
                  {t('Share by WhatsApp')}
                </Button>
              </Stack>

              <Divider sx={{ my: 3 }} />

              {/* Credenciales (Mock) */}
              <Typography
                variant="h6"
                gutterBottom
              >
                {t('Store Credentials (Mock)')}
              </Typography>
              <Stack
                direction="row"
                spacing={2}
              >
                <TextField
                  label={t('Access Code')}
                  value={store.accessCode || 'N/A'}
                  fullWidth
                  InputProps={{
                    readOnly: true,
                    endAdornment: (
                      <InputAdornment position="end">
                        <Tooltip title={t('Copy')}>
                          <IconButton
                            onClick={() => handleCopy(store.accessCode || '', t('Access Code'))}
                            edge="end"
                            size="small"
                          >
                            <CopyIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </InputAdornment>
                    ),
                  }}
                  size="small"
                />
                <TextField
                  label={t('Password')}
                  value={MOCK_PASSWORD}
                  type={showPassword ? 'text' : 'password'}
                  fullWidth
                  size="small"
                  InputProps={{
                    readOnly: true,
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          edge="end"
                          onClick={() => setShowPassword((s) => !s)}
                          aria-label={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                          size="small"
                        >
                          {showPassword ? (
                            <VisibilityOffIcon fontSize="small" />
                          ) : (
                            <VisibilityOnIcon fontSize="small" />
                          )}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Stack>
            </Grid>

            {/* Columna del Mapa */}
            <Grid
              item
              xs={12}
              md={6}
            >
              <Typography
                variant="h6"
                gutterBottom
              >
                {t('Store Location')}
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Box
                sx={{
                  height: 400,
                  borderRadius: 2,
                  overflow: 'hidden',
                  border: (t) => `1px solid ${t.palette.divider}`,
                }}
              >
                <StoreMap
                  mapboxToken={MAPBOX_TOKEN}
                  lng={lng}
                  lat={lat}
                  zoom={12}
                  setZoom={() => {}} // No editable en este modal
                  hasCoords={hasCoords}
                  edit={false}
                  image={store.image}
                  name={store.name}
                  onClick={() => {}}
                  onMarkerDragEnd={() => {}}
                />
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
};

export default StoreInfoSimplified;
