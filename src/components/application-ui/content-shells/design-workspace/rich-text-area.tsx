'use client';

import { Box, Typography } from '@mui/material';
import React from 'react';

/**
 * Editor de texto enriquecido mínimo, sobre contentEditable.
 *
 * Lo usan la lista de productos y la descripción de errores de auditoría; en
 * los dos casos el requisito es el mismo: texto por líneas + imágenes pegadas
 * con Ctrl+V conviviendo en el mismo campo.
 *
 * Por qué contentEditable y no react-quill (que está en el repo): el generador
 * de savings necesita un <div> por línea para ubicar la línea REG e insertar el
 * SAVING justo debajo. Quill normaliza el marcado a su gusto y complica esa
 * manipulación; acá el HTML es exactamente el que se guarda.
 */

interface Props {
  value: string;
  onChange?: (html: string) => void;
  readOnly?: boolean;
  placeholder?: string;
  minHeight?: number;
  /** Para el detalle de la tarjeta, donde la lista puede ser larga. */
  maxHeight?: number;
  ariaLabel?: string;
}

const readFileAsDataURL = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('No se pudo leer la imagen'));
    reader.readAsDataURL(file);
  });

export function RichTextArea({
  value,
  onChange,
  readOnly = false,
  placeholder = '',
  minHeight = 140,
  maxHeight,
  ariaLabel,
}: Props): React.JSX.Element {
  const ref = React.useRef<HTMLDivElement | null>(null);
  /** Último HTML emitido: evita reescribir el nodo y perder el cursor. */
  const lastEmitted = React.useRef<string>(value);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (value !== lastEmitted.current) {
      el.innerHTML = value || '';
      lastEmitted.current = value;
    }
  }, [value]);

  const emit = React.useCallback(() => {
    const el = ref.current;
    if (!el || !onChange) return;
    const html = el.innerHTML;
    lastEmitted.current = html;
    onChange(html);
  }, [onChange]);

  const handlePaste = async (e: React.ClipboardEvent<HTMLDivElement>) => {
    if (readOnly) return;

    const items = Array.from(e.clipboardData?.items ?? []);
    const imageItems = items.filter((i) => i.type.startsWith('image/'));

    if (imageItems.length) {
      e.preventDefault();
      for (const item of imageItems) {
        const file = item.getAsFile();
        if (!file) continue;
        const dataUrl = await readFileAsDataURL(file);
        // insertHTML respeta la posición del cursor, que es lo que espera quien
        // pega una captura en medio de la lista.
        document.execCommand(
          'insertHTML',
          false,
          `<div><img src="${dataUrl}" alt="" style="max-width:100%" /></div>`
        );
      }
      emit();
      return;
    }

    // Texto: se pega plano. El HTML de Word o del correo trae estilos que
    // rompen el formato por líneas del que depende el parser de savings.
    const text = e.clipboardData?.getData('text/plain');
    if (text) {
      e.preventDefault();
      const html = text
        .split('\n')
        .map((line) => (line.trim() === '' ? '<div><br></div>' : `<div>${escapeHtml(line)}</div>`))
        .join('');
      document.execCommand('insertHTML', false, html);
      emit();
    }
  };

  const empty = !value || value === '<br>' || value === '<div><br></div>';

  return (
    <Box sx={{ position: 'relative' }}>
      <Box
        ref={ref}
        component="div"
        role="textbox"
        aria-label={ariaLabel}
        aria-readonly={readOnly}
        contentEditable={!readOnly}
        suppressContentEditableWarning
        onInput={emit}
        onBlur={emit}
        onPaste={handlePaste}
        sx={{
          minHeight,
          maxHeight,
          overflowY: maxHeight ? 'auto' : undefined,
          p: 1.5,
          borderRadius: 1,
          border: '1px solid',
          borderColor: 'divider',
          bgcolor: readOnly ? 'action.hover' : 'background.paper',
          fontFamily: 'monospace',
          fontSize: 13,
          lineHeight: 1.6,
          whiteSpace: 'pre-wrap',
          cursor: readOnly ? 'default' : 'text',
          '&:focus': { outline: 'none', borderColor: 'primary.main' },
          '& img': { maxWidth: '100%', borderRadius: 4, my: 0.5 },
        }}
      />
      {empty && placeholder && (
        <Typography
          variant="body2"
          color="text.disabled"
          sx={{
            position: 'absolute',
            top: 12,
            left: 12,
            pointerEvents: 'none',
            fontFamily: 'monospace',
            fontSize: 13,
          }}
        >
          {placeholder}
        </Typography>
      )}
    </Box>
  );
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export default RichTextArea;
