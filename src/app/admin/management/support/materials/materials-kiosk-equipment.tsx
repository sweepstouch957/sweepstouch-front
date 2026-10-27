'use client';

import { kioskKeys } from '@/hooks/fetching/kiosk/useKioskDevices';
import { getKioskDevices } from '@/services/kiosk.service';
import DevicesOutlined from '@mui/icons-material/DevicesOutlined';
import {
  Alert,
  Box,
  Button,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import {
  EmptyBlock,
  StatusPill,
} from 'src/components/application-ui/content-shells/store-managment/panel-kit';
import { useMaterials } from './materials-context';
import { collectInstalledKioskTablets, matchesKioskTablet } from './materials-kiosk-utils';
import { PageControls, QueryFeedback, Section } from './materials-shared';
import { storeAddress } from './materials-utils';

function lastSeenLabel(value: string) {
  if (!value) return 'Sin información';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString('es-HN');
}

export function KioskEquipmentView({
  active,
  query,
  storeId,
}: {
  active: boolean;
  query: string;
  storeId: string;
}) {
  const { scope, enabled, stores } = useMaterials();
  const queryClient = useQueryClient();
  const selectedStores = useMemo(
    () => stores.filter((store) => store.store && (!storeId || store.id === storeId)),
    [stores, storeId]
  );
  const [pagination, setPagination] = useState({ page: 1, query, storeId });
  const page = pagination.query === query && pagination.storeId === storeId ? pagination.page : 1;
  const result = useQuery({
    queryKey: [...scope, 'kiosk-equipment', selectedStores],
    queryFn: ({ signal }) =>
      collectInstalledKioskTablets(
        selectedStores,
        (id) =>
          queryClient.fetchQuery({
            queryKey: kioskKeys.devices(id),
            queryFn: () => getKioskDevices(id),
            staleTime: 2 * 60 * 1000,
            retry: false,
          }),
        signal
      ),
    enabled: enabled && active,
    staleTime: 2 * 60 * 1000,
    retry: false,
  });
  const rows = useMemo(
    () => (result.data?.rows || []).filter((row) => matchesKioskTablet(row, query)),
    [result.data, query]
  );
  const limit = 20;
  const currentPage = Math.min(page, Math.max(1, Math.ceil(rows.length / limit)));
  const visible = rows.slice((currentPage - 1) * limit, currentPage * limit);
  const failures = result.data?.failedStores.length || 0;
  return (
    <Section
      title="Tablets instaladas (Kiosko)"
      hint="Busca por IMEI, serial, nombre del equipo o tienda"
      icon={<DevicesOutlined color="primary" />}
    >
      {failures > 0 && (
        <Alert
          severity={failures === selectedStores.length ? 'error' : 'warning'}
          sx={{ mb: 1.5 }}
          action={
            <Button
              type="button"
              size="small"
              disabled={result.isFetching}
              onClick={() => {
                void result.refetch();
              }}
            >
              Reintentar
            </Button>
          }
        >
          No se pudieron consultar {failures} {failures === 1 ? 'tienda' : 'tiendas'}. Los
          resultados pueden estar incompletos.
        </Alert>
      )}
      <QueryFeedback
        pending={result.isPending || result.isFetching}
        error={result.error}
      >
        {visible.length ? (
          <TableContainer>
            <Table
              size="small"
              aria-label="Tablets instaladas del kiosko"
            >
              <TableHead>
                <TableRow>
                  {['Equipo', 'IMEI', 'Serial', 'Ubicación', 'Conexión', 'Última conexión'].map(
                    (label) => (
                      <TableCell key={label}>{label}</TableCell>
                    )
                  )}
                </TableRow>
              </TableHead>
              <TableBody>
                {visible.map(({ key, device, stores: deviceStores }) => (
                  <TableRow key={key}>
                    <TableCell>
                      <Typography
                        variant="body2"
                        fontWeight={600}
                      >
                        {device.name || 'Tablet sin nombre'}
                      </Typography>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                      >
                        {[device.brand, device.model].filter(Boolean).join(' ')}
                      </Typography>
                    </TableCell>
                    <TableCell>{device.imei || 'Sin IMEI registrado'}</TableCell>
                    <TableCell>{device.serial || 'Sin serial registrado'}</TableCell>
                    <TableCell>
                      <Stack
                        spacing={0.5}
                        alignItems="flex-start"
                      >
                        <StatusPill
                          label="En tienda"
                          tone="info"
                        />
                        {deviceStores.map((store) => (
                          <Box key={store.id}>
                            <Typography variant="body2">{store.nombre}</Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              {storeAddress(store)}
                            </Typography>
                          </Box>
                        ))}
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <StatusPill
                        label={device.online ? 'En línea' : 'Sin conexión'}
                        tone={device.online ? 'success' : 'neutral'}
                      />
                    </TableCell>
                    <TableCell>{lastSeenLabel(device.lastSeen)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : failures ? (
          <EmptyBlock
            title="Consulta incompleta"
            hint="Reintenta la consulta de las tiendas para completar los resultados."
          />
        ) : (
          <EmptyBlock
            title="Sin tablets del kiosko"
            hint={
              selectedStores.length
                ? 'Prueba con otro IMEI, serial, nombre o tienda.'
                : 'Selecciona una tienda vinculada al kiosko para consultar sus tablets.'
            }
          />
        )}
      </QueryFeedback>
      {!result.error && !result.isPending && (
        <PageControls
          result={{
            docs: visible,
            total: rows.length,
            page: currentPage,
            limit,
            hasNextPage: currentPage * limit < rows.length,
            hasPrevPage: currentPage > 1,
          }}
          page={currentPage}
          onChange={(value) => setPagination({ page: value, query, storeId })}
        />
      )}
    </Section>
  );
}
