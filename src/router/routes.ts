export const routes = {
  index: '/',
  dummy: '',
  auth: {
    login: '/auth/login',
    register: '/auth/register',
    'reset-password': '/auth/reset-password',
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
      'messages-sent': '/admin/dashboards/messages-sent',
      sweepstakes: '/admin/dashboards/sweepstakes',
      'campaign-analytics': '/admin/dashboards/campaign-analytics',
      billing: '/admin/dashboards/billing',
      audience: '/admin/dashboards/audience',

    },
    applications: {
      'ai-assistant': '/admin/applications/ai-assistant',
      'ai-config': '/admin/applications/ai-assistant/config',
      calendar: '/admin/applications/calendar',
      'file-manager': '/admin/applications/file-manager',
      'jobs-platform': '/admin/applications/jobs-platform',
      mailbox: '/admin/applications/mailbox',
      maps: '/admin/applications/maps',
      'optin-cashiers': '/admin/applications/optin-cashiers',

      messenger: '/admin/applications/messenger',
      'debug-numbers': '/admin/applications/debug-numbers',
      'projects-board': '/admin/applications/projects-board',
      tasks: '/admin/applications/tasks',
      meetings: '/admin/applications/meetings',
      demos: '/admin/applications/demos',
      utilities: '/admin/applications/utilities',
    },
    // Designs Studio — herramientas del equipo de diseño. Flyers es un
    // placeholder; Shelfsigns genera los cartones de precio para góndola.
    designs: {
      flyers: '/admin/designs/flyers',
      shelfsigns: '/admin/designs/shelfsigns',
    },
    management: {
      users: {
        listing: '/admin/management/users-listing',
        profile: '/admin/management/users-profile',
      },
      merchants: {
        listing: '/admin/management/merchants',
      },
      projects: '/admin/management/projects',
      account: '/admin/management/account',
      qr: '/admin/management/qr',
      // Centro de facturación + QuickBooks. Es la URL que ve Intuit en el perfil de la app.
      billing: '/admin/management/billing',
      // Pestañas de la misma página: el tab vive en la query para poder enlazarlo.
      'billing-receivables': '/admin/management/billing?tab=cartera',
      'billing-drafts': '/admin/management/billing?tab=prefacturas',
      'billing-reconcile': '/admin/management/billing?tab=conciliacion',
      stores: {
        listing: '/admin/management/stores',
        create: '/admin/management/stores/create',
        brands: '/admin/management/brands',
        appointments: '/admin/management/stores/appointments',
        contracts: '/admin/management/stores/contracts',
        'contracts-create': '/admin/management/stores/contracts/create',
      },
      campaings: {
        listing: '/admin/management/campaings',
        create: '/admin/management/campaings/create',
        'send-test': '/admin/management/campaings/send-test',
        mms: '/admin/management/mms',
        rcs: '/admin/management/rcs',
        optin: '/admin/management/campaings/optin',
      },
      promos: {
        listing: '/admin/management/ads',
        create: '/admin/management/promos/create',
      },
      promotors: {
        listing: '/admin/management/promotors',
        metrics: '/admin/management/promotors/metrics',
        featuredStores: '/admin/management/work-stores',
        turnos: '/admin/management/turnos',
        earningsTiers: '/admin/management/promotors/earnings-tiers',
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
      'campaign-requests': {
        listing: '/admin/management/campaign-requests',
        detail: (id: string) => `/admin/management/campaign-requests/${id}`,
      },
      support: {
        dashboard: '/admin/dashboards/support',
        tickets: '/admin/management/support/tickets',
        visits: '/admin/management/support/visits',
      },
      departments: {
        listing: '/admin/management/departments',
      },
    },
  },

  404: '/404',
};
