'use client';

import * as React from 'react';
import {
  alpha, Box, Button, Chip, CircularProgress, Collapse, Dialog,
  DialogActions, DialogContent, DialogTitle, Divider, Grid, IconButton,
  LinearProgress, Paper, Skeleton, Stack, Tooltip, Typography,
  useMediaQuery, useTheme,
} from '@mui/material';
import {
  BatteryAlert, BatteryChargingFull, BatteryFull, Battery50, Battery20,
  CheckCircle, Close, DeviceHub, ErrorOutline, FiberManualRecord, History,
  LockOpen, MoreHoriz, PhoneAndroid, PowerSettingsNew, Refresh, Router,
  Screenshot, SettingsRemote, SignalCellularAlt, SmartScreen,
  SpeakerNotesOff, SpeakerPhone, SystemUpdate, TouchApp, VolumeUp,
  Wifi, WifiOff,
} from '@mui/icons-material';
import toast from 'react-hot-toast';
import { useKioskDevices, useDeviceAction } from '@/hooks/fetching/kiosk/useKioskDevices';
import { type KioskDevice, type DeviceActionName } from '@/services/kiosk.service';

interface Props { storeId: string; }

/* ─── Types ───────────────────────────────────────────────────────────────── */
interface ActivityEntry {
  id: string;
  action: DeviceActionName;
  label: string;
  timestamp: Date;
  status: 'pending' | 'success' | 'error';
  errorMsg?: string;
}

interface ScreenshotState {
  status: 'idle' | 'capturing' | 'ready';
  url?: string;
}

/* ─── Battery helpers ─────────────────────────────────────────────────────── */
function batteryColor(level: number, charging: boolean) {
  if (charging) return '#4ade80';
  if (level >= 50) return '#4ade80';
  if (level >= 20) return '#fbbf24';
  return '#f87171';
}

function BatteryIcon({ level, charging, size = 15 }: { level: number; charging: boolean; size?: number }) {
  const sx = { fontSize: size };
  if (charging) return <BatteryChargingFull sx={sx} />;
  if (level >= 80) return <BatteryFull sx={sx} />;
  if (level >= 40) return <Battery50 sx={sx} />;
  if (level >= 15) return <Battery20 sx={sx} />;
  return <BatteryAlert sx={sx} />;
}

/* ─── Action definitions ──────────────────────────────────────────────────── */
interface ActionDef {
  label: string;
  icon: React.ReactNode;
  action: DeviceActionName;
  color: string;
  confirm?: string;
  danger?: boolean;
}

const QUICK: ActionDef[] = [
  { label: 'Actualizar',   icon: <Refresh sx={{ fontSize: 13 }} />,        action: 'request-status', color: '#60a5fa' },
  { label: 'Pantalla ON',  icon: <SmartScreen sx={{ fontSize: 13 }} />,    action: 'screen-on',      color: '#4ade80' },
  { label: 'Pantalla OFF', icon: <SpeakerNotesOff sx={{ fontSize: 13 }} />, action: 'screen-off',    color: '#fbbf24' },
  { label: 'Captura',      icon: <Screenshot sx={{ fontSize: 13 }} />,     action: 'screenshot',     color: '#a78bfa' },
  { label: 'Identificar',  icon: <SpeakerPhone sx={{ fontSize: 13 }} />,   action: 'identify',       color: '#38bdf8' },
  { label: 'Localizar',    icon: <VolumeUp sx={{ fontSize: 13 }} />,       action: 'locate-sound',   color: '#38bdf8' },
];

const ADVANCED: ActionDef[] = [
  { label: 'Reiniciar App',  icon: <Refresh sx={{ fontSize: 13 }} />,          action: 'restart-app',    color: '#fbbf24', confirm: '¿Reiniciar la aplicación kiosko?' },
  { label: 'Recargar Home',  icon: <Router sx={{ fontSize: 13 }} />,           action: 'reload-home',    color: '#fbbf24' },
  { label: 'Limpiar Caché',  icon: <LockOpen sx={{ fontSize: 13 }} />,         action: 'clear-cache',    color: '#fbbf24', confirm: '¿Limpiar caché del navegador kiosko?' },
  { label: 'Limpiar Cookies',icon: <LockOpen sx={{ fontSize: 13 }} />,         action: 'clear-cookies',  color: '#fbbf24', confirm: '¿Limpiar cookies?' },
  { label: 'Actualizar',     icon: <SystemUpdate sx={{ fontSize: 13 }} />,     action: 'update-kiosk',   color: '#60a5fa', confirm: '¿Actualizar el kiosko?' },
  { label: 'Limpiar Datos',  icon: <DeviceHub sx={{ fontSize: 13 }} />,        action: 'clear-app-data', color: '#f97316', confirm: '¿Limpiar datos? Esto eliminará la sesión.' },
  { label: 'WiFi Settings',  icon: <Wifi sx={{ fontSize: 13 }} />,             action: 'open-wifi',      color: '#60a5fa' },
  { label: 'Subir Logs',     icon: <SignalCellularAlt sx={{ fontSize: 13 }} />,action: 'upload-logs',    color: '#60a5fa' },
  { label: 'REINICIAR',      icon: <PowerSettingsNew sx={{ fontSize: 13 }} />, action: 'reboot',         color: '#f87171', confirm: '⚠️ ¿Confirmar REINICIO del dispositivo?', danger: true },
];

const ACTION_LABELS: Partial<Record<DeviceActionName, string>> = {
  'request-status': 'Estado solicitado',
  'screen-on':      'Pantalla ON',
  'screen-off':     'Pantalla OFF',
  'screenshot':     'Captura',
  'identify':       'Identificar',
  'locate-sound':   'Localizar',
  'restart-app':    'Reiniciar App',
  'reload-home':    'Recargar Home',
  'clear-cache':    'Limpiar Caché',
  'clear-cookies':  'Limpiar Cookies',
  'update-kiosk':   'Actualizar Kiosk',
  'clear-app-data': 'Limpiar Datos',
  'open-wifi':      'WiFi Settings',
  'upload-logs':    'Subir Logs',
  'reboot':         'REINICIAR',
};

