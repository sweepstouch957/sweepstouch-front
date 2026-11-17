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
import { useState } from 'react';
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

export default function FlyerFab({ storeId, storeSlug }: { storeId: string; storeSlug: string }) {
  const flyer = useLastCampaignArt(storeId);
  const circular = useStoreCirculars(storeSlug).current;
  const circularThumb = useCircularThumb(circular);
  const [img, setImg] = useState<{ url: string; title: string } | null>(null);
  const [choose, setChoose] = useState(false);
  const openCircular = useCircularPreview((url, title) => setImg({ url, title }));

  const flyerTitle = String(flyer.campaign?.title || '').trim() || 'Flyer de campaña';
  const showFlyer = () => setImg({ url: flyer.source || flyer.image, title: flyerTitle });
  const showCircular = () => circular && openCircular.mutate(circular);
  const hasFlyer = !!flyer.image;
  if (!hasFlyer && !circular) return null;

  const both = hasFlyer && !!circular;
  const label = both ? 'Ver flyer o circular' : hasFlyer ? 'Ver flyer' : 'Ver circular';

  return (
    <>
      <Fab
        variant="extended"
        color="secondary"
        size="large"
        onClick={() => (both ? setChoose(true) : hasFlyer ? showFlyer() : showCircular())}
        disabled={openCircular.isPending}
        aria-label={label}
        sx={{
          position: 'fixed',
          // A la izquierda del botón del bot (que vive abajo a la derecha), en todo tamaño.
          right: { xs: 84, sm: 104 },
          bottom: { xs: 20, sm: 30 },
          zIndex: (t) => t.zIndex.modal - 1,
          height: { xs: 52, sm: 60 },
          px: { xs: 2, sm: 3 },
          fontSize: { xs: 15, sm: 17 },
          fontWeight: 800,
          textTransform: 'none',
          boxShadow: 8,
          // Brillo al aparecer, para que se note la primera vez (sin animación si el
          // sistema pide menos movimiento).
          animation: 'flyerFabPulse 1.6s ease-out 0.4s 3',
          '@keyframes flyerFabPulse': {
            '0%': { boxShadow: '0 0 0 0 rgba(236,72,153,.55)' },
            '100%': { boxShadow: '0 0 0 18px rgba(236,72,153,0)' },
          },
          '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
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
