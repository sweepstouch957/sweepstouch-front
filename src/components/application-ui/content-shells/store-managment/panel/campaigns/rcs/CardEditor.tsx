'use client';

/** Acordeón de UNA card del carrusel — título, descripción, media y botones. */

import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Avatar,
  Button,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import ButtonListEditor from './ButtonListEditor';
import { CardData, clip, DESC_MAX, TITLE_MAX } from './rcs-domain';

export default function CardEditor({
  card,
  index,
  total,
  canReorder,
  onPatch,
  onMove,
  onRemove,
}: {
  card: CardData;
  index: number;
  total: number;
  canReorder: boolean;
  onPatch: (patch: Partial<CardData>) => void;
  onMove: (dir: -1 | 1) => void;
  onRemove: () => void;
}) {
  return (
    <Accordion
      disableGutters
      variant="outlined"
      sx={{ '&:before': { display: 'none' } }}
    >
      <AccordionSummary expandIcon={<ExpandMoreRoundedIcon />}>
        <Stack
          direction="row"
          alignItems="center"
          spacing={1.5}
          minWidth={0}
          flex={1}
        >
          <Avatar
            variant="rounded"
            src={card.mediaUrl || undefined}
            sx={{ width: 34, height: 34, bgcolor: 'action.hover', color: 'text.secondary', fontSize: 14 }}
          >
            {(card.title || '?').charAt(0).toUpperCase()}
          </Avatar>
          <Typography
            variant="body2"
            fontWeight={600}
            noWrap
          >
            {index + 1} · {card.title || 'Card sin título'}
          </Typography>
        </Stack>
      </AccordionSummary>
      <AccordionDetails>
        <Stack spacing={1.5}>
          <TextField
            size="small"
            label={`Título (${card.title.length}/${TITLE_MAX})`}
            value={card.title}
            onChange={(e) => onPatch({ title: clip(e.target.value, TITLE_MAX) })}
            fullWidth
          />
          <TextField
            size="small"
            label="Descripción"
            value={card.description}
            onChange={(e) => onPatch({ description: clip(e.target.value, DESC_MAX) })}
            fullWidth
            multiline
            rows={2}
          />
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={1}
          >
            <TextField
              size="small"
              label="URL de la imagen/video"
              value={card.mediaUrl}
              onChange={(e) => onPatch({ mediaUrl: e.target.value })}
              sx={{ flex: 1, minWidth: 200 }}
            />
            <TextField
              size="small"
              select
              label="Alto de la imagen"
              value={card.mediaHeight}
              onChange={(e) => onPatch({ mediaHeight: e.target.value as CardData['mediaHeight'] })}
              sx={{ minWidth: 150 }}
            >
              <MenuItem value="SHORT">Bajo</MenuItem>
              <MenuItem value="MEDIUM">Medio</MenuItem>
              <MenuItem value="TALL">Alto</MenuItem>
            </TextField>
          </Stack>

          <Typography
            variant="caption"
            fontWeight={700}
            color="text.secondary"
          >
            Botones de esta card (máx. 4)
          </Typography>
          <ButtonListEditor
            buttons={card.buttons}
            onChange={(next) => onPatch({ buttons: next.slice(0, 4) })}
            max={4}
            allowAdd={!!card.productId}
            emptyHint="Sin botones — la card es sólo informativa."
          />

          <Stack
            direction="row"
            spacing={1}
            justifyContent="flex-end"
          >
            {canReorder && (
              <>
                <Button
                  size="small"
                  disabled={index === 0}
                  onClick={() => onMove(-1)}
                >
                  ← Mover
                </Button>
                <Button
                  size="small"
                  disabled={index === total - 1}
                  onClick={() => onMove(1)}
                >
                  Mover →
                </Button>
              </>
            )}
            <Button
              size="small"
              color="error"
              onClick={onRemove}
            >
              Quitar card
            </Button>
          </Stack>
        </Stack>
      </AccordionDetails>
    </Accordion>
  );
}
