import { useCallback, useSyncExternalStore } from 'react';

// True while the media query matches. False during the static prerender, so the shell is the small-screen layout.
export function useMediaQuery(query) {
  const subscribe = useCallback((notify) => {
    const m = window.matchMedia(query);
    m.addEventListener('change', notify);
    return () => m.removeEventListener('change', notify);
  }, [query]);
  return useSyncExternalStore(subscribe, () => window.matchMedia(query).matches, () => false);
}
