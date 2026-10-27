'use client';

/** Un día de salida: cuándo sale, de dónde viene (campaña o circular) y sus productos. */
import {
  PanelCard,
  panelDivider,
} from '@/components/application-ui/content-shells/store-managment/panel-kit';
import type { StoreProduct, UpcomingGroup } from '@/services/circular.service';
import { cloudinaryThumb } from '@/utils/cloudinary';
import CampaignRoundedIcon from '@mui/icons-material/CampaignRounded';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import RocketLaunchOutlinedIcon from '@mui/icons-material/RocketLaunchOutlined';
import { alpha, Box, Button, Chip, Stack, Tooltip, Typography } from '@mui/material';
import { memo, useCallback, useState } from 'react';
import { MoreMenu } from '../panelUi';
import UpcomingProductCard from './UpcomingProductCard';
import {
  fmtDay,
  fmtMonth,
  GROUP_PREVIEW,
  originLabel,
  relDay,
  type UpcomingBanner,
} from './utils';

type Props = {
  group: UpcomingGroup;
  /** Banner que sale el mismo día, si hay. */
  banner?: UpcomingBanner;
  /** Producto cuyo editor se está abriendo / cuya foto rehace Iris. */
  editingId?: string;
  rephotoingId?: string;
  artBusy: boolean;
  agentsBusy: boolean;
  onEdit: (product: StoreProduct, group: UpcomingGroup) => void;
  onRephoto: (product: StoreProduct) => void;
  onPatch: (id: string, body: { name?: string; brand?: string; size?: string }) => void;
  onPublishProduct: (product: StoreProduct) => void;
  onCancelProduct: (product: StoreProduct) => void;
  onPublishGroup: (group: UpcomingGroup) => void;
  onOpenArt: (group: UpcomingGroup) => void;
  onOpenAgents: (group: UpcomingGroup) => void;
  onPreview: (url: string) => void;
};

function DateBadge({ day }: { day: string }) {
  return (
    <Box
      aria-hidden
      sx={{
        width: 52,
        height: 52,
        borderRadius: 2,
        flexShrink: 0,
        display: 'grid',
        placeContent: 'center',
        textAlign: 'center',
        color: 'primary.main',
        bgcolor: (t) => alpha(t.palette.primary.main, 0.1),
      }}
    >
      <Typography
        variant="h6"
        fontWeight={800}
        lineHeight={1}
      >
        {Number(day.slice(8, 10))}
      </Typography>
      <Typography sx={{ fontSize: 10, fontWeight: 800, letterSpacing: 0.6, lineHeight: 1.4 }}>
        {fmtMonth(day).toUpperCase()}
      </Typography>
    </Box>
  );
}

