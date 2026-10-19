'use client';

/** "Para decidir": lo que el flyer muestra distinto a lo guardado, fila por fila. */
import type { ProductReviewItem } from '@/services/circular.service';
import {
  Box,
  Button,
  Chip,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { memo } from 'react';
import { REVIEW_KIND } from './constants';
import { showFields } from './utils';

const small = { fontSize: 12, color: 'text.secondary' } as const;

const DecisionRow = memo(function DecisionRow({
  it,
  onApply,
  onIgnore,
}: {
  it: ProductReviewItem;
  onApply: (id: string) => void;
  onIgnore: (id: string) => void;
}) {
  return (
    <TableRow hover>
      <TableCell>
        <Typography
          variant="body2"
          fontWeight={700}
        >
          {it.name}
        </Typography>
        {it.page > 0 && (
          <Typography
            variant="body2"
            sx={small}
          >
            pág. {it.page}
          </Typography>
        )}
      </TableCell>
      <TableCell>
        <Chip
          size="small"
          label={REVIEW_KIND[it.kind]}
        />
      </TableCell>
      <TableCell>
        <Typography variant="body2">{showFields(it.current)}</Typography>
      </TableCell>
      <TableCell>
        <Typography
          variant="body2"
          fontWeight={600}
        >
          {showFields(it.proposed)}
        </Typography>
        {it.evidence && (
          <Typography
            variant="body2"
            sx={small}
          >
            {it.evidence}
          </Typography>
        )}
      </TableCell>
      <TableCell align="right">{Math.round(it.confidence * 100)}%</TableCell>
      <TableCell
        align="right"
        sx={{ whiteSpace: 'nowrap' }}
      >
        <Stack
          direction="row"
          gap={0.75}
          justifyContent="flex-end"
        >
          <Button
            size="small"
            color="inherit"
            onClick={() => onIgnore(it._id)}
            sx={{ color: 'text.secondary' }}
          >
            Ignorar
          </Button>
          <Button
            size="small"
            variant="outlined"
            onClick={() => onApply(it._id)}
          >
            Aplicar
          </Button>
        </Stack>
      </TableCell>
    </TableRow>
  );
});

export default function ReviewDecisions({
  items,
  onApply,
  onIgnore,
}: {
  items: ProductReviewItem[];
  onApply: (id: string) => void;
  onIgnore: (id: string) => void;
}) {
  return (
    // En el teléfono la tabla se desliza de costado en vez de aplastar las columnas.
    <Box sx={{ overflowX: 'auto', mx: { xs: -2, md: -2.25 } }}>
      <Table
        size="small"
        sx={{ minWidth: 720 }}
      >
        <TableHead>
          <TableRow>
            <TableCell>Producto</TableCell>
            <TableCell>Qué</TableCell>
            <TableCell>Guardado</TableCell>
            <TableCell>El flyer dice</TableCell>
            <TableCell align="right">Confianza</TableCell>
            <TableCell align="right" />
          </TableRow>
        </TableHead>
        <TableBody>
          {items.map((it) => (
            <DecisionRow
              key={it._id}
              it={it}
              onApply={onApply}
              onIgnore={onIgnore}
            />
          ))}
        </TableBody>
      </Table>
    </Box>
  );
}
