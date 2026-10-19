'use client';

/** Tabla del catálogo con arrastre para ordenar. En contenedores angostos cada fila pasa a
 *  ser una grilla de 2–3 columnas con el rótulo arriba de cada dato. */
import type { StoreProduct } from '@/services/circular.service';
import { DragDropContext, Droppable, type DropResult } from '@hello-pangea/dnd';
import {
  Box,
  Pagination,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
  type SxProps,
  type Theme,
} from '@mui/material';
import { EmptyBlock } from '../../../panel-kit';
import { cell } from '../shared';
import { CatalogRow, type CatalogRowProps } from './catalog-row';
import { DRAG_INSTRUCTIONS } from './constants';
import { useWidthBucket } from './use-width-bucket';
import { isGeneratingImage } from './utils';

type RowHandlers = Pick<
  CatalogRowProps,
  | 'categoryOptions'
  | 'onActivate'
  | 'onPatch'
  | 'onPatchPending'
  | 'onCategory'
  | 'onEdit'
  | 'onPreviewImage'
  | 'onDelete'
>;

const COLUMNS: { label: string; center?: boolean }[] = [
  { label: 'Imagen' },
  { label: 'Producto' },
  { label: 'Precio oferta' },
  { label: 'Precio regular' },
  { label: 'Ahorro' },
  { label: 'Categoría' },
  { label: 'En oferta', center: true },
  { label: 'Visible', center: true },
  { label: '', center: true }, // eliminar
];

function tableSx(width: number): SxProps<Theme> {
  return {
    width: '100%',
    tableLayout: 'fixed',
    '& .MuiTableCell-root': {
      whiteSpace: 'normal',
      overflowWrap: 'anywhere',
      verticalAlign: 'middle',
      px: 1,
    },
    '& .MuiInputBase-root': { minWidth: 0, lineHeight: 1.5 },
    '& textarea': { overflowWrap: 'anywhere' },
    '& .MuiSelect-select': {
      whiteSpace: 'normal',
      overflowWrap: 'anywhere',
      textOverflow: 'clip',
    },
    '& tr > :nth-child(1)': { width: 116 },
    '& tr > :nth-child(2)': { width: '23%' },
    '& tr > :nth-child(3), & tr > :nth-child(4)': { width: '12%' },
    '& tr > :nth-child(5)': { width: '14%' },
    '& tr > :nth-child(7), & tr > :nth-child(8)': { width: 66 },
    '& tr > :nth-child(9)': { width: 40 },
    ...(width <= 900
      ? {
          '& thead': { display: 'none' },
          '&, & tbody': { display: 'block' },
          '& tbody tr:not([data-rfd-placeholder-context-id])': {
            display: 'grid',
            gridTemplateColumns: `repeat(${width <= 420 ? 2 : 3}, minmax(0, 1fr))`,
            borderBottom: '1px solid',
            borderColor: 'divider',
            py: 1,
          },
          '& tbody tr > td': {
            display: 'block',
            width: 'auto',
            minWidth: 0,
            borderBottom: 0,
          },
          '& tbody td:nth-of-type(2)': {
            gridColumn: width <= 420 ? 'auto' : 'span 2',
          },
          '& tbody td[data-label]::before': {
            content: 'attr(data-label)',
            display: 'block',
            mb: 0.5,
            fontSize: 11,
            fontWeight: 600,
            color: 'text.secondary',
          },
          '& tbody td[colspan]': { gridColumn: '1 / -1' },
        }
      : {}),
  };
}

export function CatalogTable({
  storeSlug,
  items,
  cleaning,
  dragDisabled,
  onDragEnd,
  empty,
  page,
  pages,
  total,
  fetching,
  onPage,
  ...handlers
}: RowHandlers & {
  storeSlug: string;
  items: StoreProduct[];
  /** Limpieza de imágenes en curso: las filas con recorte crudo muestran "Generando…". */
  cleaning: boolean;
  dragDisabled: boolean;
  onDragEnd: (r: DropResult) => void;
  /** Qué decir cuando la página viene vacía (sin productos o sin coincidencias). */
  empty: { title: string; hint: string };
  page: number;
  pages: number;
  total: number;
  fetching: boolean;
  onPage: (page: number) => void;
}) {
  const { ref, width } = useWidthBucket<HTMLDivElement>();
  return (
    <Box
      ref={ref}
      sx={{ minWidth: 0, width: '100%' }}
    >
      <DragDropContext
        onDragEnd={onDragEnd}
        dragHandleUsageInstructions={DRAG_INSTRUCTIONS}
      >
        <Table
          size="small"
          sx={tableSx(width)}
        >
          <TableHead>
            <TableRow>
              {COLUMNS.map((c, i) => (
                <TableCell
                  key={i}
                  sx={cell}
                  align={c.center ? 'center' : undefined}
                >
                  {c.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <Droppable droppableId={`catalog-${storeSlug}`}>
            {(dropProvided) => (
              <TableBody
                ref={dropProvided.innerRef}
                {...dropProvided.droppableProps}
              >
                {items.map((p, index) => (
                  <CatalogRow
                    key={p._id}
                    p={p}
                    index={index}
                    generating={isGeneratingImage(p, cleaning)}
                    dragDisabled={dragDisabled}
                    {...handlers}
                  />
                ))}
                {dropProvided.placeholder}
                {!items.length && (
                  <TableRow>
                    <TableCell
                      colSpan={COLUMNS.length}
                      sx={{ p: 0, borderBottom: 0 }}
                    >
                      <EmptyBlock
                        title={empty.title}
                        hint={empty.hint}
                      />
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            )}
          </Droppable>
        </Table>
      </DragDropContext>
      {pages > 1 && (
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          gap={2}
          flexWrap="wrap"
          sx={{ px: 2.25, py: 1.5 }}
        >
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ fontVariantNumeric: 'tabular-nums' }}
          >
            {total} productos · página {page} de {pages}
            {fetching ? ' · cargando…' : ''}
          </Typography>
          <Pagination
            count={pages}
            page={page}
            onChange={(_e, p) => onPage(p)}
            size="small"
            siblingCount={1}
          />
        </Stack>
      )}
    </Box>
  );
}
