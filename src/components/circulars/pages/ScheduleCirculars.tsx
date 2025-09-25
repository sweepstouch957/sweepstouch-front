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
  CalendarToday as CalendarIcon,
  Delete as DeleteIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { FileUploader } from '../FileUploader';
import { StatusBadge } from '../StatusBadge';
import { mockCirculars } from '../../../data/circularsData';

const ScheduleCirculars: React.FC = () => {
  const [showInstructions, setShowInstructions] = useState(false);

  const handleFileUpload = (files: File[]) => {
    // Simulate file upload
    console.log('Files uploaded:', files);
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
          <Typography variant="h4" sx={{ fontWeight: 600, color: '#2D3748', mb: 0.5 }}>
            Schedule Circulars
          </Typography>
          <Typography variant="subtitle1" sx={{ color: '#718096' }}>
            Upload and manage circular files
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<HelpIcon />}
          onClick={() => setShowInstructions(true)}
          sx={{
            backgroundColor: '#E91E63',
            '&:hover': {
              backgroundColor: '#AD1457',
            },
          }}
        >
          Instructions
        </Button>
      </Box>

      {/* File Uploader */}
      <Box sx={{ mb: 4 }}>
        <FileUploader
          uploadedFiles={[]}
          onFileUpload={handleFileUpload}
        />
      </Box>

      {/* Circular Schedule Management */}
      <Paper sx={{ borderRadius: 3, overflow: 'hidden' }}>
        <Box sx={{ p: 3, borderBottom: '1px solid #E2E8F0' }}>
          <Typography variant="h6" sx={{ fontWeight: 600, color: '#2D3748' }}>
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
                          backgroundColor: '#E91E63',
                          fontSize: '0.875rem',
                          fontWeight: 600,
                        }}
                      >
                        {circular.storeInitials}
                      </Avatar>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 500, color: '#2D3748' }}>
                          {circular.storeName}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#718096' }}>
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
                            <CalendarIcon sx={{ color: '#718096', fontSize: 20 }} />
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
                            <CalendarIcon sx={{ color: '#718096', fontSize: 20 }} />
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
                    <IconButton size="small" sx={{ color: '#718096' }}>
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
            <Typography variant="h5" sx={{ fontWeight: 600, color: '#2D3748' }}>
              Instructions
            </Typography>
            <IconButton
              onClick={() => setShowInstructions(false)}
              sx={{ color: '#718096' }}
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
                    color: '#2D3748',
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

export { ScheduleCirculars };
