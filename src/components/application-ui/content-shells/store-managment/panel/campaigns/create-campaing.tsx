// components/campaigns/CreateCampaignForm.tsx
'use client';

import PreviewPhone from '@/components/application-ui/dialogs/preview/preview-phone';
import { circularService } from '@/services/circular.service';
import { getStoreById } from '@/services/store.service';
import type { CampaignArtUpload } from '@/services/upload.service';
import { Sms } from '@mui/icons-material';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  Checkbox,
  Chip,
  Divider,
  FormControlLabel,
  Grid,
  Paper,
  Snackbar,
  Stack,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import CampaignArtDropzone from './CampaignArtDropzone';
import MixedRcsEditor, {
  mixedCustomFromTemplate,
  MixedRcsPreview,
  mixedTemplateFromCustom,
  type MixedRcsCustom,
} from './MixedRcsEditor';
import { smartInsert } from './placeholderInsert';
import { useCampaignArtUpload } from './useCampaignArtUpload';

interface CampaignFormInputs {
  title: string;
  description: string;
  content: string;
  type: string;
  startDate: Date;
  estimatedCost: number;
  image?: string;
  imageUrl?: string;
  imagePublicId?: string;
  /** Miniatura para el linktree (Pre-RCS). Opcional: sin ella se usa `image`. */
  thumbnail?: string;
  thumbnailImage?: string;
  thumbnailPublicId?: string;
  /** Al editar: se quitó el arte guardado (sin esto el contenedor volvía a poner el viejo). */
  imageRemoved?: boolean;
  /** Arte ya subido y comprimido al elegirlo (el contenedor no lo vuelve a subir). */
  uploadedArt?: CampaignArtUpload;
  customAudience?: number;
  linktree?: boolean; // 👈 nuevo parámetro
  /** Piloto mixed: SMS/MMS normal + un 10% de los clientes con nombre por RCS personalizado. */
  channel?: 'sms' | 'mixed';
  /** Sólo en mixed: { mixedRatio?, contentTemplate? (RCS personalizado, type "MIXED") }. */
  rcsOptions?: Record<string, unknown>;
}

const placeholders = [
  { key: '#n', label: 'Salto de línea' },
  // Se reemplaza POR CLIENTE en el envío (scheduler-service): cada quien recibe
  // su nombre; sin nombre real el placeholder se omite limpio ("Hola," y ya).
  {
    key: '#name',
    label: 'Nombre del cliente — personalizado para cada uno; si no tiene, se omite',
  },
  { key: '#storeName', label: 'Nombre de la tienda' },
  { key: '#referralLink', label: 'Link de referido' },
  { key: '#disclaimer', label: 'Texto legal' },
  { key: '#linktree', label: 'Linktree de la tienda' }, // 👈 nuevo placeholder
  // El mismo destino que #linktree pero por el short permanente de la tienda
  // (swtrcs.com/s/XXXXXX): ~60 caracteres menos, que en SMS es un segmento menos.
  {
    key: '#linktreeShort',
    label: 'Linktree corto — swtrcs.com/s/… (mismo link, 60 caracteres menos)',
  },
  { key: '#lead', label: 'Lead / Completar perfil' },
  { key: '#linkrcs', label: 'Link RCS único por cliente (activa el flujo RCS)' },
  {
    key: '#linkprercs',
    label: 'Link Pre-RCS único por cliente (sólo ofertas + QR de caja)',
  },
  // Linktree CON la sesión del cliente adentro: entra a la lista, las ofertas, el circular
  // y los premios sin que le pidan el código. El link vence a los 30 días.
  {
    key: '#linklogin',
    label: 'Linktree con sesión — entra sin código (link corto, vence en 30 días)',
  },
  { key: '#ahorro', label: 'Ahorro semanal de la tienda ($)' },
];

const SHORTENER_DOMAINS = [
  'bit.ly',
  'bitly.com',
  'j.mp',
  'tinyurl.com',
  't.co',
  'goo.gl',
  'ow.ly',
  'buff.ly',
  'is.gd',
  'v.gd',
  'rebrand.ly',
  'cutt.ly',
  'shorturl.at',
  'tiny.cc',
  'rb.gy',
  's.id',
  'lnkd.in',
  'amzn.to',
  'fb.me',
  'youtu.be',
  'wp.me',
  'trib.al',
  'dlvr.it',
  'ift.tt',
  'adf.ly',
  'bit.do',
  'mcaf.ee',
  'qr.ae',
  'po.st',
  'su.pr',
  'linktr.ee',
];

