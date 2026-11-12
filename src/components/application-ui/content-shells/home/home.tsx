'use client';

/**
 * Inicio del panel: los números del día (cada uno lleva a su pantalla) y todos los
 * módulos con sus páginas a un clic. Se arma con el mismo menú de la barra lateral,
 * filtrado por rol: lo que no puedes abrir, no aparece.
 */
import {
  KpiCard,
  KpiRow,
  PageHero,
  panelBorder,
} from '@/components/application-ui/content-shells/store-managment/panel-kit';
import { RouterLink } from '@/components/base/router-link';
import { useAuth } from '@/hooks/use-auth';
import useMenuItemsCollapsedShells from '@/hooks/use-routes';
import { menuModules, type NavModule } from '@/router/nav';
import { routes } from '@/router/routes';
import { campaignRequestService } from '@/services/campaign-request.service';
import { campaignClient } from '@/services/campaing.service';
import { getStores, getStoresBillingSummary } from '@/services/store.service';
import AddRounded from '@mui/icons-material/AddRounded';
import ArrowForwardRounded from '@mui/icons-material/ArrowForwardRounded';
import { Box, Button, ButtonBase, Container, Skeleton, Stack, Typography, useTheme } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { format, subDays } from 'date-fns';
import { useMemo, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { tint } from 'src/theme/semantic';

const num = (n?: number) => (n == null ? '—' : n.toLocaleString('es'));
const usd = (n?: number) =>
  n == null ? '—' : n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

/** KPI que lleva a su pantalla. Si el dato falla muestra "—", no un cero que parece verdad. */
function KpiLink({
  href,
  label,
  value,
  hint,
  tone,
  loading,
}: {
  href: string;
  label: string;
  value: ReactNode;
  hint?: string;
  tone?: 'neutral' | 'success' | 'warning' | 'error';
  loading?: boolean;
}) {
  return (
    <ButtonBase
      component={RouterLink}
      href={href}
      sx={{
        display: 'block',
        textAlign: 'left',
        borderRadius: 3,
        transition: 'transform 140ms ease-out',
        '&:hover': { transform: 'translateY(-2px)' },
        '&:focus-visible': { outline: '2px solid', outlineColor: 'primary.main', outlineOffset: 2 },
        '@media (prefers-reduced-motion: reduce)': { transition: 'none', '&:hover': { transform: 'none' } },
      }}
    >
      <KpiCard
        label={label}
        value={
          loading ? (
            <Skeleton
              width={90}
              height={25}
            />
          ) : (
            value
          )
        }
        delta={hint}
        tone={tone}
      />
    </ButtonBase>
  );
}

function ModuleCard({ module }: { module: NavModule }) {
  const theme = useTheme();
  return (
    <Box
      component="section"
      sx={{
        borderRadius: 3,
        bgcolor: 'background.paper',
        border: panelBorder(theme),
        p: 2,
        display: 'flex',
        flexDirection: 'column',
        gap: 1.25,
        minWidth: 0,
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        gap={1.25}
      >
        <Box
          aria-hidden
          sx={{
            width: 34,
            height: 34,
            borderRadius: 2,
            display: 'grid',
            placeItems: 'center',
            flexShrink: 0,
            bgcolor: tint(theme, 'primary'),
            color: 'primary.main',
            '& .MuiSvgIcon-root': { fontSize: 19 },
          }}
        >
          {module.icon}
        </Box>
        <Box minWidth={0}>
          <Typography
            component="h2"
            sx={{ fontSize: 15, fontWeight: 800, lineHeight: 1.2 }}
            noWrap
          >
            {module.title}
          </Typography>
          <Typography sx={{ fontSize: 11, color: 'text.secondary', letterSpacing: '0.04em' }}>
            {module.section.toUpperCase()}
          </Typography>
        </Box>
      </Stack>

      <Stack
        direction="row"
        flexWrap="wrap"
        gap={0.75}
      >
        {module.pages.map((p) => (
          <ButtonBase
            key={p.route}
            component={RouterLink}
            href={p.route}
            sx={{
              px: 1.25,
              py: 0.6,
              minHeight: 32,
              borderRadius: 999,
              fontSize: 12.5,
              fontWeight: 600,
              border: panelBorder(theme),
              color: 'text.primary',
              transition: 'background-color 120ms ease-out, border-color 120ms ease-out',
              '&:hover': { bgcolor: tint(theme, 'primary'), borderColor: 'primary.main', color: 'primary.main' },
              '&:focus-visible': { outline: '2px solid', outlineColor: 'primary.main', outlineOffset: 2 },
            }}
          >
            {p.title}
          </ButtonBase>
        ))}
      </Stack>
    </Box>
  );
}

export default function Home() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const menu = useMenuItemsCollapsedShells(t, (user?.role || '') as any);
  const modules = useMemo(() => menuModules(menu), [menu]);
  // Un KPI sólo aparece si el rol puede abrir la pantalla a la que lleva.
  const can = (route: string) => modules.some((m) => m.pages.some((p) => p.route === route));

  const canStores = can(routes.admin.management.stores.listing);
  const canCampaigns = can(routes.admin.management.campaings.listing);
  const canRequests = can(routes.admin.management['campaign-requests'].listing);
  const canBilling = can(routes.admin.management['billing-receivables']);

  const stores = useQuery({
    queryKey: ['home', 'stores-active'],
    queryFn: () => getStores({ status: 'active', limit: 1 } as any),
    enabled: canStores,
  });
  const week = useMemo(
    () => ({
      startDate: format(subDays(new Date(), 7), 'yyyy-MM-dd'),
      endDate: format(new Date(), 'yyyy-MM-dd'),
    }),
    []
  );
  const campaigns = useQuery({
    queryKey: ['home', 'campaigns-week', week],
    queryFn: () => campaignClient.getFilterStats(week as any),
    enabled: canCampaigns,
  });
  const requests = useQuery({
    queryKey: ['home', 'campaign-requests'],
    queryFn: () => campaignRequestService.getStats(),
    enabled: canRequests,
  });
  const billing = useQuery({
    queryKey: ['home', 'billing-summary'],
    queryFn: () => getStoresBillingSummary({ status: 'active' }),
    enabled: canBilling,
  });

  const pendingRequests =
    requests.data && (requests.data.pending_design ?? 0) + (requests.data.in_review ?? 0) + (requests.data.change_requested ?? 0);
  const lateStores = billing.data && (billing.data.high?.count ?? 0) + (billing.data.critical?.count ?? 0);
  const rate = campaigns.data?.messages?.avgDeliveryRate;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Buenos días' : hour < 19 ? 'Buenas tardes' : 'Buenas noches';
  const hasKpis = canStores || canCampaigns || canRequests || canBilling;

  return (
    <Container
      maxWidth="xl"
      sx={{ py: { xs: 2, md: 3 }, display: 'flex', flexDirection: 'column', gap: 2.5 }}
    >
      <PageHero
        eyebrow="Inicio"
        title={`${greeting}${user?.firstName ? `, ${user.firstName}` : ''}`}
        subtitle="Todo el panel desde aquí. Para ir directo a una tienda o pantalla: Ctrl+K."
        actions={
          canCampaigns && (
            <Button
              component={RouterLink}
              href="/admin/management/campaings/create"
              variant="contained"
              disableElevation
              startIcon={<AddRounded />}
            >
              Nueva campaña
            </Button>
          )
        }
      />

      {hasKpis && (
        <KpiRow>
          {canStores && (
            <KpiLink
              href={routes.admin.management.stores.listing}
              label="Tiendas activas"
              loading={stores.isLoading}
              value={num(stores.data?.total)}
              hint="Ver listado"
            />
          )}
          {canCampaigns && (
            <KpiLink
              href={routes.admin.management.campaings.listing}
              label="Campañas · 7 días"
              loading={campaigns.isLoading}
              value={num(campaigns.data?.total)}
              hint={
                campaigns.data ? `${num(campaigns.data.messages?.totalSent)} mensajes enviados` : undefined
              }
            />
          )}
          {canCampaigns && (
            <KpiLink
              href={routes.admin.management.campaings.listing}
              label="Entrega · 7 días"
              loading={campaigns.isLoading}
              value={rate == null ? '—' : `${Number(rate).toFixed(1)}%`}
              tone={rate == null ? 'neutral' : rate >= 90 ? 'success' : rate >= 80 ? 'warning' : 'error'}
              hint={rate == null ? undefined : rate >= 90 ? 'Entrega sana' : 'Por debajo de 90%'}
            />
          )}
          {canRequests && (
            <KpiLink
              href={routes.admin.management['campaign-requests'].listing}
              label="Solicitudes por atender"
              loading={requests.isLoading}
              value={num(pendingRequests)}
              tone={pendingRequests ? 'warning' : 'success'}
              hint={pendingRequests ? 'En diseño o revisión' : 'Nada pendiente'}
            />
          )}
          {canBilling && (
            <KpiLink
              href={routes.admin.management['billing-receivables']}
              label="Por cobrar"
              loading={billing.isLoading}
              value={usd(billing.data?.overall?.totalPending)}
              tone={lateStores ? 'error' : 'neutral'}
              hint={lateStores ? `${num(lateStores)} tiendas con deuda alta` : 'Ver cartera'}
            />
          )}
        </KpiRow>
      )}

      <Box
        sx={{
          display: 'grid',
          gap: 1.5,
          gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 300px), 1fr))',
        }}
      >
        {modules.map((m) => (
          <ModuleCard
            key={`${m.section}-${m.title}`}
            module={m}
          />
        ))}
      </Box>

      <Stack
        direction="row"
        alignItems="center"
        gap={0.5}
        sx={{ color: 'text.secondary' }}
      >
        <ArrowForwardRounded sx={{ fontSize: 16 }} />
        <Typography sx={{ fontSize: 12.5 }}>
          Dentro de cada módulo, las pestañas de arriba te llevan entre sus pantallas.
        </Typography>
      </Stack>
    </Container>
  );
}
