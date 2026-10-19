'use client';

import { ChoiceDialog } from './choice-dialog';
import type { SourceKind } from './constants';

/** Visibles = SOLO el último flyer de campaña o SOLO el último circular; el resto se oculta. */
export function SyncVisibilityDialog({
  open,
  busy,
  onClose,
  onSync,
}: {
  open: boolean;
  busy: boolean;
  onClose: () => void;
  onSync: (only: SourceKind) => void;
}) {
  return (
    <ChoiceDialog
      open={open}
      busy={busy}
      onClose={onClose}
      title="Sincronizar visibilidad"
      body={
        <>
          Elige con qué se queda la lista del Pre-RCS:{' '}
          <strong>sólo el último flyer de campaña</strong> o{' '}
          <strong>sólo el último circular semanal</strong>. El resto del catálogo se oculta.
        </>
      }
      note="No toca precios, ofertas ni imágenes — solo el switch de visibilidad. Cualquier producto se puede volver a mostrar a mano después."
      options={[
        { key: 'circular', label: 'Sólo último circular', onClick: () => onSync('circular') },
        {
          key: 'flyer',
          label: busy ? 'Sincronizando…' : 'Sólo último flyer',
          onClick: () => onSync('flyer'),
        },
      ]}
    />
  );
}
