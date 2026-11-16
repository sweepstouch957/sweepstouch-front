/**
 * Monitor de rendimiento del panel (sólo cuando se activa con ?perf=1; ?perf=0 lo apaga).
 *
 * Junta, por página: cada llamada a la API (tiempo, tamaño, estado) y cada bloqueo del navegador
 * (longtask > 50 ms: renders o cálculos que congelan la pantalla). Sin React: lo alimentan el
 * interceptor de axios y un PerformanceObserver (el <Profiler> de React no mide en producción).
 * Apagado no guarda nada; el costo es un `if`.
 */

export type ApiSample = {
  route: string;
  method: string;
  endpoint: string;
  ms: number;
  status: number;
  bytes: number;
  at: number;
};
export type RenderSample = { route: string; ms: number; at: number };

const KEY = 'sweepstouch.perf';
const MAX = 2000;

let enabled = false;
const api: ApiSample[] = [];
const renders: RenderSample[] = [];
const listeners = new Set<() => void>();

if (typeof window !== 'undefined') {
  try {
    const q = new URLSearchParams(window.location.search).get('perf');
    if (q === '1') localStorage.setItem(KEY, '1');
    if (q === '0') localStorage.removeItem(KEY);
    enabled = localStorage.getItem(KEY) === '1';
  } catch {
    enabled = false;
  }
}

export const perfEnabled = () => enabled;
export const route = () =>
  typeof window === 'undefined' ? '' : normalize(window.location.pathname);

/** Ids de Mongo, números y slugs largos → :id, para agrupar /stores/abc123 con /stores/def456. */
export function normalize(path: string) {
  return path
    .split('?')[0]
    .replace(/\/[0-9a-f]{24}(?=\/|$)/gi, '/:id')
    .replace(/\/\d+(?=\/|$)/g, '/:n')
    .replace(/\/[A-Z]{2,10}-\d{4,6}(?=\/|$)/g, '/:code');
}

const push = <T>(arr: T[], x: T) => {
  arr.push(x);
  if (arr.length > MAX) arr.splice(0, arr.length - MAX);
  listeners.forEach((l) => l());
};

/** `route`: la página donde EMPEZÓ la llamada (si navegas mientras tanto, no se la lleva la nueva). */
export function recordApi(s: Omit<ApiSample, 'route' | 'at'> & { route?: string }) {
  if (enabled)
    push(api, { ...s, endpoint: normalize(s.endpoint), route: s.route || route(), at: Date.now() });
}

/** Para pruebas: prende el monitor sin URL ni localStorage. */
export const _setEnabledForTest = (on: boolean) => {
  enabled = on;
};

/** Un bloqueo del hilo principal (longtask). */
export function recordRender(ms: number) {
  if (enabled) push(renders, { route: route(), ms, at: Date.now() });
}

export const subscribe = (fn: () => void) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};

export function clearPerf() {
  api.length = 0;
  renders.length = 0;
  listeners.forEach((l) => l());
}

const pct = (xs: number[], p: number) => {
  if (!xs.length) return 0;
  const s = [...xs].sort((a, b) => a - b);
  return s[Math.min(s.length - 1, Math.floor((p / 100) * s.length))];
};

export type RouteReport = {
  route: string;
  calls: number;
  apiTotalMs: number;
  slowest: {
    endpoint: string;
    method: string;
    count: number;
    p50: number;
    p95: number;
    max: number;
    kb: number;
    errors: number;
    /** Máximo de llamadas al mismo endpoint en 5 s: > 3 suele ser re-consulta en bucle. */
    burst5s: number;
  }[];
  /** Bloqueos del navegador (longtasks) y tiempo total congelado. */
  renders: number;
  renderMs: number;
};

/** Resumen por página, de la más lenta a la más rápida. */
export function buildReport(): RouteReport[] {
  const routes = new Set([...api.map((a) => a.route), ...renders.map((r) => r.route)]);
  return [...routes]
    .map((r) => {
      const calls = api.filter((a) => a.route === r);
      const byEp = new Map<string, ApiSample[]>();
      for (const c of calls) {
        const k = `${c.method} ${c.endpoint}`;
        byEp.set(k, [...(byEp.get(k) || []), c]);
      }
      const slowest = [...byEp.entries()]
        .map(([k, xs]) => {
          const ms = xs.map((x) => x.ms);
          const [method, endpoint] = [k.split(' ')[0], k.slice(k.indexOf(' ') + 1)];
          return {
            endpoint,
            method,
            count: xs.length,
            p50: Math.round(pct(ms, 50)),
            p95: Math.round(pct(ms, 95)),
            max: Math.round(Math.max(...ms)),
            kb: Math.round(xs.reduce((t, x) => t + x.bytes, 0) / xs.length / 1024),
            errors: xs.filter((x) => x.status >= 400 || x.status === 0).length,
            burst5s: Math.max(
              ...xs.map((x) => xs.filter((y) => y.at >= x.at && y.at - x.at < 5000).length)
            ),
          };
        })
        .sort((a, b) => b.p95 - a.p95);
      const rs = renders.filter((x) => x.route === r);
      return {
        route: r,
        calls: calls.length,
        apiTotalMs: Math.round(calls.reduce((t, c) => t + c.ms, 0)),
        slowest,
        renders: rs.length,
        renderMs: Math.round(rs.reduce((t, x) => t + x.ms, 0)),
      };
    })
    .sort((a, b) => (b.slowest[0]?.p95 ?? 0) - (a.slowest[0]?.p95 ?? 0));
}
