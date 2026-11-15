'use client';

import { PROJECT_TYPE_LABEL, type ProjectType } from '@/services/task.service';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  TextField,
  Typography,
  useTheme,
} from '@mui/material';
import { Controller, useForm } from 'react-hook-form';
import { ColorPicker } from './ColorPicker';
import { EMPTY_FORM, statusOptions } from './constants';
import { CreateProjectButton } from './CreateProjectButton';
import { rhf, type ProjectFormValues } from './project-form';

/* ══════════════════════════════════════════════════════════════════ */
/*  NEW PROJECT DIALOG                                                 */
/* ══════════════════════════════════════════════════════════════════ */

export function NewProjectDialog({
  open,
  isPending,
  onClose,
  onCreate,
}: {
  open: boolean;
  isPending: boolean;
  onClose: () => void;
  onCreate: (payload: any) => void;
}) {
  const theme = useTheme();
  // Se monta al abrir: los defaults se calculan una vez y no hace falta reset.
  const { register, control, handleSubmit } = useForm<ProjectFormValues>({
    defaultValues: EMPTY_FORM,
  });

  const submit = handleSubmit((values) =>
    onCreate({
      ...values,
      tags: values.tags
        ? values.tags
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean)
        : [],
      startDate: values.startDate || undefined,
      dueDate: values.dueDate || undefined,
    })
  );

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{ sx: { borderRadius: 3 }, component: 'form', onSubmit: submit }}
    >
      <DialogTitle sx={{ fontWeight: 700 }}>New Project</DialogTitle>
      <DialogContent dividers>
        <Stack
          spacing={2.5}
          pt={1}
        >
          <TextField
            label="Project Name *"
            fullWidth
            autoFocus
            {...rhf(register, 'name')}
          />
          <TextField
            label="Description"
            fullWidth
            multiline
            rows={2}
            {...rhf(register, 'description')}
          />
          <TextField
            label="Tags (comma-separated)"
            fullWidth
            {...rhf(register, 'tags')}
            placeholder="design, frontend, api"
          />
          <Controller
            control={control}
            name="workflowStatus"
            render={({ field }) => (
              <TextField
                {...field}
                label="Status"
                select
                fullWidth
              >
                {statusOptions.map((opt) => (
                  <MenuItem
                    key={opt.id}
                    value={opt.id}
                  >
                    {opt.name}
                  </MenuItem>
                ))}
              </TextField>
            )}
          />
          {/* Un proyecto por hitos (ej. RCS) no es un área ni un cargo */}
          <Controller
            control={control}
            name="type"
            render={({ field }) => (
              <TextField
                {...field}
                label="Cómo se lleva"
                select
                fullWidth
              >
                {(Object.keys(PROJECT_TYPE_LABEL) as ProjectType[]).map((k) => (
                  <MenuItem
                    key={k}
                    value={k}
                  >
                    {PROJECT_TYPE_LABEL[k]}
                  </MenuItem>
                ))}
              </TextField>
            )}
          />
          <Stack
            direction="row"
            spacing={2}
          >
            <TextField
              label="Start Date"
              type="date"
              fullWidth
              {...rhf(register, 'startDate')}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="Due Date"
              type="date"
              fullWidth
              {...rhf(register, 'dueDate')}
              InputLabelProps={{ shrink: true }}
            />
          </Stack>
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
            <Controller
              control={control}
              name="color"
              render={({ field }) => (
                <ColorPicker
                  value={field.value}
                  onChange={field.onChange}
                />
              )}
            />
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
        <CreateProjectButton
          control={control}
          isPending={isPending}
          theme={theme}
        />
      </DialogActions>
    </Dialog>
  );
}
