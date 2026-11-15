'use client';

import ContentCopyRoundedIcon from '@mui/icons-material/ContentCopyRounded';
import SmartToyRoundedIcon from '@mui/icons-material/SmartToyRounded';
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Skeleton,
  Stack,
  Typography,
  useTheme,
} from '@mui/material';
import toast from 'react-hot-toast';
import type { useProjectsBoard } from './use-projects-board';

type Props = Pick<
  ReturnType<typeof useProjectsBoard>,
  'aiDialogOpen' | 'setAiDialogOpen' | 'aiContext'
>;

/** Diálogo con el contexto de proyectos/tareas para copiar a un asistente de IA. */
export function AiContextDialog({ aiDialogOpen, setAiDialogOpen, aiContext }: Props) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  return (
    <Dialog
      open={aiDialogOpen}
      onClose={() => setAiDialogOpen(false)}
      maxWidth="md"
      fullWidth
      PaperProps={{ sx: { borderRadius: 3 } }}
    >
      <DialogTitle>
        <Stack
          direction="row"
          alignItems="center"
          spacing={1}
        >
          <SmartToyRoundedIcon color="primary" />
          <Typography
            variant="h6"
            fontWeight={700}
          >
            AI Training Context
          </Typography>
        </Stack>
      </DialogTitle>
      <DialogContent dividers>
        <Typography
          variant="body2"
          color="text.secondary"
          mb={2}
        >
          Copy this context to ChatGPT, Claude, or any AI assistant to get help with your team's
          projects and tasks.
        </Typography>
        {aiContext ? (
          <>
            <Stack
              direction="row"
              spacing={1.5}
              mb={2}
              flexWrap="wrap"
              gap={0.5}
            >
              <Chip
                label={`${aiContext.stats.projects} Projects`}
                color="primary"
                size="small"
              />
              <Chip
                label={`${aiContext.stats.tasks} Tasks`}
                color="info"
                size="small"
              />
              <Chip
                label={`${aiContext.stats.byStatus?.done || 0} Done`}
                color="success"
                size="small"
              />
              <Chip
                label={`${aiContext.stats.byStatus?.in_progress || 0} Active`}
                color="warning"
                size="small"
              />
            </Stack>
            <Box
              sx={{
                p: 2,
                maxHeight: 400,
                overflow: 'auto',
                bgcolor: isDark ? 'neutral.900' : 'neutral.50',
                fontFamily: 'monospace',
                fontSize: 11.5,
                lineHeight: 1.8,
                whiteSpace: 'pre-wrap',
                borderRadius: 2,
              }}
            >
              {aiContext.context}
            </Box>
          </>
        ) : (
          <Skeleton
            variant="rounded"
            height={220}
          />
        )}
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button
          onClick={() => setAiDialogOpen(false)}
          sx={{ borderRadius: 1.5, textTransform: 'none' }}
        >
          Close
        </Button>
        <Button
          variant="contained"
          disableElevation
          startIcon={<ContentCopyRoundedIcon />}
          onClick={() => {
            if (aiContext?.context) {
              navigator.clipboard.writeText(aiContext.context);
              toast.success('Copied!');
            }
          }}
          sx={{ fontWeight: 700, borderRadius: 1.5, textTransform: 'none' }}
        >
          Copy Context
        </Button>
      </DialogActions>
    </Dialog>
  );
}
