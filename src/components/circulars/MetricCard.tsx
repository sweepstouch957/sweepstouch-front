'use client';
/* eslint-disable react/jsx-max-props-per-line */

import React from 'react';
import Link from 'next/link';
import {
  alpha,
  Card,
  CardActionArea,
  CardContent,
  Typography,
  Box,
  SvgIconProps,
} from '@mui/material';
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ComponentType<SvgIconProps>;
  borderColor: string;
  iconColor?: string;
  /** A dónde lleva la card al hacer click. */
  href?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  borderColor,
  iconColor,
  href,
}) => {
  const inner = (
    <CardContent sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
        <Box sx={{ minWidth: 0 }}>
          <Typography
            variant="h6"
            // Antes: color '#2D3748' fijo → ilegible en dark mode.
            sx={{ fontWeight: 600, color: 'text.primary', mb: 0.5 }}
          >
            {title}
          </Typography>
          <Typography
            variant="h4"
            sx={{ fontWeight: 700, color: 'text.primary', lineHeight: 1 }}
          >
            {value}
          </Typography>
        </Box>
        <Box
          sx={{
            p: 1.5,
            borderRadius: 2,
            backgroundColor: alpha(iconColor || borderColor, 0.12),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Icon sx={{ fontSize: 24, color: iconColor || borderColor }} />
        </Box>
      </Box>

      {subtitle && (
        <Typography
          variant="body2"
          sx={{ color: borderColor, fontWeight: 500, fontSize: '0.75rem' }}
        >
          {subtitle}
        </Typography>
      )}

      {href && (
        <Box
          aria-hidden
          sx={{ position: 'absolute', bottom: 10, right: 10, display: 'flex', color: 'text.disabled' }}
        >
          <ChevronRightRoundedIcon fontSize="small" />
        </Box>
      )}
    </CardContent>
  );

  return (
    <Card
      variant="outlined"
      sx={{
        height: '100%',
        position: 'relative',
        borderTop: `4px solid ${borderColor}`,
        borderColor: 'divider',
        // Sin sombras ni translateY: el hover se marca con borde + tinte.
        boxShadow: 'none',
        transition: 'border-color .15s, background-color .15s',
        ...(href && {
          '&:hover': {
            borderColor: alpha(borderColor, 0.5),
            borderTopColor: borderColor,
            bgcolor: alpha(borderColor, 0.04),
          },
        }),
      }}
    >
      {href ? (
        <CardActionArea
          component={Link}
          href={href}
          prefetch={false}
          aria-label={`${title}: ${value}`}
          sx={{ height: '100%' }}
        >
          {inner}
        </CardActionArea>
      ) : (
        inner
      )}
    </Card>
  );
};

export { MetricCard };
