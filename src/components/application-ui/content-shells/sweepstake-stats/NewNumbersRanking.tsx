'use client';

import PersonAddAlt1RoundedIcon from '@mui/icons-material/PersonAddAlt1Rounded';
import StorefrontRoundedIcon from '@mui/icons-material/StorefrontRounded';
import {
  alpha,
  Avatar,
  Box,
  Card,
  CircularProgress,
  Unstable_Grid2 as Grid,
  Skeleton,
  Stack,
  Typography,
  useTheme,
} from '@mui/material';
import type { useSweepstakeStats } from './use-sweepstake-stats';

type Props = Pick<ReturnType<typeof useSweepstakeStats>, 'metricsLoading' | 'storesByNuevos'>;

/** Ranking de tiendas por números nuevos. */
export function NewNumbersRanking({ metricsLoading, storesByNuevos }: Props) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  return (
    <Card
      variant="outlined"
      sx={{ borderRadius: 3, p: { xs: 2, sm: 2.5 }, mb: 3, bgcolor: 'background.paper' }}
    >
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="flex-start"
        sx={{ mb: 2 }}
      >
        <Box>
          <Stack
            direction="row"
            alignItems="center"
            spacing={1}
          >
            <PersonAddAlt1RoundedIcon sx={{ color: 'success.main', fontSize: 20 }} />
            <Typography
              variant="h6"
              fontWeight={700}
            >
              Ranking por números nuevos
            </Typography>
          </Stack>
          <Typography
            variant="caption"
            color="text.secondary"
          >
            {storesByNuevos.length} tiendas &bull; ordenadas por nuevos registros
          </Typography>
        </Box>
        {metricsLoading && (
          <CircularProgress
            size={18}
            thickness={5}
          />
        )}
      </Stack>

      {metricsLoading ? (
        <Grid
          container
          spacing={1.5}
        >
          {Array.from({ length: 6 }).map((_, i) => (
            <Grid
              xs={12}
              sm={6}
              md={4}
              lg={3}
              key={i}
            >
              <Skeleton
                variant="rectangular"
                height={100}
                sx={{ borderRadius: 2.5 }}
              />
            </Grid>
          ))}
        </Grid>
      ) : storesByNuevos.length > 0 ? (
        <Grid
          container
          spacing={1.5}
        >
          {storesByNuevos.map((store, index) => {
            const totalNuevos = storesByNuevos.reduce((acc, s) => acc + (s.newNumbers || 0), 0);
            const pct = totalNuevos > 0 ? ((store.newNumbers || 0) / totalNuevos) * 100 : 0;
            const color = theme.palette.success.main;
            const rankColor =
              index === 0
                ? theme.palette.warning.main
                : index === 1
                  ? theme.palette.text.secondary
                  : index === 2
                    ? theme.palette.warning.dark
                    : alpha(theme.palette.text.primary, 0.1);
            return (
              <Grid
                xs={12}
                sm={6}
                md={4}
                lg={3}
                key={store.storeId || index}
              >
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
                        bgcolor: index < 3 ? rankColor : alpha(theme.palette.text.primary, 0.1),
                        color: index < 3 ? '#fff' : theme.palette.text.secondary,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 10,
                        fontWeight: 800,
                        flexShrink: 0,
                      }}
                    >
                      {index + 1}
                    </Box>
                    <Avatar
                      src={
                        store.storeImage &&
                        store.storeImage !== 'no-image.jpg' &&
                        store.storeImage !== 'n/a'
                          ? store.storeImage.startsWith('http')
                            ? store.storeImage
                            : `${process.env.NEXT_PUBLIC_API_URL}/files/images/${store.storeImage}`
                          : undefined
                      }
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
                        {(store.totalParticipations || 0).toLocaleString()} participaciones
                      </Typography>
                    </Box>
                  </Stack>

                  <Box
                    sx={{
                      bgcolor: alpha(color, isDark ? 0.15 : 0.08),
                      borderRadius: 1.5,
                      p: '8px 10px',
                      mb: 1,
                      border: `1px solid ${alpha(color, 0.22)}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <Typography
                      sx={{
                        fontSize: 9,
                        fontWeight: 800,
                        color,
                        textTransform: 'uppercase',
                        letterSpacing: 0.8,
                      }}
                    >
                      Números nuevos
                    </Typography>
                    <Typography
                      fontWeight={900}
                      fontSize={18}
                      sx={{ color, lineHeight: 1 }}
                    >
                      {(store.newNumbers || 0).toLocaleString()}
                    </Typography>
                  </Box>

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
                        % del total nuevos
                      </Typography>
                      <Typography
                        variant="caption"
                        fontWeight={700}
                        fontSize={9}
                        sx={{ color }}
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
              </Grid>
            );
          })}
        </Grid>
      ) : (
        <Box
          sx={{
            height: 140,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 1,
            opacity: 0.4,
          }}
        >
          <PersonAddAlt1RoundedIcon sx={{ fontSize: 36 }} />
          <Typography
            variant="body2"
            color="text.secondary"
          >
            Sin datos de nuevos registros
          </Typography>
        </Box>
      )}
    </Card>
  );
}
