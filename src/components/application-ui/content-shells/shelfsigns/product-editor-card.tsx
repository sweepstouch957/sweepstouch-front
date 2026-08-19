'use client';

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
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import React from 'react';
import { readAsDataURL } from './image';
import { clampCents, clampDollars, clampQty, priceLabel } from './price';
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
}

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
}: Props): React.JSX.Element {
  const fileRef = React.useRef<HTMLInputElement>(null);

  const set = (patch: Partial<ShelfSignProduct>) => onChange(p.id, patch);

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
          {/* ── Nombres y detalles ── */}
          <Stack spacing={1.5}>
            <TextField
              label="Producto 1"
              size="small"
              fullWidth
              value={p.name}
              onChange={(e) => set({ name: e.target.value })}
            />
            <TextField
              label="Detalles producto 1"
              size="small"
              fullWidth
              multiline
              minRows={2}
              value={p.details}
              onChange={(e) => set({ details: e.target.value })}
              helperText="Una línea por detalle"
            />
            <TextField
              label="Producto 2 (el OR se agrega solo)"
              size="small"
              fullWidth
              value={p.name2}
              onChange={(e) => set({ name2: e.target.value })}
            />
            <TextField
              label="Detalles producto 2"
              size="small"
              fullWidth
              multiline
              minRows={2}
              value={p.details2}
              onChange={(e) => set({ details2: e.target.value })}
              disabled={!p.name2}
            />
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

            <TextField
              label="Regular price"
              size="small"
              fullWidth
              value={p.regularPrice}
              onChange={(e) => set({ regularPrice: e.target.value })}
            />
            <TextField
              label="Save"
              size="small"
              fullWidth
              value={p.save}
              onChange={(e) => set({ save: e.target.value })}
            />
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

              {p.photo ? (
                <Stack spacing={0.5}>
                  <Box
                    component="img"
                    src={p.photo}
                    alt=""
                    sx={{
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
                  <Stack
                    direction="row"
                    spacing={1}
                  >
                    <Button
                      size="small"
                      color="error"
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
                  <Button
                    size="small"
                    onClick={() => fileRef.current?.click()}
                  >
                    Subir manual
                  </Button>
                </Stack>
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
