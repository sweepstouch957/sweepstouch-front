'use client';

import AddRoundedIcon from '@mui/icons-material/AddRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded';
import {
  alpha,
  Box,
  Button,
  CircularProgress,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { formatDistanceToNow } from 'date-fns';
import { useRouter } from 'next/navigation';
import { SIcon } from './SIcon';
import type { useAiChat } from './use-ai-chat';

type Props = Pick<
  ReturnType<typeof useAiChat>,
  | 'conversations'
  | 'activeConvId'
  | 'setSidebarOpen'
  | 'loadingConvs'
  | 'isAdmin'
  | 'loadConversation'
  | 'handleNewConversation'
  | 'handleDeleteRequest'
>;

/** Barra de conversaciones: nueva, lista con fecha y borrar. */
export function ConversationSidebar({
  conversations,
  activeConvId,
  setSidebarOpen,
  loadingConvs,
  isAdmin,
  loadConversation,
  handleNewConversation,
  handleDeleteRequest,
}: Props) {
  const theme = useTheme();
  const accent = theme.palette.primary.main;
  const mdUp = useMediaQuery(theme.breakpoints.up('md'));
  const { push } = useRouter();

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      <Box sx={{ p: 2, pb: 1.5, flexShrink: 0 }}>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          mb={1.5}
        >
          <Stack
            direction="row"
            alignItems="center"
            spacing={1}
          >
            <SIcon
              size={22}
              color={accent}
            />
            <Typography
              variant="subtitle1"
              fontWeight={700}
            >
              AI Chat
            </Typography>
          </Stack>
          {!mdUp && (
            <IconButton
              size="small"
              onClick={() => setSidebarOpen(false)}
            >
              <CloseRoundedIcon fontSize="small" />
            </IconButton>
          )}
        </Stack>

        <Button
          fullWidth
          variant="contained"
          startIcon={<AddRoundedIcon />}
          onClick={handleNewConversation}
          sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
        >
          New Conversation
        </Button>
      </Box>

      <Divider />

      {/* Conversation list — scrollable */}
      <Box sx={{ flex: 1, overflow: 'auto', minHeight: 0, px: 1, py: 1 }}>
        {loadingConvs ? (
          <Box
            display="flex"
            justifyContent="center"
            py={4}
          >
            <CircularProgress size={24} />
          </Box>
        ) : conversations.length === 0 ? (
          <Box
            textAlign="center"
            py={4}
          >
            <SIcon
              size={36}
              color={theme.palette.text.disabled}
            />
            <Typography
              variant="caption"
              color="text.secondary"
              display="block"
              mt={1}
            >
              No conversations yet
            </Typography>
          </Box>
        ) : (
          <List
            dense
            disablePadding
          >
            {conversations.map((conv) => (
              <ListItem
                key={conv._id}
                disablePadding
                secondaryAction={
                  <IconButton
                    edge="end"
                    size="small"
                    onClick={(e) => handleDeleteRequest(conv._id, e)}
                    sx={{
                      opacity: 0,
                      '.MuiListItem-root:hover &': { opacity: 0.5 },
                      '&:hover': { opacity: '1 !important', color: 'error.main' },
                    }}
                  >
                    <DeleteOutlineRoundedIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                }
              >
                <ListItemButton
                  selected={activeConvId === conv._id}
                  onClick={() => {
                    loadConversation(conv._id);
                    if (!mdUp) setSidebarOpen(false);
                  }}
                  sx={{
                    borderRadius: 1.5,
                    mb: 0.5,
                    py: 1,
                    '&.Mui-selected': {
                      bgcolor: alpha(accent, 0.08),
                      '&:hover': { bgcolor: alpha(accent, 0.12) },
                    },
                  }}
                >
                  <ListItemText
                    primary={conv.title || 'Untitled'}
                    secondary={formatDistanceToNow(new Date(conv.updatedAt), { addSuffix: true })}
                    primaryTypographyProps={{ fontSize: 12.5, fontWeight: 600, noWrap: true }}
                    secondaryTypographyProps={{ fontSize: 10 }}
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        )}
      </Box>

      {isAdmin && (
        <>
          <Divider />
          <Box sx={{ p: 1.5, flexShrink: 0 }}>
            <Button
              fullWidth
              size="small"
              startIcon={<SettingsRoundedIcon sx={{ fontSize: 16 }} />}
              onClick={() => push('/admin/applications/ai-assistant/config')}
              sx={{
                textTransform: 'none',
                fontSize: 12,
                fontWeight: 600,
                color: 'text.secondary',
                justifyContent: 'flex-start',
              }}
            >
              AI Configuration
            </Button>
          </Box>
        </>
      )}
    </Box>
  );
}
