import { Task } from '@/services/task.service';
import { Draggable, Droppable } from '@hello-pangea/dnd';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import ViewKanbanRoundedIcon from '@mui/icons-material/ViewKanbanRounded';
import {
  alpha,
  Box,
  Button,
  IconButton,
  Stack,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material';
import React from 'react';
import { statusMeta } from './constants';
import { KanbanTaskCard } from './kanban-task-card';

export const KanbanColumn = React.memo(function KanbanColumn({
  statusKey,
  tasks,
  onEdit,
  onDelete,
  onAdd,
}: {
  statusKey: string;
  tasks: Task[];
  onEdit: (t: Task) => void;
  onDelete: (id: string) => void;
  onAdd: (status: string) => void;
}) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const meta = statusMeta(theme, statusKey);

  return (
    <Box
      sx={{
        minWidth: { xs: '100%', md: 260 },
        maxWidth: { md: 300 },
        flex: { md: '1 1 260px' },
        mr: { md: 1.5 },
        mb: { xs: 2, md: 0 },
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Column Header */}
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        mb={1.25}
        px={0.5}
        sx={{ flexShrink: 0 }}
      >
        <Stack
          direction="row"
          alignItems="center"
          spacing={1}
        >
          <Box
            sx={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              bgcolor: meta.color,
              outline: `3px solid ${alpha(meta.color, 0.2)}`,
            }}
          />
          <Typography
            variant="subtitle2"
            fontWeight={700}
            fontSize={12.5}
            color="text.primary"
          >
            {meta.label}
          </Typography>
          <Box
            sx={{
              minWidth: 22,
              height: 20,
              px: 0.75,
              borderRadius: 1,
              bgcolor: alpha(meta.color, 0.12),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Typography
              variant="caption"
              fontWeight={800}
              fontSize={10}
              color={meta.color}
            >
              {tasks.length}
            </Typography>
          </Box>
        </Stack>
        <Tooltip title="Add task">
          <IconButton
            size="small"
            onClick={() => onAdd(statusKey)}
            sx={{
              opacity: 0.4,
              '&:hover': { opacity: 1, bgcolor: alpha(meta.color, 0.1), color: meta.color },
              width: 24,
              height: 24,
            }}
          >
            <AddRoundedIcon sx={{ fontSize: 16 }} />
          </IconButton>
        </Tooltip>
      </Stack>

      {/* Droppable area */}
      <Droppable droppableId={statusKey}>
        {(provided, snapshot) => (
          <Box
            ref={provided.innerRef}
            {...provided.droppableProps}
            sx={{
              flex: 1,
              minHeight: 140,
              maxHeight: { xs: 'none', md: 'calc(100vh - 400px)' },
              overflowY: 'auto',
              p: 1,
              borderRadius: 2,
              bgcolor: snapshot.isDraggingOver
                ? alpha(meta.color, 0.07)
                : isDark
                  ? alpha(theme.palette.common.white, 0.02)
                  : alpha(theme.palette.common.black, 0.015),
              border: `2px dashed ${
                snapshot.isDraggingOver ? alpha(meta.color, 0.4) : 'transparent'
              }`,
              transition: 'all 0.15s ease',
              '&::-webkit-scrollbar': { width: 4 },
              '&::-webkit-scrollbar-thumb': { bgcolor: alpha(meta.color, 0.2), borderRadius: 2 },
            }}
          >
            {tasks.map((t, index) => (
              <Draggable
                key={t._id}
                draggableId={t._id}
                index={index}
              >
                {(draggableProvided, draggableSnapshot) => (
                  <KanbanTaskCard
                    task={t}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    dragging={draggableSnapshot.isDragging}
                    ref={draggableProvided.innerRef}
                    style={draggableProvided.draggableProps.style}
                    {...draggableProvided.draggableProps}
                    {...draggableProvided.dragHandleProps}
                  />
                )}
              </Draggable>
            ))}
            {provided.placeholder}
            {tasks.length === 0 && !snapshot.isDraggingOver && (
              <Stack
                alignItems="center"
                justifyContent="center"
                sx={{
                  py: 5,
                  opacity: 0.35,
                  border: `1px dashed ${alpha(meta.color, 0.3)}`,
                  borderRadius: 2,
                }}
              >
                <ViewKanbanRoundedIcon sx={{ fontSize: 24, color: meta.color, mb: 0.5 }} />
                <Typography
                  variant="caption"
                  color="text.disabled"
                  textAlign="center"
                  fontSize={11}
                >
                  Drop tasks here
                </Typography>
              </Stack>
            )}
          </Box>
        )}
      </Droppable>

      {/* Quick-add */}
      <Button
        size="small"
        startIcon={<AddRoundedIcon sx={{ fontSize: 13 }} />}
        onClick={() => onAdd(statusKey)}
        fullWidth
        sx={{
          mt: 0.75,
          py: 0.5,
          borderRadius: 1.5,
          textTransform: 'none',
          fontSize: 11,
          fontWeight: 600,
          color: alpha(meta.color, 0.7),
          border: `1px dashed ${alpha(meta.color, 0.2)}`,
          '&:hover': {
            bgcolor: alpha(meta.color, 0.06),
            borderColor: meta.color,
            color: meta.color,
          },
        }}
      >
        Add task
      </Button>
    </Box>
  );
});
