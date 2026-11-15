'use client';

import DescriptionRoundedIcon from '@mui/icons-material/DescriptionRounded';
import ImageRoundedIcon from '@mui/icons-material/ImageRounded';
import { Box, Chip, Stack, useTheme } from '@mui/material';
import type { useAiChat } from './use-ai-chat';

type Props = Pick<
  ReturnType<typeof useAiChat>,
  'input' | 'pendingAttachments' | 'setPendingAttachments'
>;

/** Adjuntos subidos que se mandan con el próximo mensaje. */
export function PendingAttachments({ input, pendingAttachments, setPendingAttachments }: Props) {
  const theme = useTheme();

  return (
    <>
      {pendingAttachments.length > 0 && (
        <Box sx={{ px: 2, py: 1, borderTop: `1px solid ${theme.palette.divider}`, flexShrink: 0 }}>
          <Stack
            direction="row"
            spacing={1}
            flexWrap="wrap"
            gap={0.5}
          >
            {pendingAttachments.map((att, i) => (
              <Chip
                key={i}
                label={att.name}
                size="small"
                icon={
                  att.type === 'image' ? (
                    <ImageRoundedIcon sx={{ fontSize: 14 }} />
                  ) : (
                    <DescriptionRoundedIcon sx={{ fontSize: 14 }} />
                  )
                }
                onDelete={() => setPendingAttachments((prev) => prev.filter((_, j) => j !== i))}
                sx={{ fontSize: 11 }}
              />
            ))}
          </Stack>
        </Box>
      )}
    </>
  );
}
