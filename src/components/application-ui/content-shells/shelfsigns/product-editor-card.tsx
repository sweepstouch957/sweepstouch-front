'use client';

import AddRoundedIcon from '@mui/icons-material/AddRounded';
import AutoFixHighRoundedIcon from '@mui/icons-material/AutoFixHighRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  IconButton,
  MenuItem,
  Skeleton,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import React from 'react';
import type { ProductImageVersion } from '@/services/designs.service';
import { readAsDataURL } from './image';
import { MAX_PRODUCTS_PER_SIGN } from './parse';
import { clampCents, clampDollars, clampQty, computeSave, priceLabel } from './price';
import type { ShelfSignProduct } from './types';

/**
 * Editor de un cartón. La revisión humana es obligatoria por diseño: un precio
 * mal leído impreso en góndola es un problema con el cliente, así que todo lo
 * que extrajo la IA es editable y el precio muestra en vivo cómo va a salir.
 */

interface Props {
  product: ShelfSignProduct;
  index: number;
  color: string;
  onChange: (id: string, patch: Partial<ShelfSignProduct>) => void;
  onRemove: (id: string) => void;
  /** "Mejorar con IA" (Nano Banana). Ausente = no disponible para este cartón. */
  onEnhance?: (product: ShelfSignProduct) => void;
  enhancing?: boolean;
  /** Foto subida a mano: el padre la sube a Cloudinary y la guarda en la librería. */
  onPhotoFile?: (product: ShelfSignProduct, file: File) => void;
  /** Recortar a mano sobre el flyer. Ausente = todavía no hay flyer subido. */
  onCropFromFlyer?: (product: ShelfSignProduct) => void;
  /** La foto de este cartón se está recortando o subiendo. */
  photoLoading?: boolean;
  /** Fotos que la librería ya tiene de este producto (semanas anteriores). */
  versions?: ProductImageVersion[];
  /** Elegir una de esas fotos: se usa en el cartón y pasa a ser la default. */
  onPickVersion?: (product: ShelfSignProduct, url: string) => void;
}

/** De dónde salió cada versión, para que el diseñador sepa qué está eligiendo. */
const VERSION_LABEL: Record<string, string> = {
  designer: 'Subida por diseño',
  enhance: 'Mejorada con IA',
  imgly: 'Recorte automático',
};

const labelSx = {
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: 0.6,
  color: 'text.secondary',
  display: 'block',
  mb: 0.5,
} as const;