/* ─── Tablet Frame Preview ────────────────────────────────────────────────── */
function TabletFramePreview({
  device,
  screenshot,
  onClearScreenshot,
}: {
  device: KioskDevice;
  screenshot?: ScreenshotState;
  onClearScreenshot?: () => void;
}) {
  const bColor = batteryColor(device.batteryLevel, device.isCharging);
  const [time, setTime] = React.useState(
    new Date().toLocaleTimeString('es-HN', { hour: '2-digit', minute: '2-digit' }),
  );
  const [countdown, setCountdown] = React.useState<number | null>(null);

  React.useEffect(() => {
    const t = setInterval(() => {
      setTime(new Date().toLocaleTimeString('es-HN', { hour: '2-digit', minute: '2-digit' }));
    }, 10000);
    return () => clearInterval(t);
  }, []);

  React.useEffect(() => {
    if (screenshot?.status === 'capturing') {
      setCountdown(12);
      const t = setInterval(() => {
        setCountdown(p => (p !== null && p > 0 ? p - 1 : null));
      }, 1000);
      return () => clearInterval(t);
    } else {
      setCountdown(null);
    }
  }, [screenshot?.status]);

  const isOnlineOn  = device.online && device.screenOn;
  const isOnlineOff = device.online && !device.screenOn;

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
      {/* Tablet body */}
      <Box sx={{
        position: 'relative',
        width: 210,
        height: 300,
        borderRadius: '22px',
        background: 'linear-gradient(155deg, #1a1f2e 0%, #12151f 100%)',
        boxShadow: [
          '0 0 0 1.5px rgba(255,255,255,0.07)',
          '0 0 0 2.5px rgba(0,0,0,0.7)',
          '0 28px 56px rgba(0,0,0,0.55)',
          isOnlineOn ? '0 0 50px rgba(74,222,128,0.06)' : '',
        ].filter(Boolean).join(', '),
        transition: 'box-shadow 0.6s ease',
      }}>
        {/* Camera */}
        <Box sx={{
          position: 'absolute', top: 9, left: '50%',
          transform: 'translateX(-50%)',
          width: 7, height: 7, borderRadius: '50%',
          background: '#0a0c12',
          border: '1px solid rgba(255,255,255,0.05)',
          '&::after': {
            content: '""', position: 'absolute',
            top: 1.5, left: 1.5, width: 3, height: 3,
            borderRadius: '50%', background: 'rgba(96,165,250,0.2)',
          },
        }} />

        {/* Power button */}
        <Box sx={{ position: 'absolute', right: -3, top: 64, width: 3, height: 26, borderRadius: '0 3px 3px 0', background: '#1e2538' }} />
        {/* Vol up */}
        <Box sx={{ position: 'absolute', right: -3, top: 108, width: 3, height: 18, borderRadius: '0 3px 3px 0', background: '#1e2538' }} />
        {/* Vol down */}
        <Box sx={{ position: 'absolute', right: -3, top: 134, width: 3, height: 18, borderRadius: '0 3px 3px 0', background: '#1e2538' }} />

        {/* Screen bezel */}
        <Box sx={{
          position: 'absolute',
          top: 20, left: 10, right: 10, bottom: 14,
          borderRadius: '14px',
          overflow: 'hidden',
          background: '#000',
          boxShadow: 'inset 0 0 14px rgba(0,0,0,0.9)',
        }}>

          {/* ── SCREENSHOT READY ── */}
          {screenshot?.status === 'ready' && screenshot.url ? (
            <Box sx={{ height: '100%', position: 'relative', background: '#000' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={screenshot.url}
                alt="Captura de pantalla"
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
              {onClearScreenshot && (
                <Tooltip title="Cerrar captura">
                  <Box
                    component="button"
                    onClick={onClearScreenshot}
                    sx={{
                      all: 'unset', position: 'absolute', top: 4, right: 4,
                      width: 18, height: 18, borderRadius: '50%',
                      bgcolor: 'rgba(0,0,0,0.65)',
                      border: '1px solid rgba(255,255,255,0.2)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer',
                      color: 'rgba(255,255,255,0.8)',
                      transition: 'background 0.15s',
                      '&:hover': { bgcolor: 'rgba(0,0,0,0.9)' },
                    }}
                  >
                    <Close sx={{ fontSize: 11 }} />
                  </Box>
                </Tooltip>
              )}
              <Box sx={{
                position: 'absolute', bottom: 0, left: 0, right: 0,
                px: 1, py: 0.5,
                background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 100%)',
                display: 'flex', alignItems: 'center', gap: 0.5,
              }}>
                <Screenshot sx={{ fontSize: 9, color: '#a78bfa' }} />
                <Typography sx={{ fontSize: '0.44rem', color: '#a78bfa', fontWeight: 700, letterSpacing: '0.05em' }}>
                  CAPTURA EN VIVO
                </Typography>
              </Box>
            </Box>

          ) : screenshot?.status === 'capturing' ? (
            /* ── CAPTURING ── */
            <Box sx={{
              height: '100%', display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: 1,
              background: 'radial-gradient(ellipse at center, #0d0618 0%, #04020a 100%)',
            }}>
              <Box sx={{
                width: 36, height: 36, borderRadius: '50%',
                background: 'rgba(167,139,250,0.1)',
                border: '1px solid rgba(167,139,250,0.25)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                animation: 'screenshot-pulse 1.5s ease-in-out infinite',
                '@keyframes screenshot-pulse': {
                  '0%, 100%': { boxShadow: '0 0 0 0 rgba(167,139,250,0.3)' },
                  '50%':      { boxShadow: '0 0 0 8px rgba(167,139,250,0)' },
                },
              }}>
                <Screenshot sx={{ fontSize: 18, color: '#a78bfa' }} />
              </Box>
              <Typography sx={{ fontSize: '0.54rem', color: '#a78bfa', fontWeight: 800, letterSpacing: '0.1em' }}>
                CAPTURANDO
              </Typography>
              {countdown !== null && (
                <Typography sx={{ fontSize: '0.7rem', color: 'rgba(167,139,250,0.6)', fontFamily: 'monospace', fontWeight: 700 }}>
                  {countdown}s
                </Typography>
              )}
            </Box>

          ) : (
            <>
          {/* ── ONLINE + SCREEN ON ── */}
          {isOnlineOn && (
            <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'linear-gradient(180deg, #080e1c 0%, #0b1426 60%, #080e1c 100%)' }}>
              {/* Status bar */}
              <Box sx={{ height: 20, px: 1.5, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
                <Typography sx={{ fontSize: '0.52rem', color: 'rgba(255,255,255,0.8)', fontFamily: 'monospace', fontWeight: 700, letterSpacing: '0.04em' }}>
                  {time}
                </Typography>
                <Stack direction="row" spacing={0.35} alignItems="center">
                  {device.wiFiNetwork && device.wiFiNetwork !== '<unknown ssid>'
                    ? <Wifi sx={{ fontSize: 9, color: '#60a5fa' }} />
                    : <WifiOff sx={{ fontSize: 9, color: '#6b7280' }} />
                  }
                  <Box sx={{ color: bColor, display: 'flex', alignItems: 'center' }}>
                    <BatteryIcon level={device.batteryLevel} charging={device.isCharging} size={11} />
                  </Box>
                  <Typography sx={{ fontSize: '0.48rem', color: bColor, fontFamily: 'monospace', fontWeight: 700 }}>
                    {device.batteryLevel}%
                  </Typography>
                </Stack>
              </Box>

              {/* Kiosk content */}
              <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 0.75, px: 1 }}>
                {/* Logo */}
                <Box sx={{
                  width: 42, height: 42, borderRadius: '11px',
                  background: 'linear-gradient(135deg, #4ade80 0%, #22d3ee 50%, #60a5fa 100%)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 0 18px rgba(74,222,128,0.32)',
                  mb: 0.25,
                }}>
                  <SmartScreen sx={{ fontSize: 24, color: '#000' }} />
                </Box>

                <Typography sx={{ fontSize: '0.58rem', fontWeight: 800, color: '#fff', letterSpacing: '0.14em', textAlign: 'center' }}>
                  SWEEPSTOUCH
                </Typography>

                <Typography sx={{ fontSize: '0.46rem', color: 'rgba(255,255,255,0.35)', letterSpacing: '0.05em' }}>
                  Kiosk v{device.kioskVersion || '—'}
                </Typography>

                {/* Touch CTA */}
                <Box sx={{
                  mt: 1, px: 1.5, py: 0.75, borderRadius: '10px',
                  background: 'rgba(74,222,128,0.07)',
                  border: '1px solid rgba(74,222,128,0.2)',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.35,
                }}>
                  <TouchApp sx={{ fontSize: 18, color: '#4ade80' }} />
                  <Typography sx={{ fontSize: '0.46rem', color: '#4ade80', fontWeight: 800, letterSpacing: '0.08em', textAlign: 'center', lineHeight: 1.4 }}>
                    TOCA PARA{'\n'}PARTICIPAR
                  </Typography>
                </Box>

                {/* WiFi label */}
                {device.wiFiNetwork && device.wiFiNetwork !== '<unknown ssid>' && (
                  <Box sx={{
                    mt: 0.5, display: 'flex', alignItems: 'center', gap: 0.35,
                    px: 0.75, py: 0.25, borderRadius: 99,
                    background: 'rgba(96,165,250,0.06)',
                    border: '1px solid rgba(96,165,250,0.12)',
                    maxWidth: '90%', overflow: 'hidden',
                  }}>
                    <Wifi sx={{ fontSize: 8, color: '#60a5fa', flexShrink: 0 }} />
                    <Typography noWrap sx={{ fontSize: '0.44rem', color: '#60a5fa', maxWidth: 72 }}>
                      {device.wiFiNetwork}
                    </Typography>
                  </Box>
                )}
              </Box>
            </Box>
          )}

          {/* ── ONLINE + SCREEN OFF ── */}
          {isOnlineOff && (
            <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1, background: '#000' }}>
              <Box sx={{
                width: 30, height: 30, borderRadius: '50%',
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.04)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <PowerSettingsNew sx={{ fontSize: 15, color: 'rgba(255,255,255,0.08)' }} />
              </Box>
              <Typography sx={{ fontSize: '0.52rem', color: 'rgba(255,255,255,0.1)', fontWeight: 600, letterSpacing: '0.06em' }}>
                PANTALLA APAGADA
              </Typography>
              <Stack direction="row" alignItems="center" gap={0.35}>
                <Box sx={{ color: bColor, display: 'flex', alignItems: 'center' }}>
                  <BatteryIcon level={device.batteryLevel} charging={device.isCharging} size={11} />
                </Box>
                <Typography sx={{ fontSize: '0.48rem', color: bColor, fontFamily: 'monospace' }}>
                  {device.batteryLevel}%
                </Typography>
              </Stack>
            </Box>
          )}

          {/* ── OFFLINE ── */}
          {!device.online && (
            <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1.25, background: 'linear-gradient(180deg, #06060c 0%, #040408 100%)' }}>
              <WifiOff sx={{ fontSize: 26, color: 'rgba(255,255,255,0.07)' }} />
              <Box sx={{ textAlign: 'center' }}>
                <Typography sx={{ fontSize: '0.54rem', color: 'rgba(255,255,255,0.12)', fontWeight: 800, letterSpacing: '0.1em' }}>
                  OFFLINE
                </Typography>
                {device.lastSeen && (
                  <Typography sx={{ fontSize: '0.44rem', color: 'rgba(255,255,255,0.07)', mt: 0.5 }}>
                    {new Date(device.lastSeen).toLocaleString('es-HN', { dateStyle: 'short', timeStyle: 'short' })}
                  </Typography>
                )}
              </Box>
            </Box>
          )}
          </>
          )}
        </Box>

        {/* Online glow bar */}
        {device.online && (
          <Box sx={{
            position: 'absolute', bottom: 5, left: '50%', transform: 'translateX(-50%)',
            width: 24, height: 3, borderRadius: 99,
            background: '#4ade80',
            boxShadow: '0 0 8px #4ade80',
            animation: 'glow-pulse 2s ease-in-out infinite',
            '@keyframes glow-pulse': {
              '0%, 100%': { opacity: 1, boxShadow: '0 0 8px #4ade80' },
              '50%':       { opacity: 0.5, boxShadow: '0 0 4px #4ade80' },
            },
          }} />
        )}
      </Box>
    </Box>
  );
}

