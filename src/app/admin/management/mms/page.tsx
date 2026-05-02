'use client';

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Box,
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  Chip,
  Stack,
  TextField,
  Autocomplete,
  Avatar,
  CircularProgress,
} from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import VisibilityIcon from '@mui/icons-material/Visibility';
import StorefrontIcon from '@mui/icons-material/Storefront';
import { useTranslation } from 'react-i18next';
import PageHeading from 'src/components/base/page-heading';
import { useCustomization } from 'src/hooks/use-customization';
import FlyerUploader from '@/components/mms/FlyerUploader';
import ExtractedProductsTable from '@/components/mms/ExtractedProductsTable';
import MmsPreviewPhone from '@/components/mms/MmsPreviewPhone';
import MmsActionBar from '@/components/mms/MmsActionBar';
import MmsThemeEditor from '@/components/mms/MmsThemeEditor';
import { getAllStores, type Store } from '@/services/store.service';

// ─── Types ──────────────────────────────────────────────
export interface ExtractedProduct {
  _id?: string;
  name: string;
  price: string;
  unit?: string;
  originalPrice?: string;
  savings?: string;
  category?: string;
  emoji?: string;
  imageUrl?: string;
  isHero?: boolean;
}

const MAX_MMS_PRODUCTS = 6;

// ─── Page Component ─────────────────────────────────────
function MmsGeneratorPage(): React.JSX.Element {
  const customization = useCustomization();
  const { t } = useTranslation();
  const searchParams = useSearchParams();

  // Store selection
  const [stores, setStores] = useState<Store[]>([]);
  const [loadingStores, setLoadingStores] = useState(true);
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);

  // MMS state
  const [circularId, setCircularId] = useState<string>('');
  const [products, setProducts] = useState<ExtractedProduct[]>([]);
  const [headline, setHeadline] = useState('');
  const [extractionStatus, setExtractionStatus] = useState<string>('idle');
  const [campaignCode, setCampaignCode] = useState('');
  const [validDates, setValidDates] = useState('');
  const [generationResult, setGenerationResult] = useState<{ generated: number; skipped: number } | null>(null);
  const [mmsTheme, setMmsTheme] = useState<Record<string, any>>({});
  const [circularFileUrl, setCircularFileUrl] = useState('');

  // Load stores on mount
  useEffect(() => {
    (async () => {
      try {
        const data = await getAllStores();
        const sorted = (data || [])
          .filter((s: Store) => s.active)
          .sort((a: Store, b: Store) => (b.customerCount || 0) - (a.customerCount || 0));
        setStores(sorted);

        // Pre-select store from URL
        const preselectedId = searchParams.get('storeId');
        if (preselectedId) {
          const found = sorted.find((s: Store) => s._id === preselectedId || s.id === preselectedId);
          if (found) setSelectedStore(found);
        }
      } catch (err) {
        console.error('Failed to load stores:', err);
      } finally {
        setLoadingStores(false);
      }
    })();
  }, [searchParams]);

  // React to selectedStore changes
  useEffect(() => {
    if (selectedStore) {
      const theme = selectedStore.mmsTheme || {};
      if (!theme.logoUrl && selectedStore.image && selectedStore.image !== 'no-image.jpg') {
        theme.logoUrl = selectedStore.image;
      }
      setMmsTheme(theme);
    } else {
      setMmsTheme({});
    }
  }, [selectedStore]);

  const storeSlug = selectedStore?.slug || '';

  // After circular upload
  const handleCircularCreated = useCallback((circular: { _id: string; storeSlug: string; startDate: string; endDate: string; fileUrl?: string }) => {
    setCircularId(circular._id);
    if (circular.fileUrl) setCircularFileUrl(circular.fileUrl);
    const start = new Date(circular.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const end = new Date(circular.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    setValidDates(`${start} - ${end}`);
  }, []);

  // After AI extraction — limit to MAX_MMS_PRODUCTS and use extracted dates
  const handleExtracted = useCallback((extracted: { products: ExtractedProduct[]; headline: string; validDates?: string }) => {
    // Sort: hero products first, then by price desc
    const sorted = [...extracted.products].sort((a, b) => {
      if (a.isHero && !b.isHero) return -1;
      if (!a.isHero && b.isHero) return 1;
      return 0;
    });
    setProducts(sorted);
    setHeadline(extracted.headline);
    setExtractionStatus('completed');
    // Use the AI-extracted valid dates if available
    if (extracted.validDates) {
      setValidDates(extracted.validDates);
    }
  }, []);

  // Products limited to 6 for MMS
  const mmsProducts = useMemo(() => products.slice(0, MAX_MMS_PRODUCTS), [products]);

  // Product edit
  const handleProductsChange = useCallback((updated: ExtractedProduct[]) => {
    setProducts(updated);
  }, []);

  // Step number badge
  const StepBadge = ({ num }: { num: number }) => (
    <Box
      component="span"
      sx={{
        width: 28,
        height: 28,
        borderRadius: '50%',
        background: 'linear-gradient(135deg, #DC1F26 0%, #ff6b6b 100%)',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontSize: 14,
        fontWeight: 'bold',
      }}
    >
      {num}
    </Box>
  );

  return (
    <>
      <Container
        sx={{ py: { xs: 2, sm: 3 } }}
        maxWidth={customization.stretch ? false : 'xl'}
      >
        <PageHeading
          sx={{ px: 0 }}
          title={t('MMS Generator')}
          description="Generate personalized MMS campaigns from flyer images using AI"
          actions={
            <Stack direction="row" spacing={1}>
              {selectedStore && (
                <Chip
                  icon={<StorefrontIcon />}
                  label={selectedStore.name}
                  color="primary"
                  variant="outlined"
                />
              )}
              {extractionStatus === 'completed' && (
                <>
                  <Chip
                    icon={<AutoAwesomeIcon />}
                    label={`${products.length} products extracted`}
                    color="success"
                    variant="outlined"
                  />
                  {products.length > MAX_MMS_PRODUCTS && (
                    <Chip
                      label={`${MAX_MMS_PRODUCTS} will be sent in MMS`}
                      color="warning"
                      size="small"
                      variant="outlined"
                    />
                  )}
                </>
              )}
            </Stack>
          }
        />
      </Container>

      <Box pb={{ xs: 2, sm: 3 }}>
        <Container maxWidth={customization.stretch ? false : 'xl'}>
          {/* ─── Store Selector ────────────────────────────── */}
          <Card
            sx={{
              mb: 3,
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 2,
              background: (theme) =>
                theme.palette.mode === 'dark'
                  ? 'linear-gradient(135deg, rgba(25,25,40,0.9) 0%, rgba(35,35,55,0.9) 100%)'
                  : 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(248,249,252,0.95) 100%)',
            }}
          >
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <StorefrontIcon color="primary" />
                Select Store
              </Typography>

              <Autocomplete
                value={selectedStore}
                onChange={(_e, newValue) => {
                  setSelectedStore(newValue);
                  // Reset MMS state when store changes
                  setCircularId('');
                  setProducts([]);
                  setHeadline('');
                  setExtractionStatus('idle');
                  setCampaignCode('');
                  setValidDates('');
                  setGenerationResult(null);
                  // setMmsTheme({}); // Removed because useEffect handles it
                }}
                options={stores}
                loading={loadingStores}
                getOptionLabel={(option) => option.name}
                isOptionEqualToValue={(option, value) => option._id === value._id}
                renderOption={(props, option) => {
                  const { key, ...rest } = props as any;
                  return (
                  <Box
                    component="li"
                    key={key || option._id}
                    {...rest}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1.5,
                      py: 1.5,
                      '&:hover': { background: 'rgba(220, 31, 38, 0.04) !important' },
                    }}
                  >
                    <Avatar
                      src={option.image !== 'no-image.jpg' ? option.image : undefined}
                      sx={{
                        width: 36,
                        height: 36,
                        bgcolor: '#DC1F26',
                        fontSize: 14,
                        fontWeight: 'bold',
                      }}
                    >
                      {option.name?.charAt(0)?.toUpperCase()}
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Typography sx={{ fontWeight: 600, fontSize: 14 }}>
                        {option.name}
                      </Typography>
                      <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
                        {option.slug} · {option.customerCount || 0} customers · {option.type}
                      </Typography>
                    </Box>
                    <Chip
                      label={option.type}
                      size="small"
                      sx={{
                        height: 22,
                        fontSize: 11,
                        fontWeight: 'bold',
                        bgcolor:
                          option.type === 'elite'
                            ? '#FFD700'
                            : option.type === 'basic'
                              ? '#90CAF9'
                              : '#E0E0E0',
                        color: option.type === 'elite' ? '#333' : '#333',
                      }}
                    />
                  </Box>
                  );
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    placeholder="Search stores by name..."
                    variant="outlined"
                    InputProps={{
                      ...params.InputProps,
                      startAdornment: (
                        <>
                          <StorefrontIcon sx={{ color: 'text.secondary', mr: 1 }} />
                          {params.InputProps.startAdornment}
                        </>
                      ),
                      endAdornment: (
                        <>
                          {loadingStores ? <CircularProgress color="inherit" size={20} /> : null}
                          {params.InputProps.endAdornment}
                        </>
                      ),
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        fontSize: 15,
                      },
                    }}
                  />
                )}
                noOptionsText="No stores found"
                sx={{ maxWidth: 600 }}
              />

              {!selectedStore && !loadingStores && (
                <Typography sx={{ mt: 1.5, fontSize: 13, color: 'text.secondary' }}>
                  💡 Select a store to start creating an MMS campaign. You can also arrive here from a store&apos;s campaign tab.
                </Typography>
              )}
            </CardContent>
          </Card>

          {/* ─── Main Content (only visible when store is selected) ── */}
          {selectedStore && (
            <Grid container spacing={3}>
              {/* Left Column — Upload + Products Table */}
              <Grid item xs={12} lg={7}>
                {/* Step 1: Upload Flyer */}
                <Card
                  sx={{
                    mb: 3,
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 2,
                  }}
                >
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <StepBadge num={1} />
                      Upload Flyer
                    </Typography>
                    <FlyerUploader
                      storeSlug={storeSlug}
                      onCircularCreated={handleCircularCreated}
                      onExtracted={handleExtracted}
                      extractionStatus={extractionStatus}
                      onExtractionStatusChange={setExtractionStatus}
                    />
                  </CardContent>
                </Card>

                {/* Step 2: Extracted Products Table */}
                {products.length > 0 && (
                  <Card
                    sx={{
                      mb: 3,
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 2,
                    }}
                  >
                    <CardContent>
                      <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                        <StepBadge num={2} />
                        Extracted Products
                        <Chip
                          size="small"
                          label={extractionStatus === 'completed' ? 'AI Extracted' : 'Manual'}
                          color={extractionStatus === 'completed' ? 'info' : 'default'}
                          sx={{ ml: 1 }}
                        />
                        {products.length > MAX_MMS_PRODUCTS && (
                          <Chip
                            size="small"
                            label={`⚠️ Only first ${MAX_MMS_PRODUCTS} of ${products.length} will be in MMS`}
                            color="warning"
                            variant="outlined"
                          />
                        )}
                      </Typography>

                      <TextField
                        fullWidth
                        label="Headline"
                        value={headline}
                        onChange={(e) => setHeadline(e.target.value)}
                        size="small"
                        sx={{ mb: 2 }}
                      />

                      <ExtractedProductsTable
                        products={products}
                        onChange={handleProductsChange}
                      />
                    </CardContent>
                  </Card>
                )}

                {/* Step 3: Generate & Send */}
                {products.length > 0 && (
                  <Card
                    sx={{
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 2,
                    }}
                  >
                    <CardContent>
                      <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <StepBadge num={3} />
                        Generate & Send MMS
                      </Typography>

                      <TextField
                        fullWidth
                        label="Campaign Code (e.g. VIP0411)"
                        value={campaignCode}
                        onChange={(e) => setCampaignCode(e.target.value.toUpperCase())}
                        size="small"
                        sx={{ mb: 2 }}
                        placeholder="VIP0411"
                      />

                      <MmsActionBar
                        circularId={circularId}
                        storeId={selectedStore._id || selectedStore.id || ''}
                        storeSlug={storeSlug}
                        storeName={selectedStore.name}
                        campaignCode={campaignCode}
                        products={mmsProducts}
                        headline={headline}
                        circularFileUrl={circularFileUrl}
                        onGenerated={setGenerationResult}
                        storeProvider={selectedStore.provider}
                        storeBandwidthPhone={selectedStore.bandwidthPhoneNumber}
                        storeBandwidthId={selectedStore.bandwithId}
                        storeInfobipSenderId={selectedStore.infobipSenderId}
                        storeTwilioPhone={selectedStore.twilioPhoneNumber}
                      />

                      {generationResult && (
                        <Alert severity="success" sx={{ mt: 2 }}>
                          ✅ Generated {generationResult.generated} MMS barcodes
                          {generationResult.skipped > 0 && ` (${generationResult.skipped} already existed)`}
                        </Alert>
                      )}
                    </CardContent>
                  </Card>
                )}
              </Grid>

              {/* Right Column — Phone Preview + Theme Editor */}
              <Grid item xs={12} lg={5}>
                <Box sx={{ position: 'sticky', top: 24 }}>
                  <Card
                    sx={{
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 2,
                      mb: 3,
                    }}
                  >
                    <CardContent>
                      <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <VisibilityIcon fontSize="small" />
                        MMS Preview
                      </Typography>
                      <MmsPreviewPhone
                        products={mmsProducts}
                        headline={headline}
                        campaignCode={campaignCode || 'PREVIEW'}
                        storeName={selectedStore.name}
                        validDates={validDates || 'This Week Only'}
                        theme={mmsTheme}
                      />
                    </CardContent>
                  </Card>

                  {/* Theme Editor */}
                  <Card
                    sx={{
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 2,
                    }}
                  >
                    <CardContent>
                      <MmsThemeEditor
                        storeId={selectedStore?._id || ''}
                        storeSlug={storeSlug}
                        theme={mmsTheme}
                        onThemeChange={setMmsTheme}
                      />
                    </CardContent>
                  </Card>
                </Box>
              </Grid>
            </Grid>
          )}
        </Container>
      </Box>
    </>
  );
}

export default MmsGeneratorPage;
