// app/components/stores/StoreInfo.tsx
'use client';

import { useStoreEditor } from '@/hooks/pages/useStoreEditor';
import { usersApi } from '@/mocks/users'; // 👈 ajusta si luego apuntas al service real
import { Store } from '@/services/store.service';
import { getTierColor } from '@/utils/ui/store.page';
import { PaymentOutlined } from '@mui/icons-material';
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';
import ContentCopyOutlinedIcon from '@mui/icons-material/ContentCopyOutlined';
import GroupsIcon from '@mui/icons-material/Groups';
import TagIcon from '@mui/icons-material/Tag';
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import {
  Alert,
  Box,
  Card,
  CardContent,
  Divider,
  Grid,
  IconButton,
  InputAdornment,
  MenuItem, // 👈 añadido
  Snackbar,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import StoreKioskCard from '../application-ui/composed-blocks/kiosk';
import StatItem from '../application-ui/composed-blocks/my-cards/store-item';
import StoreGeneralForm from '../application-ui/form-layouts/store/edit';
import StoreHeader from '../application-ui/headings/store/store-create';
import StoreMap from '../application-ui/map/store-map';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN as string;

/** Devuelve antigüedad formateada "X años, Y meses" a partir de ISO startContractDate */
const formatAge = (iso?: string | null) => {
  if (!iso) return '—';
  const start = new Date(iso);
  if (Number.isNaN(start.getTime())) return '—';
  const now = new Date();
  let months = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());

  // Ajuste por día del mes para evitar sumar un mes si aún no se cumple el día
  if (now.getDate() < start.getDate()) months -= 1;

  const years = Math.floor(months / 12);
  const rem = Math.max(0, months % 12);
  const y = `${years} año${years === 1 ? '' : 's'}`;
  const m = `${rem} mes${rem === 1 ? '' : 'es'}`;
  return `${y}, ${m}`;
};

/** Formatea Date/ISO a yyyy-mm-dd para inputs type="date" */
const toInputDate = (value: any): string => {
  if (!value) return '';
  const d = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(d?.getTime?.())) return '';
  return d.toISOString().slice(0, 10);
};

