// src/components/circulars/EditCircularDialog.tsx
'use client';

import React, { useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { circularService, type Circular } from '@services/circular.service';
import { FileUploader } from '@/components/circulars/FileUploader';

// ⬅️ ajusta la ruta si tu FileUploader está en otro sitio

const isoToDateInput = (iso?: string) => {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
};

const dateInputToIso = (value: string) => {
  if (!value) return '';
  const d = new Date(value + 'T00:00:00.000Z');
  return d.toISOString();
};

// pequeño helper para mostrar el tamaño en la lista del uploader
const bytesToSize = (bytes: number) => {
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0 Byte';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${parseFloat((bytes / Math.pow(1024, i)).toFixed(2))} ${sizes[i]}`;
};

export type EditTarget = {
  circular: Circular;
  storeName: string;
};

type Props = {
  target: EditTarget | null;
  onClose: () => void;
  onSaved: () => Promise<void> | void;
};

type UploadedFileItem = {
  id: string;
  name: string;
  size: string;
  status: 'Uploaded' | 'Uploading' | 'Error';
};

export const EditCircularDialog: React.FC<Props> = ({ target, onClose, onSaved }) => {
  if (!target) return null;

  const { circular, storeName } = target;

  const [title, setTitle] = useState(circular.title);
  const [startDate, setStartDate] = useState(isoToDateInput(circular.startDate));
  const [endDate, setEndDate] = useState(isoToDateInput(circular.endDate));

  const [file, setFile] = useState<File | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFileItem[]>([]);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasChanges = useMemo(() => {
    const originalStart = isoToDateInput(circular.startDate);
    const originalEnd = isoToDateInput(circular.endDate);
    return (
      title !== circular.title ||
      startDate !== originalStart ||
      endDate !== originalEnd ||
      !!file
    );
  }, [title, startDate, endDate, file, circular]);

  const handleSave = async () => {
    setError(null);
    if (!hasChanges) {
      onClose();
      return;
    }

    try {
      setSaving(true);

      const originalStart = isoToDateInput(circular.startDate);
      const originalEnd = isoToDateInput(circular.endDate);

      const shouldReschedule =
        title !== circular.title || startDate !== originalStart || endDate !== originalEnd;

      if (shouldReschedule) {
        await circularService.reschedule({
          circularId: circular._id,
          title,
          startDate: dateInputToIso(startDate),
          endDate: dateInputToIso(endDate),
        });
      }

      if (file) {
        await circularService.attachFile(circular._id, file);
      }

      await onSaved();
      onClose();
    } catch (err: any) {
      console.error('Error saving circular:', err);
      setError(err?.message || 'Error saving circular');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open
      onClose={saving ? undefined : onClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>
        Edit Circular - {storeName}
      </DialogTitle>
      <DialogContent dividers>
        <Stack
          spacing={3}
          sx={{ mt: 1 }}
        >
          {error && <Alert severity="error">{error}</Alert>}

          {/* Datos básicos */}
          <TextField
            label="Title"
            fullWidth
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
          >
            <TextField
              label="Start Date"
              type="date"
              fullWidth
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="End Date"
              type="date"
              fullWidth
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Stack>

          {/* Uploader bonito para el PDF */}
          <Box>
            <Typography
              variant="subtitle2"
              sx={{ mb: 1 }}
            >
              PDF File (optional)
            </Typography>

            <FileUploader 
              uploadedFiles={uploadedFiles}
              accept="application/pdf,.pdf"
              maxSizeMB={10}
              helpText="Only PDF files are allowed. Max 10MB."
              onFileUpload={(files) => {
                const [first] = files;
                if (!first) return;
                setFile(first);
                setUploadedFiles([
                  {
                    id: 'new-file',
                    name: first.name,
                    size: bytesToSize(first.size),
                    status: 'Uploaded',
                  },
                ]);
              }}
              onFileDelete={(fileId) => {
                if (fileId === 'new-file') {
                  setFile(null);
                  setUploadedFiles([]);
                }
              }}
              onError={(msg) => {
                setError(msg);
              }}
            />

            {/* Si quieres mostrar el archivo actual del circular como referencia */}
            {circular.fileUrl && !uploadedFiles.length && (
              <Typography
                variant="caption"
                sx={{ mt: 1.5, display: 'block', color: 'text.secondary' }}
              >
                Current file: this circular already has an attached PDF. If you upload a new one,
                it will replace the existing file.
              </Typography>
            )}
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button
          onClick={onClose}
          disabled={saving}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={saving || !hasChanges}
        >
          {saving ? 'Saving…' : 'Save changes'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
