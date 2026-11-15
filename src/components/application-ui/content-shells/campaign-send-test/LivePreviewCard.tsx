'use client';

import PreviewPhone from '@/components/application-ui/dialogs/preview/preview-phone';
import PhoneIphoneRoundedIcon from '@mui/icons-material/PhoneIphoneRounded';
import { alpha, Box, Chip, Paper, Stack, Typography, useTheme } from '@mui/material';
import type { useSendTestMessage } from './use-send-test-message';

type Props = Pick<
  ReturnType<typeof useSendTestMessage>,
  'copyText' | 'previewImage' | 'messageType' | 'charCount'
>;

/** Vista previa en vivo en el teléfono. */
export function LivePreviewCard({ copyText, previewImage, messageType, charCount }: Props) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const accent = theme.palette.primary.main;
  const bg = theme.palette.background.default;
  const surface = theme.palette.background.paper;
  const border = theme.palette.divider;

  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: 3,
        border: `1px solid ${border}`,
        bgcolor: surface,
        overflow: 'hidden',
      }}
    >
      <Box sx={{ px: 3, py: 2, borderBottom: `1px solid ${border}`, bgcolor: bg }}>
        <Stack
          direction="row"
          alignItems="center"
          spacing={1.5}
        >
          <PhoneIphoneRoundedIcon sx={{ fontSize: 18, color: accent }} />
          <Typography
            variant="subtitle1"
            fontWeight={700}
          >
            Live Preview
          </Typography>
          <Box flex={1} />
          <Chip
            label={messageType}
            size="small"
            color={messageType === 'MMS' ? 'primary' : 'default'}
            variant="outlined"
            sx={{ fontSize: 10, height: 20 }}
          />
        </Stack>
      </Box>

      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 1.5,
          p: { xs: 3, lg: 3 },
          position: 'relative',
          overflow: 'hidden',
          bgcolor: bg,
        }}
      >
        {/* glow */}
        <Box
          sx={{
            position: 'absolute',
            width: 360,
            height: 360,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${alpha(
              accent,
              isDark ? 0.08 : 0.04
            )} 0%, transparent 70%)`,
            pointerEvents: 'none',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
          }}
        />

        <Typography
          variant="overline"
          sx={{ fontSize: 9, letterSpacing: 2, color: 'text.disabled', position: 'relative' }}
        >
          Real-time Preview
        </Typography>

        <Box sx={{ width: '100%', maxWidth: 240, position: 'relative' }}>
          <PreviewPhone
            content={copyText}
            image={previewImage}
            fontSize={10}
          />
        </Box>

        <Stack
          direction="row"
          spacing={1}
          sx={{ position: 'relative' }}
        >
          <Chip
            label={`${charCount} chars`}
            size="small"
            variant="outlined"
            color={charCount > 160 ? 'warning' : 'default'}
            sx={{ fontSize: 10 }}
          />
          <Chip
            label={messageType}
            size="small"
            variant="outlined"
            color={messageType === 'MMS' ? 'primary' : 'default'}
            sx={{ fontSize: 10 }}
          />
        </Stack>
      </Box>
    </Paper>
  );
}
