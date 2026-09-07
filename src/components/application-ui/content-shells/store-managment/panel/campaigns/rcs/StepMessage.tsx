'use client';

/** Paso 1 · El mensaje — tipo (carrusel/card/texto/archivo) y su contenido. */

import {
  Box,
  Button,
  Chip,
  MenuItem,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import CardEditor from './CardEditor';
import ProductPicker from './ProductPicker';
import { clip, MSG_TYPE_INFO, MsgType, TEXT_MAX } from './rcs-domain';
import type { RcsBuilderApi } from './use-rcs-builder';

export default function StepMessage({
  b,
  onCapError,
}: {
  b: RcsBuilderApi;
  onCapError: (msg: string) => void;
}) {
  const isCards = b.msgType === 'CAROUSEL' || b.msgType === 'CARD';

  return (
    <>
      <Typography
        variant="body2"
        color="text.secondary"
        mb={1.5}
      >
        Elegí qué recibe el cliente y armá el contenido.
      </Typography>

      <ToggleButtonGroup
        exclusive
        size="small"
        value={b.msgType}
        onChange={(_, v) => v && b.setMsgType(v)}
        sx={{ flexWrap: 'wrap' }}
      >
        {(Object.keys(MSG_TYPE_INFO) as MsgType[]).map((t) => (
          <ToggleButton
            key={t}
            value={t}
          >
            {MSG_TYPE_INFO[t].label}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
      <Typography
        variant="caption"
        color="text.secondary"
        display="block"
        mt={0.5}
        mb={1.5}
      >
        {MSG_TYPE_INFO[b.msgType].hint}
      </Typography>

      {b.msgType === 'CAROUSEL' && (
        <TextField
          size="small"
          select
          label="Ancho de las cards"
          value={b.cardWidth}
          onChange={(e) => b.setCardWidth(e.target.value as any)}
          sx={{ minWidth: 200, mb: 1.5 }}
        >
          <MenuItem value="MEDIUM">Mediano (recomendado)</MenuItem>
          <MenuItem value="SMALL">Chico</MenuItem>
        </TextField>
      )}
      {b.msgType === 'CARD' && (
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1.5}
          mb={1.5}
        >
          <TextField
            size="small"
            select
            label="Orientación"
            value={b.orientation}
            onChange={(e) => b.setOrientation(e.target.value as any)}
            sx={{ minWidth: 160 }}
          >
            <MenuItem value="VERTICAL">Vertical (imagen arriba)</MenuItem>
            <MenuItem value="HORIZONTAL">Horizontal (imagen al lado)</MenuItem>
          </TextField>
          {b.orientation === 'HORIZONTAL' && (
            <TextField
              size="small"
              select
              label="Imagen a la"
              value={b.alignment}
              onChange={(e) => b.setAlignment(e.target.value as any)}
              sx={{ minWidth: 150 }}
            >
              <MenuItem value="LEFT">Izquierda</MenuItem>
              <MenuItem value="RIGHT">Derecha</MenuItem>
            </TextField>
          )}
        </Stack>
      )}

      {b.msgType === 'TEXT' && (
        <TextField
          fullWidth
          multiline
          rows={4}
          label="Texto del mensaje"
          value={b.text}
          onChange={(e) => b.setText(clip(e.target.value, TEXT_MAX))}
          helperText={`${b.text.length}/${TEXT_MAX} — se muestra tal cual en el chat.`}
        />
      )}

      {b.msgType === 'FILE' && (
        <Stack spacing={1.5}>
          <TextField
            size="small"
            label="URL del archivo (imagen, video o PDF)"
            value={b.fileUrl}
            onChange={(e) => b.setFileUrl(e.target.value)}
            fullWidth
            helperText="Tiene que ser una URL pública https."
          />
          <TextField
            size="small"
            label="URL de miniatura (opcional)"
            value={b.thumbUrl}
            onChange={(e) => b.setThumbUrl(e.target.value)}
            fullWidth
          />
        </Stack>
      )}

      {isCards && (
        <>
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            flexWrap="wrap"
            gap={1}
            mt={1}
            mb={1}
          >
            <Typography
              variant="subtitle2"
              fontWeight={700}
            >
              {b.msgType === 'CARD' ? 'Elegí el producto de la card' : 'Elegí los productos (2–10)'}
            </Typography>
            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
            >
              <Chip
                size="small"
                color={b.stepProblems[0].length === 0 ? 'success' : 'default'}
                label={b.msgType === 'CARD' ? `${b.cards.length}/1` : `${b.cards.length}/10`}
              />
              <Button
                size="small"
                variant="outlined"
                disabled={b.cards.length >= (b.msgType === 'CARD' ? 1 : 10)}
                onClick={b.addBlankCard}
              >
                Card en blanco
              </Button>
            </Stack>
          </Stack>

          <ProductPicker
            products={b.products}
            filtered={b.filtered}
            loading={b.loadingCatalog}
            search={b.search}
            onSearch={b.setSearch}
            cards={b.cards}
            onToggle={(p) => {
              const err = b.toggleProduct(p);
              if (err) onCapError(err);
            }}
          />

          {b.cards.length > 0 && (
            <>
              <Typography
                variant="subtitle2"
                fontWeight={700}
                mt={2}
                mb={1}
              >
                Personalizá cada card
              </Typography>
              <Stack spacing={1}>
                {b.cards.map((c, i) => (
                  <CardEditor
                    key={c.uid}
                    card={c}
                    index={i}
                    total={b.cards.length}
                    canReorder={b.msgType === 'CAROUSEL'}
                    onPatch={(patch) => b.patchCard(c.uid, patch)}
                    onMove={(dir) => b.moveCard(c.uid, dir)}
                    onRemove={() => b.removeCard(c.uid)}
                  />
                ))}
              </Stack>
            </>
          )}
        </>
      )}

      {/* PendingList + navegación los pone el orquestador */}
      <Box />
    </>
  );
}
