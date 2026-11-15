'use client';

import { Box } from '@mui/material';
import React from 'react';
import { BaseAIModel, MODEL_META } from './models';

export const ModelIcon = React.memo(function ModelIcon({
  model,
  size = 16,
}: {
  model: BaseAIModel;
  size?: number;
}) {
  return (
    <Box
      component="img"
      src={MODEL_META[model].icon}
      alt={MODEL_META[model].label}
      sx={{
        width: size,
        height: size,
        display: 'block',
        flexShrink: 0,
        objectFit: 'contain',
        borderRadius: 0.5,
      }}
    />
  );
});
