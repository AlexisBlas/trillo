import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { PREVIEW_MESSAGE } from '../../lib/embed';

/** Lets the landing page drive this iframe to a route. */
export function PreviewBridge() {
  const navigate = useNavigate();

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      const data = event.data;
      if (!data || data.type !== PREVIEW_MESSAGE || typeof data.path !== 'string') return;
      if (!data.path.startsWith('/')) return;
      navigate(data.path, { replace: true });
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [navigate]);

  return null;
}
