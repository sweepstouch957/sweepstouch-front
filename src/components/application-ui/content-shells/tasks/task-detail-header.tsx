'use client';

import { Task } from '@/services/task.service';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import ContentCopyRoundedIcon from '@mui/icons-material/ContentCopyRounded';
import PictureAsPdfRoundedIcon from '@mui/icons-material/PictureAsPdfRounded';
import {
  alpha,
  Box,
  Chip,
  Container,
  IconButton,
  MenuItem,
  Stack,
  TextField,
  Tooltip,
  useTheme,
} from '@mui/material';
import React from 'react';
import { statusEntries, statusMeta } from './constants';

type Props = {
  task: Task;
  status: string;
  epic?: { name: string; color: string } | null;
  changingStatus: boolean;
  onStatusChange: (status: string) => void;
  onBack: () => void;
  onShare: (kind: 'pdf' | 'panel') => void;
};

/**
 * Barra pegada del detalle: dónde estoy, en qué estado está y cómo la comparto.
 *
 * Va `sticky` con `top: 0` a propósito. Su contenedor de scroll ya empieza
 * debajo del navbar fijo —el shell le reserva ese hueco—, así que sumarle el
 * alto del navbar contaba el espacio dos veces y dejaba una banda vacía entre
 * el navbar y esta barra, del alto exacto de la cabecera.
 */
export function TaskDetailHeader({
  task,
  status,
  epic,
  changingStatus,
  onStatusChange,
  onBack,
  onShare,
}: Props) {
  const theme = useTheme();
  const meta = statusMeta(theme, status);

  return (
    <Box
      sx={{
        position: 'sticky',
        top: 0,
        zIndex: 10,
        // Opaca, no translúcida: el título pasa por debajo al hacer scroll y a
        // través del velo se leía como un texto cortado por la mitad.
        bgcolor: 'background.paper',
        borderBottom: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
      }}
    >
      {/* Hilo de color del estado: se sabe dónde está la tarea antes de leer */}
      <Box sx={{ height: 3, bgcolor: meta.color }} />

      <Container
        maxWidth="xl"
        sx={{ py: 1 }}
      >
        <Stack
          direction="row"
          alignItems="center"
          spacing={1}
        >
          <IconButton
            onClick={onBack}
            aria-label="Volver al tablero"
            sx={{ width: 40, height: 40 }}
          >
            <ArrowBackRoundedIcon sx={{ fontSize: 20 }} />
          </IconButton>

          <Chip
            label={task.identifier}
            size="small"
            sx={{
              fontFamily: 'monospace',
              fontWeight: 800,
              fontSize: 11,
              letterSpacing: 0.3,
              bgcolor: alpha(theme.palette.primary.main, 0.1),
              color: 'primary.main',
            }}
          />

          {epic && (
            <Chip
              size="small"
              label={epic.name}
              sx={{
                height: 22,
                fontSize: 10.5,
                fontWeight: 700,
                display: { xs: 'none', sm: 'inline-flex' },
                bgcolor: alpha(epic.color, 0.14),
                color: epic.color,
              }}
            />
          )}

          <Box flex={1} />

          <TextField
            select
            size="small"
            value={status}
            disabled={changingStatus}
            onChange={(e) => onStatusChange(e.target.value)}
            SelectProps={{ 'aria-label': 'Estado de la tarea' } as any}
            sx={{
              minWidth: { xs: 132, sm: 148 },
              '& .MuiOutlinedInput-root': {
                height: 38,
                borderRadius: 5,
                fontWeight: 800,
                fontSize: 12.5,
                color: meta.color,
                bgcolor: alpha(meta.color, 0.1),
                transition: 'background-color .2s',
                '& fieldset': { borderColor: alpha(meta.color, 0.35) },
                '&:hover fieldset': { borderColor: meta.color },
              },
            }}
          >
            {statusEntries(theme).map(([k, m]) => (
              <MenuItem
                key={k}
                value={k}
              >
                <Stack
                  direction="row"
                  alignItems="center"
                  spacing={1}
                >
                  <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: m.color }} />
                  <span>{m.label}</span>
                </Stack>
              </MenuItem>
            ))}
          </TextField>

          <Tooltip
            title="PDF de estado"
            arrow
          >
            <IconButton
              onClick={() => onShare('pdf')}
              aria-label="Abrir PDF de estado"
              sx={{ width: 40, height: 40 }}
            >
              <PictureAsPdfRoundedIcon sx={{ fontSize: 19 }} />
            </IconButton>
          </Tooltip>

          <Tooltip
            title="Copiar link"
            arrow
          >
            <IconButton
              onClick={() => onShare('panel')}
              aria-label="Copiar link de la tarea"
              sx={{ width: 40, height: 40, display: { xs: 'none', sm: 'inline-flex' } }}
            >
              <ContentCopyRoundedIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>
        </Stack>
      </Container>
    </Box>
  );
}
