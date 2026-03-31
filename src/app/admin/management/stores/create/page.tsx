'use client';

import { BrandCreationModal } from '@/components/admin/stores/BrandCreationModal';
import { useCreateStoreState } from '@/components/admin/stores/create/useCreateStoreState';
import CreateStoreStep2 from '@/components/admin/stores/CreateStoreStep2';
import storeService from '@/services/store.service';
import { useBrands } from '@/hooks/fetching/brands/useBrands';
import { useSweepstakes } from '@/hooks/fetching/sweepstakes/useSweepstakes';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Divider,
  Grid,
  MenuItem,
  TextField,
  Typography,
  useMediaQuery,
  Tabs,
  Tab,
  Autocomplete,
} from '@mui/material';
import { createTheme, ThemeProvider, useTheme } from '@mui/material/styles';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { es } from 'date-fns/locale';
import { useRouter } from 'next/navigation';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { customerClient } from '@/services/customerService';
import LocationPickerMap from '@/components/application-ui/map/LocationPickerMap';
import PhoneMaskInput from '@/components/PhoneMaskInput';
import { ExcelCustomerDropzone, ParsedCustomer } from '@/components/shared/ExcelCustomerDropzone';

const pinkTheme = createTheme({
  palette: {
    primary: { main: '#FF008A' },
    secondary: { main: '#FF4D9E' },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { borderRadius: 8, textTransform: 'none' },
      },
    },
  },
});

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function CustomTabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`store-tabpanel-${index}`}
      aria-labelledby={`store-tab-${index}`}
      {...other}
    >
      {/* Always mounted so inner state (Step2 equipment) is never lost on tab switch */}
      <Box sx={{ pt: 3 }}>{children}</Box>
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `store-tab-${index}`,
    'aria-controls': `store-tabpanel-${index}`,
  };
}

function UploadDrop({
  label,
  accept,
  onChange,
  file,
}: {
  label: string;
  accept: string;
  onChange: (f: File | null) => void;
  file: File | null;
}) {
  const { t } = useTranslation();
  const inputRef = React.useRef<HTMLInputElement | null>(null);

  const open = () => inputRef.current?.click();

  return (
    <Box
      onClick={open}
      sx={{
        p: 2,
        border: '1px dashed',
        borderColor: 'divider',
        borderRadius: 2,
        cursor: 'pointer',
      }}
    >
      <Typography
        variant="body2"
        sx={{ mb: 1 }}
      >
        {label}
      </Typography>

      <Box
        sx={{
          p: { xs: 2, md: 4 },
          textAlign: 'center',
          color: 'text.secondary',
        }}
      >
        <div style={{ fontSize: 20 }}>☁️</div>
        <div>{t("Click to select a file")}</div>
        <Typography variant="caption">
          {accept.includes('image') ? t("Upload format image helper") : t("Upload format pdf helper")}
        </Typography>
      </Box>

      {file && (
        <Typography
          variant="caption"
          sx={{ display: 'block' }}
        >
          {file.name}
        </Typography>
      )}

      <input
        hidden
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={(e) => onChange(e.target.files?.[0] ?? null)}
      />
    </Box>
  );
}

