'use client';

/**
 * Lo que está vigente hoy, a la vista en TODAS las pestañas: el circular de la semana y el
 * flyer de la última campaña, con miniatura, fechas y productos. Un clic abre la pieza en
 * grande, para cotejar un precio sin salir de donde se está trabajando. A la derecha, la
 * calidad de la lectura (efectividad de la auditoría, repetidos, sin foto) con acceso
 * directo a donde se corrige.
 */
import { circularService, type Circular } from '@/services/circular.service';
import CampaignRoundedIcon from '@mui/icons-material/CampaignRounded';
import MenuBookRoundedIcon from '@mui/icons-material/MenuBookRounded';
import ZoomInRoundedIcon from '@mui/icons-material/ZoomInRounded';
import { Box, ButtonBase, Chip, Skeleton, Stack, Tooltip, Typography, useTheme } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { memo, useState, type ReactNode } from 'react';
import { tint } from 'src/theme/semantic';
import { panelBorder } from '../../../panel-kit';
import { useCircularAudit } from '../agents/use-pipeline';
import { accuracyTone } from '../agents/utils';
import {
  productCount,
  qk,
  useCatalogSummary,
  useCircularPreview,
  useLastCampaignArt,
  useStoreCirculars,
} from '../hooks';
import { circularLabel, ImagePreviewDialog } from '../shared';
import type { PanelTab } from './tabs';

const day = new Intl.DateTimeFormat('es', { day: 'numeric', month: 'short', timeZone: 'America/New_York' });
const range = (a?: string | null, b?: string | null) =>
  a && b ? `${day.format(new Date(a))} – ${day.format(new Date(b))}` : a ? `desde ${day.format(new Date(a))}` : '';

const isImage = (url?: string) => /\.(png|jpe?g|webp)(\?|$)/i.test(url || '');

/** Miniatura del circular: imagen directa o, si es PDF, la portada que cachea el servidor. */
function useCircularThumb(c: Circular | null) {
  const direct = c?.previewImageUrl || (isImage(c?.fileUrl) ? c?.fileUrl : '');
  const q = useQuery({
    queryKey: [...qk.circular(c?._id), 'thumb'],
    queryFn: () => circularService.getPreviewImage(c!._id).then((r) => r.url).catch(() => ''),
    enabled: !!c?._id && !direct && !!c?.fileUrl,
    staleTime: 60 * 60_000,
  });
  return direct || q.data || '';
}

function Piece({
  kind,
  icon,
  title,
  meta,
  thumb,
  ruling,
  empty,
  loading,
  onOpen,
}: {
  kind: string;
  icon: ReactNode;
  title: string;
  meta: string;
  thumb: string;
  /** Es lo que manda hoy en la lista del cliente. */
  ruling: boolean;
  empty: boolean;
  loading: boolean;
  onOpen?: () => void;
}) {
  const theme = useTheme();
  const body = (
    <>
      <Box
        sx={{
          width: 44,
          height: 56,
          flexShrink: 0,
          borderRadius: 1.5,
          overflow: 'hidden',
          display: 'grid',
          placeItems: 'center',
          bgcolor: tint(theme, 'primary'),
          color: 'primary.main',
          border: panelBorder(theme),
          position: 'relative',
        }}
      >
        {loading ? (
          <Skeleton
            variant="rectangular"
            width={44}
            height={56}
          />
        ) : thumb ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={thumb}
            alt=""
            loading="lazy"
            style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }}
          />
        ) : (
          icon
        )}
      </Box>
      <Box
        minWidth={0}
        textAlign="left"
      >
        <Stack
          direction="row"
          alignItems="center"
          gap={0.75}
        >
          <Typography sx={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '0.06em', color: 'text.secondary' }}>
            {kind.toUpperCase()}
          </Typography>
          {ruling && (
            <Tooltip title="Es el que manda hoy en la lista del cliente">
              <Chip
                size="small"
                color="success"
                label="Manda hoy"
                sx={{ height: 17, fontSize: 10, fontWeight: 800 }}
              />
            </Tooltip>
          )}
        </Stack>
        <Typography
          noWrap
          sx={{ fontSize: 13.5, fontWeight: 700, lineHeight: 1.3, color: empty ? 'text.secondary' : 'text.primary' }}
        >
          {title}
        </Typography>
        <Typography
          noWrap
          sx={{ fontSize: 12, color: 'text.secondary' }}
        >
          {meta}
        </Typography>
      </Box>
      {onOpen && <ZoomInRoundedIcon sx={{ fontSize: 18, color: 'text.disabled', ml: 'auto', flexShrink: 0 }} />}
    </>
  );
  const sx = {
    display: 'flex',
    alignItems: 'center',
    gap: 1.25,
    p: 0.75,
    pr: 1.25,
    borderRadius: 2,
    flex: '1 1 240px',
    minWidth: 0,
    maxWidth: { md: 360 },
    border: panelBorder(theme),
  } as const;
  return onOpen ? (
    <ButtonBase
      onClick={onOpen}
      aria-label={`Ver ${kind.toLowerCase()} en grande: ${title}`}
      sx={{
        ...sx,
        transition: 'border-color 120ms ease-out, background-color 120ms ease-out',
        '&:hover': { borderColor: 'primary.main', bgcolor: tint(theme, 'primary', 0.04) },
        '&:focus-visible': { outline: '2px solid', outlineColor: 'primary.main', outlineOffset: 2 },
      }}
    >
      {body}
    </ButtonBase>
  ) : (
    <Box sx={sx}>{body}</Box>
  );
}

