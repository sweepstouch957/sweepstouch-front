'use client';

/**
 * Personalización del RCS del piloto mixto (el que recibe el 10% con nombre, o los ≤50).
 * SÓLO cambia ese RCS: el SMS/MMS del resto y el failover salen con el texto de la campaña.
 * Se guarda en `rcsOptions.contentTemplate` con type "MIXED"; el scheduler
 * (utils/mixed.js → normalizeMixedCustom) valida cada campo y, ante cualquier cosa rara,
 * manda el RCS por defecto. Campo vacío = valor por defecto.
 */

import { Box, Button, Chip, FormControlLabel, Stack, Switch, TextField, Typography } from '@mui/material';
import { useRef } from 'react';

export type MixedRcsCustom = {
  greeting: string;
  title: string;
  body: string;
  buttonText: string;
  buttonUrl: string;
  includeImage: boolean;
};

export const MIXED_RCS_DEFAULTS: MixedRcsCustom = {
  greeting: 'Hi #name!',
  title: '',
  body: '',
  buttonText: 'More deals here!',
  buttonUrl: '',
  includeImage: true,
};

export const mixedCustomFromTemplate = (tpl: any): MixedRcsCustom =>
  tpl && tpl.type === 'MIXED'
    ? {
        greeting: typeof tpl.greeting === 'string' ? tpl.greeting : MIXED_RCS_DEFAULTS.greeting,
        title: tpl.title || '',
        body: tpl.body || '',
        buttonText: tpl.buttonText || MIXED_RCS_DEFAULTS.buttonText,
        buttonUrl: tpl.buttonUrl || '',
        includeImage: tpl.includeImage !== false,
      }
    : MIXED_RCS_DEFAULTS;

/** Lo que viaja al backend. Sin cambios respecto del default → undefined (RCS estándar). */
export function mixedTemplateFromCustom(c: MixedRcsCustom): Record<string, unknown> | undefined {
  const d = MIXED_RCS_DEFAULTS;
  const same =
    c.greeting.trim() === d.greeting && !c.title.trim() && !c.body.trim() &&
    (c.buttonText.trim() || d.buttonText) === d.buttonText && !c.buttonUrl.trim() && c.includeImage;
  if (same) return undefined;
  return {
    type: 'MIXED',
    // El saludo por defecto NO se manda: así el scheduler sigue omitiéndolo cuando el
    // texto de la campaña ya trae #name (no sale "Hi Maria! Hola Maria…").
    ...(c.greeting.trim() !== d.greeting ? { greeting: c.greeting.trim() } : {}),
    ...(c.title.trim() ? { title: c.title.trim() } : {}),
    ...(c.body.trim() ? { body: c.body.trim() } : {}),
    ...(c.buttonText.trim() ? { buttonText: c.buttonText.trim() } : {}),
    ...(c.buttonUrl.trim() ? { buttonUrl: c.buttonUrl.trim() } : {}),
    ...(c.includeImage ? {} : { includeImage: false }),
  };
}

const TOKENS = [
  { key: '#name', label: 'Nombre del cliente' },
  { key: '#store', label: 'Nombre de la tienda' },
  { key: '#link', label: 'Link del botón' },
  { key: '#message', label: 'Texto del SMS/MMS de la campaña' },
];

type TextKey = 'greeting' | 'title' | 'body';

