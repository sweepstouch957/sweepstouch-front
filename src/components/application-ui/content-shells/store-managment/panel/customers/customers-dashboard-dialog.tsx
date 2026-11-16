'use client';

/**
 * Dashboard de clientes de la tienda (pestaña Clientes del panel): KPIs de listas,
 * puntos dados y canjeados, clientes que más compran, productos más puestos en listas y
 * más comprados. El contenido es el mismo de /admin/dashboards/lists-analytics.
 */
import ListsAnalyticsDashboard from '@/components/lists-analytics/ListsAnalyticsDashboard';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import InsightsRoundedIcon from '@mui/icons-material/InsightsRounded';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';

export default function CustomersDashboardDialog({
  open,
  onClose,
  storeSlug,
  storeName,
}: {
  open: boolean;
  onClose: () => void;
  storeSlug: string;
  storeName?: string;
}) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'));
  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen={fullScreen}
      fullWidth
      maxWidth="lg"
    >
      <DialogTitle sx={{ pr: 6 }}>
        <Stack
          direction="row"
          alignItems="center"
          gap={1}
        >
          <InsightsRoundedIcon color="primary" />
          <div>
            <Typography
              variant="h6"
              fontWeight={800}
            >
              Dashboard de clientes
            </Typography>
            {storeName && (
              <Typography
                variant="caption"
                color="text.secondary"
              >
                {storeName}
              </Typography>
            )}
          </div>
        </Stack>
        <IconButton
          aria-label="Cerrar"
          onClick={onClose}
          sx={{ position: 'absolute', right: 12, top: 12 }}
        >
          <CloseRoundedIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        {storeSlug ? (
          <ListsAnalyticsDashboard storeSlug={storeSlug} />
        ) : (
          <Typography color="text.secondary">Esta tienda no tiene slug: no hay listas que mostrar.</Typography>
        )}
      </DialogContent>
    </Dialog>
  );
}
