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
import { Controller, useForm, useWatch, type Control } from 'react-hook-form';
import { PROJECT_COLORS, type ProjectFormState } from './constants';

/** Mismo criterio que el diálogo de tarea: el formulario no vive en la página. */
type ProjectDialogProps = {
  open: boolean;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (values: ProjectFormState) => void;
};

export function ProjectDialog({ open, submitting, onClose, onSubmit }: ProjectDialogProps) {
  const { register, control, handleSubmit } = useForm<ProjectFormState>({
    defaultValues: { name: '', description: '', color: PROJECT_COLORS[0] },
  });

  const { ref: nameRef, ...nameField } = register('name', { required: true });
  const { ref: descRef, ...descField } = register('description');

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 3 },
        component: 'form',
        onSubmit: handleSubmit(onSubmit),
      }}
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
            inputRef={nameRef}
            {...nameField}
          />
          <TextField
            label="Description"
            fullWidth
            multiline
            rows={2}
            inputRef={descRef}
            {...descField}
          />
          <ColorPicker control={control} />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button
          onClick={onClose}
          sx={{ borderRadius: 1.5, textTransform: 'none' }}
        >
          Cancel
        </Button>
        <SubmitButton
          control={control}
          submitting={submitting}
        />
      </DialogActions>
    </Dialog>
  );
}

function ColorPicker({ control }: { control: Control<ProjectFormState> }) {
  const theme = useTheme();

  return (
    <Controller
      control={control}
      name="color"
      render={({ field }) => (
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
                onClick={() => field.onChange(c)}
                sx={{
                  width: 30,
                  height: 30,
                  borderRadius: 1.5,
                  bgcolor: c,
                  cursor: 'pointer',
                  border:
                    field.value === c
                      ? `3px solid ${theme.palette.background.paper}`
                      : '3px solid transparent',
                  outline: field.value === c ? `2px solid ${c}` : 'none',
                  transition: 'all 0.15s',
                  '&:hover': { transform: 'scale(1.12)' },
                }}
              />
            ))}
          </Stack>
        </Box>
      )}
    />
  );
}

function SubmitButton({
  control,
  submitting,
}: {
  control: Control<ProjectFormState>;
  submitting: boolean;
}) {
  const name = useWatch({ control, name: 'name' });

  return (
    <Button
      variant="contained"
      type="submit"
      disableElevation
      disabled={!name || submitting}
      sx={{ fontWeight: 700, borderRadius: 1.5, textTransform: 'none' }}
    >
      Create Project
    </Button>
  );
}
