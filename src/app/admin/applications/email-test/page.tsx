'use client';

import { useAuth } from '@/hooks/use-auth';
import { STAFF_ROLES } from '@/hooks/use-routes';
import { sendCampaignDeliverySummary } from '@/services/campaign-delivery-summary.service';
import {
  sendCampaignEmail,
  sendHistoricalCampaignEmail,
  type SendCampaignEmailResponse,
} from '@/services/mail.service';
import { getStores, type Store } from '@/services/store.service';
import EmailOutlined from '@mui/icons-material/EmailOutlined';
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  CircularProgress,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import axios from 'axios';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import BulkSend from './bulk-send';

const validText = (value: string) =>
  value.trim().length > 0 && value.trim().length <= 200 && !/[\r\n]/.test(value);

const validEmail = (value: string) =>
  value.trim().length <= 254 && /^[^\s@<>;,]+@[^\s@<>;,]+\.[^\s@<>;,]+$/.test(value.trim());
const statusLabels: Record<string, string> = {
  sent: 'Mailchimp reportó el envío a',
  queued: 'Correo en cola para',
  scheduled: 'Correo programado para',
  rejected: 'Correo rechazado para',
  invalid: 'Correo inválido para',
};

function sendError(error: unknown): string {
  if (!axios.isAxiosError(error))
    return error instanceof Error ? error.message : 'No se pudo enviar el correo';
  const body = error.response?.data;
  if (error.response?.status === 401) return 'Tu sesión no es válida. Inicia sesión nuevamente.';
  if (error.response?.status === 403) return 'No tienes permisos para enviar reportes por correo.';
  if (error.response?.status === 405)
    return 'El servidor no permite POST en la ruta de envío de reportes (HTTP 405). Revisa la ruta del gateway.';
  const messages: Record<string, string> = {
    report_campaign_not_found: 'La tienda no tiene campañas completadas en el período del reporte.',
    NOT_FOUND:
      'No se encontró el recurso solicitado en el backend. Revisa la ruta de envío y los datos de la tienda.',
    missing_store_field:
      'Faltan datos de la tienda necesarios para el reporte, por ejemplo el logo.',
    missing_fields: 'Faltan datos obligatorios para generar el reporte.',
    invalid_subject: 'Escribe un asunto de entre 1 y 200 caracteres, sin saltos de línea.',
    invalid_sorteo_winner:
      'Escribe el nombre del ganador de entre 1 y 200 caracteres, sin saltos de línea.',
    invalid_store_id: 'Selecciona una tienda válida.',
    invalid_email: 'Escribe un correo destinatario válido.',
    invalid_report_period:
      'Revisa las fechas y la zona horaria: el fin debe ser posterior al inicio y es exclusivo.',
    invalid_other_services: 'Puedes agregar hasta 20 servicios adicionales.',
    invalid_service_cost: 'El costo del servicio debe ser un número mayor o igual a cero.',
    invalid_contact_name:
      'El nombre del contacto debe tener hasta 200 caracteres y no contener saltos de línea.',
    invalid_support_phone:
      'El teléfono de soporte debe tener hasta 200 caracteres y no contener saltos de línea.',
    report_service_unavailable: 'Un servicio del backend no está disponible.',
    report_service_error: 'Falló la consulta de los datos del reporte.',
    mail_send_not_configured: 'El servicio de envío de reportes aún no está configurado.',
    mail_service_unavailable: 'El gateway no pudo contactar al servicio de correo.',
  };
  const detail =
    body?.result?.[0]?.reject_reason ||
    messages[body?.error] ||
    (typeof body?.message === 'string' ? body.message : null) ||
    (typeof body?.error === 'string' ? body.error : null);
  if (detail) return `${detail}${error.response ? ` (HTTP ${error.response.status})` : ''}`;
  if (error.response?.status === 404)
    return 'El servidor devolvió HTTP 404 sin detalle. Puede faltar la ruta de envío o un recurso del reporte; revisa la respuesta del backend.';
  return error.response
    ? `El servidor devolvió HTTP ${error.response.status} sin un detalle de error. No se pudo confirmar el envío; revisa el estado antes de volver a enviar.`
    : 'No se recibió respuesta del servidor. No se pudo confirmar el envío; revisa el estado antes de volver a enviar.';
}

export default function Page() {
  return (
    <>
      <ReportSection />
      <ReportSection historical />
      <ReportSection deliverySummary />
    </>
  );
}

