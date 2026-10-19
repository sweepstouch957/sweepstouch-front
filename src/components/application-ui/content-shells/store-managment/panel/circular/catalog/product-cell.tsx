'use client';

/** Celda "Producto": nombre, marca y tamaño editables + chips de letra chica, departamento,
 *  origen y fecha de entrada. */
import type { StoreProduct } from '@/services/circular.service';
import { Chip, Stack, TableCell, TextField } from '@mui/material';
import { cell, fmtDate } from '../shared';
import { miniChip, sourceTag, type ProductPatch } from './constants';

/** Campo de texto que guarda al salir si cambió. */
function BlurField({
  value,
  placeholder,
  ariaLabel,
  onSave,
  allowEmpty = true,
  bold = false,
}: {
  value: string;
  placeholder?: string;
  ariaLabel: string;
  onSave: (v: string) => void;
  allowEmpty?: boolean;
  bold?: boolean;
}) {
  return (
    <TextField
      size="small"
      variant="standard"
      defaultValue={value}
      placeholder={placeholder}
      fullWidth={bold}
      multiline={bold}
      inputProps={{
        'aria-label': ariaLabel,
        style: bold ? { fontWeight: 600 } : { fontSize: 12 },
      }}
      onBlur={(e) => {
        const v = e.target.value.trim();
        if ((allowEmpty || v) && v !== value) onSave(v);
      }}
    />
  );
}

export function ProductCell({
  p,
  onPatch,
}: {
  p: StoreProduct;
  onPatch: (id: string, body: ProductPatch) => void;
}) {
  const source = p.source ? sourceTag(p.source) : null;
  return (
    <TableCell
      sx={cell}
      data-label="Producto"
    >
      {/* Todo editable: la encargada corrige lo que la IA leyó mal */}
      <BlurField
        bold
        value={p.name}
        ariaLabel="Nombre del producto"
        allowEmpty={false}
        onSave={(name) => onPatch(p._id, { name })}
      />
      {/* Letra chica del flyer: lo que el cliente reclama en la caja si no sale
          en su lista ("15 lb box only", "at the counter", "limit 1"). */}
      {(p.packQty || p.counterOnly || p.maxPerCustomer) && (
        <Stack
          direction="row"
          gap={0.5}
          flexWrap="wrap"
          sx={{ mt: 0.5 }}
        >
          {!!p.packQty && p.packQty > 1 && (
            <Chip
              size="small"
              color="warning"
              variant="outlined"
              label={`Caja ${p.packQty} ${p.packUnit || ''}`.trim()}
              sx={miniChip}
            />
          )}
          {p.counterOnly && (
            <Chip
              size="small"
              color="warning"
              variant="outlined"
              label="Mostrador"
              sx={miniChip}
            />
          )}
          {!!p.maxPerCustomer && (
            <Chip
              size="small"
              variant="outlined"
              label={`Máx ${p.maxPerCustomer}`}
              sx={miniChip}
            />
          )}
        </Stack>
      )}
      {/* Departamento del circular con las palabras de la tienda. */}
      {p.department && (
        <Chip
          size="small"
          variant="outlined"
          label={p.department}
          sx={{ ...miniChip, mr: 0.5 }}
        />
      )}
      {/* Tag de origen: flyer de campaña / circular / manual. */}
      {source && (
        <Chip
          size="small"
          variant="outlined"
          color={source.color}
          label={source.label}
          sx={{ ...miniChip, mr: 0.5 }}
        />
      )}
      {/* Producto de un flyer que todavía no arrancó: el catálogo ya lo tiene,
          pero recién rige desde esa fecha. Sin este aviso parecía vigente hoy. */}
      {p.effectiveFrom && (
        <Chip
          size="small"
          color="info"
          variant="outlined"
          label={
            p.effectiveKind === 'price'
              ? `${p.effectivePrice || 'Nuevo precio'} desde el ${fmtDate(p.effectiveFrom)}`
              : `Sale el ${fmtDate(p.effectiveFrom)}`
          }
          title={p.effectiveCircularTitle || undefined}
          sx={{ ...miniChip, mt: 0.5 }}
        />
      )}
      {/* Marca y tamaño: la IA los lee mal seguido y antes no había forma de
          corregirlos desde el panel. */}
      <Stack
        direction="row"
        gap={1}
        sx={{ mt: 0.25 }}
      >
        <BlurField
          value={p.brand ?? ''}
          placeholder="marca"
          ariaLabel="Marca"
          onSave={(brand) => onPatch(p._id, { brand })}
        />
        <BlurField
          value={p.size ?? ''}
          placeholder={p.unit ? `por ${p.unit}` : 'tamaño'}
          ariaLabel="Tamaño"
          onSave={(size) => onPatch(p._id, { size })}
        />
      </Stack>
    </TableCell>
  );
}
