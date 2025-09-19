// src/hooks/use-infinite-scroll.ts
import { useEffect, useRef } from 'react';

type UseIntersectionOpts = {
  rootMargin?: string;
  threshold?: number | number[];
  enabled?: boolean;
};

export function useIntersection<T extends Element>(
  rootRef: React.RefObject<Element | null>,
  onIntersect: (entry: IntersectionObserverEntry) => void,
  { rootMargin = '320px', threshold = 0.01, enabled = true }: UseIntersectionOpts = {}
) {
  const targetRef = useRef<T | null>(null);

  useEffect(() => {
    if (!enabled) return;
    const node = targetRef.current;
    const root = rootRef.current || null;
    if (!node) return;

    const obs = new IntersectionObserver((entries) => entries.forEach(onIntersect), {
      root,
      rootMargin,
      threshold,
    });

    obs.observe(node);
    return () => obs.disconnect();
  }, [rootRef, onIntersect, rootMargin, JSON.stringify(threshold), enabled]);

  return targetRef;
}
