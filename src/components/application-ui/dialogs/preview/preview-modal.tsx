import CloseIcon from '@mui/icons-material/Close';
import { Box, Dialog, DialogContent, IconButton, Slide, Typography, useTheme } from '@mui/material';
import { TransitionProps } from '@mui/material/transitions';
import { forwardRef } from 'react';

interface PreviewModalProps {
  open: boolean;
  handleClose: () => void;
  content: string;
  image?: File;
}

const Transition = forwardRef(function Transition(
  props: TransitionProps & { children: React.ReactElement<any, any> },
  ref: React.Ref<unknown>
) {
  return (
    <Slide
      direction="up"
      ref={ref}
      {...props}
    />
  );
});

// iPhone frame colors
const FRAME_DARK = '#222';
const FRAME_ACCENT = '#1a1a1a';
const FRAME_SHADOW = 'rgba(0,0,0,0.5)';
const SCREEN_BG = '#111';

export default function PreviewModal({ open, handleClose, content, image }: PreviewModalProps) {
  const theme = useTheme();
  const imageUrl = image ? URL.createObjectURL(image) : null;

  return (
    <Dialog
      fullWidth
      maxWidth="xs"
      open={open}
      onClose={handleClose}
      TransitionComponent={Transition}
      keepMounted
      sx={{
        '.MuiDialog-paper': {
          background: 'transparent',
          boxShadow: 'none',
        },
      }}
    >
      <DialogContent
        sx={{
          p: 0,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          background: 'rgba(20,20,22,0.98)',
        }}
      >
        <IconButton
          onClick={handleClose}
          sx={{
            position: 'absolute',
            top: 18,
            right: 14,
            color: '#eee',
            zIndex: 50,
            bgcolor: 'rgba(20,20,20,0.18)',
            backdropFilter: 'blur(2px)',
            boxShadow: 1,
            '&:hover': { bgcolor: '#222' },
          }}
        >
          <CloseIcon />
        </IconButton>
        <Box
          sx={{
            position: 'relative',
            width: 320,
            height: 600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            // iPhone shadow
            boxShadow: `0 12px 60px 0 ${FRAME_SHADOW}, 0 1.5px 1.5px 0 ${FRAME_ACCENT}`,
            borderRadius: '48px',
            background: `linear-gradient(145deg, ${FRAME_DARK} 75%, #393939 100%)`,
            overflow: 'visible',
            // Border
            border: `3.5px solid #444`,
          }}
        >
          {/* iPhone notch and details */}
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 30,
              width: 160,
              height: 38,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'flex-start',
              pointerEvents: 'none',
            }}
          >
            <svg
              width="160"
              height="38"
              viewBox="0 0 160 38"
              fill="none"
            >
              <rect
                x="0"
                y="0"
                width="160"
                height="38"
                rx="20"
                fill="#191919"
              />
              <circle
                cx="80"
                cy="19"
                r="5"
                fill="#111"
                opacity="0.5"
              />
              <rect
                x="65"
                y="12"
                width="30"
                height="6"
                rx="3"
                fill="#181818"
                opacity="0.7"
              />
            </svg>
          </Box>

          {/* Cerrar (absoluto arriba) */}

          {/* iPhone screen area */}
          <Box
            sx={{
              position: 'relative',
              width: 284,
              height: 510,
              background: SCREEN_BG,
              borderRadius: '36px',
              boxShadow: '0 4px 16px 0 #19191960',
              mt: 2.7,
              mb: 2,
              display: 'flex',
              flexDirection: 'column',
              px: 0,
              pt: 0,
              overflow: 'hidden',
            }}
          >
            {/* Contenido de la "pantalla" */}
            <Box
              sx={{
                flex: 1,
                p: 2.3,
                backgroundColor: '#191b1d',
                borderRadius: '32px',
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
                overflowY: 'auto',
              }}
            >
              {imageUrl && (
                <Box
                  component="img"
                  src={imageUrl}
                  alt="Preview"
                  sx={{
                    width: '100%',
                    height: 'auto',
                    borderRadius: 2,
                    mb: 1.3,
                    background: '#222',
                  }}
                />
              )}
              <Typography
                variant="body2"
                sx={{
                  whiteSpace: 'pre-line',
                  fontSize: '16px',
                  color: '#fafafa',
                  fontWeight: 500,
                }}
              >
                {content}
              </Typography>
            </Box>
            {/* Home Indicator */}
            <Box
              sx={{
                width: 46,
                height: 6,
                background: '#222',
                borderRadius: 3,
                position: 'absolute',
                bottom: 18,
                left: '50%',
                transform: 'translateX(-50%)',
                opacity: 0.88,
              }}
            />
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
