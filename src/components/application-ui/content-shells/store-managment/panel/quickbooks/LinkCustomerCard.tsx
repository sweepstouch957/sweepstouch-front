'use client';

import { money } from '@/components/application-ui/content-shells/qbo-receivables/constants';
import type { QboCandidate, QboCustomerRow } from '@/services/qbo.service';
import {
  useQboCustomers,
  useQboLinkStore,
  useQboProposals,
  useQboUnlinkStore,
} from '@hooks/fetching/qbo/useQbo';
import LinkOffRoundedIcon from '@mui/icons-material/LinkOffRounded';
import LinkRoundedIcon from '@mui/icons-material/LinkRounded';
import PlaceRoundedIcon from '@mui/icons-material/PlaceRounded';
import StorefrontRoundedIcon from '@mui/icons-material/StorefrontRounded';
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Divider,
  Skeleton,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useState } from 'react';

type Props = { storeId: string; storeName?: string };

/** Las señales que sostienen un candidato, para que el admin decida con datos y no a ciegas. */
function EvidenceChips({ c }: { c: QboCandidate }) {
  return (
    <Stack direction="row"
spacing={0.75}
flexWrap="wrap"
useFlexGap>
      <Chip
        size="small"
        label={c.streetHit ? 'Nº de calle igual' : 'Calle distinta'}
        color={c.streetHit ? 'success' : 'default'}
        variant="outlined"
      />
      <Chip
        size="small"
        label={c.zipHit ? 'Mismo ZIP' : 'ZIP no confirma'}
        color={c.zipHit ? 'success' : 'default'}
        variant="outlined"
      />
      <Chip
        size="small"
        label={`Marca ${Math.round(c.brandSim * 100)}%`}
        color={c.brandSim >= 0.55 ? 'success' : c.brandSim >= 0.3 ? 'warning' : 'default'}
        variant="outlined"
      />
    </Stack>
  );
}