function ReportSection({
  historical = false,
  deliverySummary = false,
}: {
  historical?: boolean;
  deliverySummary?: boolean;
}) {
  const { user } = useAuth();
  const allowed = !!user && STAFF_ROLES.includes(user.role);
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('Campaign Report');
  const [sorteoWinner, setSorteoWinner] = useState('');
  const [contactName, setContactName] = useState('');
  const [supportPhone, setSupportPhone] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [timeZone, setTimeZone] = useState('America/New_York');
  let validTimeZone = true;
  try {
    new Intl.DateTimeFormat('en-US', { timeZone });
  } catch {
    validTimeZone = false;
  }
  const validPeriod =
    ((!startDate && !endDate) || (!!startDate && !!endDate && startDate < endDate)) &&
    !!timeZone &&
    validTimeZone;
  const [otherServices, setOtherServices] = useState<
    Array<{ id: number; name: string; cost: string }>
  >([]);
  const serviceId = useRef(0);
  const deliveryFieldsValid =
    validPeriod &&
    [contactName, supportPhone].every((value) => !value || validText(value)) &&
    otherServices.every(
      (service) =>
        validText(service.name) &&
        service.cost.trim() !== '' &&
        Number.isFinite(Number(service.cost)) &&
        Number(service.cost) >= 0
    );
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
        if (!Array.isArray(response.data))
          throw new Error('La respuesta de tiendas no tiene un formato válido.');
        setOptions((previous) =>
          Array.from(
            new Map(
              [...(page === 1 ? [] : previous), ...response.data].map((store) => [store._id, store])
            ).values()
          )
        );
        setTotal(response.total);
      } catch (cause) {
        if (active) {
          const detail = axios.isAxiosError(cause)
            ? cause.response?.data?.message || cause.response?.data?.error
            : cause instanceof Error
              ? cause.message
              : null;
          setStoreError(detail || 'No se pudieron cargar las tiendas. Intenta nuevamente.');
        }
      } finally {
        if (active) setLoadingStores(false);
      }
    }, 300);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [allowed, search, page, retry]);

  function clearFeedback() {
    setError(null);
    setResult(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (
      !allowed ||
      sendingRef.current ||
      !selectedStore ||
      !validEmail(email) ||
      !validText(subject) ||
      (deliverySummary ? !deliveryFieldsValid : !validText(sorteoWinner))
    )
      return;
    sendingRef.current = true;
    setSending(true);
    clearFeedback();
    try {
      const send = historical ? sendHistoricalCampaignEmail : sendCampaignEmail;
      const response = deliverySummary
        ? await sendCampaignDeliverySummary({
            storeId: selectedStore._id,
            to: email,
            subject,
            contact_name: contactName,
            support_phone: supportPhone,
            startDate: startDate || undefined,
            endDate: endDate || undefined,
            timeZone,
            other_services: otherServices.map((service) => ({
              name: service.name,
              cost: Number(service.cost),
            })),
          })
        : await send({
            storeId: selectedStore._id,
            to: email,
            subject,
            sorteo_winner: sorteoWinner,
          });
      const item = response.result?.[0];
      if (!item) throw new Error('El servicio no confirmó el envío');
      setResult(response);
      if (!response.ok || !['sent', 'queued', 'scheduled'].includes(item.status)) {
        setError(item.reject_reason || 'El proveedor no aceptó el correo');
      }
    } catch (cause) {
      if (
        axios.isAxiosError<SendCampaignEmailResponse>(cause) &&
        cause.response?.data?.result?.length
      ) {
        setResult(cause.response.data);
      }
      setError(sendError(cause));
    } finally {
      sendingRef.current = false;
      setSending(false);
    }
  }

  if (!allowed)
    return (
      <Box p={3}>
        <Alert severity="warning">No tienes permisos para acceder a esta herramienta.</Alert>
      </Box>
    );
  const item = result?.result?.[0];
  const storeOptions =
    selectedStore && !options.some((store) => store._id === selectedStore._id)
      ? [selectedStore, ...options]
      : options;

  return (
    <Box sx={{ p: { xs: 2, sm: 3 }, maxWidth: 850 }}>
      <Typography
        variant="h4"
        fontWeight={800}
        gutterBottom
      >
        {deliverySummary
          ? 'Resumen de entregas y costos por tienda'
          : historical
            ? 'Reporte histórico por tienda'
            : 'Enviar reporte por correo'}
      </Typography>
      <Typography
        color="text.secondary"
        sx={{ mb: 3 }}
      >
        {deliverySummary
          ? 'Envía el resumen de entregas, base actual de clientes y costos de las campañas completadas en el período elegido. Sin fechas se usa la semana anterior en Nueva York. Los datos se obtienen automáticamente para la tienda seleccionada.'
          : historical
            ? 'Selecciona una tienda para enviar en un solo correo los datos de todas sus campañas completadas hasta hoy, sin limitar el reporte a la última semana.'
            : 'Se enviará un correo con los resultados de las campañas completadas de la tienda durante la semana anterior.'}
      </Typography>
      <Paper
        variant="outlined"
        sx={{ p: { xs: 2, sm: 3 } }}
      >
        <Stack
          component="form"
          spacing={2.5}
          onSubmit={handleSubmit}
        >
          <Autocomplete<Store>
            options={storeOptions}
            value={selectedStore}
            disabled={sending}
            loading={loadingStores}
            filterOptions={(values) => values}
            isOptionEqualToValue={(a, b) => a._id === b._id}
            getOptionLabel={(store) => `${store.name} — ${store.address || 'Sin dirección'}`}
            onChange={(_, store) => {
              if (store?._id !== selectedStore?._id) {
                setSorteoWinner('');
                setContactName('');
                setOtherServices([]);
              }
              setSelectedStore(store);
              clearFeedback();
            }}
            onInputChange={(_, value, reason) => {
              if (reason === 'input' || reason === 'clear') {
                setSearch(value);
                setPage(1);
                setOptions([]);
                setTotal(0);
              }
            }}
            loadingText="Buscando tiendas…"
            noOptionsText={
              storeError ? 'Error al buscar tiendas' : 'No hay tiendas para esta búsqueda'
            }
            renderInput={(params) => (
              <TextField
                {...params}
                label="Tienda"
                placeholder="Buscar por nombre o dirección"
              />
            )}
          />
          {storeError && (
            <Alert
              severity="error"
              action={
                <Button
                  disabled={loadingStores}
                  onClick={() => setRetry((value) => value + 1)}
                >
                  Reintentar
                </Button>
              }
            >
              {storeError}
            </Alert>
          )}
          {options.length < total && (
            <Button
              type="button"
              disabled={loadingStores || sending || !!storeError}
              onClick={() => setPage((value) => value + 1)}
            >
              Cargar más tiendas ({options.length} de {total})
            </Button>
          )}
          <TextField
            label="Correo destinatario"
            type="email"
            required
            value={email}
            disabled={sending}
            inputProps={{ maxLength: 254 }}
            helperText="Escribe el correo que recibirá el reporte."
            onChange={(event) => {
              setEmail(event.target.value);
              clearFeedback();
            }}
          />
          <TextField
            label="Asunto del correo"
            value={subject}
            onChange={(event) => {
              setSubject(event.target.value);
              clearFeedback();
            }}
            inputProps={{ maxLength: 200 }}
            required
            fullWidth
            disabled={sending}
            error={subject.length > 0 && !validText(subject)}
            helperText="Entre 1 y 200 caracteres, sin saltos de línea."
          />
          {!deliverySummary && (
            <TextField
              label="Nombre del ganador del sorteo"
              value={sorteoWinner}
              onChange={(event) => {
                setSorteoWinner(event.target.value);
                clearFeedback();
              }}
              inputProps={{ maxLength: 200 }}
              required
              fullWidth
              disabled={sending}
              error={sorteoWinner.length > 0 && !validText(sorteoWinner)}
              helperText="Entre 1 y 200 caracteres, sin saltos de línea."
            />
          )}
          {deliverySummary && (
            <Stack spacing={2}>
              <Typography variant="subtitle2">Período del reporte</Typography>
              <Typography
                variant="body2"
                color="text.secondary"
              >
                Sin fechas se usa la semana anterior, de lunes a lunes, en la zona indicada. Solo se
                incluyen campañas completadas. La base de clientes corresponde a su estado actual.
              </Typography>
              <TextField
                label="Fecha inicial (incluida)"
                type="date"
                value={startDate}
                disabled={sending}
                InputLabelProps={{ shrink: true }}
                required={!!endDate}
                onChange={(event) => {
                  setStartDate(event.target.value);
                  clearFeedback();
                }}
              />
              <TextField
                label="Fecha final (excluida)"
                type="date"
                value={endDate}
                disabled={sending}
                InputLabelProps={{ shrink: true }}
                required={!!startDate}
                error={!!endDate && !!startDate && endDate <= startDate}
                helperText="Las campañas de esta fecha no se incluyen. Completa ambas fechas o deja ambas vacías."
                onChange={(event) => {
                  setEndDate(event.target.value);
                  clearFeedback();
                }}
              />
              <TextField
                label="Zona horaria"
                value={timeZone}
                required
                disabled={sending}
                error={!validTimeZone || !timeZone}
                helperText="Por defecto: America/New_York. Usa un identificador válido, por ejemplo America/Tegucigalpa."
                onChange={(event) => {
                  setTimeZone(event.target.value);
                  clearFeedback();
                }}
              />
              <TextField
                label="Nombre de contacto (opcional)"
                value={contactName}
                disabled={sending}
                inputProps={{ maxLength: 200 }}
                onChange={(event) => {
                  setContactName(event.target.value);
                  clearFeedback();
                }}
                helperText="Si lo dejas vacío, se usa el contacto registrado en la tienda."
              />
              <TextField
                label="Teléfono de soporte (opcional)"
                value={supportPhone}
                disabled={sending}
                inputProps={{ maxLength: 200 }}
                onChange={(event) => {
                  setSupportPhone(event.target.value);
                  clearFeedback();
                }}
                helperText="Si lo dejas vacío, se usa la configuración del servidor."
              />
              <Typography variant="subtitle2">Otros servicios (opcional)</Typography>
              {otherServices.map((service) => (
                <Stack
                  key={service.id}
                  spacing={1}
                >
                  <TextField
                    label="Nombre del servicio"
                    required
                    value={service.name}
                    disabled={sending}
                    inputProps={{ maxLength: 200 }}
                    onChange={(event) => {
                      setOtherServices((values) =>
                        values.map((value) =>
                          value.id === service.id ? { ...value, name: event.target.value } : value
                        )
                      );
                      clearFeedback();
                    }}
                  />
                  <TextField
                    label="Costo"
                    type="number"
                    required
                    value={service.cost}
                    disabled={sending}
                    inputProps={{ min: 0, step: '0.01' }}
                    onChange={(event) => {
                      setOtherServices((values) =>
                        values.map((value) =>
                          value.id === service.id ? { ...value, cost: event.target.value } : value
                        )
                      );
                      clearFeedback();
                    }}
                  />
                  <Button
                    type="button"
                    disabled={sending}
                    onClick={() => {
                      setOtherServices((values) =>
                        values.filter((value) => value.id !== service.id)
                      );
                      clearFeedback();
                    }}
                  >
                    Quitar servicio
                  </Button>
                </Stack>
              ))}
              <Button
                type="button"
                disabled={sending || otherServices.length >= 20}
                onClick={() => {
                  const id = serviceId.current++;
                  setOtherServices((values) => [...values, { id, name: '', cost: '' }]);
                  clearFeedback();
                }}
              >
                Agregar otro servicio
              </Button>
            </Stack>
          )}
          <Button
            variant="contained"
            type="submit"
            disabled={
              sending ||
              !selectedStore ||
              !validEmail(email) ||
              !validText(subject) ||
              (deliverySummary ? !deliveryFieldsValid : !validText(sorteoWinner))
            }
            startIcon={
              sending ? (
                <CircularProgress
                  size={18}
                  color="inherit"
                />
              ) : (
                <EmailOutlined />
              )
            }
          >
            {sending
              ? 'Enviando…'
              : deliverySummary
                ? 'Enviar resumen de entregas'
                : historical
                  ? 'Enviar reporte histórico'
                  : 'Enviar correo'}
          </Button>
          <Box aria-live="polite">
            {error && (
              <Alert
                severity="error"
                sx={{ mb: 2 }}
              >
                {error}
              </Alert>
            )}
            {result && item && (
              <Alert severity={error ? 'error' : item.status === 'sent' ? 'success' : 'info'}>
                <Typography>
                  {statusLabels[item.status] || 'Estado del correo para'} {item.email} (
                  {item.status}).
                </Typography>
                {result.campaignId && (
                  <Typography variant="body2">Campaña: {result.campaignId}</Typography>
                )}
                {result.campaignsCount !== undefined && (
                  <Typography variant="body2">
                    Campañas incluidas: {result.campaignsCount}
                  </Typography>
                )}
                {result.period && (
                  <Typography variant="body2">
                    Período: {result.period.start} a {result.period.end} (fin exclusivo)
                  </Typography>
                )}
                {deliverySummary && result.period?.timeZone && (
                  <Typography variant="body2">Zona horaria: {result.period.timeZone}</Typography>
                )}
                {deliverySummary && result.campaignIds?.length ? (
                  <Typography
                    variant="body2"
                    sx={{ overflowWrap: 'anywhere' }}
                  >
                    Campañas: {result.campaignIds.join(', ')}
                  </Typography>
                ) : null}
                {result.reportDate && (
                  <Typography variant="body2">Fecha del reporte: {result.reportDate}</Typography>
                )}
                {item.queued_reason && (
                  <Typography variant="body2">Motivo de cola: {item.queued_reason}</Typography>
                )}
              </Alert>
            )}
          </Box>
        </Stack>
      </Paper>
      {!historical && !deliverySummary && (
        <BulkSend
          userId={user.id}
          busy={sending}
          acquire={() => {
            if (sendingRef.current) return false;
            sendingRef.current = true;
            setSending(true);
            return true;
          }}
          release={() => {
            sendingRef.current = false;
            setSending(false);
          }}
        />
      )}
    </Box>
  );
}
