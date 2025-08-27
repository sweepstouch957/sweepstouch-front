// app/components/stores/StoreInfo.tsx
'use client';

import { useStoreEditor } from '@/hooks/pages/useStoreEditor';
import { Store } from '@/services/store.service';
import { getTierColor } from '@/utils/ui/store.page';
import BadgeIcon from '@mui/icons-material/Badge';
import GroupsIcon from '@mui/icons-material/Groups';
import PhoneIphoneIcon from '@mui/icons-material/PhoneIphone';
import TagIcon from '@mui/icons-material/Tag';
import { Alert,  Box, Card, CardContent, Divider, Grid, Snackbar } from '@mui/material';
import { useState } from 'react';
import StoreKioskCard from '../application-ui/composed-blocks/kiosk';
import StatItem from '../application-ui/composed-blocks/my-cards/store-item';
import StoreGeneralForm from '../application-ui/form-layouts/store/edit';
import StoreHeader from '../application-ui/headings/store/store-create';
import StoreMap from '../application-ui/map/store-map';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN as string;

export default function StoreInfo({ store }: { store: Store }) {
  const [zoom, setZoom] = useState(12);
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

  const tier = getTierColor(form.type);

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
                icon={<BadgeIcon fontSize="small" />}
                label="Owner ID"
                value={store.ownerId?.slice?.(0, 8) ?? '—'}
                help="Identificador del dueño"
              />
            </Grid>
            <Grid
              item
              xs={6}
              md={3}
            >
              <StatItem
                icon={<TagIcon fontSize="small" />}
                label="Suscripción"
                value={store.subscription || '—'}
                help="Plan asociado"
              />
            </Grid>
            <Grid
              item
              xs={6}
              md={3}
            >
              <StatItem
                icon={<PhoneIphoneIcon fontSize="small" />}
                label="Proveedor"
                value={form.provider.toUpperCase()}
                help={form.provider === 'twilio' ? 'Números Twilio' : 'Números Bandwidth'}
              />
            </Grid>
          </Grid>

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
