'use client';

/** Arte del grupo o banner en grande. */
import { Dialog, DialogContent } from '@mui/material';

export default function ArtPreviewDialog({
  url,
  onClose,
}: {
  url: string | null;
  onClose: () => void;
}) {
  return (
    <Dialog
      open={!!url}
      onClose={onClose}
      maxWidth="md"
      fullWidth
    >
      <DialogContent sx={{ p: 1, bgcolor: 'background.default' }}>
        {url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={url}
            alt="Arte"
            style={{ width: '100%', display: 'block' }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
