import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Header from '../Header/Header';
import Footer from '../Footer/Footer';
import PortalModal from '../Portal/PortalModal';
import WhatsAppButton from '../UI/WhatsAppButton';

export default function Layout({ children }) {
  const { pathname, hash } = useLocation();

  // Scroll to #hash targets (the target page may still be lazy-loading, so retry briefly); otherwise to top.
  useEffect(() => {
    if (!hash) { window.scrollTo(0, 0); return undefined; }
    let tries = 0;
    let timer;
    let settle;
    const go = () => {
      const el = document.getElementById(decodeURIComponent(hash.slice(1)));
      if (el) {
        el.scrollIntoView();
        settle = setTimeout(() => el.scrollIntoView(), 400);
        return;
      }
      if (tries++ < 80) timer = setTimeout(go, 100);
    };
    go();
    return () => { clearTimeout(timer); clearTimeout(settle); };
  }, [pathname, hash]);

  const isPortal = pathname.startsWith('/client-portal') || pathname.startsWith('/admin');

  if (isPortal) {
    return <main id="app">{children}</main>;
  }

  return (
    <>
      <Header />
      <main id="app">{children}</main>
      <Footer />
      <PortalModal />
      <WhatsAppButton />
    </>
  );
}
