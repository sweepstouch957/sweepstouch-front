'use client';
/* eslint-disable react/jsx-max-props-per-line */

import React from 'react';
import {
  Box,
  Typography,

  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Avatar,
  IconButton,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  Schedule as ScheduleIcon,
  Error as ErrorIcon,
  Visibility as VisibilityIcon,
} from '@mui/icons-material';
import { MetricCard } from '../MetricCard';
import { StatusBadge } from '../StatusBadge';
import { mockManageCirculars } from '../../../data/circularsData';

const ManageCirculars: React.FC = () => {
  return (
    <Box sx={{
        p: { xs: 2, sm: 3, md: 4 }, 
      }}>
      {/* Page Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 600, color: '#2D3748', mb: 0.5 }}>
          Manage Circulars
        </Typography>
        <Typography variant="subtitle1" sx={{ color: '#718096' }}>
          Manage circular schedule of stores
        </Typography>
      </Box>

      {/* Metrics Cards */}
      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: '1fr 1fr 1fr' },
        gap: 3,
        mb: 4 
      }}>
        <MetricCard
          title="Active Circulars"
          value={mockManageCirculars.activeCirculars}
          icon={TrendingUpIcon}
          borderColor="#4CAF50"
        />
        <MetricCard
          title="Scheduled"
          value={mockManageCirculars.scheduled}
          icon={ScheduleIcon}
          borderColor="#FF9800"
        />
        <MetricCard
          title="Expired"
          value={mockManageCirculars.expired}
          icon={ErrorIcon}
          borderColor="#F44336"
        />
      </Box>

      {/* Circular Status by Store Table */}
      <Paper sx={{ borderRadius: 3, overflow: 'hidden' }}>
        <Box sx={{ p: 3, borderBottom: '1px solid #E2E8F0' }}>
          <Typography variant="h6" sx={{ fontWeight: 600, color: '#2D3748' }}>
            Circular Status by Store
          </Typography>
        </Box>
        
        <TableContainer sx={{ overflowX: 'auto' }}>
          <Table sx={{ minWidth: 650 }}>
            <TableHead>
              <TableRow>
                <TableCell>STORE</TableCell>
                <TableCell>CONTACT</TableCell>
                <TableCell>CURRENT CIRCULAR</TableCell>
                <TableCell>NEXT CIRCULAR</TableCell>
                <TableCell align="center">PREVIEW</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {mockManageCirculars.stores.map((store) => (
                <TableRow key={store.id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar
                        sx={{
                          width: 40,
                          height: 40,
                          backgroundColor: '#E91E63',
                          fontSize: '0.875rem',
                          fontWeight: 600,
                        }}
                      >
                        {store.initials}
                      </Avatar>
                      <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                          <Typography variant="body2" sx={{ fontWeight: 500, color: '#2D3748' }}>
                            {store.name}
                          </Typography>
                          <StatusBadge status={store.status} />
                        </Box>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ color: '#2D3748' }}>
                      {store.contact}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box>
                      <Typography variant="body2" sx={{ color: '#2D3748', fontWeight: 500 }}>
                        {store.currentCircular}
                      </Typography>
                      {store.currentCircularDate && (
                        <Typography variant="caption" sx={{ color: '#718096' }}>
                          {store.currentCircularDate}
                        </Typography>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box>
                      <Typography variant="body2" sx={{ color: '#2D3748', fontWeight: 500 }}>
                        {store.nextCircular}
                      </Typography>
                      {store.nextCircularDate && (
                        <Typography variant="caption" sx={{ color: '#2196F3' }}>
                          {store.nextCircularDate}
                        </Typography>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell align="center">
                    <IconButton size="small" sx={{ color: '#718096' }}>
                      <VisibilityIcon fontSize="small" />
                    </IconButton>
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

export { ManageCirculars };
