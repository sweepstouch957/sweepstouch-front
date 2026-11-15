'use client';

import AutoFixHighRoundedIcon from '@mui/icons-material/AutoFixHighRounded';
import { alpha, Box, Chip, Stack, Typography, useTheme } from '@mui/material';
import { CombinedStreamingResponses } from './CombinedStreamingResponses';
import { getMessageKey } from './message-utils';
import { MessageBubble } from './MessageBubble';
import { SIcon } from './SIcon';
import { StreamingIndicator } from './StreamingIndicator';
import type { useAiChat } from './use-ai-chat';

type Props = Pick<
  ReturnType<typeof useAiChat>,
  | 'user'
  | 'messages'
  | 'setInput'
  | 'streaming'
  | 'streamingText'
  | 'combinedResponses'
  | 'setImageMode'
  | 'scrollRef'
  | 'inputRef'
>;

/** Mensajes de la conversación, la respuesta en streaming y el estado vacío. */
export function ChatMessages({
  user,
  messages,
  setInput,
  streaming,
  streamingText,
  combinedResponses,
  setImageMode,
  scrollRef,
  inputRef,
}: Props) {
  const theme = useTheme();
  const accent = theme.palette.primary.main;
  const imageAccent = theme.palette.info.main;

  return (
    <Box
      ref={scrollRef}
      sx={{
        flex: 1,
        minHeight: 0,
        overflow: 'auto',
        p: { xs: 1.25, sm: 2, md: 3 },
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {messages.length === 0 && !streamingText && !combinedResponses ? (
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            py: 2,
          }}
        >
          <Box
            sx={{
              width: 72,
              height: 72,
              borderRadius: '50%',
              bgcolor: alpha(accent, 0.08),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mb: 1.5,
              animation: 'welcomeGlow 3s ease-in-out infinite',
              '@keyframes welcomeGlow': {
                '0%, 100%': { boxShadow: `0 0 0 0 ${alpha(accent, 0)}` },
                '50%': { boxShadow: `0 0 0 10px ${alpha(accent, 0.08)}` },
              },
            }}
          >
            <SIcon
              size={40}
              color={accent}
              spin
            />
          </Box>
          <Typography
            variant="h6"
            fontWeight={700}
            mb={0.5}
          >
            Sweepstouch AI
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            textAlign="center"
            maxWidth={380}
            mb={2}
            fontSize={12}
          >
            Ask me about your team, campaigns, tasks, stores, or anything about the platform.
          </Typography>
          <Stack
            direction="row"
            spacing={1}
            flexWrap="wrap"
            justifyContent="center"
            gap={0.75}
            sx={{ width: '100%' }}
          >
            {[
              '¿Qué tareas tiene cada persona del equipo?',
              'Show me active campaigns',
              '¿Cuántas tiendas tenemos?',
              'Summarize our audience metrics',
            ].map((q) => (
              <Chip
                key={q}
                label={q}
                variant="outlined"
                onClick={() => {
                  setInput(q);
                  inputRef.current?.focus();
                }}
                sx={{
                  borderRadius: 2,
                  fontSize: 11,
                  fontWeight: 500,
                  maxWidth: { xs: '100%', sm: 'none' },
                  borderColor: alpha(accent, 0.3),
                  color: accent,
                  '&:hover': { bgcolor: alpha(accent, 0.08) },
                  '& .MuiChip-label': { overflow: 'hidden', textOverflow: 'ellipsis' },
                }}
              />
            ))}
            <Chip
              label="Generate a banner"
              variant="outlined"
              icon={<AutoFixHighRoundedIcon sx={{ fontSize: 13 }} />}
              onClick={() => {
                setImageMode(true);
                setInput('promotional banner for a sweepstakes campaign');
                inputRef.current?.focus();
              }}
              sx={{
                borderRadius: 2,
                fontSize: 11,
                fontWeight: 500,
                maxWidth: { xs: '100%', sm: 'none' },
                borderColor: alpha(imageAccent, 0.3),
                color: 'info.main',
                '&:hover': { bgcolor: alpha(imageAccent, 0.08) },
                '& .MuiChip-label': { overflow: 'hidden', textOverflow: 'ellipsis' },
              }}
            />
          </Stack>
        </Box>
      ) : (
        <>
          {messages.map((msg, i) => (
            <MessageBubble
              key={getMessageKey(msg, i)}
              msg={msg}
              isUser={msg.role === 'user'}
            />
          ))}
          {combinedResponses && <CombinedStreamingResponses responses={combinedResponses} />}
          {streamingText && !combinedResponses && (
            <MessageBubble
              msg={{ role: 'assistant', content: streamingText }}
              isUser={false}
            />
          )}
          {streaming && !streamingText && !combinedResponses && <StreamingIndicator />}
        </>
      )}
    </Box>
  );
}
