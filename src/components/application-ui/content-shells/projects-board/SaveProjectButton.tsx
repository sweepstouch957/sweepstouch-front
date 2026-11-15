'use client';

import { Button, useTheme } from '@mui/material';
import { useWatch, type Control } from 'react-hook-form';
import type { ProjectFormValues } from './project-form';

/** Se suscribe sólo al nombre: escribirlo no repinta el drawer entero. */
export function SaveProjectButton({
  control,
  isSaving,
  onClick,
}: {
  control: Control<ProjectFormValues>;
  isSaving: boolean;
  onClick: () => void;
}) {
  const theme = useTheme();
  const name = useWatch({ control, name: 'name' });

  return (
    <Button
      variant="contained"
      disableElevation
      disabled={!name || isSaving}
      onClick={onClick}
      sx={{
        fontWeight: 700,
        borderRadius: 1.5,
        textTransform: 'none',
        background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
      }}
    >
      {isSaving ? 'Saving…' : 'Save Changes'}
    </Button>
  );
}
