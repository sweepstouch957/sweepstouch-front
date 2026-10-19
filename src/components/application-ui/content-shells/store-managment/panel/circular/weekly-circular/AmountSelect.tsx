'use client';

/**
 * Cuántos productos leer. "Los primeros X" = los de foto grande (rápido, recortes limpios).
 * 0 = todos de una; por defecto TODOS: la lista debe traer el circular completo.
 */
import { MenuItem, TextField, type TextFieldProps } from '@mui/material';

const AMOUNTS = [10, 20, 30, 50];

export default function AmountSelect({
  value,
  onChange,
  ...rest
}: { value: number; onChange: (n: number) => void } & Omit<TextFieldProps, 'value' | 'onChange'>) {
  return (
    <TextField
      select
      size="small"
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      {...rest}
    >
      <MenuItem value={0}>Todos los productos del circular (recomendado)</MenuItem>
      {AMOUNTS.map((a) => (
        <MenuItem
          key={a}
          value={a}
        >
          Sólo los primeros {a} (foto grande, rápido)
        </MenuItem>
      ))}
    </TextField>
  );
}
