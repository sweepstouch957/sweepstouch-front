'use client';

import React, { useCallback, useState } from 'react';
import {
  Box,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TextField,
  IconButton,
  Select,
  MenuItem,
  Button,
  Tooltip,
  Typography,
  Avatar,
  Backdrop,
  Fade,
  useTheme,
  alpha,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import SearchIcon from '@mui/icons-material/Search';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import CloseIcon from '@mui/icons-material/Close';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import ImageNotSupportedIcon from '@mui/icons-material/ImageNotSupported';
import ProductSearchDialog from '@/components/products/ProductSearchDialog';
import type { SupabaseProduct } from '@/services/product.service';

interface Product {
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

interface Props {
  products: Product[];
  onChange: (products: Product[]) => void;
}

const CATEGORIES = [
  'meat', 'seafood', 'produce', 'dairy', 'bakery',
  'frozen', 'pantry', 'beverages', 'deli', 'other',
];

export default function ExtractedProductsTable({ products, onChange }: Props) {
  const theme = useTheme();

  // Product search dialog state
  const [searchDialogOpen, setSearchDialogOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  // Lightbox state
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [lightboxName, setLightboxName] = useState('');

  const updateProduct = useCallback(
    (index: number, field: keyof Product, value: any) => {
      const updated = [...products];
      (updated[index] as any)[field] = value;
      onChange(updated);
    },
    [products, onChange]
  );

  const removeProduct = useCallback(
    (index: number) => {
      onChange(products.filter((_, i) => i !== index));
    },
    [products, onChange]
  );

  const addProduct = useCallback(() => {
    onChange([
      ...products,
      {
        name: '',
        price: '',
        unit: '',
        category: 'other',
        emoji: '',
        imageUrl: '',
        isHero: false,
      },
    ]);
  }, [products, onChange]);

  const toggleHero = useCallback(
    (index: number) => {
      const updated = products.map((p, i) => ({
        ...p,
        isHero: i === index ? !p.isHero : false,
      }));
      onChange(updated);
    },
    [products, onChange]
  );

  // Open product search for a specific row
  const openSearchForProduct = useCallback((index: number) => {
    setEditingIndex(index);
    setSearchDialogOpen(true);
  }, []);

  // Handle product selection from dialog
  const handleProductSelected = useCallback(
    (supabaseProduct: SupabaseProduct) => {
      if (editingIndex === null) return;

      const updated = [...products];
      updated[editingIndex] = {
        ...updated[editingIndex],
        imageUrl: supabaseProduct.url_image || '',
        // Optionally update name if empty
        name: updated[editingIndex].name || supabaseProduct.desc_full_product,
      };
      onChange(updated);
      setSearchDialogOpen(false);
      setEditingIndex(null);
    },
    [editingIndex, products, onChange]
  );

  // Open lightbox for a product image
  const openLightbox = useCallback((url: string, name: string) => {
    setLightboxUrl(url);
    setLightboxName(name);
  }, []);

  return (
    <>
      <Box sx={{ overflowX: 'auto' }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ width: 40, fontWeight: 'bold' }}>⭐</TableCell>
              <TableCell sx={{ width: 72, fontWeight: 'bold' }}>Imagen</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Product Name</TableCell>
              <TableCell sx={{ width: 100, fontWeight: 'bold' }}>Price</TableCell>
              <TableCell sx={{ width: 90, fontWeight: 'bold' }}>Unit</TableCell>
              <TableCell sx={{ width: 110, fontWeight: 'bold' }}>Category</TableCell>
              <TableCell sx={{ width: 90, fontWeight: 'bold' }}>Savings</TableCell>
              <TableCell sx={{ width: 40 }} />
            </TableRow>
          </TableHead>
          <TableBody>
            {products.map((product, idx) => (
              <TableRow
                key={product._id || idx}
                sx={{
                  bgcolor: product.isHero ? 'warning.50' : 'transparent',
                  '&:hover': { bgcolor: 'action.hover' },
                }}
              >
                {/* Hero toggle */}
                <TableCell>
                  <Tooltip title={product.isHero ? 'Remove as hero' : 'Make hero product'}>
                    <IconButton
                      size="small"
                      onClick={() => toggleHero(idx)}
                      color={product.isHero ? 'warning' : 'default'}
                    >
                      {product.isHero ? <StarIcon /> : <StarBorderIcon />}
                    </IconButton>
                  </Tooltip>
                </TableCell>

                {/* Product Image (replaces Emoji) */}
                <TableCell>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.5,
                    }}
                  >
                    {product.imageUrl ? (
                      <Tooltip title="Click para zoom · Buscar para cambiar">
                        <Avatar
                          src={product.imageUrl}
                          variant="rounded"
                          onClick={() => openLightbox(product.imageUrl!, product.name)}
                          sx={{
                            width: 44,
                            height: 44,
                            cursor: 'zoom-in',
                            border: '2px solid',
                            borderColor: 'divider',
                            bgcolor: '#fafafa',
                            transition: 'all 0.2s',
                            '&:hover': {
                              borderColor: theme.palette.primary.main,
                              transform: 'scale(1.1)',
                              boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}`,
                            },
                          }}
                        >
                          <ShoppingCartIcon fontSize="small" />
                        </Avatar>
                      </Tooltip>
                    ) : (
                      <Tooltip title="Sin imagen — buscar producto">
                        <Avatar
                          variant="rounded"
                          onClick={() => openSearchForProduct(idx)}
                          sx={{
                            width: 44,
                            height: 44,
                            cursor: 'pointer',
                            bgcolor: alpha(theme.palette.warning.main, 0.08),
                            border: '2px dashed',
                            borderColor: alpha(theme.palette.warning.main, 0.4),
                            color: theme.palette.warning.main,
                            transition: 'all 0.2s',
                            '&:hover': {
                              borderColor: theme.palette.primary.main,
                              bgcolor: alpha(theme.palette.primary.main, 0.08),
                              color: theme.palette.primary.main,
                            },
                          }}
                        >
                          <SearchIcon fontSize="small" />
                        </Avatar>
                      </Tooltip>
                    )}

                    {/* Mini search button */}
                    <Tooltip title="Buscar imagen de producto">
                      <IconButton
                        size="small"
                        onClick={() => openSearchForProduct(idx)}
                        sx={{ opacity: 0.5, '&:hover': { opacity: 1 } }}
                      >
                        <SearchIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </TableCell>

                {/* Name */}
                <TableCell>
                  <TextField
                    value={product.name}
                    onChange={(e) => updateProduct(idx, 'name', e.target.value)}
                    size="small"
                    variant="standard"
                    fullWidth
                    placeholder="Product name"
                  />
                </TableCell>

                {/* Price */}
                <TableCell>
                  <TextField
                    value={product.price}
                    onChange={(e) => updateProduct(idx, 'price', e.target.value)}
                    size="small"
                    variant="standard"
                    placeholder="$2.99"
                    inputProps={{ style: { fontWeight: 'bold', color: '#DC1F26' } }}
                  />
                </TableCell>

                {/* Unit */}
                <TableCell>
                  <TextField
                    value={product.unit || ''}
                    onChange={(e) => updateProduct(idx, 'unit', e.target.value)}
                    size="small"
                    variant="standard"
                    placeholder="lb"
                  />
                </TableCell>

                {/* Category */}
                <TableCell>
                  <Select
                    value={product.category || 'other'}
                    onChange={(e) => updateProduct(idx, 'category', e.target.value)}
                    size="small"
                    variant="standard"
                    sx={{ fontSize: 13 }}
                  >
                    {CATEGORIES.map((c) => (
                      <MenuItem key={c} value={c} sx={{ fontSize: 13 }}>
                        {c}
                      </MenuItem>
                    ))}
                  </Select>
                </TableCell>

                {/* Savings */}
                <TableCell>
                  <TextField
                    value={product.savings || ''}
                    onChange={(e) => updateProduct(idx, 'savings', e.target.value)}
                    size="small"
                    variant="standard"
                    placeholder="40%"
                  />
                </TableCell>

                {/* Delete */}
                <TableCell>
                  <IconButton
                    size="small"
                    onClick={() => removeProduct(idx)}
                    color="error"
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <Box sx={{ display: 'flex', gap: 1, mt: 1.5 }}>
          <Button
            startIcon={<AddIcon />}
            onClick={addProduct}
            size="small"
          >
            Add Product
          </Button>
        </Box>

        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
          ⭐ = Hero product · 🔍 = Buscar imagen real de producto en el repositorio · Click en imagen para zoom
        </Typography>
      </Box>

      {/* Product Search Dialog */}
      <ProductSearchDialog
        open={searchDialogOpen}
        onClose={() => {
          setSearchDialogOpen(false);
          setEditingIndex(null);
        }}
        onSelect={handleProductSelected}
        initialQuery={editingIndex !== null ? products[editingIndex]?.name || '' : ''}
        title="Buscar Producto"
      />

      {/* Inline Lightbox for product images */}
      <Backdrop
        open={!!lightboxUrl}
        onClick={() => setLightboxUrl(null)}
        sx={{
          zIndex: theme.zIndex.modal + 10,
          backdropFilter: 'blur(8px)',
          backgroundColor: alpha('#000', 0.85),
          cursor: 'zoom-out',
        }}
      >
        <Fade in={!!lightboxUrl}>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2,
              position: 'relative',
            }}
          >
            <IconButton
              onClick={() => setLightboxUrl(null)}
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
            {lightboxUrl && (
              <Box
                component="img"
                src={lightboxUrl}
                alt={lightboxName}
                sx={{
                  maxWidth: '80vw',
                  maxHeight: '70vh',
                  objectFit: 'contain',
                  borderRadius: 3,
                  bgcolor: 'white',
                  p: 4,
                  boxShadow: '0 25px 80px rgba(0,0,0,0.5)',
                }}
              />
            )}
            <Typography variant="h6" sx={{ color: 'white', fontWeight: 700 }}>
              {lightboxName}
            </Typography>
          </Box>
        </Fade>
      </Backdrop>
    </>
  );
}
