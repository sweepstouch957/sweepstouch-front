'use client';

/** Columna de datos del editor de producto. Campos no controlados (register): cero re-renders al tipear. */
import type { StorePendingPrice } from '@/services/circular.service';
import { Alert, FormControlLabel, Stack, Switch, TextField } from '@mui/material';
import { Controller, useFormContext, type UseFormRegister } from 'react-hook-form';
import type { ProductFormValues } from './constants';
import { toDayInput } from './utils';

/** register → props de TextField de MUI (el ref va por inputRef). */
const field = (register: UseFormRegister<ProductFormValues>, name: keyof ProductFormValues) => {
  const { ref, ...rest } = register(name);
  return { inputRef: ref, ...rest };
};

export function ProductFields({
  isNew,
  pending,
  currentPrice,
  busy,
  canCrop,
}: {
  isNew: boolean;
  pending: StorePendingPrice | null;
  /** Precio de hoy (se muestra mientras el pendiente no sale). */
  currentPrice?: string;
  busy: boolean;
  /** ¿Hay circular con archivo o campaña con arte para recortar? */
  canCrop: boolean;
}) {
  const { register, control } = useFormContext<ProductFormValues>();

  return (
    <Stack
      gap={1.75}
      sx={{ flex: 1, minWidth: 0 }}
    >
      <TextField
        label="Nombre del producto"
        size="small"
        fullWidth
        autoFocus={isNew}
        {...field(register, 'name')}
      />
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        gap={1}
      >
        <TextField
          label="Marca"
          size="small"
          fullWidth
          placeholder="Green Giant"
          helperText="Vacío si el flyer no imprime marca."
          {...field(register, 'brand')}
        />
        <TextField
          label="Tamaño / presentación"
          size="small"
          fullWidth
          placeholder="2 LB BAG"
          {...field(register, 'size')}
        />
      </Stack>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        gap={1}
      >
        <TextField
          label="Categoría"
          size="small"
          fullWidth
          placeholder="meat"
          {...field(register, 'category')}
        />
        <TextField
          label="Departamento"
          size="small"
          fullWidth
          placeholder="Carnicería"
          {...field(register, 'department')}
        />
      </Stack>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        gap={1}
      >
        <TextField
          label="Unidad de venta"
          size="small"
          fullWidth
          placeholder="lb, each, pack"
          {...field(register, 'saleUnit')}
        />
        <TextField
          label="Código de barras"
          size="small"
          fullWidth
          placeholder="Opcional"
          inputProps={{ inputMode: 'numeric' }}
          {...field(register, 'barcode')}
        />
      </Stack>
      {!isNew && (
        <TextField
          label="Otros nombres con que lo leen"
          size="small"
          fullWidth
          placeholder="Mazola Kitchen Oil, Mazola Corn Oil 1 gal"
          helperText="Separados por coma. La próxima lectura con ese nombre cae en ESTA ficha (misma foto, sin duplicar). Al corregir el nombre arriba se guarda solo."
          {...field(register, 'aliases')}
        />
      )}
      {pending && (
        <Alert
          severity="info"
          sx={{ py: 0.25 }}
        >
          {pending.isNew ? 'Producto nuevo: aparece en las listas' : 'El precio cambia'} el día que
          elijas abajo.
          {!pending.isNew && currentPrice ? ` Hasta entonces sigue a ${currentPrice}.` : ''}
        </Alert>
      )}
      <TextField
        label={pending ? 'Precio que va a salir' : 'Precio o promoción'}
        size="small"
        fullWidth
        placeholder="$7.99 / lb o 2 / $5"
        {...field(register, 'price')}
      />
      {pending && (
        <TextField
          label="Sale el"
          type="date"
          size="small"
          fullWidth
          InputLabelProps={{ shrink: true }}
          inputProps={{ min: toDayInput(new Date().toISOString()) }}
          helperText="Desde las 00:00 (hora del Este) de ese día."
          {...field(register, 'pendingDay')}
        />
      )}
      <TextField
        label="Precio regular"
        size="small"
        fullWidth
        placeholder="Opcional"
        helperText="Sin precio regular el producto no aparece como oferta en las listas."
        {...field(register, 'regular')}
      />
      {/* Letra chica: el precio grande sin la caja de 15 lb es el que terminó en
          reclamos en la caja. Editable porque la IA a veces no la lee. */}
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        gap={1}
      >
        <TextField
          label="Caja / paquete fijo"
          size="small"
          type="number"
          placeholder="15"
          helperText="Vacío = suelto"
          sx={{ width: { xs: '100%', sm: 150 } }}
          {...field(register, 'packQty')}
        />
        <TextField
          label="Unidad"
          size="small"
          placeholder="lb"
          sx={{ width: { xs: '100%', sm: 110 } }}
          {...field(register, 'packUnit')}
        />
        <TextField
          label="Máx. por familia"
          size="small"
          type="number"
          placeholder="1"
          sx={{ width: { xs: '100%', sm: 150 } }}
          {...field(register, 'maxPerCustomer')}
        />
      </Stack>
      <TextField
        label="Condición impresa en el flyer"
        size="small"
        fullWidth
        placeholder="15 lb box only · At the counter"
        helperText="Se muestra tal cual en la card del cliente."
        {...field(register, 'condition')}
      />
      <Controller
        control={control}
        name="counterOnly"
        render={({ field: f }) => (
          <FormControlLabel
            control={
              <Switch
                checked={f.value}
                onChange={(e) => f.onChange(e.target.checked)}
                inputRef={f.ref}
              />
            }
            label="Solo en el mostrador (no se puede pagar online)"
          />
        )}
      />
      <TextField
        label="Indicaciones para la IA"
        size="small"
        fullWidth
        multiline
        minRows={2}
        maxRows={4}
        placeholder="Opcional. Ej.: las dos botellas juntas, sin la tabla de madera, vista de frente"
        inputProps={{ maxLength: 400 }}
        disabled={busy}
        helperText="Se aplica al quitar fondo, generar con IA, recortar del circular y pegar. Escribila antes de usar el botón."
        {...field(register, 'aiPrompt')}
      />
      {!canCrop && (
        <Alert
          severity="info"
          sx={{ py: 0 }}
        >
          Para recortar, la tienda necesita un circular con archivo o una campaña con arte.
        </Alert>
      )}
    </Stack>
  );
}
