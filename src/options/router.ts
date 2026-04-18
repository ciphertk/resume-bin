import { useEffect, useState } from 'react';

export type Route = 'profile' | 'applications' | 'settings';
const ROUTES: readonly Route[] = ['profile', 'applications', 'settings'] as const;

function parseHash(): Route {
  const m = location.hash.match(/^#\/(profile|applications|settings)/);
  return (m?.[1] as Route | undefined) ?? 'profile';
}

export function useRoute(): [Route, (r: Route) => void] {
  const [route, setRoute] = useState<Route>(parseHash());
  useEffect(() => {
    const onHash = () => setRoute(parseHash());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);
  const go = (r: Route) => {
    if (!ROUTES.includes(r)) return;
    location.hash = `#/${r}`;
  };
  return [route, go];
}
