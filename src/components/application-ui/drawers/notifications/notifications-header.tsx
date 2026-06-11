import {
  Box,
  Button,
  CardActions,
  CardHeader,
  Divider,
  SwipeableDrawer,
} from '@mui/material';
import { FC } from 'react';
import DrawerContent from './drawer-content';

interface NotificationsHeaderProps {
  onOpen?: () => void;
  onClose?: () => void;
  open?: boolean;
}

export const NotificationsHeader: FC<NotificationsHeaderProps> = (props) => {
  const { onClose, onOpen, open = false, ...other } = props;

  const handleDrawerClose = () => {
    if (onClose) {
      onClose();
    }
  };

  return (
    <SwipeableDrawer
      anchor="right"
      open={open}
      onClose={onClose}
      onOpen={onOpen}
      elevation={0}
      PaperProps={{
        sx: {
          width: '100%',
          maxWidth: { xs: 340, md: 420, lg: 460 },
          overflow: 'visible',
          flexDirection: 'row',
        },
      }}
      {...other}
    >
      <Box
        overflow="hidden"
        display="flex"
        flexDirection="column"
        width="100%"
      >
        <CardHeader
          title="Notificaciones"
          titleTypographyProps={{ variant: 'h5', fontWeight: 700 }}
          sx={{ p: 1.5, pb: 1 }}
        />
        <Divider />
        <Box
          overflow="hidden"
          flex={1}
        >
          <DrawerContent />
        </Box>
        <Divider />
        <CardActions sx={{ justifyContent: 'flex-end', px: 2 }}>
          <Button onClick={handleDrawerClose} variant="outlined" size="small">
            Cerrar
          </Button>
        </CardActions>
      </Box>
    </SwipeableDrawer>
  );
};
