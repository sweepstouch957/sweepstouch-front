/**
 * kiosk.service.ts
 * Calls the sweepstouch backend proxy endpoints that wrap the Android Kiosk API.
 * Base path: /store/:storeId/kiosk/*
 *
 * Uses the shared `api` instance from @/libs/axios — same pattern as store.service.ts.
 */

import { api } from '@/libs/axios';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface KioskDevice {
  identifier: string;
  name: string;
  serial: string;
  androidVersion: string;
  brand: string;
  model: string;
  kioskVersion: string;
  kioskPackageName: string;
  build: number;
  buildNumber: string;
  timezone: string;
  provisioned: boolean;
  systemUpdatePending: boolean;
  wiFiNetwork: string;
  macAddress: string;
  imei: string;
  screenOn: boolean;
  defaultLauncher: string;
  simSerial: string;
  simOperator: string;
  permissionsGranted: boolean;
  batteryLevel: number;
  isCharging: boolean;
  lastSeen: string;
  registered: string;
  latitude: number;
  longitude: number;
  tags: string | null;
  online: boolean;
  applicationScreenshot: string;
}

export interface KioskConfiguration {
  configurationID: number;
  name: string;
  lastModified: string;
  revision: number;
  kioskType: number; // 1 = Kiosk Launcher, 2 = Kiosk Browser
}

export interface KioskFileset {
  fileSetID: number;
  name: string;
  lastModified: string;
  awaitingDeployment: boolean;
  assignments: number;
}

export interface PushResult {
  success: boolean;
  message: string;
}

/** Push type codes from the Kiosk API docs */
export const PUSH_TYPES = {
  REQUEST_STATUS:    1,
  RESTART_APP:       2,
  SCREENSHOT:        3,
  OPEN_WIFI:         4,
  IDENTIFY:          5,
  DOWNLOAD_CONFIG:   6,
  SCREEN_OFF:        7,
  SCREEN_ON:         8,
  OPEN_SETTINGS:     9,
  TEAMVIEWER:        10,
  DATE_TIME:         12,
  LOCATE_SOUND:      14,
  UPLOAD_LOGS:       15,
  CLEAR_APP_DATA:    16,
  RELOAD_HOME:       17,
  CLEAR_CACHE:       18,
  CLEAR_COOKIES:     19,
  CLEAR_FORMS:       20,
  CLEAR_ALL_WEB:     21,
  CLEAR_WEBSTORAGE:  22,
  EXEC_JS:           23,
  REBOOT:            201,
  UPDATE_KIOSK:      202,
  UPDATE_BETA:       203,
  SET_DEFAULT:       204,
} as const;

export type PushType = (typeof PUSH_TYPES)[keyof typeof PUSH_TYPES];

/**
 * Named action slugs — map to the /store/:storeId/kiosk/actions/:action endpoint.
 * Preferred over raw push types for all UI-triggered actions.
 */
export type DeviceActionName =
  | 'request-status'
  | 'restart-app'
  | 'screenshot'
  | 'identify'
  | 'screen-off'
  | 'screen-on'
  | 'open-settings'
  | 'locate-sound'
  | 'clear-app-data'
  | 'reload-home'
  | 'clear-cache'
  | 'clear-cookies'
  | 'clear-form-data'
  | 'upload-logs'
  | 'open-wifi'
  | 'reboot'
  | 'update-kiosk';

// ─── Device API ───────────────────────────────────────────────────────────────

/**
 * Get all devices linked to this store (filtered by store slug tag on the backend).
 * Optional: pass { identifier } to fetch a single device by its UUID.
 */
export async function getKioskDevices(
  storeId: string,
  params?: { identifier?: string },
): Promise<KioskDevice[]> {
  const res = await api.get(`/store/${storeId}/kiosk/devices`, { params });
  const result = res.data?.data ?? res.data;
  return Array.isArray(result) ? result : result ? [result] : [];
}

/** Update a device (name, configurationid, etc.) */
export async function patchKioskDevice(
  storeId: string,
  identifier: string,
  payload: Partial<Pick<KioskDevice, 'name'> & { configurationid: number }>,
): Promise<KioskDevice> {
  const res = await api.patch(`/store/${storeId}/kiosk/devices/${identifier}`, payload);
  return res.data?.data ?? res.data;
}

// ─── Named Actions API ────────────────────────────────────────────────────────

/**
 * Trigger a named action on a specific device.
 * Uses the clean /actions/:action endpoint — preferred over pushToDevice for UI.
 */
