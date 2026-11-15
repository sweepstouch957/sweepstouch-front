'use client';

import PreviewPhone from '@/components/application-ui/dialogs/preview/preview-phone';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import OpenInNewRoundedIcon from '@mui/icons-material/OpenInNewRounded';
import { alpha, Box, Button, Fade, Paper, Stack, Typography, useTheme } from '@mui/material';
import type { useSendTestMessage } from './use-send-test-message';
import { formatPhone } from './utils';

type Props = Pick<ReturnType<typeof useSendTestMessage>, 'sentPreview'>;

/** Vista del último mensaje enviado con sus links clicables. */
export function SentPreviewCard({ sentPreview }: Props) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const border = theme.palette.divider;

  return (
    <>
      {sentPreview && (
        <Fade in>
          <Paper
            elevation={0}
            sx={{
              borderRadius: 3,
              border: `1px solid ${theme.palette.success.main}`,
              bgcolor: alpha(theme.palette.success.main, isDark ? 0.04 : 0.02),
              overflow: 'hidden',
            }}
          >
            <Box
              sx={{
                px: 3,
                py: 2,
                borderBottom: `1px solid ${alpha(theme.palette.success.main, 0.2)}`,
                bgcolor: alpha(theme.palette.success.main, isDark ? 0.08 : 0.04),
              }}
            >
              <Stack
                direction="row"
                alignItems="center"
                spacing={1.5}
              >
                <CheckCircleRoundedIcon sx={{ fontSize: 18, color: 'success.main' }} />
                <Typography
                  variant="subtitle1"
                  fontWeight={700}
                  color="success.main"
                >
                  Sent Message Preview
                </Typography>
                <Box flex={1} />
                <Typography
                  variant="caption"
                  color="text.secondary"
                >
                  {sentPreview.timestamp.toLocaleTimeString()}
                </Typography>
              </Stack>
            </Box>
            <Box sx={{ p: 3 }}>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: 'block', mb: 1, fontWeight: 600 }}
              >
                Sent to: {formatPhone(sentPreview.phone)}
              </Typography>
              <Box sx={{ width: '100%', maxWidth: 240, mx: 'auto', position: 'relative', mb: 2 }}>
                <PreviewPhone
                  content={sentPreview.message}
                  image={sentPreview.image}
                  fontSize={10}
                />
              </Box>

              {/* Extract and display clickeable links in message body for easy testing */}
              {(() => {
                const urlRegex = /(https?:\/\/[^\s]+)/g;
                const urls = sentPreview.message.match(urlRegex);
                if (!urls || urls.length === 0) return null;
                return (
                  <Box
                    sx={{
                      mt: 2,
                      p: 1.5,
                      borderRadius: 2,
                      bgcolor: 'action.hover',
                      border: `1px solid ${border}`,
                    }}
                  >
                    <Typography
                      variant="caption"
                      fontWeight={700}
                      color="primary.main"
                      sx={{
                        display: 'block',
                        mb: 1,
                        textTransform: 'uppercase',
                        letterSpacing: 0.5,
                      }}
                    >
                      Clickable Test Links:
                    </Typography>
                    <Stack spacing={1}>
                      {urls.map((url, idx) => (
                        <Button
                          key={url}
                          variant="outlined"
                          size="small"
                          color="primary"
                          endIcon={<OpenInNewRoundedIcon sx={{ fontSize: 12 }} />}
                          onClick={() => window.open(url, '_blank')}
                          sx={{
                            textTransform: 'none',
                            justifyContent: 'space-between',
                            fontFamily: 'monospace',
                            fontSize: 10,
                            py: 0.5,
                            borderRadius: 1.5,
                          }}
                        >
                          {url.length > 35 ? `${url.substring(0, 32)}...` : url}
                        </Button>
                      ))}
                    </Stack>
                  </Box>
                );
              })()}
            </Box>
          </Paper>
        </Fade>
      )}
    </>
  );
}
