import { User } from '@/contexts/auth/user';
import { Avatar, Badge, Box, Typography } from '@mui/material';
import { lime } from '@mui/material/colors';
import { FC } from 'react';

interface AvatarTitleDescriptionAlternateProps {
  user: any;
}
const Component: FC<AvatarTitleDescriptionAlternateProps> = ({ user }) => {
  return (
    <Box
      display="flex"
      alignItems="center"
    >
      <Badge
        color="secondary"
        anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
        badgeContent="12"
        overlap="circular"
      >
        <Avatar
          sx={{
            backgroundColor: lime[800],
            color: 'common.white',
            width: 48,
            height: 48,
          }}
        >
          {user?.firstName?.charAt(0).toUpperCase() || 'JD'}
        </Avatar>
      </Badge>
      <Box
        mx={1}
        overflow="hidden"
      >
        <Typography
          variant="h5"
          component="div"
        >
          {user?.firstName || 'John Doe'}
        </Typography>
        <Typography
          variant="subtitle1"
          color="text.secondary"
          noWrap
        >
          {user.role || 'Marketing Manager'}
        </Typography>
      </Box>
    </Box>
  );
};

export default Component;
