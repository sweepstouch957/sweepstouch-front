export const routes = {
  index: '/',
  dummy: '',
  auth: {
    'custom.login': '/auth/custom/login',
    'custom.register': '/auth/custom/register',
    'custom.reset-password': '/auth/custom/reset-password',

    'supabase.callback': '/auth/supabase/callback',
    'supabase.login': '/auth/supabase/login',
    'supabase.register': '/auth/supabase/register',
    'supabase.register-confirm': '/auth/supabase/register-confirm',
    'supabase.reset-password': '/auth/supabase/reset-password',
    'supabase.recover-link-sent': '/auth/supabase/recover-link-sent',
    'supabase.update-password': '/auth/supabase/update-password',
  },

  components: {
    // Components landing page
    index: '/components',

    // Application Shells
    'vertical-shells': '/components/application-ui/vertical-shells',
    'collapsed-shells': '/components/application-ui/collapsed-shells',
    'stacked-shells': '/components/application-ui/stacked-shells',

    // Layout
    foundation: '/components/application-ui/foundation',
    'content-grids': '/components/application-ui/content-grids',
    'content-shells': '/components/application-ui/content-shells',
    'card-shells': '/components/application-ui/card-shells',
    'list-containers': '/components/application-ui/list-containers',
    dividers: '/components/application-ui/dividers',

    // Headings
    'page-headings': '/components/application-ui/page-headings',
    'card-headings': '/components/application-ui/card-headings',
    'section-headings': '/components/application-ui/section-headings',

    // Elements
    buttons: '/components/application-ui/buttons',
    'button-groups': '/components/application-ui/button-groups',
    'toggle-buttons': '/components/application-ui/toggle-buttons',
    badges: '/components/application-ui/badges',
    chips: '/components/application-ui/chips',
    avatars: '/components/application-ui/avatars',

    dropdowns: '/components/application-ui/dropdowns',
    ratings: '/components/application-ui/ratings',
    accordions: '/components/application-ui/accordions',
    'progress-indicators': '/components/application-ui/progress-indicators',

    // Navigation
    'horizontal-menus': '/components/application-ui/horizontal-menus',
    'vertical-menus': '/components/application-ui/vertical-menus',
    pagination: '/components/application-ui/pagination',
    tabs: '/components/application-ui/tabs',
    steppers: '/components/application-ui/steppers',
    breadcrumbs: '/components/application-ui/breadcrumbs',
    'speed-dials': '/components/application-ui/speed-dials',

    // Feedback
    alerts: '/components/application-ui/alerts',
    'empty-states': '/components/application-ui/empty-states',
    skeleton: '/components/application-ui/skeleton',

    // Overlays
    popovers: '/components/application-ui/popovers',
    tooltips: '/components/application-ui/tooltips',
    notifications: '/components/application-ui/notifications',
    dialogs: '/components/application-ui/dialogs',
    drawers: '/components/application-ui/drawers',
    'navigation-overlays': '/components/application-ui/navigation-overlays',

    // Lists
    'stacked-lists': '/components/application-ui/stacked-lists',
    'horizontal-lists': '/components/application-ui/horizontal-lists',
    tables: '/components/application-ui/tables',
    timelines: '/components/application-ui/timelines',

    // Grid Data Display
    'data-grid-lists': '/components/application-ui/data-grid-lists',
    'stats-grid-lists': '/components/application-ui/stats-grid-lists',
    'description-grid-lists': '/components/application-ui/description-grid-lists',
    'visualization-grid-lists': '/components/application-ui/visualization-grid-lists',
    'progress-grid-lists': '/components/application-ui/progress-grid-lists',
    'image-grid-lists': '/components/application-ui/image-grid-lists',
    'icon-grid-lists': '/components/application-ui/icon-grid-lists',
    'composed-blocks': '/components/application-ui/composed-blocks',

    // Data Visualization
    'area-charts': '/components/application-ui/area-charts',
    'bar-charts': '/components/application-ui/bar-charts',
    'line-charts': '/components/application-ui/line-charts',
    'pie-doughnut-charts': '/components/application-ui/pie-doughnut-charts',
    'sparkline-charts': '/components/application-ui/sparkline-charts',
    'gauge-indicators': '/components/application-ui/gauge-indicators',
    'composed-visualization-blocks': '/components/application-ui/composed-visualization-blocks',

    // Forms
    'form-layouts': '/components/application-ui/form-layouts',
    'user-auth': '/components/application-ui/user-auth',
    autocomplete: '/components/application-ui/autocomplete',
    checkboxes: '/components/application-ui/checkboxes',
    'radio-groups': '/components/application-ui/radio-groups',
    select: '/components/application-ui/select',
    switches: '/components/application-ui/switches',
    textarea: '/components/application-ui/textarea',
    input: '/components/application-ui/input',
    slider: '/components/application-ui/slider',
    upload: '/components/application-ui/upload',
    datepicker: '/components/application-ui/datepicker',
  },
  website: {
    index: '/',
    pricing: '/pricing',
  },
  admin: {
    index: '/admin/dashboards/reports',
    dashboards: {
      reports: '/admin/dashboards/reports',
      expenses: '/admin/dashboards/expenses',
      sweepstakes: '/admin/dashboards/sweepstakes',
      prouctivity: '/admin/dashboards/productivity',
      statistics: '/admin/dashboards/statistics',
      automation: '/admin/dashboards/automation',
      analytics: '/admin/dashboards/analytics',
      hospital: '/admin/dashboards/hospital',
      helpdesk: '/admin/dashboards/helpdesk',
      monitoring: '/admin/dashboards/monitoring',
      billing: '/admin/dashboards/billing',
      audience: '/admin/dashboards/audience',

    },
    applications: {
      calendar: '/admin/applications/calendar',
      'file-manager': '/admin/applications/file-manager',
      'jobs-platform': '/admin/applications/jobs-platform',
      mailbox: '/admin/applications/mailbox',
      maps: '/admin/applications/maps',

      messenger: '/admin/applications/messenger',
      'debug-numbers': '/admin/applications/debug-numbers',
      'projects-board': '/admin/applications/projects-board',
      tasks: '/admin/applications/tasks',
    },
    management: {
      users: {
        listing: '/admin/management/users-listing',
        profile: '/admin/management/users-profile',
      },
      projects: '/admin/management/projects',
      stores: {
        listing: '/admin/management/stores',
        create: '/admin/management/stores/create',
      },
      campaings: {
        listing: '/admin/management/campaings',
        create: '/admin/management/campaings/create',
      },
      promos: {
        listing: '/admin/management/ads',
        create: '/admin/management/promos/create',
      },
      promotors: {
        listing: '/admin/management/promotors',
        turnos: '/admin/management/turnos',
        featuredStores: '/admin/management/work-stores',
      },
      solicitudes: {
        turnos: '/admin/management/solicitudes/turnos',
        promotoras: '/admin/management/solicitudes/promotoras',
      },
      sweepstakes: {
        listing: '/admin/management/sweepstakes',
        create: '/admin/management/sweepstakes/create',
        prizes: '/admin/management/sweepstakes/prizes',
        stats: (id: string) => `/admin/management/sweepstakes/${id}/stats`,
        edit: (id: string) => `/admin/management/sweepstakes/${id}/edit`,
      },
      circulars: {
        'subscribed-stores': '/admin/management/circulars/subscribed-stores',
        'info-dashboard': '/admin/management/circulars/info-dashboard',
        'manage': '/admin/management/circulars/manage',
        'edit': '/admin/management/circulars/edit',
        'schedule': '/admin/management/circulars/schedule',
      },


      prizes: {
        listing: '/admin/management/prizes',
        create: '/admin/management/prizes/create',
      },

      commerce: {
        'shop-front': '/admin/management/shop-front',
        'shop-listing': '/admin/management/shop-listing',
        'shop-product-create': '/admin/management/shop-product-create',
        'shop-product-details': '/admin/management/shop-product-details',
        'invoices-listing': '/admin/management/invoices-listing',
        'invoices-details': '/admin/management/invoices-details',
      },
    },
  },

  404: '/404',
};
