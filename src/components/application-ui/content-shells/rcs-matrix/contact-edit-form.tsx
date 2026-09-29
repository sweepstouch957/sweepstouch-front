'use client';

/**
 * Completar los datos de la persona desde la ficha (nombre y correo). El form es dueño
 * de su estado; la ficha sólo recibe el resultado.
 */

import { customerClient } from '@/services/customerService';
import { Button, Stack, TextField } from '@mui/material';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';

type Values = { fullName: string; email: string };

export function ContactEditForm({
  customerId,
  name,
  onSaved,
  onCancel,
}: {
  customerId: string;
  /** Nombre actual ("" si no tiene). */
  name: string;
  onSaved: (fullName: string) => void;
  onCancel: () => void;
}) {
  const { register, handleSubmit, formState } = useForm<Values>({ defaultValues: { fullName: name, email: '' } });
  const save = useMutation({
    mutationFn: (v: Values) =>
      customerClient.updateCustomerInfo(customerId, {
        fullName: v.fullName.trim(),
        ...(v.email.trim() ? { email: v.email.trim() } : {}),
      }),
    onSuccess: (_r, v) => {
      toast.success('Datos guardados');
      onSaved(v.fullName.trim());
    },
    onError: (e: any) => toast.error(e?.response?.data?.error || 'No se pudo guardar'),
  });

  const { ref: nameRef, ...nameField } = register('fullName', { required: 'Escribe el nombre', minLength: 2 });
  const { ref: mailRef, ...mailField } = register('email', {
    pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Correo inválido' },
  });

  return (
    <Stack
      component="form"
      gap={1}
      onSubmit={handleSubmit((v) => save.mutate(v))}
    >
      <TextField
        {...nameField}
        inputRef={nameRef}
        size="small"
        autoFocus
        label="Nombre y apellido"
        error={!!formState.errors.fullName}
        helperText={formState.errors.fullName?.message}
      />
      <TextField
        {...mailField}
        inputRef={mailRef}
        size="small"
        type="email"
        label="Correo (opcional)"
        error={!!formState.errors.email}
        helperText={formState.errors.email?.message}
      />
      <Stack
        direction="row"
        gap={1}
        justifyContent="flex-end"
      >
        <Button
          size="small"
          onClick={onCancel}
          sx={{ textTransform: 'none' }}
        >
          Cancelar
        </Button>
        <Button
          size="small"
          type="submit"
          variant="contained"
          disableElevation
          disabled={save.isPending}
          sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 700 }}
        >
          Guardar
        </Button>
      </Stack>
    </Stack>
  );
}