const SHORTENER_DOMAIN_SET = new Set(SHORTENER_DOMAINS);

const URL_DOMAIN_REGEX =
  /(?:https?:\/\/)?(?:www\.)?([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+)(?::\d+)?(?:\/[^\s]*)?/gi;

const findShortenerDomains = (message: string) => {
  const matchedDomains = new Set<string>();

  for (const match of message.matchAll(URL_DOMAIN_REGEX)) {
    const domain = match[1]?.toLowerCase();

    if (!domain) {
      continue;
    }

    const domainParts = domain.split('.');

    for (let index = 0; index < domainParts.length - 1; index += 1) {
      const domainSuffix = domainParts.slice(index).join('.');

      if (SHORTENER_DOMAIN_SET.has(domainSuffix)) {
        matchedDomains.add(domainSuffix);
        break;
      }
    }
  }

  return Array.from(matchedDomains);
};

/**
 * Bloque titulado del formulario. Los campos estaban todos apilados en una sola columna sin
 * jerarquía: agruparlos (mensaje / imágenes / audiencia / piloto) deja claro de un vistazo
 * qué es cada cosa y cuánto falta para terminar.
 */
function Section({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <Box
      component="section"
      sx={{ '& + &': { mt: 4 } }}
    >
      <Typography
        variant="subtitle1"
        fontWeight={700}
      >
        {title}
      </Typography>
      {hint && (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ display: 'block', mb: 1.5 }}
        >
          {hint}
        </Typography>
      )}
      <Box sx={{ mt: hint ? 0 : 1.5 }}>{children}</Box>
    </Box>
  );
}

/**
 * Sólo DOS pestañas. Todo lo que define la campaña (texto, imágenes y a quién se le manda)
 * es una sola lectura de arriba abajo; el RCS del piloto va aparte porque es opcional y
 * largo. Con cuatro pestañas había que adivinar dónde estaba cada cosa.
 */
const STEPS = [
  { key: 'mensaje', label: 'Mensaje' },
  { key: 'rcs', label: 'RCS (piloto)' },
] as const;
type StepKey = (typeof STEPS)[number]['key'];

/** Inserta en el cursor sólo con los espacios que hacen falta (ver placeholderInsert). */
const insertAtCursor = (inputEl: HTMLTextAreaElement, token: string) => {
  const { text, caret } = smartInsert(
    inputEl.value,
    inputEl.selectionStart,
    inputEl.selectionEnd,
    token
  );
  inputEl.value = text;
  inputEl.setSelectionRange(caret, caret);
  inputEl.focus();
  return text;
};

