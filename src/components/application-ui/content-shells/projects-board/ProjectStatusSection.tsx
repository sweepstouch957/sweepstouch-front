'use client';

import { PROJECT_TYPE_LABEL, type ProjectType } from '@/services/task.service';
import { Box, MenuItem, Stack, TextField, Typography } from '@mui/material';
import { Controller } from 'react-hook-form';
import { ColorPicker } from './ColorPicker';
import { STATUS_MAP, statusOptions } from './constants';
import type { useEditProjectForm } from './use-edit-project-form';

type Props = Pick<ReturnType<typeof useEditProjectForm>, 'control' | 'departments'>;

/** Estado del flujo, cómo se lleva, área dueña y color del proyecto. */
export function ProjectStatusSection({ control, departments }: Props) {
  return (
    <Box>
      <Typography
        variant="overline"
        color="text.secondary"
        fontWeight={700}
        sx={{ mb: 1.5, display: 'block', letterSpacing: 1 }}
      >
        Status & Color
      </Typography>
      <Stack spacing={2}>
        <Controller
          control={control}
          name="workflowStatus"
          render={({ field }) => (
            <TextField
              {...field}
              label="Workflow Status"
              select
              fullWidth
            >
              {statusOptions.map((opt) => (
                <MenuItem
                  key={opt.id}
                  value={opt.id}
                >
                  <Stack
                    direction="row"
                    alignItems="center"
                    spacing={1}
                  >
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        bgcolor:
                          STATUS_MAP[opt.id].color === 'error'
                            ? 'error.main'
                            : STATUS_MAP[opt.id].color === 'info'
                              ? 'info.main'
                              : 'success.main',
                      }}
                    />
                    <span>{opt.name}</span>
                  </Stack>
                </MenuItem>
              ))}
            </TextField>
          )}
        />
        {/* Cómo se lleva el proyecto + área dueña (Manual de Cowork) */}
        <Controller
          control={control}
          name="type"
          render={({ field }) => (
            <TextField
              {...field}
              label="Cómo se lleva"
              select
              fullWidth
              helperText="Un proyecto por hitos (ej. RCS) se mide por hito con fecha y criterio de cierre."
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
        <Controller
          control={control}
          name="departmentId"
          render={({ field }) => (
            <TextField
              {...field}
              label="Área dueña"
              select
              fullWidth
              helperText="Las tareas del proyecto se cuentan en el reporte de esta área."
            >
              <MenuItem value="">Sin área</MenuItem>
              {departments.map((d) => (
                <MenuItem
                  key={d._id}
                  value={d._id}
                >
                  {d.name}
                </MenuItem>
              ))}
            </TextField>
          )}
        />
        <Box>
          <Typography
            variant="caption"
            fontWeight={600}
            color="text.secondary"
            mb={0.75}
            display="block"
          >
            Project Color
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
    </Box>
  );
}
