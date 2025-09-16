'use client';

import CloseIcon from '@mui/icons-material/Close';
import {
  Avatar,
  Box,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  Typography,
} from '@mui/material';
import React from 'react';

const PhotoDialog: React.FC<{
  open: boolean;
  onClose: () => void;
  src?: string;
  title?: string;
}> = ({ open, onClose, src, title }) => (
  <Dialog
    open={open}
    onClose={onClose}
    maxWidth="xs"
    fullWidth
  >
    <DialogTitle>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
      >
        <Typography fontWeight={700}>{title ?? 'Foto'}</Typography>
        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </Stack>
    </DialogTitle>
    <DialogContent dividers>
      <Box sx={{ display: 'grid', placeItems: 'center' }}>
        <Avatar
          src={src || '/placeholder-profile.png'}
          sx={{ width: 300, height: 300 }}
        />
      </Box>
    </DialogContent>
  </Dialog>
);

export default PhotoDialog;
