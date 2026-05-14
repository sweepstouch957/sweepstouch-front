'use client';

import * as React from 'react';
import {
  alpha, Box, Button, Chip, CircularProgress, Collapse, Dialog,
  DialogActions, DialogContent, DialogTitle, Divider, Grid, IconButton,
  LinearProgress, Paper, Skeleton, Stack, Tooltip, Typography, useTheme,
} from '@mui/material';
import {
  BatteryChargingFull, BatteryFull, Battery50, Battery20, BatteryAlert,
  Close, DeviceHub, FiberManualRecord, LockOpen, MoreVert, PhoneAndroid,
  PowerSettingsNew, Refresh, Router, Screenshot, SettingsRemote,
  SignalCellularAlt, SmartScreen, SpeakerNotesOff, SpeakerPhone,
  SystemUpdate, VolumeUp, Wifi, WifiOff, OpenInNew,
} from '@mui/icons-material';
import toast from 'react-hot-toast';
import { useKioskDevices, useDeviceAction } from '@/hooks/fetching/kiosk/useKioskDevices';
import { type KioskDevice, type DeviceActionName } from '@/services/kiosk.service';

interface Props { storeId: string; }

/* ─── Battery ─────────────────────────────────────────────────────────────── */
function batteryColor(level: number, charging: boolean) {
  if (charging) return '#4ade80';
  if (level >= 50) return '#4ade80';
  if (level >= 20) return '#fbbf24';
  return '#f87171';
}
function BatteryIcon({ level, charging }: { level: number; charging: boolean }) {
  if (charging) return <BatteryChargingFull sx={{ fontSize: 15 }} />;
  if (level >= 80) return <BatteryFull sx={{ fontSize: 15 }} />;
  if (level >= 40) return <Battery50 sx={{ fontSize: 15 }} />;
  if (level >= 15) return <Battery20 sx={{ fontSize: 15 }} />;
  return <BatteryAlert sx={{ fontSize: 15 }} />;
}

/* ─── Actions ─────────────────────────────────────────────────────────────── */
interface ActionDef {
  label: string; icon: React.ReactNode; action: DeviceActionName;
  color: string; bgColor: string; confirm?: string; danger?: boolean;
}

const QUICK: ActionDef[] = [
  { label: 'Status',      icon: <Refresh sx={{ fontSize: 14 }} />,       action: 'request-status', color: '#60a5fa', bgColor: alpha('#60a5fa', 0.1) },
  { label: 'Pantalla ON', icon: <SmartScreen sx={{ fontSize: 14 }} />,   action: 'screen-on',      color: '#4ade80', bgColor: alpha('#4ade80', 0.1) },
  { label: 'Pantalla OFF',icon: <SpeakerNotesOff sx={{ fontSize: 14 }} />,action: 'screen-off',    color: '#fbbf24', bgColor: alpha('#fbbf24', 0.1) },
  { label: 'Captura',     icon: <Screenshot sx={{ fontSize: 14 }} />,    action: 'screenshot',     color: '#a78bfa', bgColor: alpha('#a78bfa', 0.1) },
  { label: 'Identificar', icon: <SpeakerPhone sx={{ fontSize: 14 }} />,  action: 'identify',       color: '#38bdf8', bgColor: alpha('#38bdf8', 0.1) },
  { label: 'Localizar',   icon: <VolumeUp sx={{ fontSize: 14 }} />,      action: 'locate-sound',   color: '#38bdf8', bgColor: alpha('#38bdf8', 0.1) },
];

