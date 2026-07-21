'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  alpha, Box, Container, Grid, Card, CardContent, Typography, Button,
  Chip, Stack, TextField, Autocomplete, Avatar, CircularProgress,
  IconButton, Tooltip,
} from '@mui/material';
import PhoneIphoneRoundedIcon from '@mui/icons-material/PhoneIphoneRounded';
import StorefrontIcon from '@mui/icons-material/Storefront';
import LinkRoundedIcon from '@mui/icons-material/LinkRounded';
import ContentCopyRoundedIcon from '@mui/icons-material/ContentCopyRounded';
import RestaurantMenuRoundedIcon from '@mui/icons-material/RestaurantMenuRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import CategoryRoundedIcon from '@mui/icons-material/CategoryRounded';
import NewspaperRoundedIcon from '@mui/icons-material/NewspaperRounded';
import { useTranslation } from 'react-i18next';
import PageHeading from 'src/components/base/page-heading';
import { useCustomization } from 'src/hooks/use-customization';
import { useStores } from '@/hooks/useStores';
import { CircularService, Circular } from '@/services/circular.service';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RcsProduct {
  name: string;
  category?: string;
  emoji?: string;
}

export interface RcsRecipe {
  name: string;
  tags: string[];
  time: string;
  savings?: string;
  ingredients: string[];
}

const RECIPE_TAGS = ['Latino', 'Familiar', 'Mariscos', 'Saludable', 'Rápido', 'Especial'];
const BLANK_RECIPE: RcsRecipe = { name: '', tags: [], time: '', savings: '', ingredients: [] };

const CAT_LABEL: Record<string, string> = {
  meat: 'Carnes', seafood: 'Mariscos', produce: 'Verduras', dairy: 'Lácteos',
  bakery: 'Panadería', frozen: 'Congelados', pantry: 'Despensa',
  beverages: 'Bebidas', deli: 'Deli', other: 'Otros',
};
const displayCat = (c: string) => CAT_LABEL[c] ?? c.charAt(0).toUpperCase() + c.slice(1);

const circularService = new CircularService();

// ─── Step Badge ──────────────────────────────────────────────────────────────

const StepBadge = React.memo(({ num }: { num: number }) => (
  <Box
    component="span"
    sx={{
      width: 28, height: 28, borderRadius: '50%',
      background: (t) => `linear-gradient(135deg, ${t.palette.primary.main} 0%, ${t.palette.primary.light} 100%)`,
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      color: 'white', fontSize: 14, fontWeight: 'bold', flexShrink: 0,
    }}
  >
    {num}
  </Box>
));
StepBadge.displayName = 'StepBadge';

// ─── RCS Link Card ─────────────────────────────────────────────────────────

