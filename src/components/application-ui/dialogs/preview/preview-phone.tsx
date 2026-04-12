import { Box, Typography } from '@mui/material';
import { useEffect, useMemo } from 'react';

interface PreviewPhoneProps {
  content?: string;
  image?: File | string | null;
  fontSize?: number;
}

export default function PreviewPhone({ content = '', image, fontSize = 16 }: PreviewPhoneProps) {
  const imageUrl = useMemo(() => {
    if (!image) return null;
    if (typeof image === 'string') return image;
    return URL.createObjectURL(image);
  }, [image]);

  useEffect(() => {
    return () => {
      if (imageUrl && typeof image !== 'string') {
        URL.revokeObjectURL(imageUrl);
      }
    };
  }, [image, imageUrl]);

  const hasContent = Boolean(content?.trim()) || Boolean(imageUrl);

  return (
    <Box
      sx={{
        position: 'relative',
        width: '100%',
        maxWidth: 323,
        aspectRatio: '323 / 650',
        mx: 'auto',
      }}
    >
      <Box
        component="img"
        src="/images/devices/campaign-preview-phone.svg"
        alt="Phone preview"
        sx={{
          width: '100%',
          height: '100%',
          display: 'block',
          userSelect: 'none',
          pointerEvents: 'none',
        }}
      />

      <Box
        sx={{
          position: 'absolute',
          left: '6.5%',
          right: '6.5%',
          top: '15.4%',
          height: '69.7%',
          overflowY: 'auto',
          px: 2.5,
          py: 2.25,
          scrollbarWidth: 'thin',
          '&::-webkit-scrollbar': {
            width: 6,
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: 'rgba(0,0,0,0.12)',
            borderRadius: 999,
          },
        }}
      >
        {imageUrl && (
          <Box
            component="img"
            src={imageUrl}
            alt="Campaign preview"
            sx={{
              width: '100%',
              display: 'block',
              borderRadius: 3,
              mb: content?.trim() ? 2 : 0,
              objectFit: 'cover',
              bgcolor: '#fafafa',
              border: '1px solid #ececec',
            }}
          />
        )}

        {content?.trim() ? (
          <Typography
            sx={{
              whiteSpace: 'pre-wrap',
              color: '#111827',
              fontSize,
              lineHeight: 1.5,
              wordBreak: 'break-word',
            }}
          >
            {content}
          </Typography>
        ) : !hasContent ? (
          <Typography
            sx={{
              color: '#9ca3af',
              fontSize,
              lineHeight: 1.45,
            }}
          >
            La vista previa aparecerá aquí.
          </Typography>
        ) : null}
      </Box>
    </Box>
  );
}
