import type { AiContextResponse } from '@/services/task.service';
import ContentCopyRoundedIcon from '@mui/icons-material/ContentCopyRounded';
import SmartToyRoundedIcon from '@mui/icons-material/SmartToyRounded';
import {
  alpha,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Typography,
  useTheme,
} from '@mui/material';
import React from 'react';
import toast from 'react-hot-toast';

export function AiDialog({
  open,
  onClose,
  aiContext,
}: {
  open: boolean;
  onClose: () => void;
  aiContext?: AiContextResponse;
}) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{ sx: { borderRadius: 3 } }}
    >
      <DialogTitle>
        <Stack
          direction="row"
          alignItems="center"
          spacing={1.5}
        >
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: 2,
              bgcolor: alpha(theme.palette.warning.main, 0.12),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <SmartToyRoundedIcon sx={{ color: 'warning.main', fontSize: 20 }} />
          </Box>
          <Box>
            <Typography
              variant="h6"
              fontWeight={700}
              lineHeight={1.2}
            >
              AI Training Context
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
            >
              Export task data for AI assistants
            </Typography>
          </Box>
        </Stack>
      </DialogTitle>
      <DialogContent dividers>
        {aiContext ? (
          <>
            <Stack
              direction="row"
              spacing={1}
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
                label={`${aiContext.stats.byStatus?.in_progress || 0} In Progress`}
                color="warning"
                size="small"
              />
            </Stack>
            <Typography
              variant="body2"
              color="text.secondary"
              mb={1.5}
              fontSize={12}
            >
              Copy this context and paste it into ChatGPT, Claude, Gemini, or any AI to get help
              with your team's tasks.
            </Typography>
            <Box
              sx={{
                p: 2,
                maxHeight: 380,
                overflow: 'auto',
                bgcolor: isDark
                  ? alpha(theme.palette.common.black, 0.3)
                  : alpha(theme.palette.common.black, 0.03),
                fontFamily: 'monospace',
                fontSize: 11.5,
                lineHeight: 1.8,
                whiteSpace: 'pre-wrap',
                borderRadius: 2,
                border: `1px solid ${alpha(theme.palette.divider, 0.15)}`,
              }}
            >
              {aiContext.context}
            </Box>
          </>
        ) : (
          <Box
            display="flex"
            justifyContent="center"
            py={6}
          >
            <CircularProgress />
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button
          onClick={onClose}
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
              toast.success('Context copied to clipboard!');
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