function UpcomingGroupCard({
  group: g,
  banner,
  editingId,
  rephotoingId,
  artBusy,
  agentsBusy,
  onEdit,
  onRephoto,
  onPatch,
  onPublishProduct,
  onCancelProduct,
  onPublishGroup,
  onOpenArt,
  onOpenAgents,
  onPreview,
}: Props) {
  // Un flyer trae 100+ productos por día: se pintan los primeros y el resto a pedido.
  const [expanded, setExpanded] = useState(false);
  const edit = useCallback((p: StoreProduct) => onEdit(p, g), [onEdit, g]);
  const items = expanded ? g.items : g.items.slice(0, GROUP_PREVIEW);
  const hidden = g.items.length - GROUP_PREVIEW;
  const n = g.items.length;

  return (
    <PanelCard>
      {/* Cabecera del grupo: cuándo sale y de dónde viene */}
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        alignItems={{ md: 'center' }}
        justifyContent="space-between"
        gap={1.5}
        sx={{ px: 2.25, py: 1.75, borderBottom: (t) => `1px solid ${panelDivider(t)}` }}
      >
        <Stack
          direction="row"
          alignItems="center"
          gap={1.5}
          sx={{ minWidth: 0 }}
        >
          <DateBadge day={g.day} />
          <Box sx={{ minWidth: 0 }}>
            <Typography
              variant="subtitle1"
              fontWeight={800}
              sx={{ '&::first-letter': { textTransform: 'uppercase' } }}
            >
              {fmtDay(g.day)} · {relDay(g.day)}
            </Typography>
            <Stack
              direction="row"
              alignItems="center"
              gap={0.75}
              flexWrap="wrap"
              sx={{ mt: 0.25 }}
            >
              {g.circular ? (
                <Chip
                  size="small"
                  icon={
                    g.circular.fromCampaign ? <CampaignRoundedIcon /> : <DescriptionOutlinedIcon />
                  }
                  color={g.circular.fromCampaign ? 'primary' : 'default'}
                  variant="outlined"
                  label={originLabel(g.circular)}
                  sx={{ maxWidth: '100%' }}
                />
              ) : (
                <Chip
                  size="small"
                  variant="outlined"
                  label="Sin origen"
                />
              )}
              <Typography
                variant="body2"
                color="text.secondary"
              >
                {n} producto{n !== 1 ? 's' : ''}
                {banner ? ' + banner' : ''}
              </Typography>
            </Stack>
          </Box>
        </Stack>

        <Stack
          direction="row"
          gap={1}
          flexWrap="wrap"
          alignItems="center"
        >
          {banner && (
            <Tooltip title="Banner de ese día">
              <Box
                component="button"
                type="button"
                onClick={() => onPreview(banner.imageUrl)}
                aria-label="Ver banner de ese día"
                sx={{
                  p: 0,
                  width: 120,
                  aspectRatio: '3 / 1',
                  borderRadius: 1.5,
                  overflow: 'hidden',
                  cursor: 'zoom-in',
                  border: '1px solid',
                  borderColor: 'divider',
                  bgcolor: 'background.default',
                  display: 'block',
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={cloudinaryThumb(banner.imageUrl, 360, 120, 'fill')}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
              </Box>
            </Tooltip>
          )}
          {g.circular?.hasFile && (
            <MoreMenu
              items={[
                {
                  label: 'Ver arte',
                  hint: 'El arte o circular del que salieron estos productos.',
                  onClick: () => onOpenArt(g),
                  disabled: artBusy,
                },
                {
                  label: 'Revisar con los agentes',
                  hint: 'Atenea coteja precios y nombres contra el arte; Iris rehace las fotos que no se parecen. El avance se ve en Agentes IA.',
                  onClick: () => onOpenAgents(g),
                  disabled: agentsBusy,
                },
              ]}
            />
          )}
          <Button
            size="small"
            variant="contained"
            startIcon={<RocketLaunchOutlinedIcon />}
            onClick={() => onPublishGroup(g)}
          >
            Publicar ahora
          </Button>
        </Stack>
      </Stack>

      {/* Productos */}
      <Box
        sx={{
          p: { xs: 1.5, sm: 2 },
          display: 'grid',
          gap: 1.5,
          // minmax(0, 1fr): con "1fr" pelado una card con precio largo ensanchaba la columna
          // y la grilla se salía del contenedor (se cortaba la 4ª columna).
          gridTemplateColumns: {
            xs: 'minmax(0, 1fr)',
            sm: 'repeat(2, minmax(0, 1fr))',
            lg: 'repeat(3, minmax(0, 1fr))',
            xl: 'repeat(4, minmax(0, 1fr))',
          },
        }}
      >
        {items.map((p) => (
          <UpcomingProductCard
            key={p._id}
            product={p}
            busy={editingId === p._id}
            rephotoing={rephotoingId === p._id}
            onEdit={edit}
            onRephoto={onRephoto}
            onPatch={onPatch}
            onPublish={onPublishProduct}
            onCancel={onCancelProduct}
          />
        ))}
        {hidden > 0 && !expanded && (
          <Button
            variant="outlined"
            onClick={() => setExpanded(true)}
            sx={{ alignSelf: 'center', justifySelf: 'start' }}
          >
            Ver los {hidden} restantes
          </Button>
        )}
      </Box>
    </PanelCard>
  );
}

export default memo(UpcomingGroupCard);
