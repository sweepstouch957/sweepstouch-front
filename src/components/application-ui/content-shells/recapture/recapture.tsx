'use client';

/**
 * Recaptura de números. Las tiendas inactivas tienen números que ya nadie usa: acá se ve
 * qué tienda activa le queda cerca a cada una (por zip / distancia) y se les agenda una
 * campaña invitándolos a suscribirse a esa tienda.
 */

import {
  EmptyBlock,
  KpiCard,
  KpiRow,
  PageHero,
  PanelCard,
  panelDivider,
  SectionHeader,
  StatusPill,
} from '@/components/application-ui/content-shells/store-managment/panel-kit';
import { recaptureService, type RecaptureCampaign, type RecaptureNeighbor } from '@/services/recapture.service';
import { textHas } from '@/utils/text';
import { useConfirm } from '@/components/base/confirm';
import PersonAddAlt1RoundedIcon from '@mui/icons-material/PersonAddAlt1Rounded';
import PlaceRoundedIcon from '@mui/icons-material/PlaceRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import SendRoundedIcon from '@mui/icons-material/SendRounded';
import StorefrontRoundedIcon from '@mui/icons-material/StorefrontRounded';
import {
  Alert,
  Box,
  Button,
  InputAdornment,
  MenuItem,
  Skeleton,
  Stack,
  TextField,
  Typography,
  useTheme,
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import dynamic from 'next/dynamic';
import { useDeferredValue, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { RecaptureAddDialog } from './add-dialog';
import { RecaptureSendDialog } from './send-dialog';

const RecaptureMap = dynamic(() => import('./recapture-map'), {
  ssr: false,
  loading: () => <Skeleton variant="rounded" height={440} sx={{ borderRadius: 3 }} />,
});

const num = (n: number) => Number(n || 0).toLocaleString('es');
const MI_KM = 1.609344;
const RADII_MI = [5, 10, 25, 50];

const how = (n: RecaptureNeighbor) =>
  n.distanceKm !== null
    ? `${(n.distanceKm / MI_KM).toFixed(1)} mi${n.match === 'zip' ? ' · mismo zip' : ''}`
    : n.match === 'zip'
      ? 'Mismo zip'
      : 'Misma zona postal (aprox.)';

const CAMPAIGN_STATUS: Record<RecaptureCampaign['status'], { label: string; tone: 'neutral' | 'success' | 'warning' | 'error' | 'info' }> = {
  draft: { label: 'Borrador', tone: 'neutral' },
  scheduled: { label: 'Agendada', tone: 'info' },
  active: { label: 'Enviando', tone: 'warning' },
  completed: { label: 'Enviada', tone: 'success' },
  cancelled: { label: 'Cancelada', tone: 'error' },
};

/** Una tienda del comparativo: mismos datos en el mismo orden para leerlas de lado a lado. */
function CompareCard({
  tone,
  tag,
  name,
  lines,
  children,
}: {
  tone: 'error' | 'success';
  tag: string;
  name: string;
  lines: Array<[string, string]>;
  children?: React.ReactNode;
}) {
  const theme = useTheme();
  return (
    <Stack
      gap={1}
      sx={{
        p: 1.5,
        borderRadius: 3,
        border: `1px solid ${panelDivider(theme)}`,
        borderTop: `3px solid ${theme.palette[tone].main}`,
        minWidth: 0,
      }}
    >
      <Box>
        <StatusPill label={tag} tone={tone} />
        <Typography title={name} sx={{ fontSize: 13.5, fontWeight: 700, mt: 0.5, lineHeight: 1.3 }}>
          {name}
        </Typography>
      </Box>
      <Box component="dl" sx={{ m: 0, display: 'grid', gridTemplateColumns: '1fr auto', rowGap: 0.4, columnGap: 1 }}>
        {lines.map(([k, v]) => (
          <Box key={k} sx={{ display: 'contents' }}>
            <Typography component="dt" sx={{ fontSize: 12, color: 'text.secondary' }}>
              {k}
            </Typography>
            <Typography component="dd" sx={{ m: 0, fontSize: 12.5, fontWeight: 700, textAlign: 'right' }}>
              {v}
            </Typography>
          </Box>
        ))}
      </Box>
      {children && (
        <Stack gap={0.75} sx={{ mt: 'auto', pt: 0.5 }}>
          {children}
        </Stack>
      )}
    </Stack>
  );
}

export default function Recapture() {
  const theme = useTheme();
  const line = panelDivider(theme);
  const qc = useQueryClient();
  const [radiusMi, setRadiusMi] = useState(10);
  const [q, setQ] = useState('');
  const dq = useDeferredValue(q.trim().toLowerCase());
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [action, setAction] = useState<{ n: RecaptureNeighbor; mode: 'send' | 'add' } | null>(null);
  const confirm = useConfirm();
  const refresh = () => {
    setAction(null);
    void qc.invalidateQueries({ queryKey: ['recapture'] });
  };
  const undo = useMutation({
    mutationFn: ({ source, target }: { source: string; target: string }) => recaptureService.undo(source, target),
    onSuccess: (n) => {
      toast.success(`Se quitaron ${num(n)} números`);
      refresh();
    },
    onError: (e: any) => toast.error(e?.response?.data?.error || 'No se pudo deshacer'),
  });

  const { data, isLoading, isError, isFetching } = useQuery({
    queryKey: ['recapture', radiusMi],
    queryFn: () => recaptureService.get(Math.round(radiusMi * MI_KM)),
    staleTime: 5 * 60_000,
    placeholderData: (prev) => prev,
  });

  const rows = data?.rows ?? [];
  const listed = useMemo(
    () => rows.filter((r) => !dq || textHas(r.store.name, dq) || (r.store.zipCode || '').includes(dq)),
    [rows, dq]
  );
  // Por defecto la más grande que sí tiene a dónde mandar a su gente.
  const selected = rows.find((r) => r.store.id === selectedId) ?? rows.find((r) => r.nearby.length > 0) ?? rows[0] ?? null;
  const t = data?.totals;

  return (
    <Box sx={{ maxWidth: 1400, mx: 'auto', px: { xs: 1.5, sm: 3 }, py: { xs: 1.5, sm: 3 } }}>
      <Stack gap={2}>
        <PageHero
          eyebrow="Campañas · Audiencia"
          title="Recaptura de números"
          subtitle="Números de tiendas inactivas que nadie usa: mira qué tienda activa les queda cerca según el zip code e invítalos a suscribirse a ella."
          actions={
            <TextField
              select
              size="small"
              label="Radio"
              value={radiusMi}
              onChange={(e) => setRadiusMi(Number(e.target.value))}
              sx={{ minWidth: 120 }}
            >
              {RADII_MI.map((mi) => (
                <MenuItem key={mi} value={mi}>
                  {mi} millas
                </MenuItem>
              ))}
            </TextField>
          }
        />

        {isLoading ? (
          <>
            <Skeleton variant="rounded" height={96} sx={{ borderRadius: 4 }} />
            <Skeleton variant="rounded" height={480} sx={{ borderRadius: 4 }} />
          </>
        ) : isError || !t ? (
          <Alert severity="error">No se pudo cargar la recaptura.</Alert>
        ) : rows.length === 0 ? (
          <PanelCard>
            <EmptyBlock title="Nada que recapturar" hint="No hay tiendas inactivas con números activos." />
          </PanelCard>
        ) : (
          <Stack gap={2} sx={{ opacity: isFetching ? 0.6 : 1, transition: 'opacity .2s' }}>
            <KpiRow>
              <KpiCard label="Tiendas inactivas con números" value={num(t.inactiveStores)} />
              <KpiCard label="Números parados" value={num(t.numbers)} delta="no reciben campañas" tone="warning" />
              <KpiCard
                label="Con tienda activa cerca"
                value={num(t.reachableNumbers)}
                delta={`a ${radiusMi} mi o mismo zip`}
                tone="success"
              />
              <KpiCard label="Sin tienda cerca" value={num(t.isolatedNumbers)} delta="prueba un radio mayor" />
              <KpiCard label="Campañas de recaptura" value={num(t.campaigns)} />
            </KpiRow>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '340px 1fr' }, gap: 2, alignItems: 'start' }}>
              {/* ── Tiendas inactivas ── */}
              <PanelCard>
                <SectionHeader
                  icon={<StorefrontRoundedIcon sx={{ fontSize: 20, color: 'error.main' }} />}
                  title="Tiendas inactivas"
                  count={num(rows.length)}
                />
                <Box sx={{ p: 1.5, borderBottom: `1px solid ${line}` }}>
                  <TextField
                    size="small"
                    fullWidth
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Buscar tienda o zip"
                    inputProps={{ 'aria-label': 'Buscar tienda o zip' }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchRoundedIcon fontSize="small" />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Box>
                <Box sx={{ maxHeight: { xs: 300, md: 640 }, overflowY: 'auto' }}>
                  {listed.length === 0 && <EmptyBlock title="Sin resultados" hint="Ninguna tienda coincide con la búsqueda." />}
                  {listed.map((r) => {
                    const on = r.store.id === selected?.store.id;
                    return (
                      <Box
                        key={r.store.id}
                        component="button"
                        type="button"
                        onClick={() => setSelectedId(r.store.id)}
                        aria-pressed={on}
                        sx={{
                          all: 'unset',
                          boxSizing: 'border-box',
                          display: 'block',
                          width: '100%',
                          cursor: 'pointer',
                          px: 2,
                          py: 1.25,
                          borderBottom: `1px solid ${line}`,
                          borderLeft: `3px solid ${on ? theme.palette.primary.main : 'transparent'}`,
                          bgcolor: on ? 'action.selected' : 'transparent',
                          '&:hover': { bgcolor: 'action.hover' },
                          '&:focus-visible': { outline: `2px solid ${theme.palette.primary.main}`, outlineOffset: -2 },
                        }}
                      >
                        <Stack direction="row" alignItems="center" gap={1}>
                          <Typography noWrap title={r.store.name} sx={{ fontSize: 13, fontWeight: 700, flex: 1, minWidth: 0 }}>
                            {r.store.name}
                          </Typography>
                          <Typography sx={{ fontSize: 13, fontWeight: 800 }}>{num(r.store.audience)}</Typography>
                        </Stack>
                        <Stack direction="row" alignItems="center" gap={1} sx={{ mt: 0.25 }}>
                          <Typography sx={{ fontSize: 11.5, color: 'text.secondary', flex: 1 }}>Zip {r.store.zipCode || '—'}</Typography>
                          <StatusPill
                            label={r.nearby.length ? `${r.nearby.length} cerca` : 'Sin tienda cerca'}
                            tone={r.nearby.length ? 'success' : 'neutral'}
                            dot={false}
                          />
                          {r.campaigns.length > 0 && <StatusPill label="Con campaña" tone="info" dot={false} />}
                        </Stack>
                      </Box>
                    );
                  })}
                </Box>
              </PanelCard>

              {/* ── Detalle: mapa + tiendas activas cercanas ── */}
              {selected && (
                <Stack gap={2} sx={{ minWidth: 0 }}>
                  <RecaptureMap rows={rows} selected={selected} onSelect={setSelectedId} onPickNeighbor={(n) => setAction({ n, mode: 'send' })} />

                  <PanelCard>
                    <SectionHeader
                      icon={<PlaceRoundedIcon sx={{ fontSize: 20, color: 'success.main' }} />}
                      title={`Comparativo: ${selected.store.name} y sus tiendas cercanas`}
                      hint={`Zip ${selected.store.zipCode || '—'} · ${num(selected.store.audience)} números${selected.store.coords ? '' : ' · sin ubicación en el mapa'}`}
                    />
                    {selected.nearby.length === 0 ? (
                      <EmptyBlock
                        title="Ninguna tienda activa cerca"
                        hint="No hay tienda activa en su zip ni dentro del radio. Prueba un radio mayor."
                      />
                    ) : (
                      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: 1.5, p: 1.5 }}>
                        {/* La inactiva primero, como referencia de la comparación. */}
                        <CompareCard
                          tone="error"
                          tag="Inactiva"
                          name={selected.store.name}
                          lines={[
                            ['Zip', selected.store.zipCode || '—'],
                            ['Números activos', num(selected.store.audience)],
                            ['Tiendas activas cerca', num(selected.nearby.length)],
                          ]}
                        />
                        {selected.nearby.map((n) => (
                          <CompareCard
                            key={n.id}
                            tone="success"
                            tag="Activa"
                            name={n.name}
                            lines={[
                              ['Zip', n.zipCode || '—'],
                              ['Cercanía', how(n)],
                              ['Sus clientes', num(n.audience)],
                              ['Ya están ahí', num(n.alreadyThere)],
                              ['Por recuperar', num(n.recoverable)],
                            ]}
                          >
                            <Button
                              size="small"
                              variant="contained"
                              disableElevation
                              disabled={n.recoverable === 0}
                              onClick={() => setAction({ n, mode: 'send' })}
                              startIcon={<SendRoundedIcon />}
                              sx={{ borderRadius: 2.5, fontWeight: 700 }}
                            >
                              Enviar campaña
                            </Button>
                            <Button
                              size="small"
                              variant="outlined"
                              disabled={n.recoverable === 0}
                              onClick={() => setAction({ n, mode: 'add' })}
                              startIcon={<PersonAddAlt1RoundedIcon />}
                              sx={{ borderRadius: 2.5, fontWeight: 700 }}
                            >
                              Agregar a esta tienda
                            </Button>
                            {n.added > 0 && (
                              <Button
                                size="small"
                                color="inherit"
                                disabled={undo.isPending}
                                onClick={() =>
                                  void confirm({
                                    title: '¿Quitar los números agregados?',
                                    details: [
                                      ['Tienda', n.name],
                                      ['Venían de', selected.store.name],
                                      ['Se quitan', `${num(n.added)} números`],
                                    ],
                                    confirmLabel: 'Quitar',
                                  }).then((ok) => ok && undo.mutate({ source: selected.store.id, target: n.id }))
                                }
                                sx={{ fontSize: 12 }}
                              >
                                Deshacer {num(n.added)} agregados
                              </Button>
                            )}
                          </CompareCard>
                        ))}
                      </Box>
                    )}

                    {selected.campaigns.length > 0 && (
                      <Box sx={{ borderTop: `1px solid ${line}`, px: 2.25, py: 1.5 }}>
                        <Typography sx={{ fontSize: 12, fontWeight: 700, mb: 0.75 }}>Campañas de recaptura de esta tienda</Typography>
                        <Stack gap={0.75}>
                          {selected.campaigns.map((c) => (
                            <Stack key={c.id} direction="row" alignItems="center" gap={1} flexWrap="wrap" useFlexGap>
                              <StatusPill {...CAMPAIGN_STATUS[c.status]} />
                              <Typography sx={{ fontSize: 12.5 }}>
                                → {selected.nearby.find((n) => n.id === c.targetStoreId)?.name || c.title} ·{' '}
                                {new Date(c.startDate).toLocaleString('es')} · {num(c.audience)} números
                                {c.sent ? ` · ${num(c.sent)} enviados` : ''}
                              </Typography>
                            </Stack>
                          ))}
                        </Stack>
                      </Box>
                    )}
                    <Typography sx={{ px: 2.25, py: 1.5, fontSize: 12, color: 'text.secondary', borderTop: `1px solid ${line}` }}>
                      "Ya están ahí" = números de la tienda inactiva que ya son clientes de la tienda activa: no reciben la campaña.
                      "Agregar a esta tienda" los pasa directo, sin mensaje, y se puede deshacer. Los conteos se actualizan cada 30 minutos.
                    </Typography>
                  </PanelCard>
                </Stack>
              )}
            </Box>
          </Stack>
        )}
      </Stack>

      {action && selected && action.mode === 'send' && (
        <RecaptureSendDialog
          key={`${selected.store.id}-${action.n.id}`}
          source={selected.store}
          target={action.n}
          onClose={() => setAction(null)}
          onSent={refresh}
        />
      )}
      {action && selected && action.mode === 'add' && (
        <RecaptureAddDialog source={selected.store} target={action.n} onClose={() => setAction(null)} onDone={refresh} />
      )}
    </Box>
  );
}