export function LinkCustomerCard({ storeId, storeName }: Props) {
  const proposals = useQboProposals(storeId);
  const link = useQboLinkStore(storeId);
  const unlink = useQboUnlinkStore(storeId);

  const [search, setSearch] = useState('');
  const [manual, setManual] = useState<QboCustomerRow | null>(null);
  // El catálogo son 270 filas: no se pide hasta que el admin abre el selector
  const [pickerOpen, setPickerOpen] = useState(false);
  const customers = useQboCustomers('', { enabled: pickerOpen });

  const proposal = proposals.data?.proposals?.[0];

  if (proposals.isLoading) {
    return <Skeleton variant="rounded"
height={200}
sx={{ borderRadius: 2 }} />;
  }

  if (proposals.isError) {
    return (
      <Alert severity="warning">
        {(proposals.error as Error)?.message || 'No se pudieron cargar los candidatos de QuickBooks.'}
      </Alert>
    );
  }

  return (
    <Card>
      <CardHeader
        avatar={<LinkRoundedIcon color="primary" />}
        title="Vínculo con QuickBooks"
        subheader={storeName || storeId}
        titleTypographyProps={{ variant: 'h6', fontWeight: 600 }}
      />
      <CardContent sx={{ pt: 0 }}>
        {proposal?.conflict && (
          <Alert severity="warning"
sx={{ mb: 2 }}>
            El mejor candidato ya está vinculado a otra tienda. Revisa antes de forzar.
          </Alert>
        )}

        {/* Candidatos sugeridos por dirección */}
        <Typography variant="subtitle2"
fontWeight={600}
sx={{ mb: 1 }}>
          Candidatos sugeridos
        </Typography>

        {!proposal?.candidates?.length && (
          <Typography variant="body2"
color="text.secondary">
            Ninguno. La dirección de esta tienda no coincide con ningún cliente. Búscalo a mano abajo.
          </Typography>
        )}

        <Stack spacing={1.25}>
          {proposal?.candidates?.slice(0, 3).map((c, i) => (
            <Box
              key={c.qboCustomerId}
              sx={{
                p: 1.5,
                borderRadius: 1.5,
                border: '1px solid',
                borderColor: i === 0 && proposal.confidence === 'auto' ? 'success.main' : 'divider',
              }}
            >
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                justifyContent="space-between"
                alignItems={{ xs: 'stretch', sm: 'center' }}
                spacing={1.5}
              >
                <Box minWidth={0}>
                  <Stack direction="row"
alignItems="center"
spacing={1}>
                    <StorefrontRoundedIcon fontSize="small"
color="action" />
                    <Typography variant="body2"
fontWeight={600}>
                      {c.qboName}
                    </Typography>
                    {i === 0 && proposal.confidence === 'auto' && (
                      <Chip size="small"
label="Recomendado"
color="success" />
                    )}
                  </Stack>
                  {c.address && (
                    <Stack direction="row"
alignItems="center"
spacing={0.5}
sx={{ mt: 0.25 }}>
                      <PlaceRoundedIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                      <Typography variant="caption"
color="text.secondary">
                        {c.address}
                      </Typography>
                    </Stack>
                  )}
                  <Box mt={0.75}>
                    <EvidenceChips c={c} />
                  </Box>
                </Box>

                <Stack alignItems={{ xs: 'flex-start', sm: 'flex-end' }}
spacing={0.75}>
                  <Typography variant="body2"
fontWeight={700}>
                    {money(c.balance)}
                  </Typography>
                  <Button
                    size="small"
                    variant={i === 0 && proposal.confidence === 'auto' ? 'contained' : 'outlined'}
                    disabled={link.isPending}
                    onClick={() => link.mutate(c.qboCustomerId)}
                  >
                    Vincular
                  </Button>
                </Stack>
              </Stack>
            </Box>
          ))}
        </Stack>

        <Divider sx={{ my: 2.5 }} />

        {/* Selector manual sobre el catálogo completo */}
        <Typography variant="subtitle2"
fontWeight={600}
sx={{ mb: 1 }}>
          Buscar a mano
        </Typography>

        <Stack direction={{ xs: 'column', sm: 'row' }}
spacing={1.5}>
          <Autocomplete
            fullWidth
            size="small"
            open={pickerOpen}
            onOpen={() => setPickerOpen(true)}
            onClose={() => setPickerOpen(false)}
            options={customers.data?.customers ?? []}
            loading={customers.isLoading}
            value={manual}
            onChange={(_, v) => setManual(v)}
            inputValue={search}
            onInputChange={(_, v) => setSearch(v)}
            getOptionLabel={(o) => o.qboName}
            isOptionEqualToValue={(a, b) => a.qboCustomerId === b.qboCustomerId}
            renderOption={(props, o) => (
              <li {...props}
key={o.qboCustomerId}>
                <Box width="100%">
                  <Stack direction="row"
justifyContent="space-between"
spacing={1}>
                    <Typography variant="body2"
fontWeight={600}>
                      {o.qboName}
                    </Typography>
                    <Typography variant="body2"
color="text.secondary">
                      {money(o.balance)}
                    </Typography>
                  </Stack>
                  <Typography variant="caption"
color="text.secondary">
                    {o.address || 'Sin dirección'}
                    {o.linkedStoreName ? ` · ya vinculado a ${o.linkedStoreName}` : ''}
                  </Typography>
                </Box>
              </li>
            )}
            // Un cliente por tienda: los ya tomados por otra no se ofrecen
            getOptionDisabled={(o) => Boolean(o.linkedStoreId) && o.linkedStoreId !== storeId}
            renderInput={(params) => (
              <TextField {...params}
label="Cliente de QuickBooks"
placeholder="Nombre o dirección…" />
            )}
          />

          <Button
            variant="contained"
            disabled={!manual || link.isPending}
            onClick={() => manual && link.mutate(manual.qboCustomerId)}
            sx={{ whiteSpace: 'nowrap' }}
          >
            Vincular
          </Button>
        </Stack>

        <Box mt={2}>
          <Button
            size="small"
            color="inherit"
            startIcon={<LinkOffRoundedIcon />}
            disabled={unlink.isPending}
            onClick={() => unlink.mutate()}
          >
            Quitar vínculo actual
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
}

export default LinkCustomerCard;
