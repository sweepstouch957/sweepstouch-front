'use client';

/** El banner en grande, tal cual se subió. */
import { Box, Dialog } from '@mui/material';

export default function BannerPreviewDialog({
  url,
  onClose,
}: {
  url: string;
  onClose: () => void;
}) {
  return (
    <Dialog
      open={!!url}
      onClose={onClose}
      maxWidth="md"
      fullWidth
    >
      {url && (
        <Box
          component="img"
          src={url}
          alt="Vista previa del banner"
          sx={{ display: 'block', width: '100%', height: 'auto' }}
        />
      )}
    </Dialog>
  );
}
