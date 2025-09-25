'use client';
import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Alert,
  Avatar,
  Divider,
} from '@mui/material';

import {
  ShoppingCart as ShoppingCartIcon,
  TrendingUp as TrendingUpIcon,
  Schedule as ScheduleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { MetricCard } from '../MetricCard';
import { StatusBadge } from '../StatusBadge';
import { mockDashboardMetrics, mockStatusAlerts, mockStoreStatusOverview } from '../../../data/circularsData';

const InfoDashboard: React.FC = () => {
  return (
    <Box  sx={{
        p: { xs: 2, sm: 3, md: 4 }, 
      }}>
      {/* Page Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 600, color: '#2D3748', mb: 0.5 }}>
          Info Dashboard
        </Typography>
        <Typography variant="subtitle1" sx={{ color: '#718096' }}>
          Overview of circular statistics
        </Typography>
      </Box>

      {/* Metrics Cards */}
      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: '1fr 1fr 1fr 1fr' },
        gap: 3,
        mb: 4 
      }}>
        <MetricCard
          title="Total Stores"
          value={mockDashboardMetrics.totalStores}
          subtitle={mockDashboardMetrics.totalStoresChange}
          icon={ShoppingCartIcon}
          borderColor="#E91E63"
          iconColor="#E91E63"
        />
        <MetricCard
          title="Active Circulars"
          value={mockDashboardMetrics.activeCirculars}
          subtitle={mockDashboardMetrics.activeCircularsSubtitle}
          icon={TrendingUpIcon}
          borderColor="#4CAF50"
          iconColor="#4CAF50"
        />
        <MetricCard
          title="Scheduled"
          value={mockDashboardMetrics.scheduled}
          subtitle={mockDashboardMetrics.scheduledSubtitle}
          icon={ScheduleIcon}
          borderColor="#FF9800"
          iconColor="#FF9800"
        />
        <MetricCard
          title="Expired"
          value={mockDashboardMetrics.expired}
          subtitle={mockDashboardMetrics.expiredSubtitle}
          icon={ErrorIcon}
          borderColor="#F44336"
          iconColor="#F44336"
        />
      </Box>

      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' },
        gap: 3 
      }}>
        {/* Status Alerts */}
        <Paper sx={{ borderRadius: 3, p: 3, height: 'fit-content' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
            <WarningIcon sx={{ color: '#F44336', fontSize: 20 }} />
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#2D3748' }}>
              Status Alerts
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {mockStatusAlerts.map((alert) => (
              <Alert
                key={alert.id}
                severity={alert.type}
                sx={{
                  borderRadius: 2,
                  '& .MuiAlert-message': {
                    fontSize: '0.875rem',
                  },
                }}
              >
                {alert.message}
              </Alert>
            ))}
          </Box>
        </Paper>

        {/* Store Status Overview */}
        <Paper sx={{ borderRadius: 3, p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
            <InfoIcon sx={{ color: '#E91E63', fontSize: 20 }} />
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#2D3748' }}>
              Store Status Overview
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {mockStoreStatusOverview.map((store, index) => (
              <React.Fragment key={store.id}>
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
                  <Box sx={{ flex: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                      <Typography variant="body2" sx={{ fontWeight: 500, color: '#2D3748' }}>
                        {store.name}
                      </Typography>
                      <StatusBadge status={store.status} />
                    </Box>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
                      {store.endDate && (
                        <Typography variant="caption" sx={{ color: '#718096' }}>
                          {store.endDate}
                        </Typography>
                      )}
                      {store.startDate && (
                        <Typography variant="caption" sx={{ color: '#2196F3' }}>
                          {store.startDate}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                </Box>
                {index < mockStoreStatusOverview.length - 1 && (
                  <Divider sx={{ my: 1 }} />
                )}
              </React.Fragment>
            ))}
          </Box>
        </Paper>
      </Box>
    </Box>
  );
};

export { InfoDashboard };