function CurrentArt({
  storeId,
  storeSlug,
  storeName,
  onTab,
}: {
  storeId: string;
  storeSlug: string;
  storeName?: string;
  onTab: (tab: PanelTab) => void;
}) {
  const circulars = useStoreCirculars(storeSlug);
  const flyer = useLastCampaignArt(storeId);
  const summary = useCatalogSummary(storeSlug).data;
  const current = circulars.current;
  const thumb = useCircularThumb(current);
  const audit = useCircularAudit(current).data;
  const [preview, setPreview] = useState<{ url: string; title: string } | null>(null);
  const openCircular = useCircularPreview((url, title) => setPreview({ url, title }));

  const ruling = summary?.ruling?.kind;
  const flyerTitle = String(flyer.campaign?.title || '').trim() || 'Flyer de campaña';

  return (
    <>
      <Stack
        direction="row"
        flexWrap="wrap"
        alignItems="center"
        gap={1}
        sx={{ px: { xs: 2, md: 2.5 }, pb: 1.5 }}
      >
        <Piece
          kind="Circular vigente"
          icon={<MenuBookRoundedIcon fontSize="small" />}
          loading={circulars.isLoading}
          empty={!current}
          ruling={ruling === 'circular'}
          thumb={thumb}
          title={current ? circularLabel(current, storeSlug, storeName) : 'Sin circular vigente'}
          meta={
            current
              ? [range(current.startDate, current.endDate), `${productCount(current).toLocaleString('es')} productos`]
                  .filter(Boolean)
                  .join(' · ')
              : 'Súbelo en la pestaña Circular'
          }
          onOpen={current ? () => openCircular.mutate(current) : undefined}
        />
        <Piece
          kind="Flyer actual"
          icon={<CampaignRoundedIcon fontSize="small" />}
          loading={flyer.isLoading}
          empty={!flyer.image}
          ruling={ruling === 'flyer'}
          thumb={flyer.image}
          title={flyer.image ? flyerTitle : 'Sin flyer de campaña'}
          meta={
            flyer.image
              ? [flyer.campaign?.startDate ? `enviado ${day.format(new Date(flyer.campaign.startDate))}` : '', 'última campaña con arte']
                  .filter(Boolean)
                  .join(' · ')
              : 'Aparece al agendar una campaña con arte'
          }
          onOpen={flyer.image ? () => setPreview({ url: flyer.source || flyer.image, title: flyerTitle }) : undefined}
        />

        {/* Calidad de lo que ve el cliente: cada dato lleva a donde se corrige. */}
        <Stack
          direction="row"
          flexWrap="wrap"
          gap={0.75}
          sx={{ ml: { md: 'auto' } }}
        >
          {audit && !audit.running && audit.accuracy != null && (
            <Tooltip title="Efectividad de la lectura según la auditoría página por página. Clic para ver qué falló.">
              <Chip
                size="small"
                clickable
                onClick={() => onTab('agents')}
                color={accuracyTone(audit.accuracy)}
                label={`Lectura ${audit.accuracy}% correcta`}
                sx={{ fontWeight: 700 }}
              />
            </Tooltip>
          )}
          {audit?.running && (
            <Chip
              size="small"
              clickable
              onClick={() => onTab('agents')}
              color="primary"
              variant="outlined"
              label="Auditando…"
            />
          )}
          {!!summary && (
            <Tooltip title="Productos que el cliente ve hoy en su lista">
              <Chip
                size="small"
                clickable
                onClick={() => onTab('products')}
                variant="outlined"
                label={`${summary.visible.toLocaleString('es')} visibles`}
                sx={{ fontWeight: 700 }}
              />
            </Tooltip>
          )}
          {!!summary?.ruling?.duplicates && (
            <Tooltip title="Lecturas repetidas del mismo producto en la pieza que manda hoy">
              <Chip
                size="small"
                clickable
                onClick={() => onTab('agents')}
                color="warning"
                variant="outlined"
                label={`${summary.ruling.duplicates} repetidos`}
                sx={{ fontWeight: 700 }}
              />
            </Tooltip>
          )}
          {!!summary?.noImage && (
            <Tooltip title="Productos visibles sin foto">
              <Chip
                size="small"
                clickable
                onClick={() => onTab('products')}
                color="warning"
                variant="outlined"
                label={`${summary.noImage} sin foto`}
                sx={{ fontWeight: 700 }}
              />
            </Tooltip>
          )}
        </Stack>
      </Stack>

      <ImagePreviewDialog
        url={preview?.url ?? null}
        title={preview?.title}
        onClose={() => setPreview(null)}
      />
    </>
  );
}

export default memo(CurrentArt);
