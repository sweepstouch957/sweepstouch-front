'use client';

/**
 * RCS de confirmación del sorteo: lo que le cae al participante cuando valida el
 * OTP y le sale su cupón con QR. Reemplaza al SMS de confirmación (que queda de
 * failover si el teléfono no tiene RCS). Se guarda en Sweepstake.confirmationRcs.
 */
import AddPhotoAlternateRoundedIcon from '@mui/icons-material/AddPhotoAlternateRounded';
import ChatBubbleRoundedIcon from '@mui/icons-material/ChatBubbleRounded';
import LinkRoundedIcon from '@mui/icons-material/LinkRounded';
import QrCode2RoundedIcon from '@mui/icons-material/QrCode2Rounded';
import VerifiedRoundedIcon from '@mui/icons-material/VerifiedRounded';
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  CircularProgress,
  Collapse,
  LinearProgress,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import { useMutation } from '@tanstack/react-query';
import React, { useEffect, useRef, useState } from 'react';
import { sweepstakesClient, type ConfirmationRcs } from '@/services/sweepstakes.service';
import { uploadCampaignImage } from '@/services/upload.service';

const EMPTY: ConfirmationRcs = {
  enabled: false,
  imageUrl: '',
  title: '',
  text: '',
  buttonText: '',
  buttonAction: 'success',
  buttonUrl: '',
};

const PLACEHOLDERS = [
  { tag: '{name}', label: 'Nombre' },
  { tag: '{code}', label: 'Nº de participación' },
  { tag: '{referralCode}', label: 'Código de referido' },
];

const BUTTON_ACTIONS: { value: 'success' | 'url'; label: string; hint: string; icon: React.ReactNode }[] = [
  {
    value: 'success',
    label: 'Su página de éxito',
    hint: 'Abre "¡Ya estás dentro!" con su código y QR. Si pierde la pantalla, la recupera desde el RCS en cualquier navegador.',
    icon: <QrCode2RoundedIcon />,
  },
  {
    value: 'url',
    label: 'Link personalizado',
    hint: 'Lo mandas a la página que quieras.',
    icon: <LinkRoundedIcon />,
  },
];

const SAMPLE = { '{name}': 'Ana', '{code}': 'SWP-482913', '{referralCode}': 'K7P2QX' };
const fillSample = (t = '') =>
  Object.entries(SAMPLE).reduce((acc, [k, v]) => acc.split(k).join(v), t);

interface Props {
  sweepstakeId: string;
  value?: ConfirmationRcs;
  sweepstakeName?: string;
  onSaved: (msg: string, ok: boolean) => void;
}

