'use client';

/** Editor de UN botón RCS — todos los campos del spec editables, con error
 *  inline (causa + solución) en los campos obligatorios según la acción. */

import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import { Card, IconButton, MenuItem, Stack, TextField } from '@mui/material';
import { Btn, BTN_KIND_LABEL, BTN_TEXT_MAX, BtnKind, btnValid, clip } from './rcs-domain';

export default function ButtonEditor({
  btn,
  onChange,
  onRemove,
  allowAdd,
}: {
  btn: Btn;
  onChange: (patch: Partial<Btn>) => void;
  onRemove: () => void;
  /** "agregar producto" sólo tiene sentido dentro de una card con producto */
  allowAdd: boolean;
}) {
  const kinds = (Object.keys(BTN_KIND_LABEL) as BtnKind[]).filter((k) => allowAdd || k !== 'add');
  const textMissing = !btn.text.trim();

  return (
    <Card
      variant="outlined"
      sx={{ p: 1.5, borderColor: btnValid(btn) ? 'divider' : 'warning.main' }}
    >
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={1}
        alignItems={{ sm: 'flex-start' }}
      >
        <TextField
          size="small"
          label={`Texto del botón (${btn.text.length}/${BTN_TEXT_MAX})`}
          value={btn.text}
          onChange={(e) => onChange({ text: clip(e.target.value, BTN_TEXT_MAX) })}
          error={textMissing}
          helperText={textMissing ? 'Obligatorio — es lo que ve el cliente.' : undefined}
          sx={{ flex: 1, minWidth: 160 }}
        />
        <TextField
          size="small"
          select
          label="Qué hace al tocarlo"
          value={btn.kind}
          onChange={(e) => onChange({ kind: e.target.value as BtnKind })}
          sx={{ minWidth: 210 }}
        >
          {kinds.map((k) => (
            <MenuItem
              key={k}
              value={k}
            >
              {BTN_KIND_LABEL[k]}
            </MenuItem>
          ))}
        </TextField>
        <IconButton
          size="small"
          color="error"
          onClick={onRemove}
          aria-label="Quitar botón"
          sx={{ alignSelf: { xs: 'flex-end', sm: 'center' } }}
        >
          <DeleteOutlineRoundedIcon fontSize="small" />
        </IconButton>
      </Stack>

      {(btn.kind === 'offers' || btn.kind === 'list' || btn.kind === 'add') && (
        <TextField
          size="small"
          select
          label="Cómo abre la página"
          value={btn.viewMode || 'FULL'}
          onChange={(e) => onChange({ viewMode: e.target.value as Btn['viewMode'] })}
          sx={{ mt: 1, minWidth: 200 }}
        >
          <MenuItem value="FULL">Pantalla completa</MenuItem>
          <MenuItem value="TALL">Alta (3/4 de pantalla)</MenuItem>
          <MenuItem value="HALF">Media pantalla</MenuItem>
        </TextField>
      )}

      {btn.kind === 'url' && (
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1}
          mt={1}
        >
          <TextField
            size="small"
            label="URL a abrir"
            value={btn.url || ''}
            onChange={(e) => onChange({ url: e.target.value })}
            error={!btn.url?.trim()}
            helperText={!btn.url?.trim() ? 'Pegá la URL completa (https://…)' : undefined}
            sx={{ flex: 1, minWidth: 200 }}
          />
          <TextField
            size="small"
            select
            label="Abrir en"
            value={btn.application || 'BROWSER'}
            onChange={(e) => onChange({ application: e.target.value as Btn['application'] })}
            sx={{ minWidth: 140 }}
          >
            <MenuItem value="BROWSER">Navegador</MenuItem>
            <MenuItem value="WEBVIEW">Webview</MenuItem>
          </TextField>
          {btn.application === 'WEBVIEW' && (
            <TextField
              size="small"
              select
              label="Tamaño"
              value={btn.viewMode || 'FULL'}
              onChange={(e) => onChange({ viewMode: e.target.value as Btn['viewMode'] })}
              sx={{ minWidth: 130 }}
            >
              <MenuItem value="FULL">Completa</MenuItem>
              <MenuItem value="TALL">Alta</MenuItem>
              <MenuItem value="HALF">Media</MenuItem>
            </TextField>
          )}
        </Stack>
      )}

      {btn.kind === 'reply' && (
        <TextField
          size="small"
          label="Postback (lo que llega al sistema cuando lo tocan)"
          value={btn.postback ?? btn.text}
          onChange={(e) => onChange({ postback: e.target.value })}
          sx={{ mt: 1 }}
          fullWidth
        />
      )}

      {btn.kind === 'call' && (
        <TextField
          size="small"
          label="Teléfono a marcar (+1…)"
          value={btn.phoneNumber || ''}
          onChange={(e) => onChange({ phoneNumber: e.target.value })}
          error={!btn.phoneNumber?.trim()}
          helperText={!btn.phoneNumber?.trim() ? 'Obligatorio para el botón de llamar.' : undefined}
          sx={{ mt: 1, minWidth: 220 }}
        />
      )}

      {btn.kind === 'location' && (
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1}
          mt={1}
        >
          <TextField
            size="small"
            label="Latitud"
            value={btn.lat || ''}
            onChange={(e) => onChange({ lat: e.target.value })}
            error={!btn.lat}
            sx={{ minWidth: 130 }}
          />
          <TextField
            size="small"
            label="Longitud"
            value={btn.lng || ''}
            onChange={(e) => onChange({ lng: e.target.value })}
            error={!btn.lng}
            sx={{ minWidth: 130 }}
          />
          <TextField
            size="small"
            label="Etiqueta del pin"
            value={btn.label || ''}
            onChange={(e) => onChange({ label: e.target.value })}
            sx={{ flex: 1, minWidth: 160 }}
          />
        </Stack>
      )}

      {btn.kind === 'calendar' && (
        <Stack
          spacing={1}
          mt={1}
        >
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={1}
          >
            <TextField
              size="small"
              label="Título del evento"
              value={btn.calTitle || ''}
              onChange={(e) => onChange({ calTitle: e.target.value })}
              sx={{ flex: 1 }}
            />
            <TextField
              size="small"
              label="Descripción"
              value={btn.calDesc || ''}
              onChange={(e) => onChange({ calDesc: e.target.value })}
              sx={{ flex: 1.4 }}
            />
          </Stack>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={1}
          >
            <TextField
              size="small"
              type="datetime-local"
              label="Comienza"
              InputLabelProps={{ shrink: true }}
              value={btn.calStart || ''}
              onChange={(e) => onChange({ calStart: e.target.value })}
              sx={{ minWidth: 220 }}
            />
            <TextField
              size="small"
              type="datetime-local"
              label="Termina"
              InputLabelProps={{ shrink: true }}
              value={btn.calEnd || ''}
              onChange={(e) => onChange({ calEnd: e.target.value })}
              sx={{ minWidth: 220 }}
            />
          </Stack>
        </Stack>
      )}
    </Card>
  );
}
