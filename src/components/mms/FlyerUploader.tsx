'use client';

import React, { useState, useCallback, useRef } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  MenuItem,
  Alert,
  CircularProgress,
  Stack,
  Chip,
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import ImageIcon from '@mui/icons-material/Image';
import { circularService } from '@/services/circular.service';

interface Props {
  storeSlug?: string;
  onCircularCreated: (circular: { _id: string; storeSlug: string; startDate: string; endDate: string }) => void;
  onExtracted: (data: { products: any[]; headline: string; validDates?: string; hasMore?: boolean }) => void;
  extractionStatus: string;
  onExtractionStatusChange: (status: string) => void;
}

// API URL no longer needed since circularService handles it

export default function FlyerUploader({
  storeSlug: parentStoreSlug,
  onCircularCreated,
  onExtracted,
  extractionStatus,
  onExtractionStatusChange,
}: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>('');
  const [localStoreSlug, setLocalStoreSlug] = useState(parentStoreSlug || '');
  const [schedule, setSchedule] = useState<'current' | 'next'>('current');
  const [error, setError] = useState('');
  const [overridePass, setOverridePass] = useState('');
  const [showOverride, setShowOverride] = useState(false);
  const [circularId, setCircularId] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [maxProducts, setMaxProducts] = useState<number>(6);
  const [extractedCount, setExtractedCount] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (parentStoreSlug !== undefined) {
      setLocalStoreSlug(parentStoreSlug);
    }
  }, [parentStoreSlug]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setError('');

    // Generate preview
    if (f.type.startsWith('image/')) {
      const url = URL.createObjectURL(f);
      setPreview(url);
    } else {
      setPreview('');
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (!f) return;
    setFile(f);
    setError('');
    if (f.type.startsWith('image/')) {
      setPreview(URL.createObjectURL(f));
    } else {
      setPreview('');
    }
  }, []);

  const handleUpload = useCallback(async () => {
    if (!file || !localStoreSlug) {
      setError('Please select a file and enter store slug');
      return;
    }
    setIsUploading(true);
    setError('');
    try {
      const data = await circularService.upload({
        file,
        storeSlug: localStoreSlug,
        schedule,
        overridePassword: overridePass || undefined,
      });
      setCircularId(data.circular._id);
      onCircularCreated(data.circular as any);
      setShowOverride(false);
      setOverridePass('');
    } catch (err: any) {
      const errMsg = err.response?.data?.error || err.message || 'Upload failed';
      setError(errMsg);
      if (errMsg.toLowerCase().includes('solapado')) {
        setShowOverride(true);
      }
    } finally {
      setIsUploading(false);
    }
  }, [file, localStoreSlug, schedule, overridePass, onCircularCreated]);

  const handleExtract = useCallback(async (limit?: number) => {
    if (!circularId) {
      setError('Upload a flyer first');
      return;
    }
    const useLimit = limit !== undefined ? limit : maxProducts;
    setIsExtracting(true);
    onExtractionStatusChange('processing');
    setError('');
    try {
      const data = await circularService.extractProducts(circularId, useLimit || undefined);
      const circular = data.circular;
      const products = circular.products || [];
      setExtractedCount(products.length);
      onExtracted({
        products,
        headline: circular.headline || '',
        validDates: data.extractedMeta?.validDates || circular.validDates || '',
        hasMore: useLimit > 0 && products.length >= useLimit,
      });
      onExtractionStatusChange('completed');
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Extraction failed');
      onExtractionStatusChange('failed');
    } finally {
      setIsExtracting(false);
    }
  }, [circularId, maxProducts, onExtracted, onExtractionStatusChange]);

  return (
    <Box>
      {/* Drag & Drop Zone */}
      <Box
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => fileRef.current?.click()}
        sx={{
          border: '2px dashed',
          borderColor: file ? 'success.main' : 'divider',
          borderRadius: 2,
          p: 4,
          textAlign: 'center',
          cursor: 'pointer',
          bgcolor: file ? 'success.50' : 'action.hover',
          transition: 'all 0.2s ease',
          '&:hover': {
            borderColor: 'primary.main',
            bgcolor: 'primary.50',
          },
        }}
      >
        <input
          ref={fileRef}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png,.webp"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
        {file ? (
          <Stack alignItems="center" spacing={1}>
            {file.type.startsWith('image/') ? (
              <ImageIcon sx={{ fontSize: 48, color: 'success.main' }} />
            ) : (
              <PictureAsPdfIcon sx={{ fontSize: 48, color: 'error.main' }} />
            )}
            <Typography fontWeight="bold">{file.name}</Typography>
            <Chip
              label={`${(file.size / 1024 / 1024).toFixed(1)} MB`}
              size="small"
              color="default"
            />
          </Stack>
        ) : (
          <Stack alignItems="center" spacing={1}>
            <CloudUploadIcon sx={{ fontSize: 48, color: 'text.secondary' }} />
            <Typography fontWeight="bold">
              Drop your flyer PDF or image here
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Supports PDF, JPG, PNG, WebP (max 10MB)
            </Typography>
          </Stack>
        )}
      </Box>

      {/* Preview */}
      {preview && (
        <Box
          sx={{
            mt: 2,
            borderRadius: 2,
            overflow: 'hidden',
            maxHeight: 300,
            '& img': { width: '100%', objectFit: 'contain' },
          }}
        >
          <img src={preview} alt="Flyer preview" />
        </Box>
      )}

      {/* Config */}
      <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
        <TextField
          label="Store Slug"
          value={localStoreSlug}
          onChange={(e) => setLocalStoreSlug(e.target.value.toLowerCase())}
          size="small"
          fullWidth
          placeholder="fine-fare-brentwood"
          InputProps={{
            readOnly: !!parentStoreSlug, // Make read-only if it's fed from the parent Autocomplete
          }}
          disabled={!!parentStoreSlug}
        />
        <TextField
          label="Schedule"
          value={schedule}
          onChange={(e) => setSchedule(e.target.value as 'current' | 'next')}
          size="small"
          select
          sx={{ minWidth: 140 }}
        >
          <MenuItem value="current">This Week</MenuItem>
          <MenuItem value="next">Next Week</MenuItem>
        </TextField>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}

      {/* Override UI */}
      {showOverride && (
        <Box sx={{ mt: 2, p: 2, border: '1px solid', borderColor: 'error.main', borderRadius: 2, bgcolor: 'error.50' }}>
          <Typography variant="subtitle2" color="error.dark" sx={{ mb: 1 }}>
            Clave Maestra Requerida
          </Typography>
          <Stack direction="row" spacing={2}>
            <TextField
              size="small"
              type="password"
              placeholder="Ingrese clave (ej: 12345678)"
              value={overridePass}
              onChange={(e) => setOverridePass(e.target.value)}
              fullWidth
            />
            <Button
              variant="contained"
              color="error"
              onClick={handleUpload}
              disabled={!overridePass || isUploading}
            >
              Forzar Override
            </Button>
          </Stack>
        </Box>
      )}

      {/* Actions */}
      <Stack direction="row" spacing={2} sx={{ mt: 2 }} alignItems="center">
        <Button
          variant="contained"
          onClick={handleUpload}
          disabled={!file || !localStoreSlug || isUploading}
          startIcon={isUploading ? <CircularProgress size={18} /> : <CloudUploadIcon />}
          sx={{
            background: 'linear-gradient(135deg, #333 0%, #555 100%)',
            '&:hover': { background: 'linear-gradient(135deg, #222 0%, #444 100%)' },
          }}
        >
          {isUploading ? 'Uploading...' : 'Upload Flyer'}
        </Button>

        {/* Product limit selector */}
        <TextField
          label="Max Products"
          value={maxProducts}
          onChange={(e) => setMaxProducts(Number(e.target.value))}
          size="small"
          select
          sx={{ minWidth: 130 }}
          disabled={!circularId || isExtracting}
        >
          <MenuItem value={6}>Top 6 ⚡</MenuItem>
          <MenuItem value={10}>Top 10</MenuItem>
          <MenuItem value={15}>Top 15</MenuItem>
          <MenuItem value={20}>Top 20</MenuItem>
          <MenuItem value={0}>All (slow)</MenuItem>
        </TextField>

        <Button
          variant="contained"
          onClick={() => handleExtract()}
          disabled={!circularId || isExtracting}
          startIcon={isExtracting ? <CircularProgress size={18} /> : <AutoAwesomeIcon />}
          sx={{
            background: 'linear-gradient(135deg, #DC1F26 0%, #ff6b6b 100%)',
            '&:hover': { background: 'linear-gradient(135deg, #b01820 0%, #e55 100%)' },
          }}
        >
          {isExtracting ? 'AI Extracting...' : `🤖 Extract${maxProducts ? ` Top ${maxProducts}` : ' All'}`}
        </Button>

        {extractionStatus === 'completed' && extractedCount > 0 && maxProducts > 0 && (
          <Button
            variant="outlined"
            onClick={() => handleExtract(0)}
            disabled={isExtracting}
            size="small"
            sx={{ textTransform: 'none', borderColor: '#f43789', color: '#f43789' }}
          >
            📦 Load All Products
          </Button>
        )}
      </Stack>

      {isExtracting && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            {maxProducts
              ? `Extracting top ${maxProducts} products... (~5-15 seconds)`
              : 'Extracting ALL products... This may take 1-3 minutes.'}
          </Typography>
          <Box sx={{ width: '100%' }}>
            <Box
              sx={{
                height: 4,
                borderRadius: 2,
                background: 'linear-gradient(90deg, #DC1F26, #FFD700, #DC1F26)',
                backgroundSize: '200% 100%',
                animation: 'shimmer 1.5s infinite',
                '@keyframes shimmer': {
                  '0%': { backgroundPosition: '200% 0' },
                  '100%': { backgroundPosition: '-200% 0' },
                },
              }}
            />
          </Box>
        </Box>
      )}
    </Box>
  );
}
