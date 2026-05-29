'use client';

import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import LinkRoundedIcon from '@mui/icons-material/LinkRounded';
import SmsRoundedIcon from '@mui/icons-material/SmsRounded';
import TabletMacRoundedIcon from '@mui/icons-material/TabletMacRounded';
import {
  alpha,
  Box,
  Button,
  Dialog,
  IconButton,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import SendTestMessagePage from 'src/app/admin/management/campaings/send-test/page';
import { routes } from 'src/router/routes';

const OPTIN_CASHIERS_URL =
  'https://kiosko.sweepstouch.com/?slug=merchant-r-street-lar-azul-55-barueri-sp';
const LINKTREE_URL =
  'https://links.sweepstouch.com/?slug=food-universe-marketplace-498-e-30th-st-paterson-nj-07504';
const DEFAULT_TEST_STORE_NAME = 'Tienda de prueba super real';
const SWEEPSTOUCH_PINK = '#FC0C83';
const iframeScale = {
  xs: 0.58,
  sm: 0.64,
  md: 0.68,
  xl: 0.72,
};

export default function OptinCashiersPage() {
  const { push } = useRouter();
  const [activeView, setActiveView] = useState<'kiosk' | 'send-test' | 'linktree'>('kiosk');
  const isPhoneView = activeView === 'linktree';

  const handleClose = () => {
    push(routes.admin.dashboards.reports);
  };

  return (
    <Dialog
      open
      onClose={handleClose}
      maxWidth={false}
      PaperProps={{
        sx: {
          width: { xs: 'calc(100dvw - 16px)', sm: 'calc(100dvw - 28px)' },
          height: { xs: 'calc(100dvh - 16px)', sm: 'calc(100dvh - 28px)' },
          maxWidth: 'none',
          maxHeight: 'none',
          m: 0,
          borderRadius: { xs: 2.5, sm: 3.5 },
          bgcolor: SWEEPSTOUCH_PINK,
          backgroundImage: `linear-gradient(135deg, ${SWEEPSTOUCH_PINK} 0%, #d8006b 44%, #a90055 100%)`,
          color: '#fff',
          overflow: 'hidden',
        },
      }}
    >
      <Box
        sx={{
          height: '100%',
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
          p: { xs: 1.5, sm: 2, md: 3 },
          gap: { xs: 1.5, md: 2 },
        }}
      >
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          spacing={2}
          sx={{ flexShrink: 0 }}
        >
          <Stack
            direction="row"
            alignItems="center"
            spacing={1.25}
            sx={{ minWidth: 0 }}
          >
            <Box
              sx={{
                width: 38,
                height: 38,
                borderRadius: 1.5,
                display: 'grid',
                placeItems: 'center',
                bgcolor: alpha('#fff', 0.1),
                border: `1px solid ${alpha('#fff', 0.14)}`,
              }}
            >
              <TabletMacRoundedIcon fontSize="small" />
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography
                variant="h5"
                sx={{ fontWeight: 800, lineHeight: 1.1 }}
              >
                Sweepstouch
              </Typography>
              <Typography
                variant="body2"
                sx={{ color: alpha('#fff', 0.68) }}
              >
                Kiosko merchant
              </Typography>
            </Box>
          </Stack>

          <Stack
            direction="row"
            alignItems="center"
            spacing={1}
          >
            <Tooltip title="Close">
              <IconButton
                onClick={handleClose}
                aria-label="Close Optin Cashiers"
                sx={{
                  color: '#fff',
                  bgcolor: alpha('#fff', 0.1),
                  border: `1px solid ${alpha('#fff', 0.16)}`,
                  '&:hover': { bgcolor: alpha('#fff', 0.16) },
                }}
              >
                <CloseRoundedIcon />
              </IconButton>
            </Tooltip>
          </Stack>
        </Stack>

        <Box
          sx={{
            flex: 1,
            minHeight: 0,
            display: 'grid',
            gridTemplateColumns: {
              xs: 'minmax(0, 1fr)',
              lg: 'minmax(0, 1fr) clamp(260px, 17vw, 320px)',
            },
            gridTemplateRows: { xs: 'minmax(0, 1fr) auto', lg: 'minmax(0, 1fr)' },
            alignItems: 'center',
            justifyContent: 'center',
            gap: { xs: 1.25, md: 2, lg: 2.5 },
          }}
        >
          <Box
            sx={{
              width: isPhoneView
                ? { xs: 'min(100%, 330px)', sm: 'min(100%, 360px)', lg: 'min(100%, 380px)' }
                : '100%',
              height: isPhoneView
                ? { xs: '100%', sm: '100%', lg: 'min(100%, 980px)' }
                : '100%',
              minHeight: 0,
              maxHeight: isPhoneView ? 980 : 920,
              maxWidth: isPhoneView ? 380 : 1390,
              justifySelf: 'center',
              borderRadius: isPhoneView ? { xs: 5, md: 7 } : { xs: 4, md: 6 },
              bgcolor: '#101010',
              p: isPhoneView
                ? { xs: '22px 9px 12px', sm: '26px 11px 14px' }
                : { xs: '12px 8px', sm: '16px 10px', md: '20px 12px' },
              boxShadow: `0 28px 80px ${alpha('#000', 0.46)}`,
              border: `1px solid ${alpha('#fff', 0.16)}`,
              position: 'relative',
              display: 'flex',
            }}
          >
            <Box
              sx={{
                position: 'absolute',
                top: isPhoneView ? { xs: 8, sm: 10 } : { xs: 4, md: 7 },
                left: '50%',
                width: isPhoneView ? { xs: 70, sm: 86 } : { xs: 58, sm: 76 },
                height: isPhoneView ? 5 : 4,
                borderRadius: 999,
                bgcolor: alpha('#fff', 0.2),
                transform: 'translateX(-50%)',
              }}
            />
            <Box
              sx={{
                flex: 1,
                overflow: 'hidden',
                borderRadius: isPhoneView ? { xs: 3.8, sm: 5 } : { xs: 2.6, md: 4 },
                bgcolor: '#fff',
                border: `1px solid ${alpha('#fff', 0.1)}`,
                position: 'relative',
              }}
            >
              {activeView === 'kiosk' ? (
                <Box
                  component="iframe"
                  title="Optin Cashiers"
                  src={OPTIN_CASHIERS_URL}
                  sx={{
                    display: 'block',
                    width: {
                      xs: `${100 / iframeScale.xs}%`,
                      sm: `${100 / iframeScale.sm}%`,
                      md: `${100 / iframeScale.md}%`,
                      xl: `${100 / iframeScale.xl}%`,
                    },
                    height: {
                      xs: `${100 / iframeScale.xs}%`,
                      sm: `${100 / iframeScale.sm}%`,
                      md: `${100 / iframeScale.md}%`,
                      xl: `${100 / iframeScale.xl}%`,
                    },
                    border: 0,
                    transform: {
                      xs: `scale(${iframeScale.xs})`,
                      sm: `scale(${iframeScale.sm})`,
                      md: `scale(${iframeScale.md})`,
                      xl: `scale(${iframeScale.xl})`,
                    },
                    transformOrigin: 'top left',
                  }}
                  allow="clipboard-read; clipboard-write; fullscreen; geolocation"
                />
              ) : (
                <>
                  {activeView === 'send-test' ? (
                    <Box
                      sx={{
                        height: '100%',
                        overflow: 'auto',
                        bgcolor: (theme) => theme.palette.background.default,
                      }}
                    >
                      <SendTestMessagePage defaultStoreName={DEFAULT_TEST_STORE_NAME} />
                    </Box>
                  ) : (
                    <Box
                      component="iframe"
                      title="Sweepstouch Linktree"
                      src={LINKTREE_URL}
                      sx={{
                        display: 'block',
                        width: '100%',
                        height: '100%',
                        border: 0,
                      }}
                      allow="clipboard-read; clipboard-write; fullscreen"
                    />
                  )}
                </>
              )}
            </Box>
          </Box>

          <Stack
            direction={{ xs: 'column', sm: 'row', lg: 'column' }}
            spacing={{ xs: 1, sm: 1.25 }}
            sx={{
              width: '100%',
              minWidth: 0,
              alignSelf: { xs: 'stretch', lg: 'center' },
              justifySelf: { xs: 'stretch', lg: 'start' },
            }}
          >
            <Button
              fullWidth
              variant="contained"
              size="large"
              startIcon={<TabletMacRoundedIcon />}
              onClick={() => setActiveView('kiosk')}
              sx={{
                minHeight: 48,
                minWidth: 0,
                justifyContent: 'center',
                bgcolor: '#fff',
                color: SWEEPSTOUCH_PINK,
                borderColor: '#fff',
                px: { xs: 1.25, sm: 2 },
                whiteSpace: 'nowrap',
                fontSize: { xs: 12, sm: 14 },
                fontWeight: 800,
                boxShadow: `0 12px 30px ${alpha('#000', 0.18)}`,
                '& .MuiButton-startIcon': {
                  mr: { xs: 0.75, sm: 1 },
                  flexShrink: 0,
                },
                '&:hover': {
                  bgcolor: alpha('#fff', 0.92),
                },
              }}
            >
              Kiosko
            </Button>
            <Button
              fullWidth
              variant="contained"
              size="large"
              startIcon={<SmsRoundedIcon />}
              onClick={() => setActiveView('send-test')}
              sx={{
                minHeight: 48,
                minWidth: 0,
                justifyContent: 'center',
                bgcolor: '#fff',
                color: SWEEPSTOUCH_PINK,
                borderColor: '#fff',
                px: { xs: 1.25, sm: 2 },
                whiteSpace: 'nowrap',
                fontSize: { xs: 12, sm: 14 },
                fontWeight: 800,
                boxShadow: `0 12px 30px ${alpha('#000', 0.18)}`,
                '& .MuiButton-startIcon': {
                  mr: { xs: 0.75, sm: 1 },
                  flexShrink: 0,
                },
                '&:hover': {
                  bgcolor: alpha('#fff', 0.92),
                },
              }}
            >
              Enviar MMS de prueba
            </Button>
            <Button
              fullWidth
              variant="outlined"
              size="large"
              startIcon={<LinkRoundedIcon />}
              onClick={() => setActiveView('linktree')}
              sx={{
                minHeight: 48,
                minWidth: 0,
                justifyContent: 'center',
                color: SWEEPSTOUCH_PINK,
                borderColor: '#fff',
                bgcolor: '#fff',
                px: { xs: 1.25, sm: 2 },
                whiteSpace: 'nowrap',
                fontSize: { xs: 12, sm: 14 },
                fontWeight: 800,
                boxShadow: `0 12px 30px ${alpha('#000', 0.12)}`,
                '& .MuiButton-startIcon': {
                  mr: { xs: 0.75, sm: 1 },
                  flexShrink: 0,
                },
                '&:hover': {
                  borderColor: '#fff',
                  bgcolor: alpha('#fff', 0.92),
                },
              }}
            >
              Linktree
            </Button>
          </Stack>
        </Box>
      </Box>
    </Dialog>
  );
}
