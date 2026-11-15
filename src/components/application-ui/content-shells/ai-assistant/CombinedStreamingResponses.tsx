'use client';

import {
  alpha,
  Avatar,
  Box,
  CircularProgress,
  Paper,
  Stack,
  Typography,
  useTheme,
} from '@mui/material';
import React from 'react';
import { MarkdownContent } from './MarkdownContent';
import { ModelIcon } from './ModelIcon';
import { BASE_AI_MODELS, CombinedResponses, MODEL_META } from './models';
import { SIcon } from './SIcon';

export const CombinedStreamingResponses = React.memo(function CombinedStreamingResponses({
  responses,
}: {
  responses: CombinedResponses;
}) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const accent = theme.palette.primary.main;

  return (
    <Box sx={{ display: 'flex', gap: 1.5, mb: 2.5, alignItems: 'flex-start' }}>
      <Avatar sx={{ width: 32, height: 32, bgcolor: alpha(accent, 0.12) }}>
        <SIcon
          size={18}
          color={accent}
          pulse
        />
      </Avatar>
      <Stack
        spacing={1}
        sx={{ maxWidth: { xs: 'calc(100% - 44px)', sm: '82%', md: '75%' }, minWidth: 0 }}
      >
        {BASE_AI_MODELS.map((model) => {
          const response = responses[model];
          const isLoading = response.status === 'loading' && !response.content;

          return (
            <Paper
              key={model}
              elevation={0}
              sx={{
                px: { xs: 1.5, sm: 2 },
                py: { xs: 1.25, sm: 1.5 },
                borderRadius: 2.5,
                bgcolor: isDark
                  ? alpha(theme.palette.common.white, 0.06)
                  : alpha(theme.palette.common.black, 0.04),
                border: `1px solid ${alpha(theme.palette.divider, 0.8)}`,
                overflow: 'hidden',
              }}
            >
              <Stack
                direction="row"
                spacing={1}
                alignItems="center"
                mb={response.content || response.error || isLoading ? 1 : 0}
                sx={{ width: '100%' }}
              >
                <ModelIcon
                  model={model}
                  size={18}
                />
                <Typography
                  variant="subtitle2"
                  fontWeight={800}
                  fontSize={12}
                  sx={{
                    textDecoration: 'underline',
                    textDecorationThickness: 2,
                    textUnderlineOffset: 4,
                  }}
                >
                  Respuesta de: {MODEL_META[model].label}
                </Typography>
                <ModelIcon
                  model={model}
                  size={18}
                />
                {response.status === 'loading' && (
                  <CircularProgress
                    size={13}
                    thickness={5}
                    sx={{ ml: 'auto' }}
                  />
                )}
              </Stack>

              {response.error ? (
                <Typography
                  variant="body2"
                  color="error.main"
                  sx={{ fontSize: 13, lineHeight: 1.65, overflowWrap: 'anywhere' }}
                >
                  {response.error}
                </Typography>
              ) : isLoading ? (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ fontSize: 13 }}
                >
                  Cargando respuesta...
                </Typography>
              ) : (
                <MarkdownContent content={response.content} />
              )}
            </Paper>
          );
        })}
      </Stack>
    </Box>
  );
});
