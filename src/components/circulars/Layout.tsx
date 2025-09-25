'use client';
import React from 'react';
import { Box } from '@mui/material';
import Sidebar from './Sidebar';
import Header from './Header';

interface LayoutProps {
  children: React.ReactNode;
  title: string;
  activeItem: string;
  onItemClick: (item: string) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, title, activeItem, onItemClick }) => {
  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar activeItem={activeItem} onItemClick={onItemClick} />
      
      <Box
        sx={{
          flex: 1,
          marginLeft: { xs: '260px', md: '280px' }, // Sidebar width
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Header title={title} />
        
        <Box
          component="main"
          sx={{
            flex: 1,
            backgroundColor: '#F7FAFC',
            pt: '80px', // Header height + padding
            p: 3,
            minHeight: 'calc(100vh - 80px)',
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
};

export default Layout;
