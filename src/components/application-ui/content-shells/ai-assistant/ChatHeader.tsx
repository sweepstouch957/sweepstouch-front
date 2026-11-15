'use client';

import { refreshConversationContext } from '@/services/ai.service';
import MenuRoundedIcon from '@mui/icons-material/MenuRounded';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import {
  alpha,
  Avatar,
  Box,
  IconButton,
  Stack,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import toast from 'react-hot-toast';
import { getModelLabel } from './models';
import { SIcon } from './SIcon';
import type { useAiChat } from './use-ai-chat';

type Props = Pick<
  ReturnType<typeof useAiChat>,
  'activeConvId' | 'streaming' | 'setSidebarOpen' | 'selectedModel'
>;

/** Encabezado del chat: menú, modelo elegido (con versiones en vivo) y ajustes. */
export function ChatHeader({ activeConvId, streaming, setSidebarOpen, selectedModel }: Props) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const accent = theme.palette.primary.main;
  const mdUp = useMediaQuery(theme.breakpoints.up('md'));

  return (
    <Box
      sx={{
        px: { xs: 1.25, sm: 2 },
        py: { xs: 1, sm: 1.5 },
        flexShrink: 0,
        borderBottom: `1px solid ${theme.palette.divider}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        bgcolor: isDark ? alpha(theme.palette.common.black, 0.15) : theme.palette.background.paper,
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        spacing={1}
      >
        {!mdUp && (
          <IconButton
            size="small"
            onClick={() => setSidebarOpen(true)}
          >
            <MenuRoundedIcon fontSize="small" />
          </IconButton>
        )}
        <Avatar sx={{ width: 30, height: 30, bgcolor: alpha(accent, 0.12) }}>
          <SIcon
            size={18}
            color={accent}
            pulse={streaming}
          />
        </Avatar>
        <Box>
          <Typography
            variant="subtitle2"
            fontWeight={700}
            fontSize={13}
          >
            Sweepstouch AI
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
            fontSize={10}
          >
            {getModelLabel(selectedModel)} • {streaming ? 'Thinking...' : 'Online'}
          </Typography>
        </Box>
      </Stack>

      <Stack
        direction="row"
        spacing={0.5}
        alignItems="center"
      >
        {activeConvId && (
          <Tooltip title="Refresh context">
            <IconButton
              size="small"
              onClick={() => {
                refreshConversationContext(activeConvId);
                toast.success('Context refreshed!');
              }}
            >
              <RefreshRoundedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </Stack>
    </Box>
  );
}
