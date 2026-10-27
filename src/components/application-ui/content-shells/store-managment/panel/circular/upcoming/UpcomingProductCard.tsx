'use client';

/** Card de un producto que espera su fecha: foto, precio que va a salir, letra chica, acciones. */
import type { StoreProduct } from '@/services/circular.service';
import { cloudinaryThumb } from '@/utils/cloudinary';
import CameraswitchOutlinedIcon from '@mui/icons-material/CameraswitchOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import ImageOutlinedIcon from '@mui/icons-material/ImageOutlined';
import RocketLaunchOutlinedIcon from '@mui/icons-material/RocketLaunchOutlined';
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';
import { Box, IconButton, Stack, Tooltip, Typography } from '@mui/material';
import { memo, type ReactNode } from 'react';
import { StatusPill } from '@/components/application-ui/content-shells/store-managment/panel-kit';
import { BlurField } from '../catalog/product-cell';
import { fineText } from './utils';

type Props = {
  product: StoreProduct;
  /** Abriendo el editor (se está pidiendo la imagen del arte). */
  busy: boolean;
  rephotoing: boolean;
  onEdit: (p: StoreProduct) => void;
  onRephoto: (p: StoreProduct) => void;
  onPatch: (id: string, body: { name?: string; brand?: string; size?: string }) => void;
  onPublish: (p: StoreProduct) => void;
  onCancel: (p: StoreProduct) => void;
};

function CardAction({
  title,
  icon,
  onClick,
  disabled = false,
}: {
  title: string;
  icon: ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <Tooltip title={title}>
      <span>
        <IconButton
          size="small"
          aria-label={title}
          onClick={onClick}
          disabled={disabled}
          sx={{ color: 'text.secondary', '&:hover': { color: 'primary.main' } }}
        >
          {icon}
        </IconButton>
      </span>
    </Tooltip>
  );
}

const smallText = { fontSize: 12.5, lineHeight: 1.4 } as const;

function UpcomingProductCard({
  product: p,
  busy,
  rephotoing,
  onEdit,
  onRephoto,
  onPatch,
  onPublish,
  onCancel,
}: Props) {
  const pend = p.pending;
  const changes = !pend?.isNew && !!p.price && p.price !== pend?.price;
  const fine = fineText(p);
  const edit = () => onEdit(p);

  return (
    <Box
      sx={{
        minWidth: 0,
        borderRadius: 2.5,
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        transition: 'border-color .15s',
        '&:hover': { borderColor: 'primary.main' },
        '@media (prefers-reduced-motion: reduce)': { transition: 'none' },
      }}
    >
      {/* Foto grande arriba, en caja blanca: lo primero que se revisa es si ES el producto. */}
      <Box
        component="button"
        type="button"
        onClick={edit}
        aria-label={`Editar ${p.name}`}
        sx={{
          position: 'relative',
          width: '100%',
          aspectRatio: '4 / 3',
          p: 1.5,
          border: 0,
          borderBottom: '1px solid',
          borderColor: 'divider',
          bgcolor: 'common.white',
          cursor: 'pointer',
          display: 'grid',
          placeItems: 'center',
          overflow: 'hidden',
        }}
      >
        {p.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={cloudinaryThumb(p.imageUrl, 320, 240, 'fit')}
            alt=""
            loading="lazy"
            decoding="async"
            style={{
              maxWidth: '100%',
              maxHeight: '100%',
              objectFit: 'contain',
              opacity: rephotoing ? 0.35 : 1,
            }}
          />
        ) : (
          <ImageOutlinedIcon
            color="disabled"
            sx={{ fontSize: 40 }}
          />
        )}
        {rephotoing && (
          <Typography
            sx={{
              ...smallText,
              position: 'absolute',
              inset: 'auto 0 8px',
              textAlign: 'center',
              fontWeight: 700,
              color: 'primary.main',
            }}
          >
            Iris está rehaciendo la foto…
          </Typography>
        )}
        <Box sx={{ position: 'absolute', top: 8, right: 8 }}>
          <StatusPill
            tone={pend?.isNew ? 'success' : 'warning'}
            label={pend?.isNew ? 'Nuevo' : 'Cambia precio'}
          />
        </Box>
      </Box>

      <Box sx={{ p: 1.25, minWidth: 0, flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Todo editable antes de que salga: la encargada corrige lo que la IA leyó mal. */}
        <BlurField
          bold
          value={p.name}
          ariaLabel="Nombre del producto"
          allowEmpty={false}
          onSave={(name) => onPatch(p._id, { name })}
        />
        <Stack
          direction="row"
          gap={1}
          sx={{ mt: 0.25 }}
        >
          <BlurField
            value={p.brand ?? ''}
            placeholder="marca"
            ariaLabel="Marca"
            onSave={(brand) => onPatch(p._id, { brand })}
          />
          <BlurField
            value={p.size ?? ''}
            placeholder="tamaño"
            ariaLabel="Tamaño"
            onSave={(size) => onPatch(p._id, { size })}
          />
        </Stack>
        <Stack
          direction="row"
          alignItems="baseline"
          gap={0.75}
          sx={{ mt: 0.5, minWidth: 0 }}
        >
          <Typography
            variant="h6"
            fontWeight={800}
            color="primary.main"
            lineHeight={1.1}
            noWrap
            sx={{ fontVariantNumeric: 'tabular-nums' }}
          >
            {pend?.price || '—'}
          </Typography>
          {pend?.originalPrice && (
            <Typography
              variant="body2"
              color="text.secondary"
              noWrap
              sx={{ textDecoration: 'line-through' }}
            >
              {pend.originalPrice}
            </Typography>
          )}
        </Stack>
        {changes && (
          <Typography
            color="text.secondary"
            noWrap
            sx={smallText}
          >
            Hoy {p.price} → {pend?.price}
          </Typography>
        )}
        {fine && (
          <Typography
            color="warning.main"
            noWrap
            title={fine}
            sx={smallText}
          >
            {fine}
          </Typography>
        )}
        <Stack
          direction="row"
          justifyContent="space-between"
          sx={{ mt: 'auto', pt: 0.75, mx: -0.5 }}
        >
          <Stack direction="row">
            <CardAction
              title="Editar todo: nombre, marca, precio, fecha, letra chica o foto"
              icon={<EditOutlinedIcon fontSize="small" />}
              onClick={edit}
              disabled={busy}
            />
            <CardAction
              title="No se parece: Iris la busca de nuevo en su página del arte (≈ 1 min)"
              icon={<CameraswitchOutlinedIcon fontSize="small" />}
              onClick={() => onRephoto(p)}
              disabled={rephotoing}
            />
          </Stack>
          <Stack direction="row">
            <CardAction
              title="Publicar ya"
              icon={<RocketLaunchOutlinedIcon fontSize="small" />}
              onClick={() => onPublish(p)}
            />
            <CardAction
              title="Que no salga"
              icon={<VisibilityOffOutlinedIcon fontSize="small" />}
              onClick={() => onCancel(p)}
            />
          </Stack>
        </Stack>
      </Box>
    </Box>
  );
}

export default memo(UpcomingProductCard);
