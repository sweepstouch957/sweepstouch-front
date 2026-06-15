'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Box, Container, Grid, Card, CardContent, Typography, Button,
  Alert, Chip, Stack, TextField, Autocomplete, Avatar, CircularProgress,
  IconButton, Tooltip, Divider,
} from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import VisibilityIcon from '@mui/icons-material/Visibility';
import StorefrontIcon from '@mui/icons-material/Storefront';
import LinkRoundedIcon from '@mui/icons-material/LinkRounded';
import ContentCopyRoundedIcon from '@mui/icons-material/ContentCopyRounded';
import RestaurantMenuRoundedIcon from '@mui/icons-material/RestaurantMenuRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import { useTranslation } from 'react-i18next';
import PageHeading from 'src/components/base/page-heading';
import { useCustomization } from 'src/hooks/use-customization';
import FlyerUploader from '@/components/mms/FlyerUploader';
import ExtractedProductsTable from '@/components/mms/ExtractedProductsTable';
import MmsPreviewPhone from '@/components/mms/MmsPreviewPhone';
import MmsActionBar from '@/components/mms/MmsActionBar';
import { useStores } from '@/hooks/useStores';
import { api } from '@/libs/axios';

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

export interface AiRecipe {
  name: string;
  tags: string[];
  time: string;
  ingredients: string[];
  procedure: string[];
  savings?: string;
}

const MAX_MMS_PRODUCTS = 10;

// ─── Step Badge ───────────────────────────────────────────────────────────────

const StepBadge = React.memo(({ num }: { num: number }) => (
  <Box
    component="span"
    sx={{
      width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
      background: 'linear-gradient(135deg, #DC1F26 0%, #ff6b6b 100%)',
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      color: 'white', fontSize: 13, fontWeight: 'bold',
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
    <Card sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, mt: 2 }}>
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        <Stack direction="row" alignItems="center" spacing={1} mb={1}>
          <LinkRoundedIcon color="primary" sx={{ fontSize: 16 }} />
          <Typography variant="subtitle2" fontWeight={700}>RCS Unique Link</Typography>
        </Stack>
        <Box sx={{ display: 'flex', alignItems: 'center', bgcolor: 'action.hover', borderRadius: 1.5, px: 1.5, py: 1 }}>
          <Typography sx={{ flex: 1, fontSize: 11, fontFamily: 'monospace', wordBreak: 'break-all', color: 'text.primary' }}>
            {linkTemplate}
          </Typography>
          <Tooltip title={copied ? 'Copied!' : 'Copy'}>
            <IconButton size="small" onClick={copy} color={copied ? 'success' : 'default'} sx={{ ml: 0.5 }}>
              <ContentCopyRoundedIcon sx={{ fontSize: 14 }} />
            </IconButton>
          </Tooltip>
        </Box>
        <Typography sx={{ fontSize: 10, color: 'text.disabled', mt: 0.5 }}>
          {'{customerId}'} is replaced per recipient when the campaign is sent.
        </Typography>
      </CardContent>
    </Card>
  );
}

// ─── Recipe Card ──────────────────────────────────────────────────────────────