export default function CreateCampaignForm({
  onSubmit,
  provider,
  phoneNumber,
  totalAudience,
  initialValues,
  isEditing = false,
  storeId,
}: {
  /** Para la vista previa del RCS del piloto (nombre, dirección y catálogo de la tienda). */
  storeId?: string;
  onSubmit: (data: CampaignFormInputs) => void;
  provider: string;
  phoneNumber: string;
  totalAudience: number;
  initialValues?: Partial<CampaignFormInputs>;
  isEditing?: boolean;
}) {
  const {
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CampaignFormInputs>({
    defaultValues: {
      title: initialValues?.title || '',
      description: initialValues?.description || '',
      content: initialValues?.content || '',
      estimatedCost: initialValues?.estimatedCost || 0.0015,
      startDate: initialValues?.startDate ? new Date(initialValues.startDate) : new Date(),
      linktree: initialValues?.linktree ?? false,
      channel: initialValues?.channel === 'mixed' ? 'mixed' : 'sms',
    },
    mode: 'onBlur',
  });
  const channel = watch('channel');

  const [useFullAudience, setUseFullAudience] = useState(!initialValues?.customAudience);
  const [step, setStep] = useState<StepKey>('mensaje');
  // Vista previa: una sola, con pestañas. Antes había dos teléfonos a la vez en pantalla
  // (el del SMS/MMS y el del RCS) y no se entendía cuál era cuál.
  const [previewTab, setPreviewTab] = useState<'sms' | 'rcs'>('sms');
  const [previewOpen, setPreviewOpen] = useState(false); // sólo móvil
  const contentRef = useRef<HTMLTextAreaElement | null>(null);

  const [snackState, setSnackState] = useState<{
    open: boolean;
    message: string;
    severity: 'error' | 'warning' | 'info' | 'success';
  }>({
    open: false,
    message: '',
    severity: 'error',
  });

  const isPhoneMissing = !phoneNumber || phoneNumber.trim() === '';

  const image = watch('image');
  const content = watch('content');
  const estimatedCost = watch('estimatedCost');
  const customAudience = watch('customAudience');
  const startDate = watch('startDate');
  const shortenerDomains = useMemo(() => findShortenerDomains(content || ''), [content]);
  const hasShortenerLinks = shortenerDomains.length > 0;

  useEffect(() => {
    if (image && (image as any).length > 0) {
      setValue('estimatedCost', 0.06);
    } else {
      setValue('estimatedCost', 0.04);
    }
  }, [image, setValue]);

  const currentLength = content?.length || 0;

  // Piloto mixto: RCS personalizado de los elegidos. Viaja en rcsOptions.contentTemplate.
  const [mixedRcs, setMixedRcs] = useState<MixedRcsCustom>(() =>
    mixedCustomFromTemplate((initialValues as any)?.rcsOptions?.contentTemplate)
  );
  // Tienda + catálogo visible: sólo con el piloto marcado (vista previa, aviso de "sin
  // productos para armar lista" y cards de productos).
  const mixedStore = useQuery({
    queryKey: ['campaign-form-store', storeId],
    queryFn: () => getStoreById(storeId as string),
    enabled: !!storeId && channel === 'mixed',
    staleTime: 5 * 60_000,
  });
  const mixedSlug = (mixedStore.data as any)?.slug as string | undefined;
  const mixedCatalog = useQuery({
    queryKey: ['campaign-form-catalog', mixedSlug],
    queryFn: () => circularService.getStoreCatalog(mixedSlug as string),
    enabled: !!mixedSlug && channel === 'mixed',
    staleTime: 60_000,
  });

  // Imagen de la vista previa. El object URL de un archivo recién elegido se crea en un
  // efecto y se REVOCA al cambiar de imagen o desmontar (en un useMemo quedaba vivo hasta
  // recargar la página). Sólo con el piloto marcado: sin él no hay vista previa.
  const [mixedPreviewImage, setMixedPreviewImage] = useState('');
  useEffect(() => {
    const f: any = (image as any)?.[0];
    if (channel === 'mixed' && f instanceof File) {
      const url = URL.createObjectURL(f);
      setMixedPreviewImage(url);
      return () => URL.revokeObjectURL(url);
    }
    setMixedPreviewImage(
      (typeof f === 'string' && f) ||
        f?.url ||
        (typeof initialValues?.image === 'string' ? initialValues.image : '') ||
        ''
    );
    return undefined;
  }, [image, channel, initialValues?.image]);

  // Sólo en mixed se manda rcsOptions (conservando mixedRatio al editar). En "sms" no se
  // toca: el payload queda idéntico al de siempre.
  // El arte se sube y comprime al elegirlo: el resumen de la conversión se ve antes de crear.
  const art = useCampaignArtUpload();

  const submit = (raw: CampaignFormInputs) => {
    const data = art.result ? { ...raw, uploadedArt: art.result } : raw;
    if (data.channel !== 'mixed') return onSubmit(data);
    const ratio = (initialValues as any)?.rcsOptions?.mixedRatio;
    const contentTemplate = mixedTemplateFromCustom(mixedRcs);
    return onSubmit({
      ...data,
      rcsOptions: {
        ...(ratio ? { mixedRatio: ratio } : {}),
        ...(contentTemplate ? { contentTemplate } : {}),
      },
    } as CampaignFormInputs);
  };

  const campaignType =
    channel === 'mixed'
      ? 'MIXED'
      : (initialValues?.type && initialValues.type !== 'MIXED' ? initialValues.type : null) ||
        ((image as any)?.length ? 'MMS' : 'SMS');
  const audienceCount = useFullAudience ? totalAudience : Number(customAudience) || 0;
  // Mientras se optimiza la imagen no se crea: saldría con la subida a medias.
  const canSubmit = !isPhoneMissing && !hasShortenerLinks && !art.busy;

  // Los campos siguen TODOS montados (sólo se ocultan): así react-hook-form conserva los
  // valores y la validación del submit ve el formulario completo, esté en la pestaña que esté.
  const paneSx = (k: StepKey) => ({ display: step === k ? 'block' : 'none' });

  return (
    <Box>
      <form onSubmit={handleSubmit(submit)}>
        <Grid
          container
          spacing={3}
          alignItems="flex-start"
        >
          <Grid
            item
            xs={12}
            lg={8}
            order={{ xs: 1, lg: 1 }}
          >
            <Card
              variant="outlined"
              sx={{ p: { xs: 2, sm: 3 } }}
            >
              <Stack
                direction="row"
                alignItems="center"
                spacing={2}
                sx={{ pb: 2, mb: 3, borderBottom: '1px solid', borderColor: 'divider' }}
              >
                <Avatar>
                  <Sms />
                </Avatar>
                <Box sx={{ minWidth: 0 }}>
                  <Typography
                    variant="subtitle1"
                    fontWeight={700}
                    noWrap
                  >
                    Se envía desde {phoneNumber}
                  </Typography>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ letterSpacing: '.06em', textTransform: 'uppercase', fontWeight: 600 }}
                  >
                    Proveedor: {provider} · Tipo: {campaignType}
                  </Typography>
                </Box>
                {/* El número desde el que sale está verificado con el proveedor: decirlo acá
                    evita la pregunta de siempre antes de mandar a 50.000 personas. */}
                <Chip
                  size="small"
                  icon={
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        bgcolor: '#22C55E',
                        ml: '10px !important',
                      }}
                    />
                  }
                  label="Número verificado"
                  sx={{
                    ml: 'auto',
                    flexShrink: 0,
                    fontWeight: 600,
                    fontSize: 12,
                    color: '#15803D',
                    bgcolor: '#EAF8EF',
                    borderRadius: 999,
                    display: { xs: 'none', sm: 'inline-flex' },
                  }}
                />
              </Stack>

              <Tabs
                value={step}
                onChange={(_e, v) => setStep(v)}
                variant="scrollable"
                scrollButtons="auto"
                allowScrollButtonsMobile
                sx={{ mb: 3, borderBottom: '1px solid', borderColor: 'divider' }}
              >
                {STEPS.map((s) => (
                  <Tab
                    key={s.key}
                    value={s.key}
                    disableRipple={false}
                    sx={{ textTransform: 'none', fontWeight: 700, minHeight: 48 }}
                    label={
                      s.key === 'rcs' && channel === 'mixed' ? (
                        <Stack
                          direction="row"
                          alignItems="center"
                          gap={0.75}
                        >
                          {s.label}
                          <Box
                            sx={{
                              width: 8,
                              height: 8,
                              borderRadius: '50%',
                              bgcolor: 'primary.main',
                            }}
                          />
                        </Stack>
                      ) : (
                        s.label
                      )
                    }
                  />
                ))}
              </Tabs>

              <Box sx={paneSx('mensaje')}>
                <Section
                  title="Mensaje"
                  hint="Es el texto que recibe el cliente por SMS o MMS."
                >
                  <Grid
                    container
                    spacing={2}
                  >
                    <Grid
                      item
                      xs={12}
                      sm={7}
                    >
                      <Controller
                        name="title"
                        control={control}
                        rules={{ required: 'Poné un título para identificar la campaña' }}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            label="Título de la campaña"
                            fullWidth
                            error={!!errors.title}
                            helperText={
                              errors.title?.message || 'Sólo para identificarla en el panel'
                            }
                          />
                        )}
                      />
                    </Grid>

                    <Grid
                      item
                      xs={12}
                      sm={5}
                    >
                      <Controller
                        name="startDate"
                        control={control}
                        rules={{ required: 'Start date is required' }}
                        render={({ field }) => (
                          <DateTimePicker
                            {...field}
                            label="Fecha y hora de envío"
                            sx={{ width: '100%' }}
                          />
                        )}
                      />
                    </Grid>

                    <Grid
                      item
                      xs={12}
                    >
                      <Controller
                        name="content"
                        control={control}
                        rules={{ required: 'Message content is required' }}
                        render={({ field }) => {
                          const handleChange = (e: any) => {
                            const value = e.target.value || '';
                            if (value.length > 2047) {
                              setSnackState({
                                open: true,
                                message:
                                  'Message content cannot exceed 2047 characters (max 2047).',
                                severity: 'error',
                              });
                              return;
                            }
                            field.onChange(e);
                          };

                          return (
                            <>
                              <TextField
                                {...field}
                                inputRef={(el) => {
                                  if (el) contentRef.current = el;
                                }}
                                label="Texto del mensaje"
                                fullWidth
                                multiline
                                rows={7}
                                placeholder={`Ej: Hola #name, aprovecha las ofertas en #storeName...`}
                                error={!!errors.content}
                                helperText={errors.content?.message}
                                onChange={handleChange}
                                sx={{
                                  '& .MuiInputBase-root': {
                                    fontFamily: 'monospace',
                                    // 16px en móvil: por debajo de eso iOS hace zoom al enfocar
                                    // el campo y deja la página descuadrada.
                                    fontSize: { xs: 16, sm: 14 },
                                    lineHeight: 1.6,
                                    whiteSpace: 'pre-wrap',
                                  },
                                }}
                              />
                              <Box
                                mt={0.5}
                                display="flex"
                                justifyContent="space-between"
                              >
                                <Typography
                                  variant="body2"
                                  color="text.secondary"
                                  sx={{ fontSize: 12.5 }}
                                >
                                  Cada 160 caracteres cuentan como un mensaje
                                </Typography>
                                <Typography
                                  variant="body2"
                                  color={currentLength > 1900 ? 'warning.main' : 'text.secondary'}
                                  sx={{ fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}
                                >
                                  {currentLength} / 2047
                                </Typography>
                              </Box>
                              {hasShortenerLinks && (
                                <Alert
                                  severity="warning"
                                  sx={{
                                    mt: 1,
                                    color: 'error.main',
                                    fontSize: '0.95rem',
                                    fontWeight: 600,
                                    '& .MuiAlert-icon': {
                                      color: 'error.main',
                                    },
                                    '& .MuiAlert-message': {
                                      fontSize: 'inherit',
                                    },
                                  }}
                                >
                                  El mensaje contiene un short link generado por un sitio marcado
                                  por{' '}
                                  <Box
                                    component="span"
                                    sx={{ fontStyle: 'italic' }}
                                  >
                                    desconfianza
                                  </Box>{' '}
                                  o{' '}
                                  <Box
                                    component="span"
                                    sx={{ fontStyle: 'italic' }}
                                  >
                                    spam
                                  </Box>
                                  , debe cambiarlo por otro enlace o quitarlo del mensaje.
                                </Alert>
                              )}
                            </>
                          );
                        }}
                      />
                    </Grid>

                    <Grid
                      item
                      xs={12}
                    >
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ display: 'block', mb: 1, fontSize: 12.5 }}
                      >
                        Toca uno para insertarlo donde está el cursor. Se reemplaza por cliente al
                        enviar.
                      </Typography>
                      <Box
                        display="flex"
                        flexWrap="wrap"
                        gap={0.75}
                      >
                        {placeholders.map((ph) => (
                          <Tooltip
                            title={ph.label}
                            key={ph.key}
                          >
                            <Chip
                              label={ph.key}
                              clickable
                              // Altura táctil: con size="small" (24 px) es casi imposible
                              // acertarle en el teléfono.
                              sx={{
                                height: { xs: 36, sm: 30 },
                                fontSize: { xs: 14, sm: 13 },
                                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                                fontWeight: 600,
                                borderRadius: 1.5,
                                bgcolor: 'action.hover',
                                border: '1px solid',
                                borderColor: 'divider',
                                '&:hover': {
                                  bgcolor: 'action.selected',
                                  borderColor: 'primary.main',
                                },
                              }}
                              onClick={() => {
                                if (contentRef.current) {
                                  const updatedText = insertAtCursor(contentRef.current, ph.key);
                                  if (updatedText.length > 2047) {
                                    setSnackState({
                                      open: true,
                                      message:
                                        'Message content cannot exceed 2047 characters (max 2047).',
                                      severity: 'error',
                                    });
                                    // revertimos visualmente al valor anterior del form
                                    contentRef.current.value = content || '';
                                    return;
                                  }
                                  setValue('content', updatedText);
                                }
                              }}
                            />
                          </Tooltip>
                        ))}
                      </Box>
                    </Grid>

                    <Grid
                      item
                      xs={12}
                    >
                      <Controller
                        name="description"
                        control={control}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            label="Nota interna (opcional)"
                            placeholder="No se envía al cliente"
                            fullWidth
                            multiline
                            rows={2}
                          />
                        )}
                      />
                    </Grid>
                  </Grid>
                </Section>

                <Divider sx={{ my: 4 }} />

                {/* La miniatura del linktree se sacó de acá (sep 2026): el banner que se ve
                    arriba de las ofertas ahora se maneja en Circular y Listas, con su propia
                    vigencia e histórico. La campaña sólo define la imagen que viaja en el MMS.
                    El campo `thumbnailImage` de las campañas viejas no se toca. */}
                <Section
                  title="Imagen de campaña"
                  hint="Viaja en el MMS y de ella salen los productos y el banner de la lista. Sin imagen, la campaña sale como SMS de texto."
                >
                  <CampaignArtDropzone
                    file={(image as any)?.[0] instanceof File ? (image as any)[0] : null}
                    initialUrl={
                      typeof initialValues?.image === 'string' ? initialValues.image : undefined
                    }
                    onError={(message) => setSnackState({ open: true, message, severity: 'error' })}
                    upload={art.state}
                    onRetry={art.retry}
                    onChange={(file) => {
                      void art.start(file);
                      if (file) {
                        const dt = new DataTransfer();
                        dt.items.add(file);
                        setValue('image', dt.files as any, { shouldValidate: true });
                        setValue('imageRemoved', false);
                      } else {
                        setValue('image', undefined);
                        setValue('imageRemoved', true);
                      }
                    }}
                  />
                </Section>

                <Divider sx={{ my: 4 }} />

                <Section
                  title="Audiencia"
                  hint="A cuántos clientes de la tienda se le envía."
                >
                  <Stack
                    direction={{ xs: 'column', sm: 'row' }}
                    alignItems={{ sm: 'center' }}
                    spacing={2}
                  >
                    <FormControlLabel
                      sx={{ mr: 0 }}
                      control={
                        <Checkbox
                          checked={useFullAudience}
                          onChange={(e) => {
                            setUseFullAudience(e.target.checked);
                            if (e.target.checked) {
                              setValue('customAudience', undefined);
                            }
                          }}
                        />
                      }
                      label={`Toda la audiencia (${totalAudience.toLocaleString()} clientes)`}
                    />

                    {!useFullAudience && (
                      <Controller
                        name="customAudience"
                        control={control}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            type="number"
                            label="Cuántos clientes"
                            size="small"
                            sx={{ maxWidth: 220 }}
                            inputProps={{ min: 1, max: totalAudience }}
                            helperText={`Máximo ${totalAudience.toLocaleString()}`}
                          />
                        )}
                      />
                    )}
                  </Stack>
                </Section>
              </Box>

              {/* Piloto mixed (sep 2026): la campaña sale igual que siempre, pero un 10% de los
                  clientes CON nombre recibe un RCS "Hi Nombre!" con botón al linktree (mismo
                  SMS como failover). */}
              <Box sx={paneSx('rcs')}>
                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  alignItems={{ sm: 'flex-start' }}
                  justifyContent="space-between"
                  gap={1}
                >
                  <Box>
                    <FormControlLabel
                      sx={{ mr: 0 }}
                      control={
                        <Checkbox
                          checked={channel === 'mixed'}
                          onChange={(e) => setValue('channel', e.target.checked ? 'mixed' : 'sms')}
                        />
                      }
                      label={
                        <Typography
                          variant="subtitle1"
                          fontWeight={700}
                        >
                          Piloto mixto: RCS para los clientes con nombre
                        </Typography>
                      }
                    />
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ maxWidth: 780, mt: 0.5 }}
                    >
                      El resto recibe el SMS o MMS normal. Los elegidos ven un mensaje con su nombre
                      y un botón; si su teléfono no tiene RCS, les llega el SMS igual. Con 50
                      clientes con nombre o menos, van todos. El costo no cambia.
                    </Typography>
                  </Box>
                  {channel === 'mixed' && (
                    <Chip
                      size="small"
                      color="primary"
                      label="Activo"
                      sx={{ fontWeight: 700, flexShrink: 0 }}
                    />
                  )}
                </Stack>

                {channel !== 'mixed' && (
                  <Alert
                    severity="info"
                    sx={{ mt: 2 }}
                  >
                    Con el piloto apagado, la campaña sale sólo por SMS o MMS. Activalo para que los
                    clientes con nombre reciban además un RCS con botones.
                  </Alert>
                )}

                {channel === 'mixed' && (
                  <>
                    <Divider sx={{ my: 3 }} />
                    <Section
                      title="Personalizar el RCS"
                      hint="Opcional. No cambia el SMS/MMS del resto ni el mensaje de respaldo. Mirá cómo queda en la vista previa."
                    >
                      <MixedRcsEditor
                        value={mixedRcs}
                        onChange={setMixedRcs}
                        smsText={content || ''}
                        imageSrc={mixedPreviewImage}
                        storeName={mixedStore.data?.name}
                        storeAddress={mixedStore.data?.address}
                        products={mixedCatalog.data?.items ?? []}
                        productsLoaded={mixedCatalog.isSuccess}
                      />
                    </Section>
                  </>
                )}
              </Box>
            </Card>
          </Grid>

          {/* UNA sola vista previa, con pestañas. Antes eran dos teléfonos a la vez (el del
              SMS/MMS en el resumen y el del RCS dentro del editor) y no se sabía cuál era cuál.
              En el teléfono se despliega con un botón para no comerse la pantalla. */}
          <Grid
            item
            xs={12}
            lg={4}
            // order explícito: sin esto el panel quedaba A LA IZQUIERDA del formulario,
            // porque el Grid del formulario declara order 1 y este caía en el 0 por defecto.
            order={{ xs: 2, lg: 2 }}
          >
            <Box sx={{ position: { lg: 'sticky' }, top: { lg: 24 } }}>
              <Button
                fullWidth
                variant="outlined"
                onClick={() => setPreviewOpen((v) => !v)}
                sx={{ display: { lg: 'none' }, minHeight: 44, mb: previewOpen ? 2 : 0 }}
              >
                {previewOpen ? 'Ocultar vista previa' : 'Ver vista previa'}
              </Button>

              <Box sx={{ display: { xs: previewOpen ? 'block' : 'none', lg: 'block' } }}>
                <Paper
                  variant="outlined"
                  sx={{ p: 2, mb: 2, borderRadius: 2 }}
                >
                  <Typography
                    variant="subtitle2"
                    fontWeight={700}
                    gutterBottom
                  >
                    Resumen del envío
                  </Typography>
                  <Stack gap={0.5}>
                    {[
                      ['Tipo', campaignType],
                      ['Audiencia', `${audienceCount.toLocaleString()} clientes`],
                      [
                        'Inicio',
                        startDate
                          ? new Date(startDate).toLocaleString('es', {
                              dateStyle: 'medium',
                              timeStyle: 'short',
                            })
                          : '—',
                      ],
                      ['Costo estimado', `$${(estimatedCost * audienceCount).toFixed(2)}`],
                    ].map(([k, v]) => (
                      <Stack
                        key={k}
                        direction="row"
                        justifyContent="space-between"
                        gap={2}
                      >
                        <Typography
                          variant="body2"
                          color="text.secondary"
                        >
                          {k}
                        </Typography>
                        <Typography
                          variant="body2"
                          fontWeight={600}
                          sx={{ textAlign: 'right' }}
                        >
                          {v}
                        </Typography>
                      </Stack>
                    ))}
                  </Stack>
                </Paper>

                {channel === 'mixed' && (
                  <Tabs
                    value={previewTab}
                    onChange={(_e, v) => setPreviewTab(v)}
                    variant="fullWidth"
                    sx={{ mb: 1.5, minHeight: 40 }}
                  >
                    <Tab
                      value="sms"
                      label="SMS/MMS"
                      sx={{ textTransform: 'none', fontWeight: 700, minHeight: 40 }}
                    />
                    <Tab
                      value="rcs"
                      label="RCS"
                      sx={{ textTransform: 'none', fontWeight: 700, minHeight: 40 }}
                    />
                  </Tabs>
                )}

                {channel === 'mixed' && previewTab === 'rcs' ? (
                  <Box>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      display="block"
                      sx={{ mb: 0.75 }}
                    >
                      Lo que ve un cliente elegido (ejemplo: Maria)
                    </Typography>
                    <Box sx={{ p: 1.5, borderRadius: 4, bgcolor: 'action.hover' }}>
                      <MixedRcsPreview
                        value={mixedRcs}
                        smsText={content || ''}
                        imageSrc={mixedPreviewImage}
                        storeName={mixedStore.data?.name}
                        storeAddress={mixedStore.data?.address}
                        products={mixedCatalog.data?.items ?? []}
                      />
                    </Box>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      display="block"
                      sx={{ mt: 1 }}
                    >
                      Si el teléfono no tiene RCS, le llega el SMS/MMS de al lado.
                    </Typography>
                  </Box>
                ) : (
                  <PreviewPhone
                    content={content}
                    image={(image as any)?.[0] || initialValues?.image}
                  />
                )}
              </Box>
            </Box>
          </Grid>
        </Grid>

        {/* Barra de acciones pegada abajo: el formulario es largo y había que bajar hasta el
            final para encontrar el botón. */}
        <Paper
          variant="outlined"
          sx={{
            position: 'sticky',
            // En el teléfono se pega al borde inferior de la pantalla, por encima de la barra
            // de gestos (safe-area). En desktop queda dentro del contenido.
            bottom: { xs: 0, sm: 0 },
            zIndex: (t) => t.zIndex.appBar - 1,
            mt: 3,
            mx: { xs: -2, sm: 0 },
            px: { xs: 2, sm: 3 },
            pt: 2,
            pb: { xs: 'calc(16px + env(safe-area-inset-bottom))', sm: 2 },
            borderRadius: { xs: 0, sm: 1 },
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 1.5,
            bgcolor: 'background.paper',
            boxShadow: { xs: '0 -4px 16px rgba(0,0,0,.08)', sm: 'none' },
          }}
        >
          <Box sx={{ minWidth: 0, flex: { xs: '1 1 100%', sm: '1 1 auto' } }}>
            {isPhoneMissing ? (
              <Stack
                direction="row"
                alignItems="center"
                gap={0.75}
                sx={{ color: 'error.main' }}
              >
                <ErrorOutlineIcon fontSize="small" />
                <Typography
                  variant="body2"
                  fontWeight={600}
                >
                  La tienda no tiene número asignado: no se puede enviar.
                </Typography>
              </Stack>
            ) : hasShortenerLinks ? (
              <Stack
                direction="row"
                alignItems="center"
                gap={0.75}
                sx={{ color: 'error.main' }}
              >
                <ErrorOutlineIcon fontSize="small" />
                <Typography
                  variant="body2"
                  fontWeight={600}
                >
                  Quitá el link de {shortenerDomains.join(', ')} para poder enviar.
                </Typography>
              </Stack>
            ) : (
              <Typography
                variant="body2"
                color="text.secondary"
              >
                {campaignType} · {audienceCount.toLocaleString()} clientes
                {channel === 'mixed' ? ' · con piloto mixto' : ''}
              </Typography>
            )}
          </Box>

          <Box
            display="flex"
            gap={1.5}
            sx={{ flex: { xs: '1 1 100%', sm: '0 0 auto' } }}
          >
            <Button
              variant="outlined"
              sx={{ minHeight: 44, flex: { xs: 1, sm: 'none' } }}
            >
              Borrador
            </Button>
            <Button
              variant="contained"
              type="submit"
              disabled={!canSubmit}
              sx={{ minHeight: 44, flex: { xs: 2, sm: 'none' } }}
            >
              {art.busy
                ? 'Optimizando imagen…'
                : isEditing
                  ? 'Actualizar campaña'
                  : 'Crear campaña'}
            </Button>
          </Box>
        </Paper>
      </form>
      <Snackbar
        open={snackState.open}
        autoHideDuration={4000}
        onClose={() => setSnackState((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackState((s) => ({ ...s, open: false }))}
          severity={snackState.severity}
          variant="filled"
          sx={{ width: '100%', borderRadius: 2 }}
        >
          {snackState.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
