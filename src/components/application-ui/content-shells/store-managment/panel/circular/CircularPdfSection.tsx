'use client';

/**
 * 3 · Circular en PDF (respaldo manual): traer del link de la tienda, agendar con archivo y
 * el historial. El estado del formulario vive acá: escribir un título o arrastrar un PDF ya
 * no re-renderiza el flujo de la campaña ni el circular de arriba.
 */
import { circularService, type Circular } from '@/services/circular.service';
import CalendarMonthRoundedIcon from '@mui/icons-material/CalendarMonthRounded';
import CampaignOutlinedIcon from '@mui/icons-material/CampaignOutlined';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import CloudUploadOutlinedIcon from '@mui/icons-material/CloudUploadOutlined';
import EventAvailableOutlinedIcon from '@mui/icons-material/EventAvailableOutlined';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import LinkRoundedIcon from '@mui/icons-material/LinkRounded';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import {
  alpha,
  Box,
  Button,
  Chip,
  IconButton,
  LinearProgress,
  Link as MuiLink,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { memo, useCallback, useState } from 'react';
import toast from 'react-hot-toast';
import {
  productCount,
  qk,
  useCircularBusy,
  useCircularPreview,
  useExtractProducts,
  useLoadCatalog,
  useStoreCirculars,
} from './hooks';
import { Meta, SectionHeader, Surface } from './panelUi';
import { circularLabel, fmtDate, statusChip } from './shared';
import { ListRowsSkeleton } from './skeletons';

// Lo que se extrae solo al traer/agendar con archivo: los de foto grande (rápido).
const AUTO_EXTRACT = 20;
const HISTORY_PREVIEW = 4;

type Props = {
  storeSlug: string;
  storeName?: string;
  circularssUrl?: string;
  onPreview: (url: string, title: string) => void;
};

export default function CircularPdfSection({
  storeSlug,
  storeName,
  circularssUrl,
  onPreview,
}: Props) {
  return (
    <Surface>
      <Stack spacing={2.5}>
        <SectionHeader
          step={3}
          title="Circular en PDF"
          description="Para cuando la tienda manda su circular en PDF o hay que agendar uno sin campaña."
        />
        <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: '1fr 1.4fr' } }}>
          <ImportFromLink
            storeSlug={storeSlug}
            circularssUrl={circularssUrl}
          />
          <ScheduleForm storeSlug={storeSlug} />
        </Box>
        <History
          storeSlug={storeSlug}
          storeName={storeName}
          onPreview={onPreview}
        />
      </Stack>
    </Surface>
  );
}

const cardSx = {
  p: 2,
  borderRadius: 2,
  border: '1px solid',
  borderColor: 'divider',
  display: 'flex',
  flexDirection: 'column',
  gap: 1.5,
} as const;

function ImportFromLink({
  storeSlug,
  circularssUrl,
}: {
  storeSlug: string;
  circularssUrl?: string;
}) {
  const qc = useQueryClient();
  const { hasCurrent } = useStoreCirculars(storeSlug);
  const extract = useExtractProducts(storeSlug);
  const importFromUrl = useMutation({
    mutationFn: () => circularService.importFromStoreUrl(storeSlug),
    onSuccess: (d: any) => {
      qc.invalidateQueries({ queryKey: qk.circulars(storeSlug) });
      toast.success('Circular de la semana importado — extrayendo productos con IA…');
      if (d?.circular?._id) extract.mutate({ id: d.circular._id, max: AUTO_EXTRACT });
    },
    onError: (e: any) => toast.error(e?.response?.data?.error || 'No se pudo traer el circular'),
  });

  return (
    <Box sx={cardSx}>
      <Stack
        direction="row"
        alignItems="center"
        gap={1}
      >
        <LinkRoundedIcon color="primary" />
        <Typography
          variant="subtitle2"
          fontWeight={700}
        >
          Traer del link de la tienda
        </Typography>
      </Stack>
      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ flex: 1 }}
      >
        {!circularssUrl
          ? 'La tienda no tiene link de circular. Cárgalo en los datos de la tienda o sube el PDF al lado.'
          : hasCurrent
            ? 'Ya hay un circular vigente o agendado para esta semana.'
            : 'Baja el PDF de esta semana, crea el circular y la IA carga sus productos.'}
      </Typography>
      <Stack
        direction="row"
        alignItems="center"
        gap={1.5}
        flexWrap="wrap"
      >
        <Button
          variant={hasCurrent ? 'outlined' : 'contained'}
          disabled={!circularssUrl || hasCurrent || importFromUrl.isPending}
          onClick={() => importFromUrl.mutate()}
        >
          {importFromUrl.isPending ? 'Trayendo…' : 'Traer circular de la semana'}
        </Button>
        {circularssUrl && (
          <MuiLink
            href={/^https?:\/\//i.test(circularssUrl) ? circularssUrl : `https://${circularssUrl}`}
            target="_blank"
            rel="noopener"
            variant="body2"
            underline="hover"
          >
            Abrir link
          </MuiLink>
        )}
      </Stack>
      {importFromUrl.isPending && <LinearProgress sx={{ borderRadius: 1 }} />}
    </Box>
  );
}

