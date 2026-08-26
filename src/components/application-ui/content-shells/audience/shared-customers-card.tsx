'use client';

/**
 * Clientes compartidos entre negocios.
 *
 * La suma de `customerCount` de todos los negocios no son personas: un número que
 * está en tres negocios se cuenta tres veces, se le manda tres veces y se factura
 * tres veces. Esta tarjeta muestra la brecha entre pertenencias y personas.
 */
import { PanelCard, numeric as tabular } from '@/components/audience/ui';
import { useMultiStoreCustomers } from '@/hooks/fetching/campaigns/useAudience';
import GroupsRoundedIcon from '@mui/icons-material/GroupsRounded';
import StorefrontRoundedIcon from '@mui/icons-material/StorefrontRounded';
import {
  Alert,
  Box,
  Chip,
  Collapse,
  Divider,
  LinearProgress,
  Link,
  Skeleton,
  Stack,
  Typography,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import React, { useState } from 'react';

const nf = new Intl.NumberFormat('es-US');
const numeric = tabular;

function Stat({
  label,
  value,
  hint,
  tone = 'text.primary',
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: string;
}) {
  return (
    <Stack
      gap={0.25}
      minWidth={0}
      flex={1}
    >
      <Typography
        variant="caption"
        color="text.secondary"
        noWrap
      >
        {label}
      </Typography>
      <Typography
        variant="h5"
        fontWeight={700}
        sx={{ ...numeric, color: tone, lineHeight: 1.15 }}
      >
        {value}
      </Typography>
      {hint && (
        <Typography
          variant="caption"
          color="text.secondary"
        >
          {hint}
        </Typography>
      )}
    </Stack>
  );
}

export default function SharedCustomersCard() {
  const theme = useTheme();
  const [showList, setShowList] = useState(false);

  const { data, isLoading, isError } = useMultiStoreCustomers({
    minStores: 3,
    list: showList,
    limit: 50,
  });

  return (
    <PanelCard
      title="Clientes compartidos"
      subtitle="Números que están en más de un negocio"
      icon={<GroupsRoundedIcon fontSize="small" />}
      tone="info"
    >
      {isError && <Alert severity="error">No se pudo calcular. Reintentá en unos minutos.</Alert>}

      {isLoading && !data && (
        <Stack gap={1.5}>
          <Skeleton
            variant="rounded"
            height={64}
          />
          <Skeleton
            variant="rounded"
            height={40}
          />
        </Stack>
      )}

      {data && (
        <>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            gap={2}
            divider={
              <Divider
                flexItem
                orientation="vertical"
                sx={{ display: { xs: 'none', sm: 'block' } }}
              />
            }
          >
            <Stat
              label="Personas distintas"
              value={nf.format(data.withAnyStore)}
              hint="Con al menos un negocio"
            />
            <Stat
              label="En 2 o más negocios"
              value={nf.format(data.inTwoPlus)}
              tone={theme.palette.warning.main}
            />
            <Stat
              label="En más de 2"
              value={nf.format(data.inThreePlus)}
              hint={`${nf.format(data.inFivePlus)} en 5 o más`}
              tone={theme.palette.error.main}
            />
          </Stack>

          <Box
            sx={{
              mt: 2.5,
              p: 1.75,
              borderRadius: 2,
              bgcolor: alpha(theme.palette.warning.main, 0.08),
              border: '1px solid',
              borderColor: alpha(theme.palette.warning.main, 0.24),
            }}
          >
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="baseline"
              gap={1}
              flexWrap="wrap"
            >
              <Typography
                variant="body2"
                fontWeight={700}
              >
                Doble conteo
              </Typography>
              <Typography
                variant="body2"
                sx={{ ...numeric }}
              >
                {nf.format(data.duplicatedMemberships)} pertenencias ·{' '}
                {data.duplicationPct.toFixed(1)}%
              </Typography>
            </Stack>
            <Typography
              variant="caption"
              color="text.secondary"
            >
              Los negocios suman {nf.format(data.totalMemberships)} contactos, pero son{' '}
              {nf.format(data.withAnyStore)} personas ({data.avgStoresPerCustomer.toFixed(2)}{' '}
              negocios por persona). A esa gente le llega la campaña de cada negocio por separado.
            </Typography>
            {/* La barra da la proporción de un vistazo; el % de arriba da el dato exacto. */}
            <LinearProgress
              variant="determinate"
              value={Math.min(100, data.duplicationPct)}
              color="warning"
              sx={{ height: 6, borderRadius: 3, mt: 1 }}
              aria-label={`Doble conteo: ${data.duplicationPct.toFixed(1)} por ciento`}
            />
          </Box>

          <Box sx={{ mt: 2 }}>
            <Link
              component="button"
              type="button"
              variant="body2"
              underline="hover"
              onClick={() => setShowList((v) => !v)}
              aria-expanded={showList}
            >
              {showList ? 'Ocultar' : `Ver los que están en más de ${data.minStores - 1} negocios`}
            </Link>
          </Box>

          <Collapse in={showList}>
            {showList && isLoading && (
              <Skeleton
                variant="rounded"
                height={160}
                sx={{ mt: 1.5 }}
              />
            )}

            {data.customers && data.customers.length === 0 && (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mt: 1.5 }}
              >
                Ningún cliente llega a ese número de negocios.
              </Typography>
            )}

            {data.customers && data.customers.length > 0 && (
              <Stack
                gap={1}
                sx={{ mt: 1.5, maxHeight: 320, overflowY: 'auto', pr: 0.5 }}
              >
                {data.customers.map((c) => (
                  <Stack
                    key={c.id}
                    direction="row"
                    alignItems="center"
                    justifyContent="space-between"
                    gap={1}
                    sx={{
                      px: 1.25,
                      py: 1,
                      borderRadius: 1.5,
                      bgcolor: alpha(theme.palette.text.primary, 0.03),
                    }}
                  >
                    <Stack minWidth={0}>
                      <Typography
                        variant="body2"
                        fontWeight={600}
                        noWrap
                      >
                        {c.name || c.phoneNumber}
                      </Typography>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        noWrap
                        title={c.stores
                          .map((s) => s.name)
                          .filter(Boolean)
                          .join(' · ')}
                      >
                        {c.stores
                          .map((s) => s.name)
                          .filter(Boolean)
                          .join(' · ') || 'Negocios sin nombre'}
                      </Typography>
                    </Stack>
                    <Chip
                      size="small"
                      icon={<StorefrontRoundedIcon />}
                      label={c.storesCount}
                      color="warning"
                      variant="outlined"
                      sx={{ ...numeric, flexShrink: 0 }}
                    />
                  </Stack>
                ))}
              </Stack>
            )}
          </Collapse>
        </>
      )}
    </PanelCard>
  );
}