export default function SweepstakeConfirmationRcs({ sweepstakeId, value, sweepstakeName, onSaved }: Props) {
  const [form, setForm] = useState<ConfirmationRcs>({ ...EMPTY, ...value });
  const [uploadPct, setUploadPct] = useState<number | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const textRef = useRef<HTMLTextAreaElement | null>(null);

  // Un refetch del sorteo trae otro objeto con lo mismo: resetear sólo si cambió lo guardado
  // (si no, volver a la pestaña borraba lo que estabas escribiendo).
  const savedKey = JSON.stringify(value ?? null);
  useEffect(() => setForm({ ...EMPTY, ...value }), [savedKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const set = <K extends keyof ConfirmationRcs>(k: K, v: ConfirmationRcs[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const dirty = JSON.stringify(form) !== JSON.stringify({ ...EMPTY, ...value });
  const missingCopy = form.enabled && !form.text?.trim() && !form.imageUrl;
  const badUrl = form.buttonAction === 'url' && !/^https?:\/\/\S+/i.test(form.buttonUrl || '');

  const save = useMutation({
    mutationFn: (body: ConfirmationRcs) =>
      sweepstakesClient.updateSweepstake(sweepstakeId, { confirmationRcs: body }),
    onSuccess: () => onSaved('RCS de confirmación guardado ✅', true),
    onError: () => onSaved('No se pudo guardar el RCS de confirmación', false),
  });

  const upload = async (file: File) => {
    setUploadPct(0);
    try {
      const { url } = await uploadCampaignImage(file, 'sweepstakes-rcs', setUploadPct);
      set('imageUrl', url);
    } catch {
      onSaved('No se pudo subir la miniatura', false);
    } finally {
      setUploadPct(null);
    }
  };

  // Inserta el placeholder donde está el cursor del copy.
  const insertTag = (tag: string) => {
    const el = textRef.current;
    const t = form.text || '';
    const at = el?.selectionStart ?? t.length;
    set('text', t.slice(0, at) + tag + t.slice(el?.selectionEnd ?? at));
    requestAnimationFrame(() => {
      el?.focus();
      el?.setSelectionRange(at + tag.length, at + tag.length);
    });
  };

  return (
    <Card sx={{ mb: 3, borderRadius: 3 }}>
      <CardHeader
        avatar={
          <Avatar sx={{ bgcolor: 'primary.main', width: 40, height: 40 }}>
            <ChatBubbleRoundedIcon fontSize="small" />
          </Avatar>
        }
        title="RCS de confirmación"
        subheader="Le llega al participante cuando valida el OTP y obtiene su cupón con QR"
        action={
          <Stack
            direction="row"
            alignItems="center"
            spacing={1}
            sx={{ pr: 1, pt: 0.5 }}
          >
            <Typography
              variant="body2"
              fontWeight={700}
              color={form.enabled ? 'primary.main' : 'text.secondary'}
            >
              {form.enabled ? 'Activado' : 'Apagado'}
            </Typography>
            <Switch
              checked={form.enabled}
              onChange={(e) => set('enabled', e.target.checked)}
              inputProps={{ 'aria-label': '¿Enviar RCS de confirmación?' }}
            />
          </Stack>
        }
        sx={{
          '& .MuiCardHeader-title': { fontWeight: 800 },
          background: 'linear-gradient(90deg, rgba(252,12,131,0.10), rgba(156,39,176,0.10))',
          borderTopLeftRadius: 12,
          borderTopRightRadius: 12,
        }}
      />

      <CardContent>
        {!form.enabled && (
          <Typography
            variant="body2"
            color="text.secondary"
          >
            Apagado: el participante recibe el SMS de confirmación de siempre. Actívalo para mandarle
            una tarjeta RCS con imagen, texto y un botón.
          </Typography>
        )}

        <Collapse
          in={form.enabled}
          unmountOnExit
        >
          <Box
            sx={{
              display: 'grid',
              gap: { xs: 3, md: 4 },
              gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1fr) 320px' },
              alignItems: 'start',
            }}
          >
            {/* ===== Formulario ===== */}
            <Stack spacing={3}>
              <Section
                n={1}
                title="Miniatura"
                hint="Imagen de la tarjeta. Horizontal, JPG o PNG, menos de 1 MB."
              >
                <input
                  ref={fileRef}
                  aria-label="Subir miniatura del RCS"
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  hidden
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) upload(f);
                    e.target.value = '';
                  }}
                />
                <Box
                  role="button"
                  tabIndex={0}
                  onClick={() => uploadPct === null && fileRef.current?.click()}
                  onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && fileRef.current?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const f = e.dataTransfer.files?.[0];
                    if (f?.type.startsWith('image/')) upload(f);
                  }}
                  sx={{
                    position: 'relative',
                    aspectRatio: '16 / 9',
                    maxWidth: 420,
                    borderRadius: 3,
                    overflow: 'hidden',
                    cursor: 'pointer',
                    border: '2px dashed',
                    borderColor: form.imageUrl ? 'transparent' : 'divider',
                    bgcolor: 'action.hover',
                    transition: 'border-color .2s',
                    '&:hover, &:focus-visible': { borderColor: 'primary.main', outline: 'none' },
                    '&:hover .rcs-thumb-overlay': { opacity: 1 },
                  }}
                >
                  {form.imageUrl ? (
                    <>
                      <Box
                        component="img"
                        src={form.imageUrl}
                        alt="Miniatura del RCS"
                        sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                      />
                      <Stack
                        className="rcs-thumb-overlay"
                        alignItems="center"
                        justifyContent="center"
                        sx={{
                          position: 'absolute',
                          inset: 0,
                          bgcolor: 'rgba(0,0,0,.45)',
                          color: '#fff',
                          opacity: 0,
                          transition: 'opacity .2s',
                        }}
                      >
                        <Typography fontWeight={700}>Cambiar imagen</Typography>
                      </Stack>
                    </>
                  ) : (
                    <Stack
                      alignItems="center"
                      justifyContent="center"
                      spacing={1}
                      sx={{ height: '100%', color: 'text.secondary', px: 2, textAlign: 'center' }}
                    >
                      <AddPhotoAlternateRoundedIcon sx={{ fontSize: 40, color: 'primary.main' }} />
                      <Typography
                        variant="body2"
                        fontWeight={700}
                        color="text.primary"
                      >
                        Arrastra una imagen o haz clic para subirla
                      </Typography>
                      <Typography variant="caption">Sin imagen sale como mensaje de texto</Typography>
                    </Stack>
                  )}
                  {uploadPct !== null && (
                    <LinearProgress
                      variant={uploadPct > 0 ? 'determinate' : 'indeterminate'}
                      value={uploadPct}
                      sx={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 4 }}
                    />
                  )}
                </Box>
                {form.imageUrl && (
                  <Button
                    size="small"
                    color="inherit"
                    onClick={() => set('imageUrl', '')}
                    sx={{ mt: 1, alignSelf: 'flex-start' }}
                  >
                    Quitar imagen
                  </Button>
                )}
              </Section>

              <Section
                n={2}
                title="Copy"
                hint="Lo que lee el participante. Toca una etiqueta para insertarla donde está el cursor."
              >
                <Stack spacing={2}>
                  {form.imageUrl && (
                    <TextField
                      label="Título de la tarjeta"
                      placeholder={sweepstakeName || '¡Ya estás participando!'}
                      value={form.title}
                      onChange={(e) => set('title', e.target.value.slice(0, 200))}
                      fullWidth
                    />
                  )}
                  <TextField
                    label="Mensaje"
                    placeholder="¡Hola {name}! Ya estás participando 🎉 Tu número es {code}. Muestra tu cupón de $10 en caja."
                    value={form.text}
                    onChange={(e) => set('text', e.target.value.slice(0, 2000))}
                    inputRef={textRef}
                    multiline
                    minRows={4}
                    fullWidth
                    error={missingCopy}
                    helperText={missingCopy ? 'Escribe el mensaje o sube una imagen' : `${form.text?.length || 0}/2000`}
                  />
                  <Stack
                    direction="row"
                    gap={1}
                    flexWrap="wrap"
                  >
                    {PLACEHOLDERS.map((p) => (
                      <Chip
                        key={p.tag}
                        label={`${p.label} · ${p.tag}`}
                        variant="outlined"
                        size="small"
                        onClick={() => insertTag(p.tag)}
                      />
                    ))}
                  </Stack>
                </Stack>
              </Section>

              <Section
                n={3}
                title="Botón"
                hint="Un botón debajo de la tarjeta. ¿A dónde lo lleva?"
              >
                <Stack spacing={2}>
                  <Box
                    role="radiogroup"
                    aria-label="Acción del botón"
                    sx={{ display: 'grid', gap: 1.5, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' } }}
                  >
                    {BUTTON_ACTIONS.map((a) => {
                      const on = (form.buttonAction || 'success') === a.value;
                      return (
                        <Box
                          key={a.value}
                          role="radio"
                          aria-checked={on}
                          tabIndex={0}
                          onClick={() => set('buttonAction', a.value)}
                          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && set('buttonAction', a.value)}
                          sx={{
                            p: 1.75,
                            borderRadius: 2.5,
                            cursor: 'pointer',
                            border: '2px solid',
                            borderColor: on ? 'primary.main' : 'divider',
                            bgcolor: on ? 'rgba(252,12,131,0.06)' : 'transparent',
                            transition: 'border-color .2s, background-color .2s',
                            '&:hover, &:focus-visible': { borderColor: 'primary.main', outline: 'none' },
                          }}
                        >
                          <Stack
                            direction="row"
                            spacing={1.25}
                            alignItems="flex-start"
                          >
                            <Box sx={{ color: on ? 'primary.main' : 'text.secondary', mt: 0.25 }}>{a.icon}</Box>
                            <Box>
                              <Typography
                                variant="body2"
                                fontWeight={800}
                              >
                                {a.label}
                                {a.value === 'success' && (
                                  <Chip
                                    label="Recomendado"
                                    size="small"
                                    color="primary"
                                    sx={{ ml: 1, height: 18, fontSize: 10, fontWeight: 700 }}
                                  />
                                )}
                              </Typography>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                {a.hint}
                              </Typography>
                            </Box>
                          </Stack>
                        </Box>
                      );
                    })}
                  </Box>

                  <Stack
                    direction={{ xs: 'column', sm: 'row' }}
                    spacing={2}
                  >
                    <TextField
                      label="Texto del botón"
                      placeholder="Ver mi cupón"
                      value={form.buttonText}
                      onChange={(e) => set('buttonText', e.target.value.slice(0, 25))}
                      helperText={`${form.buttonText?.length || 0}/25`}
                      sx={{ flex: form.buttonAction === 'url' ? '0 0 200px' : 1 }}
                    />
                    {form.buttonAction === 'url' && (
                      <TextField
                        label="Link"
                        placeholder="https://…"
                        value={form.buttonUrl}
                        onChange={(e) => set('buttonUrl', e.target.value.trim())}
                        error={!!form.buttonUrl && badUrl}
                        helperText={
                          form.buttonUrl && badUrl ? 'Debe empezar con https://' : 'Admite {referralCode}'
                        }
                        fullWidth
                      />
                    )}
                  </Stack>
                </Stack>
              </Section>
            </Stack>

            {/* ===== Preview ===== */}
            <RcsPhonePreview
              form={form}
              fallbackTitle={sweepstakeName}
            />
          </Box>
        </Collapse>

        <Stack
          direction="row"
          justifyContent="flex-end"
          alignItems="center"
          spacing={1.5}
          sx={{ mt: 3 }}
        >
          {dirty && (
            <Typography
              variant="caption"
              color="text.secondary"
            >
              Cambios sin guardar
            </Typography>
          )}
          <Button
            variant="contained"
            size="large"
            disabled={!dirty || save.isPending || uploadPct !== null || missingCopy || (form.enabled && badUrl)}
            onClick={() => save.mutate(form)}
            startIcon={save.isPending ? <CircularProgress size={18}
color="inherit" /> : undefined}
            sx={{ borderRadius: 2, px: 4, fontWeight: 700 }}
          >
            Guardar RCS
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );
}

