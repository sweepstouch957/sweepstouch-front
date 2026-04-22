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
import { useMutation } from '@tanstack/react-query';
import { circularService } from '@/services/circular.service';

interface Props {
  storeSlug?: string;
  onCircularCreated: (circular: { _id: string; storeSlug: string; startDate: string; endDate: string }) => void;
  onExtracted: (data: { products: any[]; headline: string }) => void;
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

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!file || !localStoreSlug) {
        throw new Error('Please select a file and enter store slug');
      }
      return circularService.upload({
        file,
        storeSlug: localStoreSlug,
        schedule,
        overridePassword: overridePass || undefined,
      });
    },
    onSuccess: (data) => {
      setCircularId(data.circular._id);
      onCircularCreated(data.circular as any);
      setError('');
      setShowOverride(false);
      setOverridePass('');
    },
    onError: (err: any) => {
      const errMsg = err.response?.data?.error || err.message || 'Upload failed';
      setError(errMsg);
      if (errMsg.toLowerCase().includes('solapado')) {
        setShowOverride(true);
      }
    },
  });

  const extractMutation = useMutation({
    mutationFn: async () => {
      if (!circularId) {
        throw new Error('Upload a flyer first');
      }
      onExtractionStatusChange('processing');
      return circularService.extractProducts(circularId);
    },
    onSuccess: (data) => {
      const circular = data.circular;
      onExtracted({
        products: circular.products || [],
        headline: circular.headline || '',
      });
      onExtractionStatusChange('completed');
      setError('');
    },
    onError: (err: any) => {
      setError(err.response?.data?.error || err.message || 'Extraction failed');
      onExtractionStatusChange('failed');
    },
  });

  const handleUpload = useCallback(() => {
    uploadMutation.mutate();
  }, [uploadMutation]);

  const handleExtract = useCallback(() => {
    extractMutation.mutate();
  }, [extractMutation]);

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
              disabled={!overridePass || uploadMutation.isPending}
            >
              Forzar Override
            </Button>
          </Stack>
        </Box>
      )}

      {/* Actions */}
      <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
        <Button
          variant="contained"
          onClick={handleUpload}
          disabled={!file || !localStoreSlug || uploadMutation.isPending}
          startIcon={uploadMutation.isPending ? <CircularProgress size={18} /> : <CloudUploadIcon />}
          sx={{
            background: 'linear-gradient(135deg, #333 0%, #555 100%)',
            '&:hover': { background: 'linear-gradient(135deg, #222 0%, #444 100%)' },
          }}
        >
          {uploadMutation.isPending ? 'Uploading...' : 'Upload Flyer'}
        </Button>

        <Button
          variant="contained"
          onClick={handleExtract}
          disabled={!circularId || extractMutation.isPending}
          startIcon={extractMutation.isPending ? <CircularProgress size={18} /> : <AutoAwesomeIcon />}
          sx={{
            background: 'linear-gradient(135deg, #DC1F26 0%, #ff6b6b 100%)',
            '&:hover': { background: 'linear-gradient(135deg, #b01820 0%, #e55 100%)' },
          }}
        >
          {extractMutation.isPending ? 'AI Extracting...' : '🤖 Extract Products with AI'}
        </Button>
      </Stack>

      {extractMutation.isPending && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            GPT Vision is analyzing the flyer... This may take 10-30 seconds.
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