function RecipeCard({ recipe, onRemove }: { recipe: AiRecipe; onRemove: () => void }) {
  const [showProc, setShowProc] = useState(false);
  return (
    <Box sx={{
      p: 1.5, border: '1px solid', borderColor: 'divider', borderRadius: 2,
      bgcolor: 'background.paper', height: '100%', display: 'flex', flexDirection: 'column',
    }}>
      <Stack direction="row" alignItems="flex-start" justifyContent="space-between">
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontWeight: 700, fontSize: 13, lineHeight: 1.3 }}>{recipe.name}</Typography>
          <Stack direction="row" spacing={0.5} mt={0.5} flexWrap="wrap" gap={0.5}>
            {recipe.time && (
              <Chip label={`⏱ ${recipe.time}`} size="small" sx={{ height: 18, fontSize: 10 }} />
            )}
            {recipe.tags.slice(0, 2).map(t => (
              <Chip key={t} label={t} size="small" color="primary" variant="outlined" sx={{ height: 18, fontSize: 10 }} />
            ))}
          </Stack>
        </Box>
        <IconButton size="small" onClick={onRemove} sx={{ ml: 0.5, flexShrink: 0 }}>
          <DeleteOutlineRoundedIcon sx={{ fontSize: 14 }} />
        </IconButton>
      </Stack>

      {recipe.ingredients.length > 0 && (
        <Typography sx={{ fontSize: 11, color: 'text.secondary', mt: 1, lineHeight: 1.5 }}>
          {recipe.ingredients.slice(0, 4).join(' · ')}
          {recipe.ingredients.length > 4 && ` +${recipe.ingredients.length - 4} more`}
        </Typography>
      )}

      <Button size="small" onClick={() => setShowProc(s => !s)}
        sx={{ mt: 'auto', pt: 0.5, fontSize: 11, p: 0, minWidth: 0, textTransform: 'none', color: 'text.secondary', justifyContent: 'flex-start' }}>
        {showProc ? '▲ Hide steps' : `▼ ${recipe.procedure?.length || 0} steps`}
      </Button>

      {showProc && recipe.procedure?.length > 0 && (
        <Box sx={{ mt: 0.5 }}>
          {recipe.procedure.map((step, i) => (
            <Typography key={i} sx={{ fontSize: 11, color: 'text.secondary', mb: 0.5, display: 'flex', gap: 0.5 }}>
              <span style={{ fontWeight: 700, flexShrink: 0 }}>{i + 1}.</span>
              {step}
            </Typography>
          ))}
        </Box>
      )}
    </Box>
  );
}

// ─── AI Recipes Panel ─────────────────────────────────────────────────────────

