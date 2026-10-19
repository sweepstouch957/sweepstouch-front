'use client';

import type { CampaignImportJob } from '@/services/circular.service';
import { Alert, Button, Stack, Typography } from '@mui/material';
import { memo } from 'react';
import { jobMessage } from './utils';

/** Imports de campaña fallidos, corriendo o esperando cuota: con "Reintentar ahora". */
function ImportJobAlerts({
  jobs,
  retrying,
  onRetry,
}: {
  jobs: CampaignImportJob[];
  retrying: boolean;
  onRetry: (id: string) => void;
}) {
  if (!jobs.length) return null;
  return (
    <Stack
      spacing={1}
      sx={{ px: 2.25, pt: 2 }}
    >
      {jobs.map((j) => (
        <Alert
          key={j._id}
          severity={j.status === 'failed' ? 'error' : 'warning'}
          sx={{ alignItems: 'center', borderRadius: 2 }}
          action={
            j.status !== 'running' && (
              <Button
                size="small"
                color="inherit"
                variant="outlined"
                disabled={retrying}
                onClick={() => onRetry(j._id)}
              >
                {retrying ? 'Reintentando…' : 'Reintentar ahora'}
              </Button>
            )
          }
        >
          <Typography
            variant="body2"
            fontWeight={700}
          >
            {jobMessage(j)}
          </Typography>
          {j.error && <Typography variant="body2">{j.error.slice(0, 220)}</Typography>}
        </Alert>
      ))}
    </Stack>
  );
}

export default memo(ImportJobAlerts);
