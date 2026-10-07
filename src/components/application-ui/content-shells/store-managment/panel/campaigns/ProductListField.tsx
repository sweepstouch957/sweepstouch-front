'use client';

/**
 * Lista de productos en texto al agendar una campaña (Orden 5, parte 2). Es opcional: si se
 * pega, circular-service la toma como verdad del texto y el arte sólo aporta las fotos. Debajo
 * del campo, una vista previa de lo que se leyó (nombre, marca, tamaño, precio, regular,
 * mostrador) para corregir ANTES de confirmar.
 */
import { circularService } from '@/services/circular.service';
import {
  Box,
  Chip,
  Collapse,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useDeferredValue, useState } from 'react';

export default function ProductListField({
  value,
  onChange,
  storeSlug,
}: {
  value: string;
  onChange: (v: string) => void;
  storeSlug?: string;
}) {
  const deferred = useDeferredValue(value);
  const [open, setOpen] = useState(false);
  const preview = useQuery({
    queryKey: ['campaign-product-list', storeSlug, deferred],
    queryFn: () => circularService.parseProductList(deferred, storeSlug),
    enabled: deferred.trim().length > 10,
    staleTime: 60_000,
  });
  const items = preview.data?.products || [];
  return (
    <Stack spacing={1}>
      <TextField
        multiline
        minRows={4}
        maxRows={16}
        fullWidth
        size="small"
        placeholder={
          "HELLMANN'S\nMAYONNAISE\n30 FL OZ JAR\n$5.99\nREG. $14.89\n------------------------------\n\nBEEF SHORT RIBS\nUSDA CHOICE\n$7.99 LB\nREG. $10.99 LB\nAT THE COUNTER"
        }
        value={value}
        onChange={(e) => onChange(e.target.value)}
        inputProps={{ style: { fontFamily: 'ui-monospace, Menlo, monospace', fontSize: 13 } }}
      />
      {deferred.trim().length > 10 && (
        <Stack
          direction="row"
          alignItems="center"
          gap={1}
          flexWrap="wrap"
        >
          <Chip
            size="small"
            color={items.length ? 'success' : 'warning'}
            label={
              preview.isFetching
                ? 'Leyendo…'
                : `${items.length} producto${items.length === 1 ? '' : 's'} leído${
                    items.length === 1 ? '' : 's'
                  }`
            }
            onClick={() => setOpen((v) => !v)}
          />
          {!!items.length && (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ textTransform: 'none', letterSpacing: 0 }}
            >
              {items.filter((p) => p.counterOnly).length} en mostrador ·{' '}
              {items.filter((p) => p.brand).length} con marca · click para ver la vista previa
            </Typography>
          )}
        </Stack>
      )}
      <Collapse
        in={open && items.length > 0}
        unmountOnExit
      >
        <Box
          sx={{ overflowX: 'auto', border: '1px solid', borderColor: 'divider', borderRadius: 2 }}
        >
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Producto</TableCell>
                <TableCell>Marca · tamaño</TableCell>
                <TableCell align="right">Oferta</TableCell>
                <TableCell align="right">Regular</TableCell>
                <TableCell>Notas</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((p, i) => (
                <TableRow key={`${p.name}-${i}`}>
                  <TableCell sx={{ fontWeight: 700 }}>
                    {p.name}
                    {p.presentation ? (
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ display: 'block', textTransform: 'none', letterSpacing: 0 }}
                      >
                        {p.presentation}
                      </Typography>
                    ) : null}
                  </TableCell>
                  <TableCell>{[p.brand, p.size].filter(Boolean).join(' · ') || '—'}</TableCell>
                  <TableCell align="right">{p.price}</TableCell>
                  <TableCell align="right">{p.originalPrice || '—'}</TableCell>
                  <TableCell>
                    {[
                      p.counterOnly ? 'Mostrador' : '',
                      p.limitPerFamily ? `Límite ${p.limitPerFamily}` : '',
                      p.savings ? `Ahorra ${p.savings}` : '',
                      p.unit ? p.unit.toUpperCase() : '',
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      </Collapse>
    </Stack>
  );
}