const ADVANCED: ActionDef[] = [
  { label: 'Reiniciar App',  icon: <Refresh sx={{ fontSize: 14 }} />,           action: 'restart-app',   color: '#fbbf24', bgColor: alpha('#fbbf24', 0.1), confirm: '¿Reiniciar la aplicación kiosko?' },
  { label: 'Recargar Home',  icon: <Router sx={{ fontSize: 14 }} />,            action: 'reload-home',   color: '#fbbf24', bgColor: alpha('#fbbf24', 0.1) },
  { label: 'Limpiar Caché',  icon: <LockOpen sx={{ fontSize: 14 }} />,          action: 'clear-cache',   color: '#fbbf24', bgColor: alpha('#fbbf24', 0.1), confirm: '¿Limpiar caché del navegador kiosko?' },
  { label: 'Limpiar Cookies',icon: <LockOpen sx={{ fontSize: 14 }} />,          action: 'clear-cookies', color: '#fbbf24', bgColor: alpha('#fbbf24', 0.1), confirm: '¿Limpiar cookies?' },
  { label: 'Actualizar',     icon: <SystemUpdate sx={{ fontSize: 14 }} />,      action: 'update-kiosk', color: '#60a5fa', bgColor: alpha('#60a5fa', 0.1), confirm: '¿Actualizar el kiosko?' },
  { label: 'Limpiar Datos',  icon: <DeviceHub sx={{ fontSize: 14 }} />,         action: 'clear-app-data',color: '#f97316', bgColor: alpha('#f97316', 0.1), confirm: '¿Limpiar datos? Esto eliminará la sesión.' },
  { label: 'WiFi Settings',  icon: <Wifi sx={{ fontSize: 14 }} />,              action: 'open-wifi',     color: '#60a5fa', bgColor: alpha('#60a5fa', 0.1) },
  { label: 'Subir Logs',     icon: <SignalCellularAlt sx={{ fontSize: 14 }} />, action: 'upload-logs',   color: '#60a5fa', bgColor: alpha('#60a5fa', 0.1) },
  { label: 'REINICIAR',      icon: <PowerSettingsNew sx={{ fontSize: 14 }} />,  action: 'reboot',        color: '#f87171', bgColor: alpha('#f87171', 0.1), confirm: '⚠️ ¿Confirmar REINICIO del dispositivo?', danger: true },
];

/* ─── Action Pill ──────────────────────────────────────────────────────────── */
function ActionPill({ def, loading, disabled, onClick }: {
  def: ActionDef; loading: boolean; disabled: boolean; onClick: () => void;
}) {
  return (
    <Tooltip title={def.label} placement="top">
      <Box
        component="button"
        onClick={onClick}
        disabled={disabled}
        sx={{
          all: 'unset', display: 'inline-flex', alignItems: 'center', gap: 0.5,
          px: 1.25, py: 0.55, borderRadius: 1.5, cursor: 'pointer',
          border: `1px solid ${def.danger ? alpha('#f87171', 0.35) : alpha(def.color, 0.25)}`,
          bgcolor: def.bgColor, color: def.color,
          fontSize: '0.7rem', fontWeight: 600, whiteSpace: 'nowrap',
          transition: 'all 0.15s ease',
          '&:hover:not(:disabled)': {
            bgcolor: alpha(def.color, 0.18),
            borderColor: def.color,
            transform: 'translateY(-1px)',
            boxShadow: `0 4px 12px ${alpha(def.color, 0.25)}`,
          },
          '&:disabled': { opacity: 0.4, cursor: 'not-allowed' },
        }}
      >
        {loading ? <CircularProgress size={11} sx={{ color: def.color }} /> : def.icon}
        {def.label}
      </Box>
    </Tooltip>
  );
}

