import CalendarMonthRoundedIcon from '@mui/icons-material/CalendarMonthRounded';
import EventRoundedIcon from '@mui/icons-material/EventRounded';
import FactCheckOutlinedIcon from '@mui/icons-material/FactCheckOutlined';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import MailOutlineRoundedIcon from '@mui/icons-material/MailOutlineRounded';
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
  | 'postcard'
  | 'purchases'
  | 'messages'
  | 'agents'
  | 'config';

export const PANEL_TABS: { id: PanelTab; label: string; icon: ReactElement }[] = [
  { id: 'circular', label: 'Circular', icon: <CalendarMonthRoundedIcon fontSize="small" /> },
  { id: 'upcoming', label: 'Próximos', icon: <EventRoundedIcon fontSize="small" /> },
  { id: 'products', label: 'Productos', icon: <Inventory2OutlinedIcon fontSize="small" /> },
  { id: 'lists', label: 'Listas', icon: <FactCheckOutlinedIcon fontSize="small" /> },
  { id: 'postcard', label: 'Postcard', icon: <MailOutlineRoundedIcon fontSize="small" /> },
  { id: 'purchases', label: 'Compras', icon: <ReceiptLongRoundedIcon fontSize="small" /> },
  { id: 'messages', label: 'Mensajes', icon: <SmsOutlinedIcon fontSize="small" /> },
  { id: 'agents', label: 'Agentes IA', icon: <SmartToyOutlinedIcon fontSize="small" /> },
  // Configuración (19 oct 2026): "¿Quiere lista?" y el número de listas salían en TODAS las pestañas.
  { id: 'config', label: 'Configuración', icon: <SettingsOutlinedIcon fontSize="small" /> },
];

/**
 * Las 9 pestañas en 5 grupos (nov 2026): eran demasiadas en una fila y había que desplazar
 * para llegar a Agentes o Configuración. El grupo es la pestaña; lo de adentro se elige con
 * los botones de abajo. Los ids de `PanelTab` no cambian: los "ir a" de las secciones siguen igual.
 */
export const PANEL_GROUPS: {
  id: string;
  label: string;
  icon: ReactElement;
  tabs: { id: PanelTab; label: string }[];
}[] = [
  {
    id: 'circular',
    label: 'Circular',
    icon: <CalendarMonthRoundedIcon fontSize="small" />,
    tabs: [{ id: 'circular', label: 'Circular' }],
  },
  {
    id: 'products',
    label: 'Productos',
    icon: <Inventory2OutlinedIcon fontSize="small" />,
    tabs: [
      { id: 'products', label: 'Hoy en la lista' },
      { id: 'upcoming', label: 'Próximas ofertas' },
    ],
  },
  {
    id: 'customers',
    label: 'Clientes',
    icon: <FactCheckOutlinedIcon fontSize="small" />,
    tabs: [
      { id: 'lists', label: 'Listas' },
      { id: 'purchases', label: 'Compras' },
      { id: 'messages', label: 'Mensajes' },
    ],
  },
  {
    id: 'agents',
    label: 'Agentes IA',
    icon: <SmartToyOutlinedIcon fontSize="small" />,
    tabs: [{ id: 'agents', label: 'Agentes IA' }],
  },
  {
    id: 'settings',
    label: 'Ajustes',
    icon: <SettingsOutlinedIcon fontSize="small" />,
    tabs: [
      { id: 'config', label: 'Configuración' },
      { id: 'postcard', label: 'Postcard' },
    ],
  },
];

export const groupOf = (tab: PanelTab) =>
  PANEL_GROUPS.find((g) => g.tabs.some((t) => t.id === tab)) ?? PANEL_GROUPS[0];
