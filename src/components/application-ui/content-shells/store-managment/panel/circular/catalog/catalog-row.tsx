'use client';

import type { StoreProduct } from '@/services/circular.service';
import { cloudinaryThumb } from '@/utils/cloudinary';
import { Draggable } from '@hello-pangea/dnd';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import DragIndicatorRoundedIcon from '@mui/icons-material/DragIndicatorRounded';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import {
  Autocomplete,
  Box,
  CircularProgress,
  IconButton,
  Stack,
  Switch,
  TableCell,
  TableRow,
  TextField,
  Tooltip,
} from '@mui/material';
import { memo } from 'react';
import { cell } from '../shared';
import type { PendingPatch, ProductPatch } from './constants';
import { PriceCell } from './price-cell';
import { ProductCell } from './product-cell';

export type CatalogRowProps = {
  p: StoreProduct;
  index: number;
  generating: boolean;
  dragDisabled: boolean;
  categoryOptions: string[];
  onActivate: (p: StoreProduct) => void;
  onPatch: (id: string, body: ProductPatch) => void;
  /** Precio que espera fecha (pending): oferta / regular / ahorro del flyer que viene. */
  onPatchPending: (id: string, body: PendingPatch) => void;
  onCategory: (id: string, category: string) => void;
  onEdit: (p: StoreProduct) => void;
  onPreviewImage: (p: StoreProduct) => void;
  onDelete: (p: StoreProduct) => void;
};

/** Miniatura clicable (abre la imagen en grande) o spinner mientras la IA la genera. */
function Thumb({
  p,
  generating,
  onPreview,
}: {
  p: StoreProduct;
  generating: boolean;
  onPreview: () => void;
}) {
  const has = !!p.imageUrl;
  return (
    <Box
      component={has ? 'button' : 'div'}
      type={has ? 'button' : undefined}
      aria-label={has ? `Ver imagen de ${p.name} en grande` : undefined}
      onClick={has ? onPreview : undefined}
      sx={{
        width: 44,
        height: 44,
        borderRadius: 1.5,
        flexShrink: 0,
        p: 0,
        border: '1px solid',
        borderColor: 'divider',
        display: 'grid',
        placeItems: 'center',
        overflow: 'hidden',
        bgcolor: 'background.default',
        fontSize: 20,
        cursor: has ? 'zoom-in' : 'default',
        '&:hover': has ? { borderColor: 'primary.main' } : undefined,
      }}
    >
      {generating ? (
        <Tooltip title="Generando imagen con IA… el recorte con precio se reemplaza solo">
          <CircularProgress
            size={18}
            thickness={5}
            aria-label="Generando imagen"
          />
        </Tooltip>
      ) : has ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={cloudinaryThumb(p.imageUrl as string, 88, 88, 'fit')}
          alt=""
          loading="lazy"
          decoding="async"
          width={44}
          height={44}
          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
        />
      ) : (
        <span>🛒</span>
      )}
    </Box>
  );
}

/** Una fila del catálogo. memo: al editar un producto sólo se re-renderiza su fila, no las
 *  cientos restantes (cada una tiene un Autocomplete de MUI, que es caro). */
