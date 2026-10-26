import { useEffect, useRef } from 'react';

const ELFSIGHT_SRC = 'https://elfsightcdn.com/platform.js';

// Elfsight Google Reviews embed. The platform script scans the DOM when it loads, so it is
// re-added on every mount to pick up the widget after client-side navigation.
export default function GoogleReviewsWidget({ onLoaded }) {
  const box = useRef(null);

  // Load the Elfsight script only when the widget is about to scroll into view.
  useEffect(() => {
    let script;
    const load = () => {
      script = document.createElement('script');
      script.src = ELFSIGHT_SRC;
      script.async = true;
      document.body.appendChild(script);
    };
    const el = box.current;
    if (!('IntersectionObserver' in window) || !el) { load(); return () => { if (script) script.remove(); }; }
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) { io.disconnect(); load(); }
    }, { rootMargin: '300px' });
    io.observe(el);
    return () => { io.disconnect(); if (script) script.remove(); };
  }, []);

  // Tell the parent when the widget has put its content on the page.
  useEffect(() => {
    const el = box.current;
    if (!onLoaded || !el || !('MutationObserver' in window)) return undefined;
    const mo = new MutationObserver(() => { if (el.childElementCount > 0) { mo.disconnect(); onLoaded(); } });
    mo.observe(el, { childList: true });
    return () => mo.disconnect();
  }, [onLoaded]);

  return <div ref={box} className="elfsight-app-8c3a1505-8573-49f8-a9ca-e0959d3c787a" data-elfsight-app-lazy />;
}
