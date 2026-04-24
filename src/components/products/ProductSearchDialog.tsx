'use client';

import React, { useState, useCallback, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  Card,
  CardMedia,
  CardContent,
  CardActions,
  Typography,
  CircularProgress,
  IconButton,
  Box,
  Pagination,
  Chip,
  Tabs,
  Tab,
  InputAdornment,
  Backdrop,
  Fade,
  Tooltip,
  Badge,
  Divider,
  useTheme,
  alpha,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ImageNotSupportedIcon from '@mui/icons-material/ImageNotSupported';
import CategoryIcon from '@mui/icons-material/Category';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import InventoryIcon from '@mui/icons-material/Inventory';
import {
  searchProducts,
  getBrands,
  type SupabaseProduct,
  type BrandCount,
} from '@/services/product.service';

// ─── Types ──────────────────────────────────────────────
interface ProductSearchDialogProps {
  open: boolean;
  onClose: () => void;
  /** Called when user clicks a product card — returns the product data */
  onSelect: (product: SupabaseProduct) => void;
  /** Optional: pre-fill search query */
  initialQuery?: string;
  /** Optional: title override */
  title?: string;
}

// ─── Constants ──────────────────────────────────────────
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const PAGE_SIZE = 24;

// ─── Lightbox Component ─────────────────────────────────
function ProductLightbox({
  product,
  open,
  onClose,
}: {
  product: SupabaseProduct | null;
  open: boolean;
  onClose: () => void;
}) {
  const theme = useTheme();

  if (!product) return null;

  return (
    <Backdrop
      open={open}
      onClick={onClose}
      sx={{
        zIndex: theme.zIndex.modal + 10,
        backdropFilter: 'blur(8px)',
        backgroundColor: alpha('#000', 0.85),
        cursor: 'zoom-out',
      }}
    >
      <Fade in={open}>
        <Box
          onClick={(e) => e.stopPropagation()}
          sx={{
            position: 'relative',
            maxWidth: '90vw',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 2,
          }}
        >
          {/* Close button */}
          <IconButton
            onClick={onClose}
            sx={{
              position: 'absolute',
              top: -44,
              right: -8,
              color: 'white',
              bgcolor: alpha('#fff', 0.15),
              '&:hover': { bgcolor: alpha('#fff', 0.25) },
            }}
          >
            <CloseIcon />
          </IconButton>

          {/* Full-size image */}
          <Box
            component="img"
            src={product.url_image || ''}
            alt={product.desc_full_product}
            sx={{
              maxWidth: '80vw',
              maxHeight: '70vh',
              objectFit: 'contain',
              borderRadius: 3,
              bgcolor: 'white',
              p: 3,
              boxShadow: '0 25px 80px rgba(0,0,0,0.5)',
            }}
          />

          {/* Product info below image */}
          <Box
            sx={{
              textAlign: 'center',
              color: 'white',
              maxWidth: 600,
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
              {product.desc_full_product}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.7 }}>
              {product.brand} · ID: {product.id_product} · {product.size_product || ''}
            </Typography>
            {product.upc && (
              <Typography variant="caption" sx={{ opacity: 0.5, display: 'block', mt: 0.5 }}>
                UPC: {product.upc}
              </Typography>
            )}
          </Box>
        </Box>
      </Fade>
    </Backdrop>
  );
}

// ─── Main Dialog ────────────────────────────────────────
export default function ProductSearchDialog({
  open,
  onClose,
  onSelect,
  initialQuery = '',
  title = 'Repositorio de Productos',
}: ProductSearchDialogProps) {
  const theme = useTheme();

  // Search & filter state
  const [searchTerm, setSearchTerm] = useState(initialQuery);
  const [debouncedSearch, setDebouncedSearch] = useState(initialQuery);
  const [activeLetter, setActiveLetter] = useState('A');
  const [selectedBrand, setSelectedBrand] = useState('');
  const [page, setPage] = useState(0);

  // Data state
  const [products, setProducts] = useState<SupabaseProduct[]>([]);
  const [brands, setBrands] = useState<BrandCount[]>([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [loadingBrands, setLoadingBrands] = useState(false);

  // Lightbox state
  const [lightboxProduct, setLightboxProduct] = useState<SupabaseProduct | null>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(0);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Reset when dialog opens
  useEffect(() => {
    if (open) {
      if (initialQuery) {
        setSearchTerm(initialQuery);
        setDebouncedSearch(initialQuery);
      }
    }
  }, [open, initialQuery]);

  // Fetch brands when letter changes
  useEffect(() => {
    if (!open) return;
    let cancelled = false;

    setLoadingBrands(true);
    getBrands(activeLetter)
      .then((data) => {
        if (!cancelled) setBrands(data || []);
      })
      .catch(() => {
        if (!cancelled) setBrands([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingBrands(false);
      });

    return () => { cancelled = true; };
  }, [activeLetter, open]);

  // Fetch products when search/filter/page changes
  useEffect(() => {
    if (!open) return;
    let cancelled = false;

    setLoadingProducts(true);
    searchProducts({
      q: debouncedSearch || undefined,
      page,
      limit: PAGE_SIZE,
      brand: selectedBrand || undefined,
      hasImage: true,
    })
      .then((result) => {
        if (!cancelled) {
          setProducts(result.data || []);
          setTotalProducts(result.pagination?.total || result.data?.length || 0);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setProducts([]);
          setTotalProducts(0);
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingProducts(false);
      });

    return () => { cancelled = true; };
  }, [debouncedSearch, selectedBrand, page, open]);

  const handleBrandClick = useCallback((brandName: string) => {
    setSelectedBrand((prev) => (prev === brandName ? '' : brandName));
    setPage(0);
  }, []);

  const handleSelect = useCallback(
    (product: SupabaseProduct) => {
      onSelect(product);
      onClose();
    },
    [onSelect, onClose]
  );

  const handleZoom = useCallback((e: React.MouseEvent, product: SupabaseProduct) => {
    e.stopPropagation();
    setLightboxProduct(product);
    setLightboxOpen(true);
  }, []);

  const totalPages = Math.max(1, Math.ceil(totalProducts / PAGE_SIZE));

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            height: '85vh',
            borderRadius: 3,
            overflow: 'hidden',
          },
        }}
      >
        {/* Header */}
        <DialogTitle
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.08)} 0%, ${alpha(theme.palette.primary.main, 0.02)} 100%)`,
            borderBottom: '1px solid',
            borderColor: 'divider',
            py: 2,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <InventoryIcon color="primary" />
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              {title}
            </Typography>
            {totalProducts > 0 && (
              <Chip
                label={`${totalProducts} productos`}
                size="small"
                color="primary"
                variant="outlined"
                sx={{ fontWeight: 600 }}
              />
            )}
          </Box>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2, p: 2.5 }}>
          {/* ─── Search Bar ────────────────────────────── */}
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Buscar productos por nombre, marca, UPC..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            autoFocus
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
              endAdornment: loadingProducts ? (
                <InputAdornment position="end">
                  <CircularProgress size={20} />
                </InputAdornment>
              ) : null,
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2.5,
                bgcolor: alpha(theme.palette.background.default, 0.6),
              },
            }}
          />

          {/* ─── Brand Filter ──────────────────────────── */}
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <LocalOfferIcon fontSize="small" color="action" />
              <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 600 }}>
                Filtrar por Marca
              </Typography>
              {selectedBrand && (
                <Chip
                  label={selectedBrand}
                  size="small"
                  color="primary"
                  onDelete={() => { setSelectedBrand(''); setPage(0); }}
                  sx={{ fontWeight: 600 }}
                />
              )}
            </Box>

            {/* Letter tabs */}
            <Tabs
              value={activeLetter}
              onChange={(_, val) => {
                setActiveLetter(val);
                setSelectedBrand('');
                setPage(0);
              }}
              variant="scrollable"
              scrollButtons="auto"
              sx={{
                minHeight: 32,
                mb: 1,
                '& .MuiTab-root': {
                  minWidth: 36,
                  minHeight: 32,
                  px: 0.5,
                  fontSize: 12,
                  fontWeight: 700,
                },
              }}
            >
              {ALPHABET.map((letter) => (
                <Tab key={letter} label={letter} value={letter} />
              ))}
            </Tabs>

            {/* Brand chips */}
            <Box
              sx={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 0.75,
                maxHeight: 100,
                overflowY: 'auto',
                p: 1,
                bgcolor: alpha(theme.palette.background.default, 0.5),
                borderRadius: 1.5,
                border: '1px solid',
                borderColor: 'divider',
              }}
            >
              {loadingBrands ? (
                <CircularProgress size={20} />
              ) : brands.length > 0 ? (
                brands.map((b) => (
                  <Chip
                    key={b.brand}
                    label={`${b.brand.trim()} (${b.count})`}
                    onClick={() => handleBrandClick(b.brand.trim())}
                    color={selectedBrand === b.brand.trim() ? 'primary' : 'default'}
                    variant={selectedBrand === b.brand.trim() ? 'filled' : 'outlined'}
                    size="small"
                    clickable
                    sx={{ fontSize: 11, height: 26 }}
                  />
                ))
              ) : (
                <Typography variant="caption" color="text.secondary">
                  No hay marcas con la letra "{activeLetter}".
                </Typography>
              )}
            </Box>
          </Box>

          <Divider />

          {/* ─── Products Grid ─────────────────────────── */}
          <Box sx={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
            {loadingProducts ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
                <CircularProgress />
              </Box>
            ) : products.length > 0 ? (
              <Grid container spacing={1.5}>
                {products.map((product) => (
                  <Grid item xs={6} sm={4} md={3} lg={2} key={product.id}>
                    <Card
                      sx={{
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        cursor: 'pointer',
                        position: 'relative',
                        transition: 'all 0.2s ease',
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 2,
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          boxShadow: `0 12px 32px ${alpha(theme.palette.primary.main, 0.15)}`,
                          borderColor: theme.palette.primary.main,
                          '& .zoom-btn': { opacity: 1 },
                          '& .select-overlay': { opacity: 1 },
                        },
                      }}
                    >
                      {/* Zoom button */}
                      <Tooltip title="Ver en grande">
                        <IconButton
                          className="zoom-btn"
                          size="small"
                          onClick={(e) => handleZoom(e, product)}
                          sx={{
                            position: 'absolute',
                            top: 6,
                            right: 6,
                            zIndex: 2,
                            opacity: 0,
                            transition: 'opacity 0.2s',
                            bgcolor: alpha('#000', 0.6),
                            color: 'white',
                            '&:hover': { bgcolor: alpha('#000', 0.8) },
                          }}
                        >
                          <ZoomInIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>

                      {/* Product Image */}
                      {product.url_image ? (
                        <CardMedia
                          component="img"
                          height="120"
                          image={product.url_image}
                          alt={product.desc_full_product}
                          sx={{ objectFit: 'contain', p: 1, bgcolor: '#fafafa' }}
                          onClick={() => handleSelect(product)}
                        />
                      ) : (
                        <Box
                          onClick={() => handleSelect(product)}
                          sx={{
                            height: 120,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            bgcolor: alpha(theme.palette.action.disabled, 0.05),
                          }}
                        >
                          <ImageNotSupportedIcon sx={{ fontSize: 40, opacity: 0.3 }} />
                        </Box>
                      )}

                      {/* Select overlay */}
                      <Box
                        className="select-overlay"
                        onClick={() => handleSelect(product)}
                        sx={{
                          position: 'absolute',
                          bottom: 0,
                          left: 0,
                          right: 0,
                          top: 120,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          opacity: 0,
                          transition: 'opacity 0.2s',
                          bgcolor: alpha(theme.palette.primary.main, 0.06),
                        }}
                      >
                        <Chip
                          icon={<CheckCircleIcon />}
                          label="Seleccionar"
                          color="primary"
                          size="small"
                          sx={{ fontWeight: 600 }}
                        />
                      </Box>

                      {/* Product info */}
                      <CardContent
                        onClick={() => handleSelect(product)}
                        sx={{ flexGrow: 1, p: 1.5, '&:last-child': { pb: 1.5 } }}
                      >
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ fontWeight: 600, display: 'block', mb: 0.25, lineHeight: 1.2 }}
                        >
                          {product.brand}
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: 500,
                            fontSize: 11,
                            lineHeight: 1.3,
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                          }}
                        >
                          {product.desc_full_product}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: 200,
                  gap: 1,
                }}
              >
                <ImageNotSupportedIcon sx={{ fontSize: 48, opacity: 0.2 }} />
                <Typography variant="body1" color="text.secondary">
                  No se encontraron productos.
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Intenta con otro término o marca.
                </Typography>
              </Box>
            )}
          </Box>

          {/* ─── Pagination ────────────────────────────── */}
          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', pt: 1 }}>
              <Pagination
                count={totalPages}
                page={page + 1}
                onChange={(_, val) => setPage(val - 1)}
                color="primary"
                shape="rounded"
                size="small"
              />
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 2.5, py: 1.5 }}>
          <Typography variant="caption" color="text.secondary" sx={{ flex: 1 }}>
            Haz clic en un producto para seleccionarlo · 🔍 para ver en grande
          </Typography>
          <Button onClick={onClose} color="inherit" variant="outlined" size="small">
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>

      {/* ─── Lightbox ──────────────────────────────── */}
      <ProductLightbox
        product={lightboxProduct}
        open={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
      />
    </>
  );
}
