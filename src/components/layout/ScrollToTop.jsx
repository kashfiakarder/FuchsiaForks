import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Resets scroll on navigation.
 *
 * A single-page app keeps the scroll position across route changes by
 * default, so following a link from halfway down one page drops you
 * halfway down the next one. Skipped when the browser is restoring a
 * history entry, where the old position is the right one.
 */
export default function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [pathname]);

  return null;
}
