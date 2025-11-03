'use client';

import CloseIcon from '@mui/icons-material/Close';
import { Box, Dialog, DialogContent, DialogTitle, IconButton, Typography } from '@mui/material';
import React from 'react';
import SmsCampaignsTable from './SmsCampaignsTable';

interface SmsCampaignsModalProps {
  open: boolean;
  onClose: () => void;
  startDate: string;
  endDate: string;
}

export default function SmsCampaignsModal({
  open,
  onClose,
  startDate,
  endDate,
}: SmsCampaignsModalProps) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
    >
      <DialogTitle>
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
        >
          <Typography variant="h5">Detalle de Campañas SMS</Typography>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>
        <Typography
          variant="subtitle2"
          color="textSecondary"
        >
          Rango de fechas: {startDate} a {endDate}
        </Typography>
      </DialogTitle>
      <DialogContent dividers>
        <SmsCampaignsTable
          startDate={startDate}
          endDate={endDate}
        />
      </DialogContent>
    </Dialog>
  );
}
