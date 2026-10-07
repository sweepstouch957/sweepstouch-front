'use client';

/**
 * Estado de la lista del cliente, de un vistazo: cuántos productos ve HOY, cuántos están
 * ocultos, cuántos esperan su fecha, y qué flyer o circular manda. Es la primera pregunta de
 * la tienda ("¿cuántos salen?") y antes había que ir a Productos y contar. Desde acá se ve el
 * flyer vigente y se manda a los agentes a arreglarlo (duplicados, visibilidad, auditoría).
 */
import { circularService } from '@/services/circular.service';
import SmartToyOutlinedIcon from '@mui/icons-material/SmartToyOutlined';
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import {
  alpha,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Skeleton,
  Stack,
  Typography,
} from '@mui/material';
import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { useCatalogSummary, useRefreshStoreData } from './hooks';
import { fmtDate, ImagePreviewDialog } from './shared';

function Kpi({
  label,
  value,
  sub,
  strong,
  warn,
}: {
  label: string;
  value: string;
  sub?: string;
  strong?: boolean;
  warn?: boolean;
}) {
  return (
    <Box
      sx={{
        p: 1.5,
        borderRadius: 2,
        border: '1px solid',
        borderColor: strong ? 'primary.main' : warn ? 'warning.main' : 'divider',
        bgcolor: (t) =>
          strong
            ? alpha(t.palette.primary.main, 0.06)
            : warn
              ? alpha(t.palette.warning.main, 0.06)
              : 'background.paper',
        minWidth: 0,
      }}
    >
      <Typography
        variant="body2"
        color="text.secondary"
      >
        {label}
      </Typography>
      <Typography
        variant="h5"
        fontWeight={800}
        lineHeight={1.2}
        color={strong ? 'primary.main' : warn ? 'warning.main' : 'text.primary'}
      >
        {value}
      </Typography>
      {sub && (
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ textTransform: 'none', letterSpacing: 0, display: 'block', lineHeight: 1.3 }}
        >
          {sub}
        </Typography>
      )}
    </Box>
  );
}

