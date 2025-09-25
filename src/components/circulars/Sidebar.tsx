'use client';
import React from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Avatar,
  Divider,
  Collapse,
} from '@mui/material';
import {
  Store as StoreIcon,
  Dashboard as DashboardIcon,
  Description as DescriptionIcon,
  Edit as EditIcon,
  ExpandLess,
  ExpandMore,
} from '@mui/icons-material';
import Image from 'next/image';

interface SidebarProps {
  activeItem: string;
  onItemClick: (item: string) => void;
}

const menuItems = [
  {
    id: 'subscribed-stores',
    label: 'Subscribed Stores',
    icon: StoreIcon,
  },
  {
    id: 'info-dashboard',
    label: 'Info Dashboard',
    icon: DashboardIcon,
  },
  {
    id: 'manage-circulars',
    label: 'Manage Circulars',
    icon: DescriptionIcon,
  },
  {
    id: 'edit-circulars',
    label: 'Edit Circulars',
    icon: EditIcon,
    hasSubmenu: true,
    submenu: [
      { id: 'edit-circulars-upload', label: 'Upload Files' },
      { id: 'edit-circulars-schedule', label: 'Schedule Circulars' },
    ],
  },
];

const Sidebar: React.FC<SidebarProps> = ({ activeItem, onItemClick }) => {
  const [expandedItems, setExpandedItems] = React.useState<string[]>(['edit-circulars']);

  const handleExpandClick = (itemId: string) => {
    setExpandedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  return (
    <Box
      sx={{
        width: { xs: 260, md: 280 },
        height: '100vh',
        backgroundColor: '#2D3748',
        color: 'white',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        left: 0,
        top: 0,
        zIndex: 1200,
        boxShadow: '2px 0 8px rgba(0, 0, 0, 0.1)',
      }}
    >
      {/* Logo */}
      <Box
        sx={{
          p: 3,
          display: 'flex',
          alignItems: 'center',
          gap: 2,
        }}
      >
        <Image
          src="/logo.png"
          alt="sweepsTOUCH"
          width={32}
          height={32}
          style={{ filter: 'brightness(0) invert(1)' }}
        />
        <Typography
          variant="h6"
          sx={{
            fontWeight: 600,
            color: '#E91E63',
          }}
        >
          sweepsTOUCH
        </Typography>
      </Box>

      {/* Navigation */}
      <Box sx={{ flex: 1, px: 2 }}>
        <List>
          {menuItems.map((item) => (
            <React.Fragment key={item.id}>
              <ListItem disablePadding>
                <ListItemButton
                  onClick={() => {
                    if (item.hasSubmenu) {
                      handleExpandClick(item.id);
                    } else {
                      onItemClick(item.id);
                    }
                  }}
                  sx={{
                    borderRadius: 2,
                    mb: 0.5,
                    backgroundColor: activeItem === item.id ? 'rgba(233, 30, 99, 0.1)' : 'transparent',
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    },
                  }}
                >
                  <ListItemIcon sx={{ color: 'inherit', minWidth: 40 }}>
                    <item.icon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText
                    primary={item.label}
                    primaryTypographyProps={{
                      fontSize: '0.875rem',
                      fontWeight: activeItem === item.id ? 500 : 400,
                    }}
                  />
                  {item.hasSubmenu && (
                    expandedItems.includes(item.id) ? <ExpandLess /> : <ExpandMore />
                  )}
                </ListItemButton>
              </ListItem>
              
              {item.hasSubmenu && (
                <Collapse in={expandedItems.includes(item.id)} timeout="auto" unmountOnExit>
                  <List component="div" disablePadding>
                    {item.submenu?.map((subItem) => (
                      <ListItem key={subItem.id} disablePadding>
                        <ListItemButton
                          onClick={() => onItemClick(subItem.id)}
                          sx={{
                            borderRadius: 2,
                            mb: 0.5,
                            ml: 2,
                            backgroundColor: activeItem === subItem.id ? 'rgba(233, 30, 99, 0.1)' : 'transparent',
                            '&:hover': {
                              backgroundColor: 'rgba(255, 255, 255, 0.05)',
                            },
                          }}
                        >
                          <ListItemText
                            primary={subItem.label}
                            primaryTypographyProps={{
                              fontSize: '0.8125rem',
                              fontWeight: activeItem === subItem.id ? 500 : 400,
                            }}
                          />
                        </ListItemButton>
                      </ListItem>
                    ))}
                  </List>
                </Collapse>
              )}
            </React.Fragment>
          ))}
        </List>
      </Box>

      {/* User Info */}
      <Box sx={{ p: 3 }}>
        <Divider sx={{ mb: 2, borderColor: 'rgba(255, 255, 255, 0.1)' }} />
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar
            sx={{
              width: 40,
              height: 40,
              backgroundColor: '#E91E63',
              fontSize: '0.875rem',
            }}
          >
            BW
          </Avatar>
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              Benjamin Wallace
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
              Circulars Management
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default Sidebar;