function Section({ n, title, hint, children }: { n: number; title: string; hint: string; children: React.ReactNode }) {
  return (
    <Stack spacing={1.5}>
      <Stack
        direction="row"
        spacing={1.5}
        alignItems="flex-start"
      >
        <Avatar
          sx={{
            width: 26,
            height: 26,
            fontSize: 13,
            fontWeight: 800,
            bgcolor: 'primary.main',
            mt: 0.25,
          }}
        >
          {n}
        </Avatar>
        <Box>
          <Typography fontWeight={800}>{title}</Typography>
          <Typography
            variant="body2"
            color="text.secondary"
          >
            {hint}
          </Typography>
        </Box>
      </Stack>
      <Stack sx={{ pl: { sm: 5.25 } }}>{children}</Stack>
    </Stack>
  );
}

/** Tarjeta RCS como se ve en Google Messages, con datos de ejemplo en los placeholders. */
function RcsPhonePreview({ form, fallbackTitle }: { form: ConfirmationRcs; fallbackTitle?: string }) {
  const text = fillSample(form.text);
  const btn = form.buttonText || 'Ver mi cupón';
  return (
    <Box
      position={{ md: 'sticky' }}
      top={16}
    >
      <Typography
        variant="caption"
        fontWeight={700}
        color="text.secondary"
        display="block"
        mb={0.75}
        textTransform="uppercase"
        letterSpacing={0.5}
      >
        Así le llega
      </Typography>
      <Box
        sx={{
          borderRadius: 6,
          border: '10px solid #111',
          overflow: 'hidden',
          bgcolor: '#fff',
        }}
      >
        <Stack
          direction="row"
          alignItems="center"
          spacing={1.2}
          sx={{ px: 2, py: 1.2, borderBottom: '1px solid #eee' }}
        >
          <Avatar sx={{ width: 30, height: 30, bgcolor: 'primary.main', fontSize: 14, fontWeight: 800 }}>S</Avatar>
          <Box lineHeight={1.1}>
            <Stack
              direction="row"
              alignItems="center"
              spacing={0.5}
            >
              <Typography
                variant="body2"
                fontWeight={700}
                color="#111"
              >
                Sweepstouch
              </Typography>
              <VerifiedRoundedIcon sx={{ fontSize: 14, color: '#1a73e8' }} />
            </Stack>
            <Typography
              variant="caption"
              color="#888"
            >
              Mensaje RCS
            </Typography>
          </Box>
        </Stack>

        <Box sx={{ p: 1.5, bgcolor: '#f6f7f9', minHeight: 300 }}>
          <Box
            sx={{
              bgcolor: '#fff',
              border: '1px solid #e4e4e7',
              borderRadius: 3,
              overflow: 'hidden',
              maxWidth: '92%',
            }}
          >
            {form.imageUrl && (
              <Box
                component="img"
                src={form.imageUrl}
                alt=""
                sx={{ width: '100%', height: 140, objectFit: 'cover', display: 'block' }}
              />
            )}
            <Box sx={{ p: 1.5 }}>
              {form.imageUrl && (
                <Typography
                  variant="body2"
                  fontWeight={800}
                  color="#111"
                  mb={0.5}
                >
                  {fillSample(form.title) || fallbackTitle || '¡Ya estás participando!'}
                </Typography>
              )}
              <Typography
                variant="body2"
                color={text ? '#333' : '#aaa'}
                whiteSpace="pre-wrap"
                sx={{ wordBreak: 'break-word' }}
              >
                {text || 'Escribe el mensaje…'}
              </Typography>
            </Box>
            <Box sx={{ borderTop: '1px solid #eee', py: 1, textAlign: 'center' }}>
              <Typography
                variant="body2"
                fontWeight={700}
                color="#1a73e8"
              >
                {btn}
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>
      <Typography
        variant="caption"
        color="text.secondary"
        display="block"
        mt={1}
      >
        Sin RCS en el teléfono, le llega el SMS de confirmación de siempre.
      </Typography>
    </Box>
  );
}