export default function ListStatusCard({
  storeSlug,
  onOpenProducts,
  onOpenUpcoming,
  onOpenAgents,
}: {
  storeSlug: string;
  onOpenProducts: () => void;
  onOpenUpcoming: () => void;
  onOpenAgents: () => void;
}) {
  const q = useCatalogSummary(storeSlug);
  const refresh = useRefreshStoreData(storeSlug);
  const s = q.data;
  const [preview, setPreview] = useState<{ url: string; title: string } | null>(null);
  const [fixOpen, setFixOpen] = useState(false);

  // Ver el flyer que manda: imagen directa o portada del PDF (el servidor la cachea).
  const openFlyer = useMutation({
    mutationFn: async () => {
      if (!s?.ruling) throw new Error('Sin flyer vigente');
      return (await circularService.getPreviewImage(s.ruling.id)).url;
    },
    onSuccess: (url) => setPreview({ url, title: s?.ruling?.title || 'Flyer vigente' }),
    onError: (e: any) =>
      toast.error(e?.response?.data?.error || 'No se pudo abrir el flyer vigente'),
  });

  // "Que los agentes lo arreglen": Temis deja visibles sólo los del flyer y quita duplicados,
  // Atenea lo audita página por página, y la revisión diaria deja lo dudoso en Agentes IA.
  const fix = useMutation({
    mutationFn: async () => {
      const v = await circularService.syncVisibility(storeSlug);
      if (s?.ruling?.hasFile) await circularService.runAudit(s.ruling.id);
      await circularService.runProductReview(storeSlug).catch(() => null);
      return v;
    },
    onSuccess: (v) => {
      setFixOpen(false);
      refresh();
      toast.success(
        `Temis: ${v.inCircular} del flyer visibles · ${v.hidden} ocultados${
          v.duplicates ? ` · ${v.duplicates} duplicados quitados` : ''
        }. Atenea sigue auditando: míralo en Agentes IA.`,
        { duration: 9000 }
      );
    },
    onError: (e: any) =>
      toast.error(e?.response?.data?.error || 'No se pudo arrancar a los agentes'),
  });

  // "Ocultar los del circular": lo único que queda visible es lo que el flyer vigente cargó.
  const [hideOpen, setHideOpen] = useState(false);
  const hide = useMutation({
    mutationFn: () => circularService.hideCircularProducts(storeSlug),
    onSuccess: (v) => {
      setHideOpen(false);
      refresh();
      toast.success(
        `Sólo el flyer "${v.flyer}"${v.when === 'next' ? ' (programado)' : ''}: ${
          v.kept
        } productos del flyer · ${v.hidden} ocultados`,
        { duration: 8000 }
      );
    },
    onError: (e: any) => toast.error(e?.response?.data?.error || 'No se pudo ocultar'),
  });

  if (q.isLoading || !s) {
    return (
      <Skeleton
        variant="rounded"
        height={120}
        sx={{ borderRadius: 3 }}
      />
    );
  }
  const src = s.bySource;
  const srcTxt = [
    src.flyer ? `${src.flyer} del flyer` : '',
    src.circular ? `${src.circular} del circular` : '',
    src.manual ? `${src.manual} a mano` : '',
  ]
    .filter(Boolean)
    .join(' · ');
  const r = s.ruling;
  const dupWarn = !!r && r.duplicates > 0;
  const gapWarn = !!r && s.visible > r.uniqueProducts;

  return (
    <Box
      sx={{
        p: { xs: 1.5, md: 2 },
        borderRadius: 3,
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
      }}
    >
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        alignItems={{ sm: 'center' }}
        justifyContent="space-between"
        gap={1}
        sx={{ mb: 1.5 }}
      >
        <Stack
          direction="row"
          alignItems="center"
          gap={1}
          flexWrap="wrap"
        >
          <VisibilityOutlinedIcon
            color="primary"
            fontSize="small"
          />
          <Typography
            variant="subtitle1"
            fontWeight={800}
          >
            Lo que ve el cliente hoy
          </Typography>
          {r ? (
            <Chip
              size="small"
              color={r.kind === 'flyer' ? 'primary' : 'default'}
              variant="outlined"
              label={`${r.kind === 'flyer' ? 'Flyer' : 'Circular'}: ${r.title} · hasta ${fmtDate(
                r.endDate
              )}`}
              onClick={r.hasFile ? () => openFlyer.mutate() : undefined}
            />
          ) : (
            <Chip
              size="small"
              color="warning"
              variant="outlined"
              label="Sin flyer ni circular vigente"
            />
          )}
        </Stack>
        <Stack
          direction="row"
          gap={1}
          flexWrap="wrap"
        >
          {r?.hasFile && (
            <Button
              size="small"
              variant="outlined"
              disabled={openFlyer.isPending}
              onClick={() => openFlyer.mutate()}
            >
              {openFlyer.isPending ? 'Abriendo…' : 'Ver flyer vigente'}
            </Button>
          )}
          {r && (
            <Button
              size="small"
              variant={dupWarn || gapWarn ? 'contained' : 'outlined'}
              color={dupWarn || gapWarn ? 'warning' : 'primary'}
              startIcon={<SmartToyOutlinedIcon />}
              onClick={() => setFixOpen(true)}
            >
              Que los agentes lo arreglen
            </Button>
          )}
          {r && (
            <Button
              size="small"
              variant="outlined"
              color="warning"
              startIcon={<VisibilityOffOutlinedIcon />}
              onClick={() => setHideOpen(true)}
            >
              Ocultar los del circular
            </Button>
          )}
          {s.pending > 0 && (
            <Button
              size="small"
              variant="text"
              onClick={onOpenUpcoming}
            >
              Ver los {s.pending} que esperan
            </Button>
          )}
          <Button
            size="small"
            variant="outlined"
            onClick={onOpenProducts}
          >
            Ver productos
          </Button>
        </Stack>
      </Stack>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(5, 1fr)' },
          gap: 1.5,
        }}
      >
        <Kpi
          label="Visibles en la lista"
          value={String(s.visible)}
          sub={srcTxt || 'sin origen marcado'}
          strong
        />
        <Kpi
          label={
            r ? `En el ${r.kind === 'flyer' ? 'flyer' : 'circular'} vigente` : 'En el flyer vigente'
          }
          value={r ? String(r.uniqueProducts) : '—'}
          sub={
            r
              ? r.duplicates
                ? `${r.products} leídos: ${r.duplicates} son el mismo producto repetido`
                : `${r.products} leídos, sin repetidos`
              : 'nada vigente hoy'
          }
          warn={dupWarn || gapWarn}
        />
        <Kpi
          label="Ocultos"
          value={String(s.hidden)}
          sub={
            s.hidden
              ? 'no están en el flyer vigente o se apagaron a mano'
              : 'todo el catálogo se ve'
          }
        />
        <Kpi
          label="Esperan su fecha"
          value={String(s.pending)}
          sub={s.pending ? 'precio o alta de un flyer futuro' : 'nada programado'}
        />
        <Kpi
          label="Visibles sin foto"
          value={String(s.noImage)}
          sub={s.noImage ? 'Iris las rehace; o Rescanear fotos en Productos' : 'todas con foto'}
        />
      </Box>

      <ImagePreviewDialog
        key={preview?.url || 'none'}
        url={preview?.url ?? null}
        title={preview?.title}
        onClose={() => setPreview(null)}
      />

      <Dialog
        open={hideOpen}
        onClose={hide.isPending ? undefined : () => setHideOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <VisibilityOffOutlinedIcon color="warning" />
          Ocultar los del circular
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            Queda visible <b>sólo lo que trae el flyer con arte propio</b> (el vigente, o si no hay,
            el próximo programado). Todo lo demás se oculta: circular semanal, lo leído del link de
            circularss, lecturas viejas, cargado a mano. La única forma de que un producto se vea es
            que el flyer lo tenga.
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: 'block', mt: 1.5, textTransform: 'none', letterSpacing: 0 }}
          >
            No borra nada. El circular semanal no los vuelve a prender; sólo un flyer que los
            traiga, o prenderlos a mano en Productos.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setHideOpen(false)}
            disabled={hide.isPending}
          >
            Cancelar
          </Button>
          <Button
            variant="contained"
            color="warning"
            disabled={hide.isPending}
            onClick={() => hide.mutate()}
          >
            {hide.isPending ? 'Ocultando…' : 'Ocultar'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={fixOpen}
        onClose={fix.isPending ? undefined : () => setFixOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <SmartToyOutlinedIcon color="primary" />
          Que los agentes lo arreglen
        </DialogTitle>
        <DialogContent>
          <Typography
            variant="body2"
            sx={{ mb: 1 }}
          >
            Sobre <b>{r?.title}</b>
            {r ? ` (${r.products} productos leídos, ${r.uniqueProducts} distintos)` : ''}:
          </Typography>
          <Typography
            variant="body2"
            component="ul"
            sx={{ pl: 2.5, m: 0, '& li': { mb: 0.5 } }}
          >
            <li>
              <b>Temis</b> deja visibles sólo los productos de este flyer, oculta el resto y quita
              los repetidos.
            </li>
            <li>
              <b>Atenea</b> vuelve a leer el arte página por página y coteja precios, nombres y
              letra chica. Lo dudoso queda para decidir en Agentes IA.
            </li>
            <li>
              <b>Iris</b> rehace las fotos que falten o no se parezcan.
            </li>
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: 'block', mt: 1.5, textTransform: 'none', letterSpacing: 0 }}
          >
            No toca precios a mano ni lo que ya corregiste. Tarda unos minutos; se ve avanzar en la
            oficina.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setFixOpen(false)}
            disabled={fix.isPending}
          >
            Cancelar
          </Button>
          <Button
            variant="text"
            onClick={() => {
              setFixOpen(false);
              onOpenAgents();
            }}
          >
            Ver la oficina
          </Button>
          <Button
            variant="contained"
            disabled={fix.isPending}
            onClick={() => fix.mutate()}
          >
            {fix.isPending ? 'Arrancando…' : 'A trabajar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
