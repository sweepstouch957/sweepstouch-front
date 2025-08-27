// src/utils/store-ui.tsx
import SimCardIcon from '@mui/icons-material/SimCard';

export const getTierColor = (type: 'elite'|'basic'|'free') => {
  switch (type) {
    case 'elite':
      return { bg: 'linear-gradient(135deg,#ff5bbd,#6b5cff)', text: '#fff' };
    case 'basic':
      return { bg: 'linear-gradient(135deg,#00c1de,#3ddc84)', text: '#001e2b' };
    default:
      return { bg: 'linear-gradient(135deg,#e0e0e0,#cfcfcf)', text: '#111' };
  }
};

export const getProviderChip = (provider: 'twilio'|'bandwidth') =>
  provider === 'twilio'
    ? { label: 'Twilio', color: 'secondary' as const, icon: <SimCardIcon fontSize="small" /> }
    : { label: 'Bandwidth', color: 'primary' as const, icon: <SimCardIcon fontSize="small" /> };

export const formatPhone = (p?: string) => (p ? p : 'No disponible');

export const copyToClipboard = async (text: string) => {
  try { await navigator.clipboard.writeText(text); } catch {}
};
