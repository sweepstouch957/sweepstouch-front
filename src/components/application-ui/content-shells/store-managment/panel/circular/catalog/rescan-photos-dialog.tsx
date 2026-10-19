'use client';

import type { CatalogSummary } from '@/services/circular.service';
import { ChoiceDialog, type ChoiceOption } from './choice-dialog';
import type { RescanMode } from './constants';

/** Iris rescanea fotos: las del flyer/circular vigente, todas las visibles o sólo las malas. */
export function RescanPhotosDialog({
  open,
  busy,
  ruling,
  onClose,
  onRescan,
}: {
  open: boolean;
  busy: boolean;
  ruling: CatalogSummary['ruling'];
  onClose: () => void;
  onRescan: (mode: RescanMode) => void;
}) {
  const options: ChoiceOption[] = [
    ...(ruling
      ? [
          {
            key: 'flyer',
            label: `Sólo las del ${ruling.kind === 'flyer' ? 'flyer' : 'circular'} vigente`,
            onClick: () => onRescan('flyer'),
          },
        ]
      : []),
    { key: 'all', label: 'Todas las visibles', onClick: () => onRescan('all') },
    { key: 'missing', label: 'Sólo las malas', onClick: () => onRescan('missing') },
  ];
  return (
    <ChoiceDialog
      open={open}
      busy={busy}
      onClose={onClose}
      title="Rescanear fotos"
      body="Iris vuelve a buscar cada producto en su página del circular, recorta sólo su foto, comprueba que sea él y la limpia. Si no lo encuentra, genera la foto desde el nombre."
      note={
        <>
          &quot;Sólo las malas&quot; = sin foto o con recorte crudo. &quot;Todas&quot; rehace
          también las que ya están limpias (útil si quedaron con el vecino o con varios productos).
          Para una sola foto, ábrela con el lápiz y usa &quot;Rescanear foto&quot;.
        </>
      }
      options={options}
    />
  );
}
