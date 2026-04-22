import EventTwoToneIcon from '@mui/icons-material/EventTwoTone';
import PowerSettingsNewTwoToneIcon from '@mui/icons-material/PowerSettingsNewTwoTone';
import SmsTwoToneIcon from '@mui/icons-material/SmsTwoTone';
import { alpha, IconButton, Stack } from '@mui/material';
import { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/navigation';
import { TooltipLight } from 'src/components/base/styles/tooltips';
import { neutral } from 'src/theme/colors';

interface TooltipProps {
  icon: React.ReactNode;
  tooltipText: string;
  onClick?: () => void;
}

const FooterButton: FC<TooltipProps> = ({ icon, tooltipText, onClick }) => {
  const { t } = useTranslation();

  return (
    <TooltipLight
      placement="top"
      arrow
      title={t(tooltipText)}
    >
      <IconButton
        onClick={onClick}
        size="small"
        sx={{
          background: 'transparent',
          color: neutral[500],
          borderRadius: 1.5,
          '&:hover': {
            color: neutral[200],
            background: alpha(neutral[500], 0.08),
          },
        }}
      >
        {icon}
      </IconButton>
    </TooltipLight>
  );
};

import { authClient } from 'src/utils/auth/custom/client';

import AccountCircleTwoToneIcon from '@mui/icons-material/AccountCircleTwoTone';

const SidebarFooter: FC = () => {
  const router = useRouter();
  
  const handleLogout = async () => {
    try {
      await authClient.signOut();
      window.location.href = '/auth/custom/login';
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <Stack
      direction="row"
      py={1.5}
      spacing={0.5}
      display="flex"
      alignItems="center"
      justifyContent="center"
      zIndex={6}
      position="relative"
      sx={{
        borderTop: `1px solid ${alpha(neutral[700], 0.15)}`,
      }}
    >
      <FooterButton
        icon={<AccountCircleTwoToneIcon sx={{ fontSize: 18 }} />}
        tooltipText="Account"
        onClick={() => router.push('/admin/management/account')}
      />
      <FooterButton
        icon={<EventTwoToneIcon sx={{ fontSize: 18 }} />}
        tooltipText="Events Calendar"
        onClick={() => router.push('/admin/applications/calendar')}
      />
      <FooterButton
        icon={<SmsTwoToneIcon sx={{ fontSize: 18 }} />}
        tooltipText="Messenger"
      />
      <FooterButton
        icon={<PowerSettingsNewTwoToneIcon sx={{ fontSize: 18 }} />}
        tooltipText="Logout"
        onClick={handleLogout}
      />
    </Stack>
  );
};

export default SidebarFooter;
