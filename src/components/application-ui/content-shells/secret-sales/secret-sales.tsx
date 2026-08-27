'use client';

import { useSecretSales } from '@/hooks/fetching/secret-sales/useSecretSales';
import { useStores } from '@/hooks/fetching/stores/useStores';
import { secretSaleService, type SecretSale } from '@/services/secret-sale.service';
import AddRounded from '@mui/icons-material/AddRounded';
import LockOpenRounded from '@mui/icons-material/LockOpenRounded';
import {
  Autocomplete,
  Box,
  Button,
  Card,
  Container,
  Grid,
  Skeleton,
  Stack,
  Switch,
  FormControlLabel,
  TextField,
  Typography,
} from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import dynamic from 'next/dynamic';
import React, { useCallback, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { QrCard } from './qr-card';
import { SaleCard } from './sale-card';
import { saleStatus } from './constants';
import type { SaleFormValues } from './sale-dialog';

// Pesan y no se ven en el primer render.
const SaleDialog = dynamic(() => import('./sale-dialog').then((m) => m.SaleDialog), { loading: () => null });
const LeadsDialog = dynamic(() => import('./leads-dialog').then((m) => m.LeadsDialog), { loading: () => null });

/**
 * Secret Sales — el flyer que la tienda cambia por un contacto.
 *
 * Flujo completo: acá se sube el flyer con su vencimiento y se imprime el QR;
 * quien lo escanea cae en el linktree (`/secret-sales?slug=`), deja nombre,
 * apellido, email y teléfono, y recién ahí ve la pieza. Los contactos vuelven a
 * esta misma pantalla.
 */
export default function SecretSales(): React.JSX.Element {
  const qc = useQueryClient();

  const { data: stores, isPending: storesPending } = useStores();
  const [storeId, setStoreId] = useState('');
  const [showExpired, setShowExpired] = useState(true);

  const selectedStore = useMemo(
    () => (stores || []).find((s: any) => String(s?._id) === storeId) || null,
    [stores, storeId]
  );

  const { data: sales, isPending } = useSecretSales(storeId, true);

  const visibleSales = useMemo(() => {
    const list = sales ?? [];
    return showExpired ? list : list.filter((s) => saleStatus(s) !== 'expired');
  }, [sales, showExpired]);

  const activeCount = useMemo(
    () => (sales ?? []).filter((s) => saleStatus(s) === 'active').length,
    [sales]
  );
  const leadTotal = useMemo(
    () => (sales ?? []).reduce((acc, s) => acc + (s.leadCount ?? 0), 0),
    [sales]
  );

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<SecretSale | null>(null);
  const [leadsOf, setLeadsOf] = useState<SecretSale | null>(null);

  const invalidate = useCallback(() => {
    qc.invalidateQueries({ queryKey: ['secret-sales', storeId] });
  }, [qc, storeId]);

  const saveMutation = useMutation({
    mutationFn: (values: SaleFormValues) =>
      editing
        ? secretSaleService.update(editing._id, values)
        : secretSaleService.create({ ...values, storeId }),
    onSuccess: () => {
      toast.success(editing ? 'Secret sale actualizada' : 'Secret sale creada');
      setDialogOpen(false);
      setEditing(null);
      invalidate();
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'No se pudo guardar'),
  });

  const toggleMutation = useMutation({
    mutationFn: (sale: SecretSale) => secretSaleService.update(sale._id, { isActive: !sale.isActive }),
    onSuccess: () => {
      toast.success('Estado actualizado');
      invalidate();
    },
    onError: () => toast.error('No se pudo cambiar el estado'),
  });

  const deleteMutation = useMutation({
    mutationFn: (sale: SecretSale) => secretSaleService.remove(sale._id),
    onSuccess: () => {
      toast.success('Secret sale eliminada');
      invalidate();
    },
    onError: () => toast.error('No se pudo eliminar'),
  });

  const handleDelete = useCallback(
    (sale: SecretSale) => {
      // Borra el flyer y sus contactos dejan de tener a qué apuntar: se pregunta.
      if (window.confirm(`¿Eliminar "${sale.title}"? No se puede deshacer.`)) {
        deleteMutation.mutate(sale);
      }
    },
    [deleteMutation]
  );

  const handleEdit = useCallback((sale: SecretSale) => {
    setEditing(sale);
    setDialogOpen(true);
  }, []);

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <Stack spacing={3}>
        {/* ── Selector de tienda + acción ── */}
        <Card sx={{ p: 2.5, borderRadius: 3 }}>
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            spacing={2}
            alignItems={{ xs: 'stretch', md: 'center' }}
          >
            <Autocomplete
              sx={{ flexGrow: 1, minWidth: 260 }}
              size="small"
              options={stores || []}
              value={selectedStore}
              loading={storesPending}
              getOptionLabel={(o: any) => (o?.name || '').toString()}
              isOptionEqualToValue={(o: any, v: any) => o?._id === v?._id}
              noOptionsText="Sin coincidencias"
              loadingText="Cargando tiendas…"
              onChange={(_, value: any) => setStoreId(value ? String(value._id) : '')}
              renderInput={(params) => <TextField {...params} label="Tienda" />}
            />

            <FormControlLabel
              control={<Switch checked={showExpired} onChange={(e) => setShowExpired(e.target.checked)} />}
              label="Ver vencidas"
            />

            <Button
              variant="contained"
              startIcon={<AddRounded />}
              disabled={!storeId}
              onClick={() => {
                setEditing(null);
                setDialogOpen(true);
              }}
              sx={{ textTransform: 'none', borderRadius: 2, px: 3 }}
            >
              Nueva secret sale
            </Button>
          </Stack>

          {storeId ? (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
              {activeCount} vigente{activeCount === 1 ? '' : 's'} · {sales?.length ?? 0} en total ·{' '}
              {leadTotal} contacto{leadTotal === 1 ? '' : 's'} capturado{leadTotal === 1 ? '' : 's'}
            </Typography>
          ) : null}
        </Card>

        {!storeId ? (
          <Card sx={{ p: 6, borderRadius: 3, textAlign: 'center' }}>
            <LockOpenRounded sx={{ fontSize: 56, color: 'text.disabled' }} />
            <Typography variant="h6" fontWeight={700} sx={{ mt: 1 }}>
              Elegí una tienda
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Cada secret sale y su QR pertenecen a una tienda.
            </Typography>
          </Card>
        ) : (
          <Grid container spacing={3}>
            {/* ── Flyers ── */}
            <Grid item xs={12} md={8}>
              {isPending ? (
                <Grid container spacing={2}>
                  {[0, 1, 2].map((i) => (
                    <Grid item xs={12} sm={6} lg={4} key={i}>
                      <Skeleton variant="rounded" height={420} sx={{ borderRadius: 3 }} />
                    </Grid>
                  ))}
                </Grid>
              ) : !visibleSales.length ? (
                <Card sx={{ p: 6, borderRadius: 3, textAlign: 'center' }}>
                  <Typography variant="h6" fontWeight={700}>
                    Todavía no hay secret sales
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Subí el flyer de esta semana con su fecha de vencimiento. Cuando venza, subís uno
                    nuevo y el QR impreso sigue sirviendo igual.
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<AddRounded />}
                    onClick={() => {
                      setEditing(null);
                      setDialogOpen(true);
                    }}
                    sx={{ textTransform: 'none', borderRadius: 2 }}
                  >
                    Crear la primera
                  </Button>
                </Card>
              ) : (
                <Grid container spacing={2}>
                  {visibleSales.map((sale) => (
                    <Grid item xs={12} sm={6} lg={4} key={sale._id}>
                      <SaleCard
                        sale={sale}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        onToggleActive={(s) => toggleMutation.mutate(s)}
                        onViewLeads={setLeadsOf}
                      />
                    </Grid>
                  ))}
                </Grid>
              )}
            </Grid>

            {/* ── QR ── */}
            <Grid item xs={12} md={4}>
              <Box sx={{ position: { md: 'sticky' }, top: { md: 24 } }}>
                <QrCard storeId={storeId} storeName={(selectedStore as any)?.name} />
              </Box>
            </Grid>
          </Grid>
        )}
      </Stack>

      {dialogOpen ? (
        <SaleDialog
          open={dialogOpen}
          editing={editing}
          saving={saveMutation.isPending}
          onClose={() => {
            setDialogOpen(false);
            setEditing(null);
          }}
          onSubmit={(values) => saveMutation.mutate(values)}
        />
      ) : null}

      {leadsOf ? <LeadsDialog sale={leadsOf} onClose={() => setLeadsOf(null)} /> : null}
    </Container>
  );
}
