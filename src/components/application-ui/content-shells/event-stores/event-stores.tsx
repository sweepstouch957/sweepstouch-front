'use client';

/**
 * Módulo Eventos — tiendas creadas sólo para un evento (NSA tradeshow y similares).
 *
 * Estas tiendas no salen en el listado normal (`store/filter` las esconde) porque
 * sus números son dueños de súper y proveedores, no audiencia de campañas MMS.
 * Esta es la única vista donde se ven: totales, registros por día, y por evento
 * cuántos números cayeron, con qué link entran y cómo bajarse los teléfonos.
 */

import { useEventStores } from '@/hooks/fetching/sweepstakes/useEventStores';
import {
  sweepstakesClient,
  type EventStoreRow,
  type ExportedParticipant,
} from '@/services/sweepstakes.service';
import AddLinkRounded from '@mui/icons-material/AddLinkRounded';
import EventRounded from '@mui/icons-material/EventRounded';
import RefreshRounded from '@mui/icons-material/RefreshRounded';
import {
  Alert,
  Button,
  Card,
  CircularProgress,
  Container,
  Snackbar,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import { format } from 'date-fns';
import Link from 'next/link';
import React, { useState } from 'react';
import PageHeading from 'src/components/base/page-heading';
import { routes } from 'src/router/routes';
import EventStoresMetrics from './event-stores-metrics';
import EventStoresTable from './event-stores-table';
import LinkStoreDialog from './link-store-dialog';

const RANGES = [7, 30, 90];

function toCsv(rows: ExportedParticipant[], withRole: boolean): string {
  const headers = ['#', 'Teléfono', 'Método', 'Tipo', ...(withRole ? ['Rol'] : []), 'Fecha'];
  const body = rows.map((r, i) =>
    [
      i + 1,
      r.phone,
      r.method,
      r.isNewUser ? 'Nuevo' : 'Existente',
      ...(withRole ? [r.nsaRole ?? 'Sin responder'] : []),
      r.registeredAt ? format(new Date(r.registeredAt), 'dd/MM/yyyy HH:mm') : '',
    ].join(',')
  );
  return [headers.join(','), ...body].join('\n');
}

export default function EventStores(): React.JSX.Element {
  const [days, setDays] = useState(30);
  const [snack, setSnack] = useState<string | null>(null);
  const [exportingId, setExportingId] = useState<string | null>(null);
  const [linkOpen, setLinkOpen] = useState(false);

  const { data, isLoading, isError, isFetching, refetch } = useEventStores(days);
  const rows = data?.rows ?? [];

  const handleCopy = async (link: string) => {
    await navigator.clipboard.writeText(link);
    setSnack('Link copiado');
  };

  const handleExport = async (row: EventStoreRow) => {
    setExportingId(row.store._id);
    try {
      const result = await sweepstakesClient.exportParticipants({
        storeId: row.store._id,
        sweepstakeId: row.sweepstake?._id,
      });
      const csv = toCsv(result.rows, Boolean(result.isNsa));
      const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `${row.store.slug}-numeros.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setSnack('No se pudieron exportar los números');
    } finally {
      setExportingId(null);
    }
  };

  return (
    <Container
      maxWidth="xl"
      sx={{ py: 2 }}
    >
      <PageHeading
        sx={{ px: 0 }}
        title="Eventos"
        description="Tiendas creadas para un evento (NSA, tradeshows). Sus números no reciben campañas."
        actions={
          <Stack
            direction="row"
            gap={1}
            alignItems="center"
          >
            <ToggleButtonGroup
              size="small"
              exclusive
              value={days}
              onChange={(_, v) => v && setDays(v)}
            >
              {RANGES.map((r) => (
                <ToggleButton
                  key={r}
                  value={r}
                >
                  {r}d
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
            <Button
              size="small"
              variant="outlined"
              startIcon={
                isFetching ? <CircularProgress size={14} /> : <RefreshRounded fontSize="small" />
              }
              onClick={() => refetch()}
              disabled={isFetching}
            >
              Actualizar
            </Button>
            <Button
              size="small"
              variant="contained"
              startIcon={<AddLinkRounded fontSize="small" />}
              onClick={() => setLinkOpen(true)}
            >
              Agregar existente
            </Button>
          </Stack>
        }
      />

      <Stack
        gap={2}
        sx={{ mt: 2 }}
      >
        <EventStoresMetrics
          totals={data?.totals}
          daily={data?.daily}
          loading={isLoading}
        />

        <Card sx={{ overflowX: 'auto' }}>
          {isLoading && (
            <Stack
              alignItems="center"
              py={6}
            >
              <CircularProgress />
            </Stack>
          )}

          {isError && (
            <Alert
              severity="error"
              sx={{ m: 2 }}
            >
              No se pudieron cargar los eventos.
            </Alert>
          )}

          {!isLoading && !isError && rows.length === 0 && (
            <Stack
              alignItems="center"
              gap={1}
              py={6}
              px={2}
            >
              <EventRounded
                color="disabled"
                fontSize="large"
              />
              <Typography
                variant="body2"
                color="text.secondary"
                textAlign="center"
              >
                Todavía no hay tiendas de evento. Se crean al armar un sorteo con opt-in
                &quot;Evento&quot; o &quot;NSA&quot;.
              </Typography>
              <Button
                component={Link}
                href={routes.admin.management.events.create}
                variant="contained"
                size="small"
              >
                Crear sorteo de evento
              </Button>
            </Stack>
          )}

          {!isLoading && !isError && rows.length > 0 && (
            <EventStoresTable
              rows={rows}
              exportingId={exportingId}
              onCopy={handleCopy}
              onExport={handleExport}
            />
          )}
        </Card>
      </Stack>

      <LinkStoreDialog
        open={linkOpen}
        onClose={() => setLinkOpen(false)}
        onDone={setSnack}
      />

      <Snackbar
        open={Boolean(snack)}
        autoHideDuration={2500}
        onClose={() => setSnack(null)}
        message={snack ?? ''}
      />
    </Container>
  );
}
