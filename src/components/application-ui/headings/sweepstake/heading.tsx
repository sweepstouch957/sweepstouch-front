import { useSweepstake } from '@/hooks/fetching/sweepstakes/useSweepstakesById';
import CloseIcon from '@mui/icons-material/Close';
import PreviewIcon from '@mui/icons-material/Preview';
import {
  Box,
  Chip,
  CircularProgress,
  IconButton,
  Modal,
  Typography,
  useTheme,
} from '@mui/material';
import { format } from 'date-fns';
import Image from 'next/image';
import { useState } from 'react';

export function SweepstakeMiniHeader({ sweepstakeId }: { sweepstakeId: string }) {
  const { data, isLoading, error } = useSweepstake(sweepstakeId);
  const theme = useTheme();
  const [open, setOpen] = useState(false);

  if (isLoading)
    return (
      <Box
        display="flex"
        justifyContent="center"
      >
        <CircularProgress size={28} />
      </Box>
    );
  if (error || !data) return null;

  return (
    <>
      <Box
        display="flex"
        alignItems="center"
        gap={2}
        mb={2}
        sx={{
          borderRadius: 3,
          bgcolor: theme.palette.background.paper,
        }}
      >
        <Box
          sx={{
            width: 60,
            height: 80,
            minWidth: 60,
            minHeight: 80,
            borderRadius: 2,
            overflow: 'hidden',
            border: `1.5px solid ${theme.palette.primary.main}`,
            bgcolor: theme.palette.background.default,
            position: 'relative',
            cursor: 'pointer',
            transition: 'box-shadow 0.2s',
            '&:hover img': { filter: 'brightness(0.93) blur(0.5px)' },
          }}
          onClick={() => setOpen(true)}
        >
          <Image
            src={data.image}
            alt={data.name}
            fill
            style={{
              objectFit: 'cover',
              borderRadius: 12,
              background: theme.palette.background.default,
              transition: 'filter 0.2s',
            }}
          />
          <IconButton
            size="small"
            sx={{
              position: 'absolute',
              top: 2,
              right: 2,
              bgcolor: 'rgba(255,255,255,0.92)',
              zIndex: 2,
              '&:hover': { bgcolor: 'white' },
              p: 0.5,
            }}
            onClick={(e) => {
              e.stopPropagation();
              setOpen(true);
            }}
          >
            <PreviewIcon fontSize="small" />
          </IconButton>
        </Box>
        <Box
          flex={1}
          minWidth={0}
          gap={0.5}
          display="flex"
          flexDirection="column"
        >
          <Typography
            variant="subtitle1"
            fontWeight={700}
            noWrap
            title={data.name}
            color={theme.palette.text.primary}
          >
            {data.name}
          </Typography>
          <Typography
            variant="body2"
            color={theme.palette.text.secondary}
            fontWeight={500}
          >
            Finaliza:{' '}
            <b style={{ color: theme.palette.error.main }}>
              {format(new Date(data.endDate), 'MMMM d, yyyy')}
            </b>
          </Typography>
          <Box>
            <Chip
              size="small"
              color="primary"
              label={data.status}
              sx={{
                textTransform: 'capitalize',
                fontWeight: 700,
                fontSize: 13,
                bgcolor: theme.palette.primary.light,
                color: theme.palette.primary.contrastText,
              }}
            />
          </Box>
        </Box>
      </Box>

      {/* Modal de preview */}
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        closeAfterTransition
      >
        <Box
          sx={{
            outline: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100vh',
            bgcolor: 'rgba(0,0,0,0.92)',
            zIndex: 2000,
            px: 2,
          }}
        >
          <Box
            sx={{
              position: 'relative',
              width: { xs: '95vw', sm: 400 },
              maxWidth: '95vw',
              maxHeight: '85vh',
              aspectRatio: '9/16',
              background: '#fff',
              borderRadius: 5,
              boxShadow: 14,
              overflow: 'hidden',
            }}
          >
            <IconButton
              onClick={() => setOpen(false)}
              sx={{
                position: 'absolute',
                top: 8,
                right: 8,
                zIndex: 99,
                bgcolor: '#23263ae6',
                color: '#fff',
                boxShadow: 3,
                '&:hover': { bgcolor: theme.palette.primary.main },
              }}
            >
              <CloseIcon />
            </IconButton>
            <Image
              src={data.image}
              alt={data.name}
              fill
              priority
              sizes="(max-width: 600px) 90vw, 400px"
              style={{
                objectFit: 'contain',
                borderRadius: 12,
                background: '#fff',
              }}
            />
          </Box>
        </Box>
      </Modal>
    </>
  );
}