export default function MixedRcsEditor({
  value,
  onChange,
  smsText,
  imageSrc,
  storeName,
}: {
  value: MixedRcsCustom;
  onChange: (v: MixedRcsCustom) => void;
  /** Texto de la campaña: es el cuerpo por defecto y lo que resuelve #message. */
  smsText: string;
  imageSrc?: string;
  storeName?: string;
}) {
  const refs = useRef<Partial<Record<TextKey, HTMLInputElement | HTMLTextAreaElement | null>>>({});
  const lastField = useRef<TextKey>('body');
  const set = (patch: Partial<MixedRcsCustom>) => onChange({ ...value, ...patch });

  // El botón inserta el placeholder donde está el cursor del último campo tocado.
  const insert = (token: string) => {
    const key = lastField.current;
    const el = refs.current[key];
    const cur = value[key];
    const start = el?.selectionStart ?? cur.length;
    const end = el?.selectionEnd ?? cur.length;
    set({ [key]: cur.slice(0, start) + token + cur.slice(end) } as Partial<MixedRcsCustom>);
    requestAnimationFrame(() => {
      el?.focus();
      el?.setSelectionRange(start + token.length, start + token.length);
    });
  };

  const field = (key: TextKey) => ({
    inputRef: (el: HTMLInputElement | HTMLTextAreaElement | null) => { refs.current[key] = el; },
    onFocus: () => { lastField.current = key; },
    value: value[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => set({ [key]: e.target.value } as Partial<MixedRcsCustom>),
  });

  // Vista previa con datos de ejemplo (mismas reglas que el scheduler).
  const sample = (tpl: string) =>
    tpl
      .replace(/#name/gi, 'Maria')
      .replace(/#store/gi, storeName || 'Tu tienda')
      .replace(/#link/gi, value.buttonUrl.trim() || 'link del mensaje')
      .replace(/#message/gi, smsText || 'Texto de la campaña');
  const greeting = sample(value.greeting.trim());
  const body = sample(value.body.trim()) || smsText || 'Texto de la campaña';
  const showImage = value.includeImage && !!imageSrc;
  const title = sample(value.title.trim()) || greeting;

  return (
    <Stack direction={{ xs: 'column', md: 'row' }} gap={2.5} sx={{ mt: 2 }}>
      <Stack gap={1.5} sx={{ flex: 1, minWidth: 0 }}>
        <Box>
          <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
            Placeholders: tocá un campo y después el botón. Se reemplazan por cliente al enviar.
          </Typography>
          <Stack direction="row" flexWrap="wrap" gap={0.75}>
            {TOKENS.map((t) => (
              <Chip key={t.key} size="small" variant="outlined" color="primary" label={`${t.key} · ${t.label}`} onClick={() => insert(t.key)} />
            ))}
          </Stack>
        </Box>
        <TextField size="small" fullWidth label="Saludo" helperText='Vacío = sin saludo. Por defecto "Hi #name!"' inputProps={{ maxLength: 120 }} {...field('greeting')} />
        <TextField size="small" fullWidth label="Título de la tarjeta (con imagen)" placeholder="Por defecto: el saludo" inputProps={{ maxLength: 200 }} {...field('title')} />
        <TextField
          size="small"
          fullWidth
          multiline
          minRows={3}
          maxRows={8}
          label="Texto del RCS"
          placeholder="Por defecto: el mismo texto del SMS/MMS de la campaña"
          helperText={`${value.body.length}/1800. Vacío = el texto de la campaña.`}
          inputProps={{ maxLength: 1800 }}
          {...field('body')}
        />
        <Stack direction={{ xs: 'column', sm: 'row' }} gap={1.5}>
          <TextField size="small" fullWidth label="Texto del botón" value={value.buttonText} onChange={(e) => set({ buttonText: e.target.value })} inputProps={{ maxLength: 25 }} helperText={`${value.buttonText.length}/25`} />
          <TextField size="small" fullWidth label="Link del botón" placeholder="Por defecto: el link del mensaje" value={value.buttonUrl} onChange={(e) => set({ buttonUrl: e.target.value })} helperText="Vacío = el link del texto, o el linktree de la tienda" />
        </Stack>
        <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1}>
          <FormControlLabel
            control={<Switch checked={value.includeImage} onChange={(e) => set({ includeImage: e.target.checked })} />}
            label="Incluir la imagen de la campaña en el RCS"
          />
          <Button size="small" color="inherit" onClick={() => onChange(MIXED_RCS_DEFAULTS)}>Restaurar por defecto</Button>
        </Stack>
      </Stack>

      {/* Vista previa */}
      <Box sx={{ width: { xs: '100%', md: 260 }, flexShrink: 0 }}>
        <Typography variant="caption" color="text.secondary" fontWeight={700} display="block" sx={{ mb: 0.5 }}>
          Vista previa (cliente de ejemplo: Maria)
        </Typography>
        <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, overflow: 'hidden', bgcolor: 'background.paper' }}>
          {showImage && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imageSrc} alt="" style={{ display: 'block', width: '100%', maxHeight: 260, objectFit: 'cover' }} />
          )}
          <Box sx={{ p: 1.5 }}>
            {showImage ? (
              <>
                {title && <Typography variant="subtitle2" fontWeight={700}>{title}</Typography>}
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', mt: 0.5 }}>{body}</Typography>
              </>
            ) : (
              <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                {greeting ? `${greeting} ${body}` : body}
              </Typography>
            )}
          </Box>
          <Box sx={{ borderTop: '1px solid', borderColor: 'divider', py: 1, textAlign: 'center' }}>
            <Typography variant="body2" color="primary" fontWeight={700}>
              {value.buttonText.trim() || MIXED_RCS_DEFAULTS.buttonText}
            </Typography>
          </Box>
        </Box>
        <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.75 }}>
          Si el teléfono no tiene RCS, le llega el SMS/MMS normal de la campaña.
        </Typography>
      </Box>
    </Stack>
  );
}
