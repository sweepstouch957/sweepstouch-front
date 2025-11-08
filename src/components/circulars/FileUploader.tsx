'use client';

/* eslint-disable react/jsx-max-props-per-line */
import {
  AttachFile as AttachFileIcon,
  CloudUpload as CloudUploadIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import {
  Box,
  Chip,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
  Typography,
} from '@mui/material';
import React, { useCallback, useState } from 'react';

interface UploadedFile {
  id: string;
  name: string;
  size: string;
  status: 'Uploaded' | 'Uploading' | 'Error';
}

interface FileUploaderProps {
  uploadedFiles?: UploadedFile[];
  onFileUpload?: (files: File[]) => void;
  onFileDelete?: (fileId: string) => void;
  onError?: (message: string) => void;

  /** ✅ NUEVAS PROPS */
  accept?: string; // ej: "application/pdf,.pdf"
  icon?: React.ReactNode; // un icono custom
  helpText?: string; // texto debajo del título
  maxSizeMB?: number; // default: 10MB
}

const bytesToSize = (bytes: number) => {
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0 Byte';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${parseFloat((bytes / Math.pow(1024, i)).toFixed(2))} ${sizes[i]}`;
};

const FileUploader: React.FC<FileUploaderProps> = ({
  uploadedFiles = [],
  onFileUpload,
  onFileDelete,
  onError,

  accept = 'application/pdf,.pdf',
  icon,
  helpText = '',
  maxSizeMB = 10,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);

  const validateAndSend = (files: File[]) => {
    const maxBytes = maxSizeMB * 1024 * 1024;
    const accepted: File[] = [];
    const rejected: string[] = [];

    files.forEach((f) => {
      const isAllowed = accept
        .split(',')
        .some(
          (type) =>
            f.type === type || f.name.toLowerCase().endsWith(type.replace('.', '').toLowerCase())
        );

      const sizeOk = f.size <= maxBytes;

      if (!isAllowed) rejected.push(`• ${f.name}: formato no permitido`);
      else if (!sizeOk)
        rejected.push(`• ${f.name}: excede ${maxSizeMB} MB (${bytesToSize(f.size)})`);
      else accepted.push(f);
    });

    if (rejected.length && onError) onError(rejected.join('\n'));

    if (accepted.length && onFileUpload) onFileUpload(accepted);
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(false);
    validateAndSend(Array.from(e.dataTransfer.files || []));
  }, []);

  const handleFileSelect = useCallback((e) => {
    validateAndSend(Array.from(e.target.files || []));
    e.target.value = '';
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Uploaded':
        return '#4CAF50';
      case 'Uploading':
        return '#FF9800';
      case 'Error':
        return '#F44336';
      default:
        return '#718096';
    }
  };

  return (
    <Box>
      {/* Upload Area */}
      <Paper
        sx={{
          border: `2px dashed ${isDragOver ? '#E91E63' : '#CBD5E0'}`,
          borderRadius: 3,
          p: 6,
          textAlign: 'center',
          backgroundColor: isDragOver ? 'rgba(233,30,99,0.05)' : 'transparent',
          cursor: 'pointer',
          transition: 'all .2s',
          '&:hover': { borderColor: '#E91E63' },
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          setIsDragOver(false);
        }}
        onDrop={handleDrop}
        onClick={() => document.getElementById('file-input')?.click()}
      >
        <Box
          sx={{
            p: 2,
            borderRadius: 2,
            backgroundColor: '#F7FAFC',
            display: 'inline-flex',
            mb: 3,
          }}
        >
          {icon ?? <CloudUploadIcon sx={{ fontSize: 32, color: '#718096' }} />}
        </Box>

        <Typography
          variant="body1"
          sx={{ mb: 1 }}
        >
          <Typography
            component="span"
            sx={{ color: '#2196F3', fontWeight: 500 }}
          >
            Click to upload
          </Typography>{' '}
          or drag and drop your files here.
        </Typography>

        {helpText && (
          <Typography
            variant="body2"
            sx={{ color: '#718096' }}
          >
            {helpText}
          </Typography>
        )}

        <input
          id="file-input"
          type="file"
          multiple
          accept={accept}
          style={{ display: 'none' }}
          onChange={handleFileSelect}
        />
      </Paper>

      {/* Uploaded list */}
      {uploadedFiles.length > 0 && (
        <Box sx={{ mt: 4 }}>
          <Typography
            variant="h6"
            sx={{ fontWeight: 600, color: '#2D3748', mb: 2 }}
          >
            Uploaded Files
          </Typography>

          <Paper sx={{ borderRadius: 2, overflow: 'hidden' }}>
            <List>
              {uploadedFiles.map((file, index) => (
                <ListItem
                  key={file.id}
                  sx={{
                    borderBottom: index < uploadedFiles.length - 1 ? '1px solid #E2E8F0' : 'none',
                  }}
                >
                  <ListItemIcon>
                    <AttachFileIcon sx={{ color: '#718096' }} />
                  </ListItemIcon>

                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography
                          variant="body2"
                          sx={{ fontWeight: 500 }}
                        >
                          {file.name}
                        </Typography>
                        <Chip
                          label={file.status}
                          size="small"
                          sx={{
                            backgroundColor: `${getStatusColor(file.status)}22`,
                            color: getStatusColor(file.status),
                          }}
                        />
                      </Box>
                    }
                    secondary={
                      <Typography
                        variant="caption"
                        sx={{ color: '#718096' }}
                      >
                        {file.size}
                      </Typography>
                    }
                  />

                  <IconButton
                    size="small"
                    onClick={() => onFileDelete?.(file.id)}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </ListItem>
              ))}
            </List>
          </Paper>
        </Box>
      )}
    </Box>
  );
};

export { FileUploader };
