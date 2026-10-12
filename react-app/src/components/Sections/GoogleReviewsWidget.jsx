import { useEffect } from 'react';

const ELFSIGHT_SRC = 'https://elfsightcdn.com/platform.js';

// Elfsight Google Reviews embed. The platform script scans the DOM when it loads, so it is
// re-added on every mount to pick up the widget after client-side navigation.
export default function GoogleReviewsWidget() {
  useEffect(() => {
    const script = document.createElement('script');
    script.src = ELFSIGHT_SRC;
    script.async = true;
    document.body.appendChild(script);
    return () => { script.remove(); };
  }, []);

  return <div className="elfsight-app-8c3a1505-8573-49f8-a9ca-e0959d3c787a" data-elfsight-app-lazy />;
}
