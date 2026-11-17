'use client';

/**
 * Botón flotante "Ver flyer / circular": quien valida la lista compara contra el arte en
 * todo momento, en cualquier pestaña, en el teléfono y en la computadora. Muestra lo mismo
 * que el encabezado: el flyer de la última campaña (aunque no haya empezado) y el circular
 * vigente. Si hay los dos, una ventana con las dos imágenes grandes para elegir: pensado
 * para alguien que nunca usó el panel.
 */
import CampaignRoundedIcon from '@mui/icons-material/CampaignRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import MenuBookRoundedIcon from '@mui/icons-material/MenuBookRounded';
import {
  Box,
  ButtonBase,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  Fab,
  IconButton,
  Stack,
  Typography,
} from '@mui/material';
import { useMemo, useState } from 'react';
import { isFlyer, pickTodayAndNext } from '../domain/circulars';
import { useCircularPreview, useLastCampaignArt, useStoreCirculars } from '../hooks';
import { ImagePreviewDialog } from '../shared';
import { useCircularThumb } from './use-circular-thumb';

/** Tarjeta grande para elegir (imagen + qué es + título). */
function Choice({
  thumb,
  icon,
  kind,
  title,
  onClick,
}: {
  thumb?: string;
  icon: React.ReactNode;
  kind: string;
  title: string;
  onClick: () => void;
}) {
  return (
    <ButtonBase
      onClick={onClick}
      sx={{
        flex: 1,
        minWidth: 0,
        display: 'block',
        textAlign: 'left',
        borderRadius: 2,
        border: '2px solid',
        borderColor: 'divider',
        overflow: 'hidden',
        '&:hover, &:focus-visible': { borderColor: 'primary.main' },
      }}
    >
      <Box
        sx={{
          height: 180,
          bgcolor: 'background.default',
          display: 'grid',
          placeItems: 'center',
          overflow: 'hidden',
        }}
      >
        {thumb ? (
          <Box
            component="img"
            src={thumb}
            alt=""
            sx={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }}
          />
        ) : (
          <Box sx={{ color: 'text.disabled', '& svg': { fontSize: 56 } }}>{icon}</Box>
        )}
      </Box>
      <Box sx={{ p: 1.5 }}>
        <Stack
          direction="row"
          alignItems="center"
          gap={0.75}
        >
          {icon}
          <Typography fontWeight={800}>{kind}</Typography>
        </Stack>
        <Typography
          variant="body2"
          color="text.secondary"
          noWrap
        >
          {title}
        </Typography>
      </Box>
    </ButtonBase>
  );
}

export default function FlyerFab({
  storeId,
  storeSlug,
  upcoming = false,
}: {
  storeId: string;
  storeSlug: string;
  /** En "Próximas ofertas": abre el flyer/circular que VIENE, no el de hoy. */
  upcoming?: boolean;
}) {
  const flyer = useLastCampaignArt(storeId);
  const circs = useStoreCirculars(storeSlug);
  const circular = circs.current;
  // Lo primero que arranca más adelante (flyer de campaña o circular semanal).
  const next = useMemo(
    () => (upcoming ? pickTodayAndNext([...circs.items, ...circs.flyers], Date.now()).next : null),
    [upcoming, circs.items, circs.flyers]
  );
  const circularThumb = useCircularThumb(circular);
  const [img, setImg] = useState<{ url: string; title: string } | null>(null);
  const [choose, setChoose] = useState(false);
  const openCircular = useCircularPreview((url, title) => setImg({ url, title }));

  const flyerTitle = String(flyer.campaign?.title || '').trim() || 'Flyer de campaña';
  const showFlyer = () => setImg({ url: flyer.source || flyer.image, title: flyerTitle });
  const showCircular = () => circular && openCircular.mutate(circular);
  const hasFlyer = !!flyer.image;
  if (!hasFlyer && !circular && !next) return null;

  const both = !next && hasFlyer && !!circular;
  const label = next
    ? `Ver próximo ${isFlyer(next) ? 'flyer' : 'circular'}`
    : both
      ? 'Ver flyer o circular'
      : hasFlyer
        ? 'Ver flyer'
        : 'Ver circular';

  return (
    <>
      <Fab
        variant="extended"
        onClick={() =>
          next
            ? openCircular.mutate(next)
            : both
              ? setChoose(true)
              : hasFlyer
                ? showFlyer()
                : showCircular()
        }
        disabled={openCircular.isPending}
        aria-label={label}
        sx={{
          position: 'fixed',
          // A la izquierda del botón del bot (que vive abajo a la derecha), en todo tamaño.
          right: { xs: 88, sm: 116 },
          // Centrado en vertical con el botón del bot.
          bottom: { xs: 26, sm: 38 },
          zIndex: (t) => t.zIndex.modal - 1,
          height: 44,
          px: 2,
          fontSize: 14,
          fontWeight: 700,
          letterSpacing: 0,
          textTransform: 'none',
          bgcolor: 'background.paper',
          color: 'text.primary',
          border: '1px solid',
          borderColor: 'divider',
          boxShadow: '0 6px 20px rgba(15,23,42,.12)',
          '&:hover': { bgcolor: 'background.paper', borderColor: 'primary.main' },
          '& .MuiSvgIcon-root': { color: 'primary.main', fontSize: 20 },
        }}
      >
        {openCircular.isPending ? (
          <CircularProgress
            size={20}
            color="inherit"
            sx={{ mr: 1 }}
          />
        ) : (
          <MenuBookRoundedIcon sx={{ mr: 1 }} />
        )}
        {label}
      </Fab>

      <Dialog
        open={choose}
        onClose={() => setChoose(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle
          fontWeight={800}
          sx={{ pr: 6 }}
        >
          ¿Qué quieres ver?
          <IconButton
            aria-label="Cerrar"
            onClick={() => setChoose(false)}
            sx={{ position: 'absolute', right: 12, top: 12 }}
          >
            <CloseRoundedIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            gap={1.5}
          >
            <Choice
              thumb={flyer.image}
              icon={<CampaignRoundedIcon fontSize="small" />}
              kind="Flyer de la campaña"
              title={flyerTitle}
              onClick={() => {
                setChoose(false);
                showFlyer();
              }}
            />
            <Choice
              thumb={circularThumb}
              icon={<MenuBookRoundedIcon fontSize="small" />}
              kind="Circular de la semana"
              title={circular?.title || 'Circular'}
              onClick={() => {
                setChoose(false);
                showCircular();
              }}
            />
          </Stack>
        </DialogContent>
      </Dialog>

      <ImagePreviewDialog
        key={img?.url || 'none'}
        url={img?.url ?? null}
        title={img?.title}
        onClose={() => setImg(null)}
      />
    </>
  );
}