export default function StoreInfo({ store }: { store: Store }) {
  const [zoom, setZoom] = useState(12);
  const [showPassword, setShowPassword] = useState(false);

  const {
    form,
    setForm,
    edit,
    setEdit,
    saving,
    snack,
    setSnack,
    hasCoords,
    lng,
    lat,
    onMapClick,
    onMarkerDragEnd,
    handleChange,
    handleSave,
    handleCancel,
    kioskUrl,
  } = useStoreEditor(store);

  const tier = getTierColor(form.type); // si después quieres usar el tier en algún badge

  // Password fija (no editable)
  const passwordValue = 'ABC123';

  // ─────────────────────────────────────────────────────────────
  //  React Query: buscar usuario merchant por store
  //  GET /auth/users/search?store=STORE_ID
  // ─────────────────────────────────────────────────────────────
  const {
    data: merchantUser,
    isLoading: loadingMerchant,
    isError: errorMerchant,
  } = useQuery({
    queryKey: ['store-merchant-user', store._id],
    enabled: Boolean(store?._id),
    queryFn: async () => {
      const users = await usersApi.searchUsers({ store: String(store._id) });
      if (!Array.isArray(users) || users.length === 0) return null;

      // Preferimos el que tenga role merchant
      const merchant = users.find((u: any) => String(u.role || '').toLowerCase() === 'merchant');

      return (merchant || users[0]) as any;
    },
  });

  const handleCopySlug = async () => {
    const slug = (store as any)?.slug || '';
    if (!slug) return;

    try {
      await navigator.clipboard.writeText(slug);
      setSnack({
        open: true,
        msg: `Slug "${slug}" copiado al portapapeles.`,
        type: 'success',
      });
    } catch {
      setSnack({
        open: true,
        msg: 'No se pudo copiar el slug.',
        type: 'error',
      });
    }
  };

  return (
    <Box>
      <Card
        sx={{
          overflow: 'hidden',
          borderRadius: 3,
          mb: 3,
          border: (t) => `1px solid ${t.palette.divider}`,
        }}
      >
        <StoreHeader
          image={store.image}
          address={form.address}
          kioskUrl={kioskUrl}
          showQrBadge
          edit={edit}
          saving={saving}
          name={form.name}
          type={form.type}
          provider={form.provider}
          active={form.active}
          verifiedByTwilio={form.verifiedByTwilio}
          onEdit={() => setEdit(true)}
          onSave={handleSave}
          onCancel={handleCancel}
          onNameChange={(val) => setForm((s) => ({ ...s, name: val }))}
        />

        <CardContent sx={{ p: { xs: 2, md: 3 } }}>
          {/* Stats */}
          <Grid
            container
            spacing={2}
            mb={1}
          >
            <Grid
              item
              xs={6}
              md={3}
            >
              <StatItem
                icon={<GroupsIcon fontSize="small" />}
                label="Audiencia"
                value={
                  <Box component="span">
                    {store.customerCount?.toLocaleString?.() ?? 0}{' '}
                    <span style={{ color: 'rgba(0,0,0,.6)', fontSize: 12 }}>usuarios</span>
                  </Box>
                }
                help="Total de clientes registrados"
              />
            </Grid>
            <Grid
              item
              xs={6}
              md={3}
            >
              <StatItem
                icon={<PaymentOutlined fontSize="small" />}
                label="Método de pago"
                value={
                  store.paymentMethod ? store.paymentMethod.replace('_', ' ').toUpperCase() : '—'
                }
                help="Método de pago asignado"
              />
            </Grid>
            <Grid
              item
              xs={6}
              md={3}
            >
              <StatItem
                icon={<TagIcon fontSize="small" />}
                label="Membresía"
                value={form.membershipType ?? '—'}
                help="Tipo de membresía"
              />
            </Grid>
            <Grid
              item
              xs={6}
              md={3}
            >
              <StatItem
                icon={<CalendarMonthOutlinedIcon fontSize="small" />}
                label="Antigüedad"
                value={formatAge(form.startContractDate as any)}
                help="Tiempo desde contrato"
              />
            </Grid>
          </Grid>

          {/* 👇 Nueva tarjeta: configuración de facturación / morosidad */}
          <Card
            variant="outlined"
            sx={{
              borderRadius: 2,
              mb: 2,
              backgroundColor: (t) => t.palette.grey[50],
            }}
          >
            <CardContent>
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems={{ xs: 'flex-start', sm: 'center' }}
                flexDirection={{ xs: 'column', sm: 'row' }}
                gap={1}
                mb={1.5}
              >
                <Box>
                  <Typography
                    variant="subtitle1"
                    fontWeight={600}
                    gutterBottom
                  >
                    Configuración de facturación
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                  >
                    Define las fechas de facturación y el estado de crédito de la tienda.
                  </Typography>
                </Box>
              </Box>

              <Grid
                container
                spacing={2}
              >
                <Grid
                  item
                  xs={12}
                  md={4}
                >
                  <TextField
                    label="Próxima fecha de facturación"
                    type="date"
                    fullWidth
                    size="small"
                    value={toInputDate((form as any).billingNextDate)}
                    onChange={(e) =>
                      setForm((s: any) => ({
                        ...s,
                        billingNextDate: e.target.value || null,
                      }))
                    }
                    InputLabelProps={{ shrink: true }}
                    disabled={!edit}
                    helperText="Fecha en que se generará la próxima factura automática."
                  />
                </Grid>
                <Grid
                  item
                  xs={12}
                  md={4}
                >
                  <TextField
                    label="Fin del último período"
                    type="date"
                    fullWidth
                    size="small"
                    value={toInputDate((form as any).billingLastPeriodEnd)}
                    onChange={(e) =>
                      setForm((s: any) => ({
                        ...s,
                        billingLastPeriodEnd: e.target.value || null,
                      }))
                    }
                    InputLabelProps={{ shrink: true }}
                    disabled={!edit}
                    helperText="Último período facturado (ej: fin de mes)."
                  />
                </Grid>
                <Grid
                  item
                  xs={12}
                  md={4}
                >
                  <TextField
                    select
                    label="Estado de crédito"
                    fullWidth
                    size="small"
                    value={(form as any).creditStatus || 'ok'}
                    onChange={(e) =>
                      setForm((s: any) => ({
                        ...s,
                        creditStatus: e.target.value,
                      }))
                    }
                    disabled={!edit}
                    helperText="Control manual del estado de morosidad."
                  >
                    <MenuItem value="ok">OK</MenuItem>
                    <MenuItem value="delinquent">Moroso</MenuItem>
                    <MenuItem value="suspended">Suspendido</MenuItem>
                  </TextField>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Acceso del merchant */}
          <Card
            variant="outlined"
            sx={{
              borderRadius: 2,
              mb: 2,
              backgroundColor: (t) => t.palette.grey[50],
            }}
          >
            <CardContent>
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems={{ xs: 'flex-start', sm: 'center' }}
                flexDirection={{ xs: 'column', sm: 'row' }}
                gap={1}
                mb={1.5}
              >
                <Box>
                  <Typography
                    variant="subtitle1"
                    fontWeight={600}
                    gutterBottom
                  >
                    Acceso del merchant
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                  >
                    Credenciales de acceso para el panel de la tienda.
                  </Typography>
                </Box>

                {/* Slug con botón copiar */}
                <Box textAlign={{ xs: 'left', sm: 'right' }}>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: 'block' }}
                  >
                    Slug de la tienda
                  </Typography>
                  <Stack
                    direction="row"
                    spacing={1}
                    alignItems="center"
                    mt={0.5}
                  >
                    <Box
                      component="code"
                      sx={{
                        px: 1.2,
                        py: 0.4,
                        borderRadius: 1,
                        fontSize: 12,
                        bgcolor: 'grey.100',
                        border: (t) => `1px dashed ${t.palette.grey[300]}`,
                        maxWidth: 220,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                      title={(store as any)?.slug || 'Sin slug'}
                    >
                      {(store as any)?.slug || '—'}
                    </Box>
                    <Tooltip title="Copiar slug">
                      <span>
                        <IconButton
                          size="small"
                          onClick={handleCopySlug}
                          disabled={!(store as any)?.slug}
                        >
                          <ContentCopyOutlinedIcon fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>
                  </Stack>
                </Box>
              </Box>

              {loadingMerchant && (
                <Typography
                  variant="body2"
                  color="text.secondary"
                >
                  Cargando usuario merchant...
                </Typography>
              )}

              {errorMerchant && (
                <Typography
                  variant="body2"
                  color="error"
                >
                  No se pudo cargar el usuario asociado a esta tienda.
                </Typography>
              )}

              {!loadingMerchant && !errorMerchant && !merchantUser && (
                <Typography
                  variant="body2"
                  color="text.secondary"
                >
                  No hay un usuario asociado a esta tienda.
                </Typography>
              )}

              {merchantUser && (
                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  spacing={2}
                  mt={2}
                >
                  <TextField
                    label="Phone number (username)"
                    value={merchantUser.phoneNumber || '—'}
                    fullWidth
                    InputProps={{
                      readOnly: true,
                    }}
                    size="small"
                  />

                  <TextField
                    label="Access code"
                    value={merchantUser.accessCode || '—'}
                    fullWidth
                    InputProps={{
                      readOnly: true,
                    }}
                    size="small"
                  />

                  <TextField
                    label="Password"
                    value={passwordValue}
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
                          >
                            {showPassword ? (
                              <VisibilityOffOutlinedIcon fontSize="small" />
                            ) : (
                              <VisibilityOutlinedIcon fontSize="small" />
                            )}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                    helperText="Estos valores no se pueden editar."
                  />
                </Stack>
              )}
            </CardContent>
          </Card>

          <Divider sx={{ my: 2 }} />

          {/* Info + Mapa */}
          <Grid
            container
            spacing={3}
          >
            <Grid
              item
              xs={12}
              md={6}
            >
              <StoreGeneralForm
                form={form as any}
                edit={edit}
                onChange={handleChange}
                lng={lng}
                lat={lat}
              />
            </Grid>
            <Grid
              item
              xs={12}
              md={6}
            >
              <StoreMap
                mapboxToken={MAPBOX_TOKEN}
                lng={lng}
                lat={lat}
                zoom={zoom}
                setZoom={setZoom}
                hasCoords={hasCoords}
                edit={edit}
                image={store.image}
                name={form.name}
                onClick={onMapClick}
                onMarkerDragEnd={onMarkerDragEnd}
              />
            </Grid>
          </Grid>

          <Divider sx={{ my: 2 }} />

          <StoreKioskCard
            kioskUrl={kioskUrl}
            storeId={store._id}
          />
        </CardContent>
      </Card>

      <Snackbar
        open={snack.open}
        autoHideDuration={3500}
        onClose={() => setSnack((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          severity={snack.type}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snack.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
}
