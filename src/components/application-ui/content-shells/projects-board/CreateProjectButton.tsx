'use client';

import { Button } from '@mui/material';
import { useWatch, type Control } from 'react-hook-form';
import type { ProjectFormValues } from './project-form';

export function CreateProjectButton({
  control,
  isPending,
  theme,
}: {
  control: Control<ProjectFormValues>;
  isPending: boolean;
  theme: any;
}) {
  const name = useWatch({ control, name: 'name' });

  return (
    <Button
      variant="contained"
      disableElevation
      type="submit"
      disabled={!name || isPending}
      sx={{
        fontWeight: 700,
        borderRadius: 1.5,
        textTransform: 'none',
        background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
      }}
    >
      Create Project
    </Button>
  );
}
