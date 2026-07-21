'use client';
/* eslint-disable react/jsx-max-props-per-line */

import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  IconButton,
  Avatar,
  Badge,
} from '@mui/material';
import {
  DarkMode as DarkModeIcon,
} from '@mui/icons-material';

interface HeaderProps {
  title: string;
}

const Header: React.FC<HeaderProps> = ({ title }) => {
  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        backgroundColor: 'background.paper',
        borderBottom: '1px solid',
        borderColor: 'divider',
        left: { xs: 260, md: 280 }, // Sidebar width
        width: { xs: 'calc(100% - 260px)', md: 'calc(100% - 280px)' },
        zIndex: 1100,
      }}
    >
      <Toolbar sx={{ justifyContent: 'space-between', py: 1 }}>
        {/* Title */}
        <Typography
          variant="h5"
          sx={{
            color: 'text.primary',
            fontWeight: 600,
            flex: 1,
            textAlign: 'center',
          }}
        >
          {title}
        </Typography>

        {/* Right side actions */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton
            sx={{
              color: 'text.secondary',
              '&:hover': {
                backgroundColor: 'action.hover',
              },
            }}
          >
            <DarkModeIcon />
          </IconButton>

          <Badge
            badgeContent=" "
            color="info"
            variant="dot"
            sx={{
              '& .MuiBadge-badge': {
                backgroundColor: 'info.main',
                width: 8,
                height: 8,
                borderRadius: '50%',
              },
            }}
          >
            <Avatar
              sx={{
                width: 40,
                height: 40,
                backgroundColor: 'info.main',
                fontSize: '0.875rem',
                fontWeight: 600,
              }}
            >
              A
            </Avatar>
          </Badge>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
