import { Card, Stack, Theme, useMediaQuery } from '@mui/material';
import { SidebarNavMenu } from 'src/components/application-ui/vertical-shells/dark/sidebar-nav-menu';
import { Scrollbar } from 'src/components/base/scrollbar';
import { useMenuItems } from 'src/router/nav-items-dummy/vertical-shells/vertical-shells-dark';
import { MenuMobile } from './menu-mobile';

const Component = () => {
  const mdUp = useMediaQuery((theme: Theme) => theme.breakpoints.up('md'));
  const menuItems = useMenuItems();

  return (
    <Stack
      pb={{ xs: 48, md: 0 }}
      justifyContent="space-around"
      spacing={{ xs: 2, sm: 3 }}
      alignItems="center"
      direction={{ xs: 'column', sm: 'row' }}
    >
      <Card
        elevation={0}
        variant="outlined"
        sx={{
          p: { xs: 2, md: 0.5 },
          overflow: 'visible',
          width: '100%',
          height: { sx: 'auto', md: 768 },
          backgroundColor: 'neutral.900',
        }}
      >
        {mdUp ? (
          <Scrollbar dark>
            <SidebarNavMenu menuItems={menuItems} />
          </Scrollbar>
        ) : (
          <MenuMobile />
        )}
      </Card>
    </Stack>
  );
};

export default Component;
