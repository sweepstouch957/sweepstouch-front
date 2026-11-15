'use client';

import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from '@mui/material';
import type { useAiChat } from './use-ai-chat';

type Props = Pick<
  ReturnType<typeof useAiChat>,
  'messages' | 'deleteTarget' | 'setDeleteTarget' | 'handleDeleteConfirm'
>;

/** Confirmación para borrar una conversación. */
export function DeleteConversationDialog({
  messages,
  deleteTarget,
  setDeleteTarget,
  handleDeleteConfirm,
}: Props) {
  return (
    <>
      {deleteTarget && (
        <Dialog
          open
          onClose={() => setDeleteTarget(null)}
          maxWidth="xs"
          fullWidth
          PaperProps={{ sx: { borderRadius: 3, p: 1 } }}
        >
          <DialogTitle sx={{ fontWeight: 700, fontSize: 16, pb: 0.5 }}>
            Delete conversation?
          </DialogTitle>
          <DialogContent>
            <Typography
              variant="body2"
              color="text.secondary"
              fontSize={13}
            >
              This action cannot be undone. The conversation and all its messages will be
              permanently removed.
            </Typography>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button
              onClick={() => setDeleteTarget(null)}
              sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 1.5, fontSize: 13 }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              color="error"
              onClick={handleDeleteConfirm}
              sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 1.5, fontSize: 13 }}
            >
              Delete
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </>
  );
}
