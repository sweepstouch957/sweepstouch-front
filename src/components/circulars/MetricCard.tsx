'use client';
import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  SvgIconProps,
} from '@mui/material';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ComponentType<SvgIconProps>;
  borderColor: string;
  iconColor?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  borderColor,
  iconColor,
}) => {
  return (
    <Card
      sx={{
        height: '100%',
        borderTop: `4px solid ${borderColor}`,
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: '0 4px 12px 0 rgba(0, 0, 0, 0.15)',
        },
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
          <Box>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 600,
                color: '#2D3748',
                mb: 0.5,
              }}
            >
              {title}
            </Typography>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 700,
                color: '#2D3748',
                lineHeight: 1,
              }}
            >
              {value}
            </Typography>
          </Box>
          <Box
            sx={{
              p: 1.5,
              borderRadius: 2,
              backgroundColor: `${iconColor || borderColor}15`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon
              sx={{
                fontSize: 24,
                color: iconColor || borderColor,
              }}
            />
          </Box>
        </Box>
        
        {subtitle && (
          <Typography
            variant="body2"
            sx={{
              color: borderColor,
              fontWeight: 500,
              fontSize: '0.75rem',
            }}
          >
            {subtitle}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
};

export { MetricCard };
