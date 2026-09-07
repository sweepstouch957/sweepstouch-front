'use client';

/** Pendientes de un paso del wizard — aparece al intentar continuar. */

import { Alert, Typography } from '@mui/material';

export default function PendingList({ problems }: { problems: string[] }) {
  if (!problems.length) return null;
  return (
    <Alert
      severity="warning"
      icon={false}
      sx={{ mt: 1.5 }}
      role="alert"
    >
      <Typography
        variant="caption"
        fontWeight={700}
        display="block"
        mb={0.5}
      >
        Para continuar:
      </Typography>
      {problems.map((p, i) => (
        <Typography
          key={i}
          variant="caption"
          display="block"
        >
          • {p}
        </Typography>
      ))}
    </Alert>
  );
}
