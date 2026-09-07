'use client';

/** Paso 2 · Botones globales del mensaje. */

import { Typography } from '@mui/material';
import ButtonListEditor from './ButtonListEditor';
import type { RcsBuilderApi } from './use-rcs-builder';

export default function StepButtons({ b }: { b: RcsBuilderApi }) {
  return (
    <>
      <Typography
        variant="body2"
        color="text.secondary"
        mb={1.5}
      >
        Van debajo del mensaje (máx. {b.globalMax}). Los de «página del cliente» usan su link
        personal con clicks trackeados.
      </Typography>
      <ButtonListEditor
        buttons={b.globalButtons}
        onChange={(next) => b.setGlobalButtons(next.slice(0, b.globalMax))}
        max={b.globalMax}
        allowAdd={false}
        emptyHint="Sin botones globales — también es válido."
      />
    </>
  );
}
