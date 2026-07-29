import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
  useTheme,
} from '@mui/material';
import React from 'react';
import { PROJECT_COLORS, type ProjectFormState } from './constants';

type ProjectDialogProps = {
  open: boolean;
  form: ProjectFormState;
  setForm: React.Dispatch<React.SetStateAction<ProjectFormState>>;
  submitting: boolean;
  onClose: () => void;
  onSubmit: () => void;
};

export function ProjectDialog({ open, form, setForm, submitting, onClose, onSubmit }: ProjectDialogProps) {
  const theme = useTheme();

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{ sx: { borderRadius: 3 } }}
    >
      <DialogTitle sx={{ fontWeight: 700 }}>New Project</DialogTitle>
      <DialogContent dividers>
        <Stack
          spacing={2}
          pt={1}
        >
          <TextField
            label="Project Name"
            fullWidth
            autoFocus
            required
            value={form.name}
            onChange={(e) => { const v = e.target.value; setForm(prev => ({ ...prev, name: v })); }}
          />
          <TextField
            label="Description"
            fullWidth
            multiline
            rows={2}
            value={form.description}
            onChange={(e) => { const v = e.target.value; setForm(prev => ({ ...prev, description: v })); }}
          />
          <Box>
            <Typography
              variant="caption"
              fontWeight={600}
              color="text.secondary"
              mb={0.75}
              display="block"
            >
              Color
            </Typography>
            <Stack
              direction="row"
              gap={0.75}
              flexWrap="wrap"
            >
              {PROJECT_COLORS.map((c) => (
                <Box
                  key={c}
                  onClick={() => setForm(prev => ({ ...prev, color: c }))}
                  sx={{
                    width: 30,
                    height: 30,
                    borderRadius: 1.5,
                    bgcolor: c,
                    cursor: 'pointer',
                    border:
                      form.color === c
                        ? `3px solid ${theme.palette.background.paper}`
                        : '3px solid transparent',
                    outline: form.color === c ? `2px solid ${c}` : 'none',
                    transition: 'all 0.15s',
                    '&:hover': { transform: 'scale(1.12)' },
                  }}
                />
              ))}
            </Stack>
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button
          onClick={onClose}
          sx={{ borderRadius: 1.5, textTransform: 'none' }}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          disableElevation
          onClick={onSubmit}
          disabled={!form.name || submitting}
          sx={{ fontWeight: 700, borderRadius: 1.5, textTransform: 'none' }}
        >
          Create Project
        </Button>
      </DialogActions>
    </Dialog>
  );
}
