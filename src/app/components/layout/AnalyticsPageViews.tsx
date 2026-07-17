import { useEffect } from 'react';
import { useLocation } from 'react-router';

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

const GA_MEASUREMENT_ID = 'G-PT95H55N18';

/**
 * Sends a GA4 page_view on each client-side route change.
 * The initial load is already handled by the gtag config in index.html.
 */
export function AnalyticsPageViews() {
  const { pathname, search } = useLocation();

  useEffect(() => {
    if (typeof window.gtag !== 'function') return;

    window.gtag('event', 'page_view', {
      page_title: document.title,
      page_location: window.location.href,
      page_path: `${pathname}${search}`,
      send_to: GA_MEASUREMENT_ID,
    });
  }, [pathname, search]);

  return null;
}
