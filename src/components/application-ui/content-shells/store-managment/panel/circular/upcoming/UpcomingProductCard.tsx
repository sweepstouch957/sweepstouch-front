'use client';

/** Card de un producto que espera su fecha: foto, precio que va a salir, letra chica, acciones. */
import { StatusPill } from '@/components/application-ui/content-shells/store-managment/panel-kit';
import type { StoreProduct } from '@/services/circular';
import { cloudinaryThumb } from '@/utils/cloudinary';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import ImageOutlinedIcon from '@mui/icons-material/ImageOutlined';
import { Box, Button, Stack, Typography } from '@mui/material';
import Image from 'next/image';
import { memo } from 'react';
import { BlurField } from '../catalog/product-cell';
import { fineText } from '../domain/catalog';
import { MoreMenu } from '../panelUi';

type Props = {
  product: StoreProduct;
  /** Abriendo el editor (se está pidiendo la imagen del arte). */
  busy: boolean;
  rephotoing: boolean;
  onEdit: (p: StoreProduct) => void;
  onRephoto: (p: StoreProduct) => void;
  onPatch: (
    id: string,
    body: { name?: string; brand?: string; size?: string; price?: string; originalPrice?: string }
  ) => void;
  onPublish: (p: StoreProduct) => void;
  onCancel: (p: StoreProduct) => void;
};

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
          // Cloudinary ya entrega la miniatura: sin re-optimizar en Next.
          <Image
            src={cloudinaryThumb(p.imageUrl, 320, 240, 'fit')}
            alt=""
            width={320}
            height={240}
            unoptimized
            style={{
              width: 'auto',
              height: 'auto',
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
            Gauche está rehaciendo la foto…
          </Typography>
        )}
        <Box sx={{ position: 'absolute', top: 8, right: 8 }}>
          <StatusPill
            tone={pend?.isNew ? 'success' : 'warning'}
            label={pend?.isNew ? 'Nuevo' : 'Cambia de precio'}
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
          {/* El precio mal leído es el reclamo #1: se corrige acá, sin abrir el editor. */}
          <Box sx={{ flex: '1 1 55%', minWidth: 0, color: 'primary.main' }}>
            <BlurField
              fullWidth
              value={pend?.price ?? ''}
              placeholder="precio"
              ariaLabel={`Precio que va a salir de ${p.name}`}
              allowEmpty={false}
              inputStyle={{
                fontSize: 18,
                fontWeight: 800,
                color: 'inherit',
                fontVariantNumeric: 'tabular-nums',
              }}
              onSave={(price) => onPatch(p._id, { price })}
            />
          </Box>
          <Box sx={{ flex: '1 1 45%', minWidth: 0 }}>
            <BlurField
              fullWidth
              value={pend?.originalPrice ?? ''}
              placeholder="regular"
              ariaLabel={`Precio regular de ${p.name}`}
              inputStyle={{
                fontSize: 13,
                textDecoration: pend?.originalPrice ? 'line-through' : 'none',
              }}
              onSave={(originalPrice) => onPatch(p._id, { originalPrice })}
            />
          </Box>
        </Stack>
        {/* El ahorro que va a ver el cliente (regular − oferta), tal como sale en su lista. */}
        {!!pend?.savings && (
          <Typography
            color="success.main"
            noWrap
            sx={{ ...smallText, fontWeight: 700 }}
          >
            Ahorra {pend.savings}
            {/^\d+\s*\//.test(pend.price || '') ? ' por unidad' : ''}
          </Typography>
        )}
        {changes && (
          <Typography
            color="text.secondary"
            noWrap
            sx={smallText}
          >
            Hoy cuesta {p.price} → va a costar {pend?.price}
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
        {/* Dos botones con palabras; lo que casi nunca se usa va en "Más". */}
        <Stack
          direction="row"
          gap={0.75}
          flexWrap="wrap"
          sx={{ mt: 'auto', pt: 1 }}
        >
          <Button
            size="small"
            variant="outlined"
            startIcon={<EditOutlinedIcon />}
            onClick={edit}
            disabled={busy}
          >
            Corregir
          </Button>
          <MoreMenu
            label="Más"
            items={[
              {
                label: 'La foto no es: buscar otra',
                hint: 'Un robot la busca de nuevo en el flyer (tarda como 1 minuto).',
                onClick: () => onRephoto(p),
                disabled: rephotoing,
              },
              {
                label: 'Sacarlo hoy mismo',
                hint: 'No espera la fecha: el cliente lo ve desde este momento.',
                onClick: () => onPublish(p),
              },
              {
                label: 'No sacar este producto',
                hint: 'No va a aparecer en la lista del cliente.',
                onClick: () => onCancel(p),
                danger: true,
              },
            ]}
          />
        </Stack>
      </Box>
    </Box>
  );
}

export default memo(UpcomingProductCard);
