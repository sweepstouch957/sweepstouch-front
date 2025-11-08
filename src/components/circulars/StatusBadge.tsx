'use client';
/* eslint-disable react/jsx-max-props-per-line */

import React from 'react';
import { Chip } from '@mui/material';

interface StatusBadgeProps {
  status: any;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const getStatusProps = (status: string) => {
    switch (status) {
      case 'Active':
        return {
          color: '#4CAF50',
          backgroundColor: '#E8F5E8',
        };
      case 'Inactive':
        return {
          color: '#F44336',
          backgroundColor: '#FFEBEE',
        };
      case 'Incomplete':
        return {
          color: '#F44336',
          backgroundColor: '#FFEBEE',
        };
      case 'Expired':
        return {
          color: '#F44336',
          backgroundColor: '#FFEBEE',
        };
      default:
        return {
          color: '#718096',
          backgroundColor: '#F7FAFC',
        };
    }
  };

  const statusProps = getStatusProps(status);

  return (
    <Chip
      label={status}
      size="small"
      sx={{
        backgroundColor: statusProps.backgroundColor,
        color: statusProps.color,
        fontWeight: 500,
        fontSize: '0.75rem',
        height: 24,
        '& .MuiChip-label': {
          px: 1.5,
        },
      }}
    />
  );
};

export { StatusBadge };
