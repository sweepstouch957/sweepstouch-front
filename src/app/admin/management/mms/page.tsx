'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Box, Container, Grid, Card, CardContent, Typography, Button,
  Alert, Chip, Stack, TextField, Autocomplete, Avatar, CircularProgress,
  IconButton, Tooltip, Divider,
  Dialog, DialogTitle, DialogContent, DialogActions, DialogContentText,
} from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import VisibilityIcon from '@mui/icons-material/Visibility';
import StorefrontIcon from '@mui/icons-material/Storefront';
import LinkRoundedIcon from '@mui/icons-material/LinkRounded';
import ContentCopyRoundedIcon from '@mui/icons-material/ContentCopyRounded';
import RestaurantMenuRoundedIcon from '@mui/icons-material/RestaurantMenuRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import AddPhotoAlternateRoundedIcon from '@mui/icons-material/AddPhotoAlternateRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded';
import UploadFileRoundedIcon from '@mui/icons-material/UploadFileRounded';
import { useTranslation } from 'react-i18next';
import PageHeading from 'src/components/base/page-heading';
import { useCustomization } from 'src/hooks/use-customization';
import FlyerUploader from '@/components/mms/FlyerUploader';
import ExtractedProductsTable from '@/components/mms/ExtractedProductsTable';
import MmsPreviewPhone from '@/components/mms/MmsPreviewPhone';
import MmsActionBar from '@/components/mms/MmsActionBar';
import { useStores } from '@/hooks/useStores';
import { api } from '@/libs/axios';
import { circularService } from '@/services/circular.service';

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
  imageUrl?: string;
}

const MAX_MMS_PRODUCTS = 10;

