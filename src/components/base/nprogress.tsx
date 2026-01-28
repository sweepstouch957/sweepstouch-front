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

    // Use a single, capturing click listener for all links.
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

      const targetUrl = anchor.href;
      const currentUrl = window.location.href;
      if (targetUrl && targetUrl !== currentUrl) {
        NProgress.start();
      }
    };

    document.addEventListener('click', onClick, true);

    // Ensure we finish the progress bar when navigation completes.
    const originalPushState = window.history.pushState;
    const originalReplaceState = window.history.replaceState;

    const wrapHistoryMethod = <T extends (...args: any[]) => any>(fn: T) => {
      return new Proxy(fn, {
        apply: (target, thisArg, argArray) => {
          const res = target.apply(thisArg, argArray as any);
          NProgress.done();
          return res;
        },
      });
    };

    window.history.pushState = wrapHistoryMethod(originalPushState);
    window.history.replaceState = wrapHistoryMethod(originalReplaceState);

    const onPopState = () => {
      NProgress.done();
    };
    window.addEventListener('popstate', onPopState);

    return () => {
      document.removeEventListener('click', onClick, true);
      window.removeEventListener('popstate', onPopState);
      window.history.pushState = originalPushState;
      window.history.replaceState = originalReplaceState;
      NProgress.done(true);
    };
  }, []);

  return null;
}

export { CustomNProgress as NProgress };
