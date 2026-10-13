'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import axios from 'axios';
import { Alert, Autocomplete, Box, Button, CircularProgress, Paper, Stack, TextField, Typography } from '@mui/material';
import EmailOutlined from '@mui/icons-material/EmailOutlined';
import { useAuth } from '@/hooks/use-auth';
import { STAFF_ROLES } from '@/hooks/use-routes';
import { getStores, type Store } from '@/services/store.service';
import { sendCampaignEmail, type SendCampaignEmailResponse } from '@/services/mail.service';

const validText = (value: string) => value.trim().length > 0 && value.trim().length <= 200 && !/[\r\n]/.test(value);

const validEmail = (value: string) => value.trim().length <= 254 && /^[^\s@<>;,]+@[^\s@<>;,]+\.[^\s@<>;,]+$/.test(value.trim());
const statusLabels: Record<string, string> = {
  sent: 'Mailchimp reportó el envío a', queued: 'Correo en cola para', scheduled: 'Correo programado para',
  rejected: 'Correo rechazado para', invalid: 'Correo inválido para',
};

function sendError(error: unknown): string {
  if (!axios.isAxiosError(error)) return error instanceof Error ? error.message : 'No se pudo enviar el correo';
  const body = error.response?.data;
  if (error.response?.status === 401) return 'Tu sesión no es válida. Inicia sesión nuevamente.';
  if (error.response?.status === 403) return 'No tienes permisos para enviar reportes por correo.';
  if (error.response?.status === 404) return 'No se encontró la ruta de envío de reportes (HTTP 404). Revisa que POST /api/mail/database-status/send esté desplegado en el backend.';
  if (error.response?.status === 405) return 'El servidor no permite POST en la ruta de envío de reportes (HTTP 405). Revisa la ruta del gateway.';
  const messages: Record<string, string> = {
    report_campaign_not_found: 'La tienda no tiene campañas completadas.',
    missing_store_field: 'Faltan datos de la tienda necesarios para el reporte, por ejemplo el logo.',
    missing_fields: 'Faltan datos obligatorios para generar el reporte.',
    invalid_subject: 'Escribe un asunto de entre 1 y 200 caracteres, sin saltos de línea.',
    invalid_sorteo_winner: 'Escribe el nombre del ganador de entre 1 y 200 caracteres, sin saltos de línea.',
    invalid_store_id: 'Selecciona una tienda válida.',
    invalid_email: 'Escribe un correo destinatario válido.',
    report_service_unavailable: 'Un servicio del backend no está disponible.',
    report_service_error: 'Falló la consulta de los datos del reporte.',
    mail_send_not_configured: 'El servicio de envío de reportes aún no está configurado.',
    mail_service_unavailable: 'El gateway no pudo contactar al servicio de correo.',
  };
  const detail = body?.result?.[0]?.reject_reason || messages[body?.error] ||
    (typeof body?.message === 'string' ? body.message : null) ||
    (typeof body?.error === 'string' ? body.error : null);
  if (detail) return `${detail}${error.response ? ` (HTTP ${error.response.status})` : ''}`;
  return error.response
    ? `El servidor devolvió HTTP ${error.response.status} sin un detalle de error. No se pudo confirmar el envío; revisa el estado antes de volver a enviar.`
    : 'No se recibió respuesta del servidor. No se pudo confirmar el envío; revisa el estado antes de volver a enviar.';
}

