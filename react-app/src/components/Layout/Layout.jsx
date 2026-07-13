import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Header from '../Header/Header';
import Footer from '../Footer/Footer';
import PortalModal from '../Portal/PortalModal';
import BackToTop from '../UI/BackToTop';

export default function Layout({ children }) {
  const { pathname } = useLocation();

  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);

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
      <BackToTop />
    </>
  );
}
