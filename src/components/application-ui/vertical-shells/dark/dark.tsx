import { Box } from '@mui/material';

import { type FC, type ReactNode } from 'react';
import { useSidebarContext } from 'src/contexts/sidebar-context';
import { useMobileNav } from 'src/hooks/use-mobile-nav';
import { MenuItem } from 'src/router/menuItem';
import { headerOffset, SIDEBAR_WIDTH_COLLAPSED } from 'src/theme/utils';
import { Header } from './header';
import { Sidebar } from './sidebar';

interface VerticalShellsDarkProps {
  children?: ReactNode;
  menuItems?: MenuItem[];
}

export const VerticalShellsDark: FC<VerticalShellsDarkProps> = (props) => {
  const { children, menuItems } = props;
  const mobileNav = useMobileNav();

  const { isSidebarCollapsed } = useSidebarContext();

  return (
    <>
      <Sidebar
        menuItems={menuItems}
        onClose={mobileNav.handleClose}
        open={mobileNav.open}
        onOpen={mobileNav.handleOpen}
      />
      <Box
        flex={1}
        overflow="hidden"
        sx={{
          display: 'flex',
          flexDirection: 'column',
          // El navbar es fixed: acá se reserva su hueco. La cabecera publica su
          // alto real, así que esto no puede quedar desfasado como cuando era
          // `HEADER_HEIGHT * 1.5` sobre un navbar de altura fija.
          paddingTop: headerOffset,
          ml: {
            xs: 0,
            lg: isSidebarCollapsed && `${SIDEBAR_WIDTH_COLLAPSED}px`,
          },
        }}
      >
        <Header onMobileNav={mobileNav.handleOpen} />
        {/* Landmark <main>: sin él, un lector de pantalla no puede saltarse el
            menú y la cabecera para llegar al contenido de la página. */}
        <Box
          component="main"
          id="contenido"
          flex={1}
          display="flex"
          flexDirection="column"
          minHeight={0}
        >
          {children}
        </Box>
      </Box>
    </>
  );
};
