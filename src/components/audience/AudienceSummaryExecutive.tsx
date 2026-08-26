// src/components/audience/AudienceSummaryExecutive.tsx
'use client';

import { useAudienceStoresGrowth } from '@/hooks/fetching/campaigns/useAudienceStoresGrowth';
import type {
  AudienceStoreGrowthRow,
  AudienceStoresGrowthQueryParams,
  AudienceStoresGrowthSenderScope,
  AudienceStoresGrowthSort,
} from '@/services/campaing.service';
import DateRangeRoundedIcon from '@mui/icons-material/DateRangeRounded';
import DownloadRoundedIcon from '@mui/icons-material/DownloadRounded';
import LaunchRoundedIcon from '@mui/icons-material/LaunchRounded';
import TrendingUpRoundedIcon from '@mui/icons-material/TrendingUpRounded';
import {
  alpha,
  Avatar,
  Box,
  Button,
  Chip,
  Divider,
  FormControl,
  InputLabel,
  LinearProgress,
  MenuItem,
  Popover,
  Select,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { addDays, format as fmtDate, parseISO } from 'date-fns';
import { saveAs } from 'file-saver';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { DateRange, type RangeKeyDict } from 'react-date-range';
import { tint, tintBorder, toneText } from 'src/theme/semantic';
import { numeric, PanelCard } from './ui';

/* ===================== Types (mínimos) ===================== */
type GroupSummary = {
  storesCount: number;
  audiencePrev: number;
  audienceCurr: number;
  growthAbs: number;
  growthPct: number;
  newInPeriod: number;
  churnInPeriod: number;
  netGrowth: number;
};

type AudienceSummaryResponse = {
  period?: { start: string; end: string };
  previousPeriod?: { start: string; end: string };
  senders?: GroupSummary;
  nonSenders?: GroupSummary;
};

type Props = {
  data?: AudienceSummaryResponse;
  loading?: boolean;
  error?: boolean;
  onExploreClick?: () => void;

  period?: AudienceStoresGrowthQueryParams['period'];
  year?: number;
  start?: string;
  end?: string;

  includeInactive?: boolean;
  status?: 'active' | 'inactive' | 'all';
};

// Formateador de números reutilizable (locale + opciones literales)
const enUsNumberFmt = new Intl.NumberFormat('en-US');

function fmt(n: any) {
  const num = Number(n ?? 0);
  if (!Number.isFinite(num)) return '0';
  return enUsNumberFmt.format(num);
}
function fmtPct(n: any) {
  const num = Number(n ?? 0);
  if (!Number.isFinite(num)) return '0.00%';
  return `${num.toFixed(2)}%`;
}
function isoDateOnly(d: Date) {
  return fmtDate(d, 'yyyy-MM-dd');
}
function safeParseIsoDateOnly(s?: string) {
  if (!s) return null;
  try {
    const d = parseISO(s);
    return Number.isNaN(d.getTime()) ? null : d;
  } catch {
    return null;
  }
}

/* ===================== Sort presets ===================== */
const SORTS: Array<{ label: string; value: AudienceStoresGrowthSort }> = [
  { label: 'Los que menos crecieron', value: 'growthAbsAsc' }, // ✅ default
  { label: 'Los que más crecieron', value: 'growthAbsDesc' },
  { label: 'Menor crecimiento %', value: 'growthPctAsc' },
  { label: 'Mayor crecimiento %', value: 'growthPctDesc' },
  { label: 'Más audiencia', value: 'audienceDesc' },
  { label: 'Menos audiencia', value: 'audienceAsc' },
  { label: 'Menor neto', value: 'netGrowthAsc' },
  { label: 'Mayor neto', value: 'netGrowthDesc' },
  { label: 'Menos altas', value: 'newAsc' },
  { label: 'Más altas', value: 'newDesc' },
  { label: 'Menos bajas', value: 'churnAsc' },
  { label: 'Más bajas', value: 'churnDesc' },
  { label: 'Nombre A→Z', value: 'nameAsc' },
  { label: 'Nombre Z→A', value: 'nameDesc' },
];

const PAGE_SIZES = [10, 15, 20, 30, 50, 100, 200] as const;

/* ===================== Summary tile ===================== */
/**
 * Píldora de resumen. Antes era `borderRadius: 999` con `fontWeight: 980`: un
 * peso que no existe en la escala y un radio de botón sobre un bloque de datos.
 */
function SummaryTile(props: {
  label: string;
  value: string;
  hint?: string;
  tone: 'success' | 'warning' | 'info';
}) {
  const { label, value, hint, tone } = props;

  return (
    <Stack
      sx={(t) => ({
        borderRadius: 1.5,
        border: `1px solid ${tintBorder(t, tone, 0.2)}`,
        bgcolor: tint(t, tone),
        px: 1.75,
        py: 1.25,
        gap: 0.25,
        minWidth: 0,
      })}
    >
      <Typography
        variant="caption"
        sx={{ color: 'text.secondary', fontWeight: 600 }}
        noWrap
      >
        {label}
      </Typography>
      <Typography
        variant="h6"
        sx={(t) => ({ fontWeight: 700, lineHeight: 1.2, color: toneText(t, tone), ...numeric })}
        noWrap
      >
        {value}
      </Typography>
      {hint ? (
        <Typography
          variant="caption"
          sx={{ color: 'text.secondary' }}
          noWrap
        >
          {hint}
        </Typography>
      ) : null}
    </Stack>
  );
}

/* ===================== Store row (no slug + clickable) ===================== */
function StoreRowItem({ row, idx }: { row: AudienceStoreGrowthRow; idx: number }) {
  const name = row.name || 'Negocio sin nombre';
  const id = row.storeId;

  // ✅ tu backend retorna "image"
  const image = (row as any).image || null;

  const aud = Number(row.audienceCurr || 0);
  const net = Number(row.netGrowth || 0);
  const pct = Number(row.growthPct || 0);

  return (
    <Link
      href={`/admin/management/stores/edit/${id}`}
      passHref
      legacyBehavior
    >
      <Box
        component="a"
        sx={(t) => ({
          display: 'block',
          textDecoration: 'none',
          color: 'inherit',
          outline: 'none',
          '&:focus-visible .row': {
            outline: `2px solid ${t.palette.primary.main}`,
            outlineOffset: -2,
          },
        })}
      >
        <Stack
          className="row"
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          gap={1.25}
          sx={(t) => ({
            px: 1.25,
            py: 0.95,
            borderBottom: `1px solid ${alpha(t.palette.divider, 0.6)}`,
            '&:hover': { bgcolor: alpha(t.palette.text.primary, 0.035) },
            borderRadius: 0,
            minWidth: 0,
            transition: 'background-color 120ms ease, box-shadow 120ms ease',
          })}
        >
          <Stack
            direction="row"
            alignItems="center"
            gap={1.1}
            sx={{ minWidth: 0, flex: 1 }}
          >
            <Avatar
              src={image ?? undefined}
              variant="rounded"
              sx={(t) => ({
                width: 32,
                height: 32,
                borderRadius: 1.5,
                bgcolor: tint(t, 'primary'),
                color: toneText(t, 'primary'),
                fontWeight: 700,
                fontSize: 14,
                flexShrink: 0,
              })}
            >
              {String(name).trim().slice(0, 1).toUpperCase()}
            </Avatar>

            <Typography
              variant="body2"
              sx={{
                fontWeight: 600,
                lineHeight: 1.15,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
              title={name}
            >
              <Box
                component="span"
                sx={{ color: 'text.disabled', ...numeric, mr: 0.75 }}
              >
                {idx + 1}
              </Box>
              {name}
            </Typography>
          </Stack>

          <Stack
            direction="row"
            gap={0.75}
            alignItems="center"
            sx={{ flexShrink: 0, flexWrap: 'wrap' }}
          >
            {/* Audiencia en texto plano; sólo el neto y el % llevan color, que es
                lo único que cambia de signo y hay que poder escanear. */}
            <Typography
              variant="body2"
              sx={{ ...numeric, color: 'text.secondary', minWidth: 62, textAlign: 'right' }}
              title={`${fmt(aud)} contactos`}
            >
              {fmt(aud)}
            </Typography>
            <Chip
              size="small"
              label={`${net >= 0 ? '+' : ''}${fmt(net)}`}
              sx={(t) => ({
                fontWeight: 600,
                minWidth: 68,
                ...numeric,
                bgcolor: tint(t, net >= 0 ? 'success' : 'error'),
                color: toneText(t, net >= 0 ? 'success' : 'error'),
              })}
            />
            <Chip
              size="small"
              label={fmtPct(pct)}
              sx={(t) => ({
                fontWeight: 600,
                minWidth: 68,
                ...numeric,
                bgcolor: tint(t, pct >= 0 ? 'success' : 'error', 0.06),
                color: pct >= 0 ? toneText(t, 'success') : toneText(t, 'error'),
              })}
            />
          </Stack>
        </Stack>
      </Box>
    </Link>
  );
}

export function AudienceSummaryExecutive({
  data,
  loading: loadingSummary,
  error: errorSummary,
  onExploreClick,
  year,
  start,
  end,
  includeInactive = false,
  status,
}: Props) {
  const theme = useTheme();
  const mdDown = useMediaQuery(theme.breakpoints.down('md'));
  const smDown = useMediaQuery(theme.breakpoints.down('sm'));

  /* ===================== DateRange (react-date-range) ===================== */
  const initialStart =
    safeParseIsoDateOnly(start) ||
    safeParseIsoDateOnly(data?.period?.start) ||
    addDays(new Date(), -30);
  const initialEnd =
    safeParseIsoDateOnly(end) || safeParseIsoDateOnly(data?.period?.end) || new Date();

  const [dateAnchor, setDateAnchor] = useState<HTMLElement | null>(null);
  const dateOpen = Boolean(dateAnchor);

  const [range, setRange] = useState({
    startDate: initialStart,
    endDate: initialEnd,
    key: 'selection',
  });

  const rangeLabel = useMemo(() => {
    const a = range.startDate ? fmtDate(range.startDate, 'MMM dd, yyyy') : '—';
    const b = range.endDate ? fmtDate(range.endDate, 'MMM dd, yyyy') : '—';
    return `${a} → ${b}`;
  }, [range.startDate, range.endDate]);

  /* ===================== filtros list ===================== */
  const [senderScope, setSenderScope] = useState<AudienceStoresGrowthSenderScope>('all');
  const [sort, setSort] = useState<AudienceStoresGrowthSort>('growthAbsAsc'); // ✅ default: menos crecieron
  const [limit, setLimit] = useState<(typeof PAGE_SIZES)[number]>(20);
  const [page] = useState<number>(1);

  const storesGrowthParams = useMemo<AudienceStoresGrowthQueryParams>(() => {
    const p: any = {
      period: 'custom',
      includeInactive,
      status,
      senderScope,
      sort,
      page,
      limit,
      start: isoDateOnly(range.startDate || new Date()),
      end: isoDateOnly(range.endDate || new Date()),
    };
    if (typeof year === 'number') p.year = year;
    return p;
  }, [
    includeInactive,
    status,
    senderScope,
    sort,
    page,
    limit,
    year,
    range.startDate,
    range.endDate,
  ]);

  const {
    data: growthRes,
    isLoading: loadingGrowth,
    isFetching: fetchingGrowth,
    isError: errorGrowth,
  } = useAudienceStoresGrowth(storesGrowthParams, {
    staleTime: 30_000,
    gcTime: 5 * 60_000,
    refetchOnWindowFocus: false,
  });

  const senders = data?.senders;
  const nonSenders = data?.nonSenders;

  const totalChurn = (senders?.churnInPeriod || 0) + (nonSenders?.churnInPeriod || 0);
  const rows = growthRes?.data || [];

  const anyLoading = loadingSummary || loadingGrowth;
  const anyError = !!errorSummary || !!errorGrowth;

  /* ===================== Export Excel ===================== */
  async function exportToExcel() {
    const XLSX = await import('xlsx');
    const payload = rows.map((r) => ({
      storeId: r.storeId,
      name: r.name,
      active: r.active,
      isSender: r.isSender,
      image: (r as any).image ?? null,
      audiencePrev: r.audiencePrev,
      audienceCurr: r.audienceCurr,
      growthAbs: r.growthAbs,
      growthPct: r.growthPct,
      newInPeriod: r.newInPeriod,
      churnInPeriod: r.churnInPeriod,
      netGrowth: r.netGrowth,
    }));

    const ws = XLSX.utils.json_to_sheet(payload);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'stores_growth');

    const fileBase = `stores-growth_${storesGrowthParams.start}_${storesGrowthParams.end}_${senderScope}_${sort}_${limit}.xlsx`;
    const out = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    saveAs(
      new Blob([out], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      }),
      fileBase
    );
  }

  const takeaway = useMemo(() => {
    const ns = fmtPct(nonSenders?.growthPct);
    const s = fmtPct(senders?.growthPct);
    if (senderScope === 'nonSenders')
      return `Los que no mandan campañas crecieron ${ns}; los que sí, ${s}. Empezá por los de abajo de la lista.`;
    if (senderScope === 'senders')
      return `Los que mandan campañas crecieron ${s}. Mantener la cadencia y replicarla.`;
    return `Sin campañas ${ns} vs con campañas ${s} en el período.`;
  }, [nonSenders?.growthPct, senders?.growthPct, senderScope]);

  const listTitle = useMemo(() => {
    const scopeLabel =
      senderScope === 'senders'
        ? 'con campañas'
        : senderScope === 'nonSenders'
          ? 'sin campañas'
          : 'todos';
    const sortLabel = SORTS.find((x) => x.value === sort)?.label ?? sort;
    return `Negocios ${scopeLabel} · ${sortLabel}`;
  }, [senderScope, sort]);

  return (
    <PanelCard
      title="Detalle por negocio"
      subtitle="Quién creció, quién se quedó y quién perdió contactos"
      icon={<TrendingUpRoundedIcon fontSize="small" />}
      right={
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          gap={1}
          alignItems={{ xs: 'stretch', sm: 'center' }}
        >
          <Chip
            size="small"
            icon={<DateRangeRoundedIcon />}
            label={rangeLabel}
            onClick={(e) => setDateAnchor(e.currentTarget)}
            variant="outlined"
            sx={{ fontWeight: 600, cursor: 'pointer' }}
          />

          <Button
            size="small"
            variant="outlined"
            endIcon={!smDown ? <LaunchRoundedIcon /> : undefined}
            onClick={onExploreClick}
            sx={{ textTransform: 'none', fontWeight: 600 }}
          >
            Explorar
          </Button>
        </Stack>
      }
    >
      <Popover
        open={dateOpen}
        anchorEl={dateAnchor}
        onClose={() => setDateAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        PaperProps={{
          sx: (t) => ({
            p: 1,
            borderRadius: 3,
            border: `1px solid ${alpha(t.palette.divider, 0.6)}`,
            bgcolor: alpha(t.palette.background.paper, 0.98),
          }),
        }}
      >
        <DateRange
          ranges={[range]}
          onChange={(item: RangeKeyDict) => {
            const sel = item.selection;
            setRange((prev) => ({
              ...prev,
              startDate: sel.startDate || prev.startDate,
              endDate: sel.endDate || prev.endDate,
            }));
          }}
          months={mdDown ? 1 : 2}
          direction={mdDown ? 'vertical' : 'horizontal'}
          moveRangeOnFirstSelection={false}
          showDateDisplay={false}
          rangeColors={[theme.palette.primary.main]}
        />

        <Stack
          direction="row"
          gap={1}
          justifyContent="flex-end"
          sx={{ px: 1, pb: 0.5 }}
        >
          <Button
            size="small"
            onClick={() => setDateAnchor(null)}
            sx={{ textTransform: 'none', fontWeight: 600 }}
          >
            Listo
          </Button>
        </Stack>
      </Popover>

      {anyLoading ? <LinearProgress sx={{ mb: 1.25 }} /> : null}
      {fetchingGrowth && !loadingGrowth ? (
        <Typography
          variant="caption"
          sx={{ color: 'text.secondary', display: 'block', mb: 1 }}
        >
          Actualizando la lista…
        </Typography>
      ) : null}

      {anyError ? (
        <Typography
          color="error"
          variant="body2"
          sx={{ mb: 1 }}
        >
          No se pudo cargar el resumen.
        </Typography>
      ) : null}

      {/* ===================== Resumen del período ===================== */}
      <Stack gap={1.25}>
        <Box
          sx={{
            display: 'grid',
            gap: 1.25,
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' },
          }}
        >
          <SummaryTile
            label="Crecimiento con campañas"
            value={`${fmt(senders?.growthAbs)} · ${fmtPct(senders?.growthPct)}`}
            hint={`${fmt(senders?.newInPeriod)} altas · ${fmt(senders?.churnInPeriod)} bajas`}
            tone="success"
          />
          <SummaryTile
            label="Crecimiento sin campañas"
            value={`${fmt(nonSenders?.growthAbs)} · ${fmtPct(nonSenders?.growthPct)}`}
            hint={`${fmt(nonSenders?.newInPeriod)} altas · ${fmt(nonSenders?.churnInPeriod)} bajas`}
            tone="warning"
          />
          <SummaryTile
            label="Bajas del período"
            value={fmt(totalChurn)}
            hint="Contactos que dejaron de estar en alguna base"
            tone="info"
          />
        </Box>

        <Stack
          gap={0.35}
          sx={(t) => ({
            borderRadius: 1.5,
            px: 1.75,
            py: 1.25,
            border: `1px solid ${alpha(t.palette.divider, 0.8)}`,
          })}
        >
          <Typography
            variant="subtitle2"
            sx={{ fontWeight: 700, lineHeight: 1.2 }}
          >
            Lectura
          </Typography>
          <Typography
            variant="body2"
            sx={{ color: 'text.secondary', lineHeight: 1.4 }}
          >
            {takeaway}
          </Typography>
        </Stack>
      </Stack>

      <Divider sx={{ my: 1.5 }} />

      {/* ===================== BOTTOM: filters + list ===================== */}
      <Stack spacing={1.1}>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          gap={1}
          alignItems={{ xs: 'stretch', md: 'center' }}
          justifyContent="space-between"
          sx={{ minWidth: 0 }}
        >
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            gap={1}
            sx={{ minWidth: 0, flexWrap: 'wrap' }}
          >
            <FormControl
              size="small"
              sx={{ minWidth: { xs: '100%', sm: 220 } }}
            >
              <InputLabel id="sender-scope-label">Alcance</InputLabel>
              <Select
                labelId="sender-scope-label"
                label="Alcance"
                value={senderScope}
                onChange={(e) => setSenderScope(e.target.value as AudienceStoresGrowthSenderScope)}
              >
                <MenuItem value="all">Todos los negocios</MenuItem>
                <MenuItem value="senders">Con campañas</MenuItem>
                <MenuItem value="nonSenders">Sin campañas</MenuItem>
              </Select>
            </FormControl>

            <FormControl
              size="small"
              sx={{ minWidth: { xs: '100%', sm: 260 } }}
            >
              <InputLabel id="sort-label">Orden</InputLabel>
              <Select
                labelId="sort-label"
                label="Orden"
                value={sort}
                onChange={(e) => setSort(e.target.value as any)}
              >
                {SORTS.map((opt) => (
                  <MenuItem
                    key={opt.value}
                    value={opt.value}
                  >
                    {opt.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl
              size="small"
              sx={{ minWidth: { xs: '100%', sm: 160 } }}
            >
              <InputLabel id="limit-label">Mostrar</InputLabel>
              <Select
                labelId="limit-label"
                label="Mostrar"
                value={limit}
                onChange={(e) => setLimit(Number(e.target.value) as any)}
              >
                {PAGE_SIZES.map((n) => (
                  <MenuItem
                    key={n}
                    value={n}
                  >
                    {n} filas
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Button
              size="small"
              variant="outlined"
              startIcon={<DownloadRoundedIcon />}
              onClick={exportToExcel}
              disabled={loadingGrowth || rows.length === 0}
              sx={{ textTransform: 'none', fontWeight: 600 }}
            >
              Exportar
            </Button>
          </Stack>
        </Stack>

        <Stack
          sx={(t) => ({
            border: `1px solid ${alpha(t.palette.divider, 0.7)}`,
            borderRadius: 3,
            overflow: 'hidden',
            bgcolor: alpha(t.palette.background.paper, 0.5),
          })}
        >
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            gap={1}
            sx={(t) => ({
              px: 1.5,
              py: 1,
              bgcolor: alpha(t.palette.text.primary, t.palette.mode === 'dark' ? 0.05 : 0.025),
            })}
          >
            <Typography
              variant="body2"
              sx={{
                fontWeight: 600,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
              title={listTitle}
            >
              {listTitle}
            </Typography>

            {/* Leyenda de las tres columnas de la derecha: sin esto los chips
                son tres números sin nombre. */}
            <Stack
              direction="row"
              gap={0.75}
              alignItems="center"
              flexShrink={0}
              sx={{ display: { xs: 'none', sm: 'flex' } }}
            >
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ minWidth: 62, textAlign: 'right' }}
              >
                Audiencia
              </Typography>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ minWidth: 68, textAlign: 'center' }}
              >
                Neto
              </Typography>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ minWidth: 68, textAlign: 'center' }}
              >
                Variación
              </Typography>
            </Stack>
          </Stack>

          <Divider />

          <Box sx={{ maxHeight: { xs: 440, md: 520 }, overflow: 'auto' }}>
            {loadingGrowth ? (
              <Stack sx={{ p: 2 }}>
                <Typography
                  variant="body2"
                  sx={{ color: 'text.secondary' }}
                >
                  Cargando negocios…
                </Typography>
              </Stack>
            ) : null}

            {!loadingGrowth && rows.length === 0 ? (
              <Stack sx={{ p: 2 }}>
                <Typography
                  variant="body2"
                  sx={{ color: 'text.secondary' }}
                >
                  Ningún negocio coincide con estos filtros.
                </Typography>
              </Stack>
            ) : null}

            {rows.map((r, idx) => (
              <StoreRowItem
                key={`${r.storeId}-${idx}`}
                row={r}
                idx={idx}
              />
            ))}
          </Box>
        </Stack>
      </Stack>
    </PanelCard>
  );
}