function ScheduleForm({ storeSlug }: { storeSlug: string }) {
  const qc = useQueryClient();
  const extract = useExtractProducts(storeSlug);
  const [title, setTitle] = useState('');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const badRange = !!start && !!end && end < start;

  const create = useMutation({
    mutationFn: () =>
      file
        ? circularService.upload({
            file,
            storeSlug,
            startDate: start,
            endDate: end,
            title: title || undefined,
          })
        : circularService.schedule({
            storeSlug,
            startDate: start,
            endDate: end,
            title: title || undefined,
          }),
    onSuccess: (d: any) => {
      const hadFile = !!file;
      setTitle('');
      setStart('');
      setEnd('');
      setFile(null);
      qc.invalidateQueries({ queryKey: qk.circulars(storeSlug) });
      // Con archivo la extracción arranca sola: antes quedaba agendado con 0 productos.
      if (hadFile && d?.circular?._id) {
        toast.success('Circular subido — extrayendo productos con IA…');
        extract.mutate({ id: d.circular._id, max: AUTO_EXTRACT });
      } else {
        toast.success('Circular agendado (sin archivo aún)');
      }
    },
    onError: (e: any) => toast.error(e?.response?.data?.error || e.message || 'No se pudo agendar'),
  });

  return (
    <Box sx={cardSx}>
      <Stack
        direction="row"
        alignItems="center"
        gap={1}
      >
        <EventAvailableOutlinedIcon color="primary" />
        <Typography
          variant="subtitle2"
          fontWeight={700}
        >
          Agendar circular
        </Typography>
      </Stack>
      <Box
        component="label"
        onDragOver={(e: React.DragEvent) => {
          e.preventDefault();
          if (!dragOver) setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e: React.DragEvent) => {
          e.preventDefault();
          setDragOver(false);
          const f = e.dataTransfer.files?.[0];
          if (f) setFile(f);
        }}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          px: 2,
          py: 1.5,
          borderRadius: 2,
          cursor: 'pointer',
          border: '1.5px dashed',
          borderColor: dragOver ? 'primary.main' : 'divider',
          bgcolor: (t) => (dragOver ? alpha(t.palette.primary.main, 0.04) : 'transparent'),
          transition: 'border-color .15s, background-color .15s',
          '&:hover': { borderColor: 'primary.main' },
        }}
      >
        <CloudUploadOutlinedIcon color={file ? 'primary' : 'disabled'} />
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography
            variant="body2"
            fontWeight={600}
            noWrap
          >
            {file ? file.name : 'Arrastra el PDF o la imagen, o haz clic'}
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ fontSize: 12.5 }}
          >
            {file
              ? `${(file.size / 1048576).toFixed(1)} MB · la IA extrae los productos al agendar`
              : 'Opcional: sin archivo queda agendado y se adjunta después'}
          </Typography>
        </Box>
        {file && (
          <IconButton
            size="small"
            aria-label="Quitar archivo"
            onClick={(e) => {
              e.preventDefault();
              setFile(null);
            }}
          >
            <CloseRoundedIcon fontSize="small" />
          </IconButton>
        )}
        <input
          hidden
          type="file"
          accept="application/pdf,image/*"
          onChange={(e) => {
            setFile(e.target.files?.[0] ?? null);
            e.target.value = '';
          }}
        />
      </Box>
      <Box
        sx={{ display: 'grid', gap: 1.5, gridTemplateColumns: { xs: '1fr', sm: '1.3fr 1fr 1fr' } }}
      >
        <TextField
          size="small"
          label="Título (opcional)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <TextField
          size="small"
          label="Inicio"
          type="date"
          value={start}
          onChange={(e) => setStart(e.target.value)}
          InputLabelProps={{ shrink: true }}
        />
        <TextField
          size="small"
          label="Fin"
          type="date"
          value={end}
          onChange={(e) => setEnd(e.target.value)}
          InputLabelProps={{ shrink: true }}
          error={badRange}
        />
      </Box>
      <Button
        variant="contained"
        disabled={create.isPending || !start || !end || badRange}
        onClick={() => create.mutate()}
        sx={{ alignSelf: 'flex-end' }}
      >
        {create.isPending ? 'Agendando…' : file ? 'Agendar y extraer' : 'Agendar'}
      </Button>
    </Box>
  );
}

