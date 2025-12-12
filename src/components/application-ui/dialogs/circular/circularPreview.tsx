// src/components/circulars/PreviewCircularDialog.tsx
'use client';

import { PreviewLabel } from '@/components/circulars/tables/CircularsTable';
import CenterFocusStrongIcon from '@mui/icons-material/CenterFocusStrong';
import CloseIcon from '@mui/icons-material/Close';
import DownloadIcon from '@mui/icons-material/Download';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import {
  AppBar,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Toolbar,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import type { Circular } from '@services/circular.service';
import React, { useState } from 'react';

export type PreviewTarget = {
  circular: Circular;
  storeName: string;
  label: PreviewLabel;
};

type Props = {
  target: PreviewTarget | null;
  onClose: () => void;
};

export const PreviewCircularDialog: React.FC<Props> = ({ target, onClose }) => {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'));

  const [zoom, setZoom] = useState(1);

  if (!target) return null;

  const { circular, storeName, label } = target;
  const url = circular.fileUrl;

  const handleOpenInNewTab = () => {
    if (url) window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleDownload = () => {
    if (!url) return;
    // truco simple para descargar: anchor oculto
    const link = document.createElement('a');
    link.href = url;
    link.download = circular.title || 'circular.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleZoomIn = () => setZoom((z) => Math.min(z + 0.25, 2.5));
  const handleZoomOut = () => setZoom((z) => Math.max(z - 0.25, 0.5));
  const handleZoomReset = () => setZoom(1);

  return (
    <Dialog
      open
      onClose={onClose}
      fullScreen={fullScreen}
      maxWidth="lg"
      fullWidth
    >
      {/* Toolbar superior */}
      {fullScreen ? (
        <AppBar
          position="relative"
          color="default"
          elevation={0}
        >
          <Toolbar sx={{ px: 2 }}>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography
                variant="subtitle2"
                noWrap
                sx={{ color: 'text.secondary' }}
              >
                {label}
              </Typography>
              <Typography
                variant="h6"
                noWrap
                sx={{ fontWeight: 600 }}
              >
                {circular.title || 'Circular PDF'}
              </Typography>
              <Typography
                variant="caption"
                noWrap
                sx={{ color: 'text.secondary' }}
              >
                {storeName}
              </Typography>
            </Box>

            {/* Controles de zoom / acciones */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mr: 1 }}>
              <Tooltip title="Zoom out">
                <span>
                  <IconButton
                    size="small"
                    onClick={handleZoomOut}
                    disabled={zoom <= 0.5}
                  >
                    <ZoomOutIcon fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>

              <Typography
                variant="caption"
                sx={{ minWidth: 48, textAlign: 'center' }}
              >
                {Math.round(zoom * 100)}%
              </Typography>

              <Tooltip title="Zoom in">
                <span>
                  <IconButton
                    size="small"
                    onClick={handleZoomIn}
                    disabled={zoom >= 2.5}
                  >
                    <ZoomInIcon fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>

              <Tooltip title="Reset zoom">
                <IconButton
                  size="small"
                  onClick={handleZoomReset}
                >
                  <CenterFocusStrongIcon fontSize="small" />
                </IconButton>
              </Tooltip>

              <Tooltip title="Open in new tab">
                <span>
                  <IconButton
                    size="small"
                    onClick={handleOpenInNewTab}
                    disabled={!url}
                  >
                    <OpenInNewIcon fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>

              <Tooltip title="Download PDF">
                <span>
                  <IconButton
                    size="small"
                    onClick={handleDownload}
                    disabled={!url}
                  >
                    <DownloadIcon fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
            </Box>

            <IconButton
              edge="end"
              onClick={onClose}
            >
              <CloseIcon />
            </IconButton>
          </Toolbar>
        </AppBar>
      ) : (
        <DialogTitle
          sx={{
            pb: 1,
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 2,
          }}
        >
          <Box sx={{ minWidth: 0 }}>
            <Typography
              variant="subtitle2"
              sx={{ color: 'text.secondary' }}
            >
              {label}
            </Typography>
            <Typography
              variant="h6"
              noWrap
              sx={{ fontWeight: 600 }}
            >
              {circular.title || 'Circular PDF'}
            </Typography>
            <Typography
              variant="caption"
              sx={{ color: 'text.secondary' }}
            >
              {storeName}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Tooltip title="Zoom out">
              <span>
                <IconButton
                  size="small"
                  onClick={handleZoomOut}
                  disabled={zoom <= 0.5}
                >
                  <ZoomOutIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>

            <Typography
              variant="caption"
              sx={{ minWidth: 42, textAlign: 'center' }}
            >
              {Math.round(zoom * 100)}%
            </Typography>

            <Tooltip title="Zoom in">
              <span>
                <IconButton
                  size="small"
                  onClick={handleZoomIn}
                  disabled={zoom >= 2.5}
                >
                  <ZoomInIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>

            <Tooltip title="Reset zoom">
              <IconButton
                size="small"
                onClick={handleZoomReset}
              >
                <CenterFocusStrongIcon fontSize="small" />
              </IconButton>
            </Tooltip>

            <Tooltip title="Open in new tab">
              <span>
                <IconButton
                  size="small"
                  onClick={handleOpenInNewTab}
                  disabled={!url}
                >
                  <OpenInNewIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>

            <Tooltip title="Download PDF">
              <span>
                <IconButton
                  size="small"
                  onClick={handleDownload}
                  disabled={!url}
                >
                  <DownloadIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>

            <IconButton
              size="small"
              onClick={onClose}
            >
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
      )}

      <DialogContent
        dividers
        sx={{
          p: 0,
          height: fullScreen ? '100%' : '80vh',
          bgcolor: '#111827',
        }}
      >
        <Box
          sx={{
            width: '100%',
            height: '100%',
            overflow: 'auto',
            p: 2,
            boxSizing: 'border-box',
          }}
        >
          <Box
            sx={{
              mx: 'auto',
              transform: `scale(${zoom})`,
              transformOrigin: 'top center',
              width: `${100 / zoom}%`,
              height: `${100 / zoom}%`,
              boxShadow: '0 0 25px rgba(0,0,0,0.4)',
              borderRadius: 1,
              overflow: 'hidden',
              bgcolor: '#fff',
            }}
          >
            {url ? (
              <iframe
                src={url}
                style={{ width: '100%', height: '100%', border: 'none' }}
                title={circular.title}
              />
            ) : (
              <Box
                sx={{
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: '#111827',
                  color: '#E5E7EB',
                }}
              >
                <Typography variant="body2">No PDF available for this circular.</Typography>
              </Box>
            )}
          </Box>
        </Box>
      </DialogContent>

      {!fullScreen && (
        <DialogActions>
          <Button onClick={onClose}>Close</Button>
        </DialogActions>
      )}
    </Dialog>
  );
};