/* ─── Device Stats Grid ───────────────────────────────────────────────────── */
function DeviceStatsGrid({ device }: { device: KioskDevice }) {
  const bColor = batteryColor(device.batteryLevel, device.isCharging);
  const hasWifi = !!(device.wiFiNetwork && device.wiFiNetwork !== '<unknown ssid>');

  const stats = [
    {
      icon: <Box sx={{ color: bColor, display: 'flex' }}><BatteryIcon level={device.batteryLevel} charging={device.isCharging} size={14} /></Box>,
      label: 'Batería',
      value: `${device.batteryLevel}%${device.isCharging ? ' ⚡' : ''}`,
      color: bColor,
    },
    {
      icon: <SmartScreen sx={{ fontSize: 14, color: device.screenOn ? '#60a5fa' : '#4b5563' }} />,
      label: 'Pantalla',
      value: device.screenOn ? 'Encendida' : 'Apagada',
      color: device.screenOn ? '#60a5fa' : '#4b5563',
    },
    {
      icon: hasWifi ? <Wifi sx={{ fontSize: 14, color: '#22d3ee' }} /> : <WifiOff sx={{ fontSize: 14, color: '#4b5563' }} />,
      label: 'WiFi',
      value: hasWifi ? device.wiFiNetwork! : 'Sin WiFi',
      color: hasWifi ? '#22d3ee' : '#4b5563',
    },
    {
      icon: <SmartScreen sx={{ fontSize: 14, color: '#a78bfa' }} />,
      label: 'Kiosk',
      value: `v${device.kioskVersion || '—'}`,
      color: '#a78bfa',
    },
    {
      icon: <PhoneAndroid sx={{ fontSize: 14, color: '#38bdf8' }} />,
      label: 'Android',
      value: device.androidVersion || '—',
      color: '#38bdf8',
    },
    {
      icon: <FiberManualRecord sx={{ fontSize: 9, color: '#64748b' }} />,
      label: 'Serial',
      value: device.serial || (device.imei ? String(device.imei).slice(0, 12) + '…' : '—'),
      color: '#64748b',
    },
  ];

  return (
    <Grid container spacing={1}>
      {stats.map((s, i) => (
        <Grid item xs={6} key={i}>
          <Box sx={{
            p: 1.25, borderRadius: 2,
            border: '1px solid rgba(255,255,255,0.05)',
            background: 'rgba(255,255,255,0.02)',
          }}>
            <Stack direction="row" alignItems="center" spacing={0.5} mb={0.35}>
              {s.icon}
              <Typography sx={{ fontSize: '0.58rem', color: '#4b5563', fontWeight: 700, letterSpacing: '0.06em' }}>
                {s.label.toUpperCase()}
              </Typography>
            </Stack>
            <Typography noWrap sx={{ fontSize: '0.73rem', fontWeight: 700, color: s.color }}>
              {s.value}
            </Typography>
          </Box>
        </Grid>
      ))}
    </Grid>
  );
}

