'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Box, Container, Grid, Card, CardContent, Typography, Button,
  Alert, Chip, Stack, TextField, Autocomplete, Avatar, CircularProgress,
  Divider, IconButton, Tooltip,
} from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import VisibilityIcon from '@mui/icons-material/Visibility';
import StorefrontIcon from '@mui/icons-material/Storefront';
import LinkRoundedIcon from '@mui/icons-material/LinkRounded';
import ContentCopyRoundedIcon from '@mui/icons-material/ContentCopyRounded';
import RestaurantMenuRoundedIcon from '@mui/icons-material/RestaurantMenuRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import { useTranslation } from 'react-i18next';
import PageHeading from 'src/components/base/page-heading';
import { useCustomization } from 'src/hooks/use-customization';
import FlyerUploader from '@/components/mms/FlyerUploader';
import ExtractedProductsTable from '@/components/mms/ExtractedProductsTable';
import MmsPreviewPhone from '@/components/mms/MmsPreviewPhone';
import MmsActionBar from '@/components/mms/MmsActionBar';
import { useStores } from '@/hooks/useStores';

// ─── Types ───────────────────────────────────────────────────────────────────

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

export interface RcsRecipe {
  name: string;
  tags: string[];
  time: string;
  savings?: string;
  ingredients: string[];
}

const MAX_MMS_PRODUCTS = 10;

// ─── Helpers ─────────────────────────────────────────────────────────────────

const RECIPE_TAGS = ['Latino', 'Familiar', 'Mariscos', 'Saludable', 'Rápido', 'Especial'];

const BLANK_RECIPE: RcsRecipe = { name: '', tags: [], time: '', savings: '', ingredients: [] };

// ─── Step Badge ───────────────────────────────────────────────────────────────

const StepBadge = React.memo(({ num }: { num: number }) => (
  <Box
    component="span"
    sx={{
      width: 28, height: 28, borderRadius: '50%',
      background: 'linear-gradient(135deg, #DC1F26 0%, #ff6b6b 100%)',
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      color: 'white', fontSize: 14, fontWeight: 'bold',
    }}
  >
    {num}
  </Box>
));
StepBadge.displayName = 'StepBadge';

// ─── RCS Link Card ────────────────────────────────────────────────────────────

function RcsLinkCard({ storeSlug, circularId }: { storeSlug: string; circularId: string }) {
  const [copied, setCopied] = useState(false);

  const linkTemplate = storeSlug
    ? `https://st.sweepstouch.com/rcs/{customerId}?store=${storeSlug}${circularId ? `&circular=${circularId}` : ''}`
    : 'https://st.sweepstouch.com/rcs/{customerId}?store={storeSlug}';

  const copy = () => {
    navigator.clipboard.writeText(linkTemplate).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <Card sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
      <CardContent>
        <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <LinkRoundedIcon color="primary" fontSize="small" />
          RCS Unique Link
        </Typography>
        <Typography sx={{ fontSize: 12, color: 'text.secondary', mb: 1.5 }}>
          Each customer receives a personalized link. The <code>{'{customerId}'}</code> placeholder is replaced per recipient when the campaign is sent.
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', bgcolor: 'action.hover',
          borderRadius: 1.5, px: 2, py: 1.5 }}>
          <Typography sx={{ flex: 1, fontSize: 12, fontFamily: 'monospace', wordBreak: 'break-all',
            color: 'text.primary' }}>
            {linkTemplate}
          </Typography>
          <Tooltip title={copied ? 'Copied!' : 'Copy link'}>
            <IconButton size="small" onClick={copy} color={copied ? 'success' : 'default'}>
              <ContentCopyRoundedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
        <Typography sx={{ fontSize: 11, color: 'text.secondary', mt: 1 }}>
          The RCS web view at <code>/rcs/[customerId]</code> shows categories, recipes, shopping list, circular viewer, and OCR receipt validation.
        </Typography>
      </CardContent>
    </Card>
  );
}

// ─── Recipes Editor ───────────────────────────────────────────────────────────

