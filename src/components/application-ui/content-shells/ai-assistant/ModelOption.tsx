'use client';

import { Box, Stack, Typography } from '@mui/material';
import React from 'react';
import { ModelIcon } from './ModelIcon';
import { AIModel, getModelLabel } from './models';
import { SIcon } from './SIcon';

export const ModelOption = React.memo(function ModelOption({
  model,
  caption,
}: {
  model: AIModel;
  caption?: string;
}) {
  return (
    <Stack
      direction="row"
      spacing={1}
      alignItems="center"
    >
      {model === 'combined' ? <SIcon size={16} /> : <ModelIcon model={model} />}
      <Box component="span">
        {getModelLabel(model)}
        {caption && (
          <Typography
            component="span"
            variant="caption"
            color="text.secondary"
            sx={{ display: 'block', lineHeight: 1.1, fontWeight: 400 }}
          >
            {caption}
          </Typography>
        )}
      </Box>
    </Stack>
  );
});
