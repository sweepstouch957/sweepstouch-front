'use client';

/** Tabla del catálogo con arrastre para ordenar. En contenedores angostos cada fila pasa a
 *  ser una tarjeta (rótulo arriba de cada dato); en tablet van 2 tarjetas por fila. */
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
    // Anchos sólo en modo tabla: en modo grilla ganaban (más específicos) al width:auto
    // y dejaban cada celda al 12% de su columna → texto en vertical en tablet/mobile.
    ...(width > 900
      ? {
          '& tr > :nth-child(1)': { width: 116 },
          '& tr > :nth-child(2)': { width: '23%' },
          '& tr > :nth-child(3), & tr > :nth-child(4)': { width: '12%' },
          '& tr > :nth-child(5)': { width: '14%' },
          '& tr > :nth-child(7), & tr > :nth-child(8)': { width: 66 },
          '& tr > :nth-child(9)': { width: 40 },
        }
      : {
          '& thead': { display: 'none' },
          '&': { display: 'block' },
          // Tablet (701–900): 2 productos por fila. Mobile / tablet chica: 1.
          '& tbody':
            width === 900
              ? { display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 1.5, p: 1.5 }
              : { display: 'block' },
          '& tbody tr:has(td[colspan])': { gridColumn: '1 / -1' },
          // Cada producto = tarjeta: foto + nombre arriba, campos abajo, papelera en la esquina.
          '& tbody tr:not([data-rfd-placeholder-context-id])': {
            display: 'grid',
            position: 'relative',
            columnGap: 1,
            rowGap: 0.5,
            py: 1,
            ...(width <= 420
              ? {
                  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                  gridTemplateAreas: '"img prod" "of reg" "sav cat" "prom vis"',
                }
              : {
                  gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                  gridTemplateAreas: '"img prod prod" "of reg sav" "cat prom vis"',
                }),
            ...(width === 900
              ? { border: '1px solid', borderColor: 'divider', borderRadius: 2, bgcolor: 'background.paper' }
              : { borderBottom: '1px solid', borderColor: 'divider' }),
          },
          '& tbody tr > td': {
            display: 'block',
            width: 'auto',
            minWidth: 0,
            borderBottom: 0,
          },
          ...Object.fromEntries(
            ['img', 'prod', 'of', 'reg', 'sav', 'cat', 'prom', 'vis'].map((area, i) => [
              `& tbody tr > td:nth-of-type(${i + 1}):not([colspan])`,
              { gridArea: area },
            ])
          ),
          '& tbody tr > td:nth-of-type(2)': { pr: 5 }, // aire para la papelera
          '& tbody tr > td:nth-of-type(9)': { position: 'absolute', top: 4, right: 4, p: 0 },
          // En 2 por fila el arrastre (lista vertical) no funciona: se ordena en pantalla grande.
          ...(width === 900 ? { '& [aria-label^="Mover "]': { display: 'none' } } : {}),
          '& tbody td[data-label]::before': {
            content: 'attr(data-label)',
            display: 'block',
            mb: 0.5,
            fontSize: 11,
            fontWeight: 600,
            color: 'text.secondary',
          },
          '& tbody td[colspan]': { gridColumn: '1 / -1' },
        }),
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
                    dragDisabled={dragDisabled || width === 900}
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
