'use client';

/**
 * Sweepstouch Bot: el asistente que acompaña en todo el panel.
 *
 * Este archivo es sólo el botón flotante. El panel (conversación, voz, markdown,
 * gráficos) se descarga la primera vez que se abre — o al pasar el cursor por el
 * botón — para que no le cueste nada a las pantallas donde nadie lo usa.
 *
 *   index.tsx        botón flotante + carga diferida
 *   bot-panel.tsx    contenedor: une hooks y vistas
 *   use-bot-chat.ts  conversación (streaming sobre /ai/chat)
 *   use-bot-voice.ts modo voz manos libres y dictado
 *   audio.ts         hablar y escuchar (sin React)
 *   bot-*.tsx        vistas: cabecera, barra, bienvenida, mensajes, caja de texto
 */
import { usePathname } from '@/hooks/use-pathname';
import type { MenuItem } from '@/router/menuItem';
import { currentModule, menuModules } from '@/router/nav';
import { routes } from '@/router/routes';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import { Fab, Tooltip, useTheme } from '@mui/material';
import dynamic from 'next/dynamic';
import { useCallback, useMemo, useState } from 'react';
import { BrandMark, NO_MOTION, useBrand } from './brand';

const loadPanel = () => import('./bot-panel');
const BotPanel = dynamic(loadPanel, { ssr: false });

const ANCHOR = {
  right: 'max(20px, env(safe-area-inset-right, 0px))',
  bottom: 'max(20px, env(safe-area-inset-bottom, 0px))',
};

export default function SweepstouchBot({ menuItems }: { menuItems: MenuItem[] }) {
  const theme = useTheme();
  const brand = useBrand();
  const pathname = usePathname();
  const modules = useMemo(() => menuModules(menuItems), [menuItems]);
  const chatRoute = routes.admin.applications['ai-assistant'];

  const [open, setOpen] = useState(false);
  // El panel se monta al abrirlo por primera vez y ya no se desmonta (conserva la charla).
  const [loaded, setLoaded] = useState(false);

  const toggle = useCallback(() => {
    setLoaded(true);
    setOpen((o) => !o);
  }, []);
  const close = useCallback(() => setOpen(false), []);

  // Sólo para quien tiene el asistente en su menú; en la página del chat completo sobra.
  const allowed = useMemo(
    () => modules.some((m) => m.pages.some((p) => p.route === chatRoute)),
    [modules, chatRoute]
  );
  if (!allowed || pathname.startsWith(chatRoute)) return null;

  // En qué pantalla está la persona, con nombre: es el contexto que se le pasa a la IA.
  const here = currentModule(pathname, modules);
  const page = here?.module.pages.find((p) => p.route === here.route);
  const pageName = page ? (page.module ? `${page.module} › ${page.title}` : page.title) : '';

  return (
    <>
      {loaded && (
        <BotPanel
          open={open}
          pathname={pathname}
          pageName={pageName}
          chatRoute={chatRoute}
          anchor={ANCHOR}
          onClose={close}
        />
      )}
      <Tooltip
        title={open ? '' : 'Sweepstouch Bot'}
        placement="left"
      >
        <Fab
          aria-label={open ? 'Cerrar Sweepstouch Bot' : 'Abrir Sweepstouch Bot'}
          aria-expanded={open}
          onClick={toggle}
          onPointerEnter={() => void loadPanel()}
          onFocus={() => void loadPanel()}
          sx={{
            position: 'fixed',
            zIndex: theme.zIndex.speedDial,
            right: ANCHOR.right,
            bottom: ANCHOR.bottom,
            width: 56,
            height: 56,
            color: brand.onBrand,
            background: brand.gradient,
            boxShadow: 'none',
            transition: 'transform 180ms ease-out',
            '&:hover': { background: brand.gradient, transform: 'scale(1.06)', boxShadow: 'none' },
            '&:active': { boxShadow: 'none' },
            '&:focus-visible': { outline: `3px solid ${brand.glow(0.5)}`, outlineOffset: 3 },
            [NO_MOTION]: { transition: 'none', '&:hover': { transform: 'none' } },
          }}
        >
          {open ? <CloseRoundedIcon /> : <BrandMark size={26} />}
        </Fab>
      </Tooltip>
    </>
  );
}
