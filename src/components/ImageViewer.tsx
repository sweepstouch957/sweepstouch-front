'use client';

import React, { forwardRef, useState, type ReactElement } from 'react';
import { Dialog, DialogContent, Box, IconButton, Zoom } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { type TransitionProps } from '@mui/material/transitions';

const Transition = forwardRef(function Transition(
  props: TransitionProps & {
    children: ReactElement<any, any>;
  },
  ref: React.Ref<unknown>
) {
  return <Zoom ref={ref} {...props} />;
});

interface ImageViewerProps {
  open: boolean;
  imageUrl: string;
  onClose: () => void;
}

export function ImageViewer({ open, imageUrl, onClose }: ImageViewerProps) {
  if (!imageUrl) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      TransitionComponent={Transition}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: 'transparent',
          boxShadow: 'none',
          overflow: 'visible',
          borderRadius: 4,
          margin: 2
        },
      }}
    >
      <DialogContent sx={{ position: 'relative', p: 0, display: 'flex', justifyContent: 'center' }}>
        <IconButton
          onClick={onClose}
          sx={{
            position: 'absolute',
            top: 12,
            right: 12,
            color: '#fff',
            bgcolor: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(4px)',
            '&:hover': { bgcolor: 'rgba(0,0,0,0.8)' },
            zIndex: 10,
            border: '1px solid rgba(255,255,255,0.2)'
          }}
        >
          <CloseIcon fontSize="medium" />
        </IconButton>
        <Box
          component="img"
          src={imageUrl}
          alt="Full size"
          sx={{
            maxWidth: '100%',
            maxHeight: '80vh',
            borderRadius: 4,
            boxShadow: '0 32px 100px rgba(0,0,0,0.5)',
            objectFit: 'contain',
            border: '2px solid rgba(255,255,255,0.1)'
          }}
        />
      </DialogContent>
    </Dialog>
  );
}

export function useImageViewer() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentImage, setCurrentImage] = useState('');

  const openViewer = (url: string) => {
    if (!url) return;
    setCurrentImage(url);
    setIsOpen(true);
  };

  const closeViewer = () => setIsOpen(false);

  return {
    isOpen,
    currentImage,
    openViewer,
    closeViewer,
  };
}

export function ViewImageIcon({ onClick, sx = {} }: { onClick: (e: React.MouseEvent) => void, sx?: any }) {
  return (
    <IconButton
      onClick={onClick}
      size="small"
      sx={{
        color: '#fff',
        background: 'rgba(215, 0, 110, 0.6)',
        backdropFilter: 'blur(4px)',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        '&:hover': {
          background: 'rgba(215, 0, 110, 0.8)',
          transform: 'scale(1.1)',
        },
        transition: 'all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        ...sx
      }}
    >
      <VisibilityIcon sx={{ fontSize: 18 }} />
    </IconButton>
  );
}
