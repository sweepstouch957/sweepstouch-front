// components/KpiCard.tsx
'use client';

import { Box, Card, Typography, useTheme } from '@mui/material';
import { ReactNode } from 'react';

interface KpiCardProps {
  icon: ReactNode;
  label: string;
  value: string | number;
}

const KpiCard = ({ icon, label, value }: KpiCardProps) => {
  const theme = useTheme();

  return (
    <Card
      sx={{
        p: 2,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 4,
        boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.05)',
        textAlign: 'center',
        width: { xs: '100%'},
      }}
    >
      <Box
        sx={{
          mb: 1,
          width: 40,
          height: 40,
          borderRadius: '50%',
          backgroundColor: theme.palette.grey[50],
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: theme.palette.primary.main,
        }}
      >
        {icon}
      </Box>
      <Typography
        variant="h6"
        fontWeight={500}
        color="text.secondary"
      >
        {label}
      </Typography>
      <Typography
        variant="h2"
        fontWeight={700}
      >
        {value}
      </Typography>
    </Card>
  );
};

export default KpiCard;
