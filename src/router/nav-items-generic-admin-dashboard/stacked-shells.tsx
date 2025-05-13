import { MenuItem } from 'src/router/menuItem';
import { routes } from 'src/router/routes';
import DashboardRoundedIcon from '@mui/icons-material/DashboardRounded';
import AppsRoundedIcon from '@mui/icons-material/AppsRounded';
import PeopleRoundedIcon from '@mui/icons-material/PeopleRounded';
import { Campaign, Redeem, Store } from '@mui/icons-material';

const useMenuItemsCollapsedShells = (t: (token: string) => string): MenuItem[] => {
   return [
      {
        title: t('General'),
        subMenu: [
          {
            title: t('Dashboards'),
            icon: <DashboardRoundedIcon />,
            subMenu: [
              {
                title: t('Reports'),
                route: routes.admin.dashboards.reports,
              },
              {
                title: t('Sweepstakes'),
                route: routes.admin.dashboards.sweepstakes,
              },
            ],
          },
          {
            title: t('Applications'),
            icon: <AppsRoundedIcon />,
            subMenu: [
              {
                title: t('Calendar'),
                route: routes.admin.applications.calendar,
              },
              {
                title: t('File manager'),
                route: routes.admin.applications['file-manager'],
              },

              {
                title: t('Messenger'),
                route: routes.admin.applications.messenger,
              },
            ],
          },
        ],
      },
      {
        title: t('Management'),
        subMenu: [
          {
            title: t('Users'),
            icon: <PeopleRoundedIcon />,
            subMenu: [
              {
                title: t('Listing'),
                route: routes.admin.management.users.listing,
              },
              {
                title: t('User profile'),
                route: routes.admin.management.users.profile,
              },
            ],
          },
          {
            title: t('Campaigns'),
            icon: <Campaign />,
            route: routes.admin.management.campaings.listing,
            subMenu: [
              {
                title: t('Listing'),
                route: routes.admin.management.campaings.listing,
              },
            ],
          },
          {
            title: t('Sweepstakes'),
            icon: <Redeem />,
            route: routes.admin.management.sweepstakes.listing,
            subMenu: [
              {
                title: t('Listing'),
                route: routes.admin.management.sweepstakes.listing,
              },
            ],
          },
          {
            title: t('Stores'),
            icon: <Store />,
            subMenu: [
              {
                title: t('Listing'),
                route: routes.admin.management.stores.listing,
              },
              {
                title: t('Create Store'),
                route: routes.admin.management.stores.create,
              },
            ],
          },
        ],
      },
    ];
};

export default useMenuItemsCollapsedShells;
