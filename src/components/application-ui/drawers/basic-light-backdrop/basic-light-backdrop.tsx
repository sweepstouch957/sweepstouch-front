import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import {
  alpha,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  IconButton,
  SwipeableDrawer,
  useTheme,
} from '@mui/material';
import { useCallback, useState } from 'react';
import DrawerContent from './drawer-content';

const Component = () => {
  const [open, setOpen] = useState<boolean>(true);
  const theme = useTheme();

  const handleDrawerOpen = () => {
    setOpen(true);
  };

  const handleDrawerClose = useCallback(() => {
    setOpen(false);
    setTimeout(() => {
      setOpen(true);
    }, 1000);
  }, []);

  return (
    <Box
      height="100%"
      width="100%"
      position="relative"
      display="flex"
      alignItems={{ xs: 'flex-start', md: 'center' }}
      justifyContent="center"
    >
      <Box
        sx={{
          position: 'absolute',
          height: '100%',
          width: '100%',
          filter: 'grayscale(50%)',
          backgroundPosition: 'center',
          backgroundSize: 'cover',
          backgroundImage: (theme) =>
            theme.palette.mode === 'dark'
              ? `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url("/placeholders/covers/landscape1.png")`
              : `url("/placeholders/covers/landscape1.png")`,
        }}
      />

      <Card
        elevation={24}
        sx={{
          mt: { xs: 3, md: 0 },
          position: 'relative',
          display: 'flex',
          background: (theme) =>
            theme.palette.mode === 'dark'
              ? alpha(theme.palette.background.default, 0.96)
              : alpha(theme.palette.background.paper, 0.8),
          backgroundFilter: 'blur(8px)',
          alignItems: 'center',
          justifyContent: 'center',
          px: 3,
          py: 1,
        }}
      >
        <CardContent>
          <Button
            onClick={handleDrawerOpen}
            variant="contained"
            size="large"
          >
            Open Drawer
          </Button>
          <SwipeableDrawer
            anchor="right"
            open={open}
            onOpen={handleDrawerOpen}
            onClose={handleDrawerClose}
            PaperProps={{
              sx: {
                width: '100%',
                maxWidth: 340,
              },
            }}
            ModalProps={{
              BackdropProps: {
                sx: {
                  background:
                    theme.palette.mode === 'dark'
                      ? `${alpha(theme.palette.neutral[100], 0.1)} !important`
                      : `${alpha(theme.palette.neutral[100], 0.4)} !important`,
                },
              },
            }}
          >
            <CardHeader
              title="Drawer title"
              sx={{
                pb: 0,
                flexDirection: 'row',
                '.MuiCardHeader-action': {
                  mt: '-4px',
                },
              }}
              action={
                <IconButton
                  size="small"
                  onClick={handleDrawerClose}
                >
                  <CloseRoundedIcon fontSize="small" />
                </IconButton>
              }
            />
            <DrawerContent />
          </SwipeableDrawer>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Component;
