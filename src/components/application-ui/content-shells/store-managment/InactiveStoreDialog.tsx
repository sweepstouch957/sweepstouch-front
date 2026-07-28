'use client';

import BlockRoundedIcon from '@mui/icons-material/BlockRounded';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from '@mui/material';
import type { FC } from 'react';

interface Props {
  open: boolean;
  onClose: () => void;
}

export const InactiveStoreDialog: FC<Props> = ({ open, onClose }) => (
  <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
    <DialogTitle sx={{ pb: 1 }}>
      <Box display="flex" alignItems="center" gap={1.5}>
        <BlockRoundedIcon sx={{ color: 'error.main', fontSize: 20 }} />
        <Typography variant="h6" component="span" fontWeight={600}>
          Tienda inactiva
        </Typography>
      </Box>
    </DialogTitle>
    <DialogContent>
      <Typography variant="body2" color="text.secondary" lineHeight={1.7}>
        Esta tienda está desactivada. Actívala primero para poder crear campañas.
      </Typography>
    </DialogContent>
    <DialogActions sx={{ px: 3, pb: 2.5 }}>
      <Button onClick={onClose} variant="contained" size="small">
        Entendido
      </Button>
    </DialogActions>
  </Dialog>
);
