'use client';

import { avatarSrc } from '@/utils/avatar';
import { formatDue } from '@/utils/due-date';
import AttachFileRoundedIcon from '@mui/icons-material/AttachFileRounded';
import ErrorOutlineRoundedIcon from '@mui/icons-material/ErrorOutlineRounded';
import EventRoundedIcon from '@mui/icons-material/EventRounded';
import FlagRoundedIcon from '@mui/icons-material/FlagRounded';
import HistoryRoundedIcon from '@mui/icons-material/HistoryRounded';
import StorefrontRoundedIcon from '@mui/icons-material/StorefrontRounded';
import {
  alpha,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Stack,
  TextField,
  Typography,
  useTheme,
} from '@mui/material';
import React from 'react';
import { priorityMeta } from './constants';
import { Panel } from './task-detail-pieces';
import { InlineText, InlineTitle, SectionLabel } from './task-inline-fields';
import { TaskComments } from './task-comments';
import type { TaskDetailController } from './use-task-detail';

/**
 * Columna principal: lo que se lee y se edita de la tarea, en el orden en que
 * importa — qué es, qué la frena, cuándo se da por cerrada, qué lo prueba y
 * qué se dijo.
 */
export function TaskDetailMain({ ctrl, taskId }: { ctrl: TaskDetailController; taskId: string }) {
  const theme = useTheme();
  const {
    task,
    value,
    set,
    status,
    assignee,
    overdue,
    files,
    uploading,
    uploadEvidence,
    teamMembers,
  } = ctrl;

  if (!task) return null;
  const pri = priorityMeta(theme, value('priority'));

  return (
    <Stack spacing={2}>
      {/* Portada */}
      <Panel
        accent={pri.color}
        delay={0}
        pad={false}
      >
        <Box sx={{ p: { xs: 2, md: 3 } }}>
          <InlineTitle
            value={value('title') ?? ''}
            onChange={(v) => set({ title: v })}
          />

          {/* Quién, cuándo y para quién — de un vistazo */}
          <Stack
            direction="row"
            spacing={1}
            flexWrap="wrap"
            useFlexGap
            alignItems="center"
            sx={{ mt: 1.75 }}
          >
            {(assignee || value('assigneeName')) && (
              <Chip
                avatar={
                  <Avatar src={avatarSrc(assignee?.profileImage || value('assigneeAvatar'))}>
                    {(value('assigneeName') || '?')[0]}
                  </Avatar>
                }
                label={value('assigneeName') || 'Sin responsable'}
                size="small"
                sx={{ height: 28, fontSize: 11.5, fontWeight: 700, pl: 0.25 }}
              />
            )}
            <Chip
              icon={
                overdue ? (
                  <ErrorOutlineRoundedIcon sx={{ fontSize: '14px !important' }} />
                ) : (
                  <EventRoundedIcon sx={{ fontSize: '14px !important' }} />
                )
              }
              label={formatDue(task.dueDate)}
              size="small"
              sx={{
                height: 28,
                fontSize: 11.5,
                fontWeight: 700,
                fontVariantNumeric: 'tabular-nums',
                bgcolor: alpha(
                  overdue ? theme.palette.error.main : theme.palette.text.primary,
                  0.08
                ),
                color: overdue ? theme.palette.error.main : theme.palette.text.secondary,
                '& .MuiChip-icon': { color: 'inherit' },
              }}
            />
            <Chip
              icon={<FlagRoundedIcon sx={{ fontSize: '14px !important' }} />}
              label={pri.label}
              size="small"
              sx={{
                height: 28,
                fontSize: 11.5,
                fontWeight: 700,
                bgcolor: alpha(pri.color, 0.12),
                color: pri.color,
                '& .MuiChip-icon': { color: 'inherit' },
              }}
            />
            {task.storeName && (
              <Chip
                icon={<StorefrontRoundedIcon sx={{ fontSize: '14px !important' }} />}
                label={task.storeName}
                size="small"
                sx={{ height: 28, fontSize: 11.5, fontWeight: 600 }}
              />
            )}
            {task.tags?.map((t) => (
              <Chip
                key={t}
                label={t}
                size="small"
                sx={{
                  height: 28,
                  fontSize: 11,
                  fontWeight: 700,
                  bgcolor: alpha(theme.palette.primary.main, 0.08),
                  color: 'primary.main',
                }}
              />
            ))}
          </Stack>

          <Box sx={{ mt: 2.5 }}>
            <SectionLabel>Descripción</SectionLabel>
            <InlineText
              value={value('description') ?? ''}
              onChange={(v) => set({ description: v })}
              placeholder="Contá de qué se trata, qué se acordó, qué hace falta…"
              minRows={3}
            />
          </Box>
        </Box>
      </Panel>

      {/* Bloqueo: lo primero que hay que ver */}
      {status === 'blocked' && (
        <Panel
          role="error"
          title="Qué la tiene frenada"
          delay={1}
        >
          <Stack spacing={1.5}>
            <TextField
              size="small"
              fullWidth
              label="Qué se necesita"
              value={value('blockedReason') ?? ''}
              onChange={(e) => set({ blockedReason: e.target.value })}
            />
            <TextField
              size="small"
              fullWidth
              label="Quién lo destraba"
              value={value('blockerOwner') ?? ''}
              onChange={(e) => set({ blockerOwner: e.target.value })}
              helperText="Un bloqueo sin nombre no es un bloqueo, es un atraso."
            />
          </Stack>
        </Panel>
      )}

      {/* Cierre */}
      <Panel delay={2}>
        <SectionLabel>Cierre cuando…</SectionLabel>
        <InlineText
          value={value('closureCriteria') ?? ''}
          onChange={(v) => set({ closureCriteria: v })}
          placeholder="exista contrato firmado y comprobante del depósito"
          bold
        />
        <Typography
          variant="caption"
          color="text.disabled"
          sx={{ display: 'block', mt: 0.75, fontSize: 11 }}
        >
          Es el árbitro cuando se discuta si la tarea terminó.
        </Typography>

        <Box sx={{ mt: 2.5 }}>
          <SectionLabel>Siguiente paso</SectionLabel>
          <InlineText
            value={value('nextStep') ?? ''}
            onChange={(v) => set({ nextStep: v })}
            placeholder="enviar la versión final a revisión"
          />
        </Box>
      </Panel>

      {/* Evidencias */}
      <Panel
        title={`Evidencias · ${files.length}`}
        delay={3}
      >
        <Stack
          direction="row"
          flexWrap="wrap"
          gap={1}
          alignItems="center"
        >
          {files.map((f) =>
            f.type?.startsWith('image/') ? (
              <Box
                key={f.url}
                component="a"
                href={f.url}
                target="_blank"
                rel="noopener"
                aria-label={f.name || 'Ver evidencia'}
                sx={{
                  width: 104,
                  height: 104,
                  borderRadius: 2.5,
                  border: `1px solid ${alpha(theme.palette.divider, 0.8)}`,
                  backgroundImage: `url(${f.url})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  transition: 'transform .18s, border-color .18s',
                  '&:hover': {
                    transform: 'scale(1.04)',
                    borderColor: theme.palette.primary.main,
                  },
                  '@media (prefers-reduced-motion: reduce)': { transition: 'none' },
                }}
              />
            ) : (
              <Chip
                key={f.url}
                icon={<AttachFileRoundedIcon sx={{ fontSize: 14 }} />}
                label={f.name || 'archivo'}
                component="a"
                href={f.url}
                target="_blank"
                clickable
                sx={{ height: 36, maxWidth: 220, fontSize: 11.5, borderRadius: 2 }}
              />
            )
          )}

          <Button
            component="label"
            disabled={uploading}
            sx={{
              width: 104,
              height: 104,
              borderRadius: 2.5,
              flexDirection: 'column',
              gap: 0.5,
              textTransform: 'none',
              fontSize: 10.5,
              fontWeight: 600,
              color: 'text.secondary',
              border: `1.5px dashed ${alpha(theme.palette.divider, 0.9)}`,
              '&:hover': {
                borderColor: 'primary.main',
                color: 'primary.main',
                bgcolor: alpha(theme.palette.primary.main, 0.04),
              },
            }}
          >
            {uploading ? (
              <CircularProgress size={18} />
            ) : (
              <AttachFileRoundedIcon sx={{ fontSize: 20 }} />
            )}
            {uploading ? 'Subiendo…' : 'Adjuntar'}
            <input
              hidden
              multiple
              type="file"
              accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.csv"
              onChange={uploadEvidence}
            />
          </Button>
        </Stack>

        {files.length === 0 && (
          <Typography
            variant="caption"
            color="text.disabled"
            sx={{ display: 'block', mt: 1.25, fontSize: 11 }}
          >
            Lo que pruebe que el criterio de cierre se cumplió. Sale en el PDF de estado.
          </Typography>
        )}
      </Panel>

      {/* Conversación */}
      <Panel delay={4}>
        <TaskComments
          taskId={taskId}
          teamMembers={teamMembers}
        />
      </Panel>

      {/* Bitácora */}
      {(task.activity?.length ?? 0) > 0 && (
        <Panel
          title="Bitácora"
          delay={5}
        >
          <Stack spacing={1.5}>
            {[...(task.activity || [])].reverse().map((a, i) => (
              <Stack
                key={i}
                direction="row"
                spacing={1.25}
              >
                <HistoryRoundedIcon
                  sx={{ fontSize: 15, color: 'text.disabled', mt: 0.25, flexShrink: 0 }}
                />
                <Box minWidth={0}>
                  <Typography sx={{ fontSize: 12.5, lineHeight: 1.45 }}>
                    {a.statusChange && (
                      <Box
                        component="span"
                        sx={{ fontWeight: 700, mr: 0.5 }}
                      >
                        {a.statusChange}
                      </Box>
                    )}
                    {a.text}
                  </Typography>
                  <Typography sx={{ fontSize: 10, color: 'text.disabled' }}>
                    {formatDue(a.at)}
                    {a.by ? ` · ${a.by}` : ''}
                  </Typography>
                </Box>
              </Stack>
            ))}
          </Stack>
        </Panel>
      )}
    </Stack>
  );
}