function RecipesEditor({
  recipes,
  onChange,
  products,
}: {
  recipes: RcsRecipe[];
  onChange: (r: RcsRecipe[]) => void;
  products: ExtractedProduct[];
}) {
  const [draft, setDraft] = useState<RcsRecipe>(BLANK_RECIPE);
  const [adding, setAdding] = useState(false);

  const productNames = products.map(p => p.name);

  const addRecipe = () => {
    if (!draft.name.trim()) return;
    onChange([...recipes, draft]);
    setDraft(BLANK_RECIPE);
    setAdding(false);
  };

  const removeRecipe = (i: number) => {
    onChange(recipes.filter((_, idx) => idx !== i));
  };

  const updateDraftIngredient = (val: string) => {
    setDraft(d => ({ ...d, ingredients: val.split(',').map(s => s.trim()).filter(Boolean) }));
  };

  return (
    <Box>
      {recipes.length === 0 && !adding && (
        <Typography sx={{ fontSize: 13, color: 'text.secondary', mb: 2 }}>
          No recipes configured. The RCS app will auto-suggest recipes based on product categories.
        </Typography>
      )}

      {/* Recipe list */}
      {recipes.map((r, i) => (
        <Box key={i} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, mb: 1.5,
          p: 1.5, bgcolor: 'action.hover', borderRadius: 2 }}>
          <RestaurantMenuRoundedIcon sx={{ fontSize: 18, color: 'text.secondary', mt: 0.3 }} />
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography sx={{ fontWeight: 700, fontSize: 14 }}>{r.name}</Typography>
            <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
              {r.time && `⏱ ${r.time}`}
              {r.savings && ` · Ahorra ${r.savings}`}
            </Typography>
            {r.tags.length > 0 && (
              <Stack direction="row" spacing={0.5} sx={{ mt: 0.5, flexWrap: 'wrap', gap: 0.5 }}>
                {r.tags.map(t => <Chip key={t} label={t} size="small" sx={{ height: 18, fontSize: 10 }} />)}
              </Stack>
            )}
            {r.ingredients.length > 0 && (
              <Typography sx={{ fontSize: 11, color: 'text.secondary', mt: 0.5 }}>
                {r.ingredients.join(', ')}
              </Typography>
            )}
          </Box>
          <IconButton size="small" onClick={() => removeRecipe(i)}>
            <DeleteOutlineRoundedIcon fontSize="small" />
          </IconButton>
        </Box>
      ))}

      {/* Add form */}
      {adding ? (
        <Box sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth size="small" label="Recipe name" value={draft.name}
                onChange={e => setDraft(d => ({ ...d, name: e.target.value }))} />
            </Grid>
            <Grid item xs={6} sm={3}>
              <TextField fullWidth size="small" label="Time (e.g. 30 min)" value={draft.time}
                onChange={e => setDraft(d => ({ ...d, time: e.target.value }))} />
            </Grid>
            <Grid item xs={6} sm={3}>
              <TextField fullWidth size="small" label="Savings (e.g. $4.50)" value={draft.savings || ''}
                onChange={e => setDraft(d => ({ ...d, savings: e.target.value }))} />
            </Grid>
            <Grid item xs={12}>
              <Autocomplete
                multiple
                options={productNames}
                value={draft.ingredients}
                freeSolo
                onChange={(_, v) => setDraft(d => ({ ...d, ingredients: v }))}
                renderInput={p => <TextField {...p} size="small" label="Ingredients (select or type)" />}
              />
            </Grid>
            <Grid item xs={12}>
              <Autocomplete
                multiple
                options={RECIPE_TAGS}
                value={draft.tags}
                onChange={(_, v) => setDraft(d => ({ ...d, tags: v }))}
                renderInput={p => <TextField {...p} size="small" label="Tags" />}
              />
            </Grid>
          </Grid>
          <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
            <Button variant="contained" size="small" onClick={addRecipe}
              disabled={!draft.name.trim()}>
              Add Recipe
            </Button>
            <Button variant="outlined" size="small" color="inherit"
              onClick={() => { setAdding(false); setDraft(BLANK_RECIPE); }}>
              Cancel
            </Button>
          </Stack>
        </Box>
      ) : (
        <Button startIcon={<AddRoundedIcon />} variant="outlined" size="small"
          onClick={() => setAdding(true)}>
          Add Recipe
        </Button>
      )}
    </Box>
  );
}

// ─── Page Component ───────────────────────────────────────────────────────────

