'use client';

/** Celda "Producto": TODO editable en la misma fila (nombre, marca, tamaño, letra chica, caja,
 *  límite, mostrador, departamento) con un tooltip en cada cosa. Lo que corrige la encargada lo
 *  aprenden los agentes con su nombre. Origen y fecha de entrada son informativos. */
import type { StoreProduct } from '@/services/circular';
import { Chip, Stack, TableCell, TextField, Tooltip } from '@mui/material';
import { cell, fmtDate } from '../shared';
import { miniChip, sourceTag, type ProductPatch } from './constants';

/** Campo de texto que guarda al salir si cambió. */
export function BlurField({
  value,
  placeholder,
  ariaLabel,
  onSave,
  allowEmpty = true,
  bold = false,
  fullWidth = false,
  inputStyle,
  tip,
  width,
}: {
  value: string;
  placeholder?: string;
  ariaLabel: string;
  onSave: (v: string) => void;
  allowEmpty?: boolean;
  bold?: boolean;
  fullWidth?: boolean;
  /** Estilo del texto (precio grande, tachado…). */
  inputStyle?: React.CSSProperties;
  /** Qué es este campo, para quien nunca usó el panel. */
  tip?: string;
  width?: number;
}) {
  const field = (
    <TextField
      // Si el servidor trae otro valor (relectura, otra persona), el campo lo toma: sin
      // la key se quedaba mostrando lo viejo y parecía que no había guardado.
      key={value}
      size="small"
      variant="standard"
      defaultValue={value}
      placeholder={placeholder}
      fullWidth={bold || fullWidth}
      multiline={bold}
      inputProps={{
        'aria-label': ariaLabel,
        style: { ...(bold ? { fontWeight: 600 } : { fontSize: 12 }), ...inputStyle },
      }}
      // Antes era una raya casi invisible y nadie sabía que se podía escribir ahí.
      sx={{
        ...(width ? { width } : {}),
        '& .MuiInputBase-root': {
          px: 0.5,
          mx: -0.5,
          borderRadius: 1,
          transition: 'background-color 120ms ease-out, box-shadow 120ms ease-out',
          '&:hover': { bgcolor: 'action.hover', cursor: 'text' },
          '&.Mui-focused': {
            bgcolor: 'background.paper',
            boxShadow: (t) => `0 0 0 2px ${t.palette.primary.main}`,
          },
          '&::before, &::after': { display: 'none' },
        },
      }}
      onKeyDown={(e) => {
        const el = e.target as HTMLInputElement;
        if (e.key === 'Escape') {
          el.value = value;
          el.blur();
        } else if (e.key === 'Enter' && !(bold && e.shiftKey)) {
          e.preventDefault();
          el.blur();
        }
      }}
      onBlur={(e) => {
        const v = e.target.value.trim();
        if ((allowEmpty || v) && v !== value) onSave(v);
        else if (!allowEmpty && !v) e.target.value = value;
      }}
    />
  );
  return (
    <Tooltip
      placement="top-start"
      enterDelay={400}
      title={`${tip ? `${tip} · ` : ''}Clic para editar · Enter guarda · Esc deshace`}
    >
      {field}
    </Tooltip>
  );
}

