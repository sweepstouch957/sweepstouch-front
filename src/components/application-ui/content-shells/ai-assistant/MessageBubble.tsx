'use client';

import { type Message } from '@/services/ai.service';
import AttachFileRoundedIcon from '@mui/icons-material/AttachFileRounded';
import ContentCopyRoundedIcon from '@mui/icons-material/ContentCopyRounded';
import PersonRoundedIcon from '@mui/icons-material/PersonRounded';
import {
  alpha,
  Avatar,
  Box,
  Chip,
  IconButton,
  Paper,
  Stack,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material';
import React, { useCallback } from 'react';
import toast from 'react-hot-toast';
import { MarkdownContent } from './MarkdownContent';
import { SIcon } from './SIcon';

export const MessageBubble = React.memo(function MessageBubble({
  msg,
  isUser,
}: {
  msg: Message;
  isUser: boolean;
}) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const accent = theme.palette.primary.main;
  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(msg.content);
    toast.success('Copied!');
  }, [msg.content]);

  return (
    <Box
      sx={{
        display: 'flex',
        gap: { xs: 1, sm: 1.5 },
        mb: 2.5,
        flexDirection: isUser ? 'row-reverse' : 'row',
        alignItems: 'flex-start',
      }}
    >
      <Avatar
        sx={{
          width: { xs: 28, sm: 32 },
          height: { xs: 28, sm: 32 },
          bgcolor: isUser ? 'primary.main' : alpha(accent, 0.12),
          color: isUser ? 'common.white' : accent,
          fontSize: 14,
          fontWeight: 700,
          mt: 0.5,
        }}
      >
        {isUser ? (
          <PersonRoundedIcon sx={{ fontSize: 18 }} />
        ) : (
          <SIcon
            size={18}
            color={accent}
          />
        )}
      </Avatar>

      <Box sx={{ maxWidth: { xs: 'calc(100% - 44px)', sm: '82%', md: '75%' }, minWidth: 0 }}>
        {msg.attachments && msg.attachments.length > 0 && (
          <Stack
            direction="row"
            spacing={1}
            mb={1}
            flexWrap="wrap"
            gap={0.5}
          >
            {msg.attachments.map((att, i) => (
              <Box key={i}>
                {att.type === 'image' ? (
                  <Box
                    component="img"
                    src={att.url}
                    alt={att.name}
                    sx={{
                      maxWidth: { xs: '100%', sm: 200 },
                      maxHeight: { xs: 220, sm: 150 },
                      borderRadius: 2,
                      border: `1px solid ${theme.palette.divider}`,
                    }}
                  />
                ) : (
                  <Chip
                    icon={<AttachFileRoundedIcon sx={{ fontSize: 14 }} />}
                    label={att.name}
                    size="small"
                    variant="outlined"
                    component="a"
                    href={att.url}
                    target="_blank"
                    clickable
                    sx={{ fontSize: 11 }}
                  />
                )}
              </Box>
            ))}
          </Stack>
        )}

        <Paper
          elevation={0}
          sx={{
            px: { xs: 1.5, sm: 2 },
            py: { xs: 1.25, sm: 1.5 },
            borderRadius: 2.5,
            bgcolor: isUser
              ? 'primary.main'
              : isDark
                ? alpha(theme.palette.common.white, 0.06)
                : alpha(theme.palette.common.black, 0.04),
            color: isUser ? 'common.white' : 'text.primary',
            borderTopRightRadius: isUser ? 4 : undefined,
            borderTopLeftRadius: !isUser ? 4 : undefined,
            overflow: 'hidden',
          }}
        >
          {isUser ? (
            <Typography
              variant="body2"
              sx={{
                fontSize: 13,
                lineHeight: 1.65,
                whiteSpace: 'pre-wrap',
                overflowWrap: 'anywhere',
              }}
            >
              {msg.content}
            </Typography>
          ) : (
            <MarkdownContent content={msg.content} />
          )}
        </Paper>

        {!isUser && msg.content && (
          <Box sx={{ mt: 0.5 }}>
            <Tooltip title="Copy">
              <IconButton
                size="small"
                onClick={handleCopy}
                sx={{ opacity: 0.4, '&:hover': { opacity: 1 }, p: 0.3 }}
              >
                <ContentCopyRoundedIcon sx={{ fontSize: 13 }} />
              </IconButton>
            </Tooltip>
          </Box>
        )}
      </Box>
    </Box>
  );
});

/* ─── Streaming indicator ─── */