function RcsLinkCard({ storeSlug, circularId }: { storeSlug: string; circularId: string }) {
  const [copied, setCopied] = useState(false);

  const linkTemplate = storeSlug
    ? `https://links.sweepstouch.com/rcs/{customerId}?store=${storeSlug}${circularId ? `&circular=${circularId}` : ''}`
    : 'https://links.sweepstouch.com/rcs/{customerId}?store={storeSlug}';

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
          Each customer gets a personalized link. The <code>{'{customerId}'}</code> placeholder is replaced per recipient when the RCS campaign is sent.
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
  productNames,
}: {
  recipes: RcsRecipe[];
  onChange: (r: RcsRecipe[]) => void;
  productNames: string[];
}) {
  const [draft, setDraft] = useState<RcsRecipe>(BLANK_RECIPE);
  const [adding, setAdding] = useState(false);

  const addRecipe = () => {
    if (!draft.name.trim()) return;
    onChange([...recipes, draft]);
    setDraft(BLANK_RECIPE);
    setAdding(false);
  };

  const removeRecipe = (i: number) => {
    onChange(recipes.filter((_, idx) => idx !== i));
  };

  return (
    <Box>
      {recipes.length === 0 && !adding && (
        <Typography sx={{ fontSize: 13, color: 'text.secondary', mb: 2 }}>
          No recipes configured. The RCS app auto-suggests recipes based on product categories.
        </Typography>
      )}

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

// ─── RCS Preview Card ─────────────────────────────────────────────────────────

function RcsPreviewCard({ storeSlug, circularId, categories, recipes }: {
  storeSlug: string;
  circularId: string;
  categories: string[];
  recipes: RcsRecipe[];
}) {
  return (
    <Card sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
      <CardContent>
        <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <PhoneIphoneRoundedIcon fontSize="small" />
          RCS Web View Summary
        </Typography>

        <Stack spacing={1.5}>
          <Box>
            <Typography sx={{ fontSize: 11, fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.5, mb: 0.5 }}>
              Store
            </Typography>
            <Typography sx={{ fontSize: 13 }}>
              {storeSlug || <Box component="span" sx={{ color: 'text.disabled' }}>Not selected</Box>}
            </Typography>
          </Box>

          <Box>
            <Typography sx={{ fontSize: 11, fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.5, mb: 0.5 }}>
              Circular
            </Typography>
            <Typography sx={{ fontSize: 13 }}>
              {circularId || <Box component="span" sx={{ color: 'text.disabled' }}>None selected</Box>}
            </Typography>
          </Box>

          <Box>
            <Typography sx={{ fontSize: 11, fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.5, mb: 0.5 }}>
              Product Categories
            </Typography>
            {categories.length > 0 ? (
              <Stack direction="row" flexWrap="wrap" gap={0.5}>
                {categories.map(c => (
                  <Chip key={c} label={displayCat(c)} size="small" color="primary" variant="outlined" />
                ))}
              </Stack>
            ) : (
              <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>Auto-detected from products</Typography>
            )}
          </Box>

          <Box>
            <Typography sx={{ fontSize: 11, fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.5, mb: 0.5 }}>
              Recipes
            </Typography>
            <Typography sx={{ fontSize: 13 }}>
              {recipes.length > 0 ? `${recipes.length} configured` : 'Auto-generated from products'}
            </Typography>
          </Box>

          <Box sx={{ pt: 1, borderTop: '1px solid', borderColor: 'divider' }}>
            <Typography sx={{ fontSize: 11, color: 'text.secondary', mb: 1 }}>Tabs in RCS web view:</Typography>
            <Stack direction="row" spacing={0.5} flexWrap="wrap" gap={0.5}>
              {['🏠 Home', '📰 Circular', '🛒 Lista', '🍳 Recetas', '⭐ Puntos'].map(tab => (
                <Chip key={tab} label={tab} size="small" sx={{ fontSize: 11 }} />
              ))}
            </Stack>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

function RcsCampaignPage(): React.JSX.Element {
  const customization = useCustomization();
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const preselectedId = searchParams.get('storeId');

  const { stores, loading: loadingStores, selectedStore, setSelectedStore } = useStores(preselectedId);

  const [circulars, setCirculars] = useState<Circular[]>([]);
  const [loadingCirculars, setLoadingCirculars] = useState(false);
  const [selectedCircular, setSelectedCircular] = useState<Circular | null>(null);
  const [autoCategories, setAutoCategories] = useState<string[]>([]);
  const [manualCategories, setManualCategories] = useState<string[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [circularProducts, setCircularProducts] = useState<any[]>([]);
  const [categoryInput, setCategoryInput] = useState('');
  const [recipes, setRecipes] = useState<RcsRecipe[]>([]);

  const storeSlug = selectedStore?.slug || '';

  const categories = useMemo(() => {
    const merged = [...new Set([...autoCategories, ...manualCategories])];
    return merged;
  }, [autoCategories, manualCategories]);

  const handleStoreChange = useCallback(async (_e: any, newValue: any) => {
    setSelectedStore(newValue);
    setSelectedCircular(null);
    setCirculars([]);
    setAutoCategories([]);
    setManualCategories([]);
    setCircularProducts([]);
    setRecipes([]);

    if (newValue?.slug) {
      setLoadingCirculars(true);
      try {
        const res = await circularService.getByStore(newValue.slug);
        setCirculars(res.items || []);
      } catch {
        setCirculars([]);
      } finally {
        setLoadingCirculars(false);
      }
    }
  }, [setSelectedStore]);

  const handleCircularChange = useCallback(async (_: any, circular: Circular | null) => {
    setSelectedCircular(circular);
    setAutoCategories([]);
    setCircularProducts([]);
    if (!circular) return;
    setLoadingProducts(true);
    try {
      const res = await circularService.getProducts(circular._id);
      const prods = res.products || [];
      setCircularProducts(prods);
      const cats = [...new Set(prods.map((p: any) => p.category).filter(Boolean))] as string[];
      setAutoCategories(cats);
    } catch {
      setAutoCategories([]);
    } finally {
      setLoadingProducts(false);
    }
  }, []);

  const addCategory = () => {
    const cat = categoryInput.trim();
    if (cat && !manualCategories.includes(cat)) {
      setManualCategories(c => [...c, cat]);
    }
    setCategoryInput('');
  };

  const removeCategory = (cat: string) => {
    setAutoCategories(c => c.filter(x => x !== cat));
    setManualCategories(c => c.filter(x => x !== cat));
  };

  const productNames = useMemo(() => circularProducts.map((p: any) => p.name).filter(Boolean), [circularProducts]);

  return (
    <>
      <Container sx={{ py: { xs: 2, sm: 3 } }} maxWidth={customization.stretch ? false : 'xl'}>
        <PageHeading
          sx={{ px: 0 }}
          title="RCS Campaign"
          description="Configure categories, recipes, and unique links for RCS web view campaigns"
          actions={
            <Stack direction="row" spacing={1}>
              {selectedStore && (
                <Chip icon={<StorefrontIcon />} label={selectedStore.name} color="primary" variant="outlined" />
              )}
              {selectedCircular && (
                <Chip icon={<NewspaperRoundedIcon />} label={selectedCircular.title || 'Circular selected'} color="success" variant="outlined" />
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
                        '&:hover': { background: (t) => `${alpha(t.palette.primary.main, 0.04)} !important` } }}>
                      <Avatar
                        src={option.image !== 'no-image.jpg' ? option.image : undefined}
                        sx={{ width: 36, height: 36, bgcolor: 'primary.main', fontSize: 14, fontWeight: 'bold' }}>
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
                          bgcolor: (t) =>
                            option.type === 'elite'
                              ? alpha(t.palette.warning.main, 0.3)
                              : option.type === 'basic'
                                ? alpha(t.palette.info.main, 0.3)
                                : t.palette.action.selected,
                          color: 'text.primary',
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
            </CardContent>
          </Card>

          {selectedStore && (
            <Grid container spacing={3}>
              {/* Left Column */}
              <Grid item xs={12} lg={7}>
                {/* Step 1: Select Circular */}
                <Card sx={{ mb: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <StepBadge num={1} />
                      Select Circular
                    </Typography>

                    {loadingCirculars ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <CircularProgress size={18} />
                        <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>Loading circulars...</Typography>
                      </Box>
                    ) : circulars.length === 0 ? (
                      <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>
                        No circulars found for this store. Create one in the Circulars section first.
                      </Typography>
                    ) : (
                      <Autocomplete
                        value={selectedCircular}
                        onChange={handleCircularChange}
                        options={circulars}
                        getOptionLabel={o => o.title || o._id}
                        isOptionEqualToValue={(a, b) => a._id === b._id}
                        renderOption={(props, option) => {
                          const { key, ...rest } = props as any;
                          const start = new Date(option.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                          const end = new Date(option.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                          return (
                            <Box component="li" key={key || option._id} {...rest}
                              sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1 }}>
                              <NewspaperRoundedIcon sx={{ fontSize: 20, color: 'text.secondary' }} />
                              <Box>
                                <Typography sx={{ fontWeight: 600, fontSize: 14 }}>{option.title || 'Untitled'}</Typography>
                                <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>{start} – {end} · {option.status}</Typography>
                              </Box>
                              <Chip label={option.status} size="small" sx={{ ml: 'auto',
                                bgcolor: (t) =>
                                  option.status === 'active'
                                    ? alpha(t.palette.success.main, 0.15)
                                    : option.status === 'scheduled'
                                      ? alpha(t.palette.warning.main, 0.15)
                                      : t.palette.action.selected,
                                color: option.status === 'active' ? 'success.dark' : option.status === 'scheduled' ? 'warning.dark' : 'text.secondary',
                              }} />
                            </Box>
                          );
                        }}
                        renderInput={params => (
                          <TextField {...params} size="small" placeholder="Select a circular..."
                            InputProps={{
                              ...params.InputProps,
                              startAdornment: <NewspaperRoundedIcon sx={{ color: 'text.secondary', mr: 1, fontSize: 18 }} />,
                            }}
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                          />
                        )}
                        sx={{ maxWidth: 500 }}
                      />
                    )}
                  </CardContent>
                </Card>

                {/* Step 2: Categories */}
                <Card sx={{ mb: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <StepBadge num={2} />
                      Product Categories
                    </Typography>
                    <Typography sx={{ fontSize: 12, color: 'text.secondary', mb: 2 }}>
                      Categories appear as filter tabs in the RCS Home screen. Auto-detected from circular products — add or remove manually.
                    </Typography>

                    {loadingProducts && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                        <CircularProgress size={14} />
                        <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>Loading products from circular...</Typography>
                      </Box>
                    )}

                    <Stack direction="row" flexWrap="wrap" gap={0.75} sx={{ mb: 2 }}>
                      {categories.map(cat => (
                        <Chip
                          key={cat}
                          label={displayCat(cat)}
                          size="small"
                          color={autoCategories.includes(cat) ? 'primary' : 'default'}
                          variant="outlined"
                          onDelete={() => removeCategory(cat)}
                        />
                      ))}
                      {categories.length === 0 && !loadingProducts && (
                        <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
                          {selectedCircular ? 'No products extracted yet — select a circular with products or add manually.' : 'Select a circular to auto-load categories.'}
                        </Typography>
                      )}
                    </Stack>

                    <Stack direction="row" spacing={1} alignItems="center">
                      <TextField
                        size="small"
                        placeholder="Add category (e.g. Produce)"
                        value={categoryInput}
                        onChange={e => setCategoryInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && addCategory()}
                        sx={{ flex: 1, maxWidth: 320, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                        InputProps={{
                          startAdornment: <CategoryRoundedIcon sx={{ fontSize: 16, color: 'text.secondary', mr: 0.75 }} />,
                        }}
                      />
                      <Button variant="outlined" size="small" onClick={addCategory} disabled={!categoryInput.trim()}>
                        Add
                      </Button>
                    </Stack>
                  </CardContent>
                </Card>

                {/* Step 3: Recipes */}
                <Card sx={{ mb: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <StepBadge num={3} />
                      RCS Recipes
                    </Typography>
                    <Typography sx={{ fontSize: 12, color: 'text.secondary', mb: 2 }}>
                      Recipes shown in the Recetas tab of the RCS web view. If left empty, the app auto-suggests based on product categories.
                    </Typography>
                    <RecipesEditor
                      recipes={recipes}
                      onChange={setRecipes}
                      productNames={productNames}
                    />
                  </CardContent>
                </Card>

                {/* RCS Link */}
                <RcsLinkCard storeSlug={storeSlug} circularId={selectedCircular?._id || ''} />
              </Grid>

              {/* Right Column — Summary */}
              <Grid item xs={12} lg={5}>
                <Box sx={{ position: 'sticky', top: 24 }}>
                  <RcsPreviewCard
                    storeSlug={storeSlug}
                    circularId={selectedCircular?._id || ''}
                    categories={categories}
                    recipes={recipes}
                  />
                </Box>
              </Grid>
            </Grid>
          )}
        </Container>
      </Box>
    </>
  );
}

export default RcsCampaignPage;