function AiRecipesPanel({
  products,
  headline,
  recipes,
  onChange,
}: {
  products: ExtractedProduct[];
  headline: string;
  recipes: AiRecipe[];
  onChange: (r: AiRecipe[]) => void;
}) {
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');

  const generate = async () => {
    setGenerating(true);
    setError('');
    try {
      const productList = products
        .map(p => `${p.name}${p.category ? ' (' + p.category + ')' : ''}`)
        .join(', ');
      const res = await api.post('/ai/complete', {
        systemPrompt: 'You are a cooking expert for a Latin grocery store marketing app. Given products on sale, suggest 3 recipe ideas that use those products as key ingredients. Reply with ONLY a valid JSON array, no markdown fences, no explanation. Schema: [{"name":"string","tags":["Latino","Familiar","Mariscos","Saludable","Rápido","Especial"],"time":"X min","ingredients":["ingredient"],"procedure":["step description"]}]',
        messages: [{ role: 'user', content: `Campaign: "${headline || 'Weekly Deals'}". Products: ${productList}` }],
        maxTokens: 1500,
        temperature: 0.8,
      });
      const text: string = res.data?.content || '';
      const match = text.match(/\[[\s\S]*\]/);
      if (match) {
        onChange(JSON.parse(match[0]) as AiRecipe[]);
      } else {
        setError('Could not parse AI response. Try again.');
      }
    } catch {
      setError('Recipe generation failed.');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Box>
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1.5}>
        <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>
          {recipes.length > 0
            ? `${recipes.length} AI recipes — shown in Recetas tab`
            : 'Suggest recipes from your product list'}
        </Typography>
        <Button
          variant={recipes.length ? 'outlined' : 'contained'}
          size="small"
          startIcon={generating
            ? <CircularProgress size={14} color="inherit" />
            : recipes.length ? <RefreshRoundedIcon /> : <AutoAwesomeIcon />}
          onClick={generate}
          disabled={generating || products.length === 0}
          sx={recipes.length ? {} : {
            background: 'linear-gradient(135deg, #f43789 0%, #DC1F26 100%)',
            '&:hover': { background: 'linear-gradient(135deg, #DC1F26 0%, #8B0000 100%)' },
          }}
        >
          {generating ? 'Generating...' : recipes.length ? 'Regenerate' : '✨ Generate with AI'}
        </Button>
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 1.5, py: 0.5 }}>{error}</Alert>}

      {recipes.length > 0 && (
        <Grid container spacing={1.5}>
          {recipes.map((r, i) => (
            <Grid item xs={12} sm={6} key={i}>
              <RecipeCard recipe={r} onRemove={() => onChange(recipes.filter((_, j) => j !== i))} />
            </Grid>
          ))}
        </Grid>
      )}

      {recipes.length === 0 && !generating && (
        <Box sx={{
          p: 2, borderRadius: 2, border: '1px dashed', borderColor: 'divider',
          textAlign: 'center',
        }}>
          <RestaurantMenuRoundedIcon sx={{ fontSize: 28, color: 'text.disabled', mb: 0.5 }} />
          <Typography sx={{ fontSize: 12, color: 'text.disabled' }}>
            No recipes yet. RCS app auto-suggests from categories if empty.
          </Typography>
        </Box>
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

  // ─── State ───
  const [circularId, setCircularId] = useState('');
  const [products, setProducts] = useState<ExtractedProduct[]>([]);
  const [headline, setHeadline] = useState('');
  const [extractionStatus, setExtractionStatus] = useState('idle');
  const [campaignCode, setCampaignCode] = useState('');
  const [validDates, setValidDates] = useState('');
  const [generationResult, setGenerationResult] = useState<{ generated: number; skipped: number } | null>(null);
  const [circularFileUrl, setCircularFileUrl] = useState('');
  const [recipes, setRecipes] = useState<AiRecipe[]>([]);

  // ─── Theme ───
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
  const hasProducts = products.length > 0;

  return (
    <>
      <Container sx={{ py: { xs: 2, sm: 3 } }} maxWidth={customization.stretch ? false : 'xl'}>
        <PageHeading
          sx={{ px: 0 }}
          title={t('MMS Generator')}
          description="AI-powered MMS/RCS campaigns from flyer images"
          actions={
            <Stack direction="row" spacing={1.5} alignItems="center">
              {extractionStatus === 'completed' && (
                <Chip icon={<AutoAwesomeIcon />} label={`${products.length} products`}
                  color="success" variant="outlined" size="small" />
              )}
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
                      sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1 }}>
                      <Avatar
                        src={option.image !== 'no-image.jpg' ? option.image : undefined}
                        sx={{ width: 28, height: 28, bgcolor: '#DC1F26', fontSize: 12 }}>
                        {option.name?.charAt(0)?.toUpperCase()}
                      </Avatar>
                      <Box>
                        <Typography sx={{ fontWeight: 600, fontSize: 13 }}>{option.name}</Typography>
                        <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>
                          {option.slug} · {option.customerCount || 0} customers
                        </Typography>
                      </Box>
                    </Box>
                  );
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    placeholder="Select store..."
                    size="small"
                    InputProps={{
                      ...params.InputProps,
                      startAdornment: (
                        <>
                          <StorefrontIcon sx={{ color: 'text.secondary', mr: 0.5, fontSize: 18 }} />
                          {params.InputProps.startAdornment}
                        </>
                      ),
                      endAdornment: (
                        <>
                          {loadingStores ? <CircularProgress size={16} /> : null}
                          {params.InputProps.endAdornment}
                        </>
                      ),
                    }}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, fontSize: 14 } }}
                  />
                )}
                noOptionsText="No stores found"
                sx={{ width: 260 }}
              />
            </Stack>
          }
        />
      </Container>

      <Box pb={{ xs: 2, sm: 4 }}>
        <Container maxWidth={customization.stretch ? false : 'xl'}>
          {!selectedStore && !loadingStores && (
            <Alert severity="info" sx={{ mb: 2 }}>
              Select a store above to start creating an MMS/RCS campaign.
            </Alert>
          )}

          {selectedStore && (
            <Grid container spacing={2.5}>
              {/* ─── Left column ── */}
              <Grid item xs={12} lg={7}>

                {/* Step 1: Upload Flyer */}
                <Card sx={{ mb: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                  <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                    <Stack direction="row" alignItems="center" spacing={1} mb={1.5}>
                      <StepBadge num={1} />
                      <Typography variant="subtitle1" fontWeight={700}>Upload Flyer</Typography>
                    </Stack>
                    <FlyerUploader
                      storeSlug={storeSlug}
                      onCircularCreated={handleCircularCreated}
                      onExtracted={handleExtracted}
                      extractionStatus={extractionStatus}
                      onExtractionStatusChange={setExtractionStatus}
                    />
                  </CardContent>
                </Card>

                {/* Step 2: Products */}
                {hasProducts && (
                  <Card sx={{ mb: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                    <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                      <Stack direction="row" alignItems="center" spacing={1} mb={1.5} flexWrap="wrap" gap={0.5}>
                        <StepBadge num={2} />
                        <Typography variant="subtitle1" fontWeight={700}>Products</Typography>
                        <Chip size="small" label={extractionStatus === 'completed' ? 'AI Extracted' : 'Manual'}
                          color={extractionStatus === 'completed' ? 'info' : 'default'} sx={{ height: 20, fontSize: 10 }} />
                        {products.length > MAX_MMS_PRODUCTS && (
                          <Chip size="small" label={`First ${MAX_MMS_PRODUCTS} of ${products.length} in MMS`}
                            color="warning" variant="outlined" sx={{ height: 20, fontSize: 10 }} />
                        )}
                      </Stack>

                      <TextField fullWidth label="Headline" value={headline}
                        onChange={(e) => setHeadline(e.target.value)}
                        size="small" sx={{ mb: 1.5 }} />

                      <ExtractedProductsTable products={products} onChange={handleProductsChange} />

                      {(() => {
                        const cats = [...new Set(products.map(p => p.category).filter(Boolean))];
                        return cats.length > 0 ? (
                          <Stack direction="row" spacing={0.5} flexWrap="wrap" gap={0.5} mt={1.5}>
                            {cats.map(c => (
                              <Chip key={c} label={c} size="small" color="primary" variant="outlined" sx={{ height: 20, fontSize: 10 }} />
                            ))}
                          </Stack>
                        ) : null;
                      })()}
                    </CardContent>
                  </Card>
                )}

                {/* Steps 3 + 4: AI Recipes & Campaign Send (merged card) */}
                {hasProducts && (
                  <Card sx={{ mb: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                    <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>

                      {/* Step 3 */}
                      <Stack direction="row" alignItems="center" spacing={1} mb={1.5}>
                        <StepBadge num={3} />
                        <Typography variant="subtitle1" fontWeight={700}>AI Recipes</Typography>
                      </Stack>

                      <AiRecipesPanel
                        products={products}
                        headline={headline}
                        recipes={recipes}
                        onChange={setRecipes}
                      />

                      <Divider sx={{ my: 2 }} />

                      {/* Step 4 */}
                      <Stack direction="row" alignItems="center" spacing={1} mb={1.5}>
                        <StepBadge num={4} />
                        <Typography variant="subtitle1" fontWeight={700}>Generate &amp; Send</Typography>
                      </Stack>

                      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ sm: 'flex-start' }}>
                        <TextField
                          label="Campaign Code"
                          value={campaignCode}
                          onChange={(e) => setCampaignCode(e.target.value.toUpperCase())}
                          size="small"
                          placeholder="VIP0411"
                          sx={{ width: { xs: '100%', sm: 180 }, flexShrink: 0 }}
                        />
                        <Box>
                          <MmsActionBar
                            circularId={circularId}
                            storeId={selectedStore._id || (selectedStore as any).id || ''}
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
                        </Box>
                      </Stack>

                      {generationResult && (
                        <Alert severity="success" sx={{ mt: 1.5, py: 0.5 }}>
                          Generated {generationResult.generated} MMS barcodes
                          {generationResult.skipped > 0 && ` (${generationResult.skipped} skipped)`}
                        </Alert>
                      )}
                    </CardContent>
                  </Card>
                )}

                <RcsLinkCard storeSlug={storeSlug} circularId={circularId} />
              </Grid>

              {/* ─── Right column (sticky preview) ── */}
              <Grid item xs={12} lg={5}>
                <Box sx={{ position: 'sticky', top: 24 }}>
                  <Card sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                    <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                      <Stack direction="row" alignItems="center" spacing={1} mb={1.5}>
                        <VisibilityIcon sx={{ fontSize: 18 }} />
                        <Typography variant="subtitle1" fontWeight={700}>MMS Preview</Typography>
                      </Stack>
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
