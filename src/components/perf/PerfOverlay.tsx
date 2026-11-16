'use client';

/**
 * Panel del monitor de rendimiento (?perf=1). Muestra, por página, las llamadas más lentas,
 * las que se repiten en bucle y los bloqueos del navegador; "Copiar reporte" deja el texto
 * listo para pegar. Sólo se descarga cuando el monitor está prendido.
 */
import SpeedRoundedIcon from '@mui/icons-material/SpeedRounded';
import {
  Box,
  Button,
  Chip,
  Drawer,
  Fab,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import {
  buildReport,
  clearPerf,
  recordRender,
  subscribe,
  type RouteReport,
} from 'src/libs/perf/monitor';

let version = 0;
const bump = () => version++;

function useReport() {
  const v = useSyncExternalStore(
    (cb) => subscribe(() => (bump(), cb())),
    () => version,
    () => 0
  );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => buildReport(), [v]);
}

const ms = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(1)} s` : `${n} ms`);
const tone = (n: number) => (n >= 2000 ? 'error' : n >= 800 ? 'warning' : 'success');

export function reportText(rs: RouteReport[]) {
  return rs
    .map((r) =>
      [
        `## ${r.route} — ${r.calls} llamadas, ${ms(r.apiTotalMs)} en API, ${
          r.renders
        } bloqueos (${ms(r.renderMs)})`,
        ...r.slowest
          .slice(0, 8)
          .map(
            (e) =>
              `  ${e.method} ${e.endpoint} · x${e.count} · p50 ${ms(e.p50)} · p95 ${ms(
                e.p95
              )} · máx ${ms(e.max)} · ${e.kb} KB` +
              (e.burst5s > 3 ? ` · ${e.burst5s} en 5 s` : '') +
              (e.errors ? ` · ${e.errors} errores` : '')
          ),
      ].join('\n')
    )
    .join('\n\n');
}

export default function PerfOverlay() {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const report = useReport();

  // Bloqueos del hilo principal (> 50 ms), atribuidos a la página abierta.
  useEffect(() => {
    if (typeof PerformanceObserver === 'undefined') return;
    try {
      const obs = new PerformanceObserver((list) =>
        list.getEntries().forEach((e) => recordRender(e.duration))
      );
      obs.observe({ type: 'longtask', buffered: true });
      return () => obs.disconnect();
    } catch {
      return undefined; // navegador sin longtask (Safari/Firefox): sólo se mide la API
    }
  }, []);

  const copy = async () => {
    await navigator.clipboard.writeText(reportText(report));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <>
      <Fab
        size="small"
        color="secondary"
        onClick={() => setOpen(true)}
        sx={{ position: 'fixed', left: 16, bottom: 16, zIndex: 2000 }}
        aria-label="Monitor de rendimiento"
      >
        <SpeedRoundedIcon />
      </Fab>
      <Drawer
        anchor="bottom"
        open={open}
        onClose={() => setOpen(false)}
        PaperProps={{ sx: { maxHeight: '70vh' } }}
      >
        <Stack
          direction="row"
          alignItems="center"
          gap={1}
          sx={{ p: 2, pb: 1 }}
          flexWrap="wrap"
        >
          <Typography
            variant="h6"
            sx={{ flex: 1 }}
          >
            Rendimiento por página
          </Typography>
          <Button
            variant="contained"
            onClick={copy}
          >
            {copied ? 'Copiado' : 'Copiar reporte'}
          </Button>
          <Button onClick={clearPerf}>Limpiar</Button>
          <Button
            color="inherit"
            href="?perf=0"
          >
            Apagar
          </Button>
        </Stack>
        <Box sx={{ px: 2, pb: 2, overflow: 'auto' }}>
          {!report.length && (
            <Typography color="text.secondary">
              Navega por el panel: cada página que abras aparece acá con sus llamadas más lentas.
            </Typography>
          )}
          {report.map((r) => (
            <Box
              key={r.route}
              sx={{ mb: 2 }}
            >
              <Stack
                direction="row"
                gap={1}
                alignItems="center"
                flexWrap="wrap"
              >
                <Typography fontWeight={700}>{r.route}</Typography>
                <Chip
                  size="small"
                  label={`${r.calls} llamadas · ${ms(r.apiTotalMs)}`}
                />
                {r.renders > 0 && (
                  <Chip
                    size="small"
                    color={tone(r.renderMs)}
                    label={`${r.renders} bloqueos · ${ms(r.renderMs)}`}
                  />
                )}
              </Stack>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Endpoint</TableCell>
                    <TableCell align="right">Veces</TableCell>
                    <TableCell align="right">p50</TableCell>
                    <TableCell align="right">p95</TableCell>
                    <TableCell align="right">KB</TableCell>
                    <TableCell align="right">En 5 s</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {r.slowest.slice(0, 8).map((e) => (
                    <TableRow key={`${e.method} ${e.endpoint}`}>
                      <TableCell sx={{ fontFamily: 'monospace', fontSize: 12 }}>
                        {e.method} {e.endpoint}
                        {e.errors ? ` (${e.errors} errores)` : ''}
                      </TableCell>
                      <TableCell align="right">{e.count}</TableCell>
                      <TableCell align="right">{ms(e.p50)}</TableCell>
                      <TableCell align="right">
                        <Chip
                          size="small"
                          color={tone(e.p95)}
                          label={ms(e.p95)}
                        />
                      </TableCell>
                      <TableCell align="right">{e.kb}</TableCell>
                      <TableCell align="right">{e.burst5s > 3 ? e.burst5s : ''}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          ))}
        </Box>
      </Drawer>
    </>
  );
}