export async function deviceAction(
  storeId: string,
  action: DeviceActionName,
  identifier: string,
): Promise<{ action: string; type: number; data: unknown }> {
  const res = await api.post(`/store/${storeId}/kiosk/actions/${action}`, { identifier });
  return res.data;
}

// ─── Generic Push API (low-level) ─────────────────────────────────────────────

/** Send a raw push type to a specific device by identifier */
export async function pushToDevice(
  storeId: string,
  identifier: string,
  type: PushType,
): Promise<PushResult> {
  const res = await api.post(`/store/${storeId}/kiosk/push`, { identifier, type });
  return res.data?.data ?? res.data;
}

/** Send a raw push type to all devices sharing a tag */
export async function pushByTag(
  storeId: string,
  tags: string,
  type: PushType,
): Promise<PushResult> {
  const res = await api.post(`/store/${storeId}/kiosk/push`, { tags, type });
  return res.data?.data ?? res.data;
}

// ─── Configuration API ────────────────────────────────────────────────────────

export async function getKioskConfigurations(
  storeId: string,
  id?: number,
): Promise<KioskConfiguration[]> {
  const res = await api.get(`/store/${storeId}/kiosk/configurations`, {
    params: id !== undefined ? { id } : undefined,
  });
  const result = res.data?.data ?? res.data;
  return Array.isArray(result) ? result : result ? [result] : [];
}

export async function patchKioskConfiguration(
  storeId: string,
  configId: number,
  payload: { name?: string; filesetid?: number },
): Promise<unknown> {
  const res = await api.patch(`/store/${storeId}/kiosk/configurations/${configId}`, payload);
  return res.data?.data ?? res.data;
}

// ─── Fileset API ──────────────────────────────────────────────────────────────

export async function getKioskFileSets(
  storeId: string,
  id?: number,
): Promise<KioskFileset[]> {
  const res = await api.get(`/store/${storeId}/kiosk/filesets`, {
    params: id !== undefined ? { id } : undefined,
  });
  const result = res.data?.data ?? res.data;
  return Array.isArray(result) ? result : result ? [result] : [];
}

// ─── Group Actions API ────────────────────────────────────────────────────────

/** Send a named action to ALL devices of this store at once via pushbytag */
export async function groupDeviceAction(
  storeId: string,
  action: DeviceActionName,
): Promise<{ ok: boolean; action: string; type: number; tag: string; devicesTargeted: number }> {
  const res = await api.post(`/store/${storeId}/kiosk/actions/${action}/all`, {});
  return res.data;
}

// ─── Battery Report API ───────────────────────────────────────────────────────

export interface BatteryReportDevice {
  identifier: string;
  name: string;
  online: boolean;
  batteryLevel: number;
  isCharging: boolean;
  screenOn: boolean;
  wiFiNetwork: string;
  lastSeen: string;
  alert: boolean;
  alertReason: string | null;
}

export interface BatteryReport {
  ok: boolean;
  storeId: string;
  tag: string;
  total: number;
  online: number;
  offline: number;
  charging: number;
  alertCount: number;
  alerts: BatteryReportDevice[];
  devices: BatteryReportDevice[];
  generatedAt: string;
}

export async function getBatteryReport(storeId: string, threshold = 40): Promise<BatteryReport> {
  const res = await api.get(`/store/${storeId}/kiosk/battery-report`, {
    params: { threshold },
  });
  return res.data;
}

/** Trigger WhatsApp notification to a phone number listing the battery alerts */
export async function notifyBatteryAlerts(
  storeId: string,
  phoneNumber: string,
): Promise<{ ok: boolean; sent: boolean; alertCount: number }> {
  const res = await api.post(`/store/${storeId}/kiosk/notify-battery-alerts`, { phoneNumber });
  return res.data;
}

// ─── Screenshot & Tag API ───────────────────────────────────────────────────────

/** Fetch the latest applicationScreenshot URL for a device (polled after a screenshot action). */
export async function getKioskScreenshot(
  storeId: string,
  identifier: string,
): Promise<{ screenshotUrl?: string | null }> {
  const res = await api.get(`/store/${storeId}/kiosk/screenshot/${encodeURIComponent(identifier)}`);
  return res.data;
}

/** Clear the stored kiosk tag for a store so it re-detects automatically. */
export async function clearKioskTag(storeId: string): Promise<unknown> {
  const res = await api.delete(`/store/${storeId}/kiosk/clear-tag`);
  return res.data;
}