function LogoPreview({ src }: { src?: string }) {
  const { t } = useTranslation();
  return (
    <Box
      sx={{
        p: 2,
        border: '1px dashed',
        borderColor: 'divider',
        borderRadius: 2,
        height: { xs: 150, md: 200 },
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        color: 'text.secondary',
        background:
          'repeating-linear-gradient(45deg, rgba(0,0,0,0.02) 0, rgba(0,0,0,0.02) 10px, transparent 10px, transparent 20px)',
        overflow: 'hidden',
      }}
    >
      {src && src !== 'no-image.jpg' ? (
        <Box
          component="img"
          src={src}
          alt="Brand Logo"
          sx={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
        />
      ) : (
        <Box>
          <div
            style={{
              fontSize: 36,
              lineHeight: 1,
            }}
          >
            🏪
          </div>

          <Typography
            variant="body2"
            sx={{ mt: 1, fontWeight: 600 }}
          >
            {t("Store Logo (preview)")}
          </Typography>

          <Typography variant="caption">
            {t("The logo will load based on the selected brand")}
          </Typography>
        </Box>
      )}
    </Box>
  );
}

export default function CreateStoreStepperPage(): React.JSX.Element {
  const { t } = useTranslation();
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const { state, setState } = useCreateStoreState();

  const { data: swRaw, isLoading: swLoading } = useSweepstakes();

  const sweepstakes = React.useMemo(() => {
    const arr: any[] = Array.isArray((swRaw as any)?.data)
      ? (swRaw as any).data
      : Array.isArray(swRaw)
        ? (swRaw as any)
        : [];

    return arr.map((x: any) => ({
      id: String(x.id ?? x._id ?? x.uuid ?? x.sweepstakeId ?? x.sorteoId ?? Math.random()),
      name: String(x.name ?? x.title ?? x.nombre ?? t('Default Sweepstake')),
      image: x.image,
    }));
  }, [swRaw]);

  const { data: brandsRes, isLoading: brandsLoading } = useBrands();
  const brands = React.useMemo(() => {
    let b = Array.isArray(brandsRes) ? brandsRes : (brandsRes?.data || []);
    // Add a fake "CREATE_NEW" option
    return [{ id: 'CREATE_NEW', name: t('Create new brand'), image: '' }, ...b];
  }, [brandsRes, t]);

  const [brandModalOpen, setBrandModalOpen] = React.useState(false);

  const [touched, setTouched] = React.useState(false);
  const [tabValue, setTabValue] = React.useState(0);
  const [createdStore, setCreatedStore] = React.useState<any>(null);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    // Evitamos avanzar a la segunda pestaña si la vista 1 no es válida
    if (newValue === 1) {
      setTouched(true);
      if (!isValid) return;
    }
    setTabValue(newValue);
  };

  const isValid = Boolean(
    state.storeName &&
    state.storeName.trim() &&
    state.address &&
    state.address.trim() &&
    state.zipCode &&
    state.zipCode.trim() &&
    state.phone &&
    state.phone.trim() &&
    state.startDate &&
    state.startDate.trim() &&
    state.sweepstakeId &&
    state.sweepstakeId !== '' &&
    state.brandId &&
    state.brandId !== '' &&
    state.type &&
    state.type !== '' &&
    state.location?.coordinates &&
    state.location?.coordinates.length === 2
  );

  const selectedBrand = React.useMemo(() => {
    return brands.find((b: any) => b.id === state.brandId || b._id === state.brandId);
  }, [brands, state.brandId]);

  const selectedSweepstake = React.useMemo(() => {
    return sweepstakes.find((s: any) => s.id === state.sweepstakeId);
  }, [sweepstakes, state.sweepstakeId]);

  const nextTab = () => {
    setTouched(true);
    if (!isValid) return;
    setTabValue(1);
  };

  const handleFinalSubmit = async (step2Data: any) => {
    const completeData = {
      name: state.storeName,
      address: state.address,
      zipCode: state.zipCode,
      phoneNumber: state.phone,
      startContractDate: state.startDate,
      membershipType: state.membership?.toLowerCase(),
      activeSweepstake: state.sweepstakeId,
      ownerName: step2Data.ownerName,
      ownerEmail: step2Data.ownerEmail,
      ownerPhone: step2Data.ownerPhone,
      email: step2Data.ownerEmail || state.email || '',
      brand: state.brandId,
      provider: 'bandwidth',
      bandwidthPhoneNumber: '+18554594926',
      bandwithId: 'c3799660-ff17-4e29-a41a-e53f2d8b3859',
      socialMedia: {
        website: state.website || '',
        facebook: state.facebook || '',
        instagram: state.instagram || '',
      },
      additionalInfo: state.extraInfo || '',
      description: state.description || '',

      // New properties for Phase 2 validation
      type: state.type,
      location: state.location,

      equipment: step2Data.equipment,
      materials: step2Data.materials,
      image: selectedBrand?.image || state.storeImageB64 || 'no-image.jpg',
      contractImage: state.contractFileB64,
    };

    try {
      const newStore: any = await storeService.createStore(completeData as any);
      setCreatedStore(newStore);
      toast.success('Tienda y usuario creados exitosamente');
      setState({});
    } catch (error: any) {
      console.error('Error al crear la tienda:', error);
      toast.error(error.response?.data?.error || 'Error al crear la tienda. Por favor, intenta en unos minutos.');
    }
  };

  const err = (cond: boolean) => (touched && !cond ? true : false);
  const helper = (cond: boolean) => (touched && !cond ? t("Required field") : '');

  if (createdStore) {
    return (
      <ThemeProvider theme={pinkTheme}>
        <Container maxWidth="md" sx={{ py: { xs: 4, md: 8 }, textAlign: 'center' }}>
          <Card sx={{ p: { xs: 3, md: 6 }, borderRadius: 4, boxShadow: '0 12px 40px rgba(0,0,0,0.08)' }}>
            <CheckCircleOutlineIcon color="success" sx={{ fontSize: 90, mb: 2 }} />
            <Typography variant="h3" fontWeight="bold" gutterBottom>
              ¡Tienda Creada!
            </Typography>
            <Typography variant="body1" color="text.secondary" mb={5} fontSize="1.1rem">
              La tienda <strong>{createdStore.name}</strong> ha sido configurada y ya está lista en el sistema.
            </Typography>

            <Divider sx={{ my: 4 }} />

            <Typography variant="h5" fontWeight={600} mb={1}>
              Paso Opcional: Importar Directorio
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={4}>
              Sube tu Excel o CSV aquí para llenar la base de clientes de esta tienda automáticamente.
            </Typography>

            <Box sx={{ maxWidth: 550, mx: 'auto', textAlign: 'left' }}>
               <SuccessImportSection 
                 storeId={String(createdStore._id || createdStore.id)} 
                 onFinish={() => router.push('/admin/management/stores')}
               />
            </Box>

            <Box mt={6}>
              <Button
                variant="text"
                color="inherit"
                size="large"
                onClick={() => router.push('/admin/management/stores')}
                sx={{ px: 5, color: 'text.secondary', '&:hover': { color: 'text.primary' } }}
              >
                No importar nada, salir al listado
              </Button>
            </Box>
          </Card>
        </Container>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={pinkTheme}>
      <Container
        maxWidth="lg"
        sx={{ py: { xs: 2, md: 3 } }}
      >
        <Box sx={{ mb: '30px' }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
            }}
          >
            <Button
              onClick={() => router.push('/admin/management/stores')}
              sx={{
                minWidth: 0,
                p: 0.5,
                color: 'text.primary',
                '&:hover': { backgroundColor: 'transparent', color: 'primary.main' },
              }}
            >
              <ArrowBackIosNewIcon fontSize="small" />
            </Button>

            <Typography
              variant="h5"
              sx={{
                fontSize: '26px',
                fontWeight: 600,
              }}
            >
              {t("Create Store")}
            </Typography>
          </Box>

          <Typography
            variant="body2"
            sx={{
              fontSize: '20px',
              color: 'text.secondary',
              mt: 0.5,
            }}
          >
            {t("Register a new store")}
          </Typography>
        </Box>

        <Card>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={tabValue} onChange={handleTabChange} aria-label="store creation tabs" centered>
              <Tab label={t("General Information")} {...a11yProps(0)} />
              <Tab label={t("Equipment and Materials")} {...a11yProps(1)} />
            </Tabs>
          </Box>
          <CardContent sx={{ p: { xs: 2, md: 3 } }}>
            <CustomTabPanel value={tabValue} index={0}>
              <Box>
                {/* --- 1. MARCA Y LOGO --- */}
                <Typography variant="h6" sx={{ mb: 1.5, fontWeight: 600, color: 'primary.main', display: 'flex', alignItems: 'center', gap: 1 }}>
                  <span>🏪</span> {t("Select your Brand")}
                </Typography>

                <Grid container spacing={1.5}>
                  <Grid item xs={12} md={6}>
                    <Autocomplete
                      options={brands}
                      getOptionLabel={(option: any) => option.name || ''}
                      value={selectedBrand || null}
                      onChange={(event, newValue) => {
                        if (newValue?.id === 'CREATE_NEW') {
                          setBrandModalOpen(true);
                          return;
                        }
                        setState((s: any) => ({
                          ...s,
                          brandId: newValue ? (newValue.id || newValue._id) : '',
                          storeName: newValue ? newValue.name : s.storeName,
                        }));
                      }}
                      renderOption={(props, option) => (
                        <Box component="li" sx={{ '& > img': { mr: 2, flexShrink: 0 } }} {...props} key={"brand-" + option._id}>
                          {option.id !== 'CREATE_NEW' && (
                            option.image ? (
                              <Avatar src={option.image} variant="rounded" sx={{ width: 32, height: 32, mr: 2 }} />
                            ) : (
                              <Box sx={{ width: 32, height: 32, mr: 2, bgcolor: 'grey.300', borderRadius: 1 }} />
                            )
                          )}
                          {option.id === 'CREATE_NEW' ? (
                            <Typography color="primary" fontWeight="bold">{option.name}</Typography>
                          ) : (
                            option.name
                          )}
                        </Box>
                      )}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label={t("Brand or Franchise *")}
                          error={err(Boolean(state.brandId))}
                          helperText={brandsLoading ? t("Loading brands...") : helper(Boolean(state.brandId))}
                        />
                      )}
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <LogoPreview src={selectedBrand?.image} />
                  </Grid>
                </Grid>

                <Divider sx={{ my: { xs: 2.5, md: 2.5 } }} />

                {/* --- 2. DATOS GENERALES --- */}
                <Typography variant="h6" sx={{ mb: 1.5, fontWeight: 600, color: 'primary.main', display: 'flex', alignItems: 'center', gap: 1 }}>
                  <span>📝</span> {t("Store Data")}
                </Typography>

                <Grid container spacing={1.5}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      label={t("Business Name *")}
                      fullWidth
                      value={state.storeName ?? ''}
                      error={err(Boolean(state.storeName))}
                      helperText={helper(Boolean(state.storeName))}
                      onChange={(e) =>
                        setState((s: any) => ({
                          ...s,
                          storeName: e.target.value,
                        }))
                      }
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <PhoneMaskInput
                      label={t("Local Phone *")}
                      fullWidth
                      error={err(Boolean(state.phone))}
                      helperText={helper(Boolean(state.phone))}
                      value={state.phone ?? ''}
                      onChange={(val) => setState((s: any) => ({ ...s, phone: val }))}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      label={t("Email (optional)")}
                      fullWidth
                      placeholder="storeName@sweeptouch.com"
                      value={state.email ?? ''}
                      onChange={(e) => setState((s: any) => ({ ...s, email: e.target.value }))}
                    />
                  </Grid>
                </Grid>

                <Divider sx={{ my: { xs: 2.5, md: 2.5 } }} />

                {/* --- 3. UBICACIÓN --- */}
                <Typography variant="h6" sx={{ mb: 1.5, fontWeight: 600, color: 'primary.main', display: 'flex', alignItems: 'center', gap: 1 }}>
                  <span>📍</span> {t("Physical Location")}
                </Typography>

                <Grid container spacing={1.5}>
                  <Grid item xs={12} md={8}>
                    <TextField
                      label={t("Full Address *")}
                      fullWidth
                      helperText={
                        helper(Boolean(state.address)) ||
                        t("Address logic helper")
                      }
                      error={err(Boolean(state.address))}
                      value={state.address ?? ''}
                      onChange={(e) => setState((s: any) => ({ ...s, address: e.target.value }))}
                    />
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <TextField
                      label={t("ZIP Code *")}
                      fullWidth
                      error={err(Boolean(state.zipCode))}
                      helperText={helper(Boolean(state.zipCode))}
                      value={state.zipCode ?? ''}
                      onChange={(e) => setState((s: any) => ({ ...s, zipCode: e.target.value }))}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <LocationPickerMap
                      addressToGeocode={state.address}
                      initialCoordinates={state.location?.coordinates as [number, number]}
                      onLocationChange={(coords) => setState((s: any) => ({
                        ...s,
                        location: { type: 'Point', coordinates: coords }
                      }))}
                    />
                    {err(Boolean(state.location?.coordinates && state.location.coordinates.length === 2)) && (
                      <Typography color="error" variant="caption" sx={{ mt: 1, display: 'block' }}>
                        {t("Map confirm helper")}
                      </Typography>
                    )}
                  </Grid>
                </Grid>

                <Divider sx={{ my: { xs: 2.5, md: 2.5 } }} />

                {/* --- 4. CONFIGURACIÓN Y CONTRATO --- */}
                <Typography variant="h6" sx={{ mb: 1.5, fontWeight: 600, color: 'primary.main', display: 'flex', alignItems: 'center', gap: 1 }}>
                  <span>🧰</span> {t("Configuration and Contract")}
                </Typography>

                <Grid container spacing={1.5}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      select
                      label={t("Store Type *")}
                      fullWidth
                      error={err(Boolean(state.type))}
                      helperText={helper(Boolean(state.type))}
                      value={state.type ?? 'basic'}
                      onChange={(e) =>
                        setState((s: any) => ({
                          ...s,
                          type: e.target.value as string,
                        }))
                      }
                    >
                      <MenuItem value="elite">Elite</MenuItem>
                      <MenuItem value="basic">Basic</MenuItem>
                      <MenuItem value="free">Free</MenuItem>
                    </TextField>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <TextField
                      select
                      label={t("Membership Cycle *")}
                      fullWidth
                      error={err(Boolean(state.membership))}
                      helperText={helper(Boolean(state.membership))}
                      value={state.membership ?? ''}
                      onChange={(e) =>
                        setState((s: any) => ({
                          ...s,
                          membership: e.target.value as any,
                        }))
                      }
                    >
                      <MenuItem value="Semanal">{t("Weekly")}</MenuItem>
                      <MenuItem value="Mensual">{t("Monthly")}</MenuItem>
                    </TextField>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
                      <DatePicker
                        label={t("Contract Start Date *")}
                        value={state.startDate ? new Date(state.startDate) : null}
                        onChange={(date) => {
                          const val =
                            date instanceof Date && !isNaN(date.getTime())
                              ? date.toISOString().slice(0, 10)
                              : '';
                          setState((s) => ({ ...s, startDate: val }));
                        }}
                        slotProps={{
                          textField: {
                            fullWidth: true,
                            required: true,
                            size: isMobile ? 'small' : 'medium',
                          },
                        }}
                      />
                    </LocalizationProvider>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Autocomplete
                      options={sweepstakes}
                      getOptionLabel={(option: any) => option.name || ''}
                      value={selectedSweepstake || null}
                      onChange={(event, newValue) => {
                        setState((s: any) => ({
                          ...s,
                          sweepstakeId: newValue ? newValue.id : '',
                        }));
                      }}
                      renderOption={(props, option) => (
                        <Box component="li" sx={{ '& > img': { mr: 2, flexShrink: 0 } }} {...props} key={"sweepstake-" + option.id}>
                          {option.image ? (
                            <Avatar src={option.image} variant="rounded" sx={{ width: 32, height: 32, mr: 2 }} />
                          ) : (
                            <Box sx={{ width: 32, height: 32, mr: 2, bgcolor: 'grey.300', borderRadius: 1 }} />
                          )}
                          {option.name}
                        </Box>
                      )}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label={t("Active Main Sweepstake *")}
                          error={err(Boolean(state.sweepstakeId))}
                          helperText={swLoading ? t("Loading sweepstakes...") : helper(Boolean(state.sweepstakeId))}
                        />
                      )}
                    />
                  </Grid>

                  <Grid item xs={12} sx={{ mt: 1 }}>
                    <UploadDrop
                      label={t("Signed Contract (Optional - Image or PDF)")}
                      accept="application/pdf,image/*"
                      file={state.contractFile ?? null}
                      onChange={(file) => {
                        if (!file) {
                          setState((s: any) => ({
                            ...s,
                            contractFile: null,
                            contractFileB64: null,
                          }));
                          return;
                        }

                        const reader = new FileReader();
                        reader.onload = () => {
                          const res = (reader.result as string) || '';
                          setState((s: any) => ({
                            ...s,
                            contractFile: file,
                            contractFileB64: res.split(',')[1],
                          }));
                        };
                        reader.readAsDataURL(file);
                      }}
                    />
                  </Grid>
                </Grid>

                <Divider sx={{ my: { xs: 2.5, md: 2.5 } }} />

                {/* --- 5. REDES E INFORMACIÓN --- */}
                <Typography variant="h6" sx={{ mb: 1.5, fontWeight: 600, color: 'primary.main', display: 'flex', alignItems: 'center', gap: 1 }}>
                  <span>🌐</span> {t("Social Media and Extra Info")}
                </Typography>

                <Grid container spacing={1.5}>
                  <Grid item xs={12} md={4}>
                    <TextField
                      label={t("Website (optional)")}
                      fullWidth
                      value={state.website ?? ''}
                      onChange={(e) => setState((s: any) => ({ ...s, website: e.target.value }))}
                    />
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <TextField
                      label={t("Facebook (optional)")}
                      fullWidth
                      value={state.facebook ?? ''}
                      onChange={(e) => setState((s: any) => ({ ...s, facebook: e.target.value }))}
                    />
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <TextField
                      label={t("Instagram (optional)")}
                      fullWidth
                      value={state.instagram ?? ''}
                      onChange={(e) => setState((s: any) => ({ ...s, instagram: e.target.value }))}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      label={t("Store description (optional)")}
                      fullWidth
                      multiline
                      minRows={3}
                      value={state.description ?? ''}
                      onChange={(e) => setState((s: any) => ({ ...s, description: e.target.value }))}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      label={t("Extra Comments (optional)")}
                      fullWidth
                      multiline
                      minRows={3}
                      value={state.extraInfo ?? ''}
                      onChange={(e) => setState((s: any) => ({ ...s, extraInfo: e.target.value }))}
                    />
                  </Grid>
                </Grid>

                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    mt: { xs: 2, md: 2.5 },
                  }}
                >
                  <Button
                    variant="contained"
                    onClick={nextTab}
                    disabled={!isValid}
                    size="large"
                    sx={{ px: { xs: 3, md: 5 }, py: 1.5, fontSize: '1.05rem' }}
                  >
                    {t("Next: Equipment and Owner")}
                  </Button>
                </Box>
              </Box>
            </CustomTabPanel>
            <CustomTabPanel value={tabValue} index={1}>
              <Box sx={{ minHeight: 400 }}>
                <CreateStoreStep2
                  onBack={() => setTabValue(0)}
                  onSubmit={handleFinalSubmit}
                />
              </Box>
            </CustomTabPanel>
          </CardContent>
        </Card>

        <BrandCreationModal
          open={brandModalOpen}
          onClose={() => setBrandModalOpen(false)}
          onSuccess={(newBrandId) => {
            setState((s: any) => ({ ...s, brandId: newBrandId }));
            setBrandModalOpen(false);
          }}
        />
      </Container>
    </ThemeProvider>
  );
}

