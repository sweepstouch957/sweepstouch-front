// components/KpiCard.tsx
'use client';

import LaunchIcon from '@mui/icons-material/Launch';
import { Box, Card, CardActionArea, Tooltip, Typography, useTheme } from '@mui/material';
import Link from 'next/link';
import { ReactNode } from 'react';

interface KpiCardProps {
  icon: ReactNode;
  label: string;
  descriptions?: string; // ✅ nuevo
  value: string | number;
  variant?: 'error' | 'info' | 'success' | 'warning';
  href?: string;
  external?: boolean;
  tooltip?: string;
  ariaLabel?: string;
  showLinkHint?: boolean;
  onClick?: () => void; // ✅ nuevo
}

const KpiCard = ({
  icon,
  label,
  descriptions,
  value,
  variant,
  href,
  external = false,
  tooltip,
  ariaLabel,
  showLinkHint = true,
  onClick,
}: KpiCardProps) => {
  const theme = useTheme();

  const Inner = (
    <Box
      sx={{
        p: 2,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        gap: 0.5,
        position: 'relative',
        minHeight: 120,
      }}
    >
      {href && showLinkHint && (
        <Box
          aria-hidden
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            opacity: 0.6,
            display: 'flex',
            alignItems: 'center',
          }}
        >
          {external && <LaunchIcon fontSize="small" />}
        </Box>
      )}

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
        color={variant ? `${variant}.main` : 'text.secondary'}
        className="kpi-label"
      >
        {label}
      </Typography>

      <Typography
        variant="h2"
        fontWeight={700}
      >
        {value}
      </Typography>
      {/* ✅ Nueva línea opcional de descripción */}
      {descriptions && (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mb: 0.5 }}
        >
          {descriptions}
        </Typography>
      )}
    </Box>
  );

  const cardContent = href ? (
    <CardActionArea
      component={Link}
      href={href}
      prefetch={false}
      target={external ? '_blank' : undefined}
      rel={external ? 'noopener noreferrer' : undefined}
      aria-label={ariaLabel || `${label}: ${value}`}
      sx={{
        borderRadius: 4,
        '&:hover .kpi-label': { textDecoration: 'underline' },
      }}
      onClick={onClick} // ✅ soporta onClick incluso con href
    >
      {Inner}
    </CardActionArea>
  ) : (
    <CardActionArea
      sx={{ borderRadius: 4 }}
      onClick={onClick} // ✅ también funciona sin href
      disabled={!onClick}
    >
      {Inner}
    </CardActionArea>
  );

  const card = (
    <Card
      sx={{
        borderRadius: 4,
        boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.05)',
        width: { xs: '100%' },
      }}
    >
      {cardContent}
    </Card>
  );

  return tooltip ? <Tooltip title={tooltip}>{card}</Tooltip> : card;
};

export default KpiCard;