/* ─── Action Pill ─────────────────────────────────────────────────────────── */
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
          px: 1.5, py: 0.65, borderRadius: 2, cursor: 'pointer',
          border: `1px solid ${alpha(def.color, 0.2)}`,
          bgcolor: alpha(def.color, 0.06),
          color: def.color,
          fontSize: '0.7rem', fontWeight: 700, whiteSpace: 'nowrap',
          transition: 'all 0.15s ease',
          '&:hover:not(:disabled)': {
            bgcolor: alpha(def.color, 0.14),
            borderColor: alpha(def.color, 0.5),
            transform: 'translateY(-1px)',
            boxShadow: `0 4px 14px ${alpha(def.color, 0.2)}`,
          },
          '&:active:not(:disabled)': { transform: 'translateY(0)', boxShadow: 'none' },
          '&:disabled': { opacity: 0.3, cursor: 'not-allowed' },
        }}
      >
        {loading ? <CircularProgress size={11} sx={{ color: def.color }} /> : def.icon}
        {def.label}
      </Box>
    </Tooltip>
  );
}

/* ─── Section Header button (collapsible) ─────────────────────────────────── */
function SectionToggle({ label, icon, open, onToggle, badge }: {
  label: string; icon: React.ReactNode;
  open: boolean; onToggle: () => void;
  badge?: number;
}) {
  return (
    <Box
      component="button"
      onClick={onToggle}
      sx={{
        all: 'unset', width: '100%', boxSizing: 'border-box',
        display: 'flex', alignItems: 'center', gap: 1,
        px: 1.75, py: 1.25, cursor: 'pointer',
        background: 'rgba(255,255,255,0.02)',
        transition: 'background 0.15s',
        '&:hover': { background: 'rgba(255,255,255,0.04)' },
      }}
    >
      <Box sx={{ color: '#475569', display: 'flex', alignItems: 'center' }}>{icon}</Box>
      <Typography sx={{ fontSize: '0.62rem', fontWeight: 700, color: '#475569', letterSpacing: '0.08em', flex: 1 }}>
        {label}
      </Typography>
      {badge !== undefined && badge > 0 && (
        <Chip label={badge} size="small" sx={{
          height: 16, fontSize: '0.58rem', fontWeight: 700,
          bgcolor: alpha('#60a5fa', 0.12), color: '#60a5fa',
          '& .MuiChip-label': { px: 0.65 },
        }} />
      )}
      <MoreHoriz sx={{
        fontSize: 15, color: '#334155',
        transform: open ? 'rotate(90deg)' : 'none',
        transition: 'transform 0.2s ease',
      }} />
    </Box>
  );
}