/* ─── Device Card ──────────────────────────────────────────────────────────── */
function DeviceCard({ device, onAction, loadingAction }: {
  device: KioskDevice;
  onAction: (id: string, action: DeviceActionName, confirm?: string) => void;
  loadingAction: DeviceActionName | null;
}) {
  const theme = useTheme();
  const [expanded, setExpanded] = React.useState(false);
  const isDark = theme.palette.mode === 'dark';
  const online = device.online;
  const pulse = online ? '#4ade80' : '#6b7280';
  const bColor = batteryColor(device.batteryLevel, device.isCharging);
  const lastSeen = device.lastSeen
    ? new Date(device.lastSeen).toLocaleString('es-HN', { dateStyle: 'short', timeStyle: 'short' })
    : '—';

  return (
    <Paper
      variant="outlined"
      sx={{
        borderRadius: 3, overflow: 'hidden', position: 'relative',
        border: `1px solid ${online ? alpha('#4ade80', 0.28) : alpha('#6b7280', 0.2)}`,
        background: isDark
          ? `linear-gradient(160deg, ${alpha('#0f172a', 0.95)} 0%, ${alpha('#1e293b', 0.85)} 100%)`
          : `linear-gradient(160deg, ${alpha('#f8fafc', 1)} 0%, ${alpha('#f1f5f9', 0.8)} 100%)`,
        backdropFilter: 'blur(12px)',
        transition: 'all 0.25s cubic-bezier(.4,0,.2,1)',
        '&:hover': {
          borderColor: online ? alpha('#4ade80', 0.5) : alpha('#6b7280', 0.4),
          boxShadow: `0 12px 40px ${alpha(online ? '#4ade80' : '#6b7280', 0.1)}`,
          transform: 'translateY(-2px)',
        },
      }}
    >
      {/* Top glow bar */}
      <Box sx={{
        height: 3,
        background: online
          ? 'linear-gradient(90deg, #4ade80, #22d3ee, #4ade80)'
          : 'linear-gradient(90deg, #4b5563, #6b7280)',
        backgroundSize: '200% 100%',
        animation: online ? 'shimmer 3s infinite linear' : 'none',
        '@keyframes shimmer': { '0%': { backgroundPosition: '200% 0' }, '100%': { backgroundPosition: '-200% 0' } },
      }} />

      {/* Header */}
      <Box px={2} pt={2} pb={1.25}>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          {/* Device icon with pulse */}
          <Box sx={{ position: 'relative', flexShrink: 0 }}>
            <Box sx={{
              width: 52, height: 52, borderRadius: 2.5,
              background: online
                ? `linear-gradient(135deg, ${alpha('#4ade80', 0.2)}, ${alpha('#22d3ee', 0.15)})`
                : alpha('#6b7280', 0.1),
              border: `1.5px solid ${online ? alpha('#4ade80', 0.3) : alpha('#6b7280', 0.2)}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: online ? '#4ade80' : '#6b7280',
            }}>
              <PhoneAndroid sx={{ fontSize: 28 }} />
            </Box>
            {/* Online pulse dot */}
            <Box sx={{
              position: 'absolute', bottom: 2, right: 2,
              width: 10, height: 10, borderRadius: '50%',
              bgcolor: pulse,
              boxShadow: online ? `0 0 0 2px ${alpha('#4ade80', 0.3)}` : 'none',
              animation: online ? 'pulse-dot 2s infinite' : 'none',
              '@keyframes pulse-dot': {
                '0%, 100%': { boxShadow: `0 0 0 0 ${alpha('#4ade80', 0.4)}` },
                '50%': { boxShadow: `0 0 0 5px ${alpha('#4ade80', 0)}` },
              },
            }} />
          </Box>

          <Box flex={1} minWidth={0}>
            <Typography variant="subtitle2" fontWeight={800} noWrap sx={{ letterSpacing: '-0.01em' }}>
              {device.name || 'Sin nombre'}
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap>
              {device.model} · {device.brand}
            </Typography>
          </Box>

          <Chip
            label={online ? 'Online' : 'Offline'}
            size="small"
            sx={{
              height: 22, fontSize: 10, fontWeight: 700, flexShrink: 0, letterSpacing: '0.04em',
              bgcolor: online ? alpha('#4ade80', 0.12) : alpha('#6b7280', 0.1),
              color: online ? '#4ade80' : '#9ca3af',
              border: `1px solid ${online ? alpha('#4ade80', 0.3) : alpha('#6b7280', 0.2)}`,
            }}
          />
        </Stack>

        {/* Stats row */}
        <Stack direction="row" spacing={1.5} mt={1.75} flexWrap="wrap" useFlexGap>
          <Stack direction="row" alignItems="center" spacing={0.4}>
            <Box sx={{ color: bColor }}><BatteryIcon level={device.batteryLevel} charging={device.isCharging} /></Box>
            <Typography variant="caption" fontWeight={700} sx={{ color: bColor }}>{device.batteryLevel}%</Typography>
          </Stack>

          <Stack direction="row" alignItems="center" spacing={0.4}>
            <SmartScreen sx={{ fontSize: 14, color: device.screenOn ? '#60a5fa' : 'text.disabled' }} />
            <Typography variant="caption" color={device.screenOn ? 'text.primary' : 'text.disabled'} fontWeight={600}>
              {device.screenOn ? 'ENCENDIDA' : 'APAGADA'}
            </Typography>
          </Stack>

          <Stack direction="row" alignItems="center" spacing={0.4}>
            {device.wiFiNetwork && device.wiFiNetwork !== '<unknown ssid>' ? (
              <>
                <Wifi sx={{ fontSize: 14, color: '#60a5fa' }} />
                <Typography variant="caption" noWrap sx={{ maxWidth: 90, color: '#60a5fa' }} fontWeight={600}>
                  {device.wiFiNetwork}
                </Typography>
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
              height: 5, borderRadius: 3,
              bgcolor: alpha(bColor, 0.12),
              '& .MuiLinearProgress-bar': { bgcolor: bColor, borderRadius: 3 },
            }}
          />
        </Box>
      </Box>

      <Divider sx={{ mx: 2, opacity: 0.3 }} />

      {/* Quick actions */}
      <Box px={2} py={1.5}>
        <Stack direction="row" flexWrap="wrap" gap={0.65}>
          {QUICK.map((a) => (
            <ActionPill
              key={a.action} def={a}
              loading={loadingAction === a.action}
              disabled={loadingAction !== null}
              onClick={() => onAction(device.identifier, a.action, a.confirm)}
            />
          ))}
          <Box
            component="button"
            onClick={() => setExpanded(p => !p)}
            sx={{
              all: 'unset', display: 'inline-flex', alignItems: 'center', gap: 0.25,
              px: 1, py: 0.55, borderRadius: 1.5, cursor: 'pointer',
              color: 'text.disabled', fontSize: '0.7rem', fontWeight: 600,
              border: '1px solid transparent',
              '&:hover': { color: 'text.secondary', borderColor: alpha('#fff', 0.08) },
              transition: 'all 0.15s',
            }}
          >
            <MoreVert sx={{ fontSize: 13 }} />
            {expanded ? 'Menos' : 'Más'}
          </Box>
        </Stack>
      </Box>

      {/* Advanced actions */}
      <Collapse in={expanded}>
        <Divider sx={{ mx: 2, opacity: 0.2 }} />
        <Box
          px={2} py={1.5}
          sx={{
            background: isDark
              ? alpha('#0f172a', 0.5)
              : alpha(theme.palette.grey[100], 0.7),
          }}
        >
          <Typography variant="caption" color="text.disabled" fontWeight={700} mb={1} display="block"
            sx={{ letterSpacing: '0.08em', fontSize: '0.65rem' }}>
            ⚡ ACCIONES AVANZADAS
          </Typography>
          <Stack direction="row" flexWrap="wrap" gap={0.65}>
            {ADVANCED.map((a) => (
              <ActionPill
                key={a.action} def={a}
                loading={loadingAction === a.action}
                disabled={loadingAction !== null}
                onClick={() => onAction(device.identifier, a.action, a.confirm)}
              />
            ))}
          </Stack>
        </Box>
      </Collapse>

      {/* Footer */}
      <Divider sx={{ mx: 2, opacity: 0.2 }} />
      <Box px={2} py={1}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={0.5}>
          <Typography variant="caption" sx={{ fontFamily: 'monospace', fontSize: '0.62rem', color: 'text.disabled' }}>
            {device.serial || device.imei || device.identifier.slice(0, 16) + '…'}
          </Typography>
          <Typography variant="caption" sx={{ fontSize: '0.62rem', color: 'text.disabled' }}>
            Visto: {lastSeen}
          </Typography>
        </Stack>
        <Typography variant="caption" sx={{ fontSize: '0.62rem', color: 'text.disabled' }}>
          Android {device.androidVersion} · Kiosk {device.kioskVersion}
        </Typography>
      </Box>
    </Paper>
  );
}

/* ─── Confirm Dialog ───────────────────────────────────────────────────────── */
function ConfirmDialog({ open, message, onConfirm, onClose }: {
  open: boolean; message: string; onConfirm: () => void; onClose: () => void;
}) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth
      PaperProps={{ sx: { borderRadius: 3, border: `1px solid ${alpha('#f87171', 0.3)}` } }}>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <PowerSettingsNew sx={{ color: 'error.main', fontSize: 20 }} />
          <Typography fontWeight={700}>Confirmar acción</Typography>
        </Stack>
        <IconButton size="small" onClick={onClose}><Close fontSize="small" /></IconButton>
      </DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary">{message}</Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} size="small" variant="outlined">Cancelar</Button>
        <Button onClick={() => { onConfirm(); onClose(); }} variant="contained" color="error" size="small">
          Confirmar
        </Button>
      </DialogActions>
    </Dialog>
  );
}

/* ─── Main Panel ───────────────────────────────────────────────────────────── */
export function KioskTabletPanel({ storeId }: Props) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const { data: devices, isLoading, error, refetch, isFetching } = useKioskDevices(storeId);
  const actionMutation = useDeviceAction(storeId);

  const [loadingDevice, setLoadingDevice] = React.useState<Record<string, DeviceActionName | null>>({});
  const [confirmState, setConfirmState] = React.useState<{
    open: boolean; identifier: string; action: DeviceActionName; message: string;
  } | null>(null);

  const handleAction = React.useCallback((identifier: string, action: DeviceActionName, confirmMsg?: string) => {
    if (confirmMsg) { setConfirmState({ open: true, identifier, action, message: confirmMsg }); return; }
    runAction(identifier, action);
  }, []);

  const runAction = React.useCallback((identifier: string, action: DeviceActionName) => {
    setLoadingDevice(p => ({ ...p, [identifier]: action }));
    actionMutation.mutate({ action, identifier }, {
      onSuccess: () => {
        toast.success(`Acción "${action}" enviada ✓`);
        setLoadingDevice(p => ({ ...p, [identifier]: null }));
      },
      onError: (err: any) => {
        toast.error(err?.response?.data?.error ?? err?.message ?? 'Error al enviar la acción');
        setLoadingDevice(p => ({ ...p, [identifier]: null }));
      },
    });
  }, [actionMutation]);

  const online = (devices ?? []).filter(d => d.online).length;
  const offline = (devices ?? []).filter(d => !d.online).length;

  /* Loading */
  if (isLoading) {
    return (
      <Box>
        <Stack direction="row" alignItems="center" spacing={1} mb={3}>
          <Skeleton variant="circular" width={32} height={32} />
          <Skeleton variant="text" width={200} height={28} />
        </Stack>
        <Grid container spacing={2}>
          {[1, 2, 3].map(i => (
            <Grid item xs={12} sm={6} md={4} key={i}>
              <Skeleton variant="rectangular" height={320} sx={{ borderRadius: 3 }} />
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  /* Error */
  if (error) {
    const errMsg = (error as any)?.response?.data?.error ?? (error as Error)?.message ?? 'Error desconocido';
    return (
      <Paper variant="outlined" sx={{
        p: 4, borderRadius: 3, textAlign: 'center',
        borderColor: alpha(theme.palette.error.main, 0.3),
        background: isDark ? alpha('#1c0a0a', 0.5) : alpha('#fff5f5', 0.8),
      }}>
        <Box sx={{
          width: 64, height: 64, borderRadius: '50%', mx: 'auto', mb: 2,
          bgcolor: alpha(theme.palette.error.main, 0.1),
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <SettingsRemote sx={{ fontSize: 32, color: 'error.main' }} />
        </Box>
        <Typography variant="h6" color="error" fontWeight={700} gutterBottom>
          Sin conexión al Kiosk Manager
        </Typography>
        <Typography variant="body2" color="text.secondary" mb={0.5}>{errMsg}</Typography>
        <Typography variant="caption" color="text.disabled" display="block" mb={2.5}>
          Verifica que el slug de la tienda coincida con el tag de los dispositivos.
        </Typography>
        <Button variant="outlined" color="error" size="small" onClick={() => refetch()} startIcon={<Refresh />}>
          Reintentar
        </Button>
      </Paper>
    );
  }

  /* Empty */
  if (!devices || devices.length === 0) {
    return (
      <Paper variant="outlined" sx={{
        p: 5, borderRadius: 3, textAlign: 'center',
        border: `1px dashed ${alpha(theme.palette.primary.main, 0.25)}`,
        background: isDark ? alpha('#0f172a', 0.4) : alpha('#f8faff', 0.8),
      }}>
        <Box sx={{
          width: 72, height: 72, borderRadius: '50%', mx: 'auto', mb: 2,
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.15)}, ${alpha(theme.palette.info.main, 0.1)})`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <PhoneAndroid sx={{ fontSize: 36, color: alpha(theme.palette.primary.main, 0.5) }} />
        </Box>
        <Typography variant="h6" fontWeight={700} gutterBottom>Sin tablets registradas</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 380, mx: 'auto' }}>
          No se encontraron dispositivos kiosko vinculados a esta tienda.
          Asegúrate de que el tag del dispositivo coincida con el slug de la tienda.
        </Typography>
      </Paper>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2.5} flexWrap="wrap" gap={1.5}>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Box sx={{
            width: 38, height: 38, borderRadius: 2,
            background: `linear-gradient(135deg, ${alpha('#4ade80', 0.2)}, ${alpha('#22d3ee', 0.15)})`,
            border: `1px solid ${alpha('#4ade80', 0.25)}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <SettingsRemote sx={{ fontSize: 20, color: '#4ade80' }} />
          </Box>
          <Box>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Typography variant="subtitle1" fontWeight={800} letterSpacing="-0.01em">
                Control de Tablets
              </Typography>
              {isFetching && <CircularProgress size={13} />}
            </Stack>
            <Typography variant="caption" color="text.secondary">
              Gestión remota · Android Kiosk Manager API
            </Typography>
          </Box>
        </Stack>

        <Stack direction="row" alignItems="center" spacing={1}>
          <Chip
            icon={<FiberManualRecord sx={{ fontSize: '9px !important', color: '#4ade80 !important' }} />}
            label={`${online} online`} size="small"
            sx={{ fontWeight: 700, fontSize: 11, height: 24, bgcolor: alpha('#4ade80', 0.1), color: '#4ade80', border: `1px solid ${alpha('#4ade80', 0.25)}` }}
          />
          <Chip
            icon={<FiberManualRecord sx={{ fontSize: '9px !important', color: '#9ca3af !important' }} />}
            label={`${offline} offline`} size="small"
            sx={{ fontWeight: 700, fontSize: 11, height: 24, bgcolor: alpha('#9ca3af', 0.08), color: '#9ca3af', border: `1px solid ${alpha('#9ca3af', 0.2)}` }}
          />
          <Tooltip title="Actualizar estado">
            <IconButton size="small" onClick={() => refetch()} disabled={isFetching}
              sx={{ border: `1px solid ${alpha('#fff', 0.08)}`, borderRadius: 1.5 }}>
              <Refresh sx={{ fontSize: 16, transition: 'transform 0.5s', transform: isFetching ? 'rotate(360deg)' : 'none' }} />
            </IconButton>
          </Tooltip>
        </Stack>
      </Stack>

      {/* Cards grid */}
      <Grid container spacing={2.5}>
        {devices.map(device => (
          <Grid item xs={12} sm={6} md={4} key={device.identifier}>
            <DeviceCard
              device={device}
              onAction={handleAction}
              loadingAction={loadingDevice[device.identifier] ?? null}
            />
          </Grid>
        ))}
      </Grid>

      {/* Confirm dialog */}
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
