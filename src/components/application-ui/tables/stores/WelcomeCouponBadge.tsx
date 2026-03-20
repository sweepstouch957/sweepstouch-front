'use client';

import { welcomeCouponClient } from '@/services/sweepstakes.service';
import { Box, Tooltip, CircularProgress } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import RedeemIcon from '@mui/icons-material/Redeem';

interface WelcomeCouponBadgeProps {
  storeId: string;
}

const WelcomeCouponBadge = ({ storeId }: WelcomeCouponBadgeProps) => {
  const { data, isLoading } = useQuery({
    queryKey: ['welcome-coupon-status', storeId],
    queryFn: () => welcomeCouponClient.getConfig(storeId),
    retry: false,
    staleTime: 1000 * 60 * 5, // 5 minutes cache
  });

  if (isLoading) {
    return <CircularProgress size={12} sx={{ ml: 0.5, color: '#999' }} />;
  }

  const isActive = data?.config?.active || false;

  return (
    <Tooltip title={isActive ? 'Welcome Coupon Active' : 'Welcome Coupon Inactive'} arrow>
      <Box
        component="span"
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          ml: 0.75,
          color: isActive ? '#ff4b9b' : '#d1d5db',
          transition: 'color 0.2s',
          cursor: 'help'
        }}
      >
        <RedeemIcon sx={{ fontSize: 16 }} />
      </Box>
    </Tooltip>
  );
};

export default WelcomeCouponBadge;
