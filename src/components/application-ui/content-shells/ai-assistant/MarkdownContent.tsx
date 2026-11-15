'use client';

import { alpha, Paper, Stack, Typography, useTheme } from '@mui/material';
import React, { useMemo } from 'react';
import { ChartData, InteractiveChart } from './InteractiveChart';
import { renderMarkdown } from './message-utils';

const chartRegex = /```(?:json:)?chart\n([\s\S]*?)\n```/g;

export const MarkdownContent = React.memo(function MarkdownContent({
  content,
}: {
  content: string;
}) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const parts = useMemo(() => content.split(chartRegex), [content]);

  return (
    <Stack
      spacing={1.5}
      sx={{ width: '100%' }}
    >
      {parts.map((part, index) => {
        if (index % 2 === 0) {
          if (!part.trim()) return null;
          const html = renderMarkdown(part, theme.palette.info.main);
          return (
            <Typography
              key={index}
              variant="body2"
              component="div"
              sx={{
                fontSize: 13,
                lineHeight: 1.65,
                overflowWrap: 'anywhere',
                '& pre': { my: 1, maxWidth: '100%' },
                '& code': { fontFamily: 'monospace', whiteSpace: 'pre-wrap' },
                '& table': { display: 'block', maxWidth: '100%', overflowX: 'auto' },
                '& img': { height: 'auto' },
              }}
              dangerouslySetInnerHTML={{ __html: html }}
            />
          );
        } else {
          try {
            const chartData = JSON.parse(part.trim()) as ChartData;
            return (
              <InteractiveChart
                data={chartData}
                key={index}
              />
            );
          } catch (e) {
            console.error('Failed to parse chart JSON:', e);
            return (
              <Paper
                key={index}
                elevation={0}
                sx={{
                  p: 1.5,
                  borderRadius: 2,
                  border: `1px solid ${theme.palette.error.light}`,
                  bgcolor: alpha(theme.palette.error.main, 0.05),
                }}
              >
                <Typography
                  variant="caption"
                  color="error.main"
                  component="pre"
                  sx={{ fontFamily: 'monospace' }}
                >
                  Error al renderizar gráfico: {e instanceof Error ? e.message : String(e)}
                </Typography>
              </Paper>
            );
          }
        }
      })}
    </Stack>
  );
});

/* ─── Message Bubble ─── */
