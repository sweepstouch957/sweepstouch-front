'use client';
/* eslint-disable react/jsx-max-props-per-line */

import React, { useCallback, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  Chip,
} from '@mui/material';
import {
  CloudUpload as CloudUploadIcon,
  AttachFile as AttachFileIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';

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
}

const FileUploader: React.FC<FileUploaderProps> = ({
  uploadedFiles = [],
  onFileUpload,
  onFileDelete,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (onFileUpload) {
      onFileUpload(files);
    }
  }, [onFileUpload]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (onFileUpload) {
      onFileUpload(files);
    }
  }, [onFileUpload]);

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
          backgroundColor: isDragOver ? 'rgba(233, 30, 99, 0.05)' : 'transparent',
          cursor: 'pointer',
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            borderColor: '#E91E63',
            backgroundColor: 'rgba(233, 30, 99, 0.02)',
          },
        }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
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
          <CloudUploadIcon sx={{ fontSize: 32, color: '#718096' }} />
        </Box>
        
        <Typography variant="body1" sx={{ mb: 1 }}>
          <Typography
            component="span"
            sx={{ color: '#2196F3', fontWeight: 500, cursor: 'pointer' }}
          >
            Click to upload
          </Typography>
          {' '}or drag and drop documents here.
        </Typography>
        
        <Typography variant="body2" sx={{ color: '#718096' }}>
          (Max 10MB each)
        </Typography>

        <input
          id="file-input"
          type="file"
          multiple
          accept=".pdf,.doc,.docx"
          style={{ display: 'none' }}
          onChange={handleFileSelect}
        />
      </Paper>

      {/* Uploaded Files */}
      {uploadedFiles.length > 0 && (
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, color: '#2D3748', mb: 2 }}>
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
                        <Typography variant="body2" sx={{ fontWeight: 500, color: '#2D3748' }}>
                          {file.name}
                        </Typography>
                        <Chip
                          label={file.status}
                          size="small"
                          sx={{
                            backgroundColor: `${getStatusColor(file.status)}15`,
                            color: getStatusColor(file.status),
                            fontWeight: 500,
                            fontSize: '0.75rem',
                            height: 20,
                          }}
                        />
                      </Box>
                    }
                    secondary={
                      <Typography variant="caption" sx={{ color: '#718096' }}>
                        {file.size}
                      </Typography>
                    }
                  />
                  <IconButton
                    size="small"
                    sx={{ color: '#718096' }}
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
