// app/components/stores/StoreInfo.tsx
'use client';

import { useStoreEditor } from '@/hooks/pages/useStoreEditor';
import { usersApi } from '@/mocks/users'; // 👈 ajusta si luego apuntas al service real
import { api } from '@/libs/axios';
import { Store } from '@/services/store.service';
import { getTierColor } from '@/utils/ui/store.page';
import { PaymentOutlined, PersonAddRounded, WarningAmberRounded } from '@mui/icons-material';
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';
import ContentCopyOutlinedIcon from '@mui/icons-material/ContentCopyOutlined';
import GroupsIcon from '@mui/icons-material/Groups';
import TagIcon from '@mui/icons-material/Tag';
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import {
  Alert,
  Box,
  Button,
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
  Fab,
  Zoom,
  CircularProgress,
} from '@mui/material';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import SaveRoundedIcon from '@mui/icons-material/SaveRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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

/** Genera un accessCode aleatorio con formato ANTILLAN-XXXXX */
const generateAccessCode = (): string => {
  const num = Math.floor(10000 + Math.random() * 90000); // 10000‑99999
  return `ANTILLAN-${num}`;
};

export default function StoreInfo({ store }: { store: Store }) {
  const queryClient = useQueryClient();
  const [zoom, setZoom] = useState(12);
  const [showPassword, setShowPassword] = useState(false);
  const [backfillResult, setBackfillResult] = useState<any>(null);

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

  // ─────────────────────────────────────────────────────────────
  //  Mutation: crear usuario merchant automáticamente vía backfill
  //  Si la store no tiene accessCode, lo genera y patchea primero.
  // ─────────────────────────────────────────────────────────────
  const hasAccessCode = Boolean((store as any)?.accessCode);

  const createMerchantMutation = useMutation({
    mutationFn: async () => {
      // 1. Si no tiene accessCode, generar uno y patchear la store
      if (!(store as any)?.accessCode) {
        const newCode = generateAccessCode();
        await api.patch(`/store/${store._id}`, { accessCode: newCode });
      }
      // 2. Crear / actualizar el usuario merchant via backfill
      const res = await api.post(`/auth/admin/backfill-from-store/${store._id}`);
      return res.data;
    },
    onSuccess: (data) => {
      setBackfillResult(data);
      // Refrescar tanto el store (para el nuevo accessCode) como el usuario merchant
      queryClient.invalidateQueries({ queryKey: ['store-merchant-user', store._id] });
      queryClient.invalidateQueries({ queryKey: ['store', store._id] });

      // Mensaje según la acción
      const msgs: Record<string, string> = {
        created_user: 'Usuario merchant creado exitosamente.',
        updated_existing_merchant: 'Se actualizó el usuario merchant existente (accessCode, password, etc.).',
        updated_merchant_no_phone_due_conflict: 'Merchant actualizado. El teléfono se omitió por conflicto con otro usuario.',
        attached_store_updated_role_accessCode_email_and_password: 'Se vinculó un usuario existente como merchant de esta tienda.',
        conflict_store_already_taken: 'Ya existe un usuario asignado a esta tienda (conflicto de índice único).',
      };
      setSnack({
        open: true,
        msg: msgs[data?.action] || `Proceso completado (${data?.action || 'ok'}).`,
        type: data?.action === 'conflict_store_already_taken' ? 'warning' : 'success',
      });
    },
    onError: (err: any) => {
      setBackfillResult(null);
      setSnack({
        open: true,
        msg: err?.response?.data?.error || 'Error al crear el usuario merchant.',
        type: 'error',
      });
    },
  });

  const handleCopySlug = async () => {
    const slug = form?.slug || (store as any)?.slug || '';
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
                <Grid
                  item
                  xs={12}
                  md={12}
                >
                  <TextField
                    label="Circulars URL (opcional)"
                    fullWidth
                    size="small"
                    value={(form as any).circularssUrl || ''}
                    onChange={(e) =>
                      setForm((s: any) => ({
                        ...s,
                        circularssUrl: e.target.value || null,
                      }))
                    }
                    disabled={!edit}
                    placeholder="https://..."
                    helperText="URL pública/privada donde la tienda gestiona sus circulars (opcional)."
                  />
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

              {(errorMerchant || (!loadingMerchant && !merchantUser)) && (
                <Stack spacing={1.5} mt={1}>
                  {errorMerchant ? (
                    <Typography variant="body2" color="error">
                      No se pudo cargar el usuario asociado a esta tienda.
                    </Typography>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      No hay un usuario asociado a esta tienda.
                    </Typography>
                  )}

                  {/* Warning si no hay accessCode */}
                  {!hasAccessCode && !backfillResult && (
                    <Alert
                      severity="warning"
                      icon={<WarningAmberRounded fontSize="small" />}
                      sx={{ borderRadius: 2 }}
                    >
                      Esta tienda no tiene un <strong>accessCode</strong>. Se generará uno
                      automáticamente al crear el usuario (ej. ANTILLAN-10034).
                    </Alert>
                  )}

                  {/* Resultado detallado del backfill */}
                  {backfillResult && (
                    <Alert
                      severity={
                        backfillResult.action === 'conflict_store_already_taken'
                          ? 'warning'
                          : 'success'
                      }
                      sx={{ borderRadius: 2 }}
                    >
                      {backfillResult.action === 'created_user' && (
                        <>
                          ✅ <strong>Usuario creado.</strong> Se generó un nuevo merchant para esta tienda.
                          {backfillResult.phoneConflictBypassed && (
                            <Typography variant="caption" display="block" mt={0.5}>
                              ⚠️ El teléfono de la tienda ya estaba en uso — se asignó un número sintético.
                            </Typography>
                          )}
                          {backfillResult.email && (
                            <Typography variant="caption" display="block" mt={0.5}>
                              📧 Email: <strong>{backfillResult.email}</strong>
                            </Typography>
                          )}
                        </>
                      )}

                      {backfillResult.action === 'updated_existing_merchant' && (
                        <>
                          🔄 <strong>Merchant actualizado.</strong> Ya existía un usuario merchant para esta store — se sincronizó accessCode, email y password.
                        </>
                      )}

                      {backfillResult.action === 'updated_merchant_no_phone_due_conflict' && (
                        <>
                          🔄 <strong>Merchant actualizado (sin teléfono).</strong> Se actualizó el usuario pero el teléfono se omitió porque genera conflicto con otro usuario.
                        </>
                      )}

                      {backfillResult.action === 'attached_store_updated_role_accessCode_email_and_password' && (
                        <>
                          🔗 <strong>Usuario vinculado.</strong> Se encontró un usuario existente por su teléfono y se le asignó esta tienda como merchant.
                        </>
                      )}

                      {backfillResult.action === 'conflict_store_already_taken' && (
                        <>
                          ⚠️ <strong>Conflicto.</strong> Ya existe un usuario asignado a esta tienda en la base de datos (índice único). Verifica manualmente en la sección de usuarios.
                        </>
                      )}

                      {backfillResult.action === 'none' && (
                        <>
                          ℹ️ El usuario merchant ya estaba actualizado, no hubo cambios.
                        </>
                      )}
                    </Alert>
                  )}

                  {/* Error del mutation */}
                  {createMerchantMutation.isError && (
                    <Alert severity="error" sx={{ borderRadius: 2 }}>
                      {(createMerchantMutation.error as any)?.response?.data?.error
                        || 'Error inesperado al crear el usuario merchant.'}
                    </Alert>
                  )}

                  <Box>
                    <Button
                      variant="contained"
                      size="small"
                      startIcon={
                        createMerchantMutation.isPending
                          ? <CircularProgress size={16} color="inherit" />
                          : <PersonAddRounded />
                      }
                      disabled={createMerchantMutation.isPending}
                      onClick={() => {
                        setBackfillResult(null);
                        createMerchantMutation.mutate();
                      }}
                      sx={{
                        borderRadius: 2,
                        textTransform: 'none',
                        px: 2.5,
                      }}
                    >
                      {createMerchantMutation.isPending
                        ? 'Creando...'
                        : hasAccessCode
                          ? 'Crear usuario merchant'
                          : 'Generar accessCode y crear usuario'
                      }
                    </Button>
                  </Box>
                </Stack>
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

          {/* Info + Mapa + Kiosk */}
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
              display="flex"
              flexDirection="column"
              gap={2}
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
              <StoreKioskCard
                kioskUrl={kioskUrl}
                storeId={store._id}
                edit={edit}
                form={form as any}
                setForm={setForm as any}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Floating Action Buttons for Edit/Save/Cancel */}
      <Box
        sx={{
          position: 'fixed',
          bottom: { xs: 24, md: 40 },
          right: { xs: 24, md: 40 },
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'row-reverse',
          gap: 2,
          alignItems: 'center',
        }}
      >
        <Zoom in={true}>
          <Fab
            color={edit ? 'success' : 'primary'}
            onClick={edit ? handleSave : () => setEdit(true)}
            disabled={saving}
            sx={{
              boxShadow: (theme) => theme.shadows[8],
              '&:hover': {
                transform: 'scale(1.05)',
              },
              transition: 'transform 0.2s',
            }}
          >
            {saving ? (
              <CircularProgress size={24} color="inherit" />
            ) : edit ? (
              <SaveRoundedIcon />
            ) : (
              <EditRoundedIcon />
            )}
          </Fab>
        </Zoom>

        <Zoom in={edit}>
          <Fab
            color="default"
            size="medium"
            onClick={handleCancel}
            disabled={saving}
            sx={{
              boxShadow: (theme) => theme.shadows[4],
              '&:hover': {
                transform: 'scale(1.05)',
              },
              transition: 'transform 0.2s',
              bgcolor: 'background.paper',
            }}
          >
            <CloseRoundedIcon />
          </Fab>
        </Zoom>
      </Box>

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