/** "12 lb" → { packQty: 12, packUnit: 'lb' }; vacío o 1 = sin caja. */
const parsePack = (v: string) => {
  const m = v.match(/^(\d+(?:\.\d+)?)\s*(.*)$/);
  const n = m ? Number(m[1]) : 0;
  return m && n > 1 ? { packQty: n, packUnit: m[2].trim() } : { packQty: null, packUnit: '' };
};
const parseLimit = (v: string) => {
  const n = parseInt(v.replace(/\D/g, ''), 10);
  return n > 0 ? n : null;
};

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
      {/* Marca y tamaño: la IA los lee mal seguido. */}
      <Stack
        direction="row"
        gap={1}
        sx={{ mt: 0.25 }}
      >
        <BlurField
          value={p.brand ?? ''}
          placeholder="marca"
          ariaLabel="Marca"
          tip="Marca tal como sale en el flyer (Goya, Mazola…)"
          onSave={(brand) => onPatch(p._id, { brand })}
        />
        <BlurField
          value={p.size ?? ''}
          placeholder={p.unit ? `por ${p.unit}` : 'tamaño'}
          ariaLabel="Tamaño"
          tip="Tamaño o peso del paquete (16 oz, 1 gal, 5 lb)"
          onSave={(size) => onPatch(p._id, { size })}
        />
      </Stack>
      {/* Letra chica del flyer, editable: lo que el cliente reclama en la caja si no sale
          en su lista ("15 lb box only", "at the counter", "limit 1"). */}
      <Stack
        direction="row"
        gap={1}
        flexWrap="wrap"
        alignItems="center"
        sx={{ mt: 0.25 }}
      >
        <BlurField
          value={p.offerCondition ?? ''}
          placeholder="letra chica"
          ariaLabel="Letra chica"
          tip='Condición de la oferta que imprime el flyer: "2 for $5", "with $20 purchase", "limit 1"'
          onSave={(offerCondition) => onPatch(p._id, { offerCondition })}
        />
        <BlurField
          value={p.packQty && p.packQty > 1 ? `${p.packQty} ${p.packUnit || ''}`.trim() : ''}
          placeholder="caja"
          ariaLabel="Sólo por caja"
          width={72}
          tip='Sólo se vende por caja: escribe cuánto trae ("15 lb", "12 un"). Vacío = suelto'
          onSave={(v) => onPatch(p._id, parsePack(v))}
        />
        <BlurField
          value={p.maxPerCustomer ? String(p.maxPerCustomer) : ''}
          placeholder="límite"
          ariaLabel="Máximo por cliente"
          width={56}
          tip="Máximo por cliente (limit). Vacío = sin límite"
          onSave={(v) => onPatch(p._id, { maxPerCustomer: parseLimit(v) })}
        />
        <Tooltip
          enterDelay={400}
          title={
            p.counterOnly
              ? 'Se pide en el mostrador (deli, carnicería). Clic para quitarlo'
              : '¿Sólo en el mostrador (deli, carnicería)? Clic para marcarlo'
          }
        >
          <Chip
            size="small"
            clickable
            color={p.counterOnly ? 'warning' : 'default'}
            variant={p.counterOnly ? 'filled' : 'outlined'}
            label="Mostrador"
            onClick={() => onPatch(p._id, { counterOnly: !p.counterOnly })}
            sx={miniChip}
          />
        </Tooltip>
      </Stack>
      <Stack
        direction="row"
        gap={0.5}
        flexWrap="wrap"
        alignItems="center"
        sx={{ mt: 0.25 }}
      >
        {/* Departamento con las palabras de la tienda. */}
        <BlurField
          value={p.department ?? ''}
          placeholder="departamento"
          ariaLabel="Departamento"
          width={110}
          tip="Sección del flyer con las palabras de la tienda (Meat, Produce, Deli…)"
          onSave={(department) => onPatch(p._id, { department })}
        />
        {/* Tag de origen: flyer de campaña / circular / manual. */}
        {source && (
          <Tooltip title="De dónde salió: flyer de campaña, circular semanal o agregado a mano">
            <Chip
              size="small"
              variant="outlined"
              color={source.color}
              label={source.label}
              sx={miniChip}
            />
          </Tooltip>
        )}
        {/* Producto de un flyer que todavía no arranca: rige desde esa fecha. */}
        {p.effectiveFrom && (
          <Tooltip
            title={`Todavía no rige: los agentes lo publican solos en su fecha${
              p.effectiveCircularTitle ? ` (${p.effectiveCircularTitle})` : ''
            }`}
          >
            <Chip
              size="small"
              color="info"
              variant="outlined"
              label={
                p.effectiveKind === 'price'
                  ? `${p.effectivePrice || 'Nuevo precio'} desde el ${fmtDate(p.effectiveFrom)}`
                  : `Sale el ${fmtDate(p.effectiveFrom)}`
              }
              sx={miniChip}
            />
          </Tooltip>
        )}
      </Stack>
    </TableCell>
  );
}
