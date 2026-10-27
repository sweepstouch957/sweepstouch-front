'use client';

import { sendCampaignEmail } from '@/services/mail.service';
import { getStores, type Store } from '@/services/store.service';
import { Alert, Button, Paper, Stack, Typography } from '@mui/material';
import axios from 'axios';
import { useEffect, useRef, useState } from 'react';

interface Props {
  userId: string;
  busy: boolean;
  acquire: () => boolean;
  release: () => void;
}

// Already sent in the current Campaign Report run; preserve across tab resets.
const ALREADY_SENT_EMAILS = new Set([
  'keyfood.southstreet@gmail.com',
  'keyfood.holyoke@gmail.com',
  'keyfood.chicopee@gmail.com',
]);

export default function BulkSend({ userId, busy, acquire, release }: Props) {
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState('');
  const [error, setError] = useState('');
  const [rows, setRows] = useState<Array<{ id: string; label: string; message: string }>>([]);
  const stopRef = useRef(false);

  useEffect(() => () => { stopRef.current = true; }, []);

  async function sendAll() {
    if (!acquire()) return;
    setRunning(true);
    setError('');
    setRows([]);
    stopRef.current = false;
    const key = `campaign-report-bulk-attempts:${userId}`;
    let attemptedCount = 0;
    let skippedCount = 0;
    let processedCount = 0;
    try {
      // Persist before each POST: an uncertain response must never trigger a retry.
      const saved: unknown = JSON.parse(sessionStorage.getItem(key) || '[]');
      if (!Array.isArray(saved) || saved.some((id) => typeof id !== 'string')) {
        throw new Error('No se pudo leer el registro de envíos de esta pestaña.');
      }
      const attempted = new Set<string>(saved);
      sessionStorage.setItem(key, JSON.stringify([...attempted]));
      const stores = new Map<string, Store>();
      let currentPage = 1;
      let loaded = 0;
      let total = 0;
      do {
        if (stopRef.current) break;
        setProgress(`Cargando tiendas: página ${currentPage}…`);
        const response = await getStores({
          page: currentPage,
          limit: 100,
          status: 'active',
          sortBy: 'createdAt',
          order: 'asc',
        });
        if (!Array.isArray(response.data) || !Number.isFinite(response.total))
          throw new Error('Respuesta de tiendas inválida. No se inició el envío.');
        total = response.total;
        if (!response.data.length && loaded < total)
          throw new Error('No se pudieron cargar todas las tiendas. No se inició el envío.');
        response.data.forEach((store) => stores.set(store._id, store));
        loaded += response.data.length;
        setProgress(`Cargadas ${loaded} de ${total} tiendas. Consultando todas las páginas…`);
        currentPage += 1;
      } while (loaded < total);

      for (const store of stores.values()) {
        if (stopRef.current) break;
        const to = store.email?.trim() || '';
        const label = `${store.name} — ${store.address || 'Sin dirección'}`;
        let message: string;
        // Match backend buildStatusMatch('active'), including legacy stores.
        const isActive = store.active !== false && (!store.status || store.status === 'active');
        if (!isActive) {
          skippedCount += 1;
          message = 'Omitida: la tienda no tiene estado activo.';
        } else if (!to || to.length > 254 || !/^[^\s@<>;,]+@[^\s@<>;,]+\.[^\s@<>;,]+$/.test(to)) {
          skippedCount += 1;
          message = to ? 'Omitida: correo inválido.' : 'Omitida: sin correo guardado.';
        } else if (ALREADY_SENT_EMAILS.has(to.toLowerCase())) {
          skippedCount += 1;
          message = 'Omitida: ya recibió este reporte (exclusión solicitada).';
        } else if (attempted.has(store._id)) {
          skippedCount += 1;
          message = 'Omitida: ya se intentó enviar en esta pestaña.';
        } else {
          attempted.add(store._id);
          sessionStorage.setItem(key, JSON.stringify([...attempted]));
          attemptedCount += 1;
          setProgress(`Procesando ${processedCount + 1} de ${stores.size} tiendas. Enviando a ${store.name} (${to})…`);
          try {
            const response = await sendCampaignEmail({
              storeId: store._id,
              to,
              subject: 'Campaign Report',
              sorteo_winner: 'pendiente',
            });
            const item = response.result?.[0];
            const labels: Record<string, string> = {
              sent: 'Envío reportado por Mailchimp',
              queued: 'En cola',
              scheduled: 'Programado',
            };
            message =
              response.ok && item && labels[item.status]
                ? `${labels[item.status]}: ${to}. Campaña: ${response.campaignId}`
                : `No aceptado: ${
                    item?.reject_reason || item?.status || 'respuesta no reconocida'
                  }. Destinatario: ${to}`;
          } catch (cause) {
            const body = axios.isAxiosError(cause) ? cause.response?.data : null;
            const status = axios.isAxiosError(cause) ? cause.response?.status : undefined;
            const noCampaign = body?.error === 'report_campaign_not_found';
            message = `Error para ${to}: ${
              (noCampaign ? 'La tienda no tiene campañas completadas en el período del reporte.' : null) ||
              body?.result?.[0]?.reject_reason ||
              body?.message ||
              body?.error ||
              'Envío no confirmado. Revisa su estado antes de volver a enviar.'
            }${status ? ` (HTTP ${status})` : ' (sin respuesta HTTP)'}`;
            if (
              axios.isAxiosError(cause) &&
              (!cause.response || ([401, 403, 404, 405, 503].includes(cause.response.status) && !noCampaign))
            ) {
              stopRef.current = true;
              const reasons: Record<number, string> = {
                401: 'El servidor rechazó la autenticación. Inicia sesión nuevamente.',
                403: 'El servidor denegó el permiso para enviar reportes.',
                404: 'El servidor no encontró la ruta de envío de reportes.',
                405: 'El servidor no permite POST en la ruta de envío.',
                503: 'El servicio de correo no está disponible o no está configurado.',
              };
              setError(`Proceso detenido. ${status ? reasons[status] : 'No se recibió respuesta del servidor; puede ser un fallo de conexión, CORS o timeout.'} ${message}`);
            }
          }
        }
        setRows((previous) => [...previous, { id: store._id, label, message }]);
        processedCount += 1;
      }
      setProgress(
        `${
          stopRef.current ? 'Proceso detenido' : 'Proceso terminado'
        }. ${stores.size} tiendas cargadas; ${processedCount} revisadas; ${stores.size - processedCount} pendientes. ${attemptedCount} solicitudes de envío; ${skippedCount} tiendas omitidas.`
      );
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo completar el proceso.');
      setProgress('Proceso detenido. Los intentos registrados no se repetirán en esta pestaña.');
    } finally {
      setRunning(false);
      release();
    }
  }

  return (
    <Paper
      variant="outlined"
      sx={{ p: 3, mt: 3 }}
    >
      <Stack spacing={2}>
        <Typography variant="h6">Enviar a todas las tiendas activas con correo</Typography>
        <Typography color="text.secondary">
          Se recorren todas las páginas, sin límite de 100 tiendas. Solo las tiendas con estado
          activo recibirán su reporte en el correo que tienen guardado. Se usará el
          asunto «Campaign Report» y «pendiente» como ganador para todas. Se omiten correos vacíos,
          inválidos y tiendas ya intentadas en esta pestaña. Mantén esta página abierta hasta que
          termine.
        </Typography>
        <Button
          variant="contained"
          type="button"
          disabled={busy}
          onClick={sendAll}
        >
          {running ? 'Enviando reportes…' : 'Enviar a todas las tiendas activas'}
        </Button>
        {running && (
          <Button
            type="button"
            onClick={() => {
              stopRef.current = true;
            }}
          >
            Detener después de la solicitud actual
          </Button>
        )}
        <Stack
          spacing={1}
          aria-live="polite"
        >
          {progress && <Typography>{progress}</Typography>}
          {error && <Alert severity="error">{error}</Alert>}
        </Stack>
        <Stack
          spacing={1}
          sx={{ maxHeight: 360, overflow: 'auto' }}
        >
          {rows.map((row) => (
            <Paper
              key={row.id}
              variant="outlined"
              sx={{ p: 1.5 }}
            >
              <Typography
                variant="body2"
                fontWeight={700}
              >
                {row.label}
              </Typography>
              <Typography variant="body2">{row.message}</Typography>
            </Paper>
          ))}
        </Stack>
      </Stack>
    </Paper>
  );
}
