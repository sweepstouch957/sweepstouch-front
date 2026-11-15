'use client';

import { Button } from '@mui/material';
import { useWatch, type Control } from 'react-hook-form';
import { FormState } from './types';

export function SaveTicketButton({
  control,
  isSaving,
  isEdit,
}: {
  control: Control<FormState>;
  isSaving: boolean;
  isEdit: boolean;
}) {
  const title = useWatch({ control, name: 'title' });

  return (
    <Button
      variant="contained"
      type="submit"
      disabled={!title || isSaving}
    >
      {isSaving ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear ticket'}
    </Button>
  );
}
