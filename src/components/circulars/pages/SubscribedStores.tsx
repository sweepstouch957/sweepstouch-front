'use client';
/* eslint-disable react/jsx-max-props-per-line */

import React from 'react';
import {
  Box,
  Typography,
  Button,

  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Avatar,
  useTheme,
} from '@mui/material';
import {
  Add as AddIcon,
  Store as StoreIcon,
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
} from '@mui/icons-material';
import { MetricCard } from '../MetricCard';
import { StatusBadge } from '../StatusBadge';
import { mockStores } from '../../../data/circularsData';

const SubscribedStores: React.FC = () => {
  const theme = useTheme();
  const totalStores = mockStores.length;
  const activeStores = mockStores.filter(store => store.status === 'Active').length;
  const inactiveStores = mockStores.filter(store => store.status === 'Inactive').length;

  return (
    <Box sx={{
        p: { xs: 2, sm: 3, md: 4 }, 
      }}>
      {/* Page Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 600, color: 'text.primary', mb: 0.5 }}>
            Subscribed Stores
          </Typography>
          <Typography variant="subtitle1" sx={{ color: 'text.secondary' }}>
            Manage your store subscriptions
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          sx={{
            backgroundColor: 'primary.main',
            '&:hover': {
              backgroundColor: 'primary.dark',
            },
            borderRadius: 2,
            px: 3,
            py: 1.5,
          }}
        >
          Subscribe New Store
        </Button>
      </Box>

      {/* Metrics Cards */}
      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: '1fr 1fr 1fr' },
        gap: 3,
        mb: 4 
      }}>
        <MetricCard
          title="Total Stores"
          value={totalStores}
          icon={StoreIcon}
          borderColor={theme.palette.info.main}
        />
        <MetricCard
          title="Active Stores"
          value={activeStores}
          icon={StoreIcon}
          borderColor={theme.palette.success.main}
        />
        <MetricCard
          title="Inactive Stores"
          value={inactiveStores}
          icon={StoreIcon}
          borderColor={theme.palette.error.main}
        />
      </Box>

      {/* Store Management Table */}
      <Paper sx={{ overflow: 'hidden' }}>
        <Box sx={{ p: 3, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary' }}>
            Store Management
          </Typography>
        </Box>
        
        <TableContainer sx={{ overflowX: 'auto' }}>
          <Table sx={{ minWidth: 650 }}>
            <TableHead>
              <TableRow>
                <TableCell>STORE</TableCell>
                <TableCell>CONTACT</TableCell>
                <TableCell>STATUS</TableCell>
                <TableCell>CREATED</TableCell>
                <TableCell align="center">ACTIONS</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {mockStores.map((store) => (
                <TableRow key={store.id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar
                        sx={{
                          width: 40,
                          height: 40,
                          backgroundColor: 'primary.main',
                          fontSize: '0.875rem',
                          fontWeight: 600,
                        }}
                      >
                        {store.initials}
                      </Avatar>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 500, color: 'text.primary' }}>
                          {store.name}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          {store.address}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box>
                      <Typography variant="body2" sx={{ color: 'text.primary' }}>
                        {store.contact.email}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        {store.contact.phone}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={store.status} />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ color: 'text.primary' }}>
                      {store.created}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}>
                      <IconButton size="small" sx={{ color: 'text.secondary' }}>
                        <VisibilityIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" sx={{ color: 'text.secondary' }}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" sx={{ color: 'text.secondary' }}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" sx={{ color: 'text.secondary' }}>
                        <MoreVertIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
};

export { SubscribedStores };