function SuccessImportSection({ storeId, onFinish }: { storeId: string; onFinish: () => void }) {
  const [parsedCustomers, setParsedCustomers] = React.useState<ParsedCustomer[] | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [results, setResults] = React.useState<any>(null);

  const handleImport = async () => {
    if (!parsedCustomers || parsedCustomers.length === 0) return;
    setLoading(true);
    setProgress(0);
    try {
      const response = await customerClient.importCustomers(storeId, parsedCustomers, (curr, tot) => {
        setProgress(Math.round((curr / tot) * 100));
      });
      setResults(response);
      toast.success('Proceso de importación finalizado.');
    } catch (err) {
      toast.error('Ocurrió un error en la importación. Intenta de nuevo.');
    } finally {
      setLoading(false);
      setProgress(0);
    }
  };

  if (results) {
    return (
      <Box textAlign="center" p={3} border="1px solid" borderColor="divider" borderRadius={2} bgcolor="background.paper">
         <Typography variant="h6" gutterBottom color="success.main">
            ¡Importación exitosa!
         </Typography>
         <Box display="flex" gap={2} mb={3} mt={3}>
            <Box flex={1}>
              <Typography variant="h4" fontWeight="bold" color="success.main">{results.inserted}</Typography>
              <Typography variant="body2" color="text.secondary">Nuevos</Typography>
            </Box>
            <Box flex={1}>
              <Typography variant="h4" fontWeight="bold" color="info.main">{results.updated}</Typography>
              <Typography variant="body2" color="text.secondary">Actualizados</Typography>
            </Box>
            <Box flex={1}>
              <Typography variant="h4" fontWeight="bold" color="error.main">{results.failed}</Typography>
              <Typography variant="body2" color="text.secondary">Errores</Typography>
            </Box>
         </Box>
         <Button variant="contained" color="primary" onClick={onFinish} size="large" fullWidth>
           Ir a panel de la tienda
         </Button>
      </Box>
    );
  }

  return (
    <Box>
      <ExcelCustomerDropzone 
        onExtracted={(data) => setParsedCustomers(data.length > 0 ? data : null)} 
        isLoading={loading} 
      />
      {parsedCustomers && parsedCustomers.length > 0 && (
         <Box mt={3} display="flex" justifyContent="center">
           <Button 
             variant="contained" 
             color="primary" 
             size="large" 
             onClick={handleImport} 
             disabled={loading}
             fullWidth
             sx={{ py: 1.5, fontSize: '1.05rem', fontWeight: 'bold' }}
           >
             {loading ? (progress > 0 ? `Subiendo datos (${progress}%)...` : 'Iniciando subida...') : 'Confirmar e Importar al Servidor'}
           </Button>
         </Box>
      )}
    </Box>
  );
}
