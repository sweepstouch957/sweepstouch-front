'use client';

import AutoFixHighRoundedIcon from '@mui/icons-material/AutoFixHighRounded';
import { Button, Tooltip } from '@mui/material';
import React from 'react';
import { countPendingBlocks, generateSavings } from './savings';
import type { CardTag } from './types';

/**
 * Botón "Generar Savings", compartido por el modal de creación y el detalle.
 *
 * Único a propósito: antes la lógica de visibilidad estaba escrita sólo en el
 * detalle y además mezclada con el permiso de edición, así que el botón
 * desaparecía al mirar la tarjeta con otra persona. Ahora la regla es una sola
 * y vale en los dos lugares:
 *
 *   se MUESTRA siempre que la tarjeta tenga la etiqueta Shelfsigns;
 *   se HABILITA si además se puede editar la lista y queda algún bloque sin saving.
 *
 * Que esté visible pero deshabilitado es información útil —dice por qué no se
 * puede— mientras que desaparecer parece un bug.
 */

interface Props {
  productList: string;
  tags: CardTag[];
  /** Sólo los admins editan la lista. */
  canEdit: boolean;
  onApply: (html: string) => void;
  onResult?: (message: string) => void;
  size?: 'small' | 'medium';
}

export function SavingsButton({
  productList,
  tags,
  canEdit,
  onApply,
  onResult,
  size = 'small',
}: Props): React.JSX.Element | null {
  const hasTag = tags.includes('shelfsigns');

  // countPendingBlocks usa DOMParser: sólo corre en el cliente y sólo cuando la
  // etiqueta está puesta, para no parsear la lista en cada render inútilmente.
  const pending = React.useMemo(
    () => (hasTag ? countPendingBlocks(productList) : 0),
    [hasTag, productList]
  );

  if (!hasTag) return null;

  const disabled = !canEdit || pending === 0;

  const reason = !canEdit
    ? 'Sólo administración puede editar la lista'
    : pending === 0
      ? 'No hay bloques pendientes: todos tienen su saving o les falta el precio regular'
      : `${pending} bloque(s) sin saving`;

  const run = () => {
    const result = generateSavings(productList);
    onApply(result.html);
    const parts = [`${result.added} saving(s) agregados`];
    if (result.untouched) parts.push(`${result.untouched} ya resueltos`);
    if (result.skipped) parts.push(`${result.skipped} bloque(s) incompletos salteados`);
    onResult?.(parts.join(' · '));
  };

  return (
    <Tooltip title={reason}>
      {/* El span deja que el tooltip funcione con el botón deshabilitado. */}
      <span>
        <Button
          size={size}
          variant="outlined"
          startIcon={<AutoFixHighRoundedIcon />}
          disabled={disabled}
          onClick={run}
        >
          Generar Savings
        </Button>
      </span>
    </Tooltip>
  );
}

export default SavingsButton;
