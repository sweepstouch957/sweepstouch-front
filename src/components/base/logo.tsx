import { Box, Link, useMediaQuery, useTheme } from '@mui/material';
import Image from 'next/image';
import { RouterLink } from './router-link';
import LogoIcon from '@public/web/SweeptouchIcon.png';

interface LogoProps {
  dark?: boolean;
  isLinkStatic?: boolean;
  isCollapsed?: boolean;
}

export const Logo = ({ dark = false, isLinkStatic = false, isCollapsed }: LogoProps) => {
  const theme = useTheme();
  const isMobile = useMediaQuery('(max-width:768px)');

  const color = dark
    ? theme.palette.common.white
    : theme.palette.mode === 'dark'
      ? theme.palette.common.white
      : theme.palette.common.black;
  const linkProps = isLinkStatic
    ? {
        href: '',
        onClick: (e: { preventDefault: () => any }) => e.preventDefault(),
      }
    : { href: '/' };

  return (
    <Box
      sx={{
        position: 'relative',

        transition: (theme) => theme.transitions.create(['transform']),
        transform: 'scale(1)',
        '&:hover': {
          transform: 'scale(1.05)',
        },
        display: 'flex',
        alignItems: 'center',
      }}
    >
      <Link
        component={RouterLink}
        {...linkProps}
        sx={{
          color: color,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {isCollapsed || isMobile ? (
          <Image
            src={LogoIcon.src}
            alt="logo"
            width={48}
            height={48}
          />
        ) : (
          <Image
            src={'/sweepstouch.png'}
            alt="logo"
            width={200}
            height={48}
          />
        )}
      </Link>
    </Box>
  );
};
