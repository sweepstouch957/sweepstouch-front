'use client';

/**
 * Vista previa del RCS como lo ve el cliente en Mensajes (19 oct 2026). Respeta el formato
 * elegido en RcsLayoutPicker:
 *  - "split":    dos burbujas, la foto entera y después el texto con los botones.
 *  - "card":     una tarjeta alta con la foto arriba (rich card VERTICAL / TALL).
 *  - carrusel:   la tarjeta de la campaña + cards de productos, en fila.
 *  - sin imagen: texto con botones.
 * Las reglas de qué sale (botones, líneas sin dato…) vienen de buildMixedPreview.
 */
import ExploreOutlinedIcon from '@mui/icons-material/ExploreOutlined';
import { alpha, Box, Stack, Typography, type SxProps, type Theme } from '@mui/material';
import { buildMixedPreview, type MixedButton, type MixedPreviewInput } from '../MixedRcsEditor';

const bubbleSx: SxProps<Theme> = {
  bgcolor: (t) => (t.palette.mode === 'dark' ? alpha(t.palette.common.white, 0.1) : '#e9e9eb'),
  color: 'text.primary',
  borderRadius: '18px',
  borderBottomLeftRadius: 6,
  overflow: 'hidden',
  maxWidth: '92%',
};

/** Botón de sugerencia como lo pinta iOS: píldora clara con el icono de "abrir link". */
function Suggestion({ b }: { b: MixedButton }) {
  return (
    <Stack
      direction="row"
      alignItems="center"
      justifyContent="space-between"
      gap={1}
      sx={{
        mt: 0.75,
        px: 1.5,
        py: 0.9,
        borderRadius: 999,
        bgcolor: (t) => (t.palette.mode === 'dark' ? alpha(t.palette.common.white, 0.12) : alpha(t.palette.common.black, 0.06)),
      }}
    >
      <Typography
        sx={{ fontSize: 14, fontWeight: 500, lineHeight: 1.2 }}
        noWrap
      >
        {b.text.trim()}
      </Typography>
      <Box
        sx={{
          width: 18,
          height: 18,
          borderRadius: '50%',
          bgcolor: (t) => alpha(t.palette.text.primary, 0.45),
          color: 'background.paper',
          display: 'grid',
          placeItems: 'center',
          flexShrink: 0,
        }}
      >
        <ExploreOutlinedIcon sx={{ fontSize: 13 }} />
      </Box>
    </Stack>
  );
}

function TextBlock({
  title,
  body,
  buttons,
  dense,
}: {
  title?: string;
  body: string;
  buttons: MixedButton[];
  dense?: boolean;
}) {
  return (
    <Box sx={{ px: 1.5, py: 1.25 }}>
      {title && (
        <Typography
          sx={{ fontSize: dense ? 13 : 15, fontWeight: 700, lineHeight: 1.25, mb: 0.5 }}
        >
          {title}
        </Typography>
      )}
      <Typography
        sx={{
          fontSize: dense ? 12.5 : 14,
          lineHeight: 1.35,
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
        }}
      >
        {body}
      </Typography>
      {buttons.length > 0 && (
        <Box sx={{ mt: 0.5 }}>
          {buttons.map((b, i) => (
            <Suggestion
              key={i}
              b={b}
            />
          ))}
        </Box>
      )}
    </Box>
  );
}

export default function MixedRcsPreview(input: MixedPreviewInput) {
  const { imageSrc, value } = input;
  const { greeting, body, title, cards, buttons, cardButton } = buildMixedPreview(input);
  const mode = cards.length ? 'carousel' : !imageSrc ? 'text' : value.imageMode;

  return (
    <Stack
      gap={1}
      sx={{ maxWidth: 360, mx: 'auto' }}
    >
      <Typography
        variant="caption"
        color="text.secondary"
        textAlign="center"
        sx={{ fontSize: 11 }}
      >
        Hoy 3:23 PM
      </Typography>

      {mode === 'split' && (
        <>
          {/* Mensaje 1: la foto sola, sin recorte. */}
          <Box sx={{ ...bubbleSx, p: 0.5 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageSrc}
              alt=""
              style={{ display: 'block', width: '100%', maxHeight: 360, objectFit: 'contain', borderRadius: 14 }}
            />
          </Box>
          {/* Mensaje 2: texto + botones. El título pasa a primera línea, como en el scheduler. */}
          <Box sx={bubbleSx}>
            <TextBlock
              body={[title, body].filter(Boolean).join('\n\n')}
              buttons={buttons}
            />
          </Box>
        </>
      )}

      {mode === 'card' && (
        <Box sx={{ ...bubbleSx, maxWidth: '100%' }}>
          {/* TALL: la foto llena el ancho y se recorta a lo alto, como en el teléfono. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageSrc}
            alt=""
            style={{ display: 'block', width: '100%', aspectRatio: '1 / 1.05', objectFit: 'cover' }}
          />
          <TextBlock
            title={title}
            body={body}
            buttons={buttons}
          />
        </Box>
      )}

      {mode === 'carousel' && (
        <Stack
          direction="row"
          gap={1}
          sx={{ overflowX: 'auto', pb: 0.5, alignItems: 'flex-start' }}
        >
          <Box sx={{ ...bubbleSx, width: 230, flexShrink: 0, borderRadius: '14px' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageSrc}
              alt=""
              style={{ display: 'block', width: '100%', height: 150, objectFit: 'cover' }}
            />
            <TextBlock
              title={title}
              body={body}
              buttons={buttons}
              dense
            />
          </Box>
          {cards.map((p, i) => (
            <Box
              key={i}
              sx={{ ...bubbleSx, width: 170, flexShrink: 0, borderRadius: '14px' }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={p.imageUrl}
                alt=""
                loading="lazy"
                style={{ display: 'block', width: '100%', height: 150, objectFit: 'contain', background: '#fff' }}
              />
              <TextBlock
                body={`${p.name}${p.price ? ` — ${p.price}` : ''}`}
                buttons={cardButton ? [cardButton] : []}
                dense
              />
            </Box>
          ))}
        </Stack>
      )}

      {mode === 'text' && (
        <Box sx={bubbleSx}>
          <TextBlock
            body={greeting ? `${greeting} ${body}` : body}
            buttons={buttons}
          />
        </Box>
      )}

      <Typography
        variant="caption"
        color="text.secondary"
        textAlign="center"
        sx={{ fontSize: 11 }}
      >
        {mode === 'split'
          ? '2 mensajes: foto + texto con botones'
          : mode === 'card'
            ? 'Tarjeta alta (rich card)'
            : mode === 'carousel'
              ? `Carrusel: campaña + ${cards.length} productos`
              : 'Texto con botones (sin imagen)'}
      </Typography>
    </Stack>
  );
}