/** Extract first well-formed JSON array; handles code fences and trailing prose */
function extractFirstJsonArray(text: string): string | null {
  const start = text.indexOf('[');
  if (start === -1) return null;
  let depth = 0, inString = false, escape = false;
  for (let i = start; i < text.length; i++) {
    const c = text[i];
    if (escape) { escape = false; continue; }
    if (c === '\\' && inString) { escape = true; continue; }
    if (c === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (c === '[') depth++;
    if (c === ']') { depth--; if (depth === 0) return text.slice(start, i + 1); }
  }
  return null;
}

/**
 * Extract any COMPLETE recipe objects from a truncated JSON array.
 * Gemini 2.5 Flash with thinking enabled can cut off mid-response.
 */
function extractCompleteRecipes(text: string): AiRecipe[] {
  const objects: AiRecipe[] = [];
  let i = text.indexOf('{');
  while (i !== -1) {
    let depth = 0, inStr = false, esc = false, j = i;
    for (; j < text.length; j++) {
      const c = text[j];
      if (esc) { esc = false; continue; }
      if (c === '\\' && inStr) { esc = true; continue; }
      if (c === '"') { inStr = !inStr; continue; }
      if (inStr) continue;
      if (c === '{') depth++;
      if (c === '}') { depth--; if (depth === 0) break; }
    }
    if (depth === 0 && j < text.length) {
      try {
        const obj = JSON.parse(text.slice(i, j + 1)) as AiRecipe;
        if (obj.name && Array.isArray(obj.ingredients)) objects.push(obj);
      } catch {}
    }
    i = text.indexOf('{', j + 1);
  }
  return objects;
}

// ─── Step Badge ───────────────────────────────────────────────────────────────

const StepBadge = React.memo(({ num }: { num: number }) => (
  <Box
    component="span"
    sx={{
      width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
      background: (t) => `linear-gradient(135deg, ${t.palette.primary.main} 0%, ${t.palette.primary.light} 100%)`,
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
    ? `https://links.sweepstouch.com/rcs/{customerId}?store=${storeSlug}${circularId ? `&circular=${circularId}` : ''}`
    : 'https://links.sweepstouch.com/rcs/{customerId}?store={storeSlug}';

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

function RecipeCard({
  recipe, onRemove, onImageChange,
}: {
  recipe: AiRecipe;
  onRemove: () => void;
  onImageChange: (url: string) => void;
}) {
  const [showProc, setShowProc] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [hoverImg, setHoverImg] = useState(false);
  const fileRef = React.useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (fileRef.current) fileRef.current.value = '';
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('folder', 'recipes');
      const res = await api.post('/upload', formData, { headers: { 'Content-Type': undefined } });
      const url: string = res.data?.url;
      if (url) onImageChange(url);
    } catch (err) {
      console.error('[recipe-upload] failed:', err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Box sx={{
      border: '1px solid', borderColor: 'divider', borderRadius: 2,
      bgcolor: 'background.paper', height: '100%', display: 'flex', flexDirection: 'column',
      overflow: 'hidden', transition: 'border-color 0.2s',
      '&:hover': { borderColor: 'primary.main' },
    }}>
      {/* Hidden file input */}
      <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }}
        onChange={handleFileSelect} />

      {/* Image zone */}
      <Box
        onMouseEnter={() => setHoverImg(true)}
        onMouseLeave={() => setHoverImg(false)}
        sx={{
          width: '100%', aspectRatio: '16/9', position: 'relative',
          overflow: 'hidden', cursor: 'pointer',
        }}
        onClick={() => !uploading && fileRef.current?.click()}
      >
        {recipe.imageUrl ? (
          <>
            <img src={recipe.imageUrl} alt={recipe.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block',
                transition: 'transform 0.3s', transform: hoverImg ? 'scale(1.04)' : 'scale(1)' }} />
            {/* Hover overlay */}
            <Box sx={{
              position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'rgba(0,0,0,0.42)', opacity: uploading || hoverImg ? 1 : 0,
              transition: 'opacity 0.2s',
            }}>
              {uploading ? (
                <CircularProgress size={26} sx={{ color: 'white' }} />
              ) : (
                <Stack alignItems="center" spacing={0.5}>
                  <EditRoundedIcon sx={{ color: 'white', fontSize: 22 }} />
                  <Typography sx={{ color: 'white', fontSize: 11, fontWeight: 700 }}>Cambiar imagen</Typography>
                </Stack>
              )}
            </Box>
          </>
        ) : (
          /* Empty upload zone */
          <Box sx={{
            width: '100%', height: '100%',
            background: uploading
              ? 'linear-gradient(135deg, rgba(244,55,137,0.08) 0%, rgba(220,31,38,0.04) 100%)'
              : 'linear-gradient(135deg, rgba(0,0,0,0.03) 0%, rgba(0,0,0,0.01) 100%)',
            border: '2px dashed',
            borderColor: uploading ? 'primary.main' : 'divider',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: 0.5,
            transition: 'all 0.2s',
            '&:hover': {
              borderColor: 'primary.main',
              background: 'linear-gradient(135deg, rgba(244,55,137,0.08) 0%, rgba(220,31,38,0.04) 100%)',
            },
          }}>
            {uploading ? (
              <>
                <CircularProgress size={22} color="primary" />
                <Typography sx={{ fontSize: 11, color: 'primary.main', fontWeight: 600, mt: 0.5 }}>
                  Subiendo a Cloudinary…
                </Typography>
              </>
            ) : (
              <>
                <AddPhotoAlternateRoundedIcon sx={{ fontSize: 26, color: 'text.disabled' }} />
                <Typography sx={{ fontSize: 11, color: 'text.secondary', fontWeight: 600 }}>
                  Subir imagen
                </Typography>
                <Typography sx={{ fontSize: 10, color: 'text.disabled' }}>
                  JPG, PNG, WebP
                </Typography>
              </>
            )}
          </Box>
        )}
      </Box>

      <Box sx={{ p: 1.5, flex: 1, display: 'flex', flexDirection: 'column' }}>
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
    </Box>
  );
}

// ─── AI Recipes Panel ─────────────────────────────────────────────────────────

function AiRecipesPanel({
  products,
  headline,
  recipes,
  onChange,
  onGenerated,
}: {
  products: ExtractedProduct[];
  headline: string;
  recipes: AiRecipe[];
  onChange: (r: AiRecipe[]) => void;
  onGenerated?: (finalRecipes: AiRecipe[]) => Promise<void>;
}) {
  const [generating, setGenerating] = useState(false);
  const [generatingImages, setGeneratingImages] = useState(false);
  const [imageProgress, setImageProgress] = useState(0);
  const [error, setError] = useState('');
  const [autoSaved, setAutoSaved] = useState(false);

  const generate = async () => {
    setGenerating(true);
    setError('');
    try {
      const productList = products
        .map(p => `${p.name}${p.category ? ' (' + p.category + ')' : ''}`)
        .join(', ');
      const res = await api.post('/ai/complete', {
        systemPrompt: 'You are a cooking expert for a Latin grocery store. Given products, suggest exactly 3 short recipes using those products. Reply with ONLY a JSON array, no markdown, no extra text. Keep each procedure to max 3 steps of max 15 words each. Schema: [{"name":"string","tags":["Latino","Familiar","Mariscos","Saludable","Rapido","Especial"],"time":"X min","ingredients":["item (max 5)"],"procedure":["step (max 3)"]}]',
        messages: [{ role: 'user', content: `Campaign: "${headline || 'Weekly Deals'}". Products: ${productList}` }],
        maxTokens: 4000,
        temperature: 0.7,
      });
      const raw: string = res.data?.content || '';

      // Try full array first, fall back to extracting complete objects from truncated JSON
      let parsed: AiRecipe[] | null = null;
      const jsonStr = extractFirstJsonArray(raw);
      if (jsonStr) {
        try { parsed = JSON.parse(jsonStr); } catch {}
      }
      if (!parsed || parsed.length === 0) {
        const recovered = extractCompleteRecipes(raw);
        if (recovered.length > 0) parsed = recovered;
      }

      if (!parsed || parsed.length === 0) {
        console.error('[recipes] could not parse response:', raw.slice(0, 300));
        setError('AI response could not be parsed. Try again.');
        return;
      }

      // Show text recipes immediately
      onChange(parsed);
      setGenerating(false);

      // Generate one image per recipe sequentially
      setGeneratingImages(true);
      setImageProgress(0);
      const withImages = [...parsed];
      for (let i = 0; i < withImages.length; i++) {
        const r = withImages[i];
        try {
          const prompt = `Professional food photography of "${r.name}", a Latin dish made with ${r.ingredients.slice(0, 3).join(', ')}. Overhead shot, bright natural lighting, vibrant colors, on a wooden table with fresh ingredients around it.`;
          const imgRes = await api.post('/ai/generate-recipe-image', { prompt });
          if (imgRes.data?.imageUrl) {
            withImages[i] = { ...r, imageUrl: imgRes.data.imageUrl };
            onChange([...withImages]);
          }
        } catch (imgErr) {
          console.warn(`[recipes] image gen failed for "${r.name}":`, imgErr);
        }
        setImageProgress(i + 1);
      }
      setGeneratingImages(false);
      setImageProgress(0);
      // Auto-save final recipes (with images) to the circular
      if (onGenerated) {
        try {
          await onGenerated(withImages);
          setAutoSaved(true);
          setTimeout(() => setAutoSaved(false), 4000);
        } catch { /* save error is non-blocking */ }
      }
      return; // already called setGenerating(false) above
    } catch (err: any) {
      console.error('[recipes] generation failed:', err);
      setError(err?.response?.data?.error || 'Recipe generation failed. Try again.');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Box>
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1.5}>
        <Typography sx={{ fontSize: 13, color: autoSaved ? 'success.main' : 'text.secondary',
          display: 'flex', alignItems: 'center', gap: 0.5 }}>
          {autoSaved && '✅ '}
          {generatingImages
            ? `Generating images… ${imageProgress}/${recipes.length}`
            : autoSaved
            ? `${recipes.length} recipes saved to circular`
            : recipes.length > 0
            ? `${recipes.length} AI recipes — shown in Recetas tab`
            : 'Suggest recipes from your product list'}
        </Typography>
        <Button
          variant={recipes.length ? 'outlined' : 'contained'}
          size="small"
          startIcon={(generating || generatingImages)
            ? <CircularProgress size={14} color="inherit" />
            : recipes.length ? <RefreshRoundedIcon /> : <AutoAwesomeIcon />}
          onClick={generate}
          disabled={generating || generatingImages || products.length === 0}
          sx={recipes.length ? {} : {
            background: (t) => `linear-gradient(135deg, ${t.palette.primary.light} 0%, ${t.palette.primary.main} 100%)`,
            '&:hover': { background: (t) => `linear-gradient(135deg, ${t.palette.primary.main} 0%, ${t.palette.primary.dark} 100%)` },
          }}
        >
          {generating ? 'Generating...' : generatingImages ? 'Adding images...' : recipes.length ? 'Regenerate' : '✨ Generate with AI'}
        </Button>
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 1.5, py: 0.5 }}>{error}</Alert>}

      {recipes.length > 0 && (
        <Grid container spacing={1.5}>
          {recipes.map((r, i) => (
            <Grid item xs={12} sm={6} key={i}>
              <RecipeCard
                recipe={r}
                onRemove={() => onChange(recipes.filter((_, j) => j !== i))}
                onImageChange={(url) => {
                  const updated = [...recipes];
                  updated[i] = { ...updated[i], imageUrl: url };
                  onChange(updated);
                }}
              />
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

  // ─── Active circular dialog ───
  const [existingCircular, setExistingCircular] = useState<any | null>(null);
  const [circularDialogOpen, setCircularDialogOpen] = useState(false);
  const [loadingExistingProducts, setLoadingExistingProducts] = useState(false);

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

  // ─── Helpers ───
  const resetForm = useCallback(() => {
    setCircularId('');
    setProducts([]);
    setHeadline('');
    setExtractionStatus('idle');
    setCampaignCode('');
    setValidDates('');
    setGenerationResult(null);
    setCircularFileUrl('');
    setRecipes([]);
  }, []);

  // ─── Handlers ───
  const handleStoreChange = useCallback(async (_e: any, newValue: any) => {
    setSelectedStore(newValue);
    resetForm();
    setExistingCircular(null);

    if (!newValue?.slug) return;

    // Check if there's already an active circular for this store
    try {
      const res = await circularService.getByStore(newValue.slug);
      const active = res.items?.find((c: any) => c.status === 'active' || c.status === 'scheduled');
      if (active) {
        setExistingCircular(active);
        setCircularDialogOpen(true);
      }
    } catch {
      // No circular found — proceed normally
    }
  }, [setSelectedStore, resetForm]);

  /** Use the existing circular — load its products + recipes */
  const handleUseExisting = useCallback(async () => {
    if (!existingCircular) return;
    setCircularDialogOpen(false);
    setLoadingExistingProducts(true);
    try {
      setCircularId(existingCircular._id);
      if (existingCircular.fileUrl) setCircularFileUrl(existingCircular.fileUrl);
      const start = new Date(existingCircular.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const end   = new Date(existingCircular.endDate).toLocaleDateString('en-US',   { month: 'short', day: 'numeric', year: 'numeric' });
      setValidDates(`${start} - ${end}`);

      const { products: existing, headline: h } = await circularService.getProducts(existingCircular._id);
      if (existing?.length) {
        const sorted = [...existing].sort((a: any, b: any) => (a.isHero && !b.isHero ? -1 : !a.isHero && b.isHero ? 1 : 0));
        const withDefaults = sorted.map((p: any) => ({ ...p, savings: p.savings || '10%' }));
        setProducts(withDefaults);
        setHeadline(h || '');
        setExtractionStatus('completed');
      }

      // Load existing recipes if any
      const circularDetail: any = existingCircular;
      if (Array.isArray(circularDetail.recipes) && circularDetail.recipes.length > 0) {
        setRecipes(circularDetail.recipes);
      }
    } catch (err) {
      console.error('[mms] failed to load existing circular products:', err);
    } finally {
      setLoadingExistingProducts(false);
    }
  }, [existingCircular]);

  /** Dismiss dialog — proceed with new upload */
  const handleUploadNew = useCallback(() => {
    setCircularDialogOpen(false);
    setExistingCircular(null);
  }, []);

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
    // Default savings to 10% if not set
    const withDefaults = sorted.map(p => ({ ...p, savings: p.savings || '10%' }));
    setProducts(withDefaults);
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
      {/* ─── Active Circular Dialog ─── */}
      <Dialog
        open={circularDialogOpen}
        onClose={() => setCircularDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ fontWeight: 800, fontSize: 18, pb: 0.5 }}>
          Circular activo encontrado
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2, fontSize: 14 }}>
            Esta tienda ya tiene un circular{' '}
            <Chip
              label={existingCircular?.status === 'active' ? 'Activo' : 'Programado'}
              size="small"
              color={existingCircular?.status === 'active' ? 'success' : 'warning'}
              sx={{ fontSize: 11, height: 20 }}
            />{' '}
            llamado <strong>&ldquo;{existingCircular?.title || existingCircular?.storeSlug}&rdquo;</strong>.
            ¿Qué quieres hacer?
          </DialogContentText>

          <Stack spacing={1.5}>
            <Button
              fullWidth
              variant="contained"
              size="large"
              startIcon={<CheckCircleOutlineRoundedIcon />}
              onClick={handleUseExisting}
              sx={{
                borderRadius: 2,
                fontWeight: 700,
                background: (t) => `linear-gradient(135deg, ${t.palette.success.main} 0%, ${t.palette.success.dark} 100%)`,
                '&:hover': { background: (t) => `linear-gradient(135deg, ${t.palette.success.dark} 0%, ${t.palette.success.dark} 100%)` },
                justifyContent: 'flex-start', px: 2.5, py: 1.5,
              }}
            >
              <Box sx={{ textAlign: 'left' }}>
                <Typography sx={{ fontWeight: 700, fontSize: 14, lineHeight: 1.2 }}>
                  Usar circular existente
                </Typography>
                <Typography sx={{ fontSize: 12, opacity: 0.85, fontWeight: 400 }}>
                  Carga sus productos y recetas actuales
                </Typography>
              </Box>
            </Button>

            <Button
              fullWidth
              variant="outlined"
              size="large"
              startIcon={<UploadFileRoundedIcon />}
              onClick={handleUploadNew}
              sx={{
                borderRadius: 2,
                fontWeight: 700,
                borderColor: 'divider',
                color: 'text.primary',
                justifyContent: 'flex-start', px: 2.5, py: 1.5,
                '&:hover': { bgcolor: 'action.hover' },
              }}
            >
              <Box sx={{ textAlign: 'left' }}>
                <Typography sx={{ fontWeight: 700, fontSize: 14, lineHeight: 1.2 }}>
                  Subir nuevo flyer
                </Typography>
                <Typography sx={{ fontSize: 12, color: 'text.secondary', fontWeight: 400 }}>
                  Reemplaza el circular activo con uno nuevo
                </Typography>
              </Box>
            </Button>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            size="small"
            onClick={() => setCircularDialogOpen(false)}
            sx={{ textTransform: 'none', color: 'text.secondary' }}
          >
            Cancelar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Loading overlay when fetching existing products */}
      {loadingExistingProducts && (
        <Box sx={{
          position: 'fixed', inset: 0, zIndex: 9999,
          bgcolor: 'rgba(0,0,0,0.35)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Box sx={{ bgcolor: 'background.paper', borderRadius: 3, p: 4, textAlign: 'center', minWidth: 200 }}>
            <CircularProgress size={36} sx={{ mb: 2 }} />
            <Typography fontWeight={700}>Cargando circular activo…</Typography>
          </Box>
        </Box>
      )}
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
                        sx={{ width: 28, height: 28, bgcolor: 'primary.main', fontSize: 12 }}>
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
                        onGenerated={async (finalRecipes) => {
                          if (!circularId) return;
                          await circularService.saveProducts(circularId, mmsProducts, headline, finalRecipes);
                        }}
                      />

                      <Divider sx={{ my: 2 }} />

                      {/* Step 4 */}
                      <Stack direction="row" alignItems="center" spacing={1} mb={1.5}>
                        <StepBadge num={4} />
                        <Typography variant="subtitle1" fontWeight={700}>Generate &amp; Send</Typography>
                      </Stack>

                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                        <TextField
                          label="Campaign Code"
                          value={campaignCode}
                          onChange={(e) => setCampaignCode(e.target.value.toUpperCase())}
                          size="small"
                          placeholder="VIP0411"
                          helperText="Unique code for this campaign (e.g. VIP0615)"
                          sx={{ maxWidth: 240 }}
                        />
                        <MmsActionBar
                          circularId={circularId}
                          storeId={selectedStore._id || (selectedStore as any).id || ''}
                          storeSlug={storeSlug}
                          storeName={selectedStore.name}
                          campaignCode={campaignCode}
                          products={mmsProducts}
                          recipes={recipes}
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
