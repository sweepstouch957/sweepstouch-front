'use client';

import NProgress from 'nprogress';
import * as React from 'react';

/**
 * Lightweight NProgress integration.
 *
 * The previous implementation used a MutationObserver and re-attached listeners
 * on every render (no dependency array), which can cause main-thread work,
 * memory leaks, and bfcache issues.
 */
function CustomNProgress() {
  React.useEffect(() => {
    NProgress.configure({ showSpinner: false });

    let safetyTimer: number | undefined;
    const finish = () => {
      window.clearTimeout(safetyTimer);
      NProgress.done();
    };

    // Bubbling phase (not capture): React's own handlers run first, so a link
    // that calls preventDefault() is correctly ignored here.
    const onClick = (event: MouseEvent) => {
      const el = event.target as HTMLElement | null;
      const anchor = el?.closest?.('a[href]') as HTMLAnchorElement | null;
      if (!anchor) return;

      // Ignore modified clicks (new tab/window, downloads, etc.)
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }

      // Estos casos navegan fuera de esta página (u no navegan): nunca habría
      // pushState y la barra quedaba corriendo para siempre.
      if (anchor.target && anchor.target !== '_self') return; // _blank etc.
      if (anchor.hasAttribute('download')) return;
      if (anchor.origin !== window.location.origin) return; // link externo

      // Hash-only / misma URL: no hay navegación real.
      const samePath =
        anchor.pathname === window.location.pathname &&
        anchor.search === window.location.search;
      if (samePath) return;

      NProgress.start();

      // Red de seguridad: si por cualquier motivo la navegación no ocurre,
      // la barra se cierra sola en vez de quedarse infinita.
      window.clearTimeout(safetyTimer);
      safetyTimer = window.setTimeout(() => NProgress.done(), 8000);
    };

    document.addEventListener('click', onClick);

    // Ensure we finish the progress bar when navigation completes.
    const originalPushState = window.history.pushState;
    const originalReplaceState = window.history.replaceState;

    const wrapHistoryMethod = <T extends (...args: any[]) => any>(fn: T) => {
      return new Proxy(fn, {
        apply: (target, thisArg, argArray) => {
          const res = target.apply(thisArg, argArray as any);
          finish();
          return res;
        },
      });
    };

    window.history.pushState = wrapHistoryMethod(originalPushState);
    window.history.replaceState = wrapHistoryMethod(originalReplaceState);

    const onPopState = () => {
      finish();
    };
    window.addEventListener('popstate', onPopState);

    return () => {
      document.removeEventListener('click', onClick);
      window.removeEventListener('popstate', onPopState);
      window.history.pushState = originalPushState;
      window.history.replaceState = originalReplaceState;
      window.clearTimeout(safetyTimer);
      NProgress.done(true);
    };
  }, []);

  return null;
}

export { CustomNProgress as NProgress };