/* ─── Activity Log ────────────────────────────────────────────────────────── */
function ActivityLogPanel({ entries }: { entries: ActivityEntry[] }) {
  if (entries.length === 0) {
    return (
      <Box sx={{ py: 2.5, textAlign: 'center' }}>
        <History sx={{ fontSize: 20, color: '#1e293b', mb: 0.5 }} />
        <Typography sx={{ fontSize: '0.7rem', color: '#334155' }}>
          Sin acciones recientes
        </Typography>
      </Box>
    );
  }

  return (
    <Stack spacing={0.5} sx={{ maxHeight: 200, overflowY: 'auto' }}>
      {entries.map((e) => (
        <Box key={e.id} sx={{
          display: 'flex', alignItems: 'center', gap: 1,
          px: 1.25, py: 0.75, borderRadius: 1.5,
          background: 'rgba(255,255,255,0.015)',
          border: '1px solid rgba(255,255,255,0.04)',
          transition: 'background 0.1s',
        }}>
          {e.status === 'pending' && <CircularProgress size={12} sx={{ color: '#60a5fa', flexShrink: 0 }} />}
          {e.status === 'success' && <CheckCircle sx={{ fontSize: 14, color: '#4ade80', flexShrink: 0 }} />}
          {e.status === 'error'   && <ErrorOutline sx={{ fontSize: 14, color: '#f87171', flexShrink: 0 }} />}

          <Box flex={1} minWidth={0}>
            <Typography noWrap sx={{ fontSize: '0.68rem', fontWeight: 600, color: '#94a3b8' }}>
              {e.label}
            </Typography>
            {e.errorMsg && (
              <Typography sx={{ fontSize: '0.58rem', color: '#f87171' }}>{e.errorMsg}</Typography>
            )}
          </Box>

          <Typography sx={{ fontSize: '0.58rem', color: '#334155', flexShrink: 0, fontFamily: 'monospace' }}>
            {e.timestamp.toLocaleTimeString('es-HN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </Typography>
        </Box>
      ))}
    </Stack>
  );
}

/* ─── Device List Item ────────────────────────────────────────────────────── */
function DeviceListItem({ device, selected, onClick }: {
  device: KioskDevice; selected: boolean; onClick: () => void;
}) {
  const bColor = batteryColor(device.batteryLevel, device.isCharging);
  const accentColor = device.online ? '#4ade80' : '#334155';

  return (
    <Box
      component="button"
      onClick={onClick}
      sx={{
        all: 'unset', display: 'flex', flexDirection: 'column',
        width: '100%', boxSizing: 'border-box',
        cursor: 'pointer', px: 1.5, py: 1.25, borderRadius: 2,
        border: `1px solid ${selected ? alpha(accentColor, 0.4) : 'rgba(255,255,255,0.04)'}`,
        background: selected ? alpha(accentColor, 0.06) : 'transparent',
        transition: 'all 0.15s ease',
        '&:hover': { background: alpha(accentColor, 0.04), borderColor: alpha(accentColor, 0.2) },
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1}>
        <Box sx={{ position: 'relative', flexShrink: 0 }}>
          <PhoneAndroid sx={{ fontSize: 17, color: device.online ? '#4ade80' : '#1e293b' }} />
          <Box sx={{
            position: 'absolute', bottom: -1, right: -2,
            width: 7, height: 7, borderRadius: '50%',
            bgcolor: device.online ? '#4ade80' : '#1e293b',
            border: '1.5px solid rgba(0,0,0,0.6)',
            ...(device.online && {
              animation: 'pulse-dot 2.5s ease-in-out infinite',
              '@keyframes pulse-dot': {
                '0%, 100%': { boxShadow: `0 0 0 0 ${alpha('#4ade80', 0.45)}` },
                '60%':      { boxShadow: `0 0 0 4px ${alpha('#4ade80', 0)}` },
              },
            }),
          }} />
        </Box>

        <Box flex={1} minWidth={0}>
          <Typography noWrap sx={{
            fontSize: '0.73rem', fontWeight: 700,
            color: selected ? (device.online ? '#4ade80' : '#64748b') : '#94a3b8',
          }}>
            {device.name || 'Sin nombre'}
          </Typography>
          <Typography noWrap sx={{ fontSize: '0.6rem', color: '#1e293b' }}>
            {device.model || device.brand || device.identifier.slice(0, 10)}
          </Typography>
        </Box>
      </Stack>

      {device.online && (
        <Stack direction="row" alignItems="center" spacing={1} mt={0.5}>
          <Stack direction="row" alignItems="center" spacing={0.3}>
            <Box sx={{ color: bColor, display: 'flex', alignItems: 'center' }}>
              <BatteryIcon level={device.batteryLevel} charging={device.isCharging} size={11} />
            </Box>
            <Typography sx={{ fontSize: '0.58rem', color: bColor, fontWeight: 700 }}>
              {device.batteryLevel}%
            </Typography>
          </Stack>
          <Typography sx={{
            fontSize: '0.58rem', fontWeight: 700,
            color: device.screenOn ? '#60a5fa' : '#1e293b',
          }}>
            {device.screenOn ? 'ON' : 'OFF'}
          </Typography>
        </Stack>
      )}

      {!device.online && device.lastSeen && (
        <Typography sx={{ fontSize: '0.56rem', color: '#1e293b', mt: 0.35 }}>
          {new Date(device.lastSeen).toLocaleString('es-HN', { dateStyle: 'short', timeStyle: 'short' })}
        </Typography>
      )}
    </Box>
  );
}

/* ─── Confirm Dialog ──────────────────────────────────────────────────────── */
function ConfirmDialog({ open, message, onConfirm, onClose }: {
  open: boolean; message: string; onConfirm: () => void; onClose: () => void;
}) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth
      PaperProps={{ sx: { borderRadius: 3, border: `1px solid ${alpha('#f87171', 0.25)}`, bgcolor: '#0f172a' } }}>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <PowerSettingsNew sx={{ color: 'error.main', fontSize: 18 }} />
          <Typography fontWeight={700} fontSize="0.9rem">Confirmar acción</Typography>
        </Stack>
        <IconButton size="small" onClick={onClose}><Close fontSize="small" /></IconButton>
      </DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary">{message}</Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} size="small" variant="outlined" sx={{ borderRadius: 2 }}>Cancelar</Button>
        <Button onClick={() => { onConfirm(); onClose(); }} variant="contained" color="error" size="small" sx={{ borderRadius: 2 }}>
          Confirmar
        </Button>
      </DialogActions>
    </Dialog>
  );
}

/* ─── Device Detail View ──────────────────────────────────────────────────── */
function DeviceDetailView({ device, onAction, loadingAction, activityLog, screenshot, onClearScreenshot }: {
  device: KioskDevice;
  onAction: (id: string, action: DeviceActionName, confirm?: string) => void;
  loadingAction: DeviceActionName | null;
  activityLog: ActivityEntry[];
  screenshot?: ScreenshotState;
  onClearScreenshot?: () => void;
}) {
  const [showAdvanced, setShowAdvanced] = React.useState(false);
  const [showLog, setShowLog] = React.useState(true);
  const bColor = batteryColor(device.batteryLevel, device.isCharging);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>

      {/* Device header */}
      <Box sx={{
        p: 2, borderRadius: 2.5,
        border: '1px solid rgba(255,255,255,0.05)',
        background: 'rgba(255,255,255,0.02)',
        backgroundImage: device.online
          ? `radial-gradient(ellipse at top right, ${alpha('#4ade80', 0.04)} 0%, transparent 60%)`
          : 'none',
      }}>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Box sx={{
            width: 44, height: 44, borderRadius: 2, flexShrink: 0,
            background: device.online
              ? `linear-gradient(135deg, ${alpha('#4ade80', 0.18)}, ${alpha('#22d3ee', 0.1)})`
              : alpha('#334155', 0.3),
            border: `1.5px solid ${device.online ? alpha('#4ade80', 0.3) : 'rgba(51,65,85,0.5)'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: device.online ? '#4ade80' : '#334155',
          }}>
            <PhoneAndroid sx={{ fontSize: 24 }} />
          </Box>
          <Box flex={1} minWidth={0}>
            <Typography variant="subtitle1" fontWeight={800} noWrap sx={{ letterSpacing: '-0.02em', color: '#e2e8f0' }}>
              {device.name || 'Sin nombre'}
            </Typography>
            <Typography noWrap sx={{ fontSize: '0.72rem', color: '#475569' }}>
              {[device.model, device.brand].filter(Boolean).join(' · ')}
            </Typography>
          </Box>
          <Chip
            label={device.online ? '● Online' : '○ Offline'}
            size="small"
            sx={{
              height: 24, fontSize: '0.68rem', fontWeight: 700, flexShrink: 0,
              bgcolor: device.online ? alpha('#4ade80', 0.1) : alpha('#334155', 0.4),
              color: device.online ? '#4ade80' : '#475569',
              border: `1px solid ${device.online ? alpha('#4ade80', 0.3) : 'rgba(51,65,85,0.5)'}`,
            }}
          />
        </Stack>
      </Box>

      {/* Tablet preview + stats two-column */}
      <Grid container spacing={2} alignItems="flex-start">
        <Grid item xs={12} sm={5}>
          <Box sx={{
            borderRadius: 2.5,
            border: '1px solid rgba(255,255,255,0.04)',
            background: 'radial-gradient(ellipse at center, rgba(15,23,42,0.8) 0%, rgba(8,12,24,0.95) 100%)',
          }}>
            <TabletFramePreview device={device} screenshot={screenshot} onClearScreenshot={onClearScreenshot} />
          </Box>
        </Grid>

        <Grid item xs={12} sm={7}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, pt: { xs: 0, sm: 0.5 } }}>
            {/* Stats */}
            <Box sx={{ p: 1.75, borderRadius: 2.5, border: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.02)' }}>
              <Typography sx={{ fontSize: '0.6rem', fontWeight: 700, color: '#334155', letterSpacing: '0.08em', mb: 1.25 }}>
                ESTADO DEL DISPOSITIVO
              </Typography>
              <DeviceStatsGrid device={device} />
            </Box>

            {/* Battery bar */}
            <Box sx={{ p: 1.75, borderRadius: 2.5, border: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.02)' }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                <Stack direction="row" alignItems="center" spacing={0.5}>
                  <Box sx={{ color: bColor, display: 'flex', alignItems: 'center' }}>
                    <BatteryIcon level={device.batteryLevel} charging={device.isCharging} size={13} />
                  </Box>
                  <Typography sx={{ fontSize: '0.62rem', color: '#334155', fontWeight: 600 }}>
                    Nivel de batería{device.isCharging ? ' — Cargando' : ''}
                  </Typography>
                </Stack>
                <Typography sx={{ fontSize: '0.72rem', color: bColor, fontWeight: 800, fontFamily: 'monospace' }}>
                  {device.batteryLevel}%
                </Typography>
              </Stack>
              <LinearProgress
                variant="determinate"
                value={device.batteryLevel}
                sx={{
                  height: 7, borderRadius: 4,
                  bgcolor: alpha(bColor, 0.1),
                  '& .MuiLinearProgress-bar': {
                    bgcolor: bColor, borderRadius: 4,
                    transition: 'width 1.2s cubic-bezier(0.4,0,0.2,1)',
                    boxShadow: `0 0 8px ${alpha(bColor, 0.35)}`,
                  },
                }}
              />
            </Box>
          </Box>
        </Grid>
      </Grid>

      {/* Quick Actions */}
      <Box sx={{ borderRadius: 2.5, border: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden' }}>
        <Box sx={{ px: 1.75, pt: 1.5, pb: 1.25, background: 'rgba(255,255,255,0.02)' }}>
          <Typography sx={{ fontSize: '0.6rem', fontWeight: 700, color: '#334155', letterSpacing: '0.08em', mb: 1.25 }}>
            ACCIONES RÁPIDAS
          </Typography>
          <Stack direction="row" flexWrap="wrap" gap={0.75}>
            {QUICK.map((a) => (
              <ActionPill
                key={a.action} def={a}
                loading={loadingAction === a.action}
                disabled={loadingAction !== null}
                onClick={() => onAction(device.identifier, a.action, a.confirm)}
              />
            ))}
          </Stack>
        </Box>
      </Box>

      {/* Advanced Actions */}
      <Box sx={{ borderRadius: 2.5, border: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden' }}>
        <SectionToggle
          label="ACCIONES AVANZADAS"
          icon={<SettingsRemote sx={{ fontSize: 14 }} />}
          open={showAdvanced}
          onToggle={() => setShowAdvanced(p => !p)}
        />
        <Collapse in={showAdvanced}>
          <Box sx={{ px: 1.75, pb: 1.5, pt: 1.25, background: 'rgba(0,0,0,0.2)', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
            <Stack direction="row" flexWrap="wrap" gap={0.75}>
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
      </Box>

      {/* Activity Log */}
      <Box sx={{ borderRadius: 2.5, border: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden' }}>
        <SectionToggle
          label="REGISTRO DE ACCIONES"
          icon={<History sx={{ fontSize: 14 }} />}
          open={showLog}
          onToggle={() => setShowLog(p => !p)}
          badge={activityLog.length}
        />
        <Collapse in={showLog}>
          <Box sx={{ px: 1.5, pb: 1.5, pt: 1, background: 'rgba(0,0,0,0.2)', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
            <ActivityLogPanel entries={activityLog} />
          </Box>
        </Collapse>
      </Box>
    </Box>
  );
}

/* ─── Main Panel ──────────────────────────────────────────────────────────── */
export function KioskTabletPanel({ storeId }: Props) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const { data: devices, isLoading, error, refetch, isFetching } = useKioskDevices(storeId);
  const actionMutation = useDeviceAction(storeId);

  const [selectedId,    setSelectedId]    = React.useState<string | null>(null);
  const [filter,        setFilter]        = React.useState<'all' | 'online' | 'offline'>('all');
  const [loadingDevice, setLoadingDevice] = React.useState<Record<string, DeviceActionName | null>>({});
  const [activityLog,   setActivityLog]   = React.useState<Record<string, ActivityEntry[]>>({});
  const [screenshots,   setScreenshots]   = React.useState<Record<string, ScreenshotState>>({});
  const [confirmState, setConfirmState] = React.useState<{
    open: boolean; identifier: string; action: DeviceActionName; message: string;
  } | null>(null);

  // Auto-select first device
  React.useEffect(() => {
    if (devices && devices.length > 0 && !selectedId) {
      setSelectedId(devices[0].identifier);
    }
  }, [devices, selectedId]);

  const filteredDevices = React.useMemo(() => {
    if (!devices) return [];
    if (filter === 'online')  return devices.filter(d => d.online);
    if (filter === 'offline') return devices.filter(d => !d.online);
    return devices;
  }, [devices, filter]);

  const selectedDevice = devices?.find(d => d.identifier === selectedId) ?? null;
  const online  = (devices ?? []).filter(d => d.online).length;
  const offline = (devices ?? []).filter(d => !d.online).length;

  const runAction = React.useCallback((identifier: string, action: DeviceActionName) => {
    const entryId = `${Date.now()}-${Math.random()}`;
    const entry: ActivityEntry = {
      id: entryId, action,
      label: ACTION_LABELS[action] ?? action,
      timestamp: new Date(),
      status: 'pending',
    };

    setActivityLog(prev => ({
      ...prev,
      [identifier]: [entry, ...(prev[identifier] ?? [])].slice(0, 25),
    }));
    setLoadingDevice(p => ({ ...p, [identifier]: action }));

    actionMutation.mutate({ action, identifier }, {
      onSuccess: (response) => {
        toast.success(`${ACTION_LABELS[action] ?? action} enviado ✓`);
        setLoadingDevice(p => ({ ...p, [identifier]: null }));
        setActivityLog(prev => ({
          ...prev,
          [identifier]: (prev[identifier] ?? []).map(e =>
            e.id === entryId ? { ...e, status: 'success' } : e,
          ),
        }));

        // Screenshot: capture the ImageURL and display after ~12s upload delay
        if (action === 'screenshot') {
          const imageUrl: string | undefined =
            (response as any)?.data?.ImageURL ??
            (response as any)?.data?.imageUrl ??
            (response as any)?.ImageURL;
          if (imageUrl) {
            setScreenshots(prev => ({ ...prev, [identifier]: { status: 'capturing', url: imageUrl } }));
            setTimeout(() => {
              setScreenshots(prev => ({ ...prev, [identifier]: { status: 'ready', url: imageUrl } }));
            }, 12000);
          }
        }
      },
      onError: (err: any) => {
        const msg = err?.response?.data?.error ?? err?.message ?? 'Error';
        toast.error(msg);
        setLoadingDevice(p => ({ ...p, [identifier]: null }));
        setActivityLog(prev => ({
          ...prev,
          [identifier]: (prev[identifier] ?? []).map(e =>
            e.id === entryId ? { ...e, status: 'error', errorMsg: msg } : e,
          ),
        }));
      },
    });
  }, [actionMutation]);

  const handleAction = React.useCallback((identifier: string, action: DeviceActionName, confirmMsg?: string) => {
    if (confirmMsg) { setConfirmState({ open: true, identifier, action, message: confirmMsg }); return; }
    runAction(identifier, action);
  }, [runAction]);

  /* ── Loading ── */
  if (isLoading) {
    return (
      <Box>
        <Stack direction="row" spacing={1.5} mb={3} alignItems="center">
          <Skeleton variant="circular" width={40} height={40} />
          <Box><Skeleton variant="text" width={180} height={22} /><Skeleton variant="text" width={120} height={16} /></Box>
        </Stack>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Box sx={{ width: 240, flexShrink: 0 }}>
            {[1,2,3].map(i => <Skeleton key={i} variant="rectangular" height={70} sx={{ borderRadius: 2, mb: 1 }} />)}
          </Box>
          <Skeleton variant="rectangular" sx={{ flex: 1, borderRadius: 3 }} height={480} />
        </Box>
      </Box>
    );
  }

  /* ── Error ── */
  if (error) {
    const errMsg = (error as any)?.response?.data?.error ?? (error as Error)?.message ?? 'Error desconocido';
    return (
      <Paper variant="outlined" sx={{ p: 4, borderRadius: 3, textAlign: 'center', borderColor: alpha(theme.palette.error.main, 0.25) }}>
        <SettingsRemote sx={{ fontSize: 40, color: 'error.main', mb: 1.5 }} />
        <Typography variant="h6" color="error" fontWeight={700} gutterBottom>Sin conexión al Kiosk Manager</Typography>
        <Typography variant="body2" color="text.secondary" mb={2.5}>{errMsg}</Typography>
        <Button variant="outlined" color="error" size="small" onClick={() => refetch()} startIcon={<Refresh />} sx={{ borderRadius: 2 }}>
          Reintentar
        </Button>
      </Paper>
    );
  }

  /* ── Empty ── */
  if (!devices || devices.length === 0) {
    return (
      <Paper variant="outlined" sx={{ p: 5, borderRadius: 3, textAlign: 'center', border: `1px dashed ${alpha(theme.palette.primary.main, 0.2)}` }}>
        <PhoneAndroid sx={{ fontSize: 48, color: alpha(theme.palette.primary.main, 0.25), mb: 1.5 }} />
        <Typography variant="h6" fontWeight={700} gutterBottom>Sin tablets registradas</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 380, mx: 'auto' }}>
          No se encontraron dispositivos kiosko vinculados a esta tienda.
        </Typography>
      </Paper>
    );
  }

  return (
    <Box>
      {/* ── Header ── */}
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2.5} flexWrap="wrap" gap={1.5}>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Box sx={{
            width: 40, height: 40, borderRadius: 2,
            background: 'linear-gradient(135deg, rgba(74,222,128,0.15), rgba(34,211,238,0.08))',
            border: `1px solid ${alpha('#4ade80', 0.22)}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: `0 0 16px ${alpha('#4ade80', 0.08)}`,
          }}>
            <SettingsRemote sx={{ fontSize: 22, color: '#4ade80' }} />
          </Box>
          <Box>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Typography variant="subtitle1" fontWeight={800} sx={{ letterSpacing: '-0.02em', color: '#e2e8f0' }}>
                Kiosk Manager Pro
              </Typography>
              {isFetching && <CircularProgress size={12} sx={{ color: '#60a5fa' }} />}
            </Stack>
            <Typography sx={{ fontSize: '0.7rem', color: '#334155' }}>
              Gestión remota · Control en tiempo real
            </Typography>
          </Box>
        </Stack>

        <Stack direction="row" alignItems="center" spacing={1}>
          <Chip
            icon={<FiberManualRecord sx={{ fontSize: '8px !important', color: '#4ade80 !important' }} />}
            label={`${online} online`} size="small"
            sx={{ fontWeight: 700, fontSize: '0.68rem', height: 24, bgcolor: alpha('#4ade80', 0.08), color: '#4ade80', border: `1px solid ${alpha('#4ade80', 0.18)}` }}
          />
          <Chip
            icon={<FiberManualRecord sx={{ fontSize: '8px !important', color: '#334155 !important' }} />}
            label={`${offline} offline`} size="small"
            sx={{ fontWeight: 700, fontSize: '0.68rem', height: 24, bgcolor: 'rgba(51,65,85,0.25)', color: '#475569', border: '1px solid rgba(51,65,85,0.4)' }}
          />
          <Tooltip title="Actualizar dispositivos">
            <span style={{ display: 'inline-flex' }}>
              <IconButton size="small" onClick={() => refetch()} disabled={isFetching}
                sx={{ border: '1px solid rgba(255,255,255,0.06)', borderRadius: 1.5, width: 32, height: 32 }}>
                <Refresh sx={{
                  fontSize: 16,
                  animation: isFetching ? 'spin-refresh 1s linear infinite' : 'none',
                  '@keyframes spin-refresh': { '100%': { transform: 'rotate(360deg)' } },
                }} />
              </IconButton>
            </span>
          </Tooltip>
        </Stack>
      </Stack>

      {/* ── Main Layout ── */}
      <Box sx={{ display: 'flex', gap: 2, flexDirection: isMobile ? 'column' : 'row' }}>

        {/* Left: device list */}
        <Box sx={{ width: isMobile ? '100%' : 220, flexShrink: 0 }}>
          {/* Filter */}
          <Box sx={{
            display: 'flex', p: 0.5, mb: 1.25,
            borderRadius: 2, border: '1px solid rgba(255,255,255,0.05)',
            background: 'rgba(255,255,255,0.02)',
          }}>
            {(['all', 'online', 'offline'] as const).map((f) => (
              <Box
                key={f}
                component="button"
                onClick={() => setFilter(f)}
                sx={{
                  all: 'unset', flex: 1, textAlign: 'center',
                  py: 0.45, borderRadius: 1.5,
                  cursor: 'pointer', fontSize: '0.65rem', fontWeight: 700,
                  transition: 'all 0.15s',
                  background: filter === f ? 'rgba(255,255,255,0.07)' : 'transparent',
                  color: filter === f
                    ? f === 'online'  ? '#4ade80'
                    : f === 'offline' ? '#475569'
                    : '#94a3b8'
                    : '#334155',
                  boxShadow: filter === f ? '0 1px 3px rgba(0,0,0,0.3)' : 'none',
                }}
              >
                {f === 'all' ? 'Todos' : f === 'online' ? 'Online' : 'Offline'}
              </Box>
            ))}
          </Box>

          {/* Device list */}
          <Box sx={{
            display: 'flex',
            flexDirection: isMobile ? 'row' : 'column',
            gap: 0.75,
            overflowX: isMobile ? 'auto' : 'visible',
            overflowY: isMobile ? 'hidden' : 'auto',
            maxHeight: isMobile ? 'auto' : 540,
            pb: isMobile ? 1 : 0,
          }}>
            {filteredDevices.map(d => (
              <Box key={d.identifier} sx={{ minWidth: isMobile ? 175 : 'auto', flexShrink: isMobile ? 0 : 1 }}>
                <DeviceListItem
                  device={d}
                  selected={selectedId === d.identifier}
                  onClick={() => setSelectedId(d.identifier)}
                />
              </Box>
            ))}
            {filteredDevices.length === 0 && (
              <Typography sx={{ fontSize: '0.7rem', color: '#334155', py: 3, textAlign: 'center' }}>
                Sin dispositivos
              </Typography>
            )}
          </Box>
        </Box>

        {/* Divider */}
        {!isMobile && (
          <Divider orientation="vertical" flexItem sx={{ borderColor: 'rgba(255,255,255,0.05)' }} />
        )}

        {/* Right: detail */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          {selectedDevice ? (
            <DeviceDetailView
              device={selectedDevice}
              onAction={handleAction}
              loadingAction={loadingDevice[selectedDevice.identifier] ?? null}
              activityLog={activityLog[selectedDevice.identifier] ?? []}
              screenshot={screenshots[selectedDevice.identifier]}
              onClearScreenshot={() =>
                setScreenshots(prev => ({ ...prev, [selectedDevice.identifier]: { status: 'idle' } }))
              }
            />
          ) : (
            <Box sx={{
              height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexDirection: 'column', gap: 1.5, borderRadius: 3,
              border: '1px dashed rgba(255,255,255,0.05)',
              background: 'rgba(255,255,255,0.01)',
            }}>
              <PhoneAndroid sx={{ fontSize: 40, color: '#1e293b' }} />
              <Typography sx={{ fontSize: '0.8rem', color: '#334155' }}>
                Selecciona un dispositivo
              </Typography>
            </Box>
          )}
        </Box>
      </Box>

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
