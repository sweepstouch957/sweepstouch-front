'use client';
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
        backgroundColor: 'white',
        borderBottom: '1px solid #E2E8F0',
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
            color: '#2D3748',
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
              color: '#718096',
              '&:hover': {
                backgroundColor: 'rgba(113, 128, 150, 0.1)',
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
                backgroundColor: '#2196F3',
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
                backgroundColor: '#2196F3',
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