function MmsGeneratorPage(): React.JSX.Element {
  const customization = useCustomization();
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const preselectedId = searchParams.get('storeId');

  const { stores, loading: loadingStores, selectedStore, setSelectedStore } = useStores(preselectedId);

  // ─── MMS state ───
  const [circularId, setCircularId] = useState('');
  const [products, setProducts] = useState<ExtractedProduct[]>([]);
  const [headline, setHeadline] = useState('');
  const [extractionStatus, setExtractionStatus] = useState('idle');
  const [campaignCode, setCampaignCode] = useState('');
  const [validDates, setValidDates] = useState('');
  const [generationResult, setGenerationResult] = useState<{ generated: number; skipped: number } | null>(null);
  const [circularFileUrl, setCircularFileUrl] = useState('');
  const [recipes, setRecipes] = useState<RcsRecipe[]>([]);

  // ─── Theme (no override, use store theme directly) ───
  const mmsTheme = useMemo(() => {
    if (!selectedStore) return {};
    const theme = { ...(selectedStore.mmsTheme || {}) };
    if (!theme.logoUrl && selectedStore.image && selectedStore.image !== 'no-image.jpg') {
      theme.logoUrl = selectedStore.image;
    }
    return theme;
  }, [selectedStore]);

  const storeSlug = selectedStore?.slug || '';

  // ─── Handlers ───
  const handleStoreChange = useCallback((_e: any, newValue: any) => {
    setSelectedStore(newValue);
    setCircularId('');
    setProducts([]);
    setHeadline('');
    setExtractionStatus('idle');
    setCampaignCode('');
    setValidDates('');
    setGenerationResult(null);
    setCircularFileUrl('');
    setRecipes([]);
  }, [setSelectedStore]);

  const handleCircularCreated = useCallback((circular: { _id: string; storeSlug: string; startDate: string; endDate: string; fileUrl?: string }) => {
    setCircularId(circular._id);
    if (circular.fileUrl) setCircularFileUrl(circular.fileUrl);
    const start = new Date(circular.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const end = new Date(circular.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    setValidDates(`${start} - ${end}`);
  }, []);

  const handleExtracted = useCallback((extracted: { products: ExtractedProduct[]; headline: string; validDates?: string }) => {
    const sorted = [...extracted.products].sort((a, b) => {
      if (a.isHero && !b.isHero) return -1;
      if (!a.isHero && b.isHero) return 1;
      return 0;
    });
    setProducts(sorted);
    setHeadline(extracted.headline);
    setExtractionStatus('completed');
    if (extracted.validDates) setValidDates(extracted.validDates);
  }, []);

  const handleProductsChange = useCallback((updated: ExtractedProduct[]) => {
    setProducts(updated);
  }, []);

  const mmsProducts = useMemo(() => products.slice(0, MAX_MMS_PRODUCTS), [products]);

  return (
    <>
      <Container sx={{ py: { xs: 2, sm: 3 } }} maxWidth={customization.stretch ? false : 'xl'}>
        <PageHeading
          sx={{ px: 0 }}
          title={t('MMS Generator')}
          description="Generate personalized MMS/RCS campaigns from flyer images using AI"
          actions={
            <Stack direction="row" spacing={1}>
              {selectedStore && (
                <Chip icon={<StorefrontIcon />} label={selectedStore.name} color="primary" variant="outlined" />
              )}
              {extractionStatus === 'completed' && (
                <>
                  <Chip icon={<AutoAwesomeIcon />} label={`${products.length} products extracted`} color="success" variant="outlined" />
                  {products.length > MAX_MMS_PRODUCTS && (
                    <Chip label={`${MAX_MMS_PRODUCTS} will be sent in MMS`} color="warning" size="small" variant="outlined" />
                  )}
                </>
              )}
            </Stack>
          }
        />
      </Container>

      <Box pb={{ xs: 2, sm: 3 }}>
        <Container maxWidth={customization.stretch ? false : 'xl'}>
          {/* ─── Store Selector ── */}
          <Card sx={{ mb: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <StorefrontIcon color="primary" />
                Select Store
              </Typography>

              <Autocomplete
                value={selectedStore}
                onChange={handleStoreChange}
                options={stores}
                loading={loadingStores}
                getOptionLabel={(option) => option.name}
                isOptionEqualToValue={(option, value) => option._id === value._id}
                renderOption={(props, option) => {
                  const { key, ...rest } = props as any;
                  return (
                    <Box component="li" key={key || option._id} {...rest}
                      sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1.5,
                        '&:hover': { background: 'rgba(220, 31, 38, 0.04) !important' },
                      }}
                    >
                      <Avatar
                        src={option.image !== 'no-image.jpg' ? option.image : undefined}
                        sx={{ width: 36, height: 36, bgcolor: '#DC1F26', fontSize: 14, fontWeight: 'bold' }}
                      >
                        {option.name?.charAt(0)?.toUpperCase()}
                      </Avatar>
                      <Box sx={{ flex: 1 }}>
                        <Typography sx={{ fontWeight: 600, fontSize: 14 }}>{option.name}</Typography>
                        <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
                          {option.slug} · {option.customerCount || 0} customers · {option.type}
                        </Typography>
                      </Box>
                      <Chip
                        label={option.type} size="small"
                        sx={{
                          height: 22, fontSize: 11, fontWeight: 'bold',
                          bgcolor: option.type === 'elite' ? '#FFD700' : option.type === 'basic' ? '#90CAF9' : '#E0E0E0',
                          color: '#333',
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
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, fontSize: 15 } }}
                  />
                )}
                noOptionsText="No stores found"
                sx={{ maxWidth: 600 }}
              />

              {!selectedStore && !loadingStores && (
                <Typography sx={{ mt: 1.5, fontSize: 13, color: 'text.secondary' }}>
                  💡 Select a store to start creating an MMS/RCS campaign.
                </Typography>
              )}
            </CardContent>
          </Card>

          {selectedStore && (
            <Grid container spacing={3}>
              {/* Left Column */}
              <Grid item xs={12} lg={7}>
                {/* Step 1: Upload Flyer */}
                <Card sx={{ mb: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
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

                {/* Step 2: Products + Categories */}
                {products.length > 0 && (
                  <Card sx={{ mb: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                    <CardContent>
                      <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                        <StepBadge num={2} />
                        Products &amp; Categories
                        <Chip size="small" label={extractionStatus === 'completed' ? 'AI Extracted' : 'Manual'}
                          color={extractionStatus === 'completed' ? 'info' : 'default'} sx={{ ml: 1 }} />
                        {products.length > MAX_MMS_PRODUCTS && (
                          <Chip size="small" label={`⚠️ Only first ${MAX_MMS_PRODUCTS} of ${products.length} will be in MMS`}
                            color="warning" variant="outlined" />
                        )}
                      </Typography>

                      <TextField fullWidth label="Headline" value={headline}
                        onChange={(e) => setHeadline(e.target.value)} size="small" sx={{ mb: 2 }} />

                      <Typography sx={{ fontSize: 12, color: 'text.secondary', mb: 1.5 }}>
                        Categories are assigned automatically by AI. Edit them in the table below — they appear as filter tabs in the RCS web view.
                      </Typography>

                      <ExtractedProductsTable products={products} onChange={handleProductsChange} />

                      {/* Category summary */}
                      {products.length > 0 && (() => {
                        const cats = [...new Set(products.map(p => p.category).filter(Boolean))];
                        return cats.length > 0 ? (
                          <Box sx={{ mt: 2 }}>
                            <Typography sx={{ fontSize: 12, fontWeight: 600, color: 'text.secondary', mb: 1 }}>
                              Categories in this campaign:
                            </Typography>
                            <Stack direction="row" spacing={0.5} flexWrap="wrap" gap={0.5}>
                              {cats.map(c => (
                                <Chip key={c} label={c} size="small" color="primary" variant="outlined" />
                              ))}
                            </Stack>
                          </Box>
                        ) : null;
                      })()}
                    </CardContent>
                  </Card>
                )}

                {/* Step 3: RCS Recipes */}
                {products.length > 0 && (
                  <Card sx={{ mb: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                    <CardContent>
                      <Typography variant="h6" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <StepBadge num={3} />
                        RCS Recipes
                      </Typography>
                      <Typography sx={{ fontSize: 12, color: 'text.secondary', mb: 2 }}>
                        Recipes shown in the Recetas tab of the RCS web view. If left empty, the app auto-suggests based on product categories.
                      </Typography>
                      <RecipesEditor recipes={recipes} onChange={setRecipes} products={products} />
                    </CardContent>
                  </Card>
                )}

                {/* Step 4: Generate & Send */}
                {products.length > 0 && (
                  <Card sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, mb: 3 }}>
                    <CardContent>
                      <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <StepBadge num={4} />
                        Generate &amp; Send MMS
                      </Typography>

                      <TextField fullWidth label="Campaign Code (e.g. VIP0411)" value={campaignCode}
                        onChange={(e) => setCampaignCode(e.target.value.toUpperCase())} size="small"
                        sx={{ mb: 2 }} placeholder="VIP0411" />

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

                {/* RCS Link */}
                {selectedStore && (
                  <RcsLinkCard storeSlug={storeSlug} circularId={circularId} />
                )}
              </Grid>

              {/* Right Column — Preview only */}
              <Grid item xs={12} lg={5}>
                <Box sx={{ position: 'sticky', top: 24 }}>
                  <Card sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
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