export const CatalogRow = memo(function CatalogRow({
  p,
  index,
  generating,
  dragDisabled,
  categoryOptions,
  onActivate,
  onPatch,
  onPatchPending,
  onCategory,
  onEdit,
  onPreviewImage,
  onDelete,
}: CatalogRowProps) {
  const saveCategory = (raw: string) => {
    const next = raw.trim().toLowerCase();
    if (next && next !== p.category) onCategory(p._id, next);
  };
  return (
    <Draggable
      draggableId={p._id}
      index={index}
      isDragDisabled={dragDisabled}
      disableInteractiveElementBlocking
    >
      {(dragProvided, snapshot) => (
        <TableRow
          ref={dragProvided.innerRef}
          {...dragProvided.draggableProps}
          hover
          onMouseEnter={() => onActivate(p)}
          onFocusCapture={() => onActivate(p)}
          sx={{
            // Fila "activa" para Ctrl+V: resaltada por CSS, sin estado (antes cada movimiento
            // del mouse re-renderizaba la tabla entera).
            '&:hover, &:focus-within': {
              boxShadow: (t) => `inset 3px 0 0 ${t.palette.primary.main}`,
            },
            ...(snapshot.isDragging
              ? {
                  display: 'table',
                  tableLayout: 'fixed',
                  bgcolor: 'background.paper',
                  boxShadow: 6,
                }
              : {}),
          }}
        >
          <TableCell sx={cell}>
            {/* Miniatura + acciones: arrastrar, ver en grande y editar */}
            <Stack
              direction="row"
              alignItems="center"
              flexWrap="wrap"
              gap={0.5}
            >
              <Tooltip
                title={dragDisabled ? 'Guardando orden…' : 'Arrastrar para cambiar el orden de las listas'}
              >
                <IconButton
                  {...dragProvided.dragHandleProps}
                  size="small"
                  aria-label={`Mover ${p.name}`}
                  sx={{ cursor: snapshot.isDragging ? 'grabbing' : 'grab', p: 0.25 }}
                >
                  <DragIndicatorRoundedIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Thumb
                p={p}
                generating={generating}
                onPreview={() => onPreviewImage(p)}
              />
              {/* Todo lo de imagen (subir, pegar, recortar, IA) vive en el modal de editar */}
              <Tooltip title="Editar producto e imagen (subir, pegar, recortar del circular, quitar fondo, generar con IA)">
                <IconButton
                  size="small"
                  aria-label={`Editar ${p.name}`}
                  onClick={() => onEdit(p)}
                >
                  <EditOutlinedIcon sx={{ fontSize: 18 }} />
                </IconButton>
              </Tooltip>
            </Stack>
          </TableCell>
          <ProductCell
            p={p}
            onPatch={onPatch}
          />
          <PriceCell
            p={p}
            field="price"
            label="Precio oferta"
            onPatch={onPatch}
            onPatchPending={onPatchPending}
          />
          <PriceCell
            p={p}
            field="originalPrice"
            label="Precio regular"
            onPatch={onPatch}
            onPatchPending={onPatchPending}
          />
          <PriceCell
            p={p}
            field="savings"
            label="Ahorro"
            onPatch={onPatch}
            onPatchPending={onPatchPending}
          />
          <TableCell
            sx={cell}
            data-label="Categoría"
          >
            <Autocomplete
              freeSolo
              size="small"
              options={categoryOptions}
              value={p.category || 'other'}
              onChange={(_, v) => saveCategory(String(v || ''))}
              renderInput={(params) => (
                <TextField
                  {...params}
                  variant="standard"
                  placeholder="categoría"
                  // Escribir una nueva y salir del campo también la guarda.
                  onBlur={(e) => saveCategory(e.target.value)}
                />
              )}
            />
          </TableCell>
          <TableCell
            sx={cell}
            align="center"
            data-label="En oferta"
          >
            <Switch
              size="small"
              checked={!!p.onPromotion}
              inputProps={{ 'aria-label': `En oferta: ${p.name}` }}
              onChange={(e) => onPatch(p._id, { onPromotion: e.target.checked })}
            />
          </TableCell>
          <TableCell
            sx={cell}
            align="center"
            data-label="Visible"
          >
            <Switch
              size="small"
              checked={p.visibleInRcs !== false}
              inputProps={{ 'aria-label': `Visible: ${p.name}` }}
              onChange={(e) => onPatch(p._id, { visibleInRcs: e.target.checked })}
            />
          </TableCell>
          <TableCell
            sx={cell}
            align="center"
          >
            <Tooltip title="Eliminar del catálogo">
              <IconButton
                size="small"
                aria-label={`Eliminar ${p.name}`}
                onClick={() => onDelete(p)}
              >
                <DeleteOutlineRoundedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </TableCell>
        </TableRow>
      )}
    </Draggable>
  );
});
