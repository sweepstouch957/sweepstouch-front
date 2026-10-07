'use client';

import AddRoundedIcon from '@mui/icons-material/AddRounded';
import {
  DragDropContext,
  Draggable,
  Droppable,
  type DropResult,
} from '@hello-pangea/dnd';
import {
  Alert,
  Box,
  Button,
  Chip,
  Stack,
  Tooltip,
  Typography,
  alpha,
  useTheme,
} from '@mui/material';
import React from 'react';
import { BOARD_STATUSES, type StatusMeta } from './constants';
import { CardTile } from './card-tile';
import { visibleCards } from './permissions';
import { useCurrentUser, useDesignStore } from './store';
import type { CardStatus, DesignCard } from './types';

/**
 * Tablero Kanban de 9 columnas.
 *
 * Drag & drop igual que el tablero de Tasks del panel (misma librería y misma
 * animación), pero SÓLO para admins: el diseñador y el flujo de auditoría se
 * mueven por botones, que es lo que preserva la integridad de los tiempos y el
 * paso obligado por auditoría.
 */

interface ColumnProps {
  meta: StatusMeta;
  cards: DesignCard[];
  onOpen: (id: string) => void;
  canDrag: boolean;
}

const Column = React.memo(function Column({ meta, cards, onOpen, canDrag }: ColumnProps) {
  const theme = useTheme();
  const color = theme.palette[meta.role].main;

  return (
    <Box
      sx={{
        width: 288,
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 2,
        bgcolor: alpha(theme.palette.text.primary, theme.palette.mode === 'dark' ? 0.04 : 0.02),
        border: '1px solid',
        borderColor: 'divider',
        // Sin este mínimo el contenedor flex reparte el alto y la lista nunca
        // llega a desbordar, así que no aparece el scroll.
        minHeight: 0,
        height: '100%',
      }}
    >
      {/* Cabecera fija: la lista scrollea debajo */}
      <Box
        sx={{
          p: 1.5,
          borderTop: `3px solid ${color}`,
          borderRadius: '8px 8px 0 0',
          flexShrink: 0,
        }}
      >
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          spacing={1}
        >
          <Tooltip title={meta.hint}>
            <Typography
              variant="subtitle2"
              fontWeight={700}
              noWrap
            >
              {meta.label}
            </Typography>
          </Tooltip>
          <Chip
            size="small"
            label={cards.length}
            sx={{ height: 20, fontSize: 11, bgcolor: alpha(color, 0.15), color, fontWeight: 700 }}
          />
        </Stack>
      </Box>

      <Droppable
        droppableId={meta.key}
        isDropDisabled={!canDrag}
      >
        {(provided, snapshot) => (
          <Box
            ref={provided.innerRef}
            {...provided.droppableProps}
            sx={{
              flex: 1,
              minHeight: 0,
              overflowY: 'auto',
              p: 1,
              pt: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: 1,
              borderRadius: 2,
              bgcolor: snapshot.isDraggingOver ? alpha(color, 0.07) : 'transparent',
              border: `2px dashed ${snapshot.isDraggingOver ? alpha(color, 0.4) : 'transparent'}`,
              transition: 'background-color .15s ease',
              '&::-webkit-scrollbar': { width: 6 },
              '&::-webkit-scrollbar-thumb': {
                bgcolor: alpha(color, 0.25),
                borderRadius: 3,
              },
            }}
          >
            {cards.map((card, index) => (
              <Draggable
                key={card.id}
                draggableId={card.id}
                index={index}
                isDragDisabled={!canDrag}
              >
                {(dragProvided, dragSnapshot) => (
                  <Box
                    ref={dragProvided.innerRef}
                    {...dragProvided.draggableProps}
                    {...dragProvided.dragHandleProps}
                    sx={{
                      // Las tarjetas nunca se comprimen para caber: con muchas
                      // se recorta el contenido y el texto queda ilegible.
                      flexShrink: 0,
                      opacity: dragSnapshot.isDragging ? 0.9 : 1,
                    }}
                    style={dragProvided.draggableProps.style}
                  >
                    <CardTile
                      card={card}
                      onOpen={onOpen}
                      dragging={dragSnapshot.isDragging}
                    />
                  </Box>
                )}
              </Draggable>
            ))}
            {provided.placeholder}

            {cards.length === 0 && !snapshot.isDraggingOver && (
              <Typography
                variant="caption"
                color="text.disabled"
                sx={{ p: 1.5, textAlign: 'center' }}
              >
                {canDrag ? 'Arrastrá tarjetas acá' : 'Sin tarjetas'}
              </Typography>
            )}
          </Box>
        )}
      </Droppable>
    </Box>
  );
});

interface Props {
  onOpenCard: (id: string) => void;
  onCreate: () => void;
  /** Mover a Errores/Updates exige causa: la pide el contenedor. */
  onNeedsCause: (cardId: string) => void;
}

export function Board({ onOpenCard, onCreate, onNeedsCause }: Props): React.JSX.Element {
  const cards = useDesignStore((s) => s.cards);
  const moveTo = useDesignStore((s) => s.moveTo);
  const user = useCurrentUser();

  const isAdmin = user.role === 'admin';

  const mine = React.useMemo(() => visibleCards(cards, user), [cards, user]);

  const byStatus = React.useMemo(() => {
    const map = new Map<string, DesignCard[]>();
    BOARD_STATUSES.forEach((s) => map.set(s.key, []));
    mine.forEach((c) => map.get(c.status)?.push(c));
    return map;
  }, [mine]);

  const onDragEnd = React.useCallback(
    (result: DropResult) => {
      const { draggableId, source, destination } = result;
      if (!destination || destination.droppableId === source.droppableId) return;

      const target = destination.droppableId as CardStatus;
      // Errores/Updates no se puede resolver acá: necesita la causa.
      if (target === 'errores_updates') {
        onNeedsCause(draggableId);
        return;
      }
      moveTo(draggableId, target);
    },
    [moveTo, onNeedsCause]
  );

  return (
    <Stack
      spacing={2}
      sx={{ height: '100%' }}
    >
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        spacing={2}
      >
        <Typography
          variant="body2"
          color="text.secondary"
        >
          {mine.length} tarjeta(s)
          {user.role === 'designer' && ' asignadas a vos'}
        </Typography>
        {isAdmin && (
          <Button
            variant="contained"
            startIcon={<AddRoundedIcon />}
            onClick={onCreate}
          >
            Agregar tarjeta
          </Button>
        )}
      </Stack>

      {!isAdmin && (
        <Alert severity="info">
          Tus tarjetas se mueven con los botones de cada una. El arrastre manual es sólo para
          administración.
        </Alert>
      )}

      <DragDropContext onDragEnd={onDragEnd}>
        <Box
          sx={{
            display: 'flex',
            gap: 1.5,
            overflowX: 'auto',
            overflowY: 'hidden',
            pb: 1.5,
            alignItems: 'stretch',
            // Alto fijo del tablero: cada columna scrollea por dentro en vez de
            // estirar la página entera.
            height: { xs: 'auto', md: 'calc(100vh - 330px)' },
            minHeight: 480,
            '&::-webkit-scrollbar': { height: 8 },
            '&::-webkit-scrollbar-thumb': { bgcolor: 'divider', borderRadius: 4 },
          }}
        >
          {BOARD_STATUSES.map((meta) => (
            <Column
              key={meta.key}
              meta={meta}
              cards={byStatus.get(meta.key) ?? []}
              onOpen={onOpenCard}
              canDrag={isAdmin}
            />
          ))}
        </Box>
      </DragDropContext>
    </Stack>
  );
}

export default Board;
