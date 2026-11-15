'use client';

import { Box, Chip, CircularProgress, Stack, TextField, Typography, useTheme } from '@mui/material';
import type { useSendTestMessage } from './use-send-test-message';

type Props = Pick<
  ReturnType<typeof useSendTestMessage>,
  'selectedStore' | 'copyText' | 'setCopyText' | 'lastCampaign' | 'lastLoading' | 'charCount'
>;

/** Paso 3: texto del mensaje (se precarga con el de la última campaña). */
export function MessageCopySection({
  selectedStore,
  copyText,
  setCopyText,
  lastCampaign,
  lastLoading,
  charCount,
}: Props) {
  const theme = useTheme();
  const bg = theme.palette.background.default;
  const border = theme.palette.divider;

  return (
    <Box>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        mb={1}
      >
        <Typography
          variant="caption"
          fontWeight={700}
          color="text.secondary"
          sx={{ textTransform: 'uppercase', letterSpacing: 0.7, fontSize: 10.5 }}
        >
          3 · Message Copy
        </Typography>
        <Chip
          label={`${charCount} chars`}
          size="small"
          variant="outlined"
          color={charCount > 160 ? 'warning' : 'default'}
          sx={{ fontSize: 10, height: 20 }}
        />
      </Stack>

      {lastLoading && selectedStore ? (
        <Box
          display="flex"
          alignItems="center"
          gap={1}
          py={2}
        >
          <CircularProgress size={16} />
          <Typography
            variant="caption"
            color="text.disabled"
          >
            Loading last campaign copy…
          </Typography>
        </Box>
      ) : (
        <TextField
          multiline
          minRows={4}
          maxRows={10}
          fullWidth
          placeholder={
            selectedStore
              ? 'Type your test message…'
              : 'Select a store first to auto-load last campaign copy'
          }
          disabled={!selectedStore}
          value={copyText}
          onChange={(e) => setCopyText(e.target.value)}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
              fontFamily: 'monospace',
              fontSize: 13,
              lineHeight: 1.7,
            },
          }}
        />
      )}

      {lastCampaign?.content && (
        <Box
          sx={{
            mt: 1,
            px: 2,
            py: 0.75,
            borderRadius: 1.5,
            border: `1px dashed ${border}`,
            bgcolor: bg,
          }}
        >
          <Typography
            variant="caption"
            color="text.disabled"
            fontWeight={700}
            sx={{ textTransform: 'uppercase', letterSpacing: 0.7, fontSize: 9 }}
          >
            Last campaign copy auto-loaded
          </Typography>
        </Box>
      )}
    </Box>
  );
}
