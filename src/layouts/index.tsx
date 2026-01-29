import { useAuth } from '@/hooks/use-auth';
import useMenuItemsCollapsedShells from '@/hooks/use-routes';

import type { FC, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
// Collapsed Shells
import { CollapsedShellsDoubleAccent } from 'src/components/application-ui/collapsed-shells/double-accent/double-accent';
import { CollapsedShellsDoubleDark } from 'src/components/application-ui/collapsed-shells/double-dark/double-dark';
import { CollapsedShellsDouble } from 'src/components/application-ui/collapsed-shells/double/double';
import { CollapsedShellsSingleAccent } from 'src/components/application-ui/collapsed-shells/single-accent/single-accent';
import { CollapsedShellsSingleWhiteOff } from 'src/components/application-ui/collapsed-shells/single-white-off/single-white-off';
import { CollapsedShellsSingleWhite } from 'src/components/application-ui/collapsed-shells/single-white/single-white';
import { CollapsedShellsSingle } from 'src/components/application-ui/collapsed-shells/single/single';
// Stacked Shells
import { StackedShellsTopNavAccent } from 'src/components/application-ui/stacked-shells/top-nav-accent/top-nav-accent';
import { StackedShellsTopNavTabs } from 'src/components/application-ui/stacked-shells/top-nav-tabs/top-nav-tabs';
import { StackedShellsTopNavWide } from 'src/components/application-ui/stacked-shells/top-nav-wide/top-nav-wide';
import { StackedShellsTopNav } from 'src/components/application-ui/stacked-shells/top-nav/top-nav';
import { VerticalShellsAccentHeader } from 'src/components/application-ui/vertical-shells/accent-header/accent-header';
import { VerticalShellsBrand } from 'src/components/application-ui/vertical-shells/brand/brand';
import { VerticalShellsDarkAlternate } from 'src/components/application-ui/vertical-shells/dark-alternate/dark-alternate';
// Vertical Shells
import { VerticalShellsDark } from 'src/components/application-ui/vertical-shells/dark/dark';
import { VerticalShellsLight } from 'src/components/application-ui/vertical-shells/light/light';
import { VerticalShellsWhiteOff } from 'src/components/application-ui/vertical-shells/white-off/white-off';
import { VerticalShellsWhite } from 'src/components/application-ui/vertical-shells/white/white';
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

  let ShellComponent: FC<LayoutProps>;
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