export default function Page() {
  const { user } = useAuth();
  const allowed = !!user && STAFF_ROLES.includes(user.role);
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('Your Campaign Results');
  const [sorteoWinner, setSorteoWinner] = useState('');
  const [search, setSearch] = useState('');
  const [options, setOptions] = useState<Store[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [retry, setRetry] = useState(0);
  const [loadingStores, setLoadingStores] = useState(false);
  const [storeError, setStoreError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SendCampaignEmailResponse | null>(null);
  const sendingRef = useRef(false);

  useEffect(() => {
    if (!allowed) return;
    let active = true;
    setLoadingStores(true);
    setStoreError(null);
    const timer = setTimeout(async () => {
      try {
        const response = await getStores({ page, limit: 25, search, status: 'all' });
        if (!active) return;
        if (!Array.isArray(response.data)) throw new Error('La respuesta de tiendas no tiene un formato válido.');
        setOptions(previous => Array.from(new Map(
          [...(page === 1 ? [] : previous), ...response.data].map(store => [store._id, store])
        ).values()));
        setTotal(response.total);
      } catch (cause) {
        if (active) {
          const detail = axios.isAxiosError(cause)
            ? cause.response?.data?.message || cause.response?.data?.error
            : cause instanceof Error ? cause.message : null;
          setStoreError(detail || 'No se pudieron cargar las tiendas. Intenta nuevamente.');
        }
      } finally {
        if (active) setLoadingStores(false);
      }
    }, 300);
    return () => { active = false; clearTimeout(timer); };
  }, [allowed, search, page, retry]);

  function clearFeedback() { setError(null); setResult(null); }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!allowed || sendingRef.current || !selectedStore || !validEmail(email) || !validText(subject) || !validText(sorteoWinner)) return;
    sendingRef.current = true;
    setSending(true);
    clearFeedback();
    try {
      const response = await sendCampaignEmail({ storeId: selectedStore._id, to: email, subject, sorteo_winner: sorteoWinner });
      const item = response.result?.[0];
      if (!item) throw new Error('El servicio no confirmó el envío');
      setResult(response);
      if (!response.ok || !['sent', 'queued', 'scheduled'].includes(item.status)) {
        setError(item.reject_reason || 'El proveedor no aceptó el correo');
      }
    } catch (cause) {
      if (axios.isAxiosError<SendCampaignEmailResponse>(cause) && cause.response?.data?.result?.length) {
        setResult(cause.response.data);
      }
      setError(sendError(cause));
    } finally { sendingRef.current = false; setSending(false); }
  }

  if (!allowed) return <Box p={3}><Alert severity="warning">No tienes permisos para acceder a esta herramienta.</Alert></Box>;
  const item = result?.result?.[0];
  const storeOptions = selectedStore && !options.some(store => store._id === selectedStore._id)
    ? [selectedStore, ...options] : options;

  return (
    <Box sx={{ p: { xs: 2, sm: 3 }, maxWidth: 850 }}>
      <Typography variant="h4"
fontWeight={800}
gutterBottom>Enviar reporte por correo</Typography>
      <Typography color="text.secondary"
sx={{ mb: 3 }}>
        Se enviará un correo con los resultados de la última campaña completada de la tienda seleccionada.
      </Typography>
      <Paper variant="outlined"
sx={{ p: { xs: 2, sm: 3 } }}>
        <Stack component="form"
spacing={2.5}
onSubmit={handleSubmit}>
          <Autocomplete<Store>
            options={storeOptions}
value={selectedStore}
disabled={sending}
loading={loadingStores}
            filterOptions={values => values}
isOptionEqualToValue={(a, b) => a._id === b._id}
            getOptionLabel={store => `${store.name} — ${store.address || 'Sin dirección'}`}
            onChange={(_, store) => {
              if (store?._id !== selectedStore?._id) setSorteoWinner('');
              setSelectedStore(store); clearFeedback();
            }}
            onInputChange={(_, value, reason) => {
              if (reason === 'input' || reason === 'clear') {
                setSearch(value); setPage(1); setOptions([]); setTotal(0);
              }
            }}
            loadingText="Buscando tiendas…"
noOptionsText={storeError ? 'Error al buscar tiendas' : 'No hay tiendas para esta búsqueda'}
            renderInput={params => <TextField {...params}
label="Tienda"
placeholder="Buscar por nombre o dirección" />}
          />
          {storeError && <Alert severity="error"
action={<Button disabled={loadingStores}
onClick={() => setRetry(value => value + 1)}>Reintentar</Button>}>{storeError}</Alert>}
          {options.length < total && <Button type="button"
disabled={loadingStores || sending || !!storeError}
onClick={() => setPage(value => value + 1)}>Cargar más tiendas ({options.length} de {total})</Button>}
          <TextField label="Correo destinatario"
type="email"
required
value={email}
disabled={sending}
            inputProps={{ maxLength: 254 }}
helperText="Escribe el correo que recibirá el reporte."
            onChange={event => { setEmail(event.target.value); clearFeedback(); }} />
          <TextField
            label="Asunto del correo"
            value={subject}
            onChange={event => { setSubject(event.target.value); clearFeedback(); }}
            inputProps={{ maxLength: 200 }}
            required
            fullWidth
            disabled={sending}
            error={subject.length > 0 && !validText(subject)}
            helperText="Entre 1 y 200 caracteres, sin saltos de línea."
          />
          <TextField
            label="Nombre del ganador del sorteo"
            value={sorteoWinner}
            onChange={event => { setSorteoWinner(event.target.value); clearFeedback(); }}
            inputProps={{ maxLength: 200 }}
            required
            fullWidth
            disabled={sending}
            error={sorteoWinner.length > 0 && !validText(sorteoWinner)}
            helperText="Entre 1 y 200 caracteres, sin saltos de línea."
          />
          <Button variant="contained"
type="submit"
disabled={sending || !selectedStore || !validEmail(email) || !validText(subject) || !validText(sorteoWinner)}
            startIcon={sending ? <CircularProgress size={18}
color="inherit" /> : <EmailOutlined />}>
            {sending ? 'Enviando…' : 'Enviar correo'}
          </Button>
          <Box aria-live="polite">
            {error && <Alert severity="error"
sx={{ mb: 2 }}>{error}</Alert>}
            {result && item && <Alert severity={error ? 'error' : item.status === 'sent' ? 'success' : 'info'}>
              <Typography>{statusLabels[item.status] || 'Estado del correo para'} {item.email} ({item.status}).</Typography>
              <Typography variant="body2">Campaña: {result.campaignId}</Typography>
              <Typography variant="body2">Fecha del reporte: {result.reportDate}</Typography>
              {item.queued_reason && <Typography variant="body2">Motivo de cola: {item.queued_reason}</Typography>}
            </Alert>}
          </Box>
        </Stack>
      </Paper>
    </Box>
  );
}
