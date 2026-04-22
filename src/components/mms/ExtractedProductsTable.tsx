'use client';

import React, { useCallback } from 'react';
import {
  Box,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TextField,
  IconButton,
  Checkbox,
  Select,
  MenuItem,
  Button,
  Tooltip,
  Typography,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';

interface Product {
  _id?: string;
  name: string;
  price: string;
  unit?: string;
  originalPrice?: string;
  savings?: string;
  category?: string;
  emoji?: string;
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
        emoji: '🛒',
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

  return (
    <Box sx={{ overflowX: 'auto' }}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell sx={{ width: 40, fontWeight: 'bold' }}>⭐</TableCell>
            <TableCell sx={{ width: 56, fontWeight: 'bold' }}>Emoji</TableCell>
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

              {/* Emoji */}
              <TableCell>
                <TextField
                  value={product.emoji || ''}
                  onChange={(e) => updateProduct(idx, 'emoji', e.target.value)}
                  size="small"
                  variant="standard"
                  inputProps={{ style: { fontSize: 20, width: 32, textAlign: 'center' } }}
                />
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

      <Button
        startIcon={<AddIcon />}
        onClick={addProduct}
        size="small"
        sx={{ mt: 1 }}
      >
        Add Product
      </Button>

      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
        ⭐ = Hero product (displayed prominently). Click to toggle.
      </Typography>
    </Box>
  );
}
