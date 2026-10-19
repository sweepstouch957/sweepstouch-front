import CalendarMonthRoundedIcon from '@mui/icons-material/CalendarMonthRounded';
import EventRoundedIcon from '@mui/icons-material/EventRounded';
import FactCheckOutlinedIcon from '@mui/icons-material/FactCheckOutlined';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import ReceiptLongRoundedIcon from '@mui/icons-material/ReceiptLongRounded';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import SmartToyOutlinedIcon from '@mui/icons-material/SmartToyOutlined';
import SmsOutlinedIcon from '@mui/icons-material/SmsOutlined';
import type { ReactElement } from 'react';

/** Pestañas del panel por id (no por índice): agregar una no corre los "ir a" de las demás. */
export type PanelTab =
  | 'circular'
  | 'upcoming'
  | 'products'
  | 'lists'
  | 'purchases'
  | 'messages'
  | 'agents'
  | 'config';

export const PANEL_TABS: { id: PanelTab; label: string; icon: ReactElement }[] = [
  { id: 'circular', label: 'Circular', icon: <CalendarMonthRoundedIcon fontSize="small" /> },
  { id: 'upcoming', label: 'Próximos', icon: <EventRoundedIcon fontSize="small" /> },
  { id: 'products', label: 'Productos', icon: <Inventory2OutlinedIcon fontSize="small" /> },
  { id: 'lists', label: 'Listas', icon: <FactCheckOutlinedIcon fontSize="small" /> },
  { id: 'purchases', label: 'Compras', icon: <ReceiptLongRoundedIcon fontSize="small" /> },
  { id: 'messages', label: 'Mensajes', icon: <SmsOutlinedIcon fontSize="small" /> },
  { id: 'agents', label: 'Agentes IA', icon: <SmartToyOutlinedIcon fontSize="small" /> },
  // Configuración (19 oct 2026): "¿Quiere lista?" y el número de listas salían en TODAS las pestañas.
  { id: 'config', label: 'Configuración', icon: <SettingsOutlinedIcon fontSize="small" /> },
];