function ProductEditorCardBase({
  product: p,
  index,
  color,
  onChange,
  onRemove,
  onEnhance,
  enhancing = false,
  onPhotoFile,
  onCropFromFlyer,
  photoLoading = false,
  versions,
  onPickVersion,
}: Props): React.JSX.Element {
  const fileRef = React.useRef<HTMLInputElement>(null);

  const set = (patch: Partial<ShelfSignProduct>) => onChange(p.id, patch);

  const suggestedSave = computeSave(p);

  /* ── Productos del cartón ──
     El modelo guarda producto 1 en name/details, el 2 en name2/details2 y del 3
     al 5 en `extras`. Acá se ven como una sola lista: agregar, editar y quitar
     sin que el diseñador tenga que saber en qué campo cae cada uno. */
  const extras = p.extras ?? [];
  // El segundo slot se muestra en cuanto existe dato o el diseñador lo pide.
  const [showSecond, setShowSecond] = React.useState(Boolean(p.name2 || p.details2));
  const hasSecond = showSecond || !!p.name2 || !!p.details2 || extras.length > 0;

  const slots = [
    { name: p.name, details: p.details },
    ...(hasSecond ? [{ name: p.name2, details: p.details2 }] : []),
    ...extras,
  ];

  const setSlot = (i: number, patch: { name?: string; details?: string }) => {
    if (i === 0) {
      set({ ...(patch.name !== undefined ? { name: patch.name } : {}), ...(patch.details !== undefined ? { details: patch.details } : {}) });
      return;
    }
    if (i === 1) {
      set({ ...(patch.name !== undefined ? { name2: patch.name } : {}), ...(patch.details !== undefined ? { details2: patch.details } : {}) });
      return;
    }
    set({ extras: extras.map((e, k) => (k === i - 2 ? { ...e, ...patch } : e)) });
  };

  /** Quitar el 2 corre los demás un lugar: no puede quedar un hueco en el medio. */
  const removeSlot = (i: number) => {
    if (i === 1) {
      const [next, ...rest] = extras;
      set({ name2: next?.name || '', details2: next?.details || '', extras: rest });
      if (!next) setShowSecond(false);
      return;
    }
    set({ extras: extras.filter((_, k) => k !== i - 2) });
  };

  const addSlot = () => {
    if (slots.length >= MAX_PRODUCTS_PER_SIGN) return;
    if (!hasSecond) {
      setShowSecond(true);
      return;
    }
    set({ extras: [...extras, { name: '', details: '' }] });
  };

  const pickPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    // Vista previa inmediata desde el archivo local; el padre la reemplaza por
    // la URL de Cloudinary cuando termina de guardarla en la librería.
    set({ photo: await readAsDataURL(file), photoBox: null });
    onPhotoFile?.(p, file);
  };

  return (
    <Card variant="outlined">
      <CardContent>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          sx={{ mb: 1.5 }}
        >
          <Typography
            variant="subtitle2"
            fontWeight={800}
            sx={{ color }}
          >
            Cartón {index + 1}
          </Typography>
          <Tooltip title="Eliminar cartón">
            <IconButton
              size="small"
              color="error"
              onClick={() => onRemove(p.id)}
            >
              <DeleteOutlineRoundedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '1.2fr 1fr 1fr' },
            gap: 2,
          }}
        >
          {/* ── Productos del cartón (1 principal + hasta 4 alternativas) ── */}
          <Stack spacing={1.25}>
            {slots.map((slot, i) => (
              <Box
                key={i}
                sx={{
                  p: i === 0 ? 0 : 1.25,
                  borderRadius: 1.5,
                  ...(i === 0
                    ? {}
                    : { border: '1px dashed', borderColor: 'divider', bgcolor: 'action.hover' }),
                }}
              >
                <Stack
                  direction="row"
                  alignItems="center"
                  justifyContent="space-between"
                  sx={{ mb: 0.75 }}
                >
                  <Typography
                    variant="caption"
                    sx={{ ...labelSx, mb: 0 }}
                  >
                    {i === 0 ? 'Producto 1' : `Producto ${i + 1} — se imprime con "OR"`}
                  </Typography>
                  {i > 0 && (
                    <Tooltip title="Quitar este producto del cartón">
                      <IconButton
                        size="small"
                        onClick={() => removeSlot(i)}
                      >
                        <DeleteOutlineRoundedIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                </Stack>

                <Stack spacing={1}>
                  <TextField
                    label="Nombre"
                    size="small"
                    fullWidth
                    value={slot.name}
                    onChange={(e) => setSlot(i, { name: e.target.value })}
                  />
                  <TextField
                    label="Detalles"
                    size="small"
                    fullWidth
                    multiline
                    minRows={2}
                    value={slot.details}
                    onChange={(e) => setSlot(i, { details: e.target.value })}
                    helperText={i === 0 ? 'Una línea por detalle' : undefined}
                  />
                </Stack>
              </Box>
            ))}

            {/* Mix & match de verdad: el flyer a veces junta 4-5 referencias al
                mismo precio. Antes sólo entraban dos y el resto iba a mano en
                "detalles", que imprime con otra tipografía. */}
            <Button
              size="small"
              startIcon={<AddRoundedIcon fontSize="small" />}
              onClick={addSlot}
              disabled={slots.length >= MAX_PRODUCTS_PER_SIGN}
              sx={{ alignSelf: 'flex-start' }}
            >
              {slots.length >= MAX_PRODUCTS_PER_SIGN
                ? `Máximo ${MAX_PRODUCTS_PER_SIGN} productos`
                : 'Agregar producto'}
            </Button>
          </Stack>

          {/* ── Precio ── */}
          <Stack spacing={1.5}>
            <Box>
              <Typography
                variant="caption"
                sx={labelSx}
              >
                Precio — el formato se arma solo
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 0.75 }}>
                <TextField
                  label="Cant."
                  size="small"
                  type="number"
                  value={p.qty}
                  onChange={(e) => set({ qty: clampQty(e.target.value) })}
                  inputProps={{ min: 1 }}
                />
                <TextField
                  label="$"
                  size="small"
                  type="number"
                  value={p.dollars}
                  onChange={(e) => set({ dollars: clampDollars(e.target.value) })}
                  inputProps={{ min: 0 }}
                />
                <TextField
                  label="¢"
                  size="small"
                  type="number"
                  value={p.cents}
                  onChange={(e) => set({ cents: clampCents(e.target.value) })}
                  inputProps={{ min: 0, max: 99 }}
                />
                <TextField
                  label="Unidad"
                  size="small"
                  select
                  value={p.unit}
                  onChange={(e) => set({ unit: e.target.value as ShelfSignProduct['unit'] })}
                >
                  <MenuItem value="LB">LB</MenuItem>
                  <MenuItem value="EA">EA</MenuItem>
                  <MenuItem value="">—</MenuItem>
                </TextField>
              </Box>
            </Box>

            <Typography
              variant="body2"
              fontWeight={800}
              sx={{ color }}
            >
              Se imprimirá: {priceLabel(p)}
            </Typography>

            {/* Al tipear el regular price el ahorro sale solo (si está vacío):
                es la cuenta que el diseñador hacía a mano y el motivo por el que
                muchos cartones salían con la caja gris a medio llenar. */}
            <TextField
              label="Regular price"
              size="small"
              fullWidth
              value={p.regularPrice}
              onChange={(e) => {
                const regularPrice = e.target.value;
                const auto = p.save.trim() ? '' : computeSave({ ...p, regularPrice });
                set({ regularPrice, ...(auto ? { save: auto } : {}) });
              }}
              helperText={
                !p.regularPrice.trim() && !p.save.trim()
                  ? 'Sin dato la caja gris no se imprime'
                  : undefined
              }
            />
            <TextField
              label="Save"
              size="small"
              fullWidth
              value={p.save}
              onChange={(e) => set({ save: e.target.value })}
            />
            {/* El flyer no siempre imprime el ahorro, pero casi siempre imprime
                el regular price. Con eso el número sale solo — y si el diseñador
                corrige el regular a mano, la sugerencia se recalcula. */}
            {suggestedSave && suggestedSave !== p.save && (
              <Button
                size="small"
                variant="text"
                sx={{ alignSelf: 'flex-start', mt: -0.5 }}
                onClick={() => set({ save: suggestedSave })}
              >
                Calcular ahorro: {suggestedSave}
              </Button>
            )}
          </Stack>

          {/* ── Condiciones y foto ── */}
          <Stack spacing={1.5}>
            <TextField
              label="Condiciones (limit, club card…)"
              size="small"
              fullWidth
              multiline
              minRows={3}
              value={p.conditions}
              onChange={(e) => set({ conditions: e.target.value })}
            />

            <Box>
              <Typography
                variant="caption"
                sx={labelSx}
              >
                Foto
              </Typography>

              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                hidden
                onChange={pickPhoto}
              />

              {photoLoading && !p.photo ? (
                <Stack spacing={0.5}>
                  <Skeleton
                    variant="rounded"
                    width={90}
                    height={90}
                    animation="wave"
                  />
                  <Typography
                    variant="caption"
                    color="text.secondary"
                  >
                    Recortando y quitando fondo…
                  </Typography>
                </Stack>
              ) : p.photo ? (
                <Stack spacing={0.5}>
                  <Box
                    component="img"
                    src={p.photo}
                    alt=""
                    sx={{
                      opacity: photoLoading ? 0.45 : 1,
                      maxHeight: 90,
                      objectFit: 'contain',
                      alignSelf: 'flex-start',
                      borderRadius: 1,
                      border: '1px solid',
                      borderColor: 'divider',
                      bgcolor: 'background.paper',
                      p: 0.5,
                    }}
                  />
                  {photoLoading && (
                    <Typography
                      variant="caption"
                      color="text.secondary"
                    >
                      Subiendo a la librería…
                    </Typography>
                  )}
                  <Stack
                    direction="row"
                    spacing={1}
                  >
                    <Button
                      size="small"
                      color="error"
                      disabled={photoLoading}
                      onClick={() => set({ photo: null, photoBox: null })}
                    >
                      Quitar
                    </Button>
                    <Button
                      size="small"
                      onClick={() => fileRef.current?.click()}
                    >
                      Reemplazar
                    </Button>
                    {onCropFromFlyer && (
                      <Button
                        size="small"
                        disabled={photoLoading}
                        onClick={() => onCropFromFlyer(p)}
                      >
                        Recortar del flyer
                      </Button>
                    )}
                  </Stack>
                  {/* Paso caro y con riesgo de que el modelo redibuje logos: por eso
                      es manual, por cartón, y el resultado vuelve a revisión. */}
                  {onEnhance && (
                    <Tooltip title="Quita gráficos encima del producto y lo deja en fondo blanco. Usa créditos: revisá que no haya cambiado el empaque.">
                      <Button
                        size="small"
                        variant="outlined"
                        disabled={enhancing}
                        onClick={() => onEnhance(p)}
                        startIcon={
                          enhancing ? (
                            <CircularProgress
                              size={14}
                              color="inherit"
                            />
                          ) : (
                            <AutoFixHighRoundedIcon fontSize="small" />
                          )
                        }
                        sx={{ alignSelf: 'flex-start' }}
                      >
                        {enhancing ? 'Mejorando…' : 'Mejorar con IA'}
                      </Button>
                    </Tooltip>
                  )}
                </Stack>
              ) : (
                <Stack
                  spacing={0.5}
                  alignItems="flex-start"
                >
                  <Typography
                    variant="caption"
                    color="text.secondary"
                  >
                    Sin foto.
                  </Typography>
                  <Stack direction="row"
spacing={1}>
                    <Button
                      size="small"
                      onClick={() => fileRef.current?.click()}
                    >
                      Subir manual
                    </Button>
                    {onCropFromFlyer && (
                      <Button
                        size="small"
                        variant="outlined"
                        disabled={photoLoading}
                        onClick={() => onCropFromFlyer(p)}
                      >
                        Recortar del flyer
                      </Button>
                    )}
                  </Stack>
                </Stack>
              )}

              {/* Versiones guardadas del mismo producto. La foto de las carnes
                  de Navidad no se pierde cuando en enero se recorta otra: acá
                  se vuelve a ella con un click, sin gastar créditos. */}
              {versions && versions.length > 1 && onPickVersion && (
                <Box sx={{ mt: 1 }}>
                  <Typography
                    variant="caption"
                    sx={labelSx}
                  >
                    Versiones guardadas ({versions.length})
                  </Typography>
                  <Stack
                    direction="row"
                    spacing={0.75}
                    sx={{ overflowX: 'auto', pb: 0.5 }}
                  >
                    {versions.map((v) => {
                      const active = v.url === p.photo;
                      return (
                        <Tooltip
                          key={v.url}
                          title={VERSION_LABEL[v.source] || v.source}
                        >
                          <Box
                            component="img"
                            src={v.url}
                            alt=""
                            onClick={() => !active && onPickVersion(p, v.url)}
                            sx={{
                              width: 52,
                              height: 52,
                              flex: '0 0 auto',
                              objectFit: 'contain',
                              cursor: active ? 'default' : 'pointer',
                              borderRadius: 1,
                              border: '2px solid',
                              borderColor: active ? color : 'divider',
                              bgcolor: 'background.paper',
                              p: 0.25,
                            }}
                          />
                        </Tooltip>
                      );
                    })}
                  </Stack>
                </Box>
              )}
            </Box>
          </Stack>
        </Box>
      </CardContent>
    </Card>
  );
}

/** Con 30-40 cartones abiertos, sin memo cada tecla re-renderiza la lista entera. */
export const ProductEditorCard = React.memo(ProductEditorCardBase);

export default ProductEditorCard;
