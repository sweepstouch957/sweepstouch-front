'use client';
/* eslint-disable react/jsx-max-props-per-line */

import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Avatar,
  IconButton,
  TextField,
  InputAdornment,
  Modal,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import {
  Help as HelpIcon,
  Save as SaveIcon,
  CalendarToday as CalendarIcon,
  Delete as DeleteIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { FileUploader } from '../FileUploader';
import { StatusBadge } from '../StatusBadge';
import { mockCirculars, mockUploadedFiles } from '../../../data/circularsData';

const EditCircularsUpload: React.FC = () => {
  const [showInstructions, setShowInstructions] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState(mockUploadedFiles);

  const handleFileUpload = (files: File[]) => {
    // Simulate file upload
    const newFiles = files.map((file, index) => ({
      id: `${Date.now()}-${index}`,
      name: file.name,
      size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
      status: 'Uploaded' as const,
    }));
    setUploadedFiles(prev => [...prev, ...newFiles]);
  };

  const handleFileDelete = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(file => file.id !== fileId));
  };

  const instructionsContent = [
    'Upload PDF files using the drag-and-drop area above (maximum 10MB per file)',
    'Set start and end dates for each store\'s circular schedule',
    'Dates are locked once saved unless manually edited',
    'All stores must have both start and end dates before saving',
    'Use the trash icon to delete scheduled circulars that haven\'t been locked',
  ];

  return (
    <Box sx={{
        p: { xs: 2, sm: 3, md: 4 }, 
      }}>
      {/* Page Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 600, color: 'text.primary', mb: 0.5 }}>
            Edit Circulars
          </Typography>
          <Typography variant="subtitle1" sx={{ color: 'text.secondary' }}>
            Upload and manage circular files
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<HelpIcon />}
            onClick={() => setShowInstructions(true)}
            sx={{
              borderColor: 'primary.main',
              color: 'primary.main',
              '&:hover': {
                borderColor: 'primary.dark',
                backgroundColor: 'rgba(233, 30, 99, 0.05)',
              },
            }}
          >
            Instructions
          </Button>
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            sx={{
              backgroundColor: 'primary.main',
              '&:hover': {
                backgroundColor: 'primary.dark',
              },
            }}
          >
            Save Changes
          </Button>
        </Box>
      </Box>

      {/* File Uploader */}
      <Box sx={{ mb: 4 }}>
        <FileUploader
          uploadedFiles={uploadedFiles}
          onFileUpload={handleFileUpload}
          onFileDelete={handleFileDelete}
        />
      </Box>

      {/* Circular Schedule Management */}
      <Paper sx={{ borderRadius: 3, overflow: 'hidden' }}>
        <Box sx={{ p: 3, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary' }}>
            Circular Schedule Management
          </Typography>
        </Box>
        
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>STORE</TableCell>
                <TableCell>START DATE</TableCell>
                <TableCell>END DATE</TableCell>
                <TableCell>STATUS</TableCell>
                <TableCell align="center">ACTIONS</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {mockCirculars.map((circular) => (
                <TableRow key={circular.id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar
                        sx={{
                          width: 40,
                          height: 40,
                          backgroundColor: 'primary.main',
                          fontSize: '0.875rem',
                          fontWeight: 600,
                        }}
                      >
                        {circular.storeInitials}
                      </Avatar>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 500, color: 'text.primary' }}>
                          {circular.storeName}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          {circular.storeAddress}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <TextField
                      placeholder="dd/mm/yyyy"
                      size="small"
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <CalendarIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                          </InputAdornment>
                        ),
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                        },
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      placeholder="dd/mm/yyyy"
                      size="small"
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <CalendarIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                          </InputAdornment>
                        ),
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                        },
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={circular.status} />
                  </TableCell>
                  <TableCell align="center">
                    <IconButton size="small" sx={{ color: 'text.secondary' }}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Instructions Modal */}
      <Modal
        open={showInstructions}
        onClose={() => setShowInstructions(false)}
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Paper
          sx={{
            maxWidth: 600,
            width: '90%',
            borderRadius: 3,
            p: 4,
            position: 'relative',
            maxHeight: '80vh',
            overflow: 'auto',
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h5" sx={{ fontWeight: 600, color: 'text.primary' }}>
              Instructions
            </Typography>
            <IconButton
              onClick={() => setShowInstructions(false)}
              sx={{ color: 'text.secondary' }}
            >
              <CloseIcon />
            </IconButton>
          </Box>
          
          <List>
            {instructionsContent.map((instruction, index) => (
              <ListItem key={index} sx={{ px: 0, py: 1 }}>
                <ListItemText
                  primary={`• ${instruction}`}
                  primaryTypographyProps={{
                    variant: 'body2',
                    color: 'text.primary',
                    lineHeight: 1.6,
                  }}
                />
              </ListItem>
            ))}
          </List>
        </Paper>
      </Modal>
    </Box>
  );
};

export { EditCircularsUpload };
