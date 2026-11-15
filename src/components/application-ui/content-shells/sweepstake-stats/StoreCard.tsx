'use client';

/** Tarjeta de una tienda en "Performance por tienda": nuevos, participaciones y % del total. */
import StorefrontRoundedIcon from '@mui/icons-material/StorefrontRounded';
import { alpha, Avatar, Box, Card, Stack, Typography, useTheme } from '@mui/material';
import { FC } from 'react';

// ─── Store Performance Card ────────────────────────────────────────────────────

interface StoreCardProps {
  store: any;
  rank: number;
  color: string;
  total: number;
}

// Pure helper — no component-local deps, allocated once at module scope
const getAvatar = (img: string) => {
  if (!img || img === 'no-image.jpg' || img === 'n/a') return undefined;
  if (img.startsWith('http') || img.startsWith('data:')) return img;
  return `${process.env.NEXT_PUBLIC_API_URL}/files/images/${img}`;
};

export const StoreCard: FC<StoreCardProps> = ({ store, rank, color, total }) => {
  const theme = useTheme();
  const pct = total > 0 ? (store.totalParticipations / total) * 100 : 0;
  const isDark = theme.palette.mode === 'dark';

  return (
    <Card
      variant="outlined"
      sx={{
        borderRadius: 2.5,
        p: 1.75,
        bgcolor: 'background.paper',
        border: `1px solid ${theme.palette.divider}`,
        transition: 'all 0.2s ease',
        '&:hover': {
          bgcolor: alpha(color, isDark ? 0.12 : 0.06),
          borderColor: alpha(color, 0.4),
          transform: 'translateY(-2px)',
        },
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        spacing={1.25}
        sx={{ mb: 1.25 }}
      >
        <Box
          sx={{
            width: 22,
            height: 22,
            borderRadius: '50%',
            bgcolor: rank <= 3 ? color : alpha(theme.palette.text.primary, 0.1),
            color: rank <= 3 ? '#fff' : theme.palette.text.secondary,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 10,
            fontWeight: 800,
            flexShrink: 0,
          }}
        >
          {rank}
        </Box>

        <Avatar
          src={getAvatar(store.storeImage)}
          variant="rounded"
          sx={{
            width: 36,
            height: 36,
            borderRadius: 2,
            bgcolor: alpha(theme.palette.text.primary, 0.06),
            border: `1px solid ${theme.palette.divider}`,
          }}
        >
          <StorefrontRoundedIcon sx={{ fontSize: 16, color: 'action.active' }} />
        </Avatar>

        <Box
          flex={1}
          minWidth={0}
        >
          <Typography
            fontWeight={700}
            fontSize={12}
            noWrap
            title={store.storeName}
          >
            {store.storeName}
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
            fontSize={10}
          >
            {(store.totalRegistrations || 0).toLocaleString()} registros
          </Typography>
        </Box>
      </Stack>

      <Stack
        direction="row"
        spacing={0.75}
        sx={{ mb: 1.25 }}
      >
        <Box
          flex={1}
          sx={{
            bgcolor: alpha(theme.palette.success.main, isDark ? 0.15 : 0.08),
            borderRadius: 1.5,
            p: 0.75,
            textAlign: 'center',
            border: `1px solid ${alpha(theme.palette.success.main, 0.22)}`,
          }}
        >
          <Typography
            sx={{
              fontSize: 8,
              fontWeight: 800,
              color: 'success.main',
              textTransform: 'uppercase',
              letterSpacing: 0.8,
              lineHeight: 1,
            }}
          >
            Nuevos
          </Typography>
          <Typography
            fontWeight={900}
            fontSize={14}
            sx={{ color: 'success.main', lineHeight: 1.3 }}
          >
            {(store.newNumbers || 0).toLocaleString()}
          </Typography>
        </Box>
        <Box
          flex={1}
          sx={{
            bgcolor: alpha(color, isDark ? 0.18 : 0.08),
            borderRadius: 1.5,
            p: 0.75,
            textAlign: 'center',
            border: `1px solid ${alpha(color, 0.22)}`,
          }}
        >
          <Typography
            sx={{
              fontSize: 8,
              fontWeight: 800,
              color: color,
              textTransform: 'uppercase',
              letterSpacing: 0.8,
              lineHeight: 1,
            }}
          >
            Particip.
          </Typography>
          <Typography
            fontWeight={900}
            fontSize={14}
            sx={{ color: color, lineHeight: 1.3 }}
          >
            {(store.totalParticipations || 0).toLocaleString()}
          </Typography>
        </Box>
      </Stack>

      <Box>
        <Stack
          direction="row"
          justifyContent="space-between"
          sx={{ mb: 0.4 }}
        >
          <Typography
            variant="caption"
            color="text.secondary"
            fontSize={9}
          >
            % del total
          </Typography>
          <Typography
            variant="caption"
            fontWeight={700}
            fontSize={9}
            sx={{ color: color }}
          >
            {pct.toFixed(1)}%
          </Typography>
        </Stack>
        <Box
          sx={{
            height: 3.5,
            bgcolor: alpha(color, 0.12),
            borderRadius: 2,
            overflow: 'hidden',
          }}
        >
          <Box
            sx={{
              height: '100%',
              width: `${Math.min(pct, 100)}%`,
              bgcolor: color,
              borderRadius: 2,
              transition: 'width 0.7s cubic-bezier(0.4,0,0.2,1)',
            }}
          />
        </Box>
      </Box>
    </Card>
  );
};
