import { Button, Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material';
import React from 'react';
import CampaignForm from '../../form-layouts/campaings/campaing-form';

const CampaignModal = ({ open, onClose, onSubmit }) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
    >
      <DialogTitle>Crear Nueva Campaña</DialogTitle>
      <DialogContent>
        <CampaignForm onSubmit={onSubmit} />
      </DialogContent>
      <DialogActions>
        <Button
          onClick={onClose}
          color="secondary"
        >
          Cancelar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CampaignModal;
