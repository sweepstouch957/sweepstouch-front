'use client';

import { MODEL_META } from '@/components/application-ui/content-shells/ai-assistant/models';
import { getAvailableModels } from '@/services/ai.service';
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded';
import GraphicEqRoundedIcon from '@mui/icons-material/GraphicEqRounded';
import StopRoundedIcon from '@mui/icons-material/StopRounded';
import VolumeOffRoundedIcon from '@mui/icons-material/VolumeOffRounded';
import VolumeUpRoundedIcon from '@mui/icons-material/VolumeUpRounded';
import {
  Box,
  Button,
  Chip,
  Divider,
  IconButton,
  Menu,
  MenuItem,
  Stack,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { memo, useState } from 'react';
import { tint, tintBorder } from 'src/theme/semantic';
import { useBrand } from './brand';
import { PROVIDERS, type ModelChoice } from './constants';

type Props = {
  model: ModelChoice;
  speak: boolean;
  voiceOn: boolean;
  onPickModel: (model: ModelChoice) => void;
  onToggleSpeak: () => void;
  onToggleVoice: () => void;
};

/** Barra de modo: qué modelo responde, si lee en voz alta y la conversación por voz. */
export const BotToolbar = memo(function BotToolbar({
  model,
  speak,
  voiceOn,
  onPickModel,
  onToggleSpeak,
  onToggleVoice,
}: Props) {
  const theme = useTheme();
  const brand = useBrand();
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  // Las versiones se piden sólo al abrir el menú y quedan en caché.
  const { data: models } = useQuery({
    queryKey: ['ai', 'models', 'available'],
    queryFn: getAvailableModels,
    enabled: !!anchor,
    staleTime: 10 * 60 * 1000,
  });
  const label = MODEL_META[model.provider].label;
  const item = { fontSize: 12.5 };

  return (
    <Stack
      direction="row"
      alignItems="center"
      gap={0.75}
      sx={{ flexShrink: 0, px: 1.5, py: 1, borderBottom: '1px solid', borderColor: 'divider' }}
    >
      <Tooltip title="Elegir el modelo de IA">
        <Chip
          size="small"
          icon={<AutoAwesomeRoundedIcon />}
          label={label}
          aria-label={`Modelo: ${label}. Cambiar modelo`}
          aria-haspopup="menu"
          onClick={(e) => setAnchor(e.currentTarget)}
          sx={{
            height: 32,
            px: 0.5,
            fontSize: 12,
            fontWeight: 700,
            bgcolor: 'transparent',
            border: `1px solid ${tintBorder(theme, 'primary')}`,
            '& .MuiChip-icon': { fontSize: 15, color: 'primary.main' },
            '&:hover': { bgcolor: tint(theme, 'primary', 0.08) },
          }}
        />
      </Tooltip>
      <Tooltip
        title={
          speak ? 'Dejar de leer las respuestas en voz alta' : 'Leer las respuestas en voz alta'
        }
      >
        <IconButton
          aria-label="Leer las respuestas en voz alta"
          aria-pressed={speak}
          onClick={onToggleSpeak}
          sx={{
            width: 34,
            height: 34,
            color: speak ? 'primary.main' : 'text.secondary',
            bgcolor: speak ? tint(theme, 'primary', 0.12) : 'transparent',
          }}
        >
          {speak ? (
            <VolumeUpRoundedIcon sx={{ fontSize: 18 }} />
          ) : (
            <VolumeOffRoundedIcon sx={{ fontSize: 18 }} />
          )}
        </IconButton>
      </Tooltip>
      <Box flex={1} />
      <Button
        size="small"
        disableElevation
        variant={voiceOn ? 'outlined' : 'contained'}
        startIcon={voiceOn ? <StopRoundedIcon /> : <GraphicEqRoundedIcon />}
        aria-pressed={voiceOn}
        onClick={onToggleVoice}
        sx={{
          height: 34,
          px: 1.75,
          borderRadius: 999,
          fontSize: 12.5,
          fontWeight: 800,
          textTransform: 'none',
          boxShadow: 'none',
          ...(!voiceOn && {
            background: brand.gradient,
            '&:hover': { background: brand.gradient, boxShadow: 'none' },
          }),
        }}
      >
        {voiceOn ? 'Salir de voz' : 'Hablar con el bot'}
      </Button>

      <Menu
        anchorEl={anchor}
        open={!!anchor}
        onClose={() => setAnchor(null)}
        slotProps={{ paper: { sx: { width: 270, maxHeight: 420, borderRadius: 3 } } }}
      >
        {PROVIDERS.map((provider) => (
          <MenuItem
            key={provider}
            selected={provider === model.provider}
            onClick={() => onPickModel({ provider, version: '' })}
            sx={{ fontSize: 13.5, fontWeight: 700 }}
          >
            {MODEL_META[provider].label}
          </MenuItem>
        ))}
        <Divider />
        <Typography
          sx={{ px: 2, pt: 0.5, pb: 0.25, fontSize: 11, fontWeight: 700, color: 'text.secondary' }}
        >
          Versión de {label}
        </Typography>
        <MenuItem
          selected={!model.version}
          onClick={() => onPickModel({ ...model, version: '' })}
          sx={item}
        >
          Predeterminada
          {models?.current?.[model.provider] ? ` (${models.current[model.provider]})` : ''}
        </MenuItem>
        {!models && (
          <MenuItem
            disabled
            sx={item}
          >
            Cargando versiones…
          </MenuItem>
        )}
        {models?.[model.provider]?.map((version) => (
          <MenuItem
            key={version.id}
            selected={version.id === model.version}
            onClick={() => onPickModel({ ...model, version: version.id })}
            sx={item}
          >
            {version.display_name || version.id}
          </MenuItem>
        ))}
      </Menu>
    </Stack>
  );
});
