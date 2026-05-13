'use client';

import * as React from 'react';
import {
  alpha,
  Box,
  Button,
  Chip,
  CircularProgress,
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  LinearProgress,
  Paper,
  Skeleton,
  Stack,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material';
import {
  BatteryChargingFull,
  BatteryFull,
  Battery50,
  Battery20,
  BatteryAlert,
  Close,
  DeviceHub,
  FiberManualRecord,
  LocationOn,
  LockOpen,
  MoreVert,
  PhoneAndroid,
  PowerSettingsNew,
  Refresh,
  Router,
  Screenshot,
  SettingsRemote,
  SignalCellularAlt,
  SmartScreen,
  SpeakerNotesOff,
  SpeakerPhone,
  SystemUpdate,
  VolumeUp,
  Wifi,
  WifiOff,
} from '@mui/icons-material';
import toast from 'react-hot-toast';
import { useKioskDevices, useDeviceAction } from '@/hooks/fetching/kiosk/useKioskDevices';
import { type KioskDevice, type DeviceActionName } from '@/services/kiosk.service';

/* ─── Props ──────────────────────────────────────────────────────────────── */
interface Props {
  storeId: string;
}

/* ─── Battery helpers ────────────────────────────────────────────────────── */
function BatteryIcon({ level, charging }: { level: number; charging: boolean }) {
  if (charging) return <BatteryChargingFull sx={{ fontSize: 16 }} />;
  if (level >= 80) return <BatteryFull sx={{ fontSize: 16 }} />;
  if (level >= 40) return <Battery50 sx={{ fontSize: 16 }} />;
  if (level >= 15) return <Battery20 sx={{ fontSize: 16 }} />;
  return <BatteryAlert sx={{ fontSize: 16 }} />;
}

function batteryColor(level: number, charging: boolean): string {
  if (charging) return '#4ade80';
  if (level >= 50) return '#4ade80';
  if (level >= 20) return '#fbbf24';
  return '#f87171';
}

/* ─── Action definitions ─────────────────────────────────────────────────── */
interface ActionBtn {
  label: string;
  icon: React.ReactNode;
  action: DeviceActionName;
  color?: 'primary' | 'error' | 'warning' | 'success' | 'info';
  confirm?: string;
}

const PRIMARY_ACTIONS: ActionBtn[] = [
  { label: 'Status',      icon: <Refresh sx={{ fontSize: 16 }} />,         action: 'request-status', color: 'info' },
  { label: 'Pantalla ▶',  icon: <SmartScreen sx={{ fontSize: 16 }} />,     action: 'screen-on',      color: 'success' },
  { label: 'Pantalla ■',  icon: <SpeakerNotesOff sx={{ fontSize: 16 }} />, action: 'screen-off',     color: 'warning' },
  { label: 'Captura',     icon: <Screenshot sx={{ fontSize: 16 }} />,      action: 'screenshot',     color: 'primary' },
  { label: 'Identificar', icon: <SpeakerPhone sx={{ fontSize: 16 }} />,    action: 'identify',       color: 'info' },
  { label: 'Localizar',   icon: <VolumeUp sx={{ fontSize: 16 }} />,        action: 'locate-sound',   color: 'info' },
];

const ADVANCED_ACTIONS: ActionBtn[] = [
  {
    label: 'Reiniciar App', icon: <Refresh sx={{ fontSize: 16 }} />,
    action: 'restart-app', color: 'warning',
    confirm: '¿Reiniciar la aplicación kiosko?',
  },
  { label: 'Recargar Home', icon: <Router sx={{ fontSize: 16 }} />,           action: 'reload-home',   color: 'warning' },
  {
    label: 'Limpiar Caché', icon: <LockOpen sx={{ fontSize: 16 }} />,
    action: 'clear-cache', color: 'warning',
    confirm: '¿Limpiar caché del navegador kiosko?',
  },
  {
    label: 'Limpiar Cookies', icon: <LockOpen sx={{ fontSize: 16 }} />,
    action: 'clear-cookies', color: 'warning',
    confirm: '¿Limpiar cookies?',
  },
  {
    label: 'Actualizar', icon: <SystemUpdate sx={{ fontSize: 16 }} />,
    action: 'update-kiosk', color: 'info',
    confirm: '¿Actualizar el kiosko a la última versión?',
  },
  {
    label: 'Limpiar Datos', icon: <DeviceHub sx={{ fontSize: 16 }} />,
    action: 'clear-app-data', color: 'warning',
    confirm: '¿Limpiar datos de la app? Esto eliminará la sesión.',
  },
  { label: 'WiFi Settings', icon: <Wifi sx={{ fontSize: 16 }} />,              action: 'open-wifi',     color: 'info' },
  { label: 'Subir Logs',    icon: <SignalCellularAlt sx={{ fontSize: 16 }} />, action: 'upload-logs',   color: 'info' },
  {
    label: 'REINICIAR TABLET',
    icon: <PowerSettingsNew sx={{ fontSize: 16 }} />,
    action: 'reboot',
    color: 'error',
    confirm: '⚠️ ¿Confirmar REINICIO del dispositivo? La tablet se apagará y encenderá.',
  },
];

/* ─── Device card ────────────────────────────────────────────────────────── */
function DeviceCard({
  device,
  onAction,
  loadingAction,
}: {
  device: KioskDevice;
  onAction: (identifier: string, action: DeviceActionName, confirm?: string) => void;
  loadingAction: DeviceActionName | null;
}) {
  const theme = useTheme();
  const [expanded, setExpanded] = React.useState(false);
  const isDark = theme.palette.mode === 'dark';

  const accentColor = device.online ? theme.palette.success.main : theme.palette.grey[500];
  const onlineColor = device.online ? '#4ade80' : '#6b7280';

  const lastSeen = device.lastSeen
    ? new Date(device.lastSeen).toLocaleString('es-HN', { dateStyle: 'short', timeStyle: 'short' })
    : '—';

  return (
    <Paper
      variant="outlined"
      sx={{
        borderRadius: 3,
        overflow: 'hidden',
        border: `1px solid ${device.online ? alpha(accentColor, 0.35) : alpha(theme.palette.divider, 1)}`,
        bgcolor: isDark ? alpha('#0f172a', 0.7) : 'background.paper',
        transition: 'all 0.25s ease',
        '&:hover': {
          borderColor: alpha(accentColor, 0.6),
          boxShadow: `0 8px 32px ${alpha(accentColor, 0.12)}`,
        },
      }}
    >
      {/* Top gradient bar */}
      <Box
        sx={{
          height: 3,
          background: device.online
            ? `linear-gradient(90deg, ${theme.palette.success.dark}, ${theme.palette.success.light})`
            : `linear-gradient(90deg, ${theme.palette.grey[700]}, ${theme.palette.grey[500]})`,
        }}
      />

      {/* Header */}
      <Box px={2} pt={2} pb={1}>
        <Stack direction="row" alignItems="flex-start" spacing={1.5}>
          <Box
            sx={{
              width: 48, height: 48, borderRadius: 2, flexShrink: 0,
              bgcolor: alpha(accentColor, 0.1),
              border: `1.5px solid ${alpha(accentColor, 0.25)}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: accentColor,
            }}
          >
            <PhoneAndroid sx={{ fontSize: 26 }} />
          </Box>

          <Box flex={1} minWidth={0}>
            <Stack direction="row" alignItems="center" spacing={0.75} mb={0.25}>
              <FiberManualRecord sx={{ fontSize: 10, color: onlineColor }} />
              <Typography variant="subtitle2" fontWeight={700} noWrap>
                {device.name || 'Sin nombre'}
              </Typography>
            </Stack>
            <Typography variant="caption" color="text.secondary" noWrap>
              {device.model} · {device.brand}
            </Typography>
          </Box>

          <Chip
            label={device.online ? 'Online' : 'Offline'}
            size="small"
            sx={{
              height: 20, fontSize: 10, fontWeight: 700, flexShrink: 0,
              bgcolor: device.online ? alpha('#4ade80', 0.12) : alpha('#6b7280', 0.12),
              color: device.online ? '#4ade80' : '#9ca3af',
              border: `1px solid ${device.online ? alpha('#4ade80', 0.3) : alpha('#6b7280', 0.25)}`,
            }}
          />
        </Stack>

        {/* Quick stats */}
        <Stack direction="row" spacing={1.5} mt={1.5} flexWrap="wrap" useFlexGap>
          {/* Battery */}
          <Stack direction="row" alignItems="center" spacing={0.4}>
            <Box sx={{ color: batteryColor(device.batteryLevel, device.isCharging) }}>
              <BatteryIcon level={device.batteryLevel} charging={device.isCharging} />
            </Box>
            <Typography variant="caption" fontWeight={600} sx={{ color: batteryColor(device.batteryLevel, device.isCharging) }}>
              {device.batteryLevel}%
            </Typography>
          </Stack>

          {/* Screen */}
          <Stack direction="row" alignItems="center" spacing={0.4}>
            <SmartScreen sx={{ fontSize: 14, color: device.screenOn ? '#60a5fa' : 'text.disabled' }} />
            <Typography variant="caption" color={device.screenOn ? 'text.primary' : 'text.disabled'}>
              {device.screenOn ? 'Encendida' : 'Apagada'}
            </Typography>
          </Stack>

          {/* WiFi */}
          <Stack direction="row" alignItems="center" spacing={0.4}>
            {device.wiFiNetwork && device.wiFiNetwork !== '<unknown ssid>' ? (
              <>
                <Wifi sx={{ fontSize: 14, color: '#60a5fa' }} />
                <Typography variant="caption" noWrap sx={{ maxWidth: 80 }}>{device.wiFiNetwork}</Typography>
              </>
            ) : (
              <>
                <WifiOff sx={{ fontSize: 14, color: 'text.disabled' }} />
                <Typography variant="caption" color="text.disabled">Sin WiFi</Typography>
              </>
            )}
          </Stack>
        </Stack>

        {/* Battery bar */}
        <Box mt={1.25}>
          <LinearProgress
            variant="determinate"
            value={device.batteryLevel}
            sx={{
              height: 4, borderRadius: 2,
              bgcolor: alpha(batteryColor(device.batteryLevel, device.isCharging), 0.15),
              '& .MuiLinearProgress-bar': {
                bgcolor: batteryColor(device.batteryLevel, device.isCharging),
                borderRadius: 2,
              },
            }}
          />
        </Box>
      </Box>

      <Divider sx={{ mx: 2, opacity: 0.5 }} />

      {/* Primary actions */}
      <Box px={2} py={1.25}>
        <Stack direction="row" flexWrap="wrap" gap={0.75}>
          {PRIMARY_ACTIONS.map((a) => (
            <Button
              key={a.action}
              size="small"
              variant="outlined"
              color={a.color ?? 'primary'}
              disabled={loadingAction !== null}
              startIcon={loadingAction === a.action ? <CircularProgress size={12} /> : a.icon}
              onClick={() => onAction(device.identifier, a.action, a.confirm)}
              sx={{ fontSize: 11, px: 1.25, py: 0.4, minWidth: 0, borderStyle: 'dashed' }}
            >
              {a.label}
            </Button>
          ))}

          <Button
            size="small"
            variant="text"
            color="inherit"
            onClick={() => setExpanded((p) => !p)}
            sx={{ fontSize: 11, px: 1, py: 0.4, minWidth: 0, color: 'text.disabled' }}
            endIcon={<MoreVert sx={{ fontSize: 14 }} />}
          >
            {expanded ? 'Menos' : 'Más'}
          </Button>
        </Stack>
      </Box>

      {/* Advanced actions */}
      <Collapse in={expanded}>
        <Divider sx={{ mx: 2, opacity: 0.4 }} />
        <Box
          px={2} py={1.25}
          sx={{ bgcolor: isDark ? alpha('#0f172a', 0.4) : alpha(theme.palette.grey[100], 0.6) }}
        >
          <Typography variant="caption" color="text.disabled" fontWeight={600} mb={1} display="block">
            ACCIONES AVANZADAS
          </Typography>
          <Stack direction="row" flexWrap="wrap" gap={0.75}>
            {ADVANCED_ACTIONS.map((a) => (
              <Button
                key={a.action}
                size="small"
                variant="outlined"
                color={a.color ?? 'primary'}
                disabled={loadingAction !== null}
                startIcon={loadingAction === a.action ? <CircularProgress size={12} /> : a.icon}
                onClick={() => onAction(device.identifier, a.action, a.confirm)}
                sx={{
                  fontSize: 11, px: 1.25, py: 0.4, minWidth: 0,
                  ...(a.color === 'error' && { borderColor: 'error.main', color: 'error.main', fontWeight: 700 }),
                }}
              >
                {a.label}
              </Button>
            ))}
          </Stack>
        </Box>
      </Collapse>

      {/* Footer */}
      <Divider sx={{ mx: 2, opacity: 0.4 }} />
      <Box px={2} py={1}>
        <Stack direction="row" justifyContent="space-between" flexWrap="wrap" gap={0.5}>
          <Typography variant="caption" color="text.disabled" sx={{ fontFamily: 'monospace', fontSize: 10 }}>
            {device.serial || device.imei || device.identifier.slice(0, 12) + '…'}
          </Typography>
          <Typography variant="caption" color="text.disabled" fontSize={10}>
            Visto: {lastSeen}
          </Typography>
        </Stack>
        <Typography variant="caption" color="text.disabled" fontSize={10}>
          Android {device.androidVersion} · Kiosk {device.kioskVersion}
        </Typography>
      </Box>
    </Paper>
  );
}

/* ─── Confirm dialog ─────────────────────────────────────────────────────── */
function ConfirmDialog({
  open, message, onConfirm, onClose,
}: {
  open: boolean;
  message: string;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        Confirmar acción
        <IconButton size="small" onClick={onClose}><Close fontSize="small" /></IconButton>
      </DialogTitle>
      <DialogContent>
        <Typography variant="body2">{message}</Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} size="small">Cancelar</Button>
        <Button onClick={() => { onConfirm(); onClose(); }} variant="contained" color="error" size="small">
          Confirmar
        </Button>
      </DialogActions>
    </Dialog>
  );
}

/* ─── Main panel ─────────────────────────────────────────────────────────── */
export function KioskTabletPanel({ storeId }: Props) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const { data: devices, isLoading, error, refetch, isFetching } = useKioskDevices(storeId);
  const actionMutation = useDeviceAction(storeId);

  // Per-device loading state: identifier -> action name
  const [loadingDevice, setLoadingDevice] = React.useState<Record<string, DeviceActionName | null>>({});
  const [confirmState, setConfirmState] = React.useState<{
    open: boolean;
    identifier: string;
    action: DeviceActionName;
    message: string;
  } | null>(null);

  const handleAction = (identifier: string, action: DeviceActionName, confirmMsg?: string) => {
    if (confirmMsg) {
      setConfirmState({ open: true, identifier, action, message: confirmMsg });
      return;
    }
    runAction(identifier, action);
  };

  const runAction = (identifier: string, action: DeviceActionName) => {
    setLoadingDevice((p) => ({ ...p, [identifier]: action }));
    actionMutation.mutate(
      { action, identifier },
      {
        onSuccess: () => {
          toast.success(`Acción "${action}" enviada ✓`);
          setLoadingDevice((p) => ({ ...p, [identifier]: null }));
        },
        onError: (err: any) => {
          const msg = err?.response?.data?.error ?? err?.message ?? 'Error al enviar la acción';
          toast.error(msg);
          setLoadingDevice((p) => ({ ...p, [identifier]: null }));
        },
      },
    );
  };

  const online  = (devices ?? []).filter((d) => d.online).length;
  const offline = (devices ?? []).filter((d) => !d.online).length;

  /* ── Loading skeleton ── */
  if (isLoading) {
    return (
      <Box p={3}>
        <Skeleton variant="rectangular" height={48} sx={{ borderRadius: 2, mb: 2 }} />
        <Grid container spacing={2}>
          {[1, 2, 3].map((i) => (
            <Grid item xs={12} sm={6} md={4} key={i}>
              <Skeleton variant="rectangular" height={280} sx={{ borderRadius: 3 }} />
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  /* ── Error state ── */
  if (error) {
    const errMsg = (error as any)?.response?.data?.error ?? (error as Error)?.message ?? 'Error desconocido';
    return (
      <Box p={3}>
        <Paper
          variant="outlined"
          sx={{
            p: 4, borderRadius: 3, textAlign: 'center',
            borderColor: alpha(theme.palette.error.main, 0.3),
            bgcolor: alpha(theme.palette.error.main, 0.05),
          }}
        >
          <SettingsRemote sx={{ fontSize: 48, color: 'error.main', mb: 1 }} />
          <Typography variant="h6" color="error" gutterBottom>
            No se pudo conectar al Kiosk Manager
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={1}>
            {errMsg}
          </Typography>
          <Typography variant="caption" color="text.disabled" display="block" mb={2}>
            Verifica que los dispositivos estén registrados y que el slug de la tienda coincida con el tag del kiosko.
          </Typography>
          <Button variant="outlined" color="error" size="small" onClick={() => refetch()} startIcon={<Refresh />}>
            Reintentar
          </Button>
        </Paper>
      </Box>
    );
  }

  /* ── Empty state ── */
  if (!devices || devices.length === 0) {
    return (
      <Box p={3}>
        <Paper
          variant="outlined"
          sx={{
            p: 4, borderRadius: 3, textAlign: 'center',
            border: `1px dashed ${alpha(theme.palette.primary.main, 0.3)}`,
            bgcolor: isDark ? alpha('#0f172a', 0.5) : alpha(theme.palette.primary.main, 0.03),
          }}
        >
          <PhoneAndroid sx={{ fontSize: 52, color: alpha(theme.palette.primary.main, 0.4), mb: 1.5 }} />
          <Typography variant="h6" fontWeight={700} gutterBottom>
            Sin tablets registradas
          </Typography>
          <Typography variant="body2" color="text.secondary">
            No se encontraron dispositivos kiosko vinculados a esta tienda.
            Asegúrate de que el slug de la tienda coincida con el tag de los dispositivos en Android Kiosk Manager.
          </Typography>
        </Paper>
      </Box>
    );
  }

  return (
    <Box p={{ xs: 2, md: 3 }}>
      {/* ── Header ── */}
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2.5} flexWrap="wrap" gap={1}>
        <Box>
          <Stack direction="row" alignItems="center" spacing={1}>
            <SettingsRemote sx={{ fontSize: 20, color: 'primary.main' }} />
            <Typography variant="subtitle1" fontWeight={800}>
              Control de Tablets (Kiosk)
            </Typography>
            {isFetching && <CircularProgress size={14} />}
          </Stack>
          <Typography variant="caption" color="text.secondary">
            Gestión remota via Android Kiosk Manager API · auto-refresh cada 2 min
          </Typography>
        </Box>

        <Stack direction="row" alignItems="center" spacing={1}>
          <Chip
            icon={<FiberManualRecord sx={{ fontSize: '10px !important', color: '#4ade80 !important' }} />}
            label={`${online} online`}
            size="small"
            sx={{ fontWeight: 600, fontSize: 11, bgcolor: alpha('#4ade80', 0.1), color: '#4ade80', border: `1px solid ${alpha('#4ade80', 0.3)}` }}
          />
          <Chip
            icon={<FiberManualRecord sx={{ fontSize: '10px !important', color: '#9ca3af !important' }} />}
            label={`${offline} offline`}
            size="small"
            sx={{ fontWeight: 600, fontSize: 11, bgcolor: alpha('#9ca3af', 0.1), color: '#9ca3af', border: `1px solid ${alpha('#9ca3af', 0.3)}` }}
          />
          <Tooltip title="Actualizar estado">
            <IconButton size="small" onClick={() => refetch()} disabled={isFetching}>
              <Refresh sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>
        </Stack>
      </Stack>

      {/* ── Device grid ── */}
      <Grid container spacing={2}>
        {devices.map((device) => (
          <Grid item xs={12} sm={6} md={4} key={device.identifier}>
            <DeviceCard
              device={device}
              onAction={handleAction}
              loadingAction={loadingDevice[device.identifier] ?? null}
            />
          </Grid>
        ))}
      </Grid>

      {/* ── Confirm dialog ── */}
      {confirmState && (
        <ConfirmDialog
          open={confirmState.open}
          message={confirmState.message}
          onConfirm={() => runAction(confirmState.identifier, confirmState.action)}
          onClose={() => setConfirmState(null)}
        />
      )}
    </Box>
  );
}
