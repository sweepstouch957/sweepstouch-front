'use client';

import { ChoiceDialog } from './choice-dialog';
import type { SourceKind } from './constants';

/** Completar marca y tamaño leyendo el último flyer o el último circular. */
export function FillDetailsDialog({
  open,
  busy,
  onClose,
  onFill,
}: {
  open: boolean;
  busy: boolean;
  onClose: () => void;
  onFill: (source: SourceKind) => void;
}) {
  return (
    <ChoiceDialog
      open={open}
      busy={busy}
      onClose={onClose}
      title="Completar marca y tamaño"
      body="¿De dónde leo? Se revisan sólo los productos a los que les falta marca o tamaño; se rellenan marca, tamaño, unidad y presentación sin tocar lo que ya está escrito."
      note="Tarda un rato en circulares grandes. Puedes seguir trabajando; te aviso al terminar."
      options={[
        { key: 'circular', label: 'Del último circular', onClick: () => onFill('circular') },
        { key: 'flyer', label: 'Del último flyer', onClick: () => onFill('flyer') },
      ]}
    />
  );
}
