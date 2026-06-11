import { useAuth } from '@/hooks/use-auth';
import useMenuItemsCollapsedShells from '@/hooks/use-routes';

import dynamic from 'next/dynamic';
import type { FC, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

// Collapsed Shells (Dynamic Imports)
const CollapsedShellsDoubleAccent = dynamic(() => import('src/components/application-ui/collapsed-shells/double-accent/double-accent').then(mod => mod.CollapsedShellsDoubleAccent));
const CollapsedShellsDoubleDark = dynamic(() => import('src/components/application-ui/collapsed-shells/double-dark/double-dark').then(mod => mod.CollapsedShellsDoubleDark));
const CollapsedShellsDouble = dynamic(() => import('src/components/application-ui/collapsed-shells/double/double').then(mod => mod.CollapsedShellsDouble));
const CollapsedShellsSingleAccent = dynamic(() => import('src/components/application-ui/collapsed-shells/single-accent/single-accent').then(mod => mod.CollapsedShellsSingleAccent));
const CollapsedShellsSingleWhiteOff = dynamic(() => import('src/components/application-ui/collapsed-shells/single-white-off/single-white-off').then(mod => mod.CollapsedShellsSingleWhiteOff));
const CollapsedShellsSingleWhite = dynamic(() => import('src/components/application-ui/collapsed-shells/single-white/single-white').then(mod => mod.CollapsedShellsSingleWhite));
const CollapsedShellsSingle = dynamic(() => import('src/components/application-ui/collapsed-shells/single/single').then(mod => mod.CollapsedShellsSingle));

// Stacked Shells (Dynamic Imports)
const StackedShellsTopNavAccent = dynamic(() => import('src/components/application-ui/stacked-shells/top-nav-accent/top-nav-accent').then(mod => mod.StackedShellsTopNavAccent));
const StackedShellsTopNavTabs = dynamic(() => import('src/components/application-ui/stacked-shells/top-nav-tabs/top-nav-tabs').then(mod => mod.StackedShellsTopNavTabs));
const StackedShellsTopNavWide = dynamic(() => import('src/components/application-ui/stacked-shells/top-nav-wide/top-nav-wide').then(mod => mod.StackedShellsTopNavWide));
const StackedShellsTopNav = dynamic(() => import('src/components/application-ui/stacked-shells/top-nav/top-nav').then(mod => mod.StackedShellsTopNav));

// Vertical Shells (Dynamic Imports)
const VerticalShellsAccentHeader = dynamic(() => import('src/components/application-ui/vertical-shells/accent-header/accent-header').then(mod => mod.VerticalShellsAccentHeader));
const VerticalShellsBrand = dynamic(() => import('src/components/application-ui/vertical-shells/brand/brand').then(mod => mod.VerticalShellsBrand));
const VerticalShellsDarkAlternate = dynamic(() => import('src/components/application-ui/vertical-shells/dark-alternate/dark-alternate').then(mod => mod.VerticalShellsDarkAlternate));
const VerticalShellsDark = dynamic(() => import('src/components/application-ui/vertical-shells/dark/dark').then(mod => mod.VerticalShellsDark));
const VerticalShellsLight = dynamic(() => import('src/components/application-ui/vertical-shells/light/light').then(mod => mod.VerticalShellsLight));
const VerticalShellsWhiteOff = dynamic(() => import('src/components/application-ui/vertical-shells/white-off/white-off').then(mod => mod.VerticalShellsWhiteOff));
const VerticalShellsWhite = dynamic(() => import('src/components/application-ui/vertical-shells/white/white').then(mod => mod.VerticalShellsWhite));

// Guards

import { withAuthGuard } from 'src/hocs/with-auth-guard';
import { useCustomization } from 'src/hooks/use-customization';
import { MenuItem } from 'src/router/menuItem';

interface LayoutProps {
  children?: ReactNode;
  menuItems?: MenuItem[];
}

export const Layout: FC<LayoutProps> = withAuthGuard((props) => {
  const customization = useCustomization();
  const { t } = useTranslation();
  const { user } = useAuth();

  let ShellComponent: any;
  let menuItems: MenuItem[] = [];

  switch (customization.layout) {
    // Vertical Shells
    case 'vertical-shells-dark':
      ShellComponent = VerticalShellsDark;
      menuItems = useMenuItemsCollapsedShells(t, user.role || '');
      break;
    case 'vertical-shells-dark-alternate':
      ShellComponent = VerticalShellsDarkAlternate;
      menuItems = useMenuItemsCollapsedShells(t, user.role || '');
      break;
    case 'vertical-shells-brand':
      ShellComponent = VerticalShellsBrand;
      menuItems = useMenuItemsCollapsedShells(t, user.role || '');
      break;
    case 'vertical-shells-white':
      ShellComponent = VerticalShellsWhite;
      menuItems = useMenuItemsCollapsedShells(t, user.role || '');
      break;
    case 'vertical-shells-white-off':
      ShellComponent = VerticalShellsWhiteOff;
      menuItems = useMenuItemsCollapsedShells(t, user.role || '');
      break;
    case 'vertical-shells-light':
      ShellComponent = VerticalShellsLight;
      menuItems = useMenuItemsCollapsedShells(t, user.role || '');
      break;
    case 'vertical-shells-accent-header':
      ShellComponent = VerticalShellsAccentHeader;
      menuItems = useMenuItemsCollapsedShells(t, user.role || '');
      break;

    // Collapsed Shells
    case 'collapsed-shells-double':
      ShellComponent = CollapsedShellsDouble;
      menuItems = useMenuItemsCollapsedShells(t, user.role || '');
      break;
    case 'collapsed-shells-double-accent':
      ShellComponent = CollapsedShellsDoubleAccent;
      menuItems = useMenuItemsCollapsedShells(t, user.role || '');
      break;
    case 'collapsed-shells-double-dark':
      ShellComponent = CollapsedShellsDoubleDark;
      menuItems = useMenuItemsCollapsedShells(t, user.role || '');
      break;
    case 'collapsed-shells-single':
      ShellComponent = CollapsedShellsSingle;
      menuItems = useMenuItemsCollapsedShells(t, user.role || '');
      break;
    case 'collapsed-shells-single-accent':
      ShellComponent = CollapsedShellsSingleAccent;
      menuItems = useMenuItemsCollapsedShells(t, user.role || '');
      break;
    case 'collapsed-shells-single-white':
      ShellComponent = CollapsedShellsSingleWhite;
      menuItems = useMenuItemsCollapsedShells(t, user.role || '');
      break;
    case 'collapsed-shells-single-white-off':
      ShellComponent = CollapsedShellsSingleWhiteOff;
      menuItems = useMenuItemsCollapsedShells(t, user.role || '');
      break;

    // Stacked Shells
    case 'stacked-shells-top-nav':
      ShellComponent = StackedShellsTopNav;
      menuItems = useMenuItemsCollapsedShells(t, user.role || '');
      break;
    case 'stacked-shells-top-nav-accent':
      ShellComponent = StackedShellsTopNavAccent;
      menuItems = useMenuItemsCollapsedShells(t, user.role || '');
      break;
    case 'stacked-shells-top-nav-tabs':
      ShellComponent = StackedShellsTopNavTabs;
      menuItems = useMenuItemsCollapsedShells(t, user.role || '');
      break;
    case 'stacked-shells-top-nav-wide':
      ShellComponent = StackedShellsTopNavWide;
      menuItems = useMenuItemsCollapsedShells(t, user.role || '');
      break;

    default:
      ShellComponent = VerticalShellsDark;
      menuItems = useMenuItemsCollapsedShells(t, user.role || '');
  }

  return (
    <>
      <ShellComponent
        menuItems={menuItems}
        {...props}
      />
    </>
  );
});

