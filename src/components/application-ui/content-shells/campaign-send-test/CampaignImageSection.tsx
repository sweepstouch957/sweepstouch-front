'use client';

import AvatarUploadLogo from '@/components/application-ui/upload/avatar/avatar-upload-logo';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import ImageRoundedIcon from '@mui/icons-material/ImageRounded';
import { Alert, Box, Button, Chip, Stack, Typography } from '@mui/material';
import { MAX_IMAGE_KB } from './constants';
import type { useSendTestMessage } from './use-send-test-message';

type Props = Pick<
  ReturnType<typeof useSendTestMessage>,
  | 'newImage'
  | 'setNewImage'
  | 'setUploadedImageUrl'
  | 'imageRemoved'
  | 'setImageRemoved'
  | 'setSnack'
  | 'lastImageIsPdf'
  | 'safeCampaignImage'
  | 'previewImage'
>;

/** Paso 4: imagen opcional (MMS); quitarla manda sólo SMS. */
export function CampaignImageSection({
  newImage,
  setNewImage,
  setUploadedImageUrl,
  imageRemoved,
  setImageRemoved,
  setSnack,
  lastImageIsPdf,
  safeCampaignImage,
  previewImage,
}: Props) {
  return (
    <Box>
      <Stack
        direction="row"
        alignItems="center"
        spacing={1}
        mb={1}
      >
        <ImageRoundedIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
        <Typography
          variant="caption"
          fontWeight={700}
          color="text.secondary"
          sx={{ textTransform: 'uppercase', letterSpacing: 0.7, fontSize: 10.5 }}
        >
          4 · Campaign Image (optional)
        </Typography>
      </Stack>

      <Alert
        severity="warning"
        sx={{ borderRadius: 2, py: 0.25, mb: 2, fontSize: 12 }}
      >
        Max {MAX_IMAGE_KB} KB for MMS delivery. Leave empty for SMS only.
      </Alert>

      {lastImageIsPdf && (
        <Alert
          severity="error"
          sx={{ borderRadius: 2, py: 0.5, mb: 2, fontSize: 12 }}
        >
          The last campaign image is a <strong>PDF</strong> and cannot be sent via MMS. Please
          upload a JPG/PNG image below.
        </Alert>
      )}

      <AvatarUploadLogo
        key={imageRemoved ? 'img-cleared' : safeCampaignImage || 'img-empty'}
        label="Upload image"
        initialUrl={imageRemoved ? null : safeCampaignImage}
        onSelect={(file) => {
          if (!file) {
            // Explicit removal → send as plain SMS, ignore inherited image.
            setNewImage(null);
            setUploadedImageUrl(null);
            setImageRemoved(true);
            return;
          }
          if (file.size > MAX_IMAGE_KB * 1024) {
            setSnack({ open: true, msg: `Image exceeds ${MAX_IMAGE_KB} KB.`, sev: 'error' });
            return;
          }
          setNewImage(file);
          setImageRemoved(false);
        }}
      />

      {newImage && (
        <Chip
          icon={<CheckCircleRoundedIcon />}
          label={`${newImage.name} · ${(newImage.size / 1024).toFixed(0)} KB`}
          color="success"
          variant="outlined"
          size="small"
          sx={{ mt: 1.5 }}
        />
      )}

      {/* Remove the inherited / uploaded image → send as plain SMS */}
      {previewImage && (
        <Button
          size="small"
          color="inherit"
          startIcon={<CloseRoundedIcon sx={{ fontSize: 14 }} />}
          onClick={() => {
            setNewImage(null);
            setUploadedImageUrl(null);
            setImageRemoved(true);
          }}
          sx={{ mt: 1.5, textTransform: 'none', fontWeight: 600 }}
        >
          Quitar imagen (enviar solo SMS)
        </Button>
      )}
    </Box>
  );
}