function History({
  storeSlug,
  storeName,
  onPreview,
}: {
  storeSlug: string;
  storeName?: string;
  onPreview: (url: string, title: string) => void;
}) {
  const { items, top, isLoading } = useStoreCirculars(storeSlug);
  const { extracting, loading } = useCircularBusy(storeSlug);
  const extract = useExtractProducts(storeSlug);
  const loadCatalog = useLoadCatalog(storeSlug);
  const preview = useCircularPreview(onPreview);
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? items : items.slice(0, HISTORY_PREVIEW);
  // Estables (mutate de React Query no cambia): las filas memo no se re-renderizan de más.
  const { mutate: runExtract } = extract;
  const { mutate: runLoad } = loadCatalog;
  const { mutate: runPreview } = preview;
  const onExtract = useCallback(
    (c: Circular) => runExtract({ id: c._id, max: AUTO_EXTRACT }),
    [runExtract]
  );
  const onLoad = useCallback((c: Circular) => runLoad(c._id), [runLoad]);
  const onOpen = useCallback((c: Circular) => runPreview(c), [runPreview]);

  return (
    <Box>
      <Stack
        direction="row"
        alignItems="baseline"
        justifyContent="space-between"
        sx={{ mb: 1 }}
      >
        <Typography
          variant="subtitle2"
          fontWeight={700}
        >
          Historial de circulares
        </Typography>
        <Typography
          variant="body2"
          color="text.secondary"
        >
          {items.length} en total
        </Typography>
      </Stack>
      {isLoading ? (
        <ListRowsSkeleton rows={HISTORY_PREVIEW} />
      ) : !items.length ? (
        <Box
          sx={{
            p: 3,
            textAlign: 'center',
            borderRadius: 2,
            border: '1px dashed',
            borderColor: 'divider',
          }}
        >
          <Typography
            variant="body2"
            color="text.secondary"
          >
            Esta tienda todavía no tiene circulares.
          </Typography>
        </Box>
      ) : (
        <Box
          sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}
        >
          {visible.map((c, i) => (
            <HistoryRow
              key={c._id}
              c={c}
              first={i === 0}
              isTop={c._id === top?._id}
              label={circularLabel(c, storeSlug, storeName)}
              extracting={extracting}
              loading={loading}
              previewing={preview.isPending}
              onExtract={onExtract}
              onLoad={onLoad}
              onPreview={onOpen}
            />
          ))}
          {items.length > HISTORY_PREVIEW && (
            <Button
              fullWidth
              onClick={() => setShowAll((v) => !v)}
              sx={{ borderTop: '1px solid', borderColor: 'divider', borderRadius: 0, py: 1 }}
            >
              {showAll ? 'Ver menos' : `Ver los ${items.length} circulares`}
            </Button>
          )}
        </Box>
      )}
    </Box>
  );
}

const HistoryRow = memo(function HistoryRow({
  c,
  first,
  isTop,
  label,
  extracting,
  loading,
  previewing,
  onExtract,
  onLoad,
  onPreview,
}: {
  c: Circular;
  first: boolean;
  isTop: boolean;
  label: string;
  extracting: boolean;
  loading: boolean;
  previewing: boolean;
  onExtract: (c: Circular) => void;
  onLoad: (c: Circular) => void;
  onPreview: (c: Circular) => void;
}) {
  const n = productCount(c);
  return (
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      alignItems={{ sm: 'center' }}
      gap={{ xs: 1, sm: 2 }}
      sx={{
        px: 2,
        py: 1.5,
        borderTop: first ? 'none' : '1px solid',
        borderColor: 'divider',
        bgcolor: (t) => (isTop ? alpha(t.palette.primary.main, 0.03) : 'transparent'),
        '&:hover': { bgcolor: 'action.hover' },
      }}
    >
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Stack
          direction="row"
          alignItems="center"
          gap={1}
          flexWrap="wrap"
        >
          <Typography
            variant="body2"
            fontWeight={700}
            noWrap
            sx={{ maxWidth: '100%' }}
          >
            {label}
          </Typography>
          {c.fileKey === 'campaign' && (
            <Chip
              size="small"
              variant="outlined"
              color="primary"
              icon={<CampaignOutlinedIcon />}
              label="Campaña"
              sx={{ height: 22 }}
            />
          )}
          {isTop && (
            <Chip
              size="small"
              variant="outlined"
              label="Arriba"
              sx={{ height: 22 }}
            />
          )}
        </Stack>
        <Stack
          direction="row"
          gap={2}
          flexWrap="wrap"
          sx={{ mt: 0.25 }}
        >
          <Meta icon={<CalendarMonthRoundedIcon />}>
            {fmtDate(c.startDate)} → {fmtDate(c.endDate)}
          </Meta>
          <Meta icon={<Inventory2OutlinedIcon />}>
            {n} producto{n !== 1 ? 's' : ''}
          </Meta>
        </Stack>
      </Box>
      <Stack
        direction="row"
        alignItems="center"
        gap={0.5}
        sx={{ flexShrink: 0 }}
      >
        <Chip
          size="small"
          {...statusChip(c.status)}
          sx={{ minWidth: 84 }}
        />
        {c.fileUrl && !n && (
          <Button
            size="small"
            disabled={extracting}
            onClick={() => onExtract(c)}
          >
            Extraer
          </Button>
        )}
        {!!n && (
          <Button
            size="small"
            disabled={loading}
            onClick={() => onLoad(c)}
          >
            Al catálogo
          </Button>
        )}
        <Tooltip title={c.fileUrl ? 'Ver circular' : 'Sin archivo'}>
          <span>
            <IconButton
              size="small"
              disabled={!c.fileUrl || previewing}
              onClick={() => onPreview(c)}
              aria-label="Ver circular"
            >
              <VisibilityOutlinedIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
      </Stack>
    </Stack>
  );
});
